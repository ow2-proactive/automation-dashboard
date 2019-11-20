/**
 * Created by ActiveEon Team on 18/04/2017.
 */

var mainModule = angular.module('main', ['ngResource', 'spring-data-rest', 'angular-toArrayFilter', 'oitozero.ngSweetAlert', 'ngSanitize', 'pascalprecht.translate']);

function getSessionId() {
    return localStorage['pa.session'];
}

// ---------- Utilities -----------
function getProperties($http, $location) {
    return $http.get('resources/config.json')
        .success(function (response) {
            var pcaServiceUrl = angular.toJson(response.confServer.pcaServiceUrl, true);
            var schedulerRestUrl = angular.toJson(response.confServer.schedulerRestUrl, true);
            var rmRestUrl = angular.toJson(response.confServer.rmRestUrl, true);
            var notificationServiceUrl = angular.toJson(response.confServer.notificationServiceUrl, true);
            var catalogServiceUrl = angular.toJson(response.confServer.catalogServiceUrl, true);
            var cloudAutomationQueryPeriod = angular.toJson(response.cloudAutomationQueryPeriod, true);
            var wfAutomationLast24hHistoryPeriod = angular.toJson(response.wfAutomationLast24hHistoryPeriod, true);
            var cloudWatchPortalQueryPeriod = angular.toJson(response.cloudWatchPortalQueryPeriod, true);
            var jobAnalyticsPortalRefreshRate = angular.toJson(response.jobAnalyticsPortalRefreshRate, true);
            var notificationPortalQueryPeriod = angular.toJson(response.notificationPortalQueryPeriod, true);
            var genericCatalogPortalQueryPeriod = angular.toJson(response.genericCatalogPortalQueryPeriod, true);
            var jobPlannerQueryPeriod = angular.toJson(response.jobPlannerQueryPeriod, true);
            var appCatalogBucketsUrl = angular.toJson(response.confServer.catalogServiceUrl + '/buckets/?kind=workflow', true);
            var appCatalogWorkflowsUrl = angular.toJson($location.$$protocol + '://' + $location.$$host + ':' + $location.port() + '/catalog/buckets/' + response.view[0].catalog.bucketName + '/resources');
            var jobPlannerServiceUrl = angular.toJson(response.confServer.jobPlannerServiceUrl, true);
            var cloudWatchServiceUrl = angular.toJson(response.confServer.cloudWatchServiceUrl, true);
            var jobAnalyticsServiceUrl = angular.toJson(response.confServer.jobAnalyticsServiceUrl, true);
            var configViews = angular.toJson(response.view, true);
            var appUrl = angular.toJson($location.$$protocol + '://' + $location.$$host + ':' + $location.port());
            var studioUrl = angular.toJson($location.$$protocol + '://' + $location.$$host + ':' + $location.port() + '/studio');
            var schedulerPortalUrl = angular.toJson($location.$$protocol + '://' + $location.$$host + ':' + $location.port() + '/scheduler');
            var proactiveLanguage = angular.toJson(response.proactiveLanguage, true).replace(/"/g, '');

            localStorage['pcaServiceUrl'] = pcaServiceUrl;
            localStorage['schedulerRestUrl'] = schedulerRestUrl;
            localStorage['rmRestUrl'] = rmRestUrl;
            localStorage['notificationServiceUrl'] = notificationServiceUrl;
            localStorage['catalogServiceUrl'] = catalogServiceUrl;
            localStorage['genericCatalogPortalQueryPeriod'] = genericCatalogPortalQueryPeriod;
            localStorage['notificationPortalQueryPeriod'] = notificationPortalQueryPeriod;
            localStorage['cloudAutomationQueryPeriod'] = cloudAutomationQueryPeriod;
            localStorage['cloudWatchPortalQueryPeriod'] = cloudWatchPortalQueryPeriod;
            localStorage['wfAutomationLast24hHistoryPeriod'] = wfAutomationLast24hHistoryPeriod;
            localStorage['jobAnalyticsPortalRefreshRate'] = jobAnalyticsPortalRefreshRate;
            localStorage['jobPlannerQueryPeriod'] = jobPlannerQueryPeriod;
            localStorage['appCatalogWorkflowsUrl'] = appCatalogWorkflowsUrl;
            localStorage['appCatalogBucketsUrl'] = appCatalogBucketsUrl;
            localStorage['configViews'] = configViews;
            localStorage['jobPlannerServiceUrl'] = jobPlannerServiceUrl;
            localStorage['cloudWatchServiceUrl'] = cloudWatchServiceUrl;
            localStorage['jobAnalyticsServiceUrl'] = jobAnalyticsServiceUrl;
            localStorage['appUrl'] = appUrl;
            localStorage['studioUrl'] = studioUrl;
            localStorage['schedulerPortalUrl'] = schedulerPortalUrl;
            if (!localStorage['proactiveLanguage']) {
                localStorage['proactiveLanguage'] = proactiveLanguage;
            }
        })
        .error(function (response) {
            console.error('LoadingPropertiesService $http.get error', status, response);
        });
}

var isSessionValide = function ($http, sessionId, $location) {
    return getProperties($http, $location).then(function () {
        var rmRestUrl = localStorage['rmRestUrl'];
        var userDataUrl = JSON.parse(rmRestUrl) + 'logins/sessionid/' + sessionId + '/userdata/';
        return $http.get(userDataUrl).then(function (result) {
            return result.data !== '';
        });
    });
};


// factory used to get config data values from resources/config.json
mainModule.factory('loadingConfigData', function ($http, $location) {
    getProperties($http, $location);
    return {
        doNothing: function () {
            return null;
        }
    };
});

// get the username cookie variable

function getCookie(name) {
    var cookieName = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(cookieName) === 0) return c.substring(cookieName.length, c.length);
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
                } else {
                    console.error('doLogin authentication has failed:', response);
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

mainModule.run(['$rootScope', function ($rootScope) {
    $rootScope.lang = 'en';
}]);

mainModule.config(function ($translateProvider, $translatePartialLoaderProvider) {
    $translatePartialLoaderProvider.addPart('resources');
    $translateProvider.useLoader('$translatePartialLoader', {
        urlTemplate: '{part}/locales/locale-{lang}.json'
    })
        .preferredLanguage(localStorage['proactiveLanguage']);
    $translateProvider.useSanitizeValueStrategy('escapeParameters');
});

// --------------- Controllers -----------------

mainModule.controller('mainController', function ($http, $scope, $rootScope, $state, $location, $interval, $translate) {

    this.$onInit = function () {
        $scope.main.userName = localStorage['pa.login'];
        $scope.startRegularCheckSession();
        $scope.contextDisplay = false;
        // contextPosition enables directive to specify where the context menu was opened
        $scope.contextPosition = '';
    };

    $scope.changeLanguage = function (key) {
        $rootScope.lang = key;
        $translate.use(key);
        localStorage['proactiveLanguage'] = key;
    };

    //Set the selected language as language dropdown value
    $scope.selectedLanguage = function () {
        $('#language-dropdown').find('a').click(function () {
            var language = $(this).text();
            var flagObject = $(this).find('img').attr('src');
            var flag = '<img alt="' + language + '" style="height:25px;padding-left: 0px;padding-right: 5px;padding-top: 4px;padding-bottom: 4px;" src="' + flagObject + '"/>';
            $('#selected').html(flag + language);
        });
    };

    $scope.startRegularCheckSession = function () {
        if (!$scope.checkSessionInterval) {
            $scope.checkSessionInterval = $scope.$interval(checkSession, 30000);
        }
    };

    function checkSession() {
        var sessionId = getSessionId()
        if (!sessionId) {
            $scope.closeSession();
        } else {
            $http.get(JSON.parse(localStorage['schedulerRestUrl']) + 'isconnected/', {headers: {'sessionID': sessionId}})
                .then(function (response) {
                    if (!response) {
                        $scope.closeSession();
                    }
                })
                .catch(function (response) {
                    console.error('Error checking if session is valid:', response);
                });
        }
    }

    $scope.stopRegularCheckSession = function () {
        $interval.cancel($scope.checkSessionInterval);
        $scope.checkSessionInterval = undefined;
    };

    $scope.closeSession = function () {
        $state.go('login');
        $scope.stopRegularCheckSession();
        $rootScope.$broadcast('event:StopRefreshing');
    };

    $scope.displayContextualMenu = function (clickEvent, position) {
        $scope.contextPosition = position;
        $scope.contextDisplay = true;
        clickEvent.stopPropagation();
    };

    $scope.hideContextualMenu = function () {
        $scope.contextDisplay = false;
    };

    // Check if position match with the position set by displayContextualMenu
    $scope.isContextView = function (position) {
        return $scope.contextPosition === position;
    };

    // Move the contextual menu near the click according to its position in the window
    $scope.moveContextualMenu = function (clickEvent) {

        var contextMenuHeight = angular.element('#context-menu')[0].offsetHeight
        //if contextual menu will get out of the panel catalog-tab-content, we display it upper
        if (clickEvent['clientY'] + contextMenuHeight < window.innerHeight) {
            angular.element('#context-menu').css('top', clickEvent['clientY'] + 'px')
        } else {
            angular.element('#context-menu').css('top', (clickEvent['clientY'] - contextMenuHeight) + 'px')
        }

        var contextMenuWidth = angular.element('#context-menu')[0].offsetWidth
        //if contextual menu will get out of the panel catalog-tab-content, we display it upper
        if (clickEvent['clientX'] + contextMenuWidth < window.innerWidth) {
            angular.element('#context-menu').css('left', clickEvent['clientX'] + 'px')
        } else {
            angular.element('#context-menu').css('left', (clickEvent['clientX'] - contextMenuWidth) + 'px')
        }

    }
});

// controller used in navigation.html :
mainModule.controller('navBarController', function ($scope, $rootScope, $http, $interval) {
    this.$onInit = function () {
        setDefaultSelectedLanguage(localStorage['proactiveLanguage']);
        $scope.view = JSON.parse(localStorage['configViews']);
        $scope.docLink = '/doc/';
        $http.get('resources/config.json')
            .success(function (response) {
                $scope.dashboardVersion = response.proactiveDashboardVersion;
            })
            .error(function (response) {
                $scope.dashboardVersion = 'not available';
            });
        $scope.notificationNavSpan = angular.element('#nav-span-notifications');
        if ($scope.notificationNavSpan.length) {
            $scope.newNotificationsLabel = angular.element('<div id="new-notifications-label" style="background:#d9534f;color:white;border-radius:10px;text-align:center;margin-left: 5px;padding: 0px 5px;"></div>');
            $scope.notificationNavSpan.append($scope.newNotificationsLabel);
            $scope.newNotificationsLabel.hide();
            startRegularUpdateNotificationLabel();
        }
    };

    $scope.displayAbout = function () {
        var windowLocation = window.location;
        var protocol = windowLocation.protocol;
        var host = windowLocation.host;
        var result = protocol + '//' + host + '/rest';

        $scope.restUrl = result;
        $scope.year = new Date().getFullYear();
        $('#about-modal').modal('show');
    };

    function startRegularUpdateNotificationLabel() {
        if (!$scope.intervalNotificationUpdate) {
            $scope.intervalNotificationUpdate = $scope.$interval(queryNotificationService, localStorage['notificationPortalQueryPeriod']);
        }
        queryNotificationService();
    }

    function stopRegularUpdateNotificationLabel() {
        $interval.cancel($scope.intervalNotificationUpdate);
        $scope.intervalNotificationUpdate = undefined;
    }

    function queryNotificationService() {
        var eventsUrlPrefix = JSON.parse(localStorage['notificationServiceUrl']) + 'notifications';
        $http.get(eventsUrlPrefix, { headers: { 'sessionID': getSessionId() } })
            .success(function (response) {
                updateNotificationsLabel(response);
            })
            .error(function (response) {
                console.error('Error while querying notification service: ', response);
            });
    }

    $rootScope.$on('event:notificationsDestroyed', function () {
        startRegularUpdateNotificationLabel();
    });

    $rootScope.$on('event:notificationsInitialized', function () {
        stopRegularUpdateNotificationLabel();
    });

    $rootScope.$on('event:updatedNotificationsCount', function (event, data) {
        if(data['count']) {
            $scope.newNotificationsLabel.html(data['count']);
            $scope.newNotificationsLabel.show();
        } else {
            $scope.newNotificationsLabel.hide();
        }
    });

    function updateNotificationsLabel(notifications){
        var nbNewNotifications = 0;
        angular.forEach(notifications, function(notification){
            if (!notification.hasRead) {
                nbNewNotifications++;
            }
        });
        if(nbNewNotifications) {
            $scope.newNotificationsLabel.html(nbNewNotifications);
            $scope.newNotificationsLabel.show();
        } else {
            $scope.newNotificationsLabel.hide();
        }
    }

    //Set the locally stored language as default value for the language dropdown menu
    function setDefaultSelectedLanguage(language) {
        var lang = $('#' + language + '').text();
        var flagObject = $('#' + language + '').find('img').attr('src');
        var flag = '<img alt="' + language + '"style="height:25px;padding-left: 0px;padding-right: 5px;padding-top: 4px;padding-bottom: 4px;" src="' + flagObject + '"/>';
        $('#selected').html(flag + lang);
    }

    this.$onDestroy = function () {
        if (angular.isDefined($scope.intervalNotificationUpdate)) {
            $interval.cancel($scope.intervalNotificationUpdate);
            $scope.intervalNotificationUpdate = undefined;
        }
    }
});

mainModule.controller('loginController', function ($scope, $state, MainService, $stateParams, $location) {
    $scope.redirectsTo = $stateParams.redirectsTo;
    var host = $location.host();
    $scope.showLinkAccountCreation = (host === 'try.activeeon.com' || host === 'azure-try.activeeon.com');
    var username = getCookie('username');
    if (username === 'null') {
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
                if (sessionid) {
                    if ($scope.redirectsTo) {
                        $location.path($scope.redirectsTo);
                    } else {
                        $state.go('portal.subview1');
                    }
                }
                $scope.errorMessage = undefined;
                $scope.startRegularCheckSession();
            })
            .error(function (response) {
                try {
                    var error = JSON.parse(response);
                    $scope.errorMessage = error.errorMessage;
                    if (error.httpErrorCode === 404) {
                        if (error.stackTrace.indexOf('login.LoginException') >= 0) {
                            $scope.errorMessage = 'Invalid Login or Password';
                        } else {
                            $scope.errorMessage = 'The server is not available, please try again later.';
                        }

                    }
                } catch (e) {
                    $scope.errorMessage = 'Please try again later.'
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

mainModule.directive('ngRightClick', function ($parse) {
    return {
        restrict: 'A',
        link: {
            //the pre function will determine which item of the contextual menu will be displayed
            pre: function (scope, element, attrs) {
                //create a function that will invoke ngRightClick value

                var fn = $parse(attrs.ngRightClick);
                //attach the contextmenu event to the element
                element.bind('contextmenu', function (event) {
                    scope.$apply(function (scope) {
                        //cancel the os default contextual menu
                        event.preventDefault();

                        if (attrs.ngRightClick !== '') {
                            //call the function that invoke the function included in ngRightClick value
                            fn(scope, {$event: event});
                        }
                    });
                });
            },

            // the post function position the contextual menu regarding the click position and the contextual menu size
            // this function must be executed after the ng-if directives because they will change the contextual menu size
            post: function (scope, element, attrs) {
                //create a function that will invoke ngRightClick value
                if (attrs.ngRightClick !== '') {
                    element.bind('contextmenu', function (event) {
                        scope.moveContextualMenu(event)

                    });
                }
            }
        }
    }
});

mainModule.directive('ngWheel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            var expr = $parse(attr['ngWheel']);
            element.bind('wheel', function (event) {
                scope.$apply(function () {
                    expr(scope);
                });
            });

        }
    };
}]);

mainModule.directive('ngDraggable', function ($document) {
    return {
        restrict: 'A',
        scope: {
            dragScope: '@ngDraggable'
        },
        link: function (scope, elem, attr) {
            var startX, startY, x = 0, y = 0,
                container, width = 50, height = 50;

            elem.on('mousedown', function (e) {
                e.preventDefault();
                if (scope.dragScope) {
                    //Bounding rectangle of where we can move the element
                    container = document.querySelector(scope.dragScope).getBoundingClientRect();
                }
                width = elem[0].offsetWidth;
                height = elem[0].offsetHeight;
                startX = e.clientX - elem[0].offsetLeft;
                startY = e.clientY - elem[0].offsetTop;
                $document.on('mousemove', mousemove);
                $document.on('mouseup', mouseup);
            });

            // Handles drag events
            function mousemove(e) {
                y = e.clientY - startY;
                x = e.clientX - startX;
                setPosition();
            }

            // Unbinds drag events
            function mouseup(e) {
                $document.unbind('mousemove', mousemove);
                $document.unbind('mouseup', mouseup);
            }

            // Move element within container
            function setPosition() {
                if (container) {
                    if (x < 0) {
                        //out of left scope
                        x = 0;
                    } else if (x > container.width - width) {
                        //out of right scope
                        x = container.width - width;
                    }
                    if (y < 0) {
                        //out of top scope
                        y = 0;
                    } else if (y > container.height - height) {
                        //out of bottom scope
                        y = container.height - height;
                    }
                }
                elem.css({
                    top: y + 'px',
                    left: x + 'px'
                });
            }
        }
    }

});