function UtilsFactory($window, $uibModal, $filter, $cookies, SweetAlert) {
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
            if(variable.resolvedModel){
                return variable.resolvedModel.toLowerCase().indexOf(targetModel) == 0;
            }
            return variable.resolvedModel.toLowerCase().indexOf(targetModel) == 0;
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
            if (model && model.toLowerCase().indexOf('pa:boolean') == 0) {
                if (variable.value.toLowerCase() === 'true' || variable.value == 1) {
                    return 'true';
                } else if (variable.value.toLowerCase() === 'false' || variable.value == 0) {
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
             keyboard: false,
             backdrop: 'static',
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

    /**
        This function translates string and concat them one after the other.
        If a string hasn't got translations, it will be concatenated as written.
    */
    function translate(stringsToTranslate) {
        var translatedStr = "";
        if (stringsToTranslate !== undefined) {
            if (!Array.isArray(stringsToTranslate)) {
                stringsToTranslate = [stringsToTranslate];
            }

            for (i=0;i<stringsToTranslate.length;i++) {
                translatedStr = translatedStr.concat(" ").concat($filter('translate')(stringsToTranslate[i].replace(/\n/gm,'<br>')));
            }
        }
        return translatedStr.trim();
    }

    function displayTranslatedMessage (type, titleToTranslate, messageToTranslate) {
         var swalContent = {html: true};

         if (titleToTranslate !== undefined) {
            if (!Array.isArray(titleToTranslate)) {
                titleToTranslate = [titleToTranslate];
            }
            swalContent.title = translate(titleToTranslate);
         }

         if (messageToTranslate !== undefined ) {
            if (!Array.isArray(messageToTranslate)) {
                messageToTranslate = [messageToTranslate];
            }
            swalContent.text = translate(messageToTranslate);
         }

         if (type === 'error' || type === 'warning' || type === 'success' || type === 'info') {
            swalContent.type = type;
         } else if (type === undefined) {
            console.log('No type has been defined for the displayed message')
         } else {
            console.log(type + ' is not a valid message type to be displayed')
         }

         SweetAlert.swal(swalContent);
    }

    function displayTranslatedErrorMessage(title, message) {
        displayTranslatedMessage('error', title, message);
    }

    function displayTranslatedSuccessMessage(title, message) {
        displayTranslatedMessage('success', title, message);
    }

   function openEndpoint(url) {
        var parsedUrl = new URL(url);

        if (parsedUrl.pathname.includes('cloud-automation-service/services/')) {
            //override the hostname of the target url (with the hostname of the current window)
            parsedUrl.hostname = window.location.hostname;

            //add a cookie with a domain set to the same hostname (i.e., the hostname of the current window)
            $cookies.put("sessionid", getSessionId(), {
                domain: parsedUrl.hostname,
                path: '/'
            });
        }

        //open the targeted url
        $window.open(parsedUrl.href, url);
    };

    /**
     * Get the url or proxified url for a given endpoint
     * @param endpoint
     * @returns {string}
     */
    function getEndpointUrl(endpoint) {
        return endpoint.proxyfied ? endpoint.proxyfiedUrl : endpoint.url;
    };

    return {
        openJobInSchedulerPortal : openJobInSchedulerPortal,
        isSpecialUIModel: isSpecialUIModel,
        parseEmptyVariablesValue: parseEmptyVariablesValue,
        openFileBrowser: openFileBrowser,
        translate: translate,
        displayTranslatedMessage: displayTranslatedMessage,
        displayTranslatedErrorMessage: displayTranslatedErrorMessage,
        displayTranslatedSuccessMessage: displayTranslatedSuccessMessage,
        updateCursor : function(isWaiting){
            return updateCursor(isWaiting);
        },
        extractVariables: extractVariables,
        openEndpoint : openEndpoint,
        getEndpointUrl: getEndpointUrl
    };
}

angular.module('main')
    .factory('UtilsFactory', UtilsFactory);
