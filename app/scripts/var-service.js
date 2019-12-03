function VarService($http) {

    function replaceModelWithFetched(model, window) {
        var indexBegin = model.indexOf('(');
        var indexEnd = model.lastIndexOf(')');
        var urlToFetch = model.substring(indexBegin + 1, indexEnd);
        var origin = window.location.origin;
        if (!origin.endsWith('/')) {
            origin += '/'
        }
        urlToFetch = urlToFetch.replace('${PA_CATALOG_REST_URL}', origin + 'catalog');
        urlToFetch = urlToFetch.replace('${PA_SCHEDULER_REST_URL}', origin + 'rest');

        return getStringByUrl(urlToFetch);
    };

    function replaceVariableModelsIfNeeded(variables, window) {
        if (Array.isArray(variables)) {
            variables.filter(function (variable) {
                // filter non empty models and models that should be replaced
                return variable.model && variable.model.toLowerCase().indexOf('pa:model_from_url') !== -1;
            }).map(function (variable) {
                // replace models with response
                variable.model = replaceModelWithFetched(variable.model, window);
            })
        } else {
            for (var prop in variables) {
                var variable = variables[prop]
                if (variable.model && variable.model.toLowerCase().indexOf('pa:model_from_url') !== -1) {
                    variable.model = replaceModelWithFetched(variable.model, window);
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
        replaceVariableModelsIfNeeded : function(variables, window) {
            replaceVariableModelsIfNeeded(variables, window)
        }
    };

}

angular.module('cloud-automation')
    .factory('VarService', VarService);