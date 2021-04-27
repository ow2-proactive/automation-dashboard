/**
 * INSPINIA - Responsive Admin Theme
 *
 */


/**
 * pageTitle - Directive for set Page title - mata title
 */
function pageTitle($rootScope, $timeout) {
    return {
        link: function (scope, element) {
            var listener = function (event, toState, toParams, fromState, fromParams) {
                // Default title - load on Dashboard 1
                var title = 'ProActive Automation Dashboard';
                // Create your own title pattern
                if (toState.data && toState.data.pageTitle) {
                    title += ' | ' + toState.data.pageTitle;
                }

                $timeout(function () {
                    element.text(title);
                });
            };
            $rootScope.$on('$stateChangeStart', listener);
        }
    }
};

/**
 * sideNavigation - Directive for run metsiMenu on sidebar navigation
 */
function sideNavigation($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element) {
            // Call the metsiMenu plugin and plug it to sidebar navigation
            $timeout(function () {
                element.metisMenu();
            });
        }
    };
};

/**
 * iboxTools - Directive for iBox tools elements in right corner of ibox
 */
function iboxTools($timeout) {
    return {
        restrict: 'A',
        scope: true,
        templateUrl: 'views/common/ibox_tools.html',
        controller: function ($scope, $element) {
            // Function for collapse ibox
            $scope.showhide = function () {
                var ibox = $element.closest('div.ibox');
                var icon = $element.find('i:first');
                var content = ibox.find('div.ibox-content');
                content.slideToggle(200);
                // Toggle icon from up to down
                icon.toggleClass('fa-chevron-up').toggleClass('fa-chevron-down');
                ibox.toggleClass('').toggleClass('border-bottom');
                $timeout(function () {
                    ibox.resize();
                    ibox.find('[id^=map-]').resize();
                }, 50);
            },
                // Function for close ibox
                $scope.closebox = function () {
                    var ibox = $element.closest('div.ibox');
                    ibox.remove();
                }
        }
    };
};

/**
 * minimalizaSidebar - Directive for minimalize sidebar
 */
function minimalizaSidebar($timeout) {
    return {
        restrict: 'A',
        template: '<a class="navbar-minimalize minimalize-styl-2 btn btn-primary" style="color: #002d66" href="" ng-click="minimalize()" ><i class="fa fa-bars" style="color: #002d66"></i></a>',
        controller: function ($scope, $element) {
            $scope.minimalize = function () {
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
            }
        }
    };
};

/**
 * iboxTools with full screen - Directive for iBox tools elements in right corner of ibox with full screen option
 */
function iboxToolsFullScreen($timeout) {
    return {
        restrict: 'A',
        scope: true,
        templateUrl: 'views/common/ibox_tools_full_screen.html',
        controller: function ($scope, $element) {
            // Function for collapse ibox
            $scope.showhide = function () {
                var ibox = $element.closest('div.ibox');
                var icon = $element.find('i:first');
                var content = ibox.find('div.ibox-content');
                content.slideToggle(200);
                // Toggle icon from up to down
                icon.toggleClass('fa-chevron-up').toggleClass('fa-chevron-down');
                ibox.toggleClass('').toggleClass('border-bottom');
                $timeout(function () {
                    ibox.resize();
                    ibox.find('[id^=map-]').resize();
                }, 50);
            };
            // Function for close ibox
            $scope.closebox = function () {
                var ibox = $element.closest('div.ibox');
                ibox.remove();
            };
            // Function for full screen
            $scope.fullscreen = function () {
                var ibox = $element.closest('div.ibox');
                var button = $element.find('i.fa-expand');
                $('body').toggleClass('fullscreen-ibox-mode');
                button.toggleClass('fa-expand').toggleClass('fa-compress');
                ibox.toggleClass('fullscreen');
                setTimeout(function () {
                    $(window).trigger('resize');
                }, 100);
            }
        }
    };
}

/**
 * icheck - Directive for custom checkbox icheck
 */
function icheck($timeout) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function ($scope, element, $attrs, ngModel) {
            return $timeout(function () {
                var value;
                value = $attrs['value'];

                $scope.$watch($attrs['ngModel'], function (newValue) {
                    $(element).iCheck('update');
                })

                return $(element).iCheck({
                    checkboxClass: 'icheckbox_square-green',
                    radioClass: 'iradio_square-green'

                }).on('ifChanged', function (event) {
                    if ($(element).attr('type') === 'checkbox' && $attrs['ngModel']) {
                        $scope.$apply(function () {
                            return ngModel.$setViewValue(event.target.checked);
                        });
                    }
                    if ($(element).attr('type') === 'radio' && $attrs['ngModel']) {
                        return $scope.$apply(function () {
                            return ngModel.$setViewValue(value);
                        });
                    }
                });
            });
        }
    };
}

