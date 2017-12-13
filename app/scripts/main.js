/**
 * Created by ActiveEon Team on 18/04/2017.
 */

var mainCtrl = angular.module('main', ['ngResource', 'spring-data-rest', 'angular-toArrayFilter', 'oitozero.ngSweetAlert']);

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
            appCatalogBucketsUrl =angular.toJson("http://localhost:8080/catalog/buckets/?kind=workflow", true);
            appCatalogWorkflowsUrl = angular.toJson("http://localhost:8080/catalog/buckets/" + response.view[0].catalog.bucketid + "/resources", true);
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

        $http.get('resources/wcportal.properties')
        .success(function (response) {
            workflowCatalogPortalQueryPeriod = response.workflowCatalogPortalQueryPeriod;
            catalogServiceUrl = angular.toJson(response.catalogServiceUrl, true);
            schedulerRestUrl = angular.toJson(response.schedulerRestUrl, true);

            localStorage['workflowCatalogPortalQueryPeriod'] = workflowCatalogPortalQueryPeriod;
            localStorage['catalogServiceUrl'] = catalogServiceUrl;

            console.log('LoadingPropertiesService has loaded workflowCatalogPortalQueryPeriod=', workflowCatalogPortalQueryPeriod);
            console.log('LoadingPropertiesService has loaded catalogServiceUrl=', catalogServiceUrl);
            console.log('LoadingPropertiesService has loaded schedulerRestUrl=', schedulerRestUrl);
        })
        .error(function (response) {
            console.error('Error loading workflow catalog portal configuration:', response);
        });

         $http.get('resources/nsportal.properties')
        .success(function (response) {
            notificationPortalQueryPeriod = response.notificationPortalQueryPeriod;
            notificationServiceUrl = JSON.parse(angular.toJson(response.notificationServiceUrl, false));
            schedulerRestUrl = JSON.parse(angular.toJson(response.schedulerRestUrl, true));

            localStorage['notificationPortalQueryPeriod'] = notificationPortalQueryPeriod;
            localStorage['notificationServiceUrl'] = notificationServiceUrl;

            console.log('LoadingPropertiesService has loaded notificationPortalQueryPeriod=', notificationPortalQueryPeriod);
            console.log('LoadingPropertiesService has loaded notificationServiceUrl=', notificationServiceUrl);
            console.log('LoadingPropertiesService has loaded schedulerRestUrl=', schedulerRestUrl);
        })
        .error(function (response) {
            console.error('Error loading notification portal configuration:', response);
        });
}

var isSessionValide = function ($http, sessionId) {
    return $http.get("http://localhost:8080/rest/rm/logins/sessionid/" + sessionId + "/userdata/").then(function(result){
        return result.data !=""
    });
};


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

mainCtrl.factory('MainService', function ($http, $interval, $rootScope, $state, LoadingPropertiesService) {
    function doLogin(userName, userPass) {
        var authData = $.param({'username': userName, 'password': userPass});
        var authConfig = {
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            transformResponse: []
        };
        // because of that wrong response type in that sched resource !!!
        return $http.post(JSON.parse(localStorage['schedulerRestUrl']) + 'login', authData, authConfig)
            .success(function (response) {
                if (response.match(/^[A-Za-z0-9]+$/)) {
                    localStorage['pa.session'] = response;
                    console.log('doLogin authentication has succeeded:', response);
                }
                else {
                    console.log('doLogin authentication has failed:', response);
                }
            })
            .error(function (response) {
                console.error('doLogin authentication error:', status, response);
            });
    }

    return {
        doLogin: function (userName, userPass) {
            return doLogin(userName, userPass);
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

mainCtrl.controller('loginController', function ($scope, $state, MainService, PCACatalogService, PCAProcessService, PCARunningServicesService, PCANodeSourcesService, APPCatalog) {

    $scope.login = function () {
        var username = $scope.username;
        var password = $scope.password;

        localStorage['pa.login'] = username;
        $scope.main.userName = localStorage['pa.login'];
        console.log("------------welcome "+localStorage['pa.login']);

        MainService.doLogin(username, password)
            .success(function (response) {
                var sessionid = getSessionId();
                console.log("loginController pa.session " + sessionid);
                if (sessionid != undefined) {
                    console.log("loginController logged");
                    $state.go('portal.subview1'); // where to defined the homepage.
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