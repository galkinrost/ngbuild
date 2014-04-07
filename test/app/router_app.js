angular.module("App", ["ngRoute"], function ($routeProvider) {
    $routeProvider
        .when("/url/1", {
            template: '/app/templates/template.html',
            styles: '/app/styles/styles.css'
        }).
        when("/url/2", {
            template: '/app/templates/template.html',
            styles: '/app/styles/styles.css'
        });
});