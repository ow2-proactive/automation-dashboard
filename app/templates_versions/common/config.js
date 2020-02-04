/**
 * INSPINIA - Responsive Admin Theme
 *
 * Inspinia theme use AngularUI Router to manage routing and views
 * Each view are defined as state.
 * Initial there are written stat for all view in theme.
 *
 */

function config($stateProvider, $urlRouterProvider) {

    $stateProvider
        .state('login', {
            url: "/login",
            templateUrl: "views/login.html",
            authenticate: false,
            params: {
                redirectsTo: ''
            }
        })
        .state('portal', {
            abstract: true,
            url: "/portal",
            templateUrl: "views/common/content.html",
            authenticate: true,
        })
    //!DO NOT EDIT! The following code related to subviews is automatically generated with grunt build. You can't modify it from here.
    //See 'replace' task in Gruntfile.js and subviews definition in enterpriseSubviews.json.

    //beginSubviewsStates

    //endSubviewsStates

}
angular
    .module('inspinia')
    .config(config)
    .run(function($rootScope, $state, $interval, $http, $location) {
        $rootScope.$state = $state;
        $rootScope.$interval = $interval;
    });

angular
    .module('inspinia')
    .config(function($httpProvider) {
        $httpProvider.defaults.headers.common = {};
        $httpProvider.defaults.headers.post = {};
        $httpProvider.defaults.headers.put = {};
        $httpProvider.defaults.headers.patch = {};
        $httpProvider.defaults.headers.get = {};
        $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
    });

angular
    .module('inspinia')
    .run(function($rootScope, $state, $http, $location) {
        $rootScope.$on('$locationChangeStart', function(event) {
            if (!localStorage['pcaServiceUrl'] || !localStorage['schedulerRestUrl'] || !localStorage['notificationServiceUrl'] || !localStorage['catalogServiceUrl'] || !localStorage['appCatalogWorkflowsUrl'] || !localStorage['appCatalogBucketsUrl'] || !localStorage['configViews'] || !localStorage['rmRestUrl'] || !localStorage['restUrl']) {
                getProperties($http, $location);
            }
            var myDataPromise = isSessionValide($http, getSessionId(), $location);
            myDataPromise.then(function(result) {
                if (!result && $location.$$url != '/login') {
                    event.preventDefault();
                    $rootScope.$broadcast('event:StopRefreshing');
                    return $state.go('login', {
                        redirectsTo: $location.$$url
                    });
                }
            });
        });
    });
