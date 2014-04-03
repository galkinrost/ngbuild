var should = require('should');
var ngbuild = require('../lib/ngbuild');
var fs = require('fs');

describe('Scripts concat', function () {
    it('Insert of one file', function () {
        var result = "angular.module('App.controllers', []);\n" +
            "angular.module('App', ['App.controllers']);"

        ngbuild({
            src: 'app/simple_app.js',
            dest: 'app/simple_app.build.js'
        });

        fs.readFileSync('app/simple_app.build.js', 'utf-8').should.be.equal(result);
    });

    it('Insert of folder', function () {
        var result = "angular.module('App.controllers', []);\n" +
            "angular.module('App.controllers').controller('AppFirstCtrl', function () {\n});\n" +
            "angular.module('App.controllers').controller('AppSecondCtrl', function () {\n});\n" +
            "angular.module('App', ['App.controllers']);"

        ngbuild({
            src: 'app/controllers_app.js',
            dest: 'app/controllers_app.build.js'
        });

        fs.readFileSync('app/controllers_app.build.js', 'utf-8').should.be.equal(result);
    });

    it('Insert directives with templates', function () {
        var result = "angular.module('App.directivesWithTemplate', []).directive('AppDirectiveWithTemplate', function () {\n" +
            "    return { template: '<span>templates/directives/template.html</span>' };\n" +
            "});\n" +
            "angular.module('App', ['App.directivesWithTemplate']);"

        ngbuild({
            src: 'app/template_directive_app.js',
            dest: 'app/template_directive_app.build.js'
        });

        fs.readFileSync('app/template_directive_app.build.js', 'utf-8').should.be.equal(result);
    });

    it('Insert directives with styles', function () {
        var result = "angular.module('App.directivesWithStyles', []).directive('AppDirectiveWithStyles', function () {\n" +
            "    return { template: '<style>.directive {\\n}</style>' };\n});\n" +
            "angular.module('App', ['App.directivesWithStyles']);"

        ngbuild({
            src: 'app/styles_directive_app.js',
            dest: 'app/styles_directive_app.build.js'
        });

        fs.readFileSync('app/styles_directive_app.build.js', 'utf-8').should.be.equal(result);
    });

    it('Insert directives with template and styles', function () {
        var result = "angular.module('App.directivesWithTemplateAndStyles', []).directive('AppDirectiveWithTemplateAndStyles', function () {\n" +
            "    return { template: '<style>.directive {\\n}</style><span>templates/directives/template.html</span>' };\n});\n" +
            "angular.module('App', ['App.directivesWithTemplateAndStyles']);"

        ngbuild({
            src: 'app/template_and_styles_directive_app.js',
            dest: 'app/template_and_styles_directive_app.build.js'
        });

        fs.readFileSync('app/template_and_styles_directive_app.build.js', 'utf-8').should.be.equal(result);
    });
});