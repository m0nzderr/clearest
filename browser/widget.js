/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
"use strcict";

/**
 * Clearest Widget
 */
var commons = require("../core/commons"),
    observer = require("../core/observer"),
    promise = commons.promise,
    fin = commons.fin,
    isPromise = commons.is.promise,
    isFunction = commons.is.fun,
    isValue = commons.is.value,
    isClearest = commons.is._,
    isComposit = commons.is.composit,
    _in = commons.inside,
    subscribe = observer.subscribe,
    unsubscribe = observer.unsubscribe,
    each = commons.each;


var Core = require("./../core/api");


/**
 * Default widget configuration parameters.
 *
 * Parameters could be customized with "w:set.*" attribute syntax.
 * E.g.:
 *
 * <w:mycontainer w:set.error.capture="true"/>
 *
 *
 */
Widget.DEFAULT_PARAMETERS = {
    on:{
	render:false,
	build:false,
	ready:false
    },
    error: {
        /**
         * Name of custom event for propagated errors
         */
        event: "error",
        /**
         * Error capturing mode.
         * It could be set to
         *      true,
         *      false
         * or
         *      function(error) { } that returns those values.
         *
         * When false is set or returned, errors are propagated into the DOM as custom events for
         * further handling. Otherwise errors are not propagated (i.e., captured by a widget).
         * For more control, provide a function with a custom implementation, e.g:
         *
         * function (error, widget) {
         *          console.error(widget.getId(),error);
         *          // do not propagate (capture)
         *          return true;
         * }
         *
         */
        capture: function(error, widget){
            if (error instanceof Error)
                console.error(error,widget);
        },
        /**
         * Default error handler
         *
         * @param {Widget} widget
         * @param {Element} view
         * @param {Array} errors
         */
        handler: function (errors, widget) {
            var event = this.event,
                capture = this.capture,
                app = widget.app,
                view = widget.view;

            errors.forEach(function (error) {
                ((typeof capture === 'function') ? capture(error, widget) : capture)
                ||
                app.trigger(view, app.event(event, {
                    detail: error,
                    bubbles: true,
                    cancelable: true
                }))
            });
        }
    }
};


function mergeParameters(defaults, user) {
    if (user === undefined)
        return defaults;
    if (defaults === undefined)
        return user;
    if (typeof defaults === 'object') {
        for (var k in defaults) {
            var u = user[k];
            user[k] = mergeParameters(defaults[k], u);
        }
    }
    return user;
}


var FLAG_UPDATE = 1,
    FLAG_REBUILD = 2;

var EVENT_SEPARATOR = '-or-';

//Inherit core API implementation
commons.inherit(Widget, Core);
/**
 * @param {Application} app
 * @param template
 * @param context optional context object for presentation
 * @constructor
 */
