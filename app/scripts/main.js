/**
 * Created by ActiveEon Team on 18/04/2017.
 */

var mainModule = angular.module('main', ['ngResource', 'spring-data-rest', 'angular-toArrayFilter', 'oitozero.ngSweetAlert', 'ngSanitize', 'pascalprecht.translate', 'ui.grid', 'ui.grid.resizeColumns', 'ui.grid.selection', 'ui.grid.exporter', 'ui.grid.moveColumns', 'ui.grid.pinning', 'toaster', 'ui.grid.autoResize', 'btford.markdown']);

function getSessionId() {
    return localStorage['pa.session'];
}

// ---------- Utilities -----------
function getProperties($http, $location) {
    return $http.get('/automation-dashboard/resources/config.json')
        .success(function (response) {
            // Configure proxyName here
            const index = window.location.pathname.indexOf('automation-dashboard')
            const proxyNames = window.location.pathname.substring(0, index > 0 ? index - 1 : index);

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
            var appCatalogWorkflowsUrl = angular.toJson($location.$$protocol + '://' + $location.$$host + ':' + $location.port() + proxyNames + '/catalog/buckets/' + response.view[0].catalog.bucketName + '/resources');
            var jobPlannerServiceUrl = angular.toJson(response.confServer.jobPlannerServiceUrl, true);
            var cloudWatchServiceUrl = angular.toJson(response.confServer.cloudWatchServiceUrl, true);
            var jobAnalyticsServiceUrl = angular.toJson(response.confServer.jobAnalyticsServiceUrl, true);
            var configViews = angular.toJson(response.view, true);
            var appUrl = angular.toJson($location.$$protocol + '://' + $location.$$host + ':' + $location.port() + proxyNames);
            var studioUrl = angular.toJson($location.$$protocol + '://' + $location.$$host + ':' + $location.port() + proxyNames + '/studio');
            var restUrl = angular.toJson($location.$$protocol + '://' + $location.$$host + ':' + $location.port() + proxyNames + '/rest');
            var schedulerPortalUrl = angular.toJson($location.$$protocol + '://' + $location.$$host + ':' + $location.port() + proxyNames + '/scheduler');
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

mainModule.controller('mainController', function ($window, $http, $scope, $rootScope, $state, $stateParams, $location, $interval, $translate, $timeout, $uibModalStack, permissionService, SweetAlert, UtilsFactory) {

    this.$onInit = function () {
        $scope.main.userName = localStorage['pa.login'];
        $scope.startRegularCheckSession();
        $scope.contextDisplay = false;
        $scope.contextBucketDisplay = false;
        // contextPosition enables directive to specify where the context menu was opened
        $scope.contextPosition = '';
        $scope.firstAccessiblePortal = '';
        $scope.portalsAccessPermission = {};
        $scope.automationDashboardPortals = {};
        $rootScope.errorMessage = undefined;
        if (getSessionId()) {
            if (!localStorage['restUrl']) {
                var restUrl = angular.toJson($location.$$protocol + '://' + $location.$$host + ':' + $location.port() + UtilsFactory.getProxyNames() + '/rest')
                localStorage['restUrl'] = restUrl;
            }
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

    $scope.getImageUrlWithProxy = function (url) {
        return UtilsFactory.getProxyNames() + url;
    }

    $scope.startRegularCheckSession = function () {
        if (!$scope.checkSessionInterval) {
            $scope.checkSessionInterval = $scope.$interval(checkSession, 15000);
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
                    } else {
                        $rootScope.isLoggedOut = false;
                        if ($('#login-view').is(':visible') && !$scope.firstAccessiblePortal) {
                            $scope.main.userName = localStorage['pa.login'];
                            var sessionid = getSessionId();
                            if (sessionid) {
                                $scope.determineFirstAuthorizedPortalAndAllPortalsAccessPermission($scope.redirectsTo);
                            }
                            $rootScope.serverIsDown = false;
                        }
                    }
                })
                .catch(function (response) {
                    console.error('Error checking if session is valid:', response);
                    $rootScope.isLoggedOut = true;
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
        if (url && !url.includes('submit') && !url.includes('job-info')) {
            portal = url.substring(url.lastIndexOf('/') + 1, (url.lastIndexOf('?') > 0 ? url.lastIndexOf('?') : undefined));
        } else if (url && url.includes('submit')) {
            portal = 'submit'
        } else if (url && url.includes('job-info')) {
            portal = 'job-info'
        }
        $state.get().forEach(function (item) {
            if (item.name && item.name !== 'login' && item.name !== 'portal' && item.name !== 'job-info' && !item.name.includes('submit')) {
                $scope.automationDashboardPortals[item.url.substring(1)] = item.name;
                $scope.portalsAccessPermission[item.url.substring(1)] = false;
            }
        });
        var portals = Object.keys($scope.automationDashboardPortals).concat(['studio', 'rm', 'scheduler']);
        permissionService.getPortalsAccessPermission(portals).then(function (response) {
            if (Array.isArray(response.data) && response.data.length) {
                const name = getDefaultPortalName();
                var doHaveAccessToWA = response.data.indexOf(name);

                $scope.firstAccessiblePortal = doHaveAccessToWA !== -1 ? response.data[doHaveAccessToWA] : response.data[0];
                response.data.forEach(function (authorizedPortal) {
                    $scope.portalsAccessPermission[authorizedPortal] = true;
                });
                if (portal) {
                    if ($scope.portalsAccessPermission[portal]) {
                        $state.go($scope.automationDashboardPortals[portal]);
                    } else if ((portal !== 'job-info' && !portal.includes('submit')) || doHaveAccessToWA === -1) {
                        displayAlertAndRedirectToFirstAccessiblePortalIfExist(portal);
                    } else if (portal.includes('submit') || portal.includes('job-info')) {
                        // open the previous url with the same params
                        window.open(sessionStorage['previousUrlBeforeLogin'], '_self')
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
    // the default portal is 'health-dashboard' on mobile device and 'workflow-execution' on desktop
    function getDefaultPortalName(data) {
        if( isMobileDevice() ) {
            return 'health-dashboard';
        } else {
            return 'workflow-execution'
        }
    }

    function isMobileDevice() {
      const userAgent = navigator.userAgent.toLowerCase();
      return /iphone|ipod|android|blackberry|windows phone|mobile/i.test(userAgent);
    }


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
        $rootScope.$broadcast('event:StopRefreshing');
    };

    $scope.disconnect = function () {
        var disconnectUrlPrefix = JSON.parse(localStorage.schedulerRestUrl) + 'disconnect';
        $http.put(disconnectUrlPrefix, null, {headers: {'sessionid': getSessionId()}})
            .catch(function (response) {
                console.error('Error while disconnecting:', response);
            });
    };

    $scope.displayContextualMenu = function (clickEvent, position, isWEJobRowContextMenu, data) {
        clickEvent.stopPropagation();
        $scope.contextPosition = position;
        $scope.contextDisplay = true;
        var isNeedToInjectDataInContextMenuScope = false;
        if (isWEJobRowContextMenu) {
            isNeedToInjectDataInContextMenuScope = waitAndApplyWEJobRowContextMenuDisplay(data);
        }
        if (data && isNeedToInjectDataInContextMenuScope) {
            injectDataInContextMenuScope(data);
        }
    };

    // display context-menu on buckets in the catalog
    $scope.displayContextualMenuOnBucket = function (clickEvent, position) {
        //display the context menu on bucket
        $scope.contextBucketDisplay = true;
        // close context menu on objects
        $scope.contextDisplay = false;
    };

    // display context-menu on node name

    $scope.displayContextualMenuOnNodeName = function () {
        //display the context menu on bucket
        $scope.contextNodeNameDisplay = true;
        // close context menu on objects
        $scope.contextDisplay = false;
    }


    function waitAndApplyWEJobRowContextMenuDisplay(data) {
        if (!$('#context-menu').length) {
            // we set an observation in order to wait for the render of the context menu
            var observer = new MutationObserver(function (mutations) {
                var contextMenuIncludeElement = angular.element('#context-menu')[0].children[0].children[0];
                if (mutations.length && contextMenuIncludeElement) {
                    // Remove the dropdown-menu class which prevents the context-menu to be displayed
                    angular.element(contextMenuIncludeElement.childNodes[0]).removeClass('dropdown-menu');
                    closeJobRowOtherActionsDropDown();
                    observer.disconnect();
                }
            });
            observer.observe($('#workflow-execution-main')[0], {
                childList: true,
                subtree: true
            })
            return false;
        } else {
            return true;
        }
    }

    function injectDataInContextMenuScope(data) {
        Object.keys(data).forEach(function (key) {
            angular.element(document.getElementById('context-menu')).scope()[key] = data[key];
        });
    }

    function closeJobRowOtherActionsDropDown() {
        var dropdownMenu = angular.element(document.getElementsByClassName('dropdown-menu dropdown-menu-right custom-dropdown ng-scope'));
        if (dropdownMenu) {
            dropdownMenu.toggle();
        }
    }

    $scope.hideContextualMenu = function (event) {
        if (!event) {
            // It's a scroll event
            return;
        } else {
            $scope.contextDisplay = false;
            $scope.contextBucketDisplay = false;
            $scope.contextNodeNameDisplay = false;
        }
    };

    // Check if position match with the position set by displayContextualMenu
    $scope.isContextView = function (position) {
        return $scope.contextPosition === position;
    };

    // Move the contextual menu near the click according to its position in the window
    $scope.moveContextualMenu = function (clickEvent) {
        $timeout(callBack, 10);

        function callBack() {
            var contextMenuHeight = angular.element('#context-menu')[0].offsetHeight;
            //if contextual menu will get out of the panel catalog-tab-content, we display it upper
            if (clickEvent['clientY'] + contextMenuHeight < window.innerHeight && contextMenuHeight > 2) {
                angular.element('#context-menu').css('top', clickEvent['clientY'] + 'px')
            } else {
                angular.element('#context-menu').css('top', (clickEvent['clientY'] - contextMenuHeight) + 'px')
            }

            var contextMenuWidth = angular.element('#context-menu')[0].offsetWidth;
            //if contextual menu will get out of the panel catalog-tab-content, we display it upper
            if ((clickEvent['clientX'] + contextMenuWidth < window.innerWidth)) {
                angular.element('#context-menu').css('left', clickEvent['clientX'] + 'px')
            } else {
                angular.element('#context-menu').css('left', (clickEvent['clientX'] - contextMenuWidth) + 'px')
            }
            angular.element('#context-menu').removeClass('opacity-0');
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
mainModule.controller('navBarController', function ($scope, $rootScope, $http, $interval, $timeout, $uibModal) {
    this.$onInit = function () {

        // set favicon icon of the current portal
        setUpFavicon();

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
        fetchUserData();

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
        $('body').toggleClass('mini-navbar');
        if (!$('body').hasClass('mini-navbar') || $('body').hasClass('body-small')) {
            // Hide menu in order to smoothly turn on when maximize menu
            $('#side-menu').hide();
            // For smoothly turn on menu
            setTimeout(
                function () {
                    $('#side-menu').fadeIn(400);
                }, 200);
        } else if ($('body').hasClass('fixed-sidebar')) {
            $('#side-menu').hide();
            setTimeout(
                function () {
                    $('#side-menu').fadeIn(400);
                }, 100);
        } else {
            // Remove all inline style from jquery fadeIn function to reset menu state
            $('#side-menu').removeAttr('style');
        }
        $('#side-menu .nav.nav-second-level.collapse.in').parent().toggleClass('active')
        $('#side-menu .nav.nav-second-level.collapse').collapse('hide')
    }

    function fetchUserData() {
        var requestGetAccountInfoUrl = JSON.parse(localStorage['restUrl']) + '/common/currentuserdata';
        var config = {headers: {'sessionid': getSessionId()}};
        $http.get(requestGetAccountInfoUrl, config).then(function (result) {
            $scope.accountUsername = result.data.userName;
            $scope.accountDomain = result.data.domain;
            $scope.accountGroups = '';
            for (var i = 0; i < result.data.groups.length; i++) {
                $scope.accountGroups = $scope.accountGroups + result.data.groups[i];
                if (i < result.data.groups.length - 1) {
                    $scope.accountGroups = $scope.accountGroups + ', ';
                }
            }
            $scope.accountTenant = result.data.tenant;
            $scope.accountAdminRolesArray = result.data.adminRoles;
            $scope.accountAdminRoles = result.data.adminRoles.join(", ");
            $scope.accountPortalAccessPermissionDisplay = '';
            for (var i = 0; i < result.data.portalAccessPermissionDisplay.length; i++) {
                $scope.accountPortalAccessPermissionDisplay = $scope.accountPortalAccessPermissionDisplay + result.data.portalAccessPermissionDisplay[i];
                if (i < result.data.portalAccessPermissionDisplay.length - 1) {
                    $scope.accountPortalAccessPermissionDisplay = $scope.accountPortalAccessPermissionDisplay + ', ';
                }
            }
        });
    }

    function setUpFavicon() {
        $timeout(function () {
            var portal = getCurrentPortalName();
            $scope.changeFavicon(portal)
        }, 1000)
    }

    function getCurrentPortalName() {
        var jobAnalyticsChildren = ['health-dashboard', 'job-analytics', 'job-gantt', 'node-gantt'];
        var jobPlannerChildren = ['job-planner-calendar-def', 'job-planner-calendar-def-workflows', 'job-planner-execution-planning', 'job-planner-gantt-chart'];
        var splitUrl = window.location.hash.split('/');
        var urlParts = splitUrl[splitUrl.length - 1];
        var portal;
        if (jobAnalyticsChildren.indexOf(urlParts) !== -1) {
            portal = 'analytics-portal';
        } else if (jobPlannerChildren.indexOf(urlParts) !== -1) {
            portal = 'job-planner-portal';
        } else if (splitUrl[splitUrl.length - 1] === 'workflow-execution') {
            portal = 'automation_dashboard_30';
        } else {
            portal = splitUrl[splitUrl.length - 1];
        }
        return portal;
    }

    $scope.openCloseNav = function () {
        angular.element('body').toggleClass("mini-navbar")
    }

    $scope.changeFavicon = function (portal) {
        changeFavicon(portal);
        setNotificationNBOnFavicon($scope.nbNewNotifications, true);
    }

    function changeFavicon(portal) {
        var link = document.createElement('link');
        var oldLink = document.getElementById('favicon');
        link.id = 'favicon';
        link.rel = 'icon';
        link.href = 'styles/patterns/' + portal + '.png';
        if (oldLink) {
            document.head.removeChild(oldLink);
        }
        document.head.appendChild(link);
    }

    $scope.displayAbout = function () {
        var url = window.location.href.split('/automation-dashboard')[0] + '/rest/';
        $scope.restUrl = url;
        $scope.year = new Date().getFullYear();
        $('#about-modal').modal('show');
    };

    $scope.openChangeLogoModal = function () {
        if ($scope.accountAdminRolesArray && $scope.accountAdminRolesArray.includes("Scheduler")) {
            $uibModal.open({
                templateUrl: 'views/modals/change_logo_modal.html',
                controller: 'changeLogoController',
                windowClass: 'fadeIn',
                keyboard: true,
                backdrop: 'static',
                size: 'm',
                resolve: {
                    accountAdminRolesArray: function () {
                        return $scope.accountAdminRolesArray;
                    }
                }
            });
        }
    };

    $scope.showAccountInfo = function () {
        $('#account-modal').modal('show');
    };

    // Close modals on escape key press
    $(document).keydown(function (e) {
        if (e.keyCode === 27) {
            $('#account-modal').modal('hide');
            $('#about-modal').modal('hide');
        }
    });

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
                    setNotificationNBOnFavicon($scope.nbNewNotifications, false)
                }
            })
            .error(function (response) {
                console.error('Error while querying notification service: ', response);
                if (response !== null && response.httpErrorCode === 401) {
                    $scope.closeSession();
                    $rootScope.serverIsDown = true;
                }
            });
    }

    // set notifications number on the favicon icon
    function setNotificationNBOnFavicon(nb, isChangingPortal) {
        // handle the case we don't need to add or update favicon
        if (($scope.previousNotificationNumber === 0 && nb === 0) || (!isChangingPortal && $scope.previousNotificationNumber === nb)) return;

        // Initialize favicon with notifications number
        var favicon = new Favico({
            animation: 'fade'
        });
        // Set the badge based on the value of nb
        if (nb) {
            favicon.badge(nb);
        } else {
            // Clear the badge when nb is 0 or undefined
            var portal = getCurrentPortalName();
            changeFavicon(portal)
        }

        $scope.previousNotificationNumber = nb;
    }

    $rootScope.$on('event:notificationsDestroyed', function () {
        startRegularUpdateNotificationLabel();
    });

    $rootScope.$on('event:notificationsInitialized', function () {
        stopRegularUpdateNotificationLabel();
    });

    $rootScope.$on('event:updatedNotificationsCount', function (event, data) {
        $scope.nbNewNotifications = data['count'];
        setNotificationNBOnFavicon($scope.nbNewNotifications, false);
    });

    this.$onDestroy = function () {
        if (angular.isDefined($scope.intervalNotificationUpdate)) {
            $interval.cancel($scope.intervalNotificationUpdate);
            $scope.intervalNotificationUpdate = undefined;
        }
    }
});

mainModule.controller('loginController', function ($scope, $http, $state, permissionService, $stateParams, $location, $rootScope) {
    $scope.redirectsTo = $stateParams.redirectsTo;
    var host = $location.host();
    $scope.showLinkAccountCreation = (host === 'try.activeeon.com' || host === 'azure-try.activeeon.com');

    this.$onInit = function () {
        $scope.domains = [];
        var currentUserData = getCookie('username') ? getCookie('username') : localStorage['pa.login'];

        if (!currentUserData) {
            $scope.getDomains();
            return;
        }

        const userNameDomainSplit = currentUserData.split('\\');

        if (userNameDomainSplit.length === 1) {
            $scope.username = userNameDomainSplit[0];
            $scope.getDomains();
        } else {
            $scope.username = userNameDomainSplit[1];
            $scope.getDomains(function () {
                $scope.selectedDomain = $scope.domains.find(function (domain) {
                    return domain === userNameDomainSplit[0];
                });
            });
        }
    };

    $scope.login = function () {
        var username = $scope.username;
        if ($scope.selectedDomain) {
            username = $scope.selectedDomain + '\\' + $scope.username;
        }
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
                $rootScope.serverIsDown = false;
            })
            .error(function (response) {
                try {
                    var error = JSON.parse(response);
                    $rootScope.errorMessage = error.errorMessage;
                    if (error.httpErrorCode === 404) {
                        if (error.stackTrace.indexOf('login.LoginException') < 0) {
                            $rootScope.errorMessage = 'The server is not available, please try again later.';
                        }
                    }
                } catch (e) {
                    $rootScope.errorMessage = 'Please try again later.'
                }
            });
    };

    $scope.getDomains = function (callBack) {
        $http.get(JSON.parse(localStorage.schedulerRestUrl) + 'domains/')
            .then(function (response) {
                $scope.domains = response.data;
                if ($scope.domains.length && !$scope.domains.includes('')) {
                    $scope.domains.unshift('');
                }
                if ($scope.domains.length) {
                    $scope.selectedDomain = $scope.domains[0];
                } else {
                    $scope.selectedDomain = '';
                }
                if (callBack) {
                    return callBack();
                }
            })
            .catch(function (response) {
                console.error('Error getting domains:', response);
            });
    }

});

mainModule.controller('logoutController', function ($scope, $state) {
    $scope.logout = function () {
        $('#confirm-logout-modal').modal('show');
    };

    $scope.confirmLogout = function () {
        $('#confirm-logout-modal').modal('hide');
        $scope.disconnect();
        $scope.closeSession();
    };
});

mainModule.controller('changeLogoController', function ($scope, $state, $uibModalInstance, $http, UtilsFactory, SweetAlert, accountAdminRolesArray) {

    $scope.isFileSelected = false;

    /*
        The goal is to trigger a cache refresh every 10 minutes by changing a
        query param of the PUT request sent to the server to update the Logo
    */
    $scope.timeRoundedToTenth = getNextTenthMinute();

    $scope.openUploadWindow = function () {
        $('#selected-image').click();
    };

    $scope.fileSelected = function () {
        const fileInput = document.getElementById('selected-image');
        const file = fileInput.files[0];
        const imageASByteArray = fileInput.files[0];
        if (file) {
            // Check file type
            const allowedTypes = ['image/png', 'image/jpeg'];
            if (!allowedTypes.includes(file.type)) {
                alert("Invalid file type. Please upload a PNG or JPEG image.");
                return;
            }

            // Save as data URL for image preview
            const imagePreviewReader = new FileReader();
            imagePreviewReader.onload = function (event) {
                $scope.$apply(function () {
                    $scope.uploadedImageSrc = event.target.result;
                    $scope.isFileSelected = true;
                });
            };
            imagePreviewReader.readAsDataURL(file);

            // Save as a byte array for request
            var byteReader = new FileReader();
            byteReader.onload = function (event) {
                var byteArray = new Uint8Array(event.target.result);
                $scope.$apply(function () {
                    $scope.fileAsByteArray = byteArray;
                });
            };
            byteReader.readAsArrayBuffer(file);
        } else {
            // No file is selected
            $scope.uploadedImageSrc = null;
            $scope.fileAsByteArray = null;
            $scope.isFileSelected = false;
        }
    };

    $scope.applyNewLogo = function () {
        var headers = {
            'sessionid': localStorage['pa.session'],
            'Content-Type': 'application/octet-stream'
        };

        $http.put(JSON.parse(localStorage.schedulerRestUrl) + 'logo?timeTenth='+ $scope.timeRoundedToTenth, $scope.fileAsByteArray, { headers: headers, transformRequest: angular.identity })
            .then(function (response) {
                $scope.clearFile();
                SweetAlert.swal(UtilsFactory.translate('Logo successfully updated'), "", "success");
            })
            .catch(function (error) {
                SweetAlert.swal(UtilsFactory.translate('Logo update failed'), error.error_message, "error");
            });
    };

    $scope.clearFile = function () {
        const fileInput = document.getElementById('selected-image');
        fileInput.value = '';
        $scope.uploadedImageSrc = null;
        $scope.fileAsByteArray = null;
        $scope.isFileSelected = false;

    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    function getNextTenthMinute() {
        const now = new Date();
        const minutes = now.getMinutes();
        // Round up to the next 10th minute
        const roundedMinutes = Math.ceil(minutes / 10) * 10;
        now.setMinutes(roundedMinutes, 0, 0);
        return now.getTime();
    }

    $(document).keydown(function (e) {
        // Escape keypress
        if (e.keyCode === 27) {
            $uibModalInstance.dismiss('cancel');
        }
    });
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
                        /*
                            contextMenuData holds the job data used by the context-menu that
                            is displayed when a right click in a job row of WE is done.
                            If contextMenuData is undefined, we are not on the WE portal.
                        */
                        if (scope.contextMenuData) {
                            scope.contextMenuData['job'] = scope.job;
                            scope.contextMenuData['subsLevel'] = scope.subsLevel;
                        }

                        if (attrs.ngRightClick !== '') {
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

                        var contextMenu = document.querySelector('.calendar-list');
                        if (contextMenu) {
                            contextMenu.addEventListener('click', function (event) {
                                event.stopPropagation();
                            });
                        }
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
