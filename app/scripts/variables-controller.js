/*Workflow variables controller: submission template*/

angular.module('main').controller('VariablesController', function ($scope, $uibModal, $http, $translate, $timeout, $sce, $rootScope, $location, toaster , PCAService, UtilsFactory,
 WESchedulerService, WEUtilsFactory) {
    this.$onInit = function () {
        $scope.workflow =
            $scope.$parent.$parent.$parent.$parent.$parent.$parent.workflowToSubmit;

        // internal or extern window
        $scope.isWindowClosable = $scope.$parent.$parent.$parent.$parent.$parent.$parent
                                    .isNotClosable;
        // toast config
        $scope.toasterConfig = {closeButton: true, progressBar: true};
        const variablesTemplateFooterButtonInfo =
            $scope.$parent.$parent.$parent.$parent.$parent.$parent
                .variablesTemplateFooterButtonInfo;

        // helper flag for workflow valid message
        $scope.WEsubmissionErrorMessage = '';
        $scope.successMessage = '';
        // fetch resolvedModel from the server: update variables
        if ($scope.workflow.jobId) {
            validateJob()
        } else {
            validateWorkflow(function (response) {
                updateVariables(response);
                UtilsFactory.replaceVariableModelsIfNeeded($scope.workflow.variables);
            })
        }

        /**
         * footer button actions: functions that will be called when user clicks
         **/
        $scope.footerActions = {
            Submit: submit,
            "Start at Date & Time":function (){
                $scope.isStartAtToggled=!$scope.isStartAtToggled
            },
            Launch: submit,
            'Execute Action': submitServicesAndAction,
            Resubmit: function () {
                reSubmitJob($scope.workflow.id, $scope.workflow.variables);
            },
            'Kill & Re-Submit': function () {
                killResubmitJob($scope.workflow.id, $scope.workflow.variables);
            },
            'Confirm Association': createNewCdWfAssociation,
            'Schedule Workflow': scheduleWf,
            'Update': updateCdWfAssociation,
            Previous: previous,
            Check: check,
            Cancel: function () {
                $scope.$parent.toggleOpenSubmitJobPanel(false);
            },
            Close: function () {
                window.close();
            }
        };
        // footer section
        $scope.footerTemplate = variablesTemplateFooterButtonInfo.map(function (item) {
            item.action = $scope.footerActions[item.label];
            return item;
        });
        // helper flag for loading button
        $scope.isSubmissionGoingOn = false;
        //psa workflow label
        $scope.pcaWorkflowLabel = '';
        // show advanced variables
        $scope.advancedVariables = false;

        $scope.format = "DD/MM/YYYY HH:mm";
        $scope.isStartAtToggled = false;
        $scope.startAt = "";
        $scope.startAtFormatted = "";

        $scope.descriptionLimit = 200;
    };

    $scope.documentationUrlWfa = function (url) {
        return url.startsWith('http') ? url : JSON.parse(localStorage.appUrl).concat('/doc/', url);
    }

    $scope.isTextAreaModel = function (variable) {
        return UtilsFactory.isTextAreaModel(variable)
    }

    $scope.isSpecialUIModel = function (variable) {
        return UtilsFactory.isSpecialUIModel(variable);
    };

    // submit services or action
    const submitServicesAndAction = function () {
        $scope.isSubmissionGoingOn = true;
        const bucketName = $scope.workflow['bucketName'];
        validateWorkflow(function (response) {
            if (response.valid === true) {
                /*
                * There are two cases : submit wf or submit action
                */
                const variables = UtilsFactory.parseEmptyVariablesValue(UtilsFactory.getVariablesInKeyValueFormat($scope.workflow.variables));
                UtilsFactory.getVariablesInKeyValueFormat($scope.workflow.variables);
                if ($scope.workflow.hasOwnProperty('isCreationWorkflow') && !$scope.workflow.isCreationWorkflow) {
                    var httpPromise = PCAService.submitActionWorkflow($scope.workflow.serviceInstance.instance_id, bucketName, $scope.workflow.name, variables);
                    httpPromise.then(function (response) {

                        const obj = response.data.job_submissions.find(function(job){
                            return job.hasOwnProperty('job_id')
                        });
                        const id = obj.job_id;
                        const instanceId = response.data.instance_id;

                        const text = UtilsFactory.translate('The service instance has been executed') + ', instance_id: ' + instanceId + ', jobId: ' + id;
                        openDetailsView(id, text);

                        $rootScope.$broadcast('event:updateServiceInstanceList');
                        $rootScope.$broadcast('event:updateWorkflowsGroupedByInstance');
                        $scope.isLoading = false;
                        //close the Submit Workflow Panel
                        $scope.$parent.toggleOpenSubmitJobPanel(false);
                    }).catch(function (error) {
                        console.error('Error while executing workflow on instance ' + $scope.workflow.serviceInstance.instance_id + ': ' + angular.toJson(error));
                        UtilsFactory.displayTranslatedErrorMessage('Error', ['The action couldn\'t be executed:', error.data.httpErrorCode + ' - ' + error.data.errorMessage]);
                        $scope.isLoading = false;
                    });
                } else {
                    var httpPromise = PCAService.submitCreationWorkflow($scope.workflow.bucketName, $scope.workflow.name, variables, $scope.pcaWorkflowLabel, $scope.isStartAtToggled?$scope.startAt.toISOString():false);
                    httpPromise.then(function (response) {
                        const obj = response.data.job_submissions.find(function(job){
                            return job.hasOwnProperty('job_id')
                        });
                        const id = obj.job_id;
                        const instanceId = response.data.instance_id;

                        const text = UtilsFactory.translate('The service instance has been created') + ', instance_id: ' + instanceId + ', jobId: ' + id;
                        openDetailsView(id, text);
                        //close the Submit Workflow Panel
                        $scope.$parent.toggleOpenSubmitJobPanel(false);
                    }).catch(function (error) {
                        console.error('Error while submitting service: ' + angular.toJson(error));
                        toaster.error('Error', ['The service instance couldn\'t be created:', error.data.httpErrorCode + ' - ' + error.data.errorMessage]);
                    });
                }
            } else {
                $scope.WEsubmissionErrorMessage = response.errorMessage;
                $scope.successMessage = '';
            }
        })
    }
    // use : when clicking on the button submit
    const submit = function () {
        $scope.isSubmissionGoingOn = true;
        const bucketName = $scope.workflow['bucketName'];
        // launch a PSA workflow
        if ($scope.workflow.kind.toLowerCase().includes('workflow/psa')) {
            submitServicesAndAction($scope.isStartAtToggled?$scope.startAt.toISOString():false);
            return;
        }
        // Validate + Submit if applicable
        validateWorkflow(function (response) {
            if (response.valid === true) {
                UtilsFactory.submitJob(bucketName, $scope.workflow.name, $scope.workflow.variables, $scope.workflow.submissionMode,$scope.isStartAtToggled?$scope.startAt.toISOString():false)
                    .success(function (submitResponse) {
                        if(!$scope.isWindowClosable) {
                            //close the Submit Workflow Panel
                            $scope.$parent.toggleOpenSubmitJobPanel(false);
                            $scope.isSubmissionGoingOn = false;
                            if( $scope.workflow.submissionMode !== "workflow-execution" ) {
                                toaster.pop('success', "", UtilsFactory.translate('Your Workflow has been submitted successfully') + ' , Job Id:'+ JSON.stringify(submitResponse.id) + '<br>' +
                                        '<a href="' +  UtilsFactory.getProxyNames() + '/automation-dashboard/#/workflow-execution" target="_blank">' + UtilsFactory.translate('Open Job in Workflow Execution Portal') + '</a></br>' +
                                        '<a href="javascript:void(0);" onclick="window.open(\'#/job-info?jobid=' + submitResponse.id + '&tab=0\', \'job-info-' + submitResponse.id +
                                            '\', \'toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,directories=no,status=no\')" target="_blank">' + UtilsFactory.translate('Open Job Details in a New Popup Window') + '</a></br>' +
                                        '<a href="' + UtilsFactory.getProxyNames() + '/scheduler/" target="_blank">' + UtilsFactory.translate('Open Job in Scheduler Portal') + '</a>', 5000, 'trustedHtml');
                            } else {
                                toaster.pop('success',"", UtilsFactory.translate('Your Workflow has been submitted successfully') + ', Job Id: ' + JSON.stringify(submitResponse.id), 5000, 'trustedHtml');
                            }
                        } else {
                            // remove buttons
                            $scope.footerTemplate = $scope.footerTemplate.filter(function(btn){
                                return btn.name === 'Submit' || btn.name === 'Check' || btn.name === 'Previous'
                            })

                            // display job details
                            $scope.footerTemplate.push ({
                                className: "btn btn-info text-white",
                                hasSpinner: false,
                                label: "See Job Details",
                                title: "See Job Details",
                                action: function () {
                                    window.open('#/job-info?jobid=' + submitResponse.id + '&tab=0',
                                                'job-info-' + submitResponse.id,
                                                'toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,directories=no,status=no');
                                }
                            })
                        }

                        $scope.successMessage = 'Your Workflow has been submitted successfully' + ', Job Id: ' + JSON.stringify(submitResponse.id);
                        // disable editing vars
                        $scope.disabledEditVars = true;
                    })
                    .error(function (error) {
                        $scope.WEsubmissionErrorMessage = error.errorMessage;
                        $scope.isSubmissionGoingOn = false;
                        toaster.error('An error occurred while submitting your workflow.' + '\n' + 'Please check you workflows and retry')
                    })
            } else {
                $scope.WEsubmissionErrorMessage = response.errorMessage;
                $scope.isSubmissionGoingOn = false;
                $scope.successMessage = '';
            }
        })
    };

    // create new association
    function createNewCdWfAssociation() {
        $scope.isSubmissionGoingOn = true;
        const bucketName = $scope.workflow['bucketName'];
        // Validate + create association if applicable
        validateWorkflow(function (response) {
            if (response.valid) {
                // the values of pa:hidden variables shouldn't be decrypted in Workflow Description
                encryptValues(response)
                // create association
                $scope.$parent.createAssociation($scope.workflow.name, bucketName, $scope.workflow.variables)
                    .success(function (res) {
                        $rootScope.$broadcast('event:updatePlannedJobsCount', res.id);
                        $scope.desectWorkflowInModal();
                        $scope.toggleOpenSubmitJobPanel(false);
                        displaySuccessMessage('New association successfully created');
                    })
                    .error(function (res) {
                        $scope.isSubmissionGoingOn = false
                        $scope.errorMessage = res.errorMessage;
                        console.error('Error while creating calendar workflow association ' + ':', angular.toJson(res));
                    });
            } else {
                $scope.isSubmissionGoingOn = false
                $scope.WEsubmissionErrorMessage = response.errorMessage;
                $scope.successMessage = '';
            }
        })
    }

    function scheduleWf() {
        $scope.isSubmissionGoingOn = true;
        $scope.isSubmissionGoingOn = true;
        const bucketName = $scope.workflow['bucketName'];
        // Validate + create association if applicable
        validateWorkflow(function (response) {
            if (response.valid) {
                // the values of pa:hidden variables shouldn't be decrypted in Workflow Description
                encryptValues(response)
                // create association
                var workflowVariables = constructVariablesObject( $scope.workflow.variables );
                var workflowVariables = UtilsFactory.parseEmptyVariablesValue(workflowVariables)
                var newCdWf = {
                    'calendar_bucket': $scope.workflow.calendar_bucket,
                    'calendar_name': $scope.workflow.calendar_name,
                    'workflow_bucket': $scope.workflow['bucketName'],
                    'workflow_name': $scope.workflow.name,
                    'variables': workflowVariables
                };

                var configHeaders = {
                    headers: {
                        'Content-Type': 'application/json',
                        'sessionid': getSessionId()
                    }
                };

                var data = JSON.stringify(newCdWf);
                var url = JSON.parse(localStorage.jobPlannerServiceUrl) + 'planned_jobs/';

                $http.post(url, data, configHeaders)
                    .success(function (res) {
                        $scope.toggleOpenSubmitJobPanel(false);
                        $scope.updateCurrentSelectedObjet();
                        displaySuccessMessage('New association successfully created');
                    })
                    .error(function (res) {
                        $scope.isSubmissionGoingOn = false
                        $scope.errorMessage = res.errorMessage;
                        console.error('Error while creating calendar workflow association ' + ':', angular.toJson(res));
                    });
            } else {
                $scope.isSubmissionGoingOn = false
                $scope.WEsubmissionErrorMessage = response.errorMessage;
                $scope.successMessage = '';
            }
        })
    }

    function updateCdWfAssociation() {
        $scope.isSubmissionGoingOn = true;
        $scope.workflowVariables = UtilsFactory.parseEmptyVariablesValue($scope.workflow.variables);
        // check if association is valid
        validateWorkflow(function (response) {
            if (response.valid === true) {
                // the values of pa:hidden variables shouldn't be decrypted in Workflow Description
                encryptValues(response)
                // Check Successful - proceed to edit
                $scope.$parent.updateCdWfAssociation($scope.workflow.variables)
                    .success(function (res) {
                        displaySuccessMessage('Association successfully updated');
                        $scope.updateLastSelectedWorkflow();
                        $scope.isSubmissionGoingOn = false;
                        $scope.toggleOpenSubmitJobPanel(false);
                    })
                    .error(function (res) {
                        console.error('Error while updating calendar workflow association ' + ':', angular.toJson(res));
                        $scope.WEsubmissionErrorMessage = res.errorMessage;
                        $scope.successMessage = '';
                        $scope.resetSelectedWorkflowVariableValues();
                    });
            } else {
                $scope.isSubmissionGoingOn = false;
                $scope.WEsubmissionErrorMessage = response.errorMessage;
                $scope.successMessage = '';
                console.error('Error while updating the association : ' + angular.toJson(response));
                $scope.resetSelectedWorkflowVariableValues();
            }
        })
    }

    // decrypt pa:hidden value
    function encryptValues(response) {
        angular.forEach($scope.workflow.variables, function (variable) {
            if (response.updatedModels[variable.name] && response.updatedModels[variable.name].toLowerCase() === 'pa:hidden') {
                variable.value = response.updatedVariables[variable.name];
            }
        })
    }

    // construct the variables object following this format: {"key":"value", ... }
    function constructVariablesObject(variables) {
        var workflowVariables = {};
        if (Array.isArray(variables)) {
            for (var i = 0; i < variables.length; i++) {
                workflowVariables[variables[i].name] = variables[i].value;
            }
        } else {
            for (var i = 0; i < Object.keys(variables).length; i++) {
                workflowVariables[Object.keys(variables)[i]] = variables[Object.keys(variables)[i]].value;
            }
        }
        return workflowVariables;
    }

    /**
     * Requests the scheduler to resubmit a job then displays a confirmation toast.
     */
    const reSubmitJob = function (jobId, variables) {
        $scope.isSubmissionGoingOn = true;
        WESchedulerService.reSubmitJob(jobId, variables, $scope.isStartAtToggled?$scope.startAt.toISOString():false)
            .success(function (response) {
                //close the Submit Workflow Panel
                $scope.$parent.toggleOpenSubmitJobPanel(false);
                const id = response.id;
                const text = UtilsFactory.translate('Your Job has been resubmitted successfully') + ', Job Id: ' + id;
                openDetailsView(id, text);
                $scope.isSubmissionGoingOn = false;
            })
            .error(function (response) {
                $scope.WEsubmissionErrorMessage = response.errorMessage;
                $scope.isSubmissionGoingOn = false;
                console.error('Could not resubmit job ' + id + '! ' + response);
            });
    };

    function openDetailsView(id, text) {
        var height = WEUtilsFactory.getUserPreference('jobDetailsView.windowHeight');
        var width = WEUtilsFactory.getUserPreference('jobDetailsView.windowWidth');
        toaster.pop('success', "", text + '<br>' +
            '<a href="javascript:void(0);" onclick="window.open(\'#/job-info?jobid=' + id + '&tab=0\', \'job-info-' + id +
            '\', \'toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,directories=no,status=no\')" target="_blank">' +
            UtilsFactory.translate('Open Job Details in a New Popup Window') + '</a><br>' +
            '<a href="' + UtilsFactory.getProxyNames() + '/scheduler/" target="_blank">' + UtilsFactory.translate('Open Job in Scheduler Portal') + '</a>', 5000, 'trustedHtml');
    }

    /**
     * Requests the scheduler to resubmit and kill a job then display a confirmation toast
     **/
    const killResubmitJob = function (jobId, variables) {
        $scope.isSubmissionGoingOn = true;
        WESchedulerService.reSubmitJob(jobId, variables, $scope.isStartAtToggled?$scope.startAt.toISOString():false)
            .success(function ( newJob) {
                WESchedulerService.killJob(jobId)
                    .success(function (res) {
                        if (res) {
                            const newJobId = newJob.id;
                            const text = UtilsFactory.translate('Your Job has been killed and resubmitted successfully') + ', Job Id: ' + newJobId;
                            openDetailsView(newJobId, text);
                        } else {
                            toaster.warning('Could not kill job ' + id + '!')
                        }
                        //close the Submit Workflow Panel
                        $scope.$parent.toggleOpenSubmitJobPanel(false);
                        $scope.isSubmissionGoingOn = false;
                    })
                    .error(function (error) {
                        $scope.WEsubmissionErrorMessage = error.errorMessage;
                        $scope.isSubmissionGoingOn = false;
                        console.error('Could not kill job ' + id + '! ' + res)
                    });
            })
            .error(function (response) {
                $scope.WEsubmissionErrorMessage = response.errorMessage;
                console.error('Could not resubmit job ' + id + '! ' + response)
                $scope.isSubmissionGoingOn = false;
            });
    }
    // use : When clicking on the button check
    const check = function () {
        validateWorkflow(function (response) {
            // update workflow variables
            angular.forEach($scope.workflow.variables, function (variable) {
                variable.value = response.updatedVariables[variable.name];
            })

            // update warning messages
            if (response.valid === true) {
                $scope.successMessage = 'Check success';
                $scope.WEsubmissionErrorMessage = '';
            } else {
                $scope.WEsubmissionErrorMessage = response.errorMessage;
                $scope.successMessage = '';
            }
        })
    };
    $scope.validate = function () {
        if ($scope.workflow.jobId) {
            validateJob()
        } else {
            validateWorkflow(function (response) {
                updateVariables(response)
                if (!response.valid) {
                    $scope.WEsubmissionErrorMessage = "";
                    $scope.successMessage = '';
                }
                UtilsFactory.replaceVariableModelsIfNeeded($scope.workflow.variables);
            })
        }
    }

    function validateWorkflow(successCallback, errorCallback) {
        const bucketName = $scope.workflow['bucketName'];
        // Validate
        UtilsFactory.validateWorkflow(bucketName, $scope.workflow.name, $scope.workflow.variables)
            .success(function (response) {
                successCallback(response)
            })
            .error(function (response) {
                if (errorCallback) {
                    errorCallback(response)
                } else {
                    UtilsFactory.displayTranslatedErrorMessage(['An error occurred while validating your workflow', '\n', 'Please check the type of the provided values regarding the given variables models']);
                    console.error('An error occurred while validating the workflow: ' + angular.toJson(response));
                }
            })
    }

    function validateJob() {
        // Validate
        WESchedulerService.validateJob($scope.workflow.variables, $scope.workflow.jobId)
            .success(function (response) {
                updateVariables(response)
                if (!response.valid) {
                    $scope.WEsubmissionErrorMessage = "";
                    $scope.successMessage = '';
                }
                UtilsFactory.replaceVariableModelsIfNeeded($scope.workflow.variables);
            })
            .error(function (response) {
                UtilsFactory.displayTranslatedErrorMessage(['An error occurred while validating your job', '\n', 'Please check the type of the provided values regarding the given variables models']);
                console.error('An error occurred while validating the workflow: ' + angular.toJson(response));
            })
    }

    function updateVariables(response) {
        //We add "resolvedModel" attribute in order to handle the case where we have variables substitution
        angular.forEach($scope.workflow.variables, function (variable) {
            if (variable.model && variable.resolvedModel) {
                if (variable.model.toLowerCase().indexOf('pa:model_from_url') === 0) {
                    // keep the same value
                } else if (variable.resolvedModel !== response.updatedModels[variable.name]) {
                    variable.value = response.updatedModels[variable.name].toLowerCase().indexOf('pa:boolean') === 0 ? 'false' : '';
                }
            }
            variable.resolvedModel = response.updatedModels[variable.name];
            variable.group = response.updatedGroups[variable.name] ? response.updatedGroups[variable.name] : '';
            variable.advanced = response.updatedAdvanced[variable.name];
            variable.hidden = response.updatedHidden[variable.name];
            variable.description = response.updatedDescriptions[variable.name] ? response.updatedDescriptions[variable.name] : '';
        })
        for (var key in response.updatedVariables) {
            // then, add global variables not defined in the workflow
            var index = $scope.workflow.variables.findIndex(function (variable) {
                return variable.name === key
            });
            if (key.indexOf(':') < 0 && index < 0) {
                var globalVariable = {
                    name: key,
                    value: response.updatedVariables[key],
                    model: response.updatedModels[key],
                    resolvedModel: response.updatedModels[key],
                    group: response.updatedGroups[key] ? response.updatedGroups[key] : '',
                    advanced: response.updatedAdvanced[key],
                    hidden: response.updatedHidden[key],
                    description: response.updatedDescriptions[key] ? response.updatedDescriptions[key] : ''
                }
                $scope.workflow.variables.push(globalVariable);
            }
        }
    }

    // Go to the previous tab:  catalog-view
    function previous() {
        $scope.$parent.$parent.$parent.$parent.$parent.$parent.activeTab.value = 0;
    }

    $scope.modelToList = function (model) {
        return UtilsFactory.modelToList(model);
    };

    $scope.modelToDateFormat = function (model) {
        return UtilsFactory.modelToDateFormat(model);
    };

    $scope.modelToDateScope = function (model) {
        return UtilsFactory.modelToDateScope(model);
    };

    $scope.manageThirdPartyCredentials = function (credVariable) {
        validateWorkflow(function (response) {
            var credVariableValue = response.updatedVariables[credVariable.name];
            UtilsFactory.openThirdPartyCredentialsModal(credVariableValue, check);
        }, function (response) {
            console.error('An error occurred while validating the workflow, so directly using the variable value as credential key. Error: ' + angular.toJson(response));
            UtilsFactory.openThirdPartyCredentialsModal(credVariable.value, check);
        });
    };

    $scope.manageFiles = function (variable, dataspace, selectFolder) {
        UtilsFactory.openFileBrowser(variable, dataspace, selectFolder);
    };

    $scope.getImageUrlWithProxy = function(url) {
        return UtilsFactory.getProxyNames() + url;
    }

    // click on folder icon besides PA:CATALOG_OBJECT variable open a pop-up
    // this pop-up will be used to browse catalog objects, and user can select one as the variable value.
    $scope.selectCatalogObjectVar = function (variable, variableModel) {
        UtilsFactory.openCatalogObjectModal(variable, variableModel);
    };

    $scope.documentationUrl = function (url) {
        if (url.startsWith('http')) {
            return url;
        } else {
            return JSON.parse(localStorage.appUrl).concat('/doc/', url);
        }
    }

    $scope.filterVariables = function (variable) {
        if (variable.hidden) {
            return false
        }
        if ($scope.advancedVariables) {
            return true
        } else if (!variable.advanced) {
            return true;
        }
        return false;
    }

    $scope.isVariablesIncludeAdvancedVar = function (variables) {
        return UtilsFactory.isVariablesIncludeAdvancedVar(variables)
    }
    $scope.cleanId = function (name) {
        return name.replace(/ /g, '');
    };

    $scope.objectKeys = function (obj) {
        return Object.keys(obj);
    }

    $scope.showMore = function (limit){
        $scope.descriptionLimit = limit
    }

    $scope.showLess = function (){
        $scope.descriptionLimit = 200;
    }

    // Close the window if ESC key pressed
    $(document).keydown(function (e) {
        // ESCAPE key pressed
        if (e.keyCode === 27 && $scope.isJobSubmissionPanelOpen) {
            $scope.toggleOpenSubmitJobPanel(false);
        }
    })

    function displaySuccessMessage(message) {
        UtilsFactory.displayTranslatedMessage('success', 'Operation Successful !', message);
    }
});