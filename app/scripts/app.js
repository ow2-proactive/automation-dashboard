/**
 * INSPINIA - Responsive Admin Theme
 *
 */
(function () {
    angular.module('inspinia', [
        'ui.router',                    // Routing
        'ui.bootstrap',                 // Bootstrap
        'loginModule',
        'main',
        'service-automation',
        'workflow-automation'
    ])
})();
