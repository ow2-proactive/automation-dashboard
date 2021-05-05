function UtilsFactory($window, $uibModal, $filter, $cookies, $http, $rootScope, $q, toastr, SweetAlert) {
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

    function uploadDataspaceFile(url, selectedFile, successCallback, errorCallback) {
        if($rootScope.uploadingFiles === void 0) {
            $rootScope.uploadingFiles = [];
        }
        if($rootScope.uploadingCancelers === void 0) {
            $rootScope.uploadingCancelers = new Map();
        }

        var uploadId = Math.random().toString(36).substr(2, 9);
        $rootScope.uploadingFiles.push({id: uploadId, filename: selectedFile.name, size: toReadableFileSize(selectedFile.size)})

        var uploadRequestCanceler = $q.defer();
        $rootScope.uploadingCancelers.set(uploadId, uploadRequestCanceler);

        var timeStarted = new Date();
        $http({
            url: url,
            method: "PUT",
            data: selectedFile,
            processData: false,
            timeout: uploadRequestCanceler.promise,
            uploadEventHandlers: {
                progress: function (e) {
                    if (e.lengthComputable) {
                        uploadProgress = (e.loaded / e.total) * 100;
                        $('.' + uploadId + ' .progress-bar').css('width', uploadProgress + '%');
                        $('.' + uploadId + ' .upload-progress').html(toReadableFileSize(e.loaded)+"/"+toReadableFileSize(e.total));

                        var timeElapsed = (new Date()) - timeStarted;
                        var uploadSpeed = e.loaded / (timeElapsed/1000); // Upload speed in second
                        var uploadSpeedKbps = uploadSpeed/1024;
                        var readableUploadSpeed = (uploadSpeedKbps > 1) ? uploadSpeedKbps.toFixed(2) + " Kbps" : uploadSpeed.toFixed(2) + " bps"
                        readableUploadSpeed = (uploadSpeedKbps > 1024) ?  (uploadSpeedKbps/1024).toFixed(2) + " Mbps" : readableUploadSpeed
                        $('.' + uploadId + ' .upload-speed').html(readableUploadSpeed);

                        var remainingSeconds = (e.total - e.loaded) / uploadSpeed  // estimated remaining seconds for uploading
                        $('.' + uploadId + ' .upload-remaining-time').html(new Date(remainingSeconds * 1000).toISOString().substr(11, 8)+" left");
                    }
                }
            },
            headers: { "sessionid": getSessionId() }
        })
        .success(function (data){
            successCallback();
            toastr.success("Your file " + selectedFile.name + " has been successfully uploaded.", {timeOut: 0, extendedTimeOut: 0});
            $rootScope.uploadingFiles = $rootScope.uploadingFiles.filter(function(x) {return x.id !== uploadId;});
        })
        .error(function (xhr) {
            errorCallback();
            var errorMessage = "";
            if(xhr) {
                errorMessage = ": "+ xhr;
            }
            toastr.error('Failed to upload the file ' + selectedFile.name + errorMessage, {timeOut: 0, extendedTimeOut: 0})
            $rootScope.uploadingFiles = $rootScope.uploadingFiles.filter(function(x) {return x.id !== uploadId;});
        });
    }

    function toReadableFileSize(size) {
        if (typeof bytes !== 'number') {
            size = parseInt(size);
        }
        var units = [' B', ' KB', ' MB', ' GB', ' TB']
        var unitIndex = 0;
        while(size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024 ;
            unitIndex++;
        }
        return size.toFixed(1) + units[unitIndex];
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
       // Add default protocol if it is not provided (when launching locally)
       if (!url.match(/^[a-zA-Z]+:\/\//)) {
           url = window.location.protocol + '//' + url;
       }
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
    }

    function getByKey (propertyLabel, propertyName, collection) {
        var len = collection.length;
        var value = '';
        for (var i = 0; i < len; i++) {
            if ((collection[i].label === propertyLabel) && (collection[i].key === propertyName)) {
                value = collection[i].value;
            }
        }
        return value;
    }

    /**
     * Get the url or proxified url for a given endpoint
     * @param endpoint
     * @returns {string}
     */
    function getEndpointUrl(endpoint) {
        return endpoint.proxyfied ? endpoint.proxyfiedUrl : endpoint.url;
    }

    return {
        openJobInSchedulerPortal : openJobInSchedulerPortal,
        isSpecialUIModel: isSpecialUIModel,
        parseEmptyVariablesValue: parseEmptyVariablesValue,
        openFileBrowser: openFileBrowser,
        uploadDataspaceFile: uploadDataspaceFile,
        toReadableFileSize: toReadableFileSize,
        translate: translate,
        displayTranslatedMessage: displayTranslatedMessage,
        displayTranslatedErrorMessage: displayTranslatedErrorMessage,
        displayTranslatedSuccessMessage: displayTranslatedSuccessMessage,
        updateCursor : function(isWaiting){
            return updateCursor(isWaiting);
        },
        extractVariables: extractVariables,
        openEndpoint : openEndpoint,
        getEndpointUrl: getEndpointUrl,
        getByKey:getByKey
    };
}

angular.module('main')
    .factory('UtilsFactory', UtilsFactory);
