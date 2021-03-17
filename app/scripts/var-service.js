function VarService($http, $window) {

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
        return getStringByUrl(urlToFetch);
    };

    function replaceVariableModelsIfNeeded(variables) {
        if (Array.isArray(variables)) {
            variables.filter(function (variable) {
                // filter non empty models and models that should be replaced
                return variable.model && variable.model.toLowerCase().indexOf('pa:model_from_url') !== -1;
            }).map(function (variable) {
                // replace models with response
                variable.resolvedModel = replaceModelWithFetched(variable.model);
            })
        } else {
            for (var prop in variables) {
                var variable = variables[prop]
                if (variable.model && variable.model.toLowerCase().indexOf('pa:model_from_url') !== -1) {
                    variable.resolvedModel = replaceModelWithFetched(variable.model);
                }
            }
        }
    };

    function getStringByUrl(url) {
        var request = new XMLHttpRequest();
        request.open("GET", url, false);
        request.send();
        return request.responseText;
    }

    return {
        replaceVariableModelsIfNeeded : function(variables) {
            replaceVariableModelsIfNeeded(variables)
        }
    };

}

angular.module('cloud-automation')
    .factory('VarService', VarService);