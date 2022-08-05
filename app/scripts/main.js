/**
 * Created by ActiveEon Team on 18/04/2017.
 */

var mainModule = angular.module('main', ['ngResource', 'spring-data-rest', 'angular-toArrayFilter', 'oitozero.ngSweetAlert', 'ngSanitize', 'pascalprecht.translate', 'elif']);

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
            var workflowExecutionQueryPeriod = angular.toJson(response.workflowExecutionQueryPeriod, true);
            var cloudAutomationQueryPeriod = angular.toJson(response.cloudAutomationQueryPeriod, true);
            var wfAutomationLast24hHistoryPeriod = angular.toJson(response.wfAutomationLast24hHistoryPeriod, true);
            var cloudWatchPortalQueryPeriod = angular.toJson(response.cloudWatchPortalQueryPeriod, true);
            var jobAnalyticsPortalRefreshRate = angular.toJson(response.jobAnalyticsPortalRefreshRate, true);
            var notificationPortalQueryPeriod = angular.toJson(response.notificationPortalQueryPeriod, true);
            var genericCatalogPortalQueryPeriod = angular.toJson(response.genericCatalogPortalQueryPeriod, true);
            var jobPlannerQueryPeriod = angular.toJson(response.jobPlannerQueryPeriod, true);
            var appCatalogBucketsUrl = angular.toJson(response.confServer.catalogServiceUrl + 'buckets', true);
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
            localStorage['workflowExecutionQueryPeriod'] = workflowExecutionQueryPeriod;
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
    }

    function getPortalAccessPermission(portal) {
        var requestGetPortalAccessPermissionUrl = JSON.parse(localStorage['restUrl']) + '/common/permissions/portals/' + portal;
        var config = {
            headers: {
                'sessionid': getSessionId(),
                'Content-Type': 'application/json'
            }
        };
        return $http.get(requestGetPortalAccessPermissionUrl, config);
    }

    function getPortalsAccessPermission(portals) {
        var requestGetPortalsAccessPermissionUrl = JSON.parse(localStorage['restUrl']) + '/common/permissions/portals?' + expandListParam('portals', portals).concat('&');
        var config = {
            headers: {
                'sessionid': getSessionId(),
                'Content-Type': 'application/json'
            }
        };
        return $http.get(decodeURIComponent(requestGetPortalsAccessPermissionUrl.slice(0, -1)), config);
    }


    function expandListParam(queryParam, listParam) {
        return listParam.map(function (item) {
            return queryParam + '=' + item;
        }).join('&')
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

mainModule.controller('mainController', function ($window, $http, $scope, $rootScope, $state, $location, $interval, $translate, $uibModalStack, permissionService, SweetAlert, UtilsFactory) {

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
        if (getSessionId()) {
            var restUrl = angular.toJson($location.$$protocol + '://' + $location.$$host + ':' + $location.port() + '/rest');
            localStorage['restUrl'] = restUrl;
            $scope.determineFirstAuthorizedPortalAndAllPortalsAccessPermission($window.location.href);
        }
    };

    $scope.showParentPortal = function (id) {
        return angular.element(document.getElementById(id)).find('li').length;
    };

    $scope.changeLanguage = function (key) {
        $rootScope.lang = key;
        $translate.use(key);
        localStorage['proactiveLanguage'] = key;
    };

    $scope.reloadPortal = function () {
        location.reload()
    }

    //Set the selected language as language dropdown value
    $scope.selectedLanguage = function () {
        $('#language-dropdown').find('a').click(function () {
            var language = $(this).text();
            localStorage['selectedLanguage'] = language;
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
            // Close all open Bootstrap modals
            $uibModalStack.dismissAll();
            $('.modal-backdrop').hide()
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
        UtilsFactory.displayTranslatedMessage('warning', 'Access not authorized', ['Cannot connect to', portal + '.', 'The access is not authorized']);
        if (!$scope.firstAccessiblePortal) {
            $rootScope.errorMessage = 'The user ' + localStorage['pa.login'] + ' is not allowed to access to the Automation Dashboard Portal';
            $state.go('login');
            console.error('The user ' + localStorage['pa.login'] + ' is not allowed to access to the Automation Dashboard Portal', response);
        } else {
            $state.go($scope.automationDashboardPortals[$scope.firstAccessiblePortal]);
        }
    }


    $scope.checkPortalAccessPermission = function (url) {
        var portal = url.substring(url.lastIndexOf('/') + 1, (url.lastIndexOf('?') > 0 ? url.lastIndexOf('?') : undefined));
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
        } else {
            $scope.closeSession();
        }
    };

    $scope.determineFirstAuthorizedPortalAndAllPortalsAccessPermission = function (url) {
        var portal = '';
        if (url) {
            portal = url.substring(url.lastIndexOf('/') + 1, (url.lastIndexOf('?') > 0 ? url.lastIndexOf('?') : undefined));
        }
        $state.get().forEach(function (item) {
            if (item.name && item.name !== 'login' && item.name !== 'portal' && item.name !== 'job-info') {
                $scope.automationDashboardPortals[item.url.substring(1)] = item.name;
                $scope.portalsAccessPermission[item.url.substring(1)] = false;
            }
        });
        var portals = Object.keys($scope.automationDashboardPortals).concat(['studio', 'rm', 'scheduler']);
        permissionService.getPortalsAccessPermission(portals).then(function (response) {
            if (Array.isArray(response.data) && response.data.length) {
                //Choose the workflow-execution portal as default portal if it exists, otherwise we choose the first portal in the list
                var doHaveAccessToWA = response.data.indexOf('workflow-execution');
                $scope.firstAccessiblePortal = doHaveAccessToWA !== -1 ? response.data[doHaveAccessToWA] : response.data[0];
                response.data.forEach(function (authorizedPortal) {
                    $scope.portalsAccessPermission[authorizedPortal] = true;
                });
                if (portal) {
                    if ($scope.portalsAccessPermission[portal]) {
                        $state.go($scope.automationDashboardPortals[portal]);
                    } else if (portal !== 'job-info' || doHaveAccessToWA === -1) {
                        displayAlertAndRedirectToFirstAccessiblePortalIfExist(portal);
                    }
                } else {
                    $state.go($scope.automationDashboardPortals[$scope.firstAccessiblePortal]);
                }
            } else {
                $rootScope.errorMessage = 'This user is not allowed to access to the Automation Dashboard Portal';
                $state.go('login');
                console.error('This user is not allowed to access to the Automation Dashboard Portal', response.status);
            }

        })
            .catch(function (error) {
                $scope.closeSession();
                console.error('Error while checking portals access permission', error)
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

        // cancel the in-progress uploading dataspace files
        if ($rootScope.uploadingCancelers) {
            $rootScope.uploadingCancelers.forEach(function (upload, uploadId) {
                if (upload && upload.canceler) {
                    upload.canceler.promise.status = 499; // Set 499 status to flag cancelled http requests
                    upload.canceler.resolve()
                }
            })
            $rootScope.uploadingCancelers.clear();
            $rootScope.uploadingFiles.length = 0;
        }

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
    $scope.loseFocusForElement = function (elementSelector) {
        angular.element(elementSelector)[0].blur();
    }
});

// controller used in navigation.html :
mainModule.controller('navBarController', function ($scope, $rootScope, $http, $interval, $timeout) {
    this.$onInit = function () {
        var jobAnalyticsChildren = ['job-analytics', 'job-gantt', 'node-gantt'];
        var jobPlannerChildren = ['job-planner-calendar-def', 'job-planner-calendar-def-workflows', 'job-planner-execution-planning', 'job-planner-gantt-chart'];
        $timeout(function () {
            var splitUrl = window.location.hash.split('/');
            var portal = splitUrl[splitUrl.length - 1];
            setDefaultSelectedLanguage(localStorage['proactiveLanguage']);
            if (jobAnalyticsChildren.indexOf(portal) !== -1) {
                $scope.changeFavicon('analytics-portal');
            } else if (jobPlannerChildren.indexOf(portal) !== -1) {
                $scope.changeFavicon('job-planner-portal');
            } else if (splitUrl[splitUrl.length - 1] === 'workflow-execution') {
                $scope.changeFavicon('automation_dashboard_30');
            } else {
                $scope.changeFavicon(splitUrl[splitUrl.length - 1]);
            }
        }, 1000)

        $scope.view = JSON.parse(localStorage['configViews']);
        $http.get('resources/config.json')
            .success(function (response) {
                $scope.dashboardVersion = response.proactiveDashboardVersion;
            })
            .error(function (response) {
                $scope.dashboardVersion = 'not available';
            });
        $scope.nbNewNotifications = 0;
        startRegularUpdateNotificationLabel();

        $timeout(function () {
            if (localStorage.getItem('collapsePreference') && localStorage.getItem('collapsePreference') === 'in') {
                $scope.collapseMenu()
            }
        }, 2000)


    };

    $scope.collapseMenu = function () {
        if ($('#collapse-menu').next().find('span').is(':visible')) {
            $('#collapse-menu > a > i').removeClass('fa-angle-double-left')
            $('#collapse-menu > a > i').addClass('fa-angle-double-right')
            localStorage.setItem('collapsePreference', 'in')
        } else {
            $('#collapse-menu > a > i').removeClass('fa-angle-double-right')
            $('#collapse-menu > a > i').addClass('fa-angle-double-left')
            localStorage.setItem('collapsePreference', 'out')
        }
        $('.pace-done').toggleClass('mini-navbar');
    }
    $scope.changeFavicon = function (portal) {
        var link = document.createElement('link');
        var oldLink = document.getElementById('favicon');
        link.id = 'favicon';
        link.rel = 'icon';
        link.href = 'styles/patterns/' + portal + '.png';
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
                if (Number.isInteger(response)) {
                    $scope.nbNewNotifications = response;
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

/*Catalog view controller: buckets and objects list*/

angular.module('main').controller('CatalogViewController', function ($scope, $rootScope, $uibModal, $http, $filter, $translate, $timeout, $sce, toastr, WECatalogService, UtilsFactory) {

    this.$onInit = function () {
        // Filter objects by workflowNameQuery
        $scope.workflowNameQuery = '';
        $scope.selectedWorkflow = $scope.$parent.$parent.$parent.$parent.$parent.$parent.workflowToSubmit;
        // Fetch defaults or cached values
        $scope.WEUserPreferences = UtilsFactory.loadUserPreferences();
        $scope.selectedBucketName = UtilsFactory.getUserPreference('submissionView.selectedBucketName');
        $scope.orderByColumnConfig = UtilsFactory.getUserPreference('submissionView.orderByColumnConfig.workflows');
        $scope.OrderByBucketNameConfig = UtilsFactory.getUserPreference('submissionView.orderByColumnConfig.buckets');
        $scope.toggleListBox = UtilsFactory.getUserPreference('submissionView.toggleListBox');
        // request helper flags
        $scope.isBucketsLoading = true;
        $scope.isObjectsLoading = false;
        // Load the template and then fetch the buckets list
        $timeout(function () {
            loadBuckets();
        }, 500)
    };

    /**
     * get workflows list from server
     **/

    function updateWorkflowsMetadataList() {
        $scope.isObjectsLoading = true;
        var kind = $scope.showPSAWorkflowsOnly ? 'Workflow/psa' : 'Workflow/standard'
        WECatalogService.getWorkflowsMetadataList($scope.workflowNameQuery, $scope.selectedBucket.name, kind).then(function (response) {
            $scope.workflowsMetadataList = response;
            $timeout(function () {
                $scope.isObjectsLoading = false;
            }, 500)
            $scope.workflowsMetadataList.forEach(function (catalogObject) {
                for (var metadataIndex = 0; metadataIndex < catalogObject.object_key_values.length; metadataIndex++) {
                    var label = catalogObject.object_key_values[metadataIndex].label;
                    var key = catalogObject.object_key_values[metadataIndex].key;
                    var value = catalogObject.object_key_values[metadataIndex].value;
                    if (label === 'job_information' && key === 'visualization') {
                        catalogObject.visualization = $sce.trustAsHtml(value);
                    }
                }
            })
        });
    }

    /**
     * select a wf
     **/
    $scope.getWorkflowPanelStatus = function (workflow) {
        if ($scope.selectedWorkflow && workflow.name === $scope.selectedWorkflow.name) {
            return 'panel-selected';
        } else {
            return 'panel-default';
        }
    }

    /**
     * select a workflow and change the current tab
     **/
    $scope.selectWorkflow = function (workflow) {
        $scope.$parent.$parent.$parent.$parent.$parent.$parent.workflowToSubmit = {
            variables: UtilsFactory.extractVariables(workflow),
            icon: UtilsFactory.getWorkflowMetadata(workflow, 'generic_information', 'workflow.icon'),
            projectName: workflow.project_name,
            kind: workflow.kind,
            bucketName: UtilsFactory.getWorkflowMetadata(workflow, 'generic_information', 'bucketName'),
            documentation: UtilsFactory.getWorkflowMetadata(workflow, 'generic_information', 'Documentation'),
            description: UtilsFactory.getWorkflowMetadata(workflow, 'General', 'description'),
            name: workflow.name,
            commitTime: workflow.commit_time,
            userName: workflow.username
        }
        $scope.selectedWorkflow = $scope.$parent.$parent.$parent.$parent.$parent.$parent.workflowToSubmit;
        // go to Submit tab
        $scope.$parent.$parent.$parent.$parent.$parent.$parent.activeTab.value = 1;
    }

    $scope.changeBucket = function (bucket) {
        $scope.selectedBucket = bucket;
        if (!$scope.showPSAWorkflowsOnly){
            UtilsFactory.setUserPreference('submissionView.selectedBucketName', $scope.selectedBucket.name);
        }
        updateWorkflowsMetadataList();
    };

    /**
     * load all buckets with at least one workflow from server
     **/
    function loadBuckets() {
        const appCatalog = JSON.parse(localStorage.appCatalogBucketsUrl);
        const sessionIdHeader = {
            headers: {'sessionid': getSessionId()},
            params: {
                'kind': $scope.showPSAWorkflowsOnly ? 'Workflow/psa' : 'Workflow/standard',
                'objectName': $scope.workflowNameQuery
            }
        };
        $scope.isBucketsLoading = true;
        $scope.bucketsMetadataList = [];
        $http.get(appCatalog, sessionIdHeader)
            .success(function (bucketList) {
                $scope.bucketsMetadataList = bucketList;
                // No empty bucket should appear for no empty workflowNameQuery
                if ($scope.workflowNameQuery) {
                    $scope.bucketsMetadataList = $scope.bucketsMetadataList.filter(function (bucket) {
                        return bucket.objectCount;
                    });
                }
                /**
                 * In the case where the buckets list is not empty, we select the first bucket if the selected bucket is not in cache or no longer exist
                 * Fetch objects of the selected bucket
                 * Otherwise, objectList should be empty
                 **/
                if ($scope.bucketsMetadataList.length) {
                    const selectedBucketIndex = $scope.bucketsMetadataList.findIndex(function (bucket) {
                        return bucket.name === $scope.selectedBucketName;
                    });
                    if (!$scope.selectedBucketName || selectedBucketIndex === -1) {
                        $scope.selectedBucket = $scope.bucketsMetadataList[0];
                        if (!$scope.showPSAWorkflowsOnly){
                            UtilsFactory.setUserPreference('submissionView.selectedBucketName', $scope.selectedBucket.name);
                        }
                    } else {
                        $scope.selectedBucket = $scope.bucketsMetadataList[selectedBucketIndex];
                        $scope.scrollToBucket();
                    }
                    updateWorkflowsMetadataList();
                } else {
                    $scope.workflowsMetadataList = [];

                }
                $scope.isBucketsLoading = false;
            })
            .error(function (response) {
                console.error('loadbuckets : http.get buckets: ' + response);
            });
    }

    $scope.scrollToBucket = function () {
        $timeout(function () {
            if ($('#bucket' + $scope.selectedBucket.name).position()) {
                var scrollToVal = $('#buckets-scroll-area').scrollTop() + $('#bucket' + $scope.selectedBucket.name).position().top - 5;
                $('#buckets-scroll-area').scrollTop(scrollToVal);
            }
        }, 500);
    }

    $scope.filterObjectByObjectName = function (workflowNameQuery) {
        $scope.workflowNameQuery = workflowNameQuery
        $scope.selectedBucketName = UtilsFactory.getUserPreference('submissionView.selectedBucketName')
        loadBuckets();
    }

    $scope.hideEmptyObject = function (bucket){
        return bucket.objectCount > 0;
    }

    $scope.findImageUrl = function (selectedWorkflow) {
        var icon = UtilsFactory.getByKey('generic_information', 'workflow.icon', selectedWorkflow.object_key_values);
        return icon === '' ? 'styles/patterns/img/wf-icons/wf-default-icon.png' : icon
    };

    /**
     * This function allows sorting buckets list and workflow lists
     **/
    $scope.orderByColumn = function (column, config, propertyName) {
        config.order = (config.column !== column) ? 'd' : config.order === 'a' ? 'd' : 'a';
        config.comparatorLogic = (config.column !== column) ? '+' + column : config.order === 'd' ? '+' + column : '-' + column;
        config.column = column;
        UtilsFactory.setUserPreference(propertyName, config);
    }

    $scope.getSortClasses = function (sortParameters, column) {
        return UtilsFactory.getSortClasses(sortParameters, column)
    }
    $scope.toggleDisplay = function () {
        UtilsFactory.setUserPreference('submissionView.toggleListBox', $scope.toggleListBox);
    }

    $scope.filterCreationWorkflows = function (workflow) {
        if (workflow.kind.toLowerCase().includes('workflow/standard')) {
            return true
        }
        return UtilsFactory.getWorkflowMetadata(workflow, 'generic_information', 'pca.states') && UtilsFactory.getWorkflowMetadata(workflow, 'generic_information', 'pca.states').includes('VOID');
    };

    $scope.getObjectDescription = function (object){
        return UtilsFactory.getWorkflowMetadata(object, 'General', 'description')
    }

    // Close the window if ESC key pressed
    $(document).keydown(function (e) {
        // ESCAPE key pressed
        if (e.keyCode === 27 && $scope.isJobSubmissionPanelOpen) {
            $scope.toggleOpenSubmitJobPanel(false);
        }
    })

});

/*Workflow variables controller: submission template*/

angular.module('main').controller('VariablesController', function ($scope, $uibModal, $http, $translate, $timeout, $sce, $rootScope, $location, toastr, PCAService, UtilsFactory, WESchedulerService) {
    this.$onInit = function () {
        $scope.workflow =
            $scope.$parent.$parent.$parent.$parent.$parent.$parent.workflowToSubmit;
        // toast config
        $scope.toastrConfig = {closeButton: true, progressBar: true};
        const variablesTemplateFooterButtonInfo =
            $scope.$parent.$parent.$parent.$parent.$parent.$parent
                .variablesTemplateFooterButtonInfo;
        // fetch resolvedModel from the server: update variables
        if ($scope.workflow.jobId) {
            validateJob()
        } else {
            validateWorkflow(function (response) {
                updateVariables(response)
                if (!response.valid) {
                    $scope.WEsubmissionErrorMessage = response.errorMessage;
                    $scope.successMessage = '';
                }
                UtilsFactory.replaceVariableModelsIfNeeded($scope.workflow.variables);
            })
        }
        // helper flag for workflow valid message
        $scope.WEsubmissionErrorMessage = '';
        $scope.successMessage = '';

        /**
         * footer button actions: functions that will be called when user clicks
         **/
        $scope.footerActions = {
            Submit: submit,
            Launch: submit,
            'Execute Action': submitServicesAndAction,
            Resubmit: function () {
                reSubmitJob($scope.workflow.id, $scope.workflow.variables);
            },
            'Kill & Re-Submit': function () {
                killResubmitJob($scope.workflow.id, $scope.workflow.variables);
            },
            'Confirm Association': createNewCdWfAssociation,
            'Update': updateCdWfAssociation,
            Previous: previous,
            Check: check,
            Cancel: function () {
                $scope.$parent.toggleOpenSubmitJobPanel(false);
            }
        };
        // footer section
        $scope.footerTemplate = variablesTemplateFooterButtonInfo.map(function (item) {
            item.action = $scope.footerActions[item.label];
            return item;
        });
        // helper flag for loading button
        $scope.isSubmissionGoingOn = false;
        //psa workflow label
        $scope.pcaWorkflowLabel = '';
        // show advanced variables
        $scope.advancedVariables = false;
    };

    $scope.documentationUrlWfa = function (url) {
        return url.startsWith('http') ? url : JSON.parse(localStorage.appUrl).concat('/doc/', url);
    }

    $scope.isTextAreaModel = function (variable) {
        return UtilsFactory.isTextAreaModel(variable)
    }

    $scope.isSpecialUIModel = function (variable) {
        return UtilsFactory.isSpecialUIModel(variable);
    };

    // submit services or action
    const submitServicesAndAction = function () {
        $scope.isSubmissionGoingOn = true;
        const bucketName = $scope.workflow['bucketName'];
        validateWorkflow(function (response) {
            if (response.valid === true) {
                /*
                * There are two cases : submit wf or submit action
                */
                const variables = UtilsFactory.parseEmptyVariablesValue(UtilsFactory.getVariablesInKeyValueFormat($scope.workflow.variables));
                UtilsFactory.getVariablesInKeyValueFormat($scope.workflow.variables);
                if ($scope.workflow.hasOwnProperty('isCreationWorkflow') && !$scope.workflow.isCreationWorkflow) {
                    var httpPromise = PCAService.submitActionWorkflow($scope.workflow.serviceInstance.instance_id, bucketName, $scope.workflow.name, variables);
                    httpPromise.then(function () {
                        toastr.success('The action has been executed.', JSON.stringify(response.id), $scope.toastrConfig);
                        $rootScope.$broadcast('event:updateServiceInstanceList');
                        $rootScope.$broadcast('event:updateWorkflowsGroupedByInstance');
                        $scope.isLoading = false;
                        //close the Submit Workflow Panel
                        $scope.$parent.toggleOpenSubmitJobPanel(false);
                    }).catch(function (error) {
                        console.error('Error while executing workflow on instance ' + $scope.workflow.serviceInstance.instance_id + ': ' + angular.toJson(error));
                        UtilsFactory.displayTranslatedErrorMessage('Error', ['The action couldn\'t be executed:', error.data.httpErrorCode + ' - ' + error.data.errorMessage]);
                        $scope.isLoading = false;
                    });
                } else {
                    var httpPromise = PCAService.submitCreationWorkflow($scope.workflow.bucketName, $scope.workflow.name, variables, $scope.pcaWorkflowLabel);
                    httpPromise.then(function () {
                        //close the Submit Workflow Panel
                        $scope.$parent.toggleOpenSubmitJobPanel(false);
                        toastr.success('The service instance has been created.', JSON.stringify(response.id), $scope.toastrConfig);
                    }).catch(function (error) {
                        console.error('Error while submitting service: ' + angular.toJson(error));
                        toastr.error('Error', ['The service instance couldn\'t be created:', error.data.httpErrorCode + ' - ' + error.data.errorMessage]);
                    });
                }
            } else {
                $scope.WEsubmissionErrorMessage = response.errorMessage;
                $scope.successMessage = '';
            }
        })
    }
    // use : when clicking on the button submit
    const submit = function () {
        $scope.isSubmissionGoingOn = true;
        const bucketName = $scope.workflow['bucketName'];
        // submit a standard workflow
        if ($scope.workflow.kind.toLowerCase().includes('workflow/psa')) {
            submitServicesAndAction();
            return;
        }
        // Validate + Submit if applicable
        validateWorkflow(function (response) {
            if (response.valid === true) {
                UtilsFactory.submitJob(bucketName, $scope.workflow.name, $scope.workflow.variables)
                    .success(function (submitResponse) {
                        //close the Submit Workflow Panel
                        $scope.$parent.toggleOpenSubmitJobPanel(false);
                        $scope.isSubmissionGoingOn = false;
                        toastr.success('Your Workflow has been submitted successfully' + ', Job Id: ' + JSON.stringify(submitResponse.id), $scope.toastrConfig);
                    })
                    .error(function (error) {
                        $scope.WEsubmissionErrorMessage = error.errorMessage;
                        $scope.isSubmissionGoingOn = false;
                        toastr.error('An error occurred while submitting your workflow.' + '\n' + 'Please check you workflows and retry', $scope.toastrConfig)
                    })
            } else {
                $scope.WEsubmissionErrorMessage = response.errorMessage;
                $scope.isSubmissionGoingOn = false;
                $scope.successMessage = '';
            }
        })
    };

    // create new association
    function createNewCdWfAssociation() {
        $scope.isSubmissionGoingOn = true;
        const bucketName = $scope.workflow['bucketName'];
        // Validate + create association if applicable
        validateWorkflow(function (response) {
            if (response.valid) {
                // the values of pa:hidden variables shouldn't be decrypted in Workflow Description
                encryptValues(response)
                // create association
                $scope.$parent.createAssociation($scope.workflow.name, bucketName, $scope.workflow.variables)
                    .success(function (res) {
                        $scope.updatePlannedJobsListAndSelect(res.id);
                        $rootScope.$broadcast('event:updatePlannedJobsCount');
                        $scope.desectWorkflowInModal();
                        $scope.toggleOpenSubmitJobPanel(false);
                        displaySuccessMessage('New association successfully created');
                    })
                    .error(function (res) {
                        $scope.isSubmissionGoingOn = false
                        $scope.errorMessage = res.errorMessage;
                        console.error('Error while creating calendar workflow association ' + ':', angular.toJson(res));
                    });
            } else {
                $scope.isSubmissionGoingOn = false
                $scope.WEsubmissionErrorMessage = response.errorMessage;
                $scope.successMessage = '';
            }
        })
    }

    function updateCdWfAssociation() {
        $scope.isSubmissionGoingOn = true;
        $scope.workflowVariables = UtilsFactory.parseEmptyVariablesValue($scope.workflow.variables);
        // check if association is valid
        validateWorkflow(function (response) {
            if (response.valid === true) {
                // the values of pa:hidden variables shouldn't be decrypted in Workflow Description
                encryptValues(response)
                // Check Successful - proceed to edit
                $scope.$parent.updateCdWfAssociation($scope.workflow.variables)
                    .success(function (res) {
                        $scope.updatePlannedJobsListAndSelect(res.id);
                        displaySuccessMessage('Association successfully updated');
                        $scope.updateLastSelectedWorkflow();
                        $scope.isSubmissionGoingOn = false;
                        $scope.toggleOpenSubmitJobPanel(false);
                    })
                    .error(function (res) {
                        console.error('Error while updating calendar workflow association ' + ':', angular.toJson(res));
                        $scope.WEsubmissionErrorMessage = res.errorMessage;
                        $scope.successMessage = '';
                        $scope.resetSelectedWorkflowVariableValues();
                    });
            } else {
                $scope.isSubmissionGoingOn = false;
                $scope.WEsubmissionErrorMessage = response.errorMessage;
                $scope.successMessage = '';
                console.error('Error while updating the association : ' + angular.toJson(response));
                $scope.resetSelectedWorkflowVariableValues();
            }
        })
    }

    // decrypt pa:hidden value
    function encryptValues(response) {
        angular.forEach($scope.workflow.variables, function (variable) {
            if (response.updatedModels[variable.name] && response.updatedModels[variable.name].toLowerCase() === 'pa:hidden') {
                variable.value = response.updatedVariables[variable.name];
            }
        })
    }

    // construct the variables object following this format: {"key":"value", ... }
    function constructVariablesObject(variables) {
        var workflowVariables = {};
        if (Array.isArray(variables)) {
            for (var i = 0; i < variables.length; i++) {
                workflowVariables[variables[i].name] = variables[i].value;
            }
        } else {
            for (var i = 0; i < Object.keys(variables).length; i++) {
                workflowVariables[Object.keys(variables)[i]] = variables[Object.keys(variables)[i]].value;
            }
        }
        return workflowVariables;
    }

    /**
     * Requests the scheduler to resubmit a job then displays a confirmation toast.
     */
    const reSubmitJob = function (id, variables) {
        $scope.isSubmissionGoingOn = true;
        WESchedulerService.reSubmitJob(id, variables)
            .success(function (response) {
                //close the Submit Workflow Panel
                $scope.$parent.toggleOpenSubmitJobPanel(false);
                toastr.success('Job ' + id + ' resubmitted successfully!', $scope.toastrConfig);
                $scope.isSubmissionGoingOn = false;
            })
            .error(function (response) {
                $scope.WEsubmissionErrorMessage = response.errorMessage;
                $scope.isSubmissionGoingOn = false;
                console.error('Could not resubmit job ' + id + '! ' + response);
            });
    };
    /**
     * Requests the scheduler to resubmit and kill a job then display a confirmation toast
     **/
    const killResubmitJob = function (id, variables) {
        $scope.isSubmissionGoingOn = true;
        WESchedulerService.reSubmitJob(id, variables)
            .success(function () {
                WESchedulerService.killJob(id)
                    .success(function (res) {
                        if (res) {
                            toastr.success('Job ' + id + ' killed and resubmitted successfully!', $scope.toastrConfig)
                        } else {
                            toastr.warning('Could not kill job ' + id + '!', $scope.toastrConfig)
                        }
                        //close the Submit Workflow Panel
                        $scope.$parent.toggleOpenSubmitJobPanel(false);
                        $scope.isSubmissionGoingOn = false;
                    })
                    .error(function (error) {
                        $scope.WEsubmissionErrorMessage = error.errorMessage;
                        $scope.isSubmissionGoingOn = false;
                        console.error('Could not kill job ' + id + '! ' + res)
                    });
            })
            .error(function (response) {
                $scope.WEsubmissionErrorMessage = response.errorMessage;
                console.error('Could not resubmit job ' + id + '! ' + response)
                $scope.isSubmissionGoingOn = false;
            });
    }
    // use : When clicking on the button check
    const check = function () {
        validateWorkflow(function (response) {
            if (response.valid === true) {
                $scope.successMessage = 'Check success';
                $scope.WEsubmissionErrorMessage = '';
            } else {
                $scope.WEsubmissionErrorMessage = response.errorMessage;
                $scope.successMessage = '';
            }
        })
    };
    $scope.validate = function () {
        if ($scope.workflow.jobId) {
            validateJob()
        } else {
            validateWorkflow(function (response) {
                updateVariables(response)
                if (!response.valid) {
                    $scope.WEsubmissionErrorMessage = response.errorMessage;
                    $scope.successMessage = '';
                }
                UtilsFactory.replaceVariableModelsIfNeeded($scope.workflow.variables);
            })
        }
    }

    function validateWorkflow(successCallback, errorCallback) {
        const bucketName = $scope.workflow['bucketName'];
        // Validate
        UtilsFactory.validateWorkflow(bucketName, $scope.workflow.name, $scope.workflow.variables)
            .success(function (response) {
                successCallback(response)
            })
            .error(function (response) {
                if (errorCallback) {
                    errorCallback(response)
                } else {
                    UtilsFactory.displayTranslatedErrorMessage(['An error occurred while validating your workflow', '\n', 'Please check the type of the provided values regarding the given variables models']);
                    console.error('An error occurred while validating the workflow: ' + angular.toJson(response));
                }
            })
    }

    function validateJob() {
        // Validate
        WESchedulerService.validateJob($scope.workflow.variables, $scope.workflow.jobId)
            .success(function (response) {
                updateVariables(response)
                if (!response.valid) {
                    $scope.WEsubmissionErrorMessage = response.errorMessage;
                    $scope.successMessage = '';
                }
                UtilsFactory.replaceVariableModelsIfNeeded($scope.workflow.variables);
            })
            .error(function (response) {
                UtilsFactory.displayTranslatedErrorMessage(['An error occurred while validating your job', '\n', 'Please check the type of the provided values regarding the given variables models']);
                console.error('An error occurred while validating the workflow: ' + angular.toJson(response));
            })
    }

    function updateVariables(response) {
        //We add "resolvedModel" attribute in order to handle the case where we have variables substitution
        angular.forEach($scope.workflow.variables, function (variable) {
            if (variable.model && variable.resolvedModel) {
                if (variable.model.toLowerCase().indexOf('pa:model_from_url') === 0) {
                    // keep the same value
                } else if (variable.resolvedModel !== response.updatedModels[variable.name]) {
                    variable.value = response.updatedModels[variable.name].toLowerCase().indexOf('pa:boolean') === 0 ? 'false' : '';
                }
            }
            variable.resolvedModel = response.updatedModels[variable.name];
            variable.group = response.updatedGroups[variable.name] ? response.updatedGroups[variable.name] : '';
            variable.advanced = response.updatedAdvanced[variable.name];
            variable.hidden = response.updatedHidden[variable.name];
            variable.description = response.updatedDescriptions[variable.name] ? response.updatedDescriptions[variable.name] : '';
        })
        for (var key in response.updatedVariables) {
            // then, add global variables not defined in the workflow
            var index = $scope.workflow.variables.findIndex(function (variable) {
                return variable.name === key
            });
            if (key.indexOf(':') < 0 && index < 0) {
                var globalVariable = {
                    name: key,
                    value: response.updatedVariables[key],
                    model: response.updatedModels[key],
                    resolvedModel: response.updatedModels[key],
                    group: response.updatedGroups[key] ? response.updatedGroups[key] : '',
                    advanced: response.updatedAdvanced[key],
                    hidden: response.updatedHidden[key],
                    description: response.updatedDescriptions[key] ? response.updatedDescriptions[key] : ''
                }
                $scope.workflow.variables.push(globalVariable);
            }
        }
    }

    // Go to the previous tab:  catalog-view
    function previous() {
        $scope.$parent.$parent.$parent.$parent.$parent.$parent.activeTab.value = 0;
    }

    $scope.modelToList = function (model) {
        return UtilsFactory.modelToList(model);
    };

    $scope.modelToDateFormat = function (model) {
        return UtilsFactory.modelToDateFormat(model);
    };

    $scope.modelToDateScope = function (model) {
        return UtilsFactory.modelToDateScope(model);
    };

    $scope.manageThirdPartyCredentials = function (credVariable) {
        validateWorkflow(function (response) {
            var credVariableValue = response.updatedVariables[credVariable.name];
            UtilsFactory.openThirdPartyCredentialsModal(credVariableValue, check);
        }, function (response) {
            console.error('An error occurred while validating the workflow, so directly using the variable value as credential key. Error: ' + angular.toJson(response));
            UtilsFactory.openThirdPartyCredentialsModal(credVariable.value, check);
        });
    };

    $scope.manageFiles = function (variable, dataspace, selectFolder) {
        UtilsFactory.openFileBrowser(variable, dataspace, selectFolder);
    };

    // click on folder icon besides PA:CATALOG_OBJECT variable open a pop-up
    // this pop-up will be used to browse catalog objects, and user can select one as the variable value.
    $scope.selectCatalogObjectVar = function (variable, variableModel) {
        UtilsFactory.openCatalogObjectModal(variable, variableModel);
    };

    $scope.documentationUrl = function (url) {
        if (url.startsWith('http')) {
            return url;
        } else {
            return JSON.parse(localStorage.appUrl).concat('/doc/', url);
        }
    }

    $scope.filterVariables = function (variable) {
        if (variable.hidden) {
            return false
        }
        if ($scope.advancedVariables) {
            return true
        } else if (!variable.advanced) {
            return true;
        }
        return false;
    }

    $scope.isVariablesIncludeAdvancedVar = function (variables) {
        return UtilsFactory.isVariablesIncludeAdvancedVar(variables)
    }
    $scope.cleanId = function (name) {
        return name.replace(/ /g, '');
    };

    $scope.objectKeys = function (obj) {
        return Object.keys(obj);
    }

    // Close the window if ESC key pressed
    $(document).keydown(function (e) {
        // ESCAPE key pressed
        if (e.keyCode === 27 && $scope.isJobSubmissionPanelOpen) {
            $scope.toggleOpenSubmitJobPanel(false);
        }
    })

    function displaySuccessMessage(message) {
        UtilsFactory.displayTranslatedMessage('success', 'Operation Successful !', message);
    }
});
