angular.module("App", ["ngRoute"], function ($routeProvider) {
    $routeProvider
        .when("/url/1", {
            templateUrl: '/app/templates/template.html',
            styles: '/app/styles/styles.css'
        }).
        when("/url/2", {
            templateUrl: '/app/templates/template.html',
            styles: '/app/styles/styles.css'
        });
});