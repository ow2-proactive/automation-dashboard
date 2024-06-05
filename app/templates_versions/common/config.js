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
            url: '/login',
            templateUrl: '/automation-dashboard/views/login.html',
            authenticate: false,
            params: {
                redirectsTo: ''
            }
        })
        .state('portal', {
            abstract: true,
            url: '/portal',
            templateUrl: '/automation-dashboard/views/common/content.html',
            authenticate: true
        })
        .state('job-info', {
            url: '/job-info?jobid&tab',
            data: {
                pageTitle: 'Job details'
            },
            templateUrl: '/automation-dashboard/views/workflow-execution/workflow-execution/templates/job-details-container.html',
            css: 'styles/workflow-execution/workflow_execution_custom_style.css',
            authenticate: true
        })
        .state('submit', {
            url: '/submit?sessionid&name&bucket',
            data: {
                url: 'Submit',
            },
            templateUrl: '/automation-dashboard/views/common/submission-window-view.html',
            css: 'styles/workflow-execution/workflow_execution_custom_style.css',
            authenticate: true
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

        // Configure proxyName here
        const index = window.location.pathname.indexOf("automation-dashboard")
        const proxyNames = window.location.pathname.substring(0, index > 0 ? index - 1 : index);

        // Add a custom interceptor to modify outgoing requests
        $httpProvider.interceptors.push(function() {
            return {
                'request': function(config) {
                    if (config.url.startsWith("/")) {
                        config.url = proxyNames + config.url;
                    }
                    return config;
                }
            };
        });

    });

angular
    .module('inspinia')
    .run(function($rootScope, $state, $http, $location) {
        $rootScope.$on('$locationChangeStart', function(event) {
            if (!localStorage['pcaServiceUrl'] || !localStorage['schedulerRestUrl'] || !localStorage['notificationServiceUrl'] || !localStorage['catalogServiceUrl'] || !localStorage['appCatalogWorkflowsUrl'] || !localStorage['appCatalogBucketsUrl'] || !localStorage['configViews'] || !localStorage['rmRestUrl'] || !localStorage['restUrl']) {
                getProperties($http, $location);
            }

            if (window.location.href.includes('submit')) {
                // This will allow us to redirect to the current URL when we connect from the login page
                sessionStorage.setItem('previousUrlBeforeLogin', window.location.href);
                // only when we try to open external window
                const paramsString = window.location.href.split("submit?")[1]
                const urlParams = new URLSearchParams(paramsString);
                const sessionId = urlParams.get('sessionid');
                if (sessionId && !localStorage['pa.session']) {
                    try {
                        localStorage.setItem('pa.session', sessionId);
                        $rootScope.$broadcast('checkSessionEvent')
                    } catch (e) {
                        throw new Error('Error while adding session id in the storage');
                    }
                }
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
