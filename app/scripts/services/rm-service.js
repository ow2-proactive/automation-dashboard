/****** rm Service that fetches statistics from the RM REST API ******/
function rmService($http, $q) {
    var rmServiceUrl = JSON.parse(localStorage['rmRestUrl']);

    function getStats(objectname, range, ActualFree, nodejmxurl) {
        var config = {
            headers: {'sessionid': getSessionId(), 'Content-Type': 'application/json'},
            params: {
                'objectname': objectname,
                'range': range,
                'attrs': ActualFree,
                'nodejmxurl': nodejmxurl
            }
        };
        return $http.get(rmServiceUrl + 'nodes/mbean/history/', config);
    }

    function getNodes() {
        var config = {
            headers: {'sessionid': getSessionId(), 'Content-Type': 'application/json'},
        };
        return $http.get(rmServiceUrl + 'monitoring/', config);
    }

    return {
        getStats: function (objectname, range, ActualFree, nodejmxurl) {
            return getStats(objectname, range, ActualFree, nodejmxurl);
        },
        getNodes: function(){
            return getNodes();
        }
    };
}

angular.module('job-analytics')
    .factory('rmService', rmService);