angular.module('App', ['ngRoute'], function ($routeProvider) {
    $routeProvider.when('/url/1', { template: '<style>.styles{\n\n}</style><span>templates/template.html</span>' }).when('/url/2', { template: '<style>.styles{\n\n}</style><span>templates/template.html</span>' });
});
