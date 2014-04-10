angular.module('App.directivesWithTemplateAndStyles', []).directive('AppDirectiveWithTemplateAndStyles', function () {
    return{
        templateUrl: '/app/templates/directives/template.html',
        styles: '/app/styles/directives/styles.css'
    }
});