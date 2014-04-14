angular.module('App.directives', []).directive('JadeDirective', function () {
    return{template: '<span>This is Jade directive</span>'};
});
angular.module('App', ['App.directives']);