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
            authenticate: false
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
        .state('portal.subview1', {
            url: '/cloud-automation',
            data: {
                pageTitle: 'Cloud automation'
            },
            templateUrl: 'cloud-automation/views/page_not_available_cloud_automation.html',
            authenticate: false,
        })

        .state('portal.subview2', {
            url: '/workflow-automation',
            data: {
                pageTitle: 'Workflow automation'
            },
            title: 'Workflow automation',
            templateUrl: 'workflow-automation/views/minor.html',
            css: 'workflow-automation/styles/portal_custom_style.css',
            authenticate: true,
            onEnter: function(APPSchedulerService, APPCatalog) {
                initWorkflowAutomation(APPSchedulerService, APPCatalog);
            },
            onExit: function($rootScope) {
                $rootScope.$broadcast('event:StopRefreshing');
            }
        })

        .state('portal.subview3', {
            url: '/workflow-catalog',
            data: {
                pageTitle: 'Workflow catalog'
            },
            title: 'Workflow catalog',
            templateUrl: 'workflow-catalog/views/workflow_catalog.html',
            css: 'workflow-catalog/styles/wcportal_custom_style.css',
            authenticate: true,
            onEnter: function(WorkflowCatalogService) {
                initWorkflowCatalog(WorkflowCatalogService);
            },
            onExit: function($rootScope) {
                $rootScope.$broadcast('event:StopRefreshing');
            }
        })

        .state('portal.subview4', {
            url: '/notification-portal',
            data: {
                pageTitle: 'Notification portal'
            },
            title: 'Notification portal',
            templateUrl: 'notification-portal/views/minor.html',
            css: 'notification-portal/styles/notifportal_custom_style.css',
            authenticate: true,
        });
    //endSubviewsStates

}
angular
    .module('inspinia')
    .config(config)
    .run(function($rootScope, $state, $interval) {
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
            if (localStorage['pcaServiceUrl'] == undefined || angular.isObject(localStorage['schedulerRestUrl']) == false || localStorage['appCatalogWorkflowsUrl'] == undefined || localStorage['appCatalogBucketsUrl'] == undefined) {
                getProperties($http, $location);
            }
            var myDataPromise = isSessionValide($http, getSessionId());
            myDataPromise.then(function(result) {

                if (!result) {
                    event.preventDefault();
                    $rootScope.$broadcast('event:StopRefreshing');
                    return $state.go('login');
                }
            });
            if ($state.current.name == '') {
                $state.go('portal.subview1');
            }

        })
    });
