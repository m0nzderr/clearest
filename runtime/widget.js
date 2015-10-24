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
    isValue= commons.is.value,
    isClearest = commons.is._,
    _in =commons._in;


var ID_ATTRIBUTE = commons.constant.ATTR + 'id',
    ID_SEPARATOR = '-',
    CLEAREST = commons.constant.CLEAREST;

//Inherit core API implementation
commons.inherit(Widget, Api);

/**
 * @param {Builder} builder
 * @param template
 * @param context optional context object for presentation
 * @constructor
 */
function Widget(builder, template, context) {
    var widget = this,
        view, widgetId;

    // ---------------- private ----------------------------------------
    var components = [];
    var counter = {};

    // generates unique id for a component
    function componentId(o, k) {
        var id = o[ID_ATTRIBUTE];

        if (!id) {
            if (!k) {
                // use widget id
                id = widgetId;
            }
            else {
                // generete id on the fly
                if (counter[k] === undefined)
                    counter[k] = 0;
                id = widgetId + ID_SEPARATOR + k + (++counter[k]);
            }
            o[ID_ATTRIBUTE] = id;
        }
        return id;
    }

    function _buildComponents(o) {
        var queue = [];

        components.forEach(function (comp, index) {
            // obtain view element for component
            var componentView = builder.getView(comp.id, view);
            var destroy = [];
            // initialize controllers
            each(comp.init,function(init) {
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
            components[index]=destroy;
        });

        if (queue.length > 0) {
            // wait for asynchronous components to build
            var def = promise.defer();
            promise.all(queue)
                //TODO: check if failure chain must be considered
                .finally(function () {
                    def.resolve(widget);
                });
            return def.promise;
        }

        return widget;
    }

    function _destroyComponents() {
        // destroy components
        each(components,function (controller) {
            controller.destroy();
        });
        // clearn up list
        components.length = 0;
    }

    // scans o for control code popullating components, biding to events, etc.
    function _scan(o, prefix) {
        if (o === undefined
            || o === null
            || isValue(o)
            || isFunction(o)
        ) return; // skip

        // todo: subscribe th changes in o

        if (isClearest(o)) {
            var ctl = _in(o).ctl;
            if (ctl) {
                components.push({
                    id: componentId(o, prefix),
                    init: ctl
                })
            }
        }

        for (var k in o) {
            if (k !== CLEAREST && k) {
                each(o[k], function (o) {
                    _scan(o, k);
                })
            }
        }
    }

    // updates widget view and its components
    function _update(presentation) {
        //TODO: check progress state

        // remove existing components
        _destroyComponents();

        //TODO: optimize, by adding callback to html() renderer
        // extract components from generated view, hook-up to change events, etc.
        _scan(presentation, false);

        builder.render(view, presentation);

        // asynchronously build new components
        return _buildComponents();
    }

    function _abort(error){
        console.log("widget build aborted due to unexpected error");
        console.log(error, error.stack);
        console.log(promise.getUnhandledReasons());
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
        widgetId = builder.getId(view);
        // generate presentation and update view
        var presentation =template(this, this.agg, context);
        return promise( presentation ).then(_update,_abort);
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
    this.wid = function (template) {
        // context is passed at compile time
        return new Widget(builder, template);
    };

    //TODO: implement .on
    //TODO: implement .obs
    //TODO: implement .process
}

module.exports = Widget;