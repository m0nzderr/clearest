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
Api {
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

Widget interface imlements Api and the Component interface.
```
Widget: Component , Api {
        process() // recursively called by parent widget in order to detect changes and update view, may return promise
}
```

The Component interface is used by Widget to control almost any dynamic behavior: events, user components and other Widgets.

Component interface assumes the following methods:
```
Component {
    build(dom) // called to build component on specified domElement, may return promise
    destroy() // calld to destroy component (it must clean-up all event hadlers to prevent leaks)
}
```





### Error handling

Errors are handled on many levels.

#### Presentation layer (XVDL)
The highest level of error handling is provided by XVDL.
It is designed to deal with the failures that occur during rendering of the view, in the scenario like this one:

```xml
<t:get payload="service.callThatMayFail()">
      <!--   presentation for received payload -->
      Foo is <s:foo from="payload"/>
</t:get>
```

It is assumed that ```callThatMayFail()``` returns an object containing the data or error otherwise. For example, a promise that may resolve or fail:
```
service.callThatMayFail = function(){
    var d = promise.defer();
    askGuru(function(){
        d.resolve({foo:42})
    },function(){
        d.reject({type:'badmood', message:'come back later'})
        }
    ));
    return d.promise;
}
```

The default behavior In case of failure, the is as if payload was empty. E.g., assuming the service implementation would be

the output of the above template would be either
```
Foo is 42
```
when call succeeds, or
```
Foo is
```
when call fails.

In order to handle the errors the instructions "<t:if-error>", "<t:error>" and "<t:catch>" could be used like that:
```xml
<t:get payload="service.callThatMayFail()">
    <t:if-error
        from="payload"
        test="$error.type==='badmood'"
       >
        <then>
            <t:error from="payload">
              Guru is not in the mood right now.
              He asked to <s:message/>
            </t:error>
            <t:catch from="payload"/>
        </then>
        <else>
            <!--   presentation for received payload -->
            Foo is <s:foo from="payload"/>
        </else>
     </t:if-error>
</t:get>
```

The ``<t:if-error>`` instruction tests if result contains an error. Additional conditions could be used to
distinguish between specific error types.

The ``<t:error>`` switches the context variable to error object, so it becomes accessible from the template.
It is equivalent to ``<t:context error="getErrorFrom(payload)">``.

The ``<t:catch>`` is used to stop the propagated of error to other layers.

If the attribute ``@from`` is omitted, all three instructions operate on current context object. For example, the above
template could be simplified:
 ```xml
 <t:context payload="service.callThatMayFail()">
     <t:if-error  test="$error.type==='badmood'">
         <then>
             <t:error>
               Guru is not in the mood right now.
               He asked to <s:message/>
             </t:error>
             <t:catch/>
         </then>
         <else>
             <!--   presentation for received payload -->
             Foo is <s:foo/>
         </else>
      </t:if-error>
 </t:get>
 ```

#### Application layer
Errors, generater while rendering and left uncaught by presentation layer "remain" in Api and handeled by its implementation.
Same thing happens to errors returned by controller calls in reaction to events:
```
    <button e:click="controller.doJobThatMayFail()"/>
```

Widget implements simple mechanism for handling such errors throug its configuration settings:
 ```
    <w:div  w:set.error ="function(/*Object []*/ errors){/* handle your errors here*/}" />
 ```

 By default, the error handler is similar to
 ```
    function(errors){
        errors.forEach(function(error){
            app.trigger(dom,new CustomEvent("error",error));
        })
    }
 ```
 that mirrors all errors into DOM events, which bubble-up to higher application levels.

 For convinience, additional settings can alter the default behavior:

 * error.event is the name of custom event
 * error.filter is the filter function, applied before each event goes to DOM.

For example:
```xml
<w:div
   w:set.error.event ="unhandeled.error"
   w:ser.error.filter="function(error){ return error.type !== 'business'? true: (displayError(error), false) }"
>
...
</w:div>
```







