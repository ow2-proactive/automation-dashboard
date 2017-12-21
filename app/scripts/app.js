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
        //!DO NOT EDIT! The following code related to subviews is automatically generated with grunt build. You can't modify it from here.
        //See 'replace' task in Gruntfile.js and subviews definition in enterpriseSubviews.json.

        //beginSubviewsModules
        'app-rest',
        'pca-rest',
        'wcp-rest',
        'ns-rest',
        //endSubviewsModules
        'angularCSS'
    ])
})();
