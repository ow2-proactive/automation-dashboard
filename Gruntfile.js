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
            out.push({
                expand: true,
                cwd: subviewsDefinition[key].appFolder + '/styles/',
                src: subviewsDefinition[key].cssFile,
                dest: '<%= inspinia.dist %>/styles/' + subviewsDefinition[key].nameForUrl
            });
            if (subviewsDefinition[key].isAvailable) {
                out.push({
                    expand: true,
                    cwd: subviewsDefinition[key].appFolder + '/views/',
                    src: subviewsDefinition[key].htmlFile,
                    dest: '<%= inspinia.dist %>/views/' + subviewsDefinition[key].nameForUrl
                });
            } else {
                grunt.log.writeln(key + " is not available");
                out.push({
                    expand: true,
                    cwd: subviewsDefinition[key].appFolder + '/views/',
                    src: subviewsDefinition[key].notAvailablePage,
                    dest: '<%= inspinia.dist %>/views/' + subviewsDefinition[key].nameForUrl
                });
            }
            if (subviewsDefinition[key].images) {
                for (var imageKey in subviewsDefinition[key].images) {
                    out.push({
                        expand: true,
                        cwd: subviewsDefinition[key].appFolder + '/styles/patterns/',
                        src: subviewsDefinition[key].images[imageKey],
                        dest: '<%= inspinia.dist %>/styles/'+ subviewsDefinition[key].nameForUrl
                    });
                }
            }
            if (subviewsDefinition[key].secondaryHtmlFiles){
                out.push({
                    expand: true,
                    cwd: subviewsDefinition[key].appFolder + '/views/',
                    src: subviewsDefinition[key].secondaryHtmlFiles,
                    dest: '<%= inspinia.dist %>/views/' + subviewsDefinition[key].nameForUrl
                });
            }
        };
        return out;
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
                            'styles/patterns/img/wf-icons/*.*',
                            'img/{,*/}*.*',
                            'resources/{,*/}*.properties',
                            'resources/{,*/}*.json'
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
            },
            modifiedSubviews: {
                files: [
                    {
                        src: ['<%= inspinia.app %>/templates_versions/<%= inspinia.version %>/config.js'],
                        dest: '<%= inspinia.app %>/scripts/config.js'
                    },
                    {
                        src: ['<%= inspinia.app %>/templates_versions/<%= inspinia.version %>/app.js'],
                        dest: '<%= inspinia.app %>/scripts/app.js'
                    },
                    {
                        src: ['<%= inspinia.app %>/templates_versions/<%= inspinia.version %>/index.html'],
                        dest: '<%= inspinia.app %>/index.html'
                    }
                ]
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
                                var cnt = 0;
                                for (var key in subviewsDefinition) {
                                    cnt++;
                                    if (!subviewsDefinition[key].isSubSubview) {
                                        result += '\n<li ui-sref-active="active">'
                                            + '\n<a ui-sref="portal.subview' + cnt + '" style="background-color: #002d66"><i class="fa fa-desktop"></i> <span class="nav-label">'
                                            + subviewsDefinition[key].name+ '</span> </a>\n</li>';
                                    } else {
                                        result += '\n<li ui-sref-active="active">'
                                            + '\n<a ui-sref="portal.subview' + cnt + '" style="background-color: #002d66; padding-left: 45px; padding-top: 0px;"><span class="nav-label">'
                                            + subviewsDefinition[key].name+ '</span> </a>\n</li>';
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
                                    if (subviewsDefinition[key].isAvailable) {
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
                                    if (subviewsDefinition[key].isAvailable) {
                                        for (var scriptKey in subviewsDefinition[key].jsFiles) {
                                            var script = subviewsDefinition[key].jsFiles[scriptKey];
                                            if (includedScripts.indexOf(script) < 0) {
                                                result += '\n<script src="' + subviewsDefinition[key].appFolder + script + '"></script>';
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
                        src: ['<%= inspinia.app %>/templates_versions/<%= inspinia.version %>/config.js'],
                        dest: '<%= inspinia.app %>/templates_versions/<%= inspinia.version %>/config.js'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: ['<%= inspinia.app %>/templates_versions/common/navigation.html'],
                        dest: 'app/views/common/'
                    },
                    {
                        flatten: true,
                        src: ['<%= inspinia.app %>/templates_versions/<%= inspinia.version %>/app.js'],
                        dest: '<%= inspinia.app %>/templates_versions/<%= inspinia.version %>/app.js'
                    },
                    {
                        flatten: true,
                        src: ['<%= inspinia.app %>/templates_versions/<%= inspinia.version %>/index.html'],
                        dest: '<%= inspinia.app %>/templates_versions/<%= inspinia.version %>/index.html'
                    },
                ]
            }
        },
        //JS & HTML indentation for code added with replace
        jsbeautifier: {
            files: [
                '<%= inspinia.app %>/scripts/config.js',
                '<%= inspinia.app %>/views/common/navigation.html',
                '<%= inspinia.app %>/scripts/app.js',
                '<%= inspinia.app %>/index.html',
                '<%= inspinia.app %>/<%= inspinia.conf %>/{,*/}*.*'
            ],
            options: {
            }
        },
        // Renames files for browser caching purposes
        filerev: {
            dist: {
                src: [
                    '<%= inspinia.dist %>/scripts/{,*/}*.js',
                    '<%= inspinia.dist %>/styles/{,*/}*.css',
                    '<%= inspinia.dist %>/styles/fonts/*'
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
        }
    });

    // Run build version of app
    grunt.registerTask('server', [
        'build',
        'connect:dist:keepalive'
    ]);

    // building of the common parts of a build
    grunt.registerTask('pre-build', [
        'clean:dist',
        'replace',
        'jsbeautifier',
        'copy:modifiedSubviews',
        'less',
        'useminPrepare',
        'concat',
        'copy:dist',
        'cssmin',
        'uglify',
        'filerev',
        'usemin',
        'htmlmin'
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

};
