/**
 * Created by ActiveEon Team on 18/04/2017.
 */

var mainCtrl = angular.module('service-automation', ['ngResource', 'spring-data-rest', 'angular-toArrayFilter', 'oitozero.ngSweetAlert', 'app-rest', 'pca-rest']);

function getSessionId() {
    return localStorage['pa.session'];
}


mainCtrl
    .value('pcaServiceUrl', null)
    .value('schedulerRestUrl', null)
    .value('appCatalogWorkflowsUrl', null)
    .value('appCatalogBucketsUrl', null)
    .value('configViews', null);

// ---------- Utilities -----------
function getProperties ($http, $location) {


    $http.get('resources/config.json')
        .success(function (response) {
            pcaServiceUrl = angular.toJson(response.confServer.pcaServiceUrl, true);
            schedulerRestUrl = angular.toJson(response.confServer.schedulerRestUrl, true);
            appCatalogBucketsUrl = angular.toJson($location.$$protocol + '://' + $location.$$host + ":" + $location.port() + "/catalog/buckets/?kind=workflow");
            appCatalogWorkflowsUrl = angular.toJson($location.$$protocol + '://' + $location.$$host + ":" + $location.port() + "/catalog/buckets/" + response.view[0].catalog.bucketid + "/resources");
            configViews = angular.toJson(response.view, true);

            localStorage['pcaServiceUrl'] = pcaServiceUrl;
            localStorage['schedulerRestUrl'] = schedulerRestUrl;
            localStorage['appCatalogWorkflowsUrl'] = appCatalogWorkflowsUrl;
            localStorage['appCatalogBucketsUrl'] = appCatalogBucketsUrl;
            localStorage['configViews'] = configViews;

            console.log('LoadingPropertiesService pcaServiceUrl set to ', pcaServiceUrl);
            console.log('LoadingPropertiesService schedulerRestUrl set to ', schedulerRestUrl);
            console.log('LoadingPropertiesService appCatalogWorkflowsUrl set to ', appCatalogWorkflowsUrl);
            console.log('LoadingPropertiesService appCatalogBucketsUrl set to ', appCatalogBucketsUrl);
            console.log('LoadingPropertiesService configViews set to ', configViews);

        })
        .error(function (response) {
            console.error('LoadingPropertiesService $http.get error', status, response);
        });
}




var isSessionValide = function ($http, sessionId) {
 return $http.get("../rest/rm/logins/sessionid/" + sessionId + "/userdata/").then(function(result){
  return result.data !=""
});
};


// ---------- Services ----------

mainCtrl.factory('LoadingPropertiesService', function ($http, $location) {
    console.log("LoadingPropertiesService factory");

    getProperties($http, $location);

    return {
        doNothing: function () {
            return null;
        }
    };

});

// factory used to get config data values from resources/config.json
mainCtrl.factory('loadingConfigData', function($http, $location){
    console.log("Loading configData values");
    getProperties($http, $location);
    return {
        doNothing: function () {
            return null;
        }
    };
});

// --------------- Controller -----------------

// controller used in navigation.html :
mainCtrl.controller('navBarController', function ($scope, loadingConfigData){
    console.log('config de navBarController:');
    $scope.view = JSON.parse(localStorage['configViews']);
    console.log($scope.view);
});

mainCtrl.controller('loginController', function ($scope, $state, SchedulerService, PCACatalogService, PCAProcessService, PCARunningServicesService, PCANodeSourcesService, APPCatalog) {

    $scope.login = function () {
        var username = $scope.username;
        var password = $scope.password;

        localStorage['pa.login'] = username;
        $scope.main.userName = localStorage['pa.login'];

        SchedulerService.doLogin(username, password)
            .success(function (response) {
                var sessionid = getSessionId();
                console.log("loginController pa.session " + sessionid);
                if (sessionid != undefined) {
                    console.log("loginController logged");
                    $state.go('portal.main'); // where to defined the homepage.
                }
            })
            .error(function (response) {
                console.log("loginController error doLogin");
            });
    };
});

mainCtrl.controller('logoutController', function ($rootScope, $scope, $state) {
    $scope.logout = function () {
        localStorage.removeItem('pa.session');
        // Stop all PCA refreshing services
        $rootScope.$broadcast('event:StopRefreshing');
        console.log("event:StopRefreshing emitted");

        $state.go('login');
    };
});
