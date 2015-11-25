# eXtensible View Definition Language (XVDL)

This is a formal specification of XVDL. It does not cover any of its implementations. See [Clearest tutorial](tutorial) for examples.

##Key concepts
### Structure
XVDL is an abstract language built on top of the XML syntax provided with some EL (expression language) implementation. XVDL does not impose any particular structure of XML documents. By XVDL program, which will loosely call a ``template``, it is  assumes any well-formed XML document that may contain

* instructions (elements or attributes that belong to certain namespaces)
* content (any other elements or attributes which are not instructions)

Instruction may contain expressions, content, and other instructions.
It is assumed that EL supports the notion of ``objects`` and ``variables``.
 
### Scopes, objects and context
Similar to common procedural languages, XVDL uses the concept of ``variables`` in``scopes``. Variables contain objects, and can be manipulated by means of instructions and/or expressions. 

Many instructions operate on a ``context`` object, which is always associated to some variable in scope. Certain instructions may redefine (switch) context object to different variables in scope.

### Data is content, content is data
It is assumed that any ``object`` has its presentation in a form of XML ``content``. It is also assumed that ``content`` is an ``object``. 

Naturally, one would expect some consistency of such representations: an object converted to XML content and back, should be equivalent (in some terms) to its original. Such conversion is implementation-specific and should be totally transparent at language level. 

Here we only assume an existence of some well-defined convention, so that given an object, its XML equivalent it is predictable to the programmer.

>One may think of bi-directional marshaling between objects and XML. However, in most implementations such marshaling does needed to be done explicitly. Instead, one may consider an implementation of XVDL instructions in which objects are "scanned", "viewed", or "transformed" resulting in other objects, without being converted to XML. For instance, in Clearest, XML content is converted into its JavaScipt form only at compilation time. In runtime, presentations are generated as objects, and only rendered back to XML form when fed to browser as HTML content. 

## Template namespace (xmlns:t)

### <t:require @*/>
### <t:use @template [@context]/>
### <t:use @template [@context]> ... </t:use>

### <t:context [@*]/>
### <t:context [@*]> ... </t:context>

!### < t:control/>
### < t:control @*> ... </t:control>

### <t:get [@*]/>
### <t:get [@*]> ... </t:get>

!### t:catch [@from]
### < t:fragment [@env:*] [/]>
### < t:comment [@env:*] [/]>
### <t:if @test|@exist [@from]>[< t:then >][< t:else >]
!### @t:*

## Select namespaces (xmlns:s , xmlns:sa)
### <s:* [@from] [@as] ![@where] ![@orderby] ![@filter]>...</s:*>
!### <s:* [@from] [@as] ![@where] ![@orderby] ![!@filter]/>
!### sa:* [@from] [@as] [@where] [@orderby] [@filter]

!### s:* @bind [@from] [@as]
!### sa:* @bind [@from] [@as]
!### @s:*
!### @sa:*


## Dynamic extensions

## Widget (xmns:w)
!### <w:* ![@w:*] @template [@context]/>
!### <w:* ![@w:*]> ... </w:*>

## Event handling (xmlns:e, xmlns:o)
### @e:*
!### @o:*.*

