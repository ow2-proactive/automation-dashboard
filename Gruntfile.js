'use strict';
module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Show grunt task time
    require('time-grunt')(grunt);

    // Configurable paths for the app
    var appConfig = {
        app: 'app',
        dist: 'dist',
        conf: 'templates_versions',
        version: grunt.option('target') || 'enterprise'
    };

    var enterpriseConfigPath = 'app/templates_versions/enterprise/subviews.json';
    var communityConfigPath = 'app/templates_versions/community/subviews.json';
    var subviewsDefinition = grunt.file.readJSON('app/templates_versions/' + appConfig.version + '/subviews.json');
    // Convenience function to list all subviews
    // associated to the target
    function listSubviewsDefinition(configPath) {
        var out = [];
        var subviewsDefinition = grunt.file.readJSON(configPath);
        for (var key in subviewsDefinition) {
            if (subviewsDefinition[key].isSubMenuTitle)
                continue;
            out.push({
                expand: true,
                cwd: subviewsDefinition[key].appFolder + 'styles/',
                src: subviewsDefinition[key].cssFile,
                dest: '<%= inspinia.dist %>/styles/' + subviewsDefinition[key].nameForUrl
            });
            if (subviewsDefinition[key].isAvailable) {
                var path = subviewsDefinition[key].appFolder + 'views/' + subviewsDefinition[key].htmlFile;
                var exists = grunt.file.exists(path);
                if (!exists) {
                    grunt.fail.warn('File ' + path + ' doesn\'t exist.');
                }
                out.push({
                    expand: true,
                    cwd: subviewsDefinition[key].appFolder + 'views/',
                    src: subviewsDefinition[key].htmlFile,
                    dest: '<%= inspinia.dist %>/views/' + subviewsDefinition[key].nameForUrl
                });
            } else {
                out.push({
                    expand: true,
                    cwd: subviewsDefinition[key].appFolder + 'views/',
                    src: subviewsDefinition[key].notAvailablePage,
                    dest: '<%= inspinia.dist %>/views/' + subviewsDefinition[key].nameForUrl
                });
            }
            if (subviewsDefinition[key].images) {
                for (var imageKey in subviewsDefinition[key].images) {
                    out.push({
                        expand: true,
                        cwd: subviewsDefinition[key].appFolder + 'styles/patterns/',
                        src: subviewsDefinition[key].images[imageKey],
                        dest: '<%= inspinia.dist %>/styles/'+ subviewsDefinition[key].nameForUrl
                    });
                }
            }
            if (subviewsDefinition[key].secondaryHtmlFiles){
                for (var htmlFileKey in subviewsDefinition[key].secondaryHtmlFiles) {
                    var path = subviewsDefinition[key].appFolder + 'views/' + subviewsDefinition[key].secondaryHtmlFiles[htmlFileKey];
                    var exists = grunt.file.exists(path);
                    if (!exists) {
                        grunt.fail.warn('File ' + path + ' doesn\'t exist.');
                    }
                    out.push({
                        expand: true,
                        cwd: subviewsDefinition[key].appFolder + 'views/',
                        src: subviewsDefinition[key].secondaryHtmlFiles[htmlFileKey],
                        dest: '<%= inspinia.dist %>/views/' + subviewsDefinition[key].nameForUrl
                    });
                }
            }
            if (subviewsDefinition[key].resources){
                for (var resourceFileKey in subviewsDefinition[key].resources) {
                    var path = subviewsDefinition[key].appFolder + '/' + subviewsDefinition[key].resources[resourceFileKey];
                    var exists = grunt.file.exists(path);
                    if (!exists) {
                        grunt.fail.warn('File ' + path + ' doesn\'t exist.');
                    }
                    out.push({
                        expand: true,
                        cwd: subviewsDefinition[key].appFolder + '/',
                        src: subviewsDefinition[key].resources[resourceFileKey],
                        dest: '<%= inspinia.dist %>/resources/' + subviewsDefinition[key].nameForUrl
                    });
                }
            }
        }
        return out;
    }

    //function used to get all translation files from automation dashboard and subviews in a table that will be passed as input to the 'json_merge' grunt task
    function getJSONFilesToMerge(lang) {
        var includedScripts = [];
        for (var key in subviewsDefinition) {
            if (subviewsDefinition[key].isAvailable && !subviewsDefinition[key].isSubMenuTitle) {
                includedScripts.push(subviewsDefinition[key].appFolder + 'resources/locales/locale-' + lang + '.json');
            }
        }
        includedScripts.push('<%= inspinia.app %>/resources/locales/locale-' + lang + '.json');
        return includedScripts;
    }

    // Grunt configuration
    grunt.initConfig({

        // Project settings
        inspinia: appConfig,

        // The grunt server settings
        connect: {
            options: {
                port: 9000,
                hostname: 'localhost',
                livereload: 35729
            },
            livereload: {
                options: {
                    open: true,
                    middleware: function (connect) {
                        return [
                            connect.static('.tmp'),
                            connect().use(
                                '/bower_components',
                                connect.static('./bower_components')
                            ),
                            connect.static(appConfig.app)
                        ];
                    }
                }
            },
            dist: {
                options: {
                    open: true,
                    base: '<%= inspinia.dist %>'
                }
            }
        },
        // Compile less to css
        less: {
            development: {
                options: {
                    compress: true,
                    optimization: 2
                },
                files: {
                    "app/styles/style.css": "app/less/style.less"
                }
            }
        },
        // Watch for changes in live edit
        watch: {
            styles: {
                files: ['app/less/**/*.less'],
                tasks: ['less', 'copy:styles'],
                options: {
                    nospawn: true,
                    livereload: '<%= connect.options.livereload %>'
                },
            },
            js: {
                files: ['<%= inspinia.app %>/scripts/{,*/}*.js'],
                options: {
                    livereload: '<%= connect.options.livereload %>'
                }
            },
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: [
                    '<%= inspinia.app %>/**/*.html',
                    '.tmp/styles/{,*/}*.css',
                    '<%= inspinia.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
                ]
            }
        },
        // If you want to turn on uglify you will need write your angular code with string-injection based syntax
        // For example this is normal syntax: function exampleCtrl ($scope, $rootScope, $location, $http){}
        // And string-injection based syntax is: ['$scope', '$rootScope', '$location', '$http', function exampleCtrl ($scope, $rootScope, $location, $http){}]
        uglify: {
            options: {
                mangle: false
            }
        },
        // Clean dist folder
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= inspinia.dist %>/{,*/}*',
                        '!<%= inspinia.dist %>/.git*',
                        '<%= inspinia.app %>/scripts/config.js',
                        '<%= inspinia.app %>/scripts/app.js',
                        '<%= inspinia.app %>/index.html'
                    ]
                }]
            },
            server: '.tmp'
        },
        // Copies remaining files to places other tasks can use
        copy: {
            dist: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= inspinia.app %>',
                        dest: '<%= inspinia.dist %>',
                        src: [
                            '*.{ico,png,txt}',
                            '.htaccess',
                            '*.html',
                            'views/{,*/}*.html',
                            'styles/patterns/*.*',
                            'styles/patterns/img/*.*',
                            'styles/patterns/img/wf-icons/{,*/}*.*',
                            'styles/patterns/img/objects-icons/{,*/}*.*',
                            'img/{,*/}*.*',
                            'resources/{,*/}*.properties',
                            'resources/{,*/}*.json',
                            'resources/*.json',
                            'resources/fonts/*'
                        ]
                    },
                    {
                        expand: true,
                        dot: true,
                        cwd: 'bower_components/fontawesome',
                        src: ['fonts/*.*'],
                        dest: '<%= inspinia.dist %>'
                    },
                    {
                        expand: true,
                        dot: true,
                        cwd: 'bower_components/bootstrap',
                        src: ['fonts/*.*'],
                        dest: '<%= inspinia.dist %>'
                    },
                    {
                        expand: true,
                        flatten: true,
                        cwd: 'node_modules/angular-ui-grid',
                        src: ['fonts/ui-grid.*'],
                        dest: '<%= inspinia.dist %>/styles/fonts/'
                    }
                ]
            },
            styles: {
                expand: true,
                cwd: '<%= inspinia.app %>/styles',
                dest: '.tmp/styles/',
                src: '{,*/}*.css'
            },
            communitySubviews: {
                files: (function () {
                    return listSubviewsDefinition(communityConfigPath);
                })()
            },
            enterpriseSubviews: {
                files: (function () {
                    return listSubviewsDefinition(enterpriseConfigPath);
                })()
            }
        },
        // Configure files specific to the version
        replace: {
            dist: {
                options: {
                    patterns: [
                        {
                            // replace for config.js :
                            match: /\/\/beginSubviewsStates[\s\S]*\/\/endSubviewsStates/g,
                            replacement: function () {
                                var result = '';
                                var cnt = 0;
                                for (var key in subviewsDefinition) {
                                    if (subviewsDefinition[key].isSubMenuTitle)
                                        continue;
                                    cnt++;
                                    result += "\n.state('portal.subview" + cnt + "', {";
                                    result += "\nurl:'/" + subviewsDefinition[key].nameForUrl + "',";
                                    result += "\ndata: { pageTitle: '" + subviewsDefinition[key].name + "'},";
                                    if (subviewsDefinition[key].isAvailable) {
                                        result += "\ntemplateUrl:'views/" + subviewsDefinition[key].nameForUrl + "/" + subviewsDefinition[key].htmlFile + "',";
                                        result += "\ncss:'styles/" + subviewsDefinition[key].nameForUrl + "/" + subviewsDefinition[key].cssFile + "',";
                                        result += "\nauthenticate:" + subviewsDefinition[key].authenticate + ",";
                                        if (subviewsDefinition[key].initFunction) {
                                            var services = subviewsDefinition[key].initFunction.services.join(", ");
                                            result += "\nonEnter : function (" + services + ") {";
                                            result += "\n" + subviewsDefinition[key].initFunction.functionName + "(" + services + "); \n },";
                                            result += "\nonExit : function($rootScope){";
                                            result += "\n$rootScope.$broadcast('event:StopRefreshing');\n }";
                                        }
                                    } else {
                                        result += "\ntemplateUrl:'views/" + subviewsDefinition[key].nameForUrl + "/" + subviewsDefinition[key].notAvailablePage + "',";
                                        result += "\nauthenticate:false,";
                                    }
                                    result += "\n})\n";
                                }
                                result = '//beginSubviewsStates' + result + ';\n//endSubviewsStates';
                                return result;
                            }
                        },
                        {
                            // replace for navigation.html :
                            match: /<!-- beginSubviews-->[\s\S]*<!-- endSubviews-->/g,
                            replacement: function () {
                                var result = '';
                                result = '\n<li id="collapse-menu" style="margin-top:-4px;"> <a href="javascript:void(0)"  ng-click ="collapseMenu()" style="background-color: #002d66;padding-right: 0px;padding-top: 0px; " ><i class="fa fa-angle-double-left pull-right" style="font-size:large;"></i></a></li>'
                                var cnt = 0;
                                for (var key in subviewsDefinition) {
                                    if (subviewsDefinition[key].isSubMenuTitle) {
                                        result += '\n<li id="'+subviewsDefinition[key].name+'" ng-show="showParentPortal(\'' + subviewsDefinition[key].name + '\')">'
                                            + '<a style="background-color: #002d66; "><img ng-src="styles/patterns/' + subviewsDefinition[key].nameForUrl + '.png" style="height:20px;padding-right: 6px;">'
                                            +'<span class="nav-label">{{\''+subviewsDefinition[key].name+'\' | translate}}</span><span class="fa arrow"></span></span></a>';
                                            result = result + '<ul class="nav nav-second-level collapse">';
                                            for(var subMenuKey in subviewsDefinition){
                                                if( subviewsDefinition[subMenuKey].subMenuTitle == subviewsDefinition[key].nameForUrl ){
                                                    cnt++;
                                                    result = result + '<li ui-sref-active="active" ng-click ="changeFavicon(\'' + subviewsDefinition[subMenuKey].subMenuTitle +'\')" ng-if="portalsAccessPermission[\'' + subviewsDefinition[subMenuKey].nameForUrl + '\']"><a ui-sref="portal.subview'
                                                     + cnt + '" uib-tooltip="{{\''+ subviewsDefinition[subMenuKey].tooltip +'\' | translate}}" tooltip-append-to-body="true" tooltip-placement="right">{{\''+ subviewsDefinition[subMenuKey].name + '\' | translate}}</a></li>';
                                                }
                                            }
                                            result = result + '\n</ul>';
                                     } else if( !subviewsDefinition[key].isSubMenuItem ){
                                                cnt++;
                                                if(subviewsDefinition[key].name === "Catalog"){
                                                    result += '\n<li ui-sref-active="active" ng-click ="changeFavicon(\'catalog-portal\')" ng-if="portalsAccessPermission[\'' + subviewsDefinition[key].nameForUrl + '\']">' +
                                                        '\n<a ui-sref="portal.subview' + cnt + '" uib-tooltip="{{\''+ subviewsDefinition[key].tooltip +'\' | translate}}" tooltip-append-to-body="true" tooltip-placement="right"><img src="styles/patterns/catalog-portal.png" style="height:20px;padding-right: 4px;"> <span class="nav-label">{{\''+
                                                         subviewsDefinition[key].name+ '\' | translate}}</span> </a>\n</li>';
                                                } else if(subviewsDefinition[key].name === "Event Orchestration"){
                                                    result += '\n<li ui-sref-active="active" ng-click ="changeFavicon(\'event-orchestration\')" ng-if="portalsAccessPermission[\'' + subviewsDefinition[key].nameForUrl + '\']">'
                                                        + '\n<a ui-sref="portal.subview' + cnt + '" uib-tooltip="{{\''+ subviewsDefinition[key].tooltip +'\' | translate}}" tooltip-append-to-body="true" tooltip-placement="right"><img src="styles/patterns/event-orchestration.png" style="height:20px;padding-right: 4px;"> <span class="nav-label">{{\''+
                                                         subviewsDefinition[key].name+ '\' | translate}}</span> </a>\n</li>';
                                                } else if(subviewsDefinition[key].name === "Service Automation"){
                                                    result += '\n<li ui-sref-active="active"  ng-click ="changeFavicon(\'service-automation\')" ng-if="portalsAccessPermission[\'' + subviewsDefinition[key].nameForUrl + '\']">'
                                                        + '\n<a ui-sref="portal.subview' + cnt + '" uib-tooltip="{{\''+ subviewsDefinition[key].tooltip +'\' | translate}}"  tooltip-append-to-body="true" tooltip-placement="right"><img src="styles/patterns/service-automation.png" style="height:20px;padding-right: 4px;"> <span class="nav-label">{{\''+
                                                         subviewsDefinition[key].name+ '\' | translate}}</span> </a>\n</li>';
                                                } else if(subviewsDefinition[key].name === "Notifications"){
                                                    result += '\n<li ui-sref-active="active" ng-click ="changeFavicon(\'notification-portal\')" ng-if="portalsAccessPermission[\'' + subviewsDefinition[key].nameForUrl + '\']">'
                                                        + '\n<a ui-sref="portal.subview' + cnt + '" uib-tooltip="{{\''+ subviewsDefinition[key].tooltip +'\' | translate}}"  tooltip-append-to-body="true" tooltip-placement="right"><img src="styles/patterns/notification-portal.png" style="height:20px;padding-right: 4px;"> <span class="nav-label">{{\''+
                                                         subviewsDefinition[key].name+ '\' | translate}}' +
                                                        '<div ng-show="nbNewNotifications" id="new-notifications-label" style="background:#d9534f;color:white;border-radius:10px;text-align:center;margin-left: 5px;padding: 0px 5px;display:-webkit-inline-box;">{{nbNewNotifications}}</div></span> </a>\n</li>';
                                                } else {
                                                    result += '\n<li ui-sref-active="active" ng-click="changeFavicon(\'automation_dashboard_30\')" ng-if="portalsAccessPermission[\'' + subviewsDefinition[key].nameForUrl + '\']">'
                                                        + '\n<a ui-sref="portal.subview' + cnt + '" uib-tooltip="{{\''+ subviewsDefinition[key].tooltip +'\' | translate}}"  tooltip-append-to-body="true" tooltip-placement="right"><img src="styles/patterns/automation_dashboard_30.png" style="height:20px;"> <span class="nav-label">{{\''+
                                                         subviewsDefinition[key].name+ '\' | translate}}</span> </a>\n</li>';
                                                }
                                       }
                                }
                                result = '<!-- beginSubviews-->' + result + '\n<!-- endSubviews-->';
                                return result;
                            }
                        },
                        {
                            // replace for app.js :
                            match: /\/\/beginSubviewsModules[\s\S]*\/\/endSubviewsModules/g,
                            replacement: function () {
                                var result = '';
                                for (var key in subviewsDefinition) {
                                    if (subviewsDefinition[key].isAvailable && !subviewsDefinition[key].isSubMenuTitle) {
                                        result += "\n'" + subviewsDefinition[key].angularModuleName + "',";
                                    }
                                }
                                result = '//beginSubviewsModules' + result + '\n//endSubviewsModules';
                                return result;
                            }
                        },
                        {
                            // replace for index.html :
                            match: /<!-- beginSubviewsScripts-->[\s\S]*<!-- endSubviewsScripts-->/g,
                            replacement: function () {
                                var result = '';
                                var includedScripts = [];
                                for (var key in subviewsDefinition) {
                                    if (subviewsDefinition[key].isAvailable && !subviewsDefinition[key].isSubMenuTitle) {
                                        for (var scriptKey in subviewsDefinition[key].jsFiles) {
                                            var script = subviewsDefinition[key].appFolder +  subviewsDefinition[key].jsFiles[scriptKey];
                                            var exists = grunt.file.exists(script);
                                            if (!exists) {
                                                grunt.fail.warn('File ' + script + ' doesn\'t exist.');
                                            }
                                            else if (includedScripts.indexOf(script) < 0) {
                                                result += '\n<script src="' + script + '"></script>';
                                                includedScripts.push(script);
                                            }
                                        }
                                    }
                                }
                                result = '<!-- beginSubviewsScripts-->' + result + '\n<!-- endSubviewsScripts-->';
                                return result;
                            }
                        }
                    ],
                    usePrefix: false
                },
                files: [
                    {
                        flatten: true,
                        src: ['<%= inspinia.app %>/templates_versions/common/config.js'],
                        dest: '<%= inspinia.app %>/scripts/config.js'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: ['<%= inspinia.app %>/templates_versions/common/navigation.html'],
                        dest: 'app/views/common/'
                    },
                    {
                        flatten: true,
                        src: ['<%= inspinia.app %>/templates_versions/common/app.js'],
                        dest: '<%= inspinia.app %>/scripts/app.js'
                    },
                    {
                        flatten: true,
                        src: ['<%= inspinia.app %>/templates_versions/common/index.html'],
                        dest: '<%= inspinia.app %>/index.html'
                    },
                ]
            }
        },
        //JS & HTML indentation for code added with replace
        jsbeautifier: {
            files: [
                '<%= inspinia.app %>/scripts/config.js',
                '<%= inspinia.app %>/scripts/app.js',
                '<%= inspinia.app %>/<%= inspinia.conf %>/{,*/}*.*',
                '!<%= inspinia.app %>/{,*/}{,*/}*.html'
            ],
            options: {
            }
        },
        // Renames files for browser caching purposes
        filerev: {
            dist: {
                src: [
                    '<%= inspinia.dist %>/scripts/{,*/}*.js',
                    '<%= inspinia.dist %>/styles/{,*/}*.css'
                ]
            }
        },
        htmlmin: {
            dist: {
                options: {
                    collapseWhitespace: true,
                    conservativeCollapse: true,
                    collapseBooleanAttributes: true,
                    removeCommentsFromCDATA: true,
                    removeOptionalTags: true
                },
                files: [{
                    expand: true,
                    cwd: '<%= inspinia.dist %>',
                    src: ['*.html', 'views/{,*/}*.html'],
                    dest: '<%= inspinia.dist %>'
                }]
            }
        },
        useminPrepare: {
            html: 'app/index.html',
            options: {
                dest: 'dist'
            }
        },
        usemin: {
            html: ['dist/index.html']
        },
        eslint : {
            options: {
                configFile : ".eslintrc.json",
                failOnError : false
            },
            target :
                (function () {
                var includedScripts = [];
                for (var key in subviewsDefinition) {
                    if (subviewsDefinition[key].isAvailable && !subviewsDefinition[key].isSubMenuTitle) {
                        for (var scriptKey in subviewsDefinition[key].jsFiles) {
                            var script = subviewsDefinition[key].jsFiles[scriptKey];
                            if (includedScripts.indexOf(script) < 0) {
                                includedScripts.push(subviewsDefinition[key].appFolder+script);
                            }
                        }
                    }
                }
                return includedScripts;
            })()
        },

        json_merge: {
            files: {
                files: {
                    '<%= inspinia.dist %>/resources/locales/locale-en.json': getJSONFilesToMerge("en"),
                    '<%= inspinia.dist %>/resources/locales/locale-es.json': getJSONFilesToMerge("es"),
                    '<%= inspinia.dist %>/resources/locales/locale-fr.json': getJSONFilesToMerge("fr"),
                    '<%= inspinia.dist %>/resources/locales/locale-pt.json': getJSONFilesToMerge("pt")
                }
            },
        },

    });

    // Run build version of app
    grunt.registerTask('server', [
        'build',
        'connect:dist:keepalive'
    ]);

    // building of the common parts of a build
    grunt.registerTask('pre-build', [
        'eslint',
        'clean:dist',
        'replace',
        'jsbeautifier',
        'less',
        'useminPrepare',
        'concat',
        'copy:dist',
        'cssmin',
        'uglify',
        'filerev',
        'usemin',
        'htmlmin',
        'json_merge'
    ]);

    grunt.registerTask('build', function() {
        var target = grunt.option('target') || 'enterprise';
        grunt.task.run('pre-build');
        grunt.log.writeln("target=" + target);
        if (target == 'community') {
            grunt.task.run('copy:communitySubviews');
        }
        else {
            grunt.task.run('copy:enterpriseSubviews');
        }
    });
    grunt.loadNpmTasks('grunt-json-merge');

};
