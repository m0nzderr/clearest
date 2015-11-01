/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
/**
 * Clearest Widget (dynamic implementation of api)
 *
 * TODO: add rebuild/update hooks
 * TODO: implement in-progress request negotiation
 * TODO: implement widget events
 * TODO: implement error handling
 * TODO: decide if bidirectional context proxy is needed (.bind)
 */

var Api = require("./api"),
    commons = require("./../commons"),
    promise = commons.promise,
    fin = commons.fin,
    isPromise = commons.is.promise,
    isFunction = commons.is.fun,
    isValue = commons.is.value,
    isClearest = commons.is._,
    _in = commons.inside;


//Inherit core API implementation
commons.inherit(Widget, Api);
/**
 * @param {Builder} builder
 * @param template
 * @param context optional context object for presentation
 * @constructor
 */
function Widget(builder, template, context) {

    Widget.super(this);

    var widget = this,
        view, components = this.components;

    // ---------------- private ----------------------------------------
    function _buildComponents() {
        var queue = [];

        components.forEach(function (comp, index) {
            // obtain view element for component
            var componentView = builder.getView(comp.id, view);
            var destroy = [];
            // initialize controllers
            each(comp.init, function (init) {
                //TODO: specify which arguments shoule be passed to controller
                var ctl = init.call(componentView, widget);
                if (ctl && ctl.build) {
                    if (ctl.destroy)
                        destroy.push(ctl)
                    // call build() method
                    var result = ctl.build(componentView);
                    // add to queue, if necessary
                    if (isPromise(result)) {
                        queue.push(result);
                    }
                }
            });
            components[index] = destroy;
        });

        if (queue.length > 0) {
            // wait for asynchronous components to build
            var def = promise.defer();
            promise.all(queue)
                //TODO: check if failure chain must be considered
                .finally(function () {
                    //toc('init');
                    def.resolve(widget);
                });
            return def.promise;
        } //else
            //toc('init');

        return widget;
    }

    function _destroyComponents() {
        // destroy components
        each(components, function (controller) {
            controller.destroy();
        });
        // clearn up list
        components.length = 0;
    }


    // boot implementation
    function _start(_bootComponents) {
        //tic('init');
        if (_bootComponents !== undefined) {
            // boot
            _bootComponents.forEach(function (o) {
                for (var k in o) {
                    components.push({
                        id: k,
                        init: o[k]
                    })
                }
            });
        }
        return _buildComponents();
    }

    this.start =_start;

    // updates widget view and its components
    function _update(presentation) {
        //TODO: check progress state


        // remove existing components
        _destroyComponents();

        //TODO: optimize, by adding callback to html() renderer
        // extract components from generated view, hook-up to change events, etc.
        widget._scan(presentation, false);

        builder.render(view, presentation);

        //toc('render');

        // asynchronously build new components
        return _start();
    }

    function _abort(error) {
        //console.log("widget build aborted due to unexpected error");
        //console.log(error, error.stack);
        //console.log(promise.getUnhandledReasons());
    }

    /*var t={};
    function tic(k) {
        t[k]= (new Date());
    }

    function toc(k) {
        t[k] = (new Date()) - t[k];
    }*/

    this.stats=function(){
        return t;
    }

    //--------------- component interface implementation -------------------
    /**
     * Called by parent component to generate a inside given container,
     * is supposed to build all child conponents as well.
     * @param {*} targetView
     */
    this.build = function (targetView) {
        //TODO: check progress state
        view = targetView;
        widget._setId(builder.getId(view));
        // generate presentation and update view
        var presentation = template(this, this.agg, context);

        // use promises only when needed, that runs faster
        if (isPromise(presentation))
            return promise.resolve(presentation)
                .then(_update, _abort)
        else {
            return _update(presentation);
        }

    };


    /**
     * Destroys a view
     * (not supposed to clean-up the container, but unbind event handlers, etc.)
     * @param container domElement
     */
    this.destroy = function () {
        _destroyComponents();
        delete view;
    };

    // ------------ api implementation -----------------------------------
    this.wid = function (template, context) {
        // control function
        return function () {
            // evaluate context within new widget
            if (isFunction(context)) {
                return new Widget(builder, function (P, S) {
                    return P.get(template, [P, S, context(P, S)])
                });
            }
            else {
                return new Widget(builder, template, context);
            }
        }
    };
}

//TODO: implement .on
//TODO: implement .obs
//TODO: implement .ctl
//TODO: implement .process

module.exports = Widget;