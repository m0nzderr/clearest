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
* dynamic attributes belong to inner template and rendered by widget
* widget attributes are:
  * w:template - specifies template location (closed form)
  * w:context - specified context object (close form)
  * w:controller - specifies controller class that will receive template code, context object and be controlled with build(), destroy() and process()
  * w:set - specified object injection definition (could be accessed from inside) with


### Dynamic attributes
Template attributes support two kind of interpolation:

```t:foo="${js-expression} and {{[context-object].field}}"```

The ```${js-expression}``` does exactly the same as ES6 string interpolation.

The select-expressoin binds the attribute value as an observer of the ```field``` and with the syntax:

  ```{{[context-object].field}}```

The ```{{[context-object].field}}``` expressions could be used inside ```${..}``` as well, e.g:

``foo="${formatDate({{date}})}"``.
