function Widget(app, template, context, parameters) {

    Widget.super(this);

    var widget = this,
        view, components = this.components;

    this.parameters = parameters = (parameters === undefined) ? Widget.DEFAULT_PARAMETERS     // fast lane
        : mergeParameters(Widget.DEFAULT_PARAMETERS, parameters);   // slow lane;

    // ---------------- private ----------------------------------------
    function _buildComponents() {
        var queue = [];

        components.forEach(function (comp, index) {
            // obtain view element for component
            var componentView = app.find(comp.id, view);
            var controllers = [];
            // initialize controllers

            each(comp.init, function (init) {
                var ctl = init.call(componentView, widget);
                if (ctl && ctl.build !== undefined) {
                    if (ctl.destroy !== undefined || ctl.process !== undefined)
                        controllers.push(ctl);
                    // call build() method
                    var result = ctl.build(componentView);
                    // add to queue, if necessary
                    if (isPromise(result)) {
                        queue.push(result);
                    }
                }
            });
            components[index] = controllers;
        });

        if (queue.length > 0) {
            // wait for asynchronous components to build
            var def = promise.defer();
            promise.all(queue)
                .then(undefined, function (error) {
                    // handle build error
                    widget._error(commons.error(error));
                })
                //TODO: check if failure chain must be considered
                .finally(function () {
                    //toc('init');
                    def.resolve(widget);
                });

            return def.promise.then(_finalize);
        } //else
        //toc('init');

        return _finalize();
    }

    function _destroyComponents() {
        // destroy components
        each(components, function (controller) {
            if (controller.destroy !== undefined) {
                controller.destroy();
            }
        });
        // clearn up list
        components.length = 0;
    }


    // boot implementation
    function _start(_bootComponents) {

        //app.root = widget;

        //tic('init');
        if (_bootComponents !== undefined) {
            app.root = widget;
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

    this.start = _start;

    // updates widget view and its components


    var presentation;

    function _update(newPresentation) {
        presentation = newPresentation;
        // remove existing components
        _destroyComponents();
        //TODO: optimize, by adding callback to html() renderer
        // extract components from generated view, hook-up to change events, etc.
        widget._scan(presentation, false);

        app.render(view, presentation);

	if (parameters.on.render) {
		parameters.on.render.call(view,this);
	}

        // asynchronously build new components
        return _start();
    }


    function _abort(error) {
        progress = null;
        widget._error(commons.error(error));
        _finalize();
    }

    function _finalize() {

	if (parameters.on.ready) {
		parameters.on.ready.call(view,this);
	}

        // process errors
        if (templateErrors.length > 0) {
            var uncaught = [];
            templateErrors.forEach(function (o) {
                if (isError(o)) {
                    uncaught.push(inside(o).error);
                }
            });
            if (uncaught.length > 0) {
                parameters.error.handler(uncaught, widget);
            }
        }
        return widget;
    }

    /*var t={};
     function tic(k) {
     t[k]= (new Date());
     }

     function toc(k) {
     t[k] = (new Date()) - t[k];
     }

     this.stats=function(){
     return t;
     }*/

    //--------------- component interface implementation -------------------

    /**
     * Called by parent component to generate presentation inside given container,
     * is supposed to build all child conponents as well.
     * @param {*} targetView
     */
    this.build = function (targetView) {

        this.view = view = targetView || view;
        widget._setId(view.id);

	if (parameters.on.build) {
		parameters.on.build.call(view,this);
	}

        // clear errors
        templateErrors.length = 0;

        // generate presentation and update view
        var newPresentation = template(this, this.agg, context);

        // use promises only when needed, that runs faster
        if (isPromise(newPresentation))
            return promise.resolve(newPresentation)
                .then(_update, _abort)
        else {
            return _update(newPresentation);
        }
    };


    var requestFlag = 0,
        progress = null;

    function requestRebuild() {
        requestFlag |= FLAG_REBUILD;
    }

    function requestUpdate() {
        requestFlag |= FLAG_UPDATE;
    }

    this._listen = function (o, k, updateOnly) {
        if (updateOnly) {
            subscribe(o, k, requestUpdate);
        }
        else {
            subscribe(o, k, requestRebuild);
            if (!isClearest(o)) return;
            //if (inside(o).bind && inside(o).bind[k]) return;
            // subscribe to the same key of sequence components
            if (isComposit(o))
                each(o._.seq, function (o) {
                    widget._listen(o, k);
                });
        }
    };

    // error handling
    var templateErrors = [];
    this._error = function (o) {
        templateErrors.push(o);
    };


    this.process = function () {
        var widget = this;

        if (requestFlag) {
            if (!progress) {

                if (requestFlag & FLAG_REBUILD) {
                    progress = widget.build();
                } else if (requestFlag & FLAG_UPDATE) {
                    progress = _update(presentation);
                }
                ;

                requestFlag = 0;

                if (isPromise(progress)) {
                    var after = progress.then(function () {
                        if (requestFlag) {
                            // restart chain
                            return widget.process();
                        } else {
                            // done
                            progress = null;
                            return widget;
                        }
                    });

                    progress = after;
                    return progress;

                } else {
                    // done
                    progress = null;
                    return widget;
                }
            }
            else
                return progress;
        } else {
            var queue = [];
            each(components, function (controller) {
                if (controller.process) {
                    var res = controller.process();
                    if (isPromise(res)) {
                        queue.push(res);
                    }
                }
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
            } else
                return widget;
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


    // app reference
    this.app = app;
}


/**
 * Widget controller
 * @param template
 * @param context
 * @returns {Function}
 */
Widget.prototype.wid = function (template, context, parameters) {
    // control function
    return function (widget) {
        // evaluate context within new widget
        if (isFunction(context)) {
            return new Widget(widget.app, function (P, S) {
                return P.get(template, [P, S, context(P, S)])
            }, parameters);
        }
        else {
            return new Widget(widget.app, template, context, parameters);
        }
    }
};

/**
 *
 * Observable controller
 *
 * @param event
 * @param handler
 * @returns {Function}
 */
Widget.prototype.obs = function (object, key, handler /* options */) {
    // control function
    return function (widget) {
        var element = this;

        var proxy = (handler.length == 0)?
            //if no arguments, bind is just enough
                handler.bind(element)
            :
                function(sender){
                    handler.call(element, object[key], widget, sender);
                }

        // call proxy once
        proxy(object[key]);
        //controller:
        return {
            build: function () {
                subscribe(object, key, proxy)
            },
            destroy: function () {
                unsubscribe(proxy)
            }
        }
    }
};

/**
 * Handles errors produced by controller code
 * @param error
 */
Widget.prototype._controllerError = function (error) {
    this.parameters.error.handler([error], this);
}

/**
 * Event controller
 *
 * @param event
 * @param handler
 * @returns {Function}
 */
Widget.prototype.on = function (event, handler /* options */) {

    //proposal #17
    var events = event.split(EVENT_SEPARATOR);

    // control function
    return function (widget) {
        //  element
        var element = this, app = widget.app; //$this = widget.app.wrapper(this);

        // handler proxy
        var proxy = function ($event) {
            new (promise.Promise)(function(resolve){
                resolve(handler.call(element, $event, widget))
            }).then(
                function(){ return app.process(); },
                function (e) {widget._controllerError(e)}
            );
        };

        //controller:
        return {
            build: function () {
                //proposal #17
                events.forEach(function(event){
                    app.on(element, event, proxy);
                })

            },
            destroy: function () {
                //proposal #17
                events.forEach(function(event) {
                    app.off(element, event, proxy);
                });
            }
        }
    }
};

module.exports = Widget;