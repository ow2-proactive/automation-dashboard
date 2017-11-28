var pcaCtrl = angular.module('service-automation', ['ngResource', 'spring-data-rest', 'angular-toArrayFilter', 'oitozero.ngSweetAlert']);

function getSessionId() {
    return localStorage['pa.session'];
}

// ---------- Variables ----------

pcaCtrl
    .value('pcaServiceUrl', null)
    .value('schedulerRestUrl', null)
    .value('appCatalogWorkflowsUrl', null)
    .value('appCatalogBucketsUrl', null);

// ---------- Utilities ----------

pcaCtrl.filter('getByKey', function () {
    return function (propertyName, collection) {
        var len = collection.length;
        var value = '';
        for (var i = 0; i < len; i++) {
            if (collection[i].key == propertyName) {
                value = collection[i].value;
            }
        }
        return value;
    }
});

// ---------- Services ----------


pcaCtrl.factory('SchedulerService', function ($http, $rootScope, $state, SpringDataRestAdapter,
                                              LoadingPropertiesService, $interval) {

    var SchedulerServiceRefreshTime = 2000;

    var jobList = [];

    var nbPendingRequests = 0;
    var nbTotalProcesses = 0;
    var nbRunningProcesses = 0;

    function doLogin(userName, userPass) {
        var authData = $.param({'username': userName, 'password': userPass});
        var authConfig = {
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            transformResponse: []
        };
        // because of that wrong response type in that sched resource !!!
        return $http.post(JSON.parse(localStorage['schedulerRestUrl']) + 'login', authData, authConfig)
            .success(function (response) {
                if (response.match(/^[A-Za-z0-9_]+$/)) {
                    localStorage['pa.session'] = response;
                    console.log("SchedulerService.doLogin authentication succeed " + response);
                }
                else {
                    console.log("SchedulerService.doLogin authentication failed " + response);
                }
            })
            .error(function (response) {
                console.error('SchedulerService.doLogin authentification error', status, response);
            });
    }

    function getSchedulerService() {
        if (getSessionId() != undefined) {
            console.log("getSchedulerService while user connected with " + getSessionId());
            var scopeResponse;
            var scopeProcessedResponse;
            var jobsInfoConfig = {headers: {'sessionid': getSessionId()}};
            var schedulerRestUrl;
            try {
                schedulerRestUrl = JSON.parse(localStorage['schedulerRestUrl']);
            } catch(e) {
                schedulerRestUrl = localStorage['schedulerRestUrl']; // error in the above string (in this case, yes)!
            }

            console.log("SchedulerService.getSchedulerService http.get url : " + schedulerRestUrl + 'jobsinfo');
            console.log("SchedulerService.getSchedulerService http.get config : " + angular.toJson(jobsInfoConfig, true));

            var httpPromise = $http.get(schedulerRestUrl + 'jobsinfo', jobsInfoConfig)
                .success(function (response) {
                    console.log("SchedulerService.refreshSchedulerService $http.get success ");
                })
                .error(function (response) {
                    console.error("SchedulerService.getSchedulerService $http.get error", status, response);
                });

            SpringDataRestAdapter.process(httpPromise).then(function (processedResponse) {
                scopeProcessedResponse = angular.toJson(processedResponse, true);
                jobList = processedResponse.list;
                var pendingJobs = $.grep(jobList, function (n, i) {
                    return n.jobInfo.status === 'PENDING';
                });
                nbPendingRequests = pendingJobs.length;
                nbTotalProcesses = jobList.length;
                var runningJobs = $.grep(jobList, function (n, i) {
                    return n.jobInfo.status === 'RUNNING';
                });
                nbRunningProcesses = runningJobs.length;
                $rootScope.$broadcast('event:SchedulerService');
            });
        }
    }

    function refreshSchedulerService() {
        getSchedulerService();
        // Interval initialization
        var intervalPromise = $rootScope.$interval(getSchedulerService, SchedulerServiceRefreshTime);

        // Interval stopping condition
        $rootScope.$on('event:StopRefreshing', function () {
            console.log("event:StopRefreshing for refreshSchedulerService received");
            if (angular.isDefined(intervalPromise)) {
                $interval.cancel(intervalPromise);
                intervalPromise = undefined;
            }
        });
    }

    return {
        getJobList: function () {
            return jobList;
        },
        getNbPendingRequests: function () {
            return nbPendingRequests;
        },
        getNbTotalProcesses: function () {
            return nbTotalProcesses;
        },
        getNbRunningProcesses: function () {
            return nbRunningProcesses;
        },
        doLogin: function (userName, userPass) {
            return doLogin(userName, userPass);
        },
        isConnected: function () {
            return getSessionId() != undefined;
        },
        refreshSchedulerService: function () {
            return refreshSchedulerService();
        }
    };
});

pcaCtrl.factory('IaaSConnectorService', function ($rootScope, $http, SpringDataRestAdapter) {

    var IaaSConnectorUrl = '/connector-iaas/infrastructures/';
    var IaaSConnectorServiceRefreshTime = 2000;

    var nbRunningServices = 0;
    var runningServices;

    function refreshIaaSConnectorService() {
        var scopeResponse;
        var allServices = [];

        var httpPromise = $http.get(IaaSConnectorUrl)
            .success(function (response) {
                scopeResponse = angular.toJson(response, true);
            });
        SpringDataRestAdapter.process(httpPromise).then(function (processedResponse) {
            angular.forEach(processedResponse, function (infraValue, infraKey) {
                var instances;
                $http.get(IaaSConnectorUrl + infraKey + '/instances')
                    .success(function (responseInstances) {
                        instances = responseInstances;
                    })
                    .error(function (responseInstances) {
                        console.log('error while getting ' + IaaSConnectorUrl + infraKey + '/instances');
                        console.log(responseInstances);
                    })
                    .then(function () {
                        angular.forEach(instances, function (instanceValue, instanceKey) {
                            var instance = {};
                            instance.id = instanceValue.id;
                            instance.tag = instanceValue.tag;
                            instance.status = instanceValue.status;
                            instance.infra = infraKey;
                            allServices.push(instance);
                            nbRunningServices = allServices.length;
                        });
                    });
            });
            runningServices = allServices;
        });
        $rootScope.$broadcast('event:IaaSConnectorService');
    }

    return {
        getNbRunningServices: function () {
            return nbRunningServices;
        },
        getRunningServices: function () {
            return runningServices;
        }
    };
});

pcaCtrl.factory('PCACatalogService', function ($rootScope, $http, SpringDataRestAdapter, $interval) {

    var PCACatalogServiceUrl = JSON.parse(localStorage['pcaServiceUrl']) + 'catalog/services';
    var PCACatalogServiceRefreshTime = 2000;
    var servicesList = [];
    var nbServices = 0;

    function getPCACatalogService() {
        var sessionIdHeader = {headers: {'sessionid': getSessionId()}};
        var scopeResponse;

        console.log("PCACatalogService.getPCACatalogService http.get url : " + PCACatalogServiceUrl);

        var httpPromise = $http.get(PCACatalogServiceUrl, sessionIdHeader)
            .success(function (response) {
                servicesList = response;
                nbServices = response.length;
                $rootScope.$broadcast('event:PCACatalogService');
            })
            .error(function (response) {
                console.error("PCACatalogService.getPCACatalogService http.get error", status, response);
                $rootScope.$broadcast('event:PCACatalogService');
            });
    }

    function refreshPCACatalogService() {
        getPCACatalogService();
        // Interval initialization
        var intervalPromise = $rootScope.$interval(getPCACatalogService, PCACatalogServiceRefreshTime);

        // Interval stopping condition
            $rootScope.$on('event:StopRefreshing', function () {
            console.log("event:StopRefreshing for refreshPCACatalogService received");
            if (angular.isDefined(intervalPromise)) {
                $interval.cancel(intervalPromise);
                intervalPromise = undefined;
            }
        });
    }

    return {
        getServicesList: function () {
            return servicesList;
        },
        getNbServices: function () {
            return nbServices;
        },
        refreshPCACatalogService: function () {
            return refreshPCACatalogService();
        }
    };
});

pcaCtrl.factory('PCAProcessService', function ($rootScope, $http, $interval) {

    var PCAProcessServiceUrl = JSON.parse(localStorage['pcaServiceUrl']) + 'TO-BE-DETERMINED';
    var PCAProcessServiceRefreshTime = 2000;
    var processesList = {};

    function getPCAProcessService() {

        var scopeResponse;

        processesList = {
            'id-ABC': {
                'team': 'admin',
                'processName': 'create spark instance',
                'processStatus': 'RUNNING'
            },
            'id-DEF': {
                'team': 'paraita',
                'processName': 'create openstack instance',
                'processStatus': 'RUNNING'
            }
        };
        $rootScope.$broadcast('event:PCAProcessService');
    }

    function refreshPCAProcessService() {
        getPCAProcessService();
        // Interval initialization
        var intervalPromise = $rootScope.$interval(getPCAProcessService, PCAProcessServiceRefreshTime);

        // Interval stopping condition
        $rootScope.$on('event:StopRefreshing', function () {
            console.log("event:StopRefreshing for refreshPCAProcessService received");
            if (angular.isDefined(intervalPromise)) {
                $interval.cancel(intervalPromise);
                intervalPromise = undefined;
            }
        });
    }

    return {
        getProcessesList: function () {
            return processesList;
        },
        refreshPCAProcessService: function () {
            return refreshPCAProcessService;
        }
    };

});


pcaCtrl.factory('PCANodeSourcesService', function ($rootScope, $http, $interval) {

    var existingNodeSourceList = [];

    function getNodeSourceList(variable) {

        var req = {
            method: 'GET',
            url: JSON.parse(localStorage['pcaServiceUrl']) + 'rm/nodesources?field=sourceName',
            headers: {
                'content-type': 'application/json',
                'sessionid': getSessionId()
            }
        };
        $http(req)
            .success(function (response) {
                console.log(response);
		for(var i=0;i<response.length;i++){
                    existingNodeSourceList[i] = response[i]["sourceName"];
		}
            })
            .error(function (response) {
                console.log("error while getting getNodeSourceList !!!!!!!");
                console.log(response);
            })
            .then(function () {
                console.log();
            });
    }

    return {
        getExistingNodeSourceList: function () {
            return existingNodeSourceList;
        },
        getNodeSourceList: function () {
            return getNodeSourceList();
        }
    }


});


pcaCtrl.factory('PCARunningServicesService', function ($rootScope, $http, $interval) {

    var PCARunningServicesServiceUrl = JSON.parse(localStorage['pcaServiceUrl']) + 'serviceInstances';
    var PCARunningServicesServiceRefreshTime = 2000;
    var runningServicesList = {};
    var nbRunningServices = 0;
    var sessionIdHeader = {headers: {'sessionid': getSessionId()}};

    function getPCARunningServicesService() {

        console.log("PCARunningServicesService.getPCARunningServicesService http.get url : " + PCARunningServicesServiceUrl);

        $http.get(PCARunningServicesServiceUrl, sessionIdHeader)
            .success(function (response) {
                runningServicesList = response;
                var keys = Object.keys(runningServicesList);
                nbRunningServices = keys.length;
                console.log("PCARunningServicesService.getPCARunningServicesService http.get success " + angular.toJson(response, true));
                $rootScope.$broadcast('event:PCARunningServicesService');
            })
            .error(function (response) {
                console.error("PCARunningServicesService.getPCARunningServicesService http.get error", status, response);
            });

        $rootScope.$broadcast('event:PCARunningServicesService');
    }

    function refreshPCARunningServicesService() {
        getPCARunningServicesService();
        // Interval initialization
        var intervalPromise = $rootScope.$interval(getPCARunningServicesService, PCARunningServicesServiceRefreshTime);

        // Interval stopping condition
        $rootScope.$on('event:StopRefreshing', function () {
            console.log("event:StopRefreshing for refreshPCARunningServicesService received");
            if (angular.isDefined(intervalPromise)) {
                $interval.cancel(intervalPromise);
                intervalPromise = undefined;
            }
        });
    }

    return {
        getRunningServicesList: function () {
            return runningServicesList;
        },
        getPCARunningServicesServiceUrl: function () {
            return PCARunningServicesServiceUrl;
        },
        getNbRunningServices: function () {
            var keys = Object.keys(runningServicesList);
            return nbRunningServices;
        },
        refreshPCARunningServicesService: function () {
            return refreshPCARunningServicesService();
        }

    };
});


pcaCtrl.controller('SchedulerController', function ($scope, $rootScope, $http, SpringDataRestAdapter, SchedulerService) {

    $scope.jobsList = [];
    $scope.runnninjobList = [];
    $scope.pendingjobList = [];
    $scope.finishedjobList = [];




    $rootScope.$on('event:SchedulerService', function () {
        $scope.jobsList = SchedulerService.getJobList();
    });


    // function save to pc
    $scope.saveToPc = function (data, filename, jobid) {

        var jobsInfoConfig = {headers: {'sessionid': getSessionId()}};

        function setDownload(blob, filename){
            if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                window.navigator.msSaveOrOpenBlob(blob, filename);
            }
            else {
                var e = document.createEvent('MouseEvents'),
                    a = document.createElement('a');

                a.download = filename;
                a.href = window.URL.createObjectURL(blob);
                a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
                e.initEvent('click', true, false, window,
                    0, 0, 0, 0, 0, false, false, false, false, 0, null);
                a.dispatchEvent(e);
            }
        };


        var data = $http.get(JSON.parse(localStorage['schedulerRestUrl']) + 'jobs/' + jobid + '/result', jobsInfoConfig)
            .success(function (response) {
                console.log("SchedulerService.resultjobtask $http.get success " + angular.toJson(response, true));

                if (!data) {
                    console.error('No data');
                    return;
                }

                if (!filename) {
                    filename = 'Result_job_'+ jobid +'.txt';
                }

                if (typeof data === 'object') {
                    data = JSON.stringify(data, undefined, 2);
                }
                var blob = new Blob([data], {type: 'text/json'});
                // FOR IE:

                setDownload(blob, filename);
            })
            .error(function (response) {
                console.error("SchedulerService.resultjobtask $http.get error");
            });
    };

});

pcaCtrl.controller('MonitoringController', function ($scope, $rootScope, $http, SpringDataRestAdapter, SchedulerService, PCACatalogService, PCARunningServicesService) {

    $scope.nbPendingRequests = 0;
    $scope.nbTotalProcesses = 0;
    $scope.nbRunningServices = 0;
    $scope.nbRunningProcesses = 0;
    $scope.nbServices = 0;


    $rootScope.$on('event:SchedulerService', function () {
        console.log('event:SchedulerService');
        $scope.nbPendingRequests = SchedulerService.getNbPendingRequests();
        $scope.nbTotalProcesses = SchedulerService.getNbTotalProcesses();
        $scope.nbRunningProcesses = SchedulerService.getNbRunningProcesses();

    });

    $rootScope.$on('event:PCARunningServicesService', function () {
        console.log('event:PCARunningServicesService ' + PCARunningServicesService.getNbRunningServices());
        $scope.nbRunningServices = PCARunningServicesService.getNbRunningServices();
    });

    $rootScope.$on('event:PCACatalogService', function () {
        console.log('event:PCACatalogService ' + PCACatalogService.getNbServices());
        $scope.nbServices = PCACatalogService.getNbServices();
    });

});

