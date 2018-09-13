/**
 * Created by ActiveEon Team on 18/04/2017.
 */

var mainModule = angular.module('main', ['ngResource', 'spring-data-rest', 'angular-toArrayFilter', 'oitozero.ngSweetAlert']);

function getSessionId() {
    return localStorage['pa.session'];
}

// ---------- Utilities -----------
function getProperties ($http, $location) {
    return $http.get('resources/config.json')
        .success(function (response) {
            var pcaServiceUrl = angular.toJson(response.confServer.pcaServiceUrl, true);
            var schedulerRestUrl = angular.toJson(response.confServer.schedulerRestUrl, true);
            var rmRestUrl = angular.toJson(response.confServer.rmRestUrl, true);
            var notificationServiceUrl = angular.toJson(response.confServer.notificationServiceUrl, true);
            var catalogServiceUrl = angular.toJson(response.confServer.catalogServiceUrl, true);
            var cloudAutomationQueryPeriod = angular.toJson(response.cloudAutomationQueryPeriod, true);
            var cloudWatchPortalQueryPeriod = angular.toJson(response.cloudWatchPortalQueryPeriod, true);
            var notificationPortalQueryPeriod = angular.toJson(response.notificationPortalQueryPeriod, true);
            var genericCatalogPortalQueryPeriod = angular.toJson(response.genericCatalogPortalQueryPeriod, true);
            var jobPlannerQueryPeriod = angular.toJson(response.jobPlannerQueryPeriod, true);
            var appCatalogBucketsUrl =angular.toJson(response.confServer.catalogServiceUrl+"/buckets/?kind=workflow", true);
            var appCatalogWorkflowsUrl = angular.toJson($location.$$protocol + '://' + $location.$$host + ":" + $location.port() + "/catalog/buckets/" + response.view[0].catalog.bucketName + "/resources");
            var jobPlannerServiceUrl = angular.toJson(response.confServer.jobPlannerServiceUrl, true);
            var cloudWatchServiceUrl = angular.toJson(response.confServer.cloudWatchServiceUrl, true);
            var configViews = angular.toJson(response.view, true);
            var appUrl = angular.toJson($location.$$protocol + '://' + $location.$$host + ":" + $location.port());
            var studioUrl = angular.toJson($location.$$protocol + '://' + $location.$$host + ":" + $location.port() +'/studio');

            localStorage['pcaServiceUrl'] = pcaServiceUrl;
            localStorage['schedulerRestUrl'] = schedulerRestUrl;
            localStorage['rmRestUrl'] = rmRestUrl;
            localStorage['notificationServiceUrl'] = notificationServiceUrl;
            localStorage['catalogServiceUrl'] = catalogServiceUrl;
            localStorage['genericCatalogPortalQueryPeriod'] = genericCatalogPortalQueryPeriod;
            localStorage['notificationPortalQueryPeriod'] = notificationPortalQueryPeriod;
            localStorage['cloudAutomationQueryPeriod'] = cloudAutomationQueryPeriod;
            localStorage['cloudWatchPortalQueryPeriod'] = cloudWatchPortalQueryPeriod;
            localStorage['jobPlannerQueryPeriod'] = jobPlannerQueryPeriod;
            localStorage['appCatalogWorkflowsUrl'] = appCatalogWorkflowsUrl;
            localStorage['appCatalogBucketsUrl'] = appCatalogBucketsUrl;
            localStorage['configViews'] = configViews;
            localStorage['jobPlannerServiceUrl'] = jobPlannerServiceUrl;
            localStorage['cloudWatchServiceUrl'] = cloudWatchServiceUrl;
            localStorage['appUrl'] = appUrl;
            localStorage['studioUrl'] = studioUrl;
        })
        .error(function (response) {
            console.error('LoadingPropertiesService $http.get error', status, response);
        });
}

var isSessionValide = function ($http, sessionId, $location) {
    return getProperties($http, $location).then(function () {
        var rmRestUrl = localStorage['rmRestUrl'];
        var userDataUrl = JSON.parse(rmRestUrl) + "logins/sessionid/" + sessionId + "/userdata/";
        return $http.get(userDataUrl).then(function(result) {
            return result.data !="";
        });
    });
};


// factory used to get config data values from resources/config.json
mainModule.factory('loadingConfigData', function($http, $location){
    console.log("Loading configData values");
    getProperties($http, $location);
    return {
        doNothing: function () {
            return null;
        }
    };
});

// get the username cookie variable

function getCookie(name) {
    var cookieName = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(cookieName) == 0) return c.substring(cookieName.length, c.length);
    }
    return null;
}

mainModule.factory('MainService', function ($http, $interval, $rootScope, $state) {
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

// --------------- Controllers -----------------

mainModule.controller('mainController', function ($http, $scope, $rootScope, $state, $location, $interval) {
    this.$onInit = function () {
        $scope.main.userName = localStorage['pa.login'];
        $scope.startRegularCheckSession()
    }

    $scope.startRegularCheckSession = function(){
        if (!$scope.checkSessionInterval)
            $scope.checkSessionInterval = $scope.$interval(checkSession, 30000);
    }

    function checkSession() {
        var sessionId = getSessionId()
        if (!sessionId) {
            $scope.closeSession();
        } else {
            $http.get(JSON.parse(localStorage['schedulerRestUrl']) + 'isconnected/', { headers: { 'sessionID': sessionId } })
                .then(function (response) {
                    if (!response) {
                        $scope.closeSession();
                    }
                })
                .catch(function (response) {
                    console.error("Error checking if session is valid:", response);
            });
        }
    }

    $scope.stopRegularCheckSession = function(){
        $interval.cancel($scope.checkSessionInterval);
        $scope.checkSessionInterval = undefined;
    }

    $scope.closeSession = function() {
        $state.go('login');
        $scope.stopRegularCheckSession();
        $rootScope.$broadcast('event:StopRefreshing');
    }
});

// controller used in navigation.html :
mainModule.controller('navBarController', function ($scope, $http, $interval){
    this.$onInit = function () {
        $scope.view = JSON.parse(localStorage['configViews']);
        $scope.docLink = "http://doc.activeeon.com/" ;
        $http.get('resources/config.json')
            .success(function (response) {
                $scope.dashboardVersion = response.proactiveDashboardVersion;
                if ($scope.dashboardVersion.indexOf("SNAPSHOT") > -1){
                    $scope.docLink = $scope.docLink + "dev";
                }
                else{
                    $scope.docLink = $scope.docLink + $scope.dashboardVersion;
                }
            })
            .error(function (response) {
                $scope.dashboardVersion = "not available";
        });
        $scope.notificationNavSpan = angular.element('#nav-span-notification-service');
        if($scope.notificationNavSpan.length>0) {
            $scope.newNotificationsLabel = angular.element('<div id="new-notifications-label" style="background:#d9534f;color:white;border-radius:10px;text-align:center;margin-left: 5px;padding: 0px 5px;"></div>');
            $scope.notificationNavSpan.append($scope.newNotificationsLabel)
            $scope.newNotificationsLabel.hide();
            startRegularUpdateNotificationLabel();
        }
    }

    $scope.displayAbout = function(){
        var windowLocation = window.location;
        var protocol = windowLocation.protocol;
        var host = windowLocation.host;
        var result = protocol + "//" + host + "/rest";

        $scope.restUrl = result;
        $scope.year = new Date().getFullYear();
        $('#about-modal').modal('show');
    }

    function startRegularUpdateNotificationLabel() {
        queryNotificationService();
        $scope.intervalNotificationUpdate = $scope.$interval(queryNotificationService, localStorage['notificationPortalQueryPeriod']);
    }

    function queryNotificationService() {
        $http.get(JSON.parse(localStorage['notificationServiceUrl']) + 'notifications/', { headers: { 'sessionID': getSessionId() } })
            .then(function (response) {
                updateNotificationsLabel(response.data);
            })
            .catch(function (response) {
                console.error("Error while querying notification service:", response);
            });
    }

    function updateNotificationsLabel(notifications){
        var nbNewNotifications = 0;
        angular.forEach(notifications, function(notification){
            if(!notification.validatedAt && notification.validation) {
                nbNewNotifications++;
            }
        });
        if(nbNewNotifications>0) {
            $scope.newNotificationsLabel.html(nbNewNotifications);
            $scope.newNotificationsLabel.show();
        } else {
            $scope.newNotificationsLabel.hide();
        }
    }

    this.$onDestroy = function() {
        if (angular.isDefined($scope.intervalNotificationUpdate)) {
            $interval.cancel($scope.intervalNotificationUpdate);
            $scope.intervalNotificationUpdate = undefined;
        }
    }
});

mainModule.controller('loginController', function ($scope, $state, MainService, $stateParams, $location) {
    $scope.redirectsTo = $stateParams.redirectsTo;
    var host = $location.host();
    $scope.showLinkAccountCreation =  (host === 'try.activeeon.com' || host === 'azure-try.activeeon.com');
    var username = getCookie('username');
    if (username == "null") {
        $scope.username = localStorage['pa.login'];
    } else {
        $scope.username = username;
    }
    $scope.login = function () {
        var username = $scope.username;
        var password = $scope.password;

        localStorage['pa.login'] = username;
        $scope.main.userName = localStorage['pa.login'];

        MainService.doLogin(username, password)
            .success(function (response) {
                var sessionid = getSessionId();
                console.log("loginController pa.session " + sessionid);
                if (sessionid != undefined) {
                    if ($scope.redirectsTo)
                        $location.path($scope.redirectsTo);
                    else
                        $state.go('portal.subview1');
                }
                $scope.errorMessage = undefined;
                $scope.startRegularCheckSession();
            })
            .error(function (response) {
                try {
                    var error = JSON.parse(response);
                    $scope.errorMessage = error.errorMessage;
                    if (error.httpErrorCode === 404) {
                        if (error.stackTrace.indexOf("login.LoginException") >= 0) {
                            $scope.errorMessage = "Invalid Login or Password";
                        } else {
                            $scope.errorMessage = "The server is not available, please try again later.";
                        }

                    }
                } catch (e) {
                    $scope.errorMessage = "Please try again later."
                }

            });
    };
});

mainModule.controller('logoutController', function ($scope, $state) {
    $scope.logout = function () {
        localStorage.removeItem('pa.session');
        $scope.closeSession();
    };
});

mainModule.directive('ngRightClick', function($parse) {
    return {
        restrict: 'A',
        link: {
            //the pre function will determine which item of the contextual menu will be displayed
            pre: function(scope, element, attrs) {
                //create a function that will invoke ngRightClick value
                var fn = $parse(attrs.ngRightClick);
                //attach the contextmenu event to the element
                element.bind('contextmenu', function(event) {
                    scope.$apply(function(scope) {
                        //cancel the os default contextual menu
                        event.preventDefault();

                        //call the function that invoke the function included in ngRightClick value
                        var appliedFunction = fn(scope, {$event:event});

                        //call the function returned by the method in ngRightClick value
                        appliedFunction(event);
                    });
                });
            },

            // the post function position the contextual menu regarding the click position and the contextual menu size
            // this function must be executed after the ng-if directives because they will change the contextual menu size
            post: function(scope, element, attrs) {
                //create a function that will invoke ngRightClick value
                var fn = $parse(attrs.ngRightClick);
                element.bind('contextmenu', function(event) {
                    scope.moveContextualMenu(event)
                });
            }
        }
    }
});

mainModule .directive('ngWheel', ['$parse', function($parse){
    return {
        restrict: 'A',
        link: function(scope, element, attr) {
            var expr = $parse(attr['ngWheel']);
            element.bind('wheel', function(event){
                scope.$apply(function() {
                    expr(scope);
                });
            });

        }
    };
}]);