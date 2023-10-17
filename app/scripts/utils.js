function UtilsFactory($window, $uibModal, $filter, $cookies, $http, $rootScope, $q, $location, toaster, SweetAlert, $httpParamSerializerJQLike) {
    const specialUIModel = ['pa:boolean', 'pa:list', 'pa:datetime', 'pa:hidden', 'pa:global_file', 'pa:user_file', 'pa:global_folder',
        'pa:user_folder', 'pa:catalog_object', 'pa:credential'];
    const textAreaModel = ['pa:regexp', 'pa:spel', 'pa:json', 'pa:not_empty_string'];
    const catalogUrlPrefix = $location.$$protocol + '://' + $location.$$host + ':' + $location.port() + '/catalog/buckets/';
    const defaultUserPreferences = {
        submissionView: {
            selectedBucketName: '',
            showPSAWorkflowsOnly: false,
            toggleListBox: {
                value: false
            },
            orderByColumnConfig: {
                workflows: {
                    column: '',
                    comparatorLogic: '',
                    order: ''
                },
                buckets: {
                    column: 'name',
                    comparatorLogic: '+name',
                    order: 'd'
                }
            }
        }
    }

    function schedulerRestUrl() {
        return JSON.parse(localStorage.schedulerRestUrl);
    }

    function loadUserPreferences(itemName) {
        // Initialize them with defaults if they don't exist in the browser's Local Storage
        if (!localStorage.WizardUserPreferences) {
            localStorage.setItem('WizardUserPreferences', JSON.stringify(defaultUserPreferences))
        }
        return JSON.parse(localStorage.WizardUserPreferences)
    }

    function getUserPreference(propertyName) {
        var preferences = loadUserPreferences();
        // Make sure the property is created if it is not (at a deeply nested level)
        var preference = getOrSetNestedObjectProperty(preferences, propertyName)
        // Property should exist, but should neither be null or empty
        if ((preference && typeof preference !== 'object') || (typeof preference === 'object' && preference !== null && !angular.equals(preference, {}))) {
            return preference
        } else {
            preference = getOrSetNestedObjectProperty(defaultUserPreferences, propertyName)
            return preference
        }
    }

    function getSortClasses(sortParameters, column) {
        if (sortParameters && sortParameters.column === column) {
            return sortParameters.order === 'a' ? 'fa-sort-asc' : 'fa-sort-desc';
        } else {
            return 'fa-sort text-disabled'
        }
    }

    function setUserPreference(propertyName, value) {
        var userPreferences = loadUserPreferences();
        getOrSetNestedObjectProperty(userPreferences, propertyName, value)
        localStorage.setItem('WizardUserPreferences', JSON.stringify(userPreferences));
        return userPreferences;
    }

    function getOrSetNestedObjectProperty(targetObject, path, value) {
        var schema = targetObject;  // a moving reference to internal objects within obj
        var propertiesList = path.split('.');
        for (var i = 0; i < propertiesList.length - 1; i++) {
            var elem = propertiesList[i];
            if (!schema[elem]) {
                schema[elem] = {}
            }
            schema = schema[elem];
        }
        if (value !== undefined) {
            schema[propertiesList[propertiesList.length - 1]] = value;
        } else {
            return schema[propertiesList[propertiesList.length - 1]]
        }
    }

    function openJobInSchedulerPortal(jobId) {
        if (jobId) {
            var url = JSON.parse(localStorage.schedulerPortalUrl) + '/?job=' + jobId;
            var win = $window.open(url, '/scheduler/');
            win.focus();
        }
    }

    /**
     * open detailed job info in popup window
     **/
    function openJobInfoPopup(jobId) {
        window.open('#/job-info?jobid=' + jobId + '&tab=0',
            'job-info-' + jobId,
            'toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,directories=no,status=no');
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
            if (variable.resolvedModel) {
                return variable.resolvedModel.toLowerCase().indexOf(targetModel) == 0;
            } else {
                return false;
            }
        });
    };

    function isTextAreaModel(variable) {
        return -1 !== textAreaModel.findIndex(function (targetModel) {
            if (variable.resolvedModel) {
                return variable.resolvedModel.toLowerCase().indexOf(targetModel) == 0;
            } else {
                return true;
            }
        });
    };

    function getWorkflowMetadata(workflow, label, key) {
        var obj = workflow.object_key_values.find(function (okv) {
            return okv.label === label && okv.key === key;
        });
        return obj && obj.value;
    }

    // returns true when variables includes advanced variables and false otherwise
    function isVariablesIncludeAdvancedVar(variables) {
        return variables.findIndex(function (variable) {
            return variable.advanced;
        }) > -1;
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
        var variables = [];
        angular.forEach(modifiedWorkflow.variables_order, function (group, key) {
            angular.forEach(group, function (variable) {
                variable.value = extractVariableValue(variable, variable.model);
                variable.group = key;
                variables.push(variable);
            })
        })
        return variables;
    }

    /**
     * The main object of this function is to put variables with no group on the top of the list
     * because we want to display them on the top : 'Main variables'
     **/
    const orderVariables = function (modifiedVariables) {
        var variables = [];
        angular.forEach(modifiedVariables, function (variable) {
            variable.value = extractVariableValue(variable, variable.model);
            if (!variable.group) {
                variables.push(variable)
            }
        })
        angular.forEach(modifiedVariables, function (variable) {
            if (variable.group) {
                variables.push(variable)
            }
        })
        return variables;
    }

    // open a pop-up to browse the catalog objects and select one
    function openCatalogObjectModal(variable, variableModel) {
        $uibModal.open({
            templateUrl: 'views/modals/catalog_objects_modal.html',
            controller: 'CatalogObjectsModalCtrl',
            windowClass: 'fadeIn catalog-objects-modal',
            size: 'xl',
            keyboard: true,
            backdrop: 'static',
            resolve: {
                variable: function () {
                    return variable;
                },
                variableModel: function () {
                    return variableModel;
                }
            }
        });
    }

    // open a pop-up to manage (browse, upload, delete) the global or user data space files
    function openFileBrowser(variable, dataspace, selectFolder, allowToEdit) {
        $uibModal.open({
            templateUrl: 'views/modals/dataspace-file-browser.html',
            controller: 'FileBrowserModalCtrl',
            windowClass: 'fadeIn file-browser-modal',
            size: 'xl',
            keyboard: true,
            backdrop: 'static',
            resolve: {
                dataspace: function () {
                    return dataspace;
                },
                variable: function () {
                    return variable;
                },
                selectFolder: function () {
                    return selectFolder;
                },
                allowToEdit: function () {
                    return allowToEdit === undefined ? true : allowToEdit;
                },

            }
        });
    }

    function openThirdPartyCredentialsModal(credKey) {
        $uibModal.open({
            templateUrl: 'views/modals/third_party_credentials.html',
            controller: 'ThirdPartyCredentialModalCtrl',
            windowClass: 'fadeIn',
            keyboard: true,
            backdrop: 'static',
            size: 'lg',
            resolve: {
                credKey: function () {
                    return credKey;
                }
            }
        });
    }

    function uploadDataspaceFile(url, selectedFile, isGlobalFile, successCallback, errorCallback) {
        if ($rootScope.uploadingFiles === void 0) {
            $rootScope.uploadingFiles = [];
        }
        if ($rootScope.uploadingCancelers === void 0) {
            $rootScope.uploadingCancelers = new Map();
        }

        var uploadId = Math.random().toString(36).substr(2, 9);
        $rootScope.uploadingFiles.push({
            id: uploadId,
            filename: selectedFile.name,
            size: toReadableFileSize(selectedFile.size),
            isGlobalFile: isGlobalFile,
            uploaded: 0,
            remainingSeconds: 0
        })

        var uploadRequestCanceler = $q.defer();
        $rootScope.uploadingCancelers.set(uploadId, {filename: selectedFile.name, canceler: uploadRequestCanceler});

        var timeStarted = moment();
        $http({
            url: url,
            method: 'PUT',
            data: selectedFile,
            processData: false,
            timeout: uploadRequestCanceler.promise,
            uploadEventHandlers: {
                progress: function (e) {
                    if (e.lengthComputable) {
                        uploadProgress = (e.loaded / e.total) * 100;
                        $('.' + uploadId + ' .progress-bar').css('width', uploadProgress + '%');
                        $('.' + uploadId + ' .upload-progress').html(toReadableFileSize(e.loaded) + '/' + toReadableFileSize(e.total));

                        var timeElapsed = moment().diff(timeStarted);
                        var uploadSpeed = e.loaded / (timeElapsed / 1000); // Upload speed in bytes per second
                        $('.' + uploadId + ' .upload-speed').html(toReadableNetworkSpeed(uploadSpeed * 8)); // Upload speed in bps, Kbps, or Mbps

                        var remainingSeconds = Math.floor((e.total - e.loaded) / uploadSpeed);  // estimated remaining seconds for uploading
                        $('.' + uploadId + ' .upload-remaining-time').html(timeToHHMMSS(remainingSeconds) + ' left');

                        var maxRemainSeconds = 0;
                        var totalUploaded = 0
                        var totalSize = 0;
                        for (var i = 0; i < $rootScope.uploadingFiles.length; i++) {
                            if ($rootScope.uploadingFiles[i].id === uploadId) {
                                $rootScope.uploadingFiles[i].uploaded = e.loaded;
                                $rootScope.uploadingFiles[i].remainingSeconds = remainingSeconds;
                            }
                            maxRemainSeconds = Math.max(maxRemainSeconds, $rootScope.uploadingFiles[i].remainingSeconds);
                            totalUploaded += $rootScope.uploadingFiles[i].uploaded;
                            totalSize += $rootScope.uploadingFiles[i].size
                        }
                        $rootScope.totalRemainTime = maxRemainSeconds * 1000;
                        $rootScope.totalProgress = (totalUploaded / totalSize) * 100;
                    }
                }
            },
            headers: {'sessionid': getSessionId()}
        })
            .success(function (data) {
                successCallback();
                toaster.success('Your file ' + selectedFile.name + ' has been successfully uploaded.');
                $rootScope.uploadingFiles = $rootScope.uploadingFiles.filter(function (x) {
                    return x.id !== uploadId;
                });
                $rootScope.uploadingCancelers.delete(uploadId);
            })
            .error(function (xhr, status, headers, config) {
                errorCallback();
                // No need to show error message for cancelled request (status 499)
                if (config.timeout.status !== 499) {
                    var errorMessage = '';
                    if (xhr) {
                        errorMessage = ': ' + xhr;
                    }
                    toaster.error('Failed to upload the file ' + selectedFile.name + errorMessage)
                }
                $rootScope.uploadingFiles = $rootScope.uploadingFiles.filter(function (x) {
                    return x.id !== uploadId;
                });
                $rootScope.uploadingCancelers.delete(uploadId);
            });
    }

    // convert a duration (number of seconds) to a human readable format (D:HH:MM:SS)
    function timeToHHMMSS(totalSeconds) {
        return totalSeconds ? moment.duration(totalSeconds * 1000).format('D[d]H[h]m[m]s[s]') : '';
    }

    function toReadableNetworkSpeed(uploadSpeedBps) {
        var uploadSpeedKbps = uploadSpeedBps / 1024;
        if (uploadSpeedKbps < 1) {
            return uploadSpeedBps.toFixed(2) + ' b/s';
        } else if (uploadSpeedKbps < 1024) {
            return uploadSpeedKbps.toFixed(2) + ' Kb/s'
        } else {
            return (uploadSpeedKbps / 1024).toFixed(2) + ' Mb/s';
        }
    }

    function toReadableFileSize(size) {
        if (typeof bytes !== 'number') {
            size = parseInt(size);
        }
        var units = [' B', ' KB', ' MB', ' GB', ' TB']
        var unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return size.toFixed(1) + units[unitIndex];
    }

    /**
     This function translates string and concat them one after the other.
     If a string hasn't got translations, it will be concatenated as written.
     */
    function translate(stringsToTranslate) {
        var translatedStr = '';
        if (stringsToTranslate !== undefined) {
            if (!Array.isArray(stringsToTranslate)) {
                stringsToTranslate = [stringsToTranslate];
            }

            for (i = 0; i < stringsToTranslate.length; i++) {
                translatedStr = translatedStr.concat(' ').concat($filter('translate')(stringsToTranslate[i].replace(/\n/gm, '<br>')));
            }
        }
        return translatedStr.trim();
    }

    function displayTranslatedMessage(type, titleToTranslate, messageToTranslate, callback) {
        var swalContent = {html: true, customClass: 'swal-style'};

        if (titleToTranslate !== undefined) {
            if (!Array.isArray(titleToTranslate)) {
                titleToTranslate = [titleToTranslate];
            }
            swalContent.title = translate(titleToTranslate);
        }

        if (messageToTranslate !== undefined) {
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
        SweetAlert.swal(swalContent, callback);
    }

    function displayTranslatedErrorMessage(title, message) {
        displayTranslatedMessage('error', title, message);
    }

    function displayTranslatedSuccessMessage(title, message, callback) {
        displayTranslatedMessage('success', title, message, callback);
    }

    function openEndpoint(url) {
        // Add default protocol if it is not provided (when launching locally)
        if (!url.match(/^[a-zA-Z]+:\/\//)) {
            url = window.location.protocol + '//' + url;
        }
        var parsedUrl = new URL(url);
        // Open the endpoint in the browser only if the protocol is http or https
        if (parsedUrl.protocol.startsWith('http')) {

            if (parsedUrl.pathname.includes('cloud-automation-service/services/')) {
                //override the hostname of the target url (with the hostname of the current window)
                parsedUrl.hostname = window.location.hostname;

                //add a cookie with a domain set to the same hostname (i.e., the hostname of the current window)
                $cookies.put('sessionid', getSessionId(), {
                    domain: parsedUrl.hostname,
                    path: '/'
                });
            }

            //open the targeted url
            $window.open(parsedUrl.href, url);
        }
    }

    function getByKey(propertyLabel, propertyName, collection) {
        var len = collection.length;
        var value = '';
        for (var i = 0; i < len; i++) {
            if ((collection[i].label === propertyLabel) && (collection[i].key.toLowerCase() === propertyName.toLowerCase())) {
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

    /** Transforms list of variables format to key-value without model :
     from : ["toto": {"value": 1, "model":"PA:INTEGER"}, ...]
     to : ["toto":1] **/
    function getVariablesInKeyValueFormat(variables) {
        var result = {};
        angular.forEach(variables, function (variable) {
            var name = variable.name;
            var value = variable.value;
            result[name] = value;
        });
        return result;
    };

    function modelToDateFormat(model) {
        var indexBegin = model.indexOf('(');
        var indexEnd = model.lastIndexOf(')');
        var javaDateTimeFormat = model.substring(indexBegin + 1, indexEnd).trim();
        return moment().toMomentFormatString(javaDateTimeFormat);
    };

    function modelToList(model) {
        var indexBegin = model.indexOf('(');
        var indexEnd = model.lastIndexOf(')');
        var options = model.substring(indexBegin + 1, indexEnd).split(',');
        return options.map(function (option) {
            return option.trim();
        });
    };

    function modelToDateScope(model) {
        var indexBegin = model.indexOf('[');
        var indexEnd = model.lastIndexOf(']');
        var dates = model.substring(indexBegin + 1, indexEnd).split(',');
        var dateScope = {};
        if (dates.length > 1) {
            dateScope.min = dates[0].trim();
            dateScope.max = dates[1].trim();
        }
        return dateScope;
    };

    /**
     * Transforms a map into a string with the following format : key1=value1;key2=value2;
     */
    function createPathStringFromMap(map, valuePropertyName) {
        var result = '';
        map.forEach(function (item) {
            result += item.name + '=' + encodeURIComponent(valuePropertyName ? item[valuePropertyName] : item) + ';'
        })
        return result.substring(0, result.length - 1);
    }

    // When the variable value is null or undefined, convert it to the empty string
    function parseEmptyVariablesValue(variables) {
        angular.forEach(variables, function (variable) {
            if (variable.value == null) {
                variable.value = '';
            }
        });
        return variables;
    }

    function replaceModelWithFetched(model) {
        var indexBegin = model.indexOf('(');
        var indexEnd = model.lastIndexOf(')');
        var urlToFetch = model.substring(indexBegin + 1, indexEnd);
        var origin = $window.location.origin;
        if (!origin.endsWith('/')) {
            origin += '/'
        }
        // Replace ${PA_CATALOG_REST_URL} OR $PA_CATALOG_REST_URL by origin + 'catalog'
        urlToFetch = urlToFetch.replace(/(\$\{PA_CATALOG_REST_URL\}|\$PA_CATALOG_REST_URL)/g, origin + 'catalog');

        // Replace ${PA_SCHEDULER_REST_URL} OR $PA_SCHEDULER_REST_URL by origin + 'catalog'
        urlToFetch = urlToFetch.replace(/(\$\{PA_SCHEDULER_REST_URL\}|\$PA_SCHEDULER_REST_URL)/g, origin + 'rest');

        // Replace ${PA_SCHEDULER_REST_PUBLIC_URL} OR $PA_SCHEDULER_REST_PUBLIC_URL by origin + 'rest'
        urlToFetch = urlToFetch.replace(/(\$\{PA_SCHEDULER_REST_PUBLIC_URL\}|\$PA_SCHEDULER_REST_PUBLIC_URL)/g, origin + 'rest');

        // Replace ${PA_CATALOG_REST_PUBLIC_URL} OR $PA_CATALOG_REST_PUBLIC_URL by origin + 'catalog'
        urlToFetch = urlToFetch.replace(/(\$\{PA_CATALOG_REST_PUBLIC_URL\}|\$PA_CATALOG_REST_PUBLIC_URL)/g, origin + 'catalog');
        return getStringByUrl(urlToFetch);
    };

    function replaceVariableModelsIfNeeded(variables) {
        if (Array.isArray(variables)) {
            variables.filter(function (variable) {
                // filter non empty models and models that should be replaced
                return variable.resolvedModel && variable.resolvedModel.toLowerCase().indexOf('pa:model_from_url') !== -1;
            }).map(function (variable) {
                // replace models with response
                variable.resolvedModel = replaceModelWithFetched(variable.resolvedModel);
                // select the first item in the list
                if(variable.resolvedModel.toLowerCase().indexOf('pa:list') == 0 && !variable.value) {
                    variable.value = modelToList(variable.resolvedModel)[0];
                }
            })
        } else {
            for (var prop in variables) {
                var variable = variables[prop]
                if (variable.resolvedModel && variable.resolvedModel.toLowerCase().indexOf('pa:model_from_url') !== -1) {
                    variable.resolvedModel = replaceModelWithFetched(variable.resolvedModel);
                }
                // select the first item in the list
                if(variable.resolvedModel.toLowerCase().indexOf('pa:list') == 0 && !variable.value) {
                    variable.value = modelToList(variable.resolvedModel)[0];
                }
            }
        }
    };

    function getStringByUrl(url) {
        var request = new XMLHttpRequest();
        request.open('GET', url, false);
        request.send();
        return request.responseText;
    }

    /**
     *Validation of Workflow
     **/
    function validateWorkflow(bucketName, workflowName, variables) {
        const configHeaders = {
            headers: {
                'link': catalogUrlPrefix + bucketName + '/resources/' + encodeURIComponent(workflowName) + '/raw',
                'sessionid': getSessionId(),
                'Content-Type': 'application/json'
            }
        };
        const path = createPathStringFromMap(parseEmptyVariablesValue(variables), 'value')
        var variablesMap = variables.reduce(function (map, obj) {
            map[obj.name] = obj.value;
            return map;
        }, {});
        var data = JSON.stringify(variablesMap);
        return $http.post(schedulerRestUrl() + 'validateurl/body', data, configHeaders);
    }

    function submitJob(bucketName, workflowName, variables, submissionMode) {
        const configHeaders = {
            headers: {
                'link': catalogUrlPrefix + bucketName + '/resources/' + encodeURIComponent(workflowName) + '/raw',
                'sessionid': getSessionId(),
                'Content-Type': 'application/json'
            }
        };
        var variablesMap = variables.reduce(function (map, obj) {
            map[obj.name] = obj.value;
            return map;
        }, {});
        var data = JSON.stringify(variablesMap);
        return $http.post(schedulerRestUrl() + 'jobs/body?submission.mode='+ submissionMode, data, configHeaders);
    }

    function getJobInfoForJob(jobId) {
        if (getSessionId()) {
            return $http.get(schedulerRestUrl() + 'jobs/' + jobId + '/info', {
                headers: {'sessionid': getSessionId()}
            })
        }
    }

    function getThirdPartyCredentials() {
        return $http.get(schedulerRestUrl() + 'credentials/', {
            headers: {'sessionid': getSessionId()}
        })
    }

    function postThirdPartyCredentials(key, value) {
        const configHeaders = {
            headers: {
                'sessionid': getSessionId(),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
        return $http.post(schedulerRestUrl() + 'credentials/' + encodeURIComponent(key), $httpParamSerializerJQLike({value: value}), configHeaders);

    }

    function removeThirdPartyCredentials(key) {
        return $http.delete(schedulerRestUrl() + 'credentials/' + encodeURIComponent(key), {headers: {'sessionID': getSessionId()}});
    }

    return {
        openJobInSchedulerPortal: openJobInSchedulerPortal,
        openJobInfoPopup: openJobInfoPopup,
        isSpecialUIModel: isSpecialUIModel,
        isTextAreaModel: isTextAreaModel,
        getSortClasses: getSortClasses,
        openCatalogObjectModal: openCatalogObjectModal,
        openFileBrowser: openFileBrowser,
        openThirdPartyCredentialsModal: openThirdPartyCredentialsModal,
        uploadDataspaceFile: uploadDataspaceFile,
        toReadableFileSize: toReadableFileSize,
        translate: translate,
        displayTranslatedMessage: displayTranslatedMessage,
        displayTranslatedErrorMessage: displayTranslatedErrorMessage,
        displayTranslatedSuccessMessage: displayTranslatedSuccessMessage,
        updateCursor: updateCursor,
        extractVariables: extractVariables,
        orderVariables: orderVariables,
        openEndpoint: openEndpoint,
        getEndpointUrl: getEndpointUrl,
        getByKey: getByKey,
        getVariablesInKeyValueFormat: getVariablesInKeyValueFormat,
        isVariablesIncludeAdvancedVar: isVariablesIncludeAdvancedVar,
        modelToDateFormat: modelToDateFormat,
        modelToList: modelToList,
        modelToDateScope: modelToDateScope,
        loadUserPreferences: loadUserPreferences,
        getUserPreference: getUserPreference,
        setUserPreference: setUserPreference,
        getWorkflowMetadata: getWorkflowMetadata,
        replaceVariableModelsIfNeeded: replaceVariableModelsIfNeeded,
        parseEmptyVariablesValue: parseEmptyVariablesValue,
        createPathStringFromMap: createPathStringFromMap,
        validateWorkflow: validateWorkflow,
        submitJob: submitJob,
        getJobInfoForJob: getJobInfoForJob,
        getThirdPartyCredentials: getThirdPartyCredentials,
        postThirdPartyCredentials: postThirdPartyCredentials,
        removeThirdPartyCredentials: removeThirdPartyCredentials
    };
}

angular.module('main')
    .factory('UtilsFactory', UtilsFactory);
