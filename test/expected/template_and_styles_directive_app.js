angular.module('App.directivesWithTemplateAndStyles', []).directive('AppDirectiveWithTemplateAndStyles', function () {
    return { template: '<style>.directive {\n}</style><span>templates/directives/template.html</span>' };
});
angular.module('App', ['App.directivesWithTemplateAndStyles']);
