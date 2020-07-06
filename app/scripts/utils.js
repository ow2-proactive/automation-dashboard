function UtilsFactory($window) {
    var specialUIModel = ['pa:boolean', 'pa:list', 'pa:datetime', 'pa:hidden', 'pa:global_file', 'pa:user_file', 'pa:credential'];

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
    return {
        openJobInSchedulerPortal : openJobInSchedulerPortal,
        isSpecialUIModel: isSpecialUIModel,
        parseEmptyVariablesValue: parseEmptyVariablesValue,
        updateCursor : function(isWaiting){
            return updateCursor(isWaiting);
        },
        extractVariables: extractVariables
    };
}

angular.module('main')
    .factory('UtilsFactory', UtilsFactory);
