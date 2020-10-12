/**
 * Created by ActiveEon Team on 18/04/2017.
 */

var mainModule = angular.module('main', ['ngResource', 'spring-data-rest', 'angular-toArrayFilter', 'oitozero.ngSweetAlert', 'ngSanitize', 'pascalprecht.translate']);

function getSessionId() {
    return localStorage['pa.session'];
}

// ---------- Utilities -----------
function getProperties($http, $location, UtilsFactory) {
    return $http.get('resources/config.json')
        .success(function (response) {
            var pcaServiceUrl = angular.toJson(response.confServer.pcaServiceUrl, true);
            var schedulerRestUrl = angular.toJson(response.confServer.schedulerRestUrl, true);
            var rmRestUrl = angular.toJson(response.confServer.rmRestUrl, true);
            var notificationServiceUrl = angular.toJson(response.confServer.notificationServiceUrl, true);
            var catalogServiceUrl = angular.toJson(response.confServer.catalogServiceUrl, true);
            var wfAutomationQueryPeriod = angular.toJson(response.wfAutomationQueryPeriod, true);
            var cloudAutomationQueryPeriod = angular.toJson(response.cloudAutomationQueryPeriod, true);
            var wfAutomationLast24hHistoryPeriod = angular.toJson(response.wfAutomationLast24hHistoryPeriod, true);
            var cloudWatchPortalQueryPeriod = angular.toJson(response.cloudWatchPortalQueryPeriod, true);
            var jobAnalyticsPortalRefreshRate = angular.toJson(response.jobAnalyticsPortalRefreshRate, true);
            var notificationPortalQueryPeriod = angular.toJson(response.notificationPortalQueryPeriod, true);
            var genericCatalogPortalQueryPeriod = angular.toJson(response.genericCatalogPortalQueryPeriod, true);
            var jobPlannerQueryPeriod = angular.toJson(response.jobPlannerQueryPeriod, true);
            var appCatalogBucketsUrl = angular.toJson(response.confServer.catalogServiceUrl + '/buckets', true);
            var appCatalogWorkflowsUrl = angular.toJson($location.$$protocol + '://' + $location.$$host + ':' + $location.port() + '/catalog/buckets/' + response.view[0].catalog.bucketName + '/resources');
            var jobPlannerServiceUrl = angular.toJson(response.confServer.jobPlannerServiceUrl, true);
            var cloudWatchServiceUrl = angular.toJson(response.confServer.cloudWatchServiceUrl, true);
            var jobAnalyticsServiceUrl = angular.toJson(response.confServer.jobAnalyticsServiceUrl, true);
            var configViews = angular.toJson(response.view, true);
            var appUrl = angular.toJson($location.$$protocol + '://' + $location.$$host + ':' + $location.port());
            var studioUrl = angular.toJson($location.$$protocol + '://' + $location.$$host + ':' + $location.port() + '/studio');
            var restUrl = angular.toJson($location.$$protocol + '://' + $location.$$host + ':' + $location.port() + '/rest');
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
            localStorage['wfAutomationQueryPeriod'] = wfAutomationQueryPeriod;
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
            localStorage['restUrl'] = restUrl;
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

mainModule.factory('permissionService', function ($http, $interval, $rootScope, $state) {
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
    };

    function getPortalAccessPermission(portal) {
        var requestGetPortalAccessPermissionUrl = JSON.parse(localStorage['restUrl']) + '/common/permissions/portals/' + portal;
        var config = {
            headers: {
                'sessionid': getSessionId(),
                'Content-Type': 'application/json'
            },
        };
        return $http.get(requestGetPortalAccessPermissionUrl, config);
    };

    function getPortalsAccessPermission(portals) {
        var requestGetPortalsAccessPermissionUrl = JSON.parse(localStorage['restUrl']) + '/common/permissions/portals?' + expandListParam("portals", portals).concat("&");
        var config = {
            headers: {
                'sessionid': getSessionId(),
                'Content-Type': 'application/json'
            },
        };
        return $http.get(decodeURIComponent(requestGetPortalsAccessPermissionUrl.slice(0, -1)), config);
    };


    function expandListParam(queryParam, listParam) {
        return listParam.map(function(item) { return queryParam + '=' + item; }).join('&')
    }

    return {
        doLogin: function (userName, userPass) {
            return doLogin(userName, userPass);
        },
        getPortalAccessPermission: function (portal) {
            return getPortalAccessPermission(portal);
        },
        getPortalsAccessPermission: function (portals) {
            return getPortalsAccessPermission(portals);
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

mainModule.controller('mainController', function ($window, $http, $scope, $rootScope, $state, $location, $interval, $translate, permissionService, SweetAlert) {

    this.$onInit = function () {
        $scope.main.userName = localStorage['pa.login'];
        $scope.startRegularCheckSession();
        $scope.contextDisplay = false;
        // contextPosition enables directive to specify where the context menu was opened
        $scope.contextPosition = '';
        $scope.firstAccessiblePortal = '';
        $scope.portalsAccessPermission = {};
        $scope.automationDashboardPortals = {};
        $rootScope.errorMessage = undefined;
        if(getSessionId()){
            var restUrl = angular.toJson($location.$$protocol + '://' + $location.$$host + ':' + $location.port() + '/rest');
            localStorage['restUrl'] = restUrl;
            $scope.determineFirstAuthorizedPortalAndAllPortalsAccessPermission($window.location.href);
        }
    };

    $scope.showParentPortal = function(id){
        return angular.element(document.getElementById(id)).next().hasClass('childPortal');
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
        var sessionId = getSessionId();
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

    function displayAlertAndRedirectToFirstAccessiblePortalIfExist(portal) {
        UtilsFactory.displayTranslatedMessage('warning', 'Access not authorized', ['Cannot connect to', portal+'.', 'The access is not authorized']);
        if(!$scope.firstAccessiblePortal){
            $rootScope.errorMessage = 'The user ' + localStorage['pa.login'] + ' is not allowed to access to the Automation Dashboard Portal';
            $state.go('login');
            console.error('The user ' + localStorage['pa.login'] + ' is not allowed to access to the Automation Dashboard Portal', response);
        } else{
            $state.go($scope.automationDashboardPortals[$scope.firstAccessiblePortal]);
        }
    }


    $scope.checkPortalAccessPermission = function (url) {
        var portal = url.substring(url.lastIndexOf("/") + 1);
        if (getSessionId()) {
            permissionService.getPortalAccessPermission(portal).then(function (response) {
                if (!response.data) {
                    displayAlertAndRedirectToFirstAccessiblePortalIfExist(portal);
                } else {
                    $location.path(url);
                }
            })
            .catch(function (error, status) {
                $scope.closeSession();
                console.error('Error while checking portal access permission', status, error);
            });
        }  else {
            $scope.closeSession();
        }
    };

    $scope.determineFirstAuthorizedPortalAndAllPortalsAccessPermission = function(url) {
        var portal = '';
        if(url){
            portal = url.substring(url.lastIndexOf("/") + 1);
        }
        $state.get().forEach(function (item) {
            if(item.name && item.name !== 'login' && item.name !== 'portal'){
                $scope.automationDashboardPortals[item.url.substring(1)] = item.name;
                $scope.portalsAccessPermission[item.url.substring(1)] = false;
            }
        });
        var portals = Object.keys($scope.automationDashboardPortals);
        permissionService.getPortalsAccessPermission(portals).then(function (response) {
            if (Array.isArray(response.data) && response.data.length) {
                //Choose the workflow-automation portal as default portal if it exists, otherwise we choose the first portal in the list
                var doHaveAccessToWA = response.data.indexOf('workflow-automation');
                $scope.firstAccessiblePortal = doHaveAccessToWA !== -1 ? response.data[doHaveAccessToWA] : response.data[0];
                response.data.forEach(function (authorizedPortal) {
                    $scope.portalsAccessPermission[authorizedPortal] = true;
                });
                if(portal){
                    if($scope.portalsAccessPermission[portal]){
                        $state.go($scope.automationDashboardPortals[portal]);
                    } else{
                        displayAlertAndRedirectToFirstAccessiblePortalIfExist(portal);
                    }
                } else{
                    $state.go($scope.automationDashboardPortals[$scope.firstAccessiblePortal]);
                }
            } else {
                $rootScope.errorMessage = 'This user is not allowed to access to the Automation Dashboard Portal';
                $state.go('login');
                console.error('This user is not allowed to access to the Automation Dashboard Portal', response.status);
            }

        })
        .catch(function(error){
            $scope.closeSession();
            console.error('Error while checking portals access permission',error)
        })
    };


    $scope.stopRegularCheckSession = function () {
        $interval.cancel($scope.checkSessionInterval);
        $scope.checkSessionInterval = undefined;
    };

    $scope.closeSession = function () {
        $state.go('login');
        $scope.firstAccessiblePortal = '';
        $rootScope.errorMessage = undefined;
        $scope.portalsAccessPermission = {};
        localStorage.removeItem('pa.session');
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

        var contextMenuHeight = angular.element('#context-menu')[0].offsetHeight;
        //if contextual menu will get out of the panel catalog-tab-content, we display it upper
        if (clickEvent['clientY'] + contextMenuHeight < window.innerHeight) {
            angular.element('#context-menu').css('top', clickEvent['clientY'] + 'px')
        } else {
            angular.element('#context-menu').css('top', (clickEvent['clientY'] - contextMenuHeight) + 'px')
        }

        var contextMenuWidth = angular.element('#context-menu')[0].offsetWidth;
        //if contextual menu will get out of the panel catalog-tab-content, we display it upper
        if (clickEvent['clientX'] + contextMenuWidth < window.innerWidth) {
            angular.element('#context-menu').css('left', clickEvent['clientX'] + 'px')
        } else {
            angular.element('#context-menu').css('left', (clickEvent['clientX'] - contextMenuWidth) + 'px')
        }

    };

    /**
     * Lose focus (blur) on the given element. Useful to lose :focus styling after pressing a button
     * @param elementSelector jQuery light selector expression
     */
    $scope.loseFocusForElement = function(elementSelector){
        angular.element(elementSelector)[0].blur();
    }
});

// controller used in navigation.html :
mainModule.controller('navBarController', function ($scope, $rootScope, $http, $interval) {
    this.$onInit = function () {
        setDefaultSelectedLanguage(localStorage['proactiveLanguage']);
        var splitUrl = window.location.hash.split("/");
        var portal = splitUrl[splitUrl.length-1];
        var jobAnalyticsChildren = ['job-analytics', 'job-gantt', 'node-gantt'];
        var jobPlannerChildren = ['job-planner-calendar-def', 'job-planner-calendar-def-workflows', 'job-planner-execution-planning', 'job-planner-gantt-chart'];

        if(jobAnalyticsChildren.indexOf(portal) !== -1){
            $scope.changeFavicon('analytics-portal');
        } else if(jobPlannerChildren.indexOf(portal) !== -1){
            $scope.changeFavicon('job-planner-portal');
        } else if(splitUrl[splitUrl.length-1] === "workflow-automation"){
            $scope.changeFavicon("automation_dashboard_30");
        } else {
            $scope.changeFavicon(splitUrl[splitUrl.length-1]);
        }

        $scope.view = JSON.parse(localStorage['configViews']);
        $scope.docLink = '/doc/';
        $http.get('resources/config.json')
            .success(function (response) {
                $scope.dashboardVersion = response.proactiveDashboardVersion;
            })
            .error(function (response) {
                $scope.dashboardVersion = 'not available';
            });
        $scope.nbNewNotifications = 0;
        startRegularUpdateNotificationLabel();
    };

    $scope.changeFavicon = function(portal){
         var link = document.createElement('link');
         var oldLink = document.getElementById('favicon');
         link.id = 'favicon';
         link.rel = 'icon';
         link.href = "styles/patterns/"+ portal + ".png";
         if (oldLink) {
          document.head.removeChild(oldLink);
         }
         document.head.appendChild(link);
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
        $rootScope.$on('event:StopRefreshing', function () {
            stopRegularUpdateNotificationLabel();
        });
        queryNotificationService();
    }

    function stopRegularUpdateNotificationLabel() {
        $interval.cancel($scope.intervalNotificationUpdate);
        $scope.intervalNotificationUpdate = undefined;
    }

    function queryNotificationService() {
        var eventsUrlPrefix = JSON.parse(localStorage['notificationServiceUrl']) + 'notifications/unreadCount';
        $http.get(eventsUrlPrefix, {headers: {'sessionID': getSessionId()}})
            .success(function (response) {
                if(Number.isInteger(response)){
                    $scope.nbNewNotifications=response;
                }
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
        $scope.nbNewNotifications = data['count'];
    });

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

mainModule.controller('loginController', function ($scope, $state, permissionService, $stateParams, $location, $rootScope) {
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

        permissionService.doLogin(username, password)
            .success(function (response) {
                var sessionid = getSessionId();
                if (sessionid) {
                    $scope.determineFirstAuthorizedPortalAndAllPortalsAccessPermission($scope.redirectsTo);
                }
                $scope.startRegularCheckSession();
            })
            .error(function (response) {
                try {
                    var error = JSON.parse(response);
                    $rootScope.errorMessage = error.errorMessage;
                    if (error.httpErrorCode === 404) {
                        if (error.stackTrace.indexOf('login.LoginException') >= 0) {
                            $rootScope.errorMessage = 'Invalid Login or Password';
                        } else {
                            $rootScope.errorMessage = 'The server is not available, please try again later.';
                        }
                    }
                } catch (e) {
                    $rootScope.errorMessage = 'Please try again later.'
                }
            });
    };

});

mainModule.controller('logoutController', function ($scope, $state) {
    $scope.logout = function () {
        $scope.closeSession();
    };
});

mainModule.controller('footerController', function ($scope) {
    $scope.year = new Date().getFullYear();
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