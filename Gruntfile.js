var attire = require('attire');

module.exports = function(grunt) {

    grunt.initConfig({

        eslint: {
            options: {
                configFile: '.eslintrc.js'
            },
            target: ['src/**/*.js', 'Gruntfile.js', 'test/index.js']
        },

        watch: {
            readme: {
                expand: true,
                files: ['README.md'],
                tasks: ['buildDemo'],
                options: {
                    spawn: false
                }
            },
            jsFiles: {
                expand: true,
                files: ['src/**/*.js'],
                tasks: ['eslint'],
                options: {
                    spawn: false
                }
            }
        },

        bump: {
            options: {
                files: ['package.json', 'package-lock.json'],
                commitFiles: ['package.json', 'package-lock.json'],
                tagName: '%VERSION%',
                push: false
            }
        }

    });

    grunt.registerTask('buildDemo', function() {

        var done = this.async();

        attire.buildDemo({
            file: 'README.md',
            dest: 'index.html',
            title: 'Fake JSON api server',
            description: 'Fake JSON api server',
            canonicalUrl: 'http://dbrekalo.github.io/fake-json-api-server/',
            githubUrl: 'https://github.com/dbrekalo/fake-json-api-server',
            userRepositories: {
                user: 'dbrekalo',
                onlyWithPages: true
            },
            author: {
                caption: 'Damir Brekalo',
                url: 'https://github.com/dbrekalo',
                image: 'https://s.gravatar.com/avatar/32754a476fb3db1c5a1f9ad80c65d89d?s=80',
                email: 'dbrekalo@gmail.com',
                github: 'https://github.com/dbrekalo',
                twitter: 'https://twitter.com/dbrekalo'
            },
            afterParse: function($) {
                $('p').first().remove();
                $('a').first().parent().remove();
            },
            inlineCss: true,
        }).then(function() {
            done();
            grunt.log.ok(['Demo builded']);
        });

    });

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('default', ['build', 'watch']);
    grunt.registerTask('build', ['eslint', 'buildDemo']);

};
