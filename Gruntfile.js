'use strict';
module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Show grunt task time
    require('time-grunt')(grunt);

    // Configurable paths for the app
    var appConfig = {
        app: 'app',
        dist: 'dist'
    };

    // Grunt configuration
    grunt.initConfig({

        // Project settings
        inspinia: appConfig,
        subviewsDefinition: grunt.file.readJSON('app/resources/subviews.json'),

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
                        '!<%= inspinia.dist %>/.git*'
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
            styles:
            {
                expand: true,
                cwd: '<%= inspinia.app %>/styles',
                dest: '.tmp/styles/',
                src: '{,*/}*.css'
            },
            subviews: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= subviewsDefinition.serviceAutomation.appFolder %>',
                        src: ['<%= subviewsDefinition.serviceAutomation.htmlFile %>'],
                        dest: '<%= inspinia.dist %>/<%= subviewsDefinition.serviceAutomation.nameForUrl %>'
                    },
                    {
                        expand: true,
                        cwd: '<%= subviewsDefinition.workflowAutomation.appFolder %>',
                        src: ['<%= subviewsDefinition.workflowAutomation.htmlFile %>'],
                        dest: '<%= inspinia.dist %>/<%= subviewsDefinition.workflowAutomation.nameForUrl %>'
                    },
                    {
                        expand: true,
                        cwd: '<%= subviewsDefinition.workflowCatalog.appFolder %>',
                        src: ['<%= subviewsDefinition.workflowCatalog.htmlFile %>'],
                        dest: '<%= inspinia.dist %>/<%= subviewsDefinition.workflowCatalog.nameForUrl %>'
                    },
                    {
                        expand: true,
                        cwd: '<%= subviewsDefinition.notificationPortal.appFolder %>',
                        src: ['<%= subviewsDefinition.notificationPortal.htmlFile %>'],
                        dest: '<%= inspinia.dist %>/<%= subviewsDefinition.notificationPortal.nameForUrl %>'
                    },
                    {
                        expand: true,
                        cwd: '<%= subviewsDefinition.serviceAutomation.appFolder %>',
                        src: ['<%= subviewsDefinition.serviceAutomation.cssFile %>'],
                        dest: '<%= inspinia.dist %>/<%= subviewsDefinition.serviceAutomation.nameForUrl %>'
                    },
                    {
                        expand: true,
                        cwd: '<%= subviewsDefinition.workflowAutomation.appFolder %>',
                        src: ['<%= subviewsDefinition.workflowAutomation.cssFile %>'],
                        dest: '<%= inspinia.dist %>/<%= subviewsDefinition.workflowAutomation.nameForUrl %>'
                    },
                    {
                        expand: true,
                        cwd: '<%= subviewsDefinition.workflowCatalog.appFolder %>',
                        src: ['<%= subviewsDefinition.workflowCatalog.cssFile %>'],
                        dest: '<%= inspinia.dist %>/<%= subviewsDefinition.workflowCatalog.nameForUrl %>'
                    }
                ]
            }
        },
        //Add subviews in router
        replace: {
            dist: {
                options: {
                    patterns: [
                        {
                            match: /\/\/beginSubviewsStates[\s\S]*\/\/endSubviewsStates/g,
                            replacement: function(){
                                var subviewsDefinition = grunt.file.readJSON('app/resources/subviews.json');
                                var result = '';
                                var cnt = 0;
                                for (var key in subviewsDefinition) {
                                    cnt++;
                                    result+= "\n.state('portal.subview" + cnt +"', {";
                                    result+= "\nurl:'/"+subviewsDefinition[key].nameForUrl+"',";
                                    if (subviewsDefinition[key].isAvailable) {
                                        result+= "\ntemplateUrl:'"+subviewsDefinition[key].nameForUrl+"/"+subviewsDefinition[key].htmlFile+"',";
                                        result+= "\ncss:'"+subviewsDefinition[key].nameForUrl+"/"+subviewsDefinition[key].cssFile+"',";
                                        result+= "\ndata: {pageTitle: '"+subviewsDefinition[key].name+"'},";
                                        result+= "\nauthenticate:"+subviewsDefinition[key].authenticate+",";
                                        if (subviewsDefinition[key].initFunction) {
                                            var services = subviewsDefinition[key].initFunction.services.join(", ");
                                            result+= "\nonEnter : function ("+ services +") {";
                                            result+= "\n"+subviewsDefinition[key].initFunction.functionName+"("+ services +"); \n },";
                                            result+= "\nonExit : function($rootScope){";
                                            result+= "\n$rootScope.$broadcast('event:StopRefreshing');\n }";
                                        }
                                    } else {
                                        result+= "\ntemplateUrl: 'views/not_available_page.html',";
                                        result+= "\ndata: {pageTitle: 'Content not available'},";
                                        result+= "\nauthenticate:false,";
                                    }
                                    result+= "\n})\n";
                                }
                                result = '//beginSubviewsStates\n'+result +';\n//endSubviewsStates';
                                return result;
                            }
                        },
                        {
                            match: /<!-- beginSubviews-->[\s\S]*<!-- endSubviews-->/g,
                            replacement: function(){
                                var subviewsDefinition = grunt.file.readJSON('app/resources/subviews.json');
                                var result = '';
                                var cnt = 0;
                                for (var key in subviewsDefinition) {
                                    cnt++;
                                    result+= '\n<li ui-sref-active="active">'
                                                + '\n<a ui-sref="portal.subview'+cnt+'" style="background-color: #002d66"><i class="fa fa-desktop"></i> <span class="nav-label">'
                                                + subviewsDefinition[key].name + '</span> </a>\n</li>';
                                }
                                result = '<!-- beginSubviews-->\n'+result +'\n<!-- endSubviews-->';
                                return result;
                            }
                        },
                        {
                            match: /\/\/beginSubviewsModules[\s\S]*\/\/endSubviewsModules/g,
                            replacement: function(){
                                var subviewsDefinition = grunt.file.readJSON('app/resources/subviews.json');
                                var result = '';
                                for (var key in subviewsDefinition) {
                                    result+= "\n'"+subviewsDefinition[key].angularModuleName +"',";
                                }
                                result = '//beginSubviewsModules\n'+result +'\n//endSubviewsModules';
                                return result;
                            }
                        }
                    ],
                    usePrefix: false
                },
                files: [
                    {expand: true, flatten: true, src: ['app/scripts/config.js'], dest: 'app/scripts/'},
                    {expand: true, flatten: true, src: ['app/views/common/navigation.html'], dest: 'app/views/common/'},
                    {expand: true, flatten: true, src: ['app/scripts/app.js'], dest: 'app/scripts/'},
                ]
            }
        },
        //JS & HTML indentation for code added with replace
        jsbeautifier : {
            files : ["app/scripts/config.js",'app/views/common/navigation.html', "app/scripts/app.js"],
            options : {
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

    // Run live version of app
    grunt.registerTask('live', [
        'clean:server',
        'copy:styles',
        'connect:livereload',
        'watch'
    ]);

    // Run build version of app
    grunt.registerTask('server', [
        'build',
        'connect:dist:keepalive'
    ]);

    // Build version for production
    grunt.registerTask('build', [
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
        'copy:subviews'
    ]);

};
