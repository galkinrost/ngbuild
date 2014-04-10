(function () {
    console.log('Hello lib!');
})();
angular.module('App.directivesWithLib', []).directive('AppDirectiveWithLib', function () {
    return {};
});
angular.module('App', ['App.directivesWithLib']);
