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
            var listener = function (event, toState) {
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
}

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
}

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
            }
            // Function for close ibox
            $scope.closebox = function () {
                var ibox = $element.closest('div.ibox');
                ibox.remove();
            }
        }
    };
}

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
}

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

function noNegative() {
    return {
          restrict: 'A',
          require: 'ngModel',
          link: function(scope, element, attrs, ngModel) {
            ngModel.$validators.noNegative = function(value) {
              return value >= 0;
            };

            element.on('keydown', function(event) {
              if (event.key === '-' || event.key === 'e' || event.key === 'E') {
                event.preventDefault();
              }
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
function showDropdownFromTemplate($document, $timeout, $uibPosition) {
    return {
        restrict: 'A',
        scope: {},
        link: link
    };

    function link(scope, element) {
        element.bind('click', onClick);
    }

    function waitForElement(selector, callback) {
        if (angular.element(selector).length) {
            callback();
        } else {
            $timeout(function () {
                waitForElement(selector, callback);
            }, 100);
        }
    }

    function onClick(e) {
        // Wait for the dropdown element to be loaded from its template and added to the DOM
        waitForElement('body.uib-dropdown-open', function () {
            var element = angular.element(e.currentTarget);
            if (!jQuery(element).siblings('ul.dropdown-menu').length) {
                waitForElement('.dropdown-menu.custom-dropdown', function () {
                    var ul = angular.element('.dropdown-menu.custom-dropdown')
                    var pos = $uibPosition.positionElements(element, ul, 'bottom-left', true),
                        css,
                        rightAlign,
                        scrollbarPadding,
                        scrollbarWidth = 0;

                    css = {
                        top: pos.top + 'px',
                        display: 'block'
                    };

                    rightAlign = ul.hasClass('dropdown-menu-right');
                    if (!rightAlign) {
                        css.left = pos.left + 'px';
                        css.right = 'auto';
                    } else {
                        css.left = 'auto';
                        scrollbarPadding = $uibPosition.scrollbarPadding(angular.element('body'));

                        if (scrollbarPadding.heightOverflow && scrollbarPadding.scrollbarWidth) {
                            scrollbarWidth = scrollbarPadding.scrollbarWidth;
                        }

                        css.right = window.innerWidth - scrollbarWidth - (pos.left + element.prop('offsetWidth')) + 'px';
                    }
                    ul.css(css)
                })
            }
        });
    }
}

/**
 * Upload the file, call the function specified in "input-file-change" attribute on change event.
 */
function inputFileChange($parse, $timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var onChangeHandler = $parse(attrs.inputFileChange);
            element.bind('change', function () {
                $timeout(function () {
                    onChangeHandler(scope);
                });
            });
        }
    };
}

/**
 * Upload the selected items: push new items to selected items
 * inputs: selectedItems and allItems
 * output: a new selectedItems
 */
function multiselectShiftKey() {
    return {
        restrict: 'AE',
        scope: {
            selectedItems: '=selectedItems',
            allItems: '=items'
        },
        link: function (scope, element) {
            const shiftKey = 16;
            const upKey = 38;
            const downKey = 40;
            var ctrlDown = false;
            element.keydown(function (event) {
                if (event.keyCode == shiftKey) ctrlDown = true;
            }).keyup(function (event) {
                if (event.keyCode == shiftKey) ctrlDown = false;
            });

            // select rows in table when user press shift key and ArrowUp or ArrowDown
            element.keydown(function (event) {
                if (scope.allItems.result && !Array.isArray(scope.allItems.result)) return;
                if (ctrlDown && event.keyCode == upKey && scope.selectedItems && scope
                    .selectedItems.length) {
                    moveUp();
                } else if (ctrlDown && event.keyCode == downKey && scope.selectedItems && scope
                    .selectedItems.length) {
                    moveDown();
                }
            })

            function moveUp() {
                const lastSelectIndex = scope.allItems.result.findIndex(function (association) {
                    return association.id === scope.selectedItems[scope.selectedItems
                        .length - 1].id;
                });
                var index = scope.selectedItems.findIndex(function (item, index) {
                    return index > 0 && item.id === scope.allItems.result[lastSelectIndex - 1].id;
                })

                if (index >= 0) { // the item is already in the list
                    scope.selectedItems.splice(index, 1)
                }

                var nextWorkflow;
                if (lastSelectIndex) {
                    nextWorkflow = scope.allItems.result[lastSelectIndex - 1];
                } else if (lastSelectIndex === 0) {
                    nextWorkflow = scope.allItems.result[scope.allItems.result.length - 1];
                }

                scope.$apply(function () {
                    scope.selectedItems.push(nextWorkflow);
                });
            }

            function moveDown() {
                const lastSelectIndex = scope.allItems.result.findIndex(function (association) {
                    return association.id === scope.selectedItems[scope.selectedItems
                        .length - 1].id;
                });

                var index = scope.selectedItems.findIndex(function (item) {
                    return item.id === scope.allItems.result[lastSelectIndex + 1].id;
                })

                if (index >= 0) { // the item is already in the list
                    scope.selectedItems.splice(index, 1);
                }

                if (lastSelectIndex !== scope.allItems.result.length - 1) {
                    scope.$apply(function () {
                        scope.selectedItems.push(scope.allItems.result[lastSelectIndex + 1]);
                    });
                }
            }

            scope.$on('$destroy', function () {
                element.off('keydown');
            })
        }
    }
}

function copyClipBoard() {
    return {
        restrict: 'A',
        link: link
    };

    function link(scope, element, attrs) {
        element.bind('click', function () {
            var copyInput = document.getElementById('direct-object-url-input');
            copyInput.select(); //select the text area
            document.execCommand('copy');
        });
    }

}

/**
 * Displays a tooltip that shows the whole text of a truncated element (by ellipsis or else)
 * Requires using a "tooltip-enable=true" attribute and set by default to true.
 * @returns {{link: link, restrict: string}}
 */
function ellipsisTooltip() {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            const el = element[0];
            const ttDisableAttr = 'tooltipEnable';
            const ttEventTrigger = 'mouseenter';

            const ttShowEventBind = function (event, isTriggeredByItself) {
                if (el.offsetHeight < el.scrollHeight) {
                    attrs.$set(ttDisableAttr, 'true');
                    if (!isTriggeredByItself) {
                        element.triggerHandler(ttEventTrigger, [true]);
                    }
                    scope.$applyAsync(function () {
                        attrs.$set(ttDisableAttr, 'false');
                    });
                }
            };

            if (angular.isObject(el)) {
                attrs.$set(ttDisableAttr, 'false');
                element.on(ttEventTrigger, ttShowEventBind);
                element.on('$destroy', function () {
                    element.off(ttEventTrigger, ttShowEventBind);
                });
            }
        }
    };
}

function uiSelectDirective($timeout) {
    return {
        restrict: 'E',
        scope: false,
        link: function (scope, element, attrs) {
            $timeout(function () {
                const selectElement = element[0].querySelector('.ui-select-container');
                const uiSelect = angular.element(selectElement).controller('uiSelect');
                $timeout(
                    function () {
                        uiSelect.open = true;
                        uiSelect.activate(false, true);
                    });
            });
        }
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
    .directive('showDropdownFromTemplate', showDropdownFromTemplate)
    .directive('inputFileChange', inputFileChange)
    .directive('ellipsisTooltip', ellipsisTooltip)
    .directive('copyClipBoard', copyClipBoard)
    .directive('multiselectShiftKey', multiselectShiftKey)
    .directive('uiSelectDirective', uiSelectDirective)
    .directive('noNegative', noNegative);
