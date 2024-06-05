/*Catalog view controller: buckets and objects list*/

angular.module('main').controller('CatalogViewController', function ($scope, $rootScope, $uibModal, $http, $filter, $translate, $timeout, $sce, toaster, WECatalogService, UtilsFactory) {

    this.$onInit = function () {
        // Filter objects by workflowNameQuery
        $scope.workflowNameQuery = '';
        $scope.selectedWorkflow = $scope.$parent.$parent.$parent.$parent.$parent.$parent.workflowToSubmit;

        $scope.filterBucketsByBucketName = $scope.$parent.$parent.$parent.$parent.$parent.$parent.bucketName;
        $scope.filterWorkflowsByWorkflowName = $scope.$parent.$parent.$parent.$parent.$parent.$parent.workflowName;
        // Fetch defaults or cached values
        $scope.WEUserPreferences = UtilsFactory.loadUserPreferences();
        $scope.selectedBucketName = UtilsFactory.getUserPreference('submissionView.selectedBucketName');
        $scope.orderByColumnConfig = UtilsFactory.getUserPreference('submissionView.orderByColumnConfig.workflows');
        $scope.OrderByBucketNameConfig = UtilsFactory.getUserPreference('submissionView.orderByColumnConfig.buckets');
        $scope.toggleListBox = UtilsFactory.getUserPreference('submissionView.toggleListBox');
        // request helper flags
        $scope.isBucketsLoading = true;
        $scope.isObjectsLoading = false;
        // Load the template and then fetch the buckets list
        $timeout(function () {
            loadBuckets();
        }, 500)
    };

    /**
     * get workflows list from server
     **/

    function updateWorkflowsMetadataList() {
        $scope.isObjectsLoading = true;
        const kind = $scope.showPSAWorkflowsOnly ? 'Workflow/psa' : 'Workflow/standard';
        const  filterByName = $scope.workflowNameQuery ? $scope.workflowNameQuery : ($scope.filterWorkflowsByWorkflowName ? $scope.filterWorkflowsByWorkflowName : "");
        WECatalogService.getWorkflowsMetadataList(filterByName, $scope.selectedBucket.name, kind).then(function (response) {
            $scope.workflowsMetadataList = response;
            $timeout(function () {
                $scope.isObjectsLoading = false;
            }, 500)
            $scope.workflowsMetadataList.forEach(function (catalogObject) {
                for (var metadataIndex = 0; metadataIndex < catalogObject.object_key_values.length; metadataIndex++) {
                    var label = catalogObject.object_key_values[metadataIndex].label;
                    var key = catalogObject.object_key_values[metadataIndex].key;
                    var value = catalogObject.object_key_values[metadataIndex].value;
                    if (label === 'job_information' && key === 'visualization') {
                        catalogObject.visualization = $sce.trustAsHtml(value);
                    }
                }
            })
        });
    }

    /**
     * select a wf
     **/
    $scope.getWorkflowPanelStatus = function (workflow) {
        if ($scope.selectedWorkflow && workflow.name === $scope.selectedWorkflow.name) {
            return 'panel-selected';
        } else {
            return 'panel-default';
        }
    }

    /**
     * select a workflow and change the current tab
     **/
    $scope.selectWorkflow = function (workflow) {
        $scope.$parent.$parent.$parent.$parent.$parent.$parent.workflowToSubmit = {
            variables: UtilsFactory.extractVariables(workflow),
            icon: UtilsFactory.getWorkflowMetadata(workflow, 'generic_information', 'workflow.icon'),
            projectName: workflow.project_name,
            kind: workflow.kind,
            bucketName: UtilsFactory.getWorkflowMetadata(workflow, 'generic_information', 'bucketName'),
            documentation: UtilsFactory.getWorkflowMetadata(workflow, 'generic_information', 'Documentation'),
            description: UtilsFactory.getWorkflowMetadata(workflow, 'General', 'description'),
            name: workflow.name,
            commitTime: workflow.commit_time,
            userName: workflow.username,
            submissionMode: workflow.submissionMode
        }
        $scope.selectedWorkflow = $scope.$parent.$parent.$parent.$parent.$parent.$parent.workflowToSubmit;
        // go to Submit tab
        $scope.$parent.$parent.$parent.$parent.$parent.$parent.activeTab.value = 1;
    }

    $scope.changeBucket = function (bucket) {
        $scope.selectedBucket = bucket;
        if (!$scope.showPSAWorkflowsOnly){
            UtilsFactory.setUserPreference('submissionView.selectedBucketName', $scope.selectedBucket.name);
        }
        updateWorkflowsMetadataList();
    };

    /**
     * load all buckets with at least one workflow from server
     **/
    function loadBuckets() {
        const appCatalog = JSON.parse(localStorage.appCatalogBucketsUrl);
        const sessionIdHeader = {
            headers: {'sessionid': getSessionId()},
            params: {
                'kind': $scope.showPSAWorkflowsOnly ? 'Workflow/psa' : 'Workflow/standard',
                'objectName': $scope.workflowNameQuery ? $scope.workflowNameQuery : ($scope.filterWorkflowsByWorkflowName ? $scope.filterWorkflowsByWorkflowName : ""),
                bucketName: $scope.filterBucketsByBucketName ? $scope.filterBucketsByBucketName : ""
            }
        };
        $scope.isBucketsLoading = true;
        $scope.bucketsMetadataList = [];
        $http.get(appCatalog, sessionIdHeader)
            .success(function (bucketList) {
                $scope.bucketsMetadataList = bucketList;
                // No empty bucket should appear for no empty workflowNameQuery
                if ( $scope.workflowNameQuery || $scope.filterWorkflowsByWorkflowName ) {
                    $scope.bucketsMetadataList = $scope.bucketsMetadataList.filter(function (bucket) {
                        return bucket.objectCount;
                    });
                }
                /**
                 * In the case where the buckets list is not empty, we select the first bucket if the selected bucket is not in cache or no longer exist
                 * Fetch objects of the selected bucket
                 * Otherwise, objectList should be empty
                 **/
                if ($scope.bucketsMetadataList.length) {
                    const selectedBucketIndex = $scope.bucketsMetadataList.findIndex(function (bucket) {
                        return bucket.name === $scope.selectedBucketName;
                    });
                    if (!$scope.selectedBucketName || selectedBucketIndex === -1) {
                        $scope.selectedBucket = $scope.bucketsMetadataList[0];
                        if (!$scope.showPSAWorkflowsOnly){
                            UtilsFactory.setUserPreference('submissionView.selectedBucketName', $scope.selectedBucket.name);
                        }
                    } else {
                        $scope.selectedBucket = $scope.bucketsMetadataList[selectedBucketIndex];
                        $scope.scrollToBucket();
                    }
                    updateWorkflowsMetadataList();
                } else {
                    $scope.workflowsMetadataList = [];

                }
                $scope.isBucketsLoading = false;
            })
            .error(function (response) {
                console.error('loadbuckets : http.get buckets: ' + response);
            });
    }

    $scope.scrollToBucket = function () {
        $timeout(function () {
            if ($('#bucket' + $scope.selectedBucket.name).position()) {
                var scrollToVal = $('#buckets-scroll-area').scrollTop() + $('#bucket' + $scope.selectedBucket.name).position().top - 5;
                $('#buckets-scroll-area').scrollTop(scrollToVal);
            }
        }, 500);
    }

    $scope.filterObjectByObjectName = function (workflowNameQuery) {
        $scope.workflowNameQuery = workflowNameQuery
        $scope.selectedBucketName = UtilsFactory.getUserPreference('submissionView.selectedBucketName')
        loadBuckets();
    }

    $scope.hideEmptyObject = function (bucket){
        return bucket.objectCount > 0;
    }

    $scope.findImageUrl = function (selectedWorkflow) {
        var icon = UtilsFactory.getByKey('generic_information', 'workflow.icon', selectedWorkflow.object_key_values);
        return icon === '' ? 'styles/patterns/img/wf-icons/wf-default-icon.png' : UtilsFactory.getProxyNames() + icon
    };

    $scope.getImageUrlWithProxy = function(url) {
        return UtilsFactory.getProxyNames() + url;
    }

    /**
     * This function allows sorting buckets list and workflow lists
     **/
    $scope.orderByColumn = function (column, config, propertyName) {
        config.order = (config.column !== column) ? 'd' : config.order === 'a' ? 'd' : 'a';
        config.comparatorLogic = (config.column !== column) ? '+' + column : config.order === 'd' ? '+' + column : '-' + column;
        config.column = column;
        UtilsFactory.setUserPreference(propertyName, config);
    }

    $scope.getSortClasses = function (sortParameters, column) {
        return UtilsFactory.getSortClasses(sortParameters, column)
    }
    $scope.toggleDisplay = function () {
        UtilsFactory.setUserPreference('submissionView.toggleListBox', $scope.toggleListBox);
    }

    $scope.filterCreationWorkflows = function (workflow) {
        if (workflow.kind.toLowerCase().includes('workflow/standard')) {
            return true
        }
        return UtilsFactory.getWorkflowMetadata(workflow, 'generic_information', 'pca.states') && UtilsFactory.getWorkflowMetadata(workflow, 'generic_information', 'pca.states').includes('VOID');
    };

    $scope.getObjectDescription = function (object){
        return UtilsFactory.getWorkflowMetadata(object, 'General', 'description')
    }

    // Close the window if ESC key pressed
    $(document).keydown(function (e) {
        // ESCAPE key pressed
        if (e.keyCode === 27 && $scope.isJobSubmissionPanelOpen) {
            $scope.toggleOpenSubmitJobPanel(false);
        }
    })

});