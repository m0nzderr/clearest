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
    unsubscribe = observer.unsubscribe;


var Core = require("./../core/api");


var FLAG_UPDATE = 1,
    FLAG_REBUILD = 2;


var DEFAULT_PARAMETERS = {
    error: {
        handler: function (app, view, errors) {
            var event = this.event,
                filter = this.filter;

            errors.forEach(function (error) {
                (filter === undefined || filter(error))
                &&
                app.trigger(view, new CustomEvent(event, {
                    detail: error,
                    bubbles: true,
                    cancelable: true
                }))
            });
        },
        event: "error",
        filter: undefined
    }
};


function mergeParameters(defaults, user) {
    //TODO: check if this is too buggy since user side gets modified
    if (user === undefind)
        return defaults;

    if (defaults === undefind)
        return user;
    for (var k in defaults) {
        var u = user[k];
        u[k] = mergeParameters(defaults[k], u);
    }
    return user;
}

//Inherit core API implementation
commons.inherit(Widget, Core);
/**
 * @param {Application} app
 * @param template
 * @param context optional context object for presentation
 * @constructor
 */
function Widget(app, template, context, config) {

    Widget.super(this);

    var widget = this,
        view, components = this.components;

    config = (config === undefined) ? DEFAULT_PARAMETERS     // fast lane
        : mergeParameters(DEFAULT_PARAMETERS, config);   // slow lane;

    // ---------------- private ----------------------------------------
    function _buildComponents() {
        var queue = [];

        components.forEach(function (comp, index) {
            // obtain view element for component
            var componentView = app.find(comp.id, view);
            var controllers = [];
            // initialize controllers


            each(comp.init, function (init) {
                //each(comp.init, function (init) {
                //TODO: specify which arguments shoule be passed to controller

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
                .then(undefined, function () {
                    widget._error(commons.error(e));
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
        //TODO: check progress state

        // remove existing components
        _destroyComponents();

        //TODO: optimize, by adding callback to html() renderer
        // extract components from generated view, hook-up to change events, etc.
        widget._scan(presentation, false);

        app.render(view, presentation);

        // asynchronously build new components
        return _start();
    }


    function _abort(error) {
        progress = null;
        //console.log("widget build aborted due to unexpected error");

        widget._error(commons.error(error));

        _finalize();
    }

    function _finalize() {
        // process errors
        if (templateErrors.length > 0) {
            var uncaught = [];
            templateErrors.forEach(function (o) {
                if (isError(o)) {
                    uncaught.push(inside(o).error);
                }
            });
            if (uncaught.length > 0) {
                config.error.handler(widget, uncaught);
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
     * Called by parent component to generate a inside given container,
     * is supposed to build all child conponents as well.
     * @param {*} targetView
     */
    this.build = function (targetView) {
        //TODO: check progress state
        view = targetView || view;
        widget._setId(view.id);

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
        //2.1.0 TODO: add configuration
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
    return function () {
        var proxy = handler.bind(this);
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
 * Event controller
 *
 * @param event
 * @param handler
 * @returns {Function}
 */
Widget.prototype.on = function (event, handler /* options */) {
    // control function
    return function (widget) {
        // wrapped element
        var element = this, app = widget.app; //$this = widget.app.wrapper(this);

        // handler proxy
        var proxy = function ($event) {
            var result = handler.call(this, $event);
            //TODO: check for errors
            //TODO: decide what to do with the promise. Possibly wait for resolution before processing.
            if (widget.app.process && (isPromise(result) || $event !== result)) {
                // TODO: call processing chain
                widget.app.process();
            }
        };

        //controller:
        return {
            build: function () {
                app.on(element, event, proxy);
            },
            destroy: function () {
                app.off(element, event, proxy);
            }
        }
    }
};

//TODO: implement .ctl

module.exports = Widget;