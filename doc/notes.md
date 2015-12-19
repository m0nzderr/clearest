# Special notes
### On widget attributes

There are three types of widget attributes:


inline form:
```xml
<w:foo static="1" t:dynamic="2" w:widget="3" >
...
</w:foo>
```

closed form with implicit context:
```xml
<w:foo static="1" w:template="3" />
```

closed form with explicit context
```xml
<w:foo static="1" w:template="3" >
{context}
</w:foo>
```
or
```xml
<w:foo static="1" w:template="3" w:context="{object}"/>
```


* static attributes belong to container and rendered independently on widget;
* dynamic attributes belong to inner template (or context) and inside widget
* widget attributes are:
  * w:template - specifies template location (closed form)
  * w:context - specified context object (close form)
  * w:controller - specifies controller class that will receive template code, context object and be controlled with build(), destroy() and process()
  * w:set - specified object injection definition (could be accessed from inside) with

### Attribute templates
Attributes values support mixed template syntax:

```foo="${js-expression} and {{[context-object].field}}"```

The ```${js-expression}``` does exactly the same as ES6 string interpolation.

The select-expressoin binds the attribute value as an observer of the ```field``` and with the syntax:

  ```{{[context-object].field}}```

Select-expressions could be used within ```${..}``` synax as well, e.g:

``foo="${formatDate({{date}})}"``.



### Environment and entities
Clearest provides environment variables at compile time. Those variables are controlled by user, and by default have the following structure:
 ```
 {
   process:{
    // OS environment variables,
   }
   source:{
    path:.. // path to compiled source file
    dir: .. // directory of the compiled source
   },
   target:{
    path: // path to target file (after compilation)
    dir: // path to target directory
   }
 }
 ```

Those variables can be used at compile time in two ways.
 1. As conditions used with ``<t:fragment>`` or ``<t:comment>``, e.g:

    Somewhere in code:

    ```xml
    <t:fragment env:build.platform="ios">
        <t:require mylib = "mylib/ios">
    </t:fragment>
    <t:fragment env:build.platform="android">
        <t:require mylib = "mylib/android">
    </t:fragment>
    ```

    Somewhere in gulpfile:

    ```javascript
    ....
         .pipe(clearest.compiler({
                  environment:{
                      build:{
                          platform: buildPlatform // 'android' or 'ios'
                      }
                  },
                  targetDir: 'tmp'
                  ....
                }))
    ```



2. As XML entities:
  ```xml
    <link rel="stylesheet" type="text/css" href="&env:path.to.css;/style.css">
  ```


### Interfaces

#### Core API
Core API is the only interface that XVDL compiler is aware-of. Dispite called an API, it is not supposed to be used directly by applications.
Instead, only compiled code relies on its.
```
CoreApi {
    // functions used for implementing t:get, s:*, t:if,
    get(fn, [arg1,...,argN])
    sel(o, k, fn, filter)
    cnt(o, k)
    use(template, context)

    // used to track/resolve dependencies
    dep(dependent, dependency, provider)
    /*
    2.1.0:
    inj(something) // implements t:inject
    */

    // control code generators
    ctl(fn , scope)          // returns user-defined control functoin
    obs(o, k, handler)       // returns control function for event handler
    on(event, handler)       // returns control function for observer handler
    wid(template, context, /*2.1.0: config */)   // returns control cod for widget component
}

```



```
Controller {
    build(dom) // promise
    destroy()
}

Widget:Controller,Api {
    process() // promise
}
```



### Error handling

There are several error handling mechanisms
   * Errors (or rejections) that occur while rendering (build() failures)
   * Errors (or rejections) thrown by controller code


Errors that occur in controller code are fed to



