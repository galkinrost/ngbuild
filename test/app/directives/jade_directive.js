angular.module('App.directives', [])
    .directive('JadeDirective', function () {
        return{
            templateUrl: '../templates/jade/jade_directive.jade'
        };
    });