angular.module('App.directives', []);
angular.module('App.directives').directive('SomeDirective', function () {
    return {
        template: '<style>.some-directive{}</style><span>some_directive</span>'
    };
});
angular.module('App', ['App.directives']);
