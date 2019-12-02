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

    function replaceVariableModelsIfNeeded(workflow, window) {
        workflow.variables.filter(function (variable) {
            // filter non empty models and models that should be replaced
            return variable.model && variable.model.toLowerCase().indexOf('pa:model_from_url') !== -1;
        }).map(function (variable) {
            // replace models with response
            variable.model = replaceModelWithFetched(variable.model, window);
        })
    };

    function getStringByUrl(url) {
        var request = new XMLHttpRequest();
        request.open("GET", url, false);
        request.send();
        return request.responseText;
    }

    return {
        replaceVariableModelsIfNeeded : function(workflow, window) {
            replaceVariableModelsIfNeeded(workflow, window)
        }
    };

}

angular.module('cloud-automation')
    .factory('VarService', VarService);