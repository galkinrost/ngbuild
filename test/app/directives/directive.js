angular.module("App.directives").directive("myDirective", function () {
    return{
        template: "/app/templates/template.html",
        styles: "/app/styles/styles.css"
    }
}).directive("myDirective", ['$scope', function ($scope) {
    return{
        template: "/app/templates/template.html",
        styles: "/app/styles/styles.css"
    }
}]);