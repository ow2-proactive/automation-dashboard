/**
 * Created by ActiveEon team on 28/02/2017.
 */


var appCtrl = angular.module('app-rest', ['ngResource', 'spring-data-rest', 'angular-toArrayFilter', 'oitozero.ngSweetAlert', 'angular.filter']);


// ---------- Variables ----------


appCtrl
    .value('schedulerRestUrl', null)
    .value('appCatalogWorkflowsUrl', null);

// ---------- Utilities ----------

var getByKey = function(propertyLabel, propertyName, collection) {
    var len = collection.length;
    var value = '';
    for (var i = 0; i < len; i++) {
        if ((collection[i].label == propertyLabel) && (collection[i].key == propertyName)) {
            value = collection[i].value;
        }
    }
    return value;
};


// ------- Service ---------------


appCtrl.factory('APPCatalog', function ($http, $rootScope, $filter, SpringDataRestAdapter, $interval) {

    var APPCatalogRefreshTime = 2000;

    var workflowsMetadataList = [];
    var nbworkflows = 0;


    function loadAPPCatalogWorkflowData() {
        var appCatalog = JSON.parse(localStorage['appCatalogWorkflowsUrl']) + "?kind=workflow";
        console.log("APPCatalog.APPCatalog http.get url : " + appCatalog);
        var sessionIdHeader = {headers: {'sessionid': getSessionId()}};
        $http.get(appCatalog, sessionIdHeader)
            .success(function (response) {
                console.log("APPCAtalog.loadAPPCatalogWorkflowData http.get success ");
                if (angular.equals(workflowsMetadataList, response) == false || workflowsMetadataList == [] ) {
                    workflowsMetadataList = response.filter(filterServiceWorkflow);
                    //search project_name property
                    for (var index = 0; index < workflowsMetadataList.length; index++){
                        var workflow = workflowsMetadataList[index];
                        workflow.project_name = getByKey('job_information', 'project_name', workflow.object_key_values);
                    }
                    nbworkflows = workflowsMetadataList.length;
                    $rootScope.$broadcast('event:APPCatalogWorkflows');
                }
            })
            .error(function (response) {
                console.error("APPCatalog http.get workflows error", status, response);
            });

        $rootScope.$on('event:StopRefreshing', function () {workflowsMetadataList = []});
    }

    function filterServiceWorkflow(workflow){
        var service = workflow.object_key_values.find(function(obj_key_val){
            return obj_key_val.key == "pca.service.type";
        });
        return !service;
    }

    function refreshAPPCatalog() {

        loadAPPCatalogWorkflowData();

        // Interval initialization
        var intervalPromise = $rootScope.$interval(loadAPPCatalogWorkflowData, APPCatalogRefreshTime);


        // Interval stopping condition
        $rootScope.$on('event:StopRefreshing', function () {
            if (angular.isDefined(intervalPromise)) {
                $interval.cancel(intervalPromise);
                intervalPromise = undefined;
            }
        });
    }

    return {
        getworkflowsMetadataList: function () {
            return workflowsMetadataList;
        },
        getNbworkflows: function () {
            return nbworkflows;
        },
        getFilterServiceWorkflow: function () {
            return filterServiceWorkflow;
        },
        refreshAPPCatalog: function () {
            return refreshAPPCatalog();
        },
        refreshWorkflows: function () {
            return loadAPPCatalogWorkflowData();
        }
    };
});


pcaCtrl.factory('APPSchedulerService', function ($http, $rootScope, $state, SpringDataRestAdapter,
                                              LoadingPropertiesService, $interval) {

    var SchedulerServiceRefreshTime = 2000;

    var runningJobList = [];
    var pendingJobList = [];
    var finishedJobList = [];

    function doLogin(userName, userPass) {
        var authData = $.param({'username': userName, 'password': userPass});
        var authConfig = {
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            transformResponse: []
        };
        // because of that wrong response type in that sched resource !!!
        return $http.post(JSON.parse(localStorage['schedulerRestUrl']) + 'login', authData, authConfig)
            .success(function (response) {
                if (response.match(/^[A-Za-z0-9]+$/)) {
                    localStorage['pa.session'] = response;
                    console.log("SchedulerService.doLogin authentification succeed " + response);
                }
                else {
                    console.log("SchedulerService.doLogin authentification failed " + response);
                }
            })
            .error(function (response) {
                console.error('SchedulerService.doLogin authentification error', status, response);
            });
    }

    function getAPPSchedulerService() {
        if (getSessionId() != undefined) {
            console.log("getAPPSchedulerService while user connected with " + getSessionId());
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



            var httpPromise = $http.get(schedulerRestUrl + "revisionjobsinfo/?myjobs=false&pending=false&running=true&finished=false", jobsInfoConfig)
                .success(function (response) {
                    console.log("SchedulerService.refreshSchedulerService runningJobList $http.get success ");

                })
                .error(function (response) {
                    console.error("SchedulerService.getSchedulerService runningJobList $http.get error", status, response);
                });
            SpringDataRestAdapter.process(httpPromise).then(function (processedResponse) {
                scopeProcessedResponse = angular.toJson(processedResponse, true);
                runningJobList = Object.values(processedResponse.map)[0];
                $rootScope.$broadcast('event:APPSchedulerService');
            });

            var httpPromise = $http.get(schedulerRestUrl + "revisionjobsinfo/?myjobs=false&pending=true&running=false&finished=false", jobsInfoConfig)
                .success(function (response) {
                    console.log("SchedulerService.refreshSchedulerService pendingJobList $http.get success");

                })
                .error(function (response) {
                    console.error("SchedulerService.getSchedulerService pendingJobList $http.get error", status, response);
                });
            SpringDataRestAdapter.process(httpPromise).then(function (processedResponse) {
                scopeProcessedResponse = angular.toJson(processedResponse, true);
                pendingJobList = Object.values(processedResponse.map)[0];
                $rootScope.$broadcast('event:APPSchedulerService');
            });

            var httpPromise = $http.get(schedulerRestUrl + "revisionjobsinfo/?myjobs=false&pending=false&running=false&finished=true", jobsInfoConfig)
                .success(function (response) {
                    console.log("SchedulerService.refreshSchedulerService finishedJobList $http.get success ");

                })
                .error(function (response) {
                    console.error("SchedulerService.getSchedulerService finishedJobList $http.get error", status, response);
                });
            SpringDataRestAdapter.process(httpPromise).then(function (processedResponse) {
                scopeProcessedResponse = angular.toJson(processedResponse, true);
                finishedJobList = Object.values(processedResponse.map)[0];
                $rootScope.$broadcast('event:APPSchedulerService');
            });
        }

    }

    function refreshAPPSchedulerService() {
        getAPPSchedulerService();
        // Interval initialization
        var intervalPromise = $rootScope.$interval(getAPPSchedulerService, SchedulerServiceRefreshTime);

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
        doLogin: function (userName, userPass) {
            return doLogin(userName, userPass);
        },
        isConnected: function () {
            return getSessionId() != undefined;
        },
        refreshAPPSchedulerService: function () {
            return refreshAPPSchedulerService();
        },
        getRunningJobList: function (){
            return runningJobList;
        },
        getPendingJobList: function (){
            return pendingJobList;
        },
        getFinishedJobList: function (){
            return finishedJobList;
        }
    };
});



// ---------- Controllers ----------

appCtrl.controller('APPCatalogController', function ($scope, $rootScope, $uibModal, $http, $filter, APPCatalog, PCANodeSourcesService, $location, $q) {

    $scope.view = [];

    var schedulerRestUrl = JSON.parse(localStorage['schedulerRestUrl']);
    $scope.view = JSON.parse(localStorage['configViews']);
    loadBuckets();

    // get workflows list
    $rootScope.$on('event:APPCatalogWorkflows', function () {
        $scope.workflowsMetadataList = APPCatalog.getworkflowsMetadataList();
    });

    $scope.changeBucket = function(){
        localStorage['appCatalogWorkflowsUrl'] = angular.toJson($location.$$protocol + '://' + $location.$$host + ":" + $location.port() + "/catalog/buckets/" + $scope.selectedBucket.id + "/resources");
        APPCatalog.refreshWorkflows();
    };

    function loadBuckets(){
        var appCatalog = JSON.parse(localStorage['appCatalogBucketsUrl']);
        var sessionIdHeader = {headers: {'sessionid': getSessionId()}};
        $scope.bucketsMetadataList = [];
        $http.get(appCatalog, sessionIdHeader)
            .success(function (bucketList) {
                    getBucketsWithWorkflows(bucketList).then(function(results){
                        angular.forEach(results, function(result) {
                            //Buckets listed should have workflows after we filter them
                            var workflowListFiltered = result.workflowList.filter(APPCatalog.getFilterServiceWorkflow());
                            if (workflowListFiltered.length>0)
                                $scope.bucketsMetadataList.push(result.bucket);
                        });
                        defaultSelectedBucketId = parseInt($scope.view[0].catalog.bucketid);
                        $scope.selectedBucket = $scope.bucketsMetadataList.find(function(bucket){
                           return bucket.id == defaultSelectedBucketId;
                        });
                    });
            })
            .error(function (response) {
                console.error("loadbuckets : http.get buckets", status, response);
            });
    };

    function getBucketsWithWorkflows(bucketLists){
        var sessionIdHeader = {headers: {'sessionid': getSessionId()}};
        var promises = [];
        angular.forEach(bucketLists, function(bucket) {
            var urlWorkflows = $location.$$protocol + '://' + $location.$$host + ":" + $location.port() + "/catalog/buckets/" + bucket.id + "/resources?kind=workflow";
            var deffered  = $q.defer();
           $http.get(urlWorkflows, sessionIdHeader)
            .success(function (workflowList) {
                deffered.resolve({bucket : bucket, workflowList : workflowList});
            })
            .error(function (workflowList) {
                deffered.reject();
            });
            promises.push(deffered.promise);
        });
        return $q.all(promises);
    };

    $scope.appFindImageUrl = function (selectedWorkflow) {
        var icon = getByKey('generic_information', 'pca.action.icon', selectedWorkflow.object_key_values);
        if(icon == ""){
            return "styles/patterns/img/wf-default-icon.png";
        }
        else{
            return icon;
        }
    };


    // the click on WF icon or footer open a pop-up
    // this pop-up will be used to submit the WF and update, if applicable, the WF variables
    $scope.showSubmitWorkflowModal = function (selectedWorkflow) {
        var modalInstance = $uibModal.open({
            templateUrl: 'views/common/submit_window_app.html',
            controller: ModalViewSubmit,
            windowClass: "animated fadeIn",
            resolve: {
                workflowToSubmit: function () {
                    return selectedWorkflow;
                }
            }
        });
    };

    // function to transform the json into a string with the following format : key1=value1;key2=value2;
    // it is used to create the string character composing the path of the rest request
    // when the user update WF Variables before submitting a job
    // first we parse the json to get the following schema : key1=value1;....;key(n)=value(n);
    // then we remove the last ; to finally have : key1=value1;....;key(n)=value(n)
    function createPathStringFromWorkflowVariables(obj) {
        var result = "";
        for (var p in obj) {
            if( obj.hasOwnProperty(p) ) {
                result += p + "=" + encodeURIComponent(obj[p]) + ";";
            }
        }
        return result.substring(0, result.length-1);
    };


function extractVariablesFromModifiedWorkflow (modifiedWorkflow) {
    var variables = {};
        angular.forEach(modifiedWorkflow.object_key_values, function (item) {
            if (item.label == 'variable'){
                if (item.value.startsWith('#{')) {
                    variables[item.key] = modifiedWorkflow.variableAfterUpdate[item.key].value;
                } else {
                    variables[item.key] = item.value;
                }
            }
        });
    return variables;
    };


    function ModalViewSubmit($scope, $uibModalInstance, SweetAlert, workflowToSubmit) {
        $scope.workflow = workflowToSubmit;
        $scope.errorMessage = "";
        $scope.successMessage = "";

        // use : refers to the click on the button submit.
        $scope.ok = function (modifiedWorkflow) {
            $scope.submit(modifiedWorkflow);
        };

        // use : refers to the click on the button close
        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };

        // use : when clicking on the button submit
        $scope.submit = function (modifiedWorkflow) {

            // function used to get an object from a dropdown list (try, trydev, tryqa etc)
            const extractedVariables = extractVariablesFromModifiedWorkflow(modifiedWorkflow);

            // Creation of REST Parameters
            var path = createPathStringFromWorkflowVariables(extractedVariables);

            var payloadParams = {};

            var configHeaders = {
                headers: {
                    'link': JSON.parse(localStorage['appCatalogWorkflowsUrl']) + '/' + modifiedWorkflow.name + '/raw',
                    'sessionid': getSessionId()
                }
            };

            // function used to submit a job from url. in parameter : variables used to build the Rest request
            function submitJob(schedulerRestUrl, path, payloadParams, configHeaders) {
                $http.post(schedulerRestUrl + "jobs;" + path, payloadParams, configHeaders)
                    .success(function (response) {
                        $uibModalInstance.close();
                        SweetAlert.swal({
                            title: "Operation Successful!",
                            text: "Your Workflow has been submitted ! \nJob Id: " + JSON.stringify(response.id),
                            type: "success"
                        });
                    })
                    .error(function (response) {
                        SweetAlert.swal({
                            title: "Error..",
                            type: "error",
                            text: "An error occurred while submitting your workflow.\nPlease check you workflows and retry"
                        });
                    })
            };

            // Validate + Submit if applicable
            $http.post(schedulerRestUrl + "validateurl;" + path, payloadParams, configHeaders)
                .success(function (response) {
                    if (response.valid == true){
                        submitJob(schedulerRestUrl, path, payloadParams, configHeaders);
                    }
                    else {
                        $scope.errorMessage = response.errorMessage;
                    }
                })
                .error(function (response) {
                  SweetAlert.swal({
                      title: "Error..",
                      type: "error",
                      text: "An error occurred while validating your workflow\nPlease check the format of your values and retry"
                  });
                console.log("validate Rest request error");
                })
            };

        // use : When clicking on the button check
        $scope.check = function (modifiedWorkflow) {
            // step1 :
            // updating values if the users change the value of WF Variables

            // function used to get an object from a dropdown list (try, trydev, tryqa etc)
            const extractedVariables = extractVariablesFromModifiedWorkflow(modifiedWorkflow);

            // Creation of REST Parameters
            var path = createPathStringFromWorkflowVariables(extractedVariables);

            var payloadParams = {}

            var configHeaders = {
                headers: {
                    'link': JSON.parse(localStorage['appCatalogWorkflowsUrl']) + '/' + modifiedWorkflow.name + '/raw',
                    'sessionid': getSessionId()
                }
            };
            $http.post(schedulerRestUrl + "validateurl;" + path, payloadParams, configHeaders)
            // if the validate == false : we display an error message,  the updatevariables object is null
            // if validate == true : we will have the object update variables is applicable and then we display : Check success
                .success(function (response) {
                    if (response.valid == true){
                        // the following part is used to update the variables value from the response.UpdatedVariables object
                        var len = workflowToSubmit.object_key_values.length;
                        for (var i = 0; i < len; i++) {
                            var label = modifiedWorkflow.object_key_values[i].label;
                            var key = modifiedWorkflow.object_key_values[i].key;
                            var value = modifiedWorkflow.object_key_values[i].value;

                            if (label == 'variable'){
                                for (var p in response.updatedVariables) {
                                    if( response.updatedVariables.hasOwnProperty(p) ) {
                                        var updatedKey = p;
                                        var updatedValue = response.updatedVariables[p];

                                        if (key == updatedKey) {
                                            value = updatedValue;
                                            modifiedWorkflow.object_key_values[i].value = updatedValue;
                                        }
                                    }
                                }
                            }
                        }

                        $scope.successMessage = "Check success";
                        $scope.errorMessage = "";
                    }
                    else{
                        $scope.errorMessage = response.errorMessage;
                        $scope.successMessage = "";
                    }
                })
                .error(function (response) {
                  SweetAlert.swal({
                      title: "Error..",
                      type: "error",
                      text: "An error occurred while validating your workflow\nPlease check the format of your values and retry"
                  });
                  console.log("validate Rest request error");
                  console.log("link is : " + JSON.parse(localStorage['appCatalogWorkflowsUrl']) + '/' + modifiedWorkflow.name + '/raw');
                })

        };

    };
});


appCtrl.controller('APPSchedulerController', function ($scope, $rootScope, $http, SpringDataRestAdapter, APPSchedulerService) {

    $scope.runnninjobList = [];
    $scope.pendingjobList = [];
    $scope.finishedjobList = [];

    $rootScope.$on('event:APPSchedulerService', function () {
        $scope.runningjobList = APPSchedulerService.getRunningJobList();
        $scope.pendingjobList = APPSchedulerService.getPendingJobList();
        $scope.finishedjobList = APPSchedulerService.getFinishedJobList();
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


pcaCtrl.controller('APPMonitoringController', function ($scope, $rootScope, $http, SpringDataRestAdapter, APPSchedulerService) {

    $scope.nbTotalJobs = 0;
    $scope.nbRunningJobs = 0;
    $scope.totalNumberOfRunningTasksInAllRunningJobs = 0;
    $scope.totalNumberOfPendingTasksInAllRunningJobs = 0;
    $scope.totalNumberOfPendingTasksInAllPendingJobs = 0;
    $scope.totalNumberOfFinishedTasksInAllFinishedJobs = 0;
    $scope.totalNumberOfFinishedTasksInAllPendingJobs = 0;
    $scope.totalNumberOfFinishedTasksInAllRunningJobs = 0;


    function nbTasksbyStatus(jobList, status){
        var nbTask = 0;
        for(var i=0, l=jobList.length; i<l; i++){
            nbTask = jobList[i].jobInfo[status] + nbTask;
        }
        return nbTask;
    }



    $rootScope.$on('event:APPSchedulerService', function () {
        console.log('event:APPSchedulerService');
        $scope.nbTotalJobs = APPSchedulerService.getFinishedJobList().length + APPSchedulerService.getPendingJobList().length + APPSchedulerService.getRunningJobList().length;
        $scope.nbRunningJobs = APPSchedulerService.getRunningJobList().length;
        $scope.totalNumberOfRunningTasksInAllRunningJobs = nbTasksbyStatus(APPSchedulerService.getRunningJobList(), 'numberOfRunningTasks');
        $scope.totalNumberOfPendingTasksInAllRunningJobs = nbTasksbyStatus(APPSchedulerService.getRunningJobList(), 'numberOfPendingTasks');
        $scope.totalNumberOfPendingTasksInAllPendingJobs = nbTasksbyStatus(APPSchedulerService.getPendingJobList(), 'numberOfPendingTasks');
        $scope.totalNumberOfFinishedTasksInAllFinishedJobs = nbTasksbyStatus(APPSchedulerService.getFinishedJobList(), 'numberOfFinishedTasks');
        $scope.totalNumberOfFinishedTasksInAllPendingJobs = nbTasksbyStatus(APPSchedulerService.getPendingJobList(), 'numberOfFinishedTasks');
        $scope.totalNumberOfFinishedTasksInAllRunningJobs = nbTasksbyStatus(APPSchedulerService.getRunningJobList(), 'numberOfFinishedTasks');


    });
});
