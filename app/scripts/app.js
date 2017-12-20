/**
 * INSPINIA - Responsive Admin Theme
 *
 */
(function() {
    angular.module('inspinia', [
        'ui.router', // Routing
        'ui.bootstrap', // Bootstrap
        'loginModule',
        'main',
        //beginSubviewsModules

        'app-rest',
        'pca-rest',
        'wcp-rest',
        'ns-rest',
        //endSubviewsModules
        'angularCSS'
    ])
})();
