# eXtensible View Definition Language (XVDL) Reference

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

## Widget (xmns:w)
!### <w:* ![@w:*] @template [@context]/>
!### <w:* ![@w:*]> ... </w:*>

## Event handling (xmlns:e, xmlns:o)
### @e:*
!### @o:*.*

