NGBUILD
=========

NGBUILD is lightweight tool for build your Angular.js app on the fly.

The Idea
--
To use Angular.js build-in module architecture.
Example:
<br>
in <strong>/app.js</strong>
```javascript
angular.module('App',['/some_path/my_module.js']);
```
in <strong>/some_path/my_module.js</strong>
```javascript
angular.module('MyModule',[]);
```
Now call the <strong>ngbuild</strong>

```sh
ngbuild app.js app.build.js
```
and look in <strong>/app.build.js</strong>

```javascript
angular.module('MyModule',[]);
angular.module('App',['MyModule']);
```
One more example
----
We can have app's architecture like that
```
/app.js
/controllers
    /module.js
    /first_ctrl.js

```
In <strong>/app.js</strong>
```javascript
angular.module('App',['/controllers']);
```
In <strong>/controllers/module.js</strong>
```javascript
angular.module('Controllers',[]);
```
In <strong>/controllers/first_ctrl.js</strong>
```javascript
angular.module('Controllers').controller('FirstCtrl',function($scope){});
```
Call ngbuild and get in <stong>/app.build.js</strong>
```javascript
angular.module('Controllers',[]);
angular.module('Controllers').controller('FirstCtrl',function($scope){});
angular.module('App',['Controllers']);
```
Cause filename <strong>module.js</strong> is special and means that this file must be inserted before other from  folder.

And the last
----
We can have app's architecture like that
```
/app.js
/modules.js 
```
In <strong>/app.js</strong>
```javascript
angular.module('App',['/modules']);
```
In <strong>/modules.js</strong>
```javascript
angular.module('Controllers',[]);
angular.module('Directives',[]);
angular.module('Filters',[]);
```
Call ngbuild and get in <stong>/app.build.js</strong>
```javascript
angular.module('Controllers',[]);
angular.module('Directives',[]);
angular.module('Filters',[]);
angular.module('App',['Controllers','Directives','Filters']);
```
Rules
---
All modules must be inserted must begin with <strong>forward slash</strong> <em>/</em>
<br>
If path is a folder it must have special file <stong>module.js</strong> with module

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

Gulp/Grunt
---
Example of gulp integration

```javascript
var gulp=require('gulp');
var ngbuild=require('ngbuild');

gulp.task('ngbuild', function () {
    ngbuild({
        src: 'app.js',
        dest: 'app.build.js'
    });

});

gulp.task('watch', function () {
    gulp.watch(['**/*'], ['ngbuild']);
});
```

```sh
gulp watch
```

Example of grunt integration

```javascript
var grunt = require('grunt');
var ngbuild = require('ngbuild');

grunt.initConfig({
    watch: {
        files: ['**/*'],
        tasks: ['ngbuild']
    }
});

grunt.loadNpmTasks('grunt-contrib-watch');

grunt.registerTask('ngbuild', function () {
    ngbuild({
        src: 'app.js',
        dest: 'app.build.js'
    });
});
```

```sh
grunt watch
```

License
----

MIT