/**
 * slimScroll - Directive for slimScroll with custom height
 */
function slimScroll($timeout) {
    return {
        restrict: 'A',
        scope: {
            boxHeight: '@'
        },
        link: function (scope, element) {
            $timeout(function () {
                element.slimscroll({
                    height: scope.boxHeight,
                    railOpacity: 0.9
                });

            });
        }
    };
}


/**
 * backToTop - from https://github.com/padsbanger/angular-backtop
 * with slight modifications to remove themes
 */
function backToTop() {
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        template: '<div id="backtop"><button><div ng-transclude></div></button></div>',
        scope: {
            text: '@buttonText',
            speed: '@scrollSpeed'
        },
        link: function (scope, element) {

            scope.text = scope.text || 'Scroll top';
            scope.speed = parseInt(scope.speed, 10) || 300;

            var speed = Math.round(scope.speed / 100);
            var onscroll = function () {
                if (window.pageYOffset > 0) {
                    if (!element.showing) {
                        element.addClass('show');
                        element.showing = true;
                    }
                } else {
                    element.removeClass('show');
                    element.showing = false;
                }
            };

            scope.currentYPosition = function () {
                if (document.documentElement && document.documentElement.scrollTop) {
                    return document.documentElement.scrollTop;
                }
                if (document.body.scrollTop) {
                    return document.body.scrollTop;
                }
                return 0;
            };

            element.showing = false;
            element.on('click', function () {
                window.removeEventListener('scroll', onscroll);

                element.removeClass('show');
                element.showing = false;

                var startY = scope.currentYPosition();

                var step = Math.round(startY / 25);
                var leapY = startY < 100 ? 0 : startY - step;

                var scrollInterval = setInterval(function () {
                    window.scrollTo(0, leapY)
                    if (!leapY) {
                        clearInterval(scrollInterval);
                        window.addEventListener('scroll', onscroll)
                    }

                    leapY -= step;

                    if (leapY < 0) leapY = 0;
                }, speed)
            });

            window.addEventListener('scroll', onscroll);
            scope.$on('$destroy', function () {
                window.removeEventListener('scroll', onscroll)
            })
        }
    };

}

/**
 * CAUTION : Use only on dropdown-toggle elements where the dropdown menu is : 1) loaded from a template and 2) append-dropdown-to-body is used on the parent uib-dropdown element
 * Directive to display and position a uib-dropdown menu when appended-to-body while using a template
 * It is a workaround to a non-fixed issue in UI-Bootstrap library since 2015 (see https://github.com/angular-ui/bootstrap/issues/4240)
 * The implementation of this directive is mainly code snipets adapted from UI-Bootstrap library. It uses a home-made fix by Activeeon and not the suggested fixes in the issue top above.
 */
function showDropdownFromTemplate($timeout, $uibPosition) {
    return {
        restrict: 'A',
        scope: {},
        link: link
    };

    function link(scope, element) {
        element.bind('click', onClick);
    }

    function onClick(e) {
        // Wait for the dropdown element to be loaded from its template and added to the DOM
        $timeout(function () {
            var element = angular.element(e.currentTarget);
            var ul = angular.element('.dropdown-menu.custom-dropdown')
            var pos = $uibPosition.positionElements(element, ul, 'bottom-left', true),
                css,
                rightalign,
                scrollbarPadding,
                scrollbarWidth = 0;

            css = {
                top: pos.top + 'px',
                display: 'block'
            };

            rightalign = ul.hasClass('dropdown-menu-right');
            if (!rightalign) {
                css.left = pos.left + 'px';
                css.right = 'auto';
            } else {
                css.left = 'auto';
                scrollbarPadding = $uibPosition.scrollbarPadding(angular.element('body'));

                if (scrollbarPadding.heightOverflow && scrollbarPadding.scrollbarWidth) {
                    scrollbarWidth = scrollbarPadding.scrollbarWidth;
                }

                css.right = window.innerWidth - scrollbarWidth -
                    (pos.left + element.prop('offsetWidth')) + 'px';
            }
            ul.css(css)
        }, 10)
    }
}

/**
 *
 * Pass all functions into module
 */
angular
    .module('inspinia')
    .directive('iboxTools', iboxTools)
    .directive('iboxToolsFullScreen', iboxToolsFullScreen)
    .directive('icheck', icheck)
    .directive('minimalizaSidebar', minimalizaSidebar)
    .directive('pageTitle', pageTitle)
    .directive('sideNavigation', sideNavigation)
    .directive('slimScroll', slimScroll)
    .directive('backTop', backToTop)
    .directive('showDropdownFromTemplate', showDropdownFromTemplate);
