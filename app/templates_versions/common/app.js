/**
 * INSPINIA - Responsive Admin Theme
 *
 */
(function() {
    angular.module('inspinia', [
        'ui.router', // Routing
        'ui.bootstrap', // Bootstrap
        'main',
        'angularMoment',
        'angular-cron-gen',
        'moment-picker',
        'mwl.calendar',
        //!DO NOT EDIT! The following code related to subviews is automatically generated with grunt build. You can't modify it from here.
        //See 'replace' task in Gruntfile.js and subviews definition in enterpriseSubviews.json.

        //beginSubviewsModules

        //endSubviewsModules
        'angularCSS',
        'ui.codemirror',
        'gantt',
        'gantt.tooltips',
        'ui.tree',
        'gantt.tree',
        'gantt.groups',
        'gantt.corner'
    ])
        .config(['momentPickerProvider',
            function(momentPickerProvider) {
                momentPickerProvider.options({
                    minutesFormat: 'HH:mm'
                });
            }
        ])
        .config(['calendarConfig',
            function(calendarConfig) {
                calendarConfig.allDateFormats.moment.date.hour = 'HH:mm';
                calendarConfig.showTimesOnWeekView = true;
            }
        ])
        .config(['$compileProvider',
            function($compileProvider) {
                $compileProvider.debugInfoEnabled(false);
            }
        ]);
})();
