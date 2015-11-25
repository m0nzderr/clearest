#Clearest 2.0

##Overview
### What Clearest is
Clearest is a tool for building rich, fully dynamic front-end applications with JavaScript. It is designed to handle MVC or MVVM-like paradigms, without imposing restrictions on how you implement them. It naturally supports dual binding, live dynamic templates, fully asynchronous updates, creation of reusable components, and so on. 

Being similar, in some aspects, to other frameworks like AngularJS and ReactJS, Clearest comes with its own language for writing components --- XVDL. XVDL is based on XML, and basically, consists of a swiss-knife dozen of XML instructions. Wrapped around some presentation code (which is supposed to be some HTML), they tell Clearest how to generate view and glue your application components together. 

XVDL is an abstract language and does not impose any specific appearance or behavior to an application elements. Instead, it provides some means to describe UI logic in terms of  transformations, expressions and events. The view of an application, along with its logic then compiled into very compact JavaScript code, which is later brought to life in browser using a small run-time library.

As a development tool, Clearest is meant to integrate with NodeJS ecosystem and totally relies on its component model. It assumes that any JS piece of an application (controller, service, etc.) is a CommonJS-style module, same as its dependencies. And the same applies to the compiled code from XVDL files. With the help of the other great foront-end tools of your choice(e.g, Browserify) those modules are combined into browser-ready code. Since Clearest tool has a gulp-friendly interface, with a little or no effort, it could be integrated into almost any gulp pipeline of your choice.

As a bonus, Clearest comes with a static rendering feature, so both static HTML sites (with some bootstrapping code in them) and JS could be generated at once from your XVDL project sources.

### What Clearest is not
* It is not a fully featured UI framework (and never should be). The implementations of such goodies like UI libraries, layouts, routing, HTTP, REST/ORM, etc. are supposed to be done elsewhere. Although they could be implemented as a part of a framework, we may provide some of them as add-ons, and it is all developer's choice whether to use them or not.
* It is not a template engine. Although the term "template" is widely used to describe a file with XVDL instructions, there is no such thing like 
```html = evaluate(myTemplate, {param: myData})```
in your application. Instead, your XVDL code describes where the data comes from and how should it be rendered in browser or fed to other components.




##XVDL in Clearest 2.0
Developing with Clearest means coding your apps with XVDL and JavaScript.

Since clearest implements XVDL with JavaScript, it means 

* scopes, 
* objects, 
* variables,
* expression language (EL) 
 
are handled natively by JavaScript. 

A formal [XVDL Specification](xvdl.md) introduces some basic language concepts and its instruction reference. Here is the complete list of implemented instruction namespaces (and their default prefixes in Clearest):

* xmlns:t = "http://clearest.illya.com.br/2.0/template"
* xmlns:s = "http://clearest.illya.com.br/2.0/select"
* xmlns:sa = "http://clearest.illya.com.br/2.0/@select"
* xmlns:o = "http://clearest.illya.com.br/2.0/observe"
* xmlns:e = "http://clearest.illya.com.br/2.0/event"
* xmlns:w = "http://clearest.illya.com.br/2.0/widget"
* xmlns:h = "http://clearest.illya.com.br/2.0/header"

> Note that Clearest tool allows redefinition of namespace uris, and also allows the omission of namespace declarations. When xmlns declarations are omitted, default prefixes (t, s, a, etc.) will be used to identify instructions.

##Object representation convention
In XVDL all kind of objects are interpreted as XML, and any XML fragment is modeled as an object. Clearest implements its own convention, somewhat similar to Badgersifh. 

When objects are processed with XVDL instructions or rendered in browser, the following rules apply:

1. Object is a container of nodes (elements or attributes)  
2. Properties, starting with '@' are mapped as attributes, otherwise they are mapped as elements
3. Value types are mapped as text
4. Array types are mapped as repeated elements or concatenated attributes. 
5. Nested arrays are expanded as long arrays.

Some examples of object to XML mapping convention:

JavaScript | XML
----------|---------
`{}`      | `<!-- nothing --->`
`"foo"`      | `foo`
`{$:foo}`     | `foo`
`{foo:"bar"}` | `<foo>bar</foo>`
`{foo:{'@bar':42}}`|`<foo bar="42"/>`
`{foo:1, bar:2}`|`<foo>1</foo><bar>1</bar>` (exact order is *not* guaranteed)
`[{foo:1}, {bar:2}]`|`<foo>1</foo><bar>1</bar>` (exact order is guaranteed)
`{foo:[1,2,3,'four',{five:{}},{'@six':6}]}`|`<foo>1</foo><foo>2</foo><foo>3</foo><foo>four</foo><foo><five/></foo><foo six="6"/>`

The example is not complete, however it might be sufficient to cover most usage cases. The inverse mapping is somewhat more complicated (it handles the order of nodes so that any XML content stays exactly the same after conversion back and forth) but it only occurs internally and should never be a concern. 

> Internally, Clearest adds ```__CLEAREST__``` property to store additional metadata within objects. Objects generated as the result of XVDL transformations will have metadata for preserving exact order of elements as they would appear in XML. For instance `<foo>hello <bar/> world</foo>` after compilation results in object that may look like this: `{foo:{bar:{}}, $:['hello ',' world'], __CLEAREST: ...}` but if converted to XML, it will have exactly the same representation as original. 

When objects are handled properly, the content of `__CLEAREST__` property will never be exposed in unwanted fashion and in most cases developers should not worry about it. 

  
## Basic templates and transformations
Any kind XML containing XVDL instructions is loosely called a ``template'', since it usually produces some new content by combining input data with presentation. This operation can be seen as the transformation of a content with respect to a template, as usually offered by many conventional template engines.

Usually, there are two kind of instructions used to achieve such transformations:

* template instructions (xmlns:t)
* select instructions (xmlns:s, xmlns:sa)

### Putting and retrieving data from scope
Lets start with a classic example:

```xml
<h1>Hello world</h1>
```

This one statically produces the same expected output. 
Same results can be achieved in different ways using ```t:get``` instruction:

```xml
<h1>Hello <t:get word="'world'"/></h1>
```

```xml
<t:get text="'wor'">
 <h1>Hello <t:get word="text + 'ld'"/></h1>
</t:get>
```

```xml
<t:get text1="'wor'" text2="'ld'">
 <h1>Hello <t:get word="text1 + text2"/></h1>
</t:get>
```

The instruction ```t:get``` evaluates all expressions withing its attributes, putting their values to corresponding variables in the scope of instruction. If instruction has a template in its body it is evaluated. Otherwise, expression results are directly returned as is.

The variables in scope have the same behavior as in nested closures (BTW, this code becomes nested closures after compilation:
```xml
<t:get a="42" b="13">
 <t:get res = "a+b"> is not
  <t:get a="12">
  <t:get res = "a+b">
 <t/get>
</t:get>
```
The expected output is "55 is not 25".

> Note, that variables and scopes, same as in JavaScript, has nothing to do with data binding or observables. 









