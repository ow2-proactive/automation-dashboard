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
        'pca-rest',
        'app-rest',
        'wcp-rest',
        'ns-rest',
        'angularCSS'
    ])
})();
