angular.module('App.controllers', []);
angular.module('App.controllers').controller('AppFirstCtrl', function () {
});
angular.module('App.controllers').controller('AppSecondCtrl', function () {
});
angular.module('App.directivesWithControllers', ['App.controllers']).directive('AppDirectiveWithControllers', function () {
    return {};
});
angular.module('App', [
    'App.controllers',
    'App.directivesWithControllers'
]);
