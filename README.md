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

Plugins
-----
Grunt - https://github.com/galkinrost/grunt-ngbuild
Gulp - https://github.com/galkinrost/gulp-ngbuild

Example
--------------

<strong>/app.js</strong>
```javascript
angular.module('App',['controllers.js']);
```
<strong>/controllers.js</strong>
```javascript
angular.module('App.controllers',[]);
```
<strong>result</strong>
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
}).directive('html',function(){
	return{
    	templateUrl:"template.html"
    }
}).directive('jade',function(){
	return{
    	templateUrl:"template.jade"
    }
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
}).directive('html',function(){
	return{
    	template:"<span>template.html</span>"
    }
}).directive('jade',function(){
	return{
    	template:"<span>template.jade</span>"
    }
});	
```
CSS
-------
<strong>/app.js</strong>
```javascript
angular.module('App',[],function ($routeProvider) {
    $routeProvider
        .when("/url1", {
        	styles:"styles.css",
            templateUrl: "template.html"
        })
})
...
```
<strong>result</strong>
```javascript
angular.module('App',[],function ($routeProvider) {
    $routeProvider
        .when("/url1", {
            template: "styles{font-size:10px}<span>template.html</span>"
        })
})
...
```
Folders
-----------
<strong>directives folder</strong>
```
/app.js
/directives
	/module.js
    /directive.js
```
<strong>/app.js</strong>
```javascript
angular.module('App',['directives']);
```
<strong>/directive/module.js(!special name of file with module declaration)</strong>
```javascript
angular.module('App.directives',[]);
```
<strong>/directives/directive.js</strong>
```javascript
angular.module('App.directives')
	.directive('directive',function(){
    ...
    });
```
<strong>result</strong>
```javascript
angular.module('App.directives',[]);
angular.module('App.directives').directive('directive',function(){
...
});
angular.module('App',['App.directives']);
```
Subfolders
--------------
<strong>directives folder</strong>
```
/app.js
/directives
	/module.js
    /directive/
    	directive.js
        template.html
        styles.css
```

<strong>/app.js</strong>
```javascript
angular.module('App',['directives/*']);
```
<strong>/directives/directive/directive.js</strong>
```javascript
angular.module('App.directives')
	.directive('directive',function(){
    	return{
    		templateUrl:'template.html',
            styles:'styles.css'
    	}
	});
```
External libs
-------------
<strong>/app.js</strong>
```javascript
angular.module('App',['!/lib/jquery.js']);
```
<strong>result</strong>
```javascript
/**
* JQUERY HERE
**/
angular.module('App',[]);
```
Pathes
----
- relative - 'file_path'
- absolute - '/file_path'
- library - '!(/)file_path
- subdirectory - (/)directory_path/*


License
----

MIT

