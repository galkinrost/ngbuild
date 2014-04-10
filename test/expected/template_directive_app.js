angular.module('App.directivesWithTemplate', []).directive('AppDirectiveWithTemplate', function () {
    return { template: '<span>templates/directives/template.html</span>' };
});
angular.module('App', ['App.directivesWithTemplate']);
