angular.module('App.directivesWithStyles', []).directive('AppDirectiveWithStyles', function () {
    return { template: '<style>.directive {\n}</style>' };
});
angular.module('App', ['App.directivesWithStyles']);
