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
        .state('portal.subview1', {
            url: '/workflow-automation',
            data: {
                pageTitle: 'Workflow Automation'
            },
            templateUrl: 'views/workflow-automation/wf_automation.html',
            css: 'styles/workflow-automation/portal_custom_style.css',
            authenticate: true,
            onEnter: function(WFASchedulerService, WFACatalog) {
                initWorkflowAutomation(WFASchedulerService, WFACatalog);
            },
            onExit: function($rootScope) {
                $rootScope.$broadcast('event:StopRefreshing');
            }
        })

        .state('portal.subview2', {
            url: '/notification-portal',
            data: {
                pageTitle: 'Notification Service'
            },
            templateUrl: 'views/notification-portal/ns-view.html',
            css: 'styles/notification-portal/notifportal_custom_style.css',
            authenticate: true,
            onEnter: function(NotificationService) {
                initNotificationPortal(NotificationService);
            },
            onExit: function($rootScope) {
                $rootScope.$broadcast('event:StopRefreshing');
            }
        })

        .state('portal.subview3', {
            url: '/workflow-catalog',
            data: {
                pageTitle: 'Workflow Catalog'
            },
            templateUrl: 'views/workflow-catalog/workflow_catalog.html',
            css: 'styles/workflow-catalog/wcportal_custom_style.css',
            authenticate: true,
            onEnter: function(WorkflowCatalogService) {
                initWorkflowCatalog(WorkflowCatalogService);
            },
            onExit: function($rootScope) {
                $rootScope.$broadcast('event:StopRefreshing');
            }
        })

        .state('portal.subview4', {
            url: '/cloud-automation',
            data: {
                pageTitle: 'Cloud Automation'
            },
            templateUrl: 'views/cloud-automation/page_not_available_cloud_automation.html',
            authenticate: false,
        })

        .state('portal.subview5', {
            url: '/job-planner-calendar-def',
            data: {
                pageTitle: 'Job Planner (alpha)'
            },
            templateUrl: 'views/job-planner-calendar-def/execution_calendars.html',
            css: 'styles/job-planner-calendar-def/portal_custom_style.css',
            authenticate: true,
            onEnter: function(ExecutionCalendarsService) {
                initJobPlannerEC(ExecutionCalendarsService);
            },
            onExit: function($rootScope) {
                $rootScope.$broadcast('event:StopRefreshing');
            }
        })

        .state('portal.subview6', {
            url: '/job-planner-calendar-def-workflows',
            data: {
                pageTitle: 'Calendar Associations'
            },
            templateUrl: 'views/job-planner-calendar-def-workflows/template.html',
            css: 'styles/job-planner-calendar-def-workflows/portal_custom_style.css',
            authenticate: true,
            onEnter: function(JobPlannerService) {
                initJobPlanner(JobPlannerService);
            },
            onExit: function($rootScope) {
                $rootScope.$broadcast('event:StopRefreshing');
            }
        })

        .state('portal.subview7', {
            url: '/job-planner-execution-planning',
            data: {
                pageTitle: 'Execution Planning'
            },
            templateUrl: 'views/job-planner-execution-planning/execution_planning.html',
            css: 'styles/job-planner-execution-planning/portal_custom_style.css',
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
            if (!localStorage['pcaServiceUrl'] || !localStorage['schedulerRestUrl'] ||
                !localStorage['notificationServiceUrl'] || !localStorage['catalogServiceUrl'] ||
                !localStorage['appCatalogWorkflowsUrl'] || !localStorage['appCatalogBucketsUrl'] ||
                !localStorage['configViews'] || !localStorage['rmRestUrl']) {
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
            if ($state.current.name == '') {
                $state.go('portal.subview1');
            }
        });
    });
