angular.module('ExampleModule.controllers', []);
angular.module('ExampleModule.directives', []);
angular.module('ExampleModule.directives').directive('ExampleDirective', function () {
    return { template: '<span>I`m example directive</span>' };
});
angular.module('ExampleModule', [
    'ExampleModule.controllers',
    'ExampleModule.directives'
]);
angular.module('App', ['ExampleModule']);