pcaCtrl.controller('PCACatalogController', function ($scope, $rootScope, $uibModal, $http, $filter, PCACatalogService, PCANodeSourcesService) {

    $scope.servicesList = [];

    $scope.listOfNS = function () {
        console.log(PCANodeSourcesService.getExistingNodeSourceList());
        return PCANodeSourcesService.getExistingNodeSourceList();
    };

    $rootScope.$on('event:PCACatalogService', function () {
        $scope.servicesList = PCACatalogService.getServicesList();
        console.log('event:PCACatalogService');
        console.log('refreshing the servicesList for the view');
    });

    $scope.findImageUrl = function (selectedWorkflow) {
        var icon = $filter('getByKey')('pca.action.icon', selectedWorkflow.object_key_values);
        if (icon == "") {
            return "styles/patterns/img/wf-default-icon.png";
        }
        else {
            return icon;
        }
    };

    $scope.showSubmitWorkflowModal = function (selectedWorkflow) {
        var modalInstance = $uibModal.open({
            templateUrl: 'views/common/submit_window.html',
            controller: ModalViewSubmit,
            windowClass: "animated fadeIn",
            resolve: {
                workflowToSubmit: function () {
                    return selectedWorkflow;
                }
            }
        });
    };

    function ModalViewSubmit($scope, $uibModalInstance, SweetAlert, workflowToSubmit) {
        $scope.workflow = workflowToSubmit;

        $scope.ok = function (modifiedWorkflow) {
            $scope.submit(modifiedWorkflow);
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };

        $scope.submit = function (modifiedWorkflow) {
            var variables = {};
            angular.forEach(modifiedWorkflow.object_key_values, function (item) {
                if (item.value.startsWith('#{') || item.value.startsWith('${')) {
                    variables[item.key] = modifiedWorkflow.newvariables[item.key].value;
                } else {
                    variables[item.key] = item.value;
                }
            });
            var payloadParams = {
                'variables': variables,
                'genericInfo': {
                    'pca.service.model': $filter('getByKey')('pca.service.model', modifiedWorkflow.object_key_values),
                    'pca.service.name': $filter('getByKey')('pca.service.name', modifiedWorkflow.object_key_values)
                }
            };
            var configHeaders = {
                headers: {
                    'content-type': 'application/json',
                    'sessionid': getSessionId()
                }
            };

            var pcaServiceUrl = JSON.parse(localStorage['pcaServiceUrl']);

            console.log("ModalViewSubmit http.post url : " + pcaServiceUrl + 'serviceInstances');
            console.log("ModalViewSubmit http.post data " + angular.toJson(payloadParams, true));
            console.log("ModalViewSubmit http.post config " + angular.toJson(configHeaders, true));

            $http.post(pcaServiceUrl + 'serviceInstances', payloadParams, configHeaders)
                .success(function (response) {
                    console.log("ModalViewSubmit $http.post success");
                    $uibModalInstance.close();
                    SweetAlert.swal({
                        title: "Good job!",
                        text: "You created your service !",
                        type: "success"
                    });
                })
                .error(function (response) {
                    console.log("ModalViewSubmit $http.post error");
                    console.log(response);
                })
                .then(function () {
                    console.log();
                });
        };
    };


});

pcaCtrl.controller('PCAProcessController', function ($scope, $rootScope, PCAProcessService) {

    $scope.processesList = {};

    $rootScope.$on('event:PCAProcessService', function () {
        $scope.processesList = PCAProcessService.getProcessesList();
        console.log('event:PCAProcessService');
    });

});

pcaCtrl.controller('PCARunningServicesController', function ($scope, $rootScope, $http, SweetAlert, PCARunningServicesService) {

    $scope.runningServicesList = {};
    $scope.PCARunningServicesServiceUrl = PCARunningServicesService.getPCARunningServicesServiceUrl();

    $rootScope.$on('event:PCARunningServicesService', function () {
        $scope.runningServicesList = PCARunningServicesService.getRunningServicesList();
        console.log('event:PCARunningServicesService');
    });

    function deleteRunningService(serviceModel, instanceName, infrastructureName, serviceInstanceId, instanceId) {
        var payloadParams = {
            'genericInfo': {
                'pca.service.model': serviceModel
            },
            'variables': {
                'pca.instance.id': serviceInstanceId,
                'instance_name': instanceName,
                'infrastructure_name': infrastructureName
            }
        };
        var req = {
            method: 'DELETE',
            url: JSON.parse(localStorage['pcaServiceUrl']) + 'serviceInstances',
            headers: {
                'content-type': 'application/json',
                'sessionid': getSessionId()
            },
            data: payloadParams
        };
        console.log('payloadParam:');
        console.log(angular.toJson(payloadParams, true));
        console.log('req:');
        console.log(req);
        $http(req)
            .success(function (response) {
                console.log("submit OK !!!!!");
            })
            .error(function (response) {
                console.log("error while submitting variables !!!!!!!");
                console.log(response);
            })
            .then(function () {
                console.log();
            });
    };

    $scope.submitDeleteWithConfirmation = function (serviceModel, instanceName, infrastructureName, serviceInstanceId, instanceId) {

        SweetAlert.swal({
                title: "Are you sure?",
                text: "You are going to delete a service !",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Delete",
                cancelButtonText: "Cancel",
                closeOnConfirm: false,
                closeOnCancel: true
            },
            function (isConfirm) {
                if (isConfirm) {
                    deleteRunningService(serviceModel, instanceName, infrastructureName, serviceInstanceId, instanceId);
                    SweetAlert.swal("Deleted !", "That service won't bother you anymore", "success");
                }
            });
    };

});
