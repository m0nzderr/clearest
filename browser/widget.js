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
    subscribe = observer.subscribe;

var Core = require("./../core/api");


var FLAG_UPDATE = 1,
    FLAG_REBUILD = 2;

//Inherit core API implementation
commons.inherit(Widget, Core);
/**
 * @param {Application} app
 * @param template
 * @param context optional context object for presentation
 * @constructor
 */

function Widget(app, template, context) {

    Widget.super(this);

    var widget = this,
        view, components = this.components;

    // ---------------- private ----------------------------------------
    function _buildComponents() {
        var queue = [];

        components.forEach(function (comp, index) {
            // obtain view element for component
            var componentView = app.find(comp.id, view);
            var controllers = [];
            // initialize controllers
            each(comp.init, function (init) {
                //TODO: specify which arguments shoule be passed to controller
                var ctl = init.call(componentView, widget);
                if (ctl && ctl.build) {
                    if (ctl.destroy || ctl.process)
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
            if (controller.destroy !== undefined) {
                controller.destroy();
            }
        });
        // clearn up list
        components.length = 0;
    }


    // boot implementation
    function _start(_bootComponents) {

        app.root = widget;

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

        //toc('render');

        // asynchronously build new components
        return _start();
    }


    function _abort(error) {
        progress = null;
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
        // generate presentation and update view
        var newPresentation = template(this, this.agg, context);

        // use promises only when needed, that runs faster
        if (isPromise(newPresentation ))
            return promise.resolve(newPresentation)
                .then(_update, _abort)
        else {
            return _update(newPresentation );
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

    this._listen=function(o,k, updateOnly){
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


    this.process = function(){
        var widget = this;

        if (requestFlag) {
            if (!progress) {

                if (requestFlag & FLAG_REBUILD) {
                    progress = widget.build();
                } else if (requestFlag & FLAG_UPDATE) {
                    progress = _update(presentation);
                };

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
            var queue =[];
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

    // ------------ api implementation -----------------------------------
    this.wid = function (template, context) {
        // control function
        return function () {
            // evaluate context within new widget
            if (isFunction(context)) {
                return new Widget(app, function (P, S) {
                    return P.get(template, [P, S, context(P, S)])
                });
            }
            else {
                return new Widget(app, template, context);
            }
        }
    };


    // app reference
    this.app = app;

    this.on = function (event, handler /* options */) {
        // control function
        return function ($widget) {
            // wrapped element
            var $this = $widget.app.wrapper(this);

            // handler proxy
            var proxy = function($event) {
                var result = handler.call(this,$event,$this);
                if (app.process && (isPromise(result) || $event !== result)) {
                    // TODO: call processing chain
                    app.process();
                }
            };

            //controller:
            return {
                build: function() {
                    $this.on(event, proxy );
                },
                destroy: function(){
                    $this.off(event, proxy );
                }
            }
        }
    };


}

//TODO: implement .obs
//TODO: implement .ctl
//TODO: implement .process

module.exports = Widget;