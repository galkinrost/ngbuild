NGBUILD
=========

NGBUILD is lightweight tool for build your Angular.js app on the fly.

Installation
--------------
For using from the comman-line install the package globally

```sh
npm install -g ngbuild
```

For using in the project

```sh
npm install --save ngbuild
```

Example
--------------

<strong>/app.js:</strong>
```javascript
angular.module('App',['controllers.js']);
```
<strong>/controllers.js</strong>
```javascript
angular.module('App.controllers',[]);
```
<strong>result:</strong>
```javascript
angular.module('App.controllers',[]);
angular.module('App',['App.controlers']);
```

Usage
-----------------
```javascript
var ngbuild=ngbuild;
ngbuild.build({
	src:'app.js',
    dest:'app.build.js'
});

var content=ngbuild.buildSync({
	src:'app.js'
});
```

Templates
--------------------------
Both html and jade
<strong>/app.js</strong>
```javascript
angular.module('App',[],function ($routeProvider) {
    $routeProvider
        .when("/url1", {
            templateUrl: "template.html"
        })
        .when("/url2", {
            templateUrl: "template.jade"
        });
});	
```
<strong>result</strong>
```javascript
angular.module('App',[],function ($routeProvider) {
    $routeProvider
        .when("/url1", {
            template: "<span>template.html</span>"
        })
        .when("/url2", {
            template: "<span>template.jade</span>"
        });
});	
```
CSS
-------
<strong>/app.js</strong>
```javascript
angular.module('App',[],function ($routeProvider) {
    $routeProvider
        .when("/url1", {
            templateUrl: "template.html"
        })
        .when("/url2", {
            templateUrl: "template.jade"
        });
});	
```
<strong>result</strong>
```javascript
angular.module('App',[],function ($routeProvider) {
    $routeProvider
        .when("/url1", {
            template: "<span>template.html</span>"
        })
        .when("/url2", {
            template: "<span>template.jade</span>"
        });
});	

<strong>directives folder</strong>
```
/directives
	/module.js
    /directive.js
```
<strong>/directive/module.js(!special name of file with module declaration)</strong>
```javascript
angular.module('App.directives',['../controllers']);
```
<strong>/directives/directive.js</strong>
```javascript
angular.module('App.directives',['..'
```

License
----

MIT

