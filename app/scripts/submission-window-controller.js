angular.module('main').controller('SubmitViewController', function ($scope, $stateParams, $http, $rootScope, UtilsFactory) {
    // This flag will distinguish between the external view and the internal view
    $scope.isNotClosable = true;
    $scope.statusCode = '';
    // extract workflow name and bucket name
    const bucketName = $stateParams.bucket;
    const workflowName = $stateParams.name;

    // If the workflow name and bucket name are provided, we jump to the vars edition view
    if ((bucketName && workflowName) && (!bucketName.includes('%') && !workflowName.includes('%'))) {
        var encodedName = encodeURIComponent(workflowName);
        const sessionId = localStorage['pa.session'];
        var catalogUrl = JSON.parse(localStorage.catalogServiceUrl);
        if (sessionId !== undefined) {
            var url = catalogUrl + 'buckets/' + bucketName + '/resources/' + encodedName;
            $http.get(url, {
                headers: {
                    'sessionID': getSessionId()
                }
            })
                .success(function (response) {
                    $scope.workflowToSubmit = {
                        variables: UtilsFactory.extractVariables(response),
                        icon: UtilsFactory.getWorkflowMetadata(response, 'generic_information', 'workflow.icon'),
                        projectName: response.project_name,
                        kind: response.kind,
                        bucketName: UtilsFactory.getWorkflowMetadata(response, 'generic_information', 'bucketName'),
                        documentation: UtilsFactory.getWorkflowMetadata(response, 'generic_information', 'Documentation'),
                        description: UtilsFactory.getWorkflowMetadata(response, 'General', 'description'),
                        name: response.name,
                        commitTime: response.commit_time,
                        userName: response.username,
                        submissionMode: 'catalog'
                    }

                    $scope.tabs = [
                        {
                            title: UtilsFactory.translate('Submit'),
                            url: '/automation-dashboard/views/common/workflow-info.html',
                            disabled: !$scope.workflowToSubmit
                        }
                    ]

                    $scope.variablesTemplateFooterButtonInfo = [
                        {
                            label: 'Submit',
                            title: UtilsFactory.translate('Submit'),
                            className: 'btn btn-primary m-r-xs text-white',
                            hasSpinner: true
                        },
                        {
                            label: 'Start at Date & Time',
                            isToggle: true,
                            title: UtilsFactory.translate('Start at Date & Time'),
                            className: 'btn btn-default m-r-xs'
                        },
                        {
                            label: 'Check',
                            title: UtilsFactory.translate('Check'),
                            className: 'btn btn-default m-r-xs'
                        }
                    ]
                })
                .error(function (response) {
                    $scope.statusCode = response.httpErrorCode;
                    $scope.currentURL = window.location.href;
                    console.error('Error while querying catalog service on URL ' + url + ': ' + response.status_code + ' - ' + response.error_message);
                });
        }
    } else {
        $scope.bucketName = bucketName;
        $scope.workflowName = workflowName;
        $scope.tabs = [
            {
                title: UtilsFactory.translate('Select Workflow'),
                url: '/automation-dashboard/views/common/catalog-view.html'
            },
            {
                title: UtilsFactory.translate('Submit'),
                url: '/automation-dashboard/views/common/workflow-info.html'
            }
        ]

        $scope.variablesTemplateFooterButtonInfo = [
            {
                label: 'Submit',
                title: UtilsFactory.translate('Submit'),
                className: 'btn btn-primary m-r-xs text-white',
                hasSpinner: false
            },
            {
                label: 'Start at Date & Time',
                isToggle: true,
                title: UtilsFactory.translate('Start at Date & Time'),
                className: 'btn btn-default m-r-xs'
            },
            {
                label: 'Check',
                title: UtilsFactory.translate('Check'),
                className: 'btn btn-default m-r-xs'
            },
            {
                label: 'Previous',
                title: UtilsFactory.translate('Previous'),
                className: 'btn btn-default m-r-xs',
                hasSpinner: false
            }
        ]
    }

})