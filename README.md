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



License
----

MIT

