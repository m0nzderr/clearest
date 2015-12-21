# eXtensible View Definition Language (XVDL)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Template instructions (xmlns:t)](#template-instructions-xmlnst)
  - [``<t:attr>``](#tattr)
  - [``<t:comment>``](#tcomment)
  - [``<t:context>``](#tcontext)
  - [``<t:control>``](#tcontrol)
  - [``<t:element>``](#telement)
  - [``<t:error>``](#terror)
  - [``<t:fragment>``](#tfragment)
  - [``<t:get>``](#tget)
  - [``<t:if>``, ``<t:if-error>``](#tif-tif-error)
  - [``<t:inject>``](#tinject)
  - [``<t:require>``](#trequire)
  - [``<t:script>``](#tscript)
  - [``<t:use>``](#tuse)
  - [``@*`` and ``@t:*``](#@-and-@t)
- [Selection instructions (xmlns:s)](#selection-instructions-xmlnss)
  - [``<s:*>, <s:.*>``](#s-s)
  - [``<s:...>``](#s)
- [Events (xmlns:e, xmlns:o)](#events-xmlnse-xmlnso)
  - [``@e:*``, ``@o:*.*``](#@e-@o)
- [Widget  (xmlns:w)](#widget--xmlnsw)
  - [``<w:*>``](#w)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Template instructions (xmlns:t)

Elements

<!-- A -->


### ``<t:attr>``
**TODO 2.0.0**

``<t:attr name="expression"> ... <t:attr>``

``<t:attr name="expression" value="expression">``

<!-- B -->
<!-- C -->

### ``<t:comment>``
``<t:comment [@env:*]> ... </t:comment>``

### ``<t:context>``
``<t:context/>``

``<t:context @* > ... </t:context>``

### ``<t:control>``
``< t:control [@*]> js-code </t:control>``

*2.1.0:*

``<t:control [@from]/>``

<!-- D -->
<!-- E -->

### ``<t:element>``
**TODO 2.0.0**

``<t:element name="expression"> ... <t:element>``

``<t:element name="expression" value="expression">``



### ``<t:error>``
``<t:error [@type] [@catch] [@from]/>``

``<t:error [@type] [@catch] [@from] [@as]> ... </t:error>``

<!-- F -->

### ``<t:fragment>``
``<t:fragment [@env:*]> ... </t:fragment>``

<!-- G -->



### ``<t:get>``
 ``<t:get [@*]/>``

 ``<t:get [@*]> ... </t:get>``

``@*="js-expression"``

``@*="{{object.field}}"``

``@*="js-expression with {{object.field}}"``

<!-- H -->
<!-- I -->

### ``<t:if>``, ``<t:if-error>``

```<t:if [@exist] [@test]  [@from]> ... </t:if>```

```<t:if-error  [@type]  [@test] [@from]> ... </t:if>```

```xml
<t:if [@exist] [@test]  [@from]>
        <t:then>...</t:then>
        <t:else>...</t:else>
</t:if>

<t:if-error [@type] [@test] [@from]>
        <t:then>...</t:then>
        <t:else>...</t:else>
</t:if>
```

### ``<t:inject>``
*2.1.0*

<!-- J -->
<!-- K -->
<!-- L -->
<!-- M -->
<!-- N -->
<!-- O -->
<!-- P -->
<!-- Q -->
<!-- R -->

### ``<t:require>``
``<t:require @*/>``

``<t:require @*> ... </t:require>``

<!-- S -->


### ``<t:script>``
``<t:script> js-code </t:script>``


<!-- T -->
<!-- U -->




### ``<t:use>``
``<t:use @template [@context]/>``

``<t:use @template > ... </t:use>``


<!-- V -->
<!-- W -->
<!-- X -->
<!-- Y -->
<!-- Z -->




### ``@*`` and ``@t:*``

``@*="static text``

``@*="${js-expression}``

``@*="{{object.field}}``

``@*="${js-expression, {{object.field}} }``


## Selection instructions (xmlns:s)
### ``<s:*>, <s:.*>``

``<s:* [@from] [@as] [@where] [@orderby] [@filter]>...</s:*>``

``<s:* [@from] [@as] [@where] [@orderby] [@filter]/>``

**TODO: 2.0.0:**

``@where``

``@orderby``

``@transform``

*2.1.0:*

``@bind``

``@filter``

``@first``

``@last``


### ``<s:...>``
*2.1.0:*



## Events (xmlns:e, xmlns:o)
### ``@e:*``, ``@o:*.*``

``@e:*="js-expression"`

``@o:\*.\*="js-expression"`

Handler syntax
* Autodetect: ``"js-expression"``
* Closure with return: ``@e.*="= js-expression"``
* Handler call: ``@e.*=": js-expression"``


## Widget  (xmlns:w)

### ``<w:*>``
``<w:* [@w:set.*] [@*] [@t:*]>...</w:*>``

``<w:* @w:template [@w:set.*] [@*] [@t:*]>...</w:*>``

``<w:* @w:template @w:context [@w:set.*] [@*] [@t:*]>...</w:*>``

*2.1.0:*

``@w:controller``