function UtilsFactory($window, $uibModal, $filter) {
    var specialUIModel = ['pa:boolean', 'pa:list', 'pa:datetime', 'pa:hidden', 'pa:global_file', 'pa:user_file', 'pa:global_folder', 'pa:user_folder', 'pa:credential'];

    function openJobInSchedulerPortal(jobId) {
        if (jobId) {
            var url = JSON.parse(localStorage.schedulerPortalUrl)+ '/?job=' + jobId;
            var win = $window.open(url, '/scheduler/');
            win.focus();
        }
    }

    function updateCursor(isWaiting) {
        var body = angular.element(document).find('body');
        if (isWaiting) {
            body.addClass('waiting');
        } else {
            body.removeClass('waiting');
        }
    }

    // check whether the variable needs a special UI (i.e., it's not simply showing its value with an inputbox)
    // For example, if the variable is the type 'pa:boolean', 'pa:list', or 'pa:datetime' etc, the function return true
    function isSpecialUIModel(variable) {
        return -1 !== specialUIModel.findIndex(function (targetModel) {
            return variable.model.toLowerCase().indexOf(targetModel) !== -1;
        });
    };

    // When the variable value is null or undefined, convert it to the empty string
    function parseEmptyVariablesValue(variables) {
        angular.forEach(variables, function(variable){
            if(variable.value == null) {
                variable.value = "";
            }
        });
        return variables;
    }
    function extractVariableValue(variable, model) {
            // for data binding, we need to transform boolean to 'false'/'true' (instead of numbers or strings with upper case)
            if (model && model.toLowerCase().indexOf('pa:boolean') !== -1) {
                if (variable.value.toLowerCase() === 'true' || variable.value === 1) {
                    return 'true';
                } else if (variable.value.toLowerCase() === 'false' || variable.value === 0) {
                    return 'false';
                }
            } else {
                return variable.value;
            }
        }

    function extractVariables(modifiedWorkflow) {
        var variables = {};
        // we set model before values to know the model when setting values (1 & 0 can be int or bool, we need to know which one)
        angular.forEach(modifiedWorkflow.object_key_values, function (item) {
            if (item.label === 'variable_model') {
                variables[item.key] = {};
                variables[item.key].model = item.value;
            }
        });
        angular.forEach(modifiedWorkflow.object_key_values, function (item) {
            if (item.label === 'variable') {
                if (!variables[item.key]) {
                    variables[item.key] = {};
                }
                variables[item.key].value = extractVariableValue(item, variables[item.key].model);
                variables[item.key].name = item.name;
            }
        });
        return variables;
    }
    // open a pop-up to manage (browse, upload, delete) the global or user data space files
    function openFileBrowser(variable, dataspace, selectFolder) {
         $uibModal.open({
             templateUrl: 'views/modals/dataspace-file-browser.html',
             controller: 'FileBrowserModalCtrl',
             windowClass: 'fadeIn file-browser-modal',
             size: 'lg',
             resolve: {
                 dataspace: function() {
                     return dataspace;
                 },
                 variable: function() {
                     return variable;
                 },
                 selectFolder: function() {
                     return selectFolder;
                 }
             }
         });
    }

    /*
        This function takes single string values or string arrays to build a message with translated text and/or non translated text

        - If both are provided, it will concat one after the other: translated1 + nonTranslated1 + translated2 + nonTranslated2 and so on.
          When an array is at the end, the remaining elements of the other will be concatenated at the end.
        - If only one of them is provided it will simply concat the whole array, translated or not depending on the one provided
    */
    function translate(argsToTranslate, argsToNotTranslate) {
        var translatedStr="";
        var parseArgsToNotTranslate = true;
        var hasArgsToNotTranslate = argsToNotTranslate !== undefined;

        if (argsToTranslate !== undefined) {

            // If its a single string we transform to array
            if(!Array.isArray(argsToTranslate)) {
                argsToTranslate = [argsToTranslate];
            }

            if (argsToTranslate.length > 0) {
                for (i=0; i<argsToTranslate.length; i++) {
                    translatedStr = translatedStr.concat(" ").concat($filter('translate')(argsToTranslate[i]));
                    if (parseArgsToNotTranslate && hasArgsToNotTranslate) {
                        // If its a single string we transform to array
                        if(!Array.isArray(argsToNotTranslate)) {
                            argsToNotTranslate = [argsToNotTranslate];
                        }

                        if (argsToNotTranslate.length === 1) {
                                // concat the unique element and set flag to false
                                translatedStr = translatedStr.concat(" ").concat(argsToNotTranslate[i]);
                                parseArgsToNotTranslate = false;
                            } else {
                                if (argsToTranslate.length === 1) {
                                    // There is only one element to translate, we concat the rest of non translated elements
                                     for (j=0; j<argsToTranslate.length; j++) {
                                            translatedStr = translatedStr.concat(" ").concat(argsToNotTranslate[j]);
                                     }
                                     // Exit the loop
                                     break;
                                }

                                if (argsToNotTranslate[i+1] === undefined) {
                                    // Its the last non translated element to concat, set flag to false
                                    parseArgsToNotTranslate = false;
                                }

                                translatedStr = translatedStr.concat(" ").concat(argsToNotTranslate[i]);
                            }
                        }
                    }
                }
            }
        return translatedStr.trim();
    }

    return {
        openJobInSchedulerPortal : openJobInSchedulerPortal,
        isSpecialUIModel: isSpecialUIModel,
        parseEmptyVariablesValue: parseEmptyVariablesValue,
        openFileBrowser: openFileBrowser,
        translate: translate,
        updateCursor : function(isWaiting){
            return updateCursor(isWaiting);
        },
        extractVariables: extractVariables
    };
}

angular.module('main')
    .factory('UtilsFactory', UtilsFactory);
