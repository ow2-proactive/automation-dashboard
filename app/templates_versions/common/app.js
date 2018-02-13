/**
 * INSPINIA - Responsive Admin Theme
 *
 */
(function() {
    angular.module('inspinia', [
            'ui.router', // Routing
            'ui.bootstrap', // Bootstrap
            'main',
            'angular-cron-gen',
            'moment-picker',
            //!DO NOT EDIT! The following code related to subviews is automatically generated with grunt build. You can't modify it from here.
            //See 'replace' task in Gruntfile.js and subviews definition in enterpriseSubviews.json.

            //beginSubviewsModules

            //endSubviewsModules
            'angularCSS'
        ])
        .config(['momentPickerProvider', function(momentPickerProvider) {
            momentPickerProvider.options({
                minutesFormat: 'HH:mm'
            });
        }])
})();
