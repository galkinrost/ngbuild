angular.module('App.directives')
    .directive('SomeDirective', function () {
        return{
            templateUrl: 'template.html',
            styles: 'styles.css'
        };
    });