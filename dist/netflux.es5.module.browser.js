var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
}



function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

// CommonJS / Node have global context exposed as "global" variable.
// We don't want to include the whole node.d.ts this this compilation unit so we'll just fake
// the global "global" var for now.
var __window = typeof window !== 'undefined' && window;
var __self = typeof self !== 'undefined' && typeof WorkerGlobalScope !== 'undefined' &&
    self instanceof WorkerGlobalScope && self;
var __global = typeof commonjsGlobal !== 'undefined' && commonjsGlobal;
var _root = __window || __global || __self;
var root_1 = _root;
// Workaround Closure Compiler restriction: The body of a goog.module cannot use throw.
// This is needed when used with angular/tsickle which inserts a goog.module statement.
// Wrap in IIFE
(function () {
    if (!_root) {
        throw new Error('RxJS could not find any global context (window, self, global)');
    }
})();


var root = {
	root: root_1
};

function isFunction(x) {
    return typeof x === 'function';
}
var isFunction_2 = isFunction;


var isFunction_1 = {
	isFunction: isFunction_2
};

var isArray_1 = Array.isArray || (function (x) { return x && typeof x.length === 'number'; });


var isArray = {
	isArray: isArray_1
};

function isObject(x) {
    return x != null && typeof x === 'object';
}
var isObject_2 = isObject;


var isObject_1 = {
	isObject: isObject_2
};

// typeof any so that it we don't have to cast when comparing a result to the error object
var errorObject_1 = { e: {} };


var errorObject = {
	errorObject: errorObject_1
};

var tryCatchTarget;
function tryCatcher() {
    try {
        return tryCatchTarget.apply(this, arguments);
    }
    catch (e) {
        errorObject.errorObject.e = e;
        return errorObject.errorObject;
    }
}
function tryCatch(fn) {
    tryCatchTarget = fn;
    return tryCatcher;
}
var tryCatch_2 = tryCatch;



var tryCatch_1 = {
	tryCatch: tryCatch_2
};

var __extends$2 = (commonjsGlobal && commonjsGlobal.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * An error thrown when one or more errors have occurred during the
 * `unsubscribe` of a {@link Subscription}.
 */
var UnsubscriptionError = (function (_super) {
    __extends$2(UnsubscriptionError, _super);
    function UnsubscriptionError(errors) {
        _super.call(this);
        this.errors = errors;
        var err = Error.call(this, errors ?
            errors.length + " errors occurred during unsubscription:\n  " + errors.map(function (err, i) { return ((i + 1) + ") " + err.toString()); }).join('\n  ') : '');
        this.name = err.name = 'UnsubscriptionError';
        this.stack = err.stack;
        this.message = err.message;
    }
    return UnsubscriptionError;
}(Error));
var UnsubscriptionError_2 = UnsubscriptionError;


var UnsubscriptionError_1 = {
	UnsubscriptionError: UnsubscriptionError_2
};

/**
 * Represents a disposable resource, such as the execution of an Observable. A
 * Subscription has one important method, `unsubscribe`, that takes no argument
 * and just disposes the resource held by the subscription.
 *
 * Additionally, subscriptions may be grouped together through the `add()`
 * method, which will attach a child Subscription to the current Subscription.
 * When a Subscription is unsubscribed, all its children (and its grandchildren)
 * will be unsubscribed as well.
 *
 * @class Subscription
 */
var Subscription = (function () {
    /**
     * @param {function(): void} [unsubscribe] A function describing how to
     * perform the disposal of resources when the `unsubscribe` method is called.
     */
    function Subscription(unsubscribe) {
        /**
         * A flag to indicate whether this Subscription has already been unsubscribed.
         * @type {boolean}
         */
        this.closed = false;
        this._parent = null;
        this._parents = null;
        this._subscriptions = null;
        if (unsubscribe) {
            this._unsubscribe = unsubscribe;
        }
    }
    /**
     * Disposes the resources held by the subscription. May, for instance, cancel
     * an ongoing Observable execution or cancel any other type of work that
     * started when the Subscription was created.
     * @return {void}
     */
    Subscription.prototype.unsubscribe = function () {
        var hasErrors = false;
        var errors;
        if (this.closed) {
            return;
        }
        var _a = this, _parent = _a._parent, _parents = _a._parents, _unsubscribe = _a._unsubscribe, _subscriptions = _a._subscriptions;
        this.closed = true;
        this._parent = null;
        this._parents = null;
        // null out _subscriptions first so any child subscriptions that attempt
        // to remove themselves from this subscription will noop
        this._subscriptions = null;
        var index = -1;
        var len = _parents ? _parents.length : 0;
        // if this._parent is null, then so is this._parents, and we
        // don't have to remove ourselves from any parent subscriptions.
        while (_parent) {
            _parent.remove(this);
            // if this._parents is null or index >= len,
            // then _parent is set to null, and the loop exits
            _parent = ++index < len && _parents[index] || null;
        }
        if (isFunction_1.isFunction(_unsubscribe)) {
            var trial = tryCatch_1.tryCatch(_unsubscribe).call(this);
            if (trial === errorObject.errorObject) {
                hasErrors = true;
                errors = errors || (errorObject.errorObject.e instanceof UnsubscriptionError_1.UnsubscriptionError ?
                    flattenUnsubscriptionErrors(errorObject.errorObject.e.errors) : [errorObject.errorObject.e]);
            }
        }
        if (isArray.isArray(_subscriptions)) {
            index = -1;
            len = _subscriptions.length;
            while (++index < len) {
                var sub = _subscriptions[index];
                if (isObject_1.isObject(sub)) {
                    var trial = tryCatch_1.tryCatch(sub.unsubscribe).call(sub);
                    if (trial === errorObject.errorObject) {
                        hasErrors = true;
                        errors = errors || [];
                        var err = errorObject.errorObject.e;
                        if (err instanceof UnsubscriptionError_1.UnsubscriptionError) {
                            errors = errors.concat(flattenUnsubscriptionErrors(err.errors));
                        }
                        else {
                            errors.push(err);
                        }
                    }
                }
            }
        }
        if (hasErrors) {
            throw new UnsubscriptionError_1.UnsubscriptionError(errors);
        }
    };
    /**
     * Adds a tear down to be called during the unsubscribe() of this
     * Subscription.
     *
     * If the tear down being added is a subscription that is already
     * unsubscribed, is the same reference `add` is being called on, or is
     * `Subscription.EMPTY`, it will not be added.
     *
     * If this subscription is already in an `closed` state, the passed
     * tear down logic will be executed immediately.
     *
     * @param {TeardownLogic} teardown The additional logic to execute on
     * teardown.
     * @return {Subscription} Returns the Subscription used or created to be
     * added to the inner subscriptions list. This Subscription can be used with
     * `remove()` to remove the passed teardown logic from the inner subscriptions
     * list.
     */
    Subscription.prototype.add = function (teardown) {
        if (!teardown || (teardown === Subscription.EMPTY)) {
            return Subscription.EMPTY;
        }
        if (teardown === this) {
            return this;
        }
        var subscription = teardown;
        switch (typeof teardown) {
            case 'function':
                subscription = new Subscription(teardown);
            case 'object':
                if (subscription.closed || typeof subscription.unsubscribe !== 'function') {
                    return subscription;
                }
                else if (this.closed) {
                    subscription.unsubscribe();
                    return subscription;
                }
                else if (typeof subscription._addParent !== 'function' /* quack quack */) {
                    var tmp = subscription;
                    subscription = new Subscription();
                    subscription._subscriptions = [tmp];
                }
                break;
            default:
                throw new Error('unrecognized teardown ' + teardown + ' added to Subscription.');
        }
        var subscriptions = this._subscriptions || (this._subscriptions = []);
        subscriptions.push(subscription);
        subscription._addParent(this);
        return subscription;
    };
    /**
     * Removes a Subscription from the internal list of subscriptions that will
     * unsubscribe during the unsubscribe process of this Subscription.
     * @param {Subscription} subscription The subscription to remove.
     * @return {void}
     */
    Subscription.prototype.remove = function (subscription) {
        var subscriptions = this._subscriptions;
        if (subscriptions) {
            var subscriptionIndex = subscriptions.indexOf(subscription);
            if (subscriptionIndex !== -1) {
                subscriptions.splice(subscriptionIndex, 1);
            }
        }
    };
    Subscription.prototype._addParent = function (parent) {
        var _a = this, _parent = _a._parent, _parents = _a._parents;
        if (!_parent || _parent === parent) {
            // If we don't have a parent, or the new parent is the same as the
            // current parent, then set this._parent to the new parent.
            this._parent = parent;
        }
        else if (!_parents) {
            // If there's already one parent, but not multiple, allocate an Array to
            // store the rest of the parent Subscriptions.
            this._parents = [parent];
        }
        else if (_parents.indexOf(parent) === -1) {
            // Only add the new parent to the _parents list if it's not already there.
            _parents.push(parent);
        }
    };
    Subscription.EMPTY = (function (empty) {
        empty.closed = true;
        return empty;
    }(new Subscription()));
    return Subscription;
}());
var Subscription_2 = Subscription;
function flattenUnsubscriptionErrors(errors) {
    return errors.reduce(function (errs, err) { return errs.concat((err instanceof UnsubscriptionError_1.UnsubscriptionError) ? err.errors : err); }, []);
}


var Subscription_1 = {
	Subscription: Subscription_2
};

var empty = {
    closed: true,
    next: function (value) { },
    error: function (err) { throw err; },
    complete: function () { }
};


var Observer = {
	empty: empty
};

var rxSubscriber = createCommonjsModule(function (module, exports) {
"use strict";

var Symbol = root.root.Symbol;
exports.rxSubscriber = (typeof Symbol === 'function' && typeof Symbol.for === 'function') ?
    Symbol.for('rxSubscriber') : '@@rxSubscriber';
/**
 * @deprecated use rxSubscriber instead
 */
exports.$$rxSubscriber = exports.rxSubscriber;

});

var __extends$1 = (commonjsGlobal && commonjsGlobal.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};




/**
 * Implements the {@link Observer} interface and extends the
 * {@link Subscription} class. While the {@link Observer} is the public API for
 * consuming the values of an {@link Observable}, all Observers get converted to
 * a Subscriber, in order to provide Subscription-like capabilities such as
 * `unsubscribe`. Subscriber is a common type in RxJS, and crucial for
 * implementing operators, but it is rarely used as a public API.
 *
 * @class Subscriber<T>
 */
var Subscriber = (function (_super) {
    __extends$1(Subscriber, _super);
    /**
     * @param {Observer|function(value: T): void} [destinationOrNext] A partially
     * defined Observer or a `next` callback function.
     * @param {function(e: ?any): void} [error] The `error` callback of an
     * Observer.
     * @param {function(): void} [complete] The `complete` callback of an
     * Observer.
     */
    function Subscriber(destinationOrNext, error, complete) {
        _super.call(this);
        this.syncErrorValue = null;
        this.syncErrorThrown = false;
        this.syncErrorThrowable = false;
        this.isStopped = false;
        switch (arguments.length) {
            case 0:
                this.destination = Observer.empty;
                break;
            case 1:
                if (!destinationOrNext) {
                    this.destination = Observer.empty;
                    break;
                }
                if (typeof destinationOrNext === 'object') {
                    if (destinationOrNext instanceof Subscriber) {
                        this.destination = destinationOrNext;
                        this.destination.add(this);
                    }
                    else {
                        this.syncErrorThrowable = true;
                        this.destination = new SafeSubscriber(this, destinationOrNext);
                    }
                    break;
                }
            default:
                this.syncErrorThrowable = true;
                this.destination = new SafeSubscriber(this, destinationOrNext, error, complete);
                break;
        }
    }
    Subscriber.prototype[rxSubscriber.rxSubscriber] = function () { return this; };
    /**
     * A static factory for a Subscriber, given a (potentially partial) definition
     * of an Observer.
     * @param {function(x: ?T): void} [next] The `next` callback of an Observer.
     * @param {function(e: ?any): void} [error] The `error` callback of an
     * Observer.
     * @param {function(): void} [complete] The `complete` callback of an
     * Observer.
     * @return {Subscriber<T>} A Subscriber wrapping the (partially defined)
     * Observer represented by the given arguments.
     */
    Subscriber.create = function (next, error, complete) {
        var subscriber = new Subscriber(next, error, complete);
        subscriber.syncErrorThrowable = false;
        return subscriber;
    };
    /**
     * The {@link Observer} callback to receive notifications of type `next` from
     * the Observable, with a value. The Observable may call this method 0 or more
     * times.
     * @param {T} [value] The `next` value.
     * @return {void}
     */
    Subscriber.prototype.next = function (value) {
        if (!this.isStopped) {
            this._next(value);
        }
    };
    /**
     * The {@link Observer} callback to receive notifications of type `error` from
     * the Observable, with an attached {@link Error}. Notifies the Observer that
     * the Observable has experienced an error condition.
     * @param {any} [err] The `error` exception.
     * @return {void}
     */
    Subscriber.prototype.error = function (err) {
        if (!this.isStopped) {
            this.isStopped = true;
            this._error(err);
        }
    };
    /**
     * The {@link Observer} callback to receive a valueless notification of type
     * `complete` from the Observable. Notifies the Observer that the Observable
     * has finished sending push-based notifications.
     * @return {void}
     */
    Subscriber.prototype.complete = function () {
        if (!this.isStopped) {
            this.isStopped = true;
            this._complete();
        }
    };
    Subscriber.prototype.unsubscribe = function () {
        if (this.closed) {
            return;
        }
        this.isStopped = true;
        _super.prototype.unsubscribe.call(this);
    };
    Subscriber.prototype._next = function (value) {
        this.destination.next(value);
    };
    Subscriber.prototype._error = function (err) {
        this.destination.error(err);
        this.unsubscribe();
    };
    Subscriber.prototype._complete = function () {
        this.destination.complete();
        this.unsubscribe();
    };
    Subscriber.prototype._unsubscribeAndRecycle = function () {
        var _a = this, _parent = _a._parent, _parents = _a._parents;
        this._parent = null;
        this._parents = null;
        this.unsubscribe();
        this.closed = false;
        this.isStopped = false;
        this._parent = _parent;
        this._parents = _parents;
        return this;
    };
    return Subscriber;
}(Subscription_1.Subscription));
var Subscriber_2 = Subscriber;
/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
var SafeSubscriber = (function (_super) {
    __extends$1(SafeSubscriber, _super);
    function SafeSubscriber(_parentSubscriber, observerOrNext, error, complete) {
        _super.call(this);
        this._parentSubscriber = _parentSubscriber;
        var next;
        var context = this;
        if (isFunction_1.isFunction(observerOrNext)) {
            next = observerOrNext;
        }
        else if (observerOrNext) {
            next = observerOrNext.next;
            error = observerOrNext.error;
            complete = observerOrNext.complete;
            if (observerOrNext !== Observer.empty) {
                context = Object.create(observerOrNext);
                if (isFunction_1.isFunction(context.unsubscribe)) {
                    this.add(context.unsubscribe.bind(context));
                }
                context.unsubscribe = this.unsubscribe.bind(this);
            }
        }
        this._context = context;
        this._next = next;
        this._error = error;
        this._complete = complete;
    }
    SafeSubscriber.prototype.next = function (value) {
        if (!this.isStopped && this._next) {
            var _parentSubscriber = this._parentSubscriber;
            if (!_parentSubscriber.syncErrorThrowable) {
                this.__tryOrUnsub(this._next, value);
            }
            else if (this.__tryOrSetError(_parentSubscriber, this._next, value)) {
                this.unsubscribe();
            }
        }
    };
    SafeSubscriber.prototype.error = function (err) {
        if (!this.isStopped) {
            var _parentSubscriber = this._parentSubscriber;
            if (this._error) {
                if (!_parentSubscriber.syncErrorThrowable) {
                    this.__tryOrUnsub(this._error, err);
                    this.unsubscribe();
                }
                else {
                    this.__tryOrSetError(_parentSubscriber, this._error, err);
                    this.unsubscribe();
                }
            }
            else if (!_parentSubscriber.syncErrorThrowable) {
                this.unsubscribe();
                throw err;
            }
            else {
                _parentSubscriber.syncErrorValue = err;
                _parentSubscriber.syncErrorThrown = true;
                this.unsubscribe();
            }
        }
    };
    SafeSubscriber.prototype.complete = function () {
        var _this = this;
        if (!this.isStopped) {
            var _parentSubscriber = this._parentSubscriber;
            if (this._complete) {
                var wrappedComplete = function () { return _this._complete.call(_this._context); };
                if (!_parentSubscriber.syncErrorThrowable) {
                    this.__tryOrUnsub(wrappedComplete);
                    this.unsubscribe();
                }
                else {
                    this.__tryOrSetError(_parentSubscriber, wrappedComplete);
                    this.unsubscribe();
                }
            }
            else {
                this.unsubscribe();
            }
        }
    };
    SafeSubscriber.prototype.__tryOrUnsub = function (fn, value) {
        try {
            fn.call(this._context, value);
        }
        catch (err) {
            this.unsubscribe();
            throw err;
        }
    };
    SafeSubscriber.prototype.__tryOrSetError = function (parent, fn, value) {
        try {
            fn.call(this._context, value);
        }
        catch (err) {
            parent.syncErrorValue = err;
            parent.syncErrorThrown = true;
            return true;
        }
        return false;
    };
    SafeSubscriber.prototype._unsubscribe = function () {
        var _parentSubscriber = this._parentSubscriber;
        this._context = null;
        this._parentSubscriber = null;
        _parentSubscriber.unsubscribe();
    };
    return SafeSubscriber;
}(Subscriber));


var Subscriber_1 = {
	Subscriber: Subscriber_2
};

function toSubscriber(nextOrObserver, error, complete) {
    if (nextOrObserver) {
        if (nextOrObserver instanceof Subscriber_1.Subscriber) {
            return nextOrObserver;
        }
        if (nextOrObserver[rxSubscriber.rxSubscriber]) {
            return nextOrObserver[rxSubscriber.rxSubscriber]();
        }
    }
    if (!nextOrObserver && !error && !complete) {
        return new Subscriber_1.Subscriber(Observer.empty);
    }
    return new Subscriber_1.Subscriber(nextOrObserver, error, complete);
}
var toSubscriber_2 = toSubscriber;


var toSubscriber_1 = {
	toSubscriber: toSubscriber_2
};

var observable = createCommonjsModule(function (module, exports) {
"use strict";

function getSymbolObservable(context) {
    var $$observable;
    var Symbol = context.Symbol;
    if (typeof Symbol === 'function') {
        if (Symbol.observable) {
            $$observable = Symbol.observable;
        }
        else {
            $$observable = Symbol('observable');
            Symbol.observable = $$observable;
        }
    }
    else {
        $$observable = '@@observable';
    }
    return $$observable;
}
exports.getSymbolObservable = getSymbolObservable;
exports.observable = getSymbolObservable(root.root);
/**
 * @deprecated use observable instead
 */
exports.$$observable = exports.observable;

});

/**
 * A representation of any set of values over any amount of time. This the most basic building block
 * of RxJS.
 *
 * @class Observable<T>
 */
var Observable = (function () {
    /**
     * @constructor
     * @param {Function} subscribe the function that is  called when the Observable is
     * initially subscribed to. This function is given a Subscriber, to which new values
     * can be `next`ed, or an `error` method can be called to raise an error, or
     * `complete` can be called to notify of a successful completion.
     */
    function Observable(subscribe) {
        this._isScalar = false;
        if (subscribe) {
            this._subscribe = subscribe;
        }
    }
    /**
     * Creates a new Observable, with this Observable as the source, and the passed
     * operator defined as the new observable's operator.
     * @method lift
     * @param {Operator} operator the operator defining the operation to take on the observable
     * @return {Observable} a new observable with the Operator applied
     */
    Observable.prototype.lift = function (operator) {
        var observable$$1 = new Observable();
        observable$$1.source = this;
        observable$$1.operator = operator;
        return observable$$1;
    };
    Observable.prototype.subscribe = function (observerOrNext, error, complete) {
        var operator = this.operator;
        var sink = toSubscriber_1.toSubscriber(observerOrNext, error, complete);
        if (operator) {
            operator.call(sink, this.source);
        }
        else {
            sink.add(this._trySubscribe(sink));
        }
        if (sink.syncErrorThrowable) {
            sink.syncErrorThrowable = false;
            if (sink.syncErrorThrown) {
                throw sink.syncErrorValue;
            }
        }
        return sink;
    };
    Observable.prototype._trySubscribe = function (sink) {
        try {
            return this._subscribe(sink);
        }
        catch (err) {
            sink.syncErrorThrown = true;
            sink.syncErrorValue = err;
            sink.error(err);
        }
    };
    /**
     * @method forEach
     * @param {Function} next a handler for each value emitted by the observable
     * @param {PromiseConstructor} [PromiseCtor] a constructor function used to instantiate the Promise
     * @return {Promise} a promise that either resolves on observable completion or
     *  rejects with the handled error
     */
    Observable.prototype.forEach = function (next, PromiseCtor) {
        var _this = this;
        if (!PromiseCtor) {
            if (root.root.Rx && root.root.Rx.config && root.root.Rx.config.Promise) {
                PromiseCtor = root.root.Rx.config.Promise;
            }
            else if (root.root.Promise) {
                PromiseCtor = root.root.Promise;
            }
        }
        if (!PromiseCtor) {
            throw new Error('no Promise impl found');
        }
        return new PromiseCtor(function (resolve, reject) {
            // Must be declared in a separate statement to avoid a RefernceError when
            // accessing subscription below in the closure due to Temporal Dead Zone.
            var subscription;
            subscription = _this.subscribe(function (value) {
                if (subscription) {
                    // if there is a subscription, then we can surmise
                    // the next handling is asynchronous. Any errors thrown
                    // need to be rejected explicitly and unsubscribe must be
                    // called manually
                    try {
                        next(value);
                    }
                    catch (err) {
                        reject(err);
                        subscription.unsubscribe();
                    }
                }
                else {
                    // if there is NO subscription, then we're getting a nexted
                    // value synchronously during subscription. We can just call it.
                    // If it errors, Observable's `subscribe` will ensure the
                    // unsubscription logic is called, then synchronously rethrow the error.
                    // After that, Promise will trap the error and send it
                    // down the rejection path.
                    next(value);
                }
            }, reject, resolve);
        });
    };
    Observable.prototype._subscribe = function (subscriber) {
        return this.source.subscribe(subscriber);
    };
    /**
     * An interop point defined by the es7-observable spec https://github.com/zenparsing/es-observable
     * @method Symbol.observable
     * @return {Observable} this instance of the observable
     */
    Observable.prototype[observable.observable] = function () {
        return this;
    };
    // HACK: Since TypeScript inherits static properties too, we have to
    // fight against TypeScript here so Subject can have a different static create signature
    /**
     * Creates a new cold Observable by calling the Observable constructor
     * @static true
     * @owner Observable
     * @method create
     * @param {Function} subscribe? the subscriber function to be passed to the Observable constructor
     * @return {Observable} a new cold observable
     */
    Observable.create = function (subscribe) {
        return new Observable(subscribe);
    };
    return Observable;
}());
var Observable_2 = Observable;


var Observable_1 = {
	Observable: Observable_2
};

var __extends$3 = (commonjsGlobal && commonjsGlobal.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * An error thrown when an action is invalid because the object has been
 * unsubscribed.
 *
 * @see {@link Subject}
 * @see {@link BehaviorSubject}
 *
 * @class ObjectUnsubscribedError
 */
var ObjectUnsubscribedError = (function (_super) {
    __extends$3(ObjectUnsubscribedError, _super);
    function ObjectUnsubscribedError() {
        var err = _super.call(this, 'object unsubscribed');
        this.name = err.name = 'ObjectUnsubscribedError';
        this.stack = err.stack;
        this.message = err.message;
    }
    return ObjectUnsubscribedError;
}(Error));
var ObjectUnsubscribedError_2 = ObjectUnsubscribedError;


var ObjectUnsubscribedError_1 = {
	ObjectUnsubscribedError: ObjectUnsubscribedError_2
};

var __extends$4 = (commonjsGlobal && commonjsGlobal.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};

/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
var SubjectSubscription = (function (_super) {
    __extends$4(SubjectSubscription, _super);
    function SubjectSubscription(subject, subscriber) {
        _super.call(this);
        this.subject = subject;
        this.subscriber = subscriber;
        this.closed = false;
    }
    SubjectSubscription.prototype.unsubscribe = function () {
        if (this.closed) {
            return;
        }
        this.closed = true;
        var subject = this.subject;
        var observers = subject.observers;
        this.subject = null;
        if (!observers || observers.length === 0 || subject.isStopped || subject.closed) {
            return;
        }
        var subscriberIndex = observers.indexOf(this.subscriber);
        if (subscriberIndex !== -1) {
            observers.splice(subscriberIndex, 1);
        }
    };
    return SubjectSubscription;
}(Subscription_1.Subscription));
var SubjectSubscription_2 = SubjectSubscription;


var SubjectSubscription_1 = {
	SubjectSubscription: SubjectSubscription_2
};

var __extends = (commonjsGlobal && commonjsGlobal.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};






/**
 * @class SubjectSubscriber<T>
 */
var SubjectSubscriber = (function (_super) {
    __extends(SubjectSubscriber, _super);
    function SubjectSubscriber(destination) {
        _super.call(this, destination);
        this.destination = destination;
    }
    return SubjectSubscriber;
}(Subscriber_1.Subscriber));
var SubjectSubscriber_1 = SubjectSubscriber;
/**
 * @class Subject<T>
 */
var Subject = (function (_super) {
    __extends(Subject, _super);
    function Subject() {
        _super.call(this);
        this.observers = [];
        this.closed = false;
        this.isStopped = false;
        this.hasError = false;
        this.thrownError = null;
    }
    Subject.prototype[rxSubscriber.rxSubscriber] = function () {
        return new SubjectSubscriber(this);
    };
    Subject.prototype.lift = function (operator) {
        var subject = new AnonymousSubject(this, this);
        subject.operator = operator;
        return subject;
    };
    Subject.prototype.next = function (value) {
        if (this.closed) {
            throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
        if (!this.isStopped) {
            var observers = this.observers;
            var len = observers.length;
            var copy = observers.slice();
            for (var i = 0; i < len; i++) {
                copy[i].next(value);
            }
        }
    };
    Subject.prototype.error = function (err) {
        if (this.closed) {
            throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
        this.hasError = true;
        this.thrownError = err;
        this.isStopped = true;
        var observers = this.observers;
        var len = observers.length;
        var copy = observers.slice();
        for (var i = 0; i < len; i++) {
            copy[i].error(err);
        }
        this.observers.length = 0;
    };
    Subject.prototype.complete = function () {
        if (this.closed) {
            throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
        this.isStopped = true;
        var observers = this.observers;
        var len = observers.length;
        var copy = observers.slice();
        for (var i = 0; i < len; i++) {
            copy[i].complete();
        }
        this.observers.length = 0;
    };
    Subject.prototype.unsubscribe = function () {
        this.isStopped = true;
        this.closed = true;
        this.observers = null;
    };
    Subject.prototype._trySubscribe = function (subscriber) {
        if (this.closed) {
            throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
        else {
            return _super.prototype._trySubscribe.call(this, subscriber);
        }
    };
    Subject.prototype._subscribe = function (subscriber) {
        if (this.closed) {
            throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
        else if (this.hasError) {
            subscriber.error(this.thrownError);
            return Subscription_1.Subscription.EMPTY;
        }
        else if (this.isStopped) {
            subscriber.complete();
            return Subscription_1.Subscription.EMPTY;
        }
        else {
            this.observers.push(subscriber);
            return new SubjectSubscription_1.SubjectSubscription(this, subscriber);
        }
    };
    Subject.prototype.asObservable = function () {
        var observable = new Observable_1.Observable();
        observable.source = this;
        return observable;
    };
    Subject.create = function (destination, source) {
        return new AnonymousSubject(destination, source);
    };
    return Subject;
}(Observable_1.Observable));
var Subject_2 = Subject;
/**
 * @class AnonymousSubject<T>
 */
var AnonymousSubject = (function (_super) {
    __extends(AnonymousSubject, _super);
    function AnonymousSubject(destination, source) {
        _super.call(this);
        this.destination = destination;
        this.source = source;
    }
    AnonymousSubject.prototype.next = function (value) {
        var destination = this.destination;
        if (destination && destination.next) {
            destination.next(value);
        }
    };
    AnonymousSubject.prototype.error = function (err) {
        var destination = this.destination;
        if (destination && destination.error) {
            this.destination.error(err);
        }
    };
    AnonymousSubject.prototype.complete = function () {
        var destination = this.destination;
        if (destination && destination.complete) {
            this.destination.complete();
        }
    };
    AnonymousSubject.prototype._subscribe = function (subscriber) {
        var source = this.source;
        if (source) {
            return this.source.subscribe(subscriber);
        }
        else {
            return Subscription_1.Subscription.EMPTY;
        }
    };
    return AnonymousSubject;
}(Subject));
var AnonymousSubject_1 = AnonymousSubject;


var Subject_1 = {
	SubjectSubscriber: SubjectSubscriber_1,
	Subject: Subject_2,
	AnonymousSubject: AnonymousSubject_1
};

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};











var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};





var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

var NodeCloseEvent = function CloseEvent(name) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  classCallCheck(this, CloseEvent);

  this.name = name;
  this.wasClean = options.wasClean || false;
  this.code = options.code || 0;
  this.reason = options.reason || '';
};

/**
 * Utility class contains some helper static methods.
 */
var Util = function () {
  function Util() {
    classCallCheck(this, Util);
  }

  createClass(Util, null, [{
    key: 'isBrowser',

    /**
     * Check execution environment.
     *
     * @returns {boolean} Description
     */
    value: function isBrowser() {
      if (typeof window === 'undefined' || typeof process !== 'undefined' && process.title === 'node') {
        return false;
      }
      return true;
    }

    /**
     * Check whether the channel is a socket.
     *
     * @param {WebSocket|RTCDataChannel} channel
     *
     * @returns {boolean}
     */

  }, {
    key: 'isSocket',
    value: function isSocket(channel) {
      return channel.constructor.name === 'WebSocket';
    }

    /**
     * Check whether the string is a valid URL.
     *
     * @param {string} str
     *
     * @returns {type} Description
     */

  }, {
    key: 'isURL',
    value: function isURL(str) {
      var regex = '^' +
      // protocol identifier
      '(?:wss|ws)://' +
      // Host name/IP
      '[^\\s]+' +
      // port number
      '(?::\\d{2,5})?' + '$';

      return new RegExp(regex, 'i').test(str);
    }
  }, {
    key: 'require',
    value: function require(libConst) {
      try {
        switch (libConst) {
          case Util.WEB_RTC:
            return window;
          case Util.WEB_SOCKET:
            return window.WebSocket;
          case Util.TEXT_ENCODING:
            return window;
          case Util.EVENT_SOURCE:
            return window.EventSource;
          case Util.FETCH:
            return window.fetch;
          case Util.CLOSE_EVENT:
            return Util.isBrowser() ? window.CloseEvent : NodeCloseEvent;
          default:
            console.error(libConst + ' is unknown library');
            return undefined;
        }
      } catch (err) {
        console.error(err.message);
        return undefined;
      }
    }
  }, {
    key: 'WEB_RTC',
    get: function get$$1() {
      return 1;
    }
  }, {
    key: 'WEB_SOCKET',
    get: function get$$1() {
      return 2;
    }
  }, {
    key: 'TEXT_ENCODING',
    get: function get$$1() {
      return 3;
    }
  }, {
    key: 'EVENT_SOURCE',
    get: function get$$1() {
      return 4;
    }
  }, {
    key: 'FETCH',
    get: function get$$1() {
      return 5;
    }
  }, {
    key: 'CLOSE_EVENT',
    get: function get$$1() {
      return 6;
    }
  }]);
  return Util;
}();

/**
 * Wrapper class for `RTCDataChannel` and `WebSocket`.
 */
var Channel = function () {
  /**
   * Creates a channel from existing `RTCDataChannel` or `WebSocket`.
   * @param {WebSocket|RTCDataChannel} connection Data channel or web socket
   * @param {WebChannel} wc The `WebChannel` this channel will be part of
   */
  function Channel(connection, wc) {
    classCallCheck(this, Channel);

    /**
     * Data channel or web socket.
     * @private
     * @type {external:WebSocket|external:RTCDataChannel}
     */
    this.connection = connection;

    /**
     * The `WebChannel` which this channel belongs to.
     * @type {WebChannel}
     */
    this.webChannel = wc;

    /**
     * Identifier of the peer who is at the other end of this channel
     * @type {WebChannel}
     */
    this.peerId = -1;

    /**
     * Send message.
     * @type {function(message: ArrayBuffer)}
     */
    this.send = undefined;

    if (Util.isBrowser()) {
      connection.binaryType = 'arraybuffer';
      this.send = this.sendBrowser;
    } else if (Util.isSocket(connection)) {
      this.send = this.sendInNodeThroughSocket;
    } else {
      connection.binaryType = 'arraybuffer';
      this.send = this.sendInNodeThroughDataChannel;
    }
  }

  /**
   * Send message over this channel. The message should be prepared beforhand by
   * the {@link MessageService} (see{@link MessageService#msg},
   * {@link MessageService#handleUserMessage}).
   *
   * @private
   * @param {ArrayBuffer} data Message
   */


  createClass(Channel, [{
    key: 'sendBrowser',
    value: function sendBrowser(data) {
      // if (this.connection.readyState !== 'closed' && new Int8Array(data).length !== 0) {
      if (this.isOpen()) {
        try {
          this.connection.send(data);
        } catch (err) {
          console.error('Channel send: ' + err.message);
        }
      }
    }

    /**
     * @private
     * @param {ArrayBuffer} data
     */

  }, {
    key: 'sendInNodeThroughSocket',
    value: function sendInNodeThroughSocket(data) {
      if (this.isOpen()) {
        try {
          this.connection.send(data, { binary: true });
        } catch (err) {
          console.error('Channel send: ' + err.message);
        }
      }
    }

    /**
     * @private
     * @param {ArrayBuffer} data
     */

  }, {
    key: 'sendInNodeThroughDataChannel',
    value: function sendInNodeThroughDataChannel(data) {
      this.sendBrowser(data.slice(0));
    }

    /**
     * @param {function(msg: ArrayBuffer)} handler
     */

  }, {
    key: 'clearHandlers',


    /**
     */
    value: function clearHandlers() {
      this.onMessage = function () {};
      this.onClose = function () {};
      this.onError = function () {};
    }

    /**
     * @returns {boolean}
     */

  }, {
    key: 'isOpen',
    value: function isOpen() {
      var state = this.connection.readyState;
      return state === 1 || state === 'open';
    }

    /**
     * Close the channel.
     */

  }, {
    key: 'close',
    value: function close() {
      this.connection.close();
    }
  }, {
    key: 'onMessage',
    set: function set$$1(handler) {
      if (!Util.isBrowser() && Util.isSocket(this.connection)) {
        this.connection.onmessage = function (msgEvt) {
          handler(new Uint8Array(msgEvt.data).buffer);
        };
      } else this.connection.onmessage = function (msgEvt) {
        return handler(msgEvt.data);
      };
    }

    /**
     * @param {function(message: CloseEvent)} handler
     */

  }, {
    key: 'onClose',
    set: function set$$1(handler) {
      var _this = this;

      this.connection.onclose = function (closeEvt) {
        if (handler(closeEvt)) {
          _this.webChannel._onPeerLeave(_this.peerId);
        } else {
          handler(closeEvt);
        }
      };
    }

    /**
     * @param {function(message: Event)} handler
     */

  }, {
    key: 'onError',
    set: function set$$1(handler) {
      this.connection.onerror = function (evt) {
        return handler(evt);
      };
    }
  }]);
  return Channel;
}();

var index = asPromise;

/**
 * Callback as used by {@link util.asPromise}.
 * @typedef asPromiseCallback
 * @type {function}
 * @param {Error|null} error Error, if any
 * @param {...*} params Additional arguments
 * @returns {undefined}
 */

/**
 * Returns a promise from a node-style callback function.
 * @memberof util
 * @param {asPromiseCallback} fn Function to call
 * @param {*} ctx Function context
 * @param {...*} params Function arguments
 * @returns {Promise<*>} Promisified function
 */
function asPromise(fn, ctx/*, varargs */) {
    var params  = new Array(arguments.length - 1),
        offset  = 0,
        index   = 2,
        pending = true;
    while (index < arguments.length)
        params[offset++] = arguments[index++];
    return new Promise(function executor(resolve, reject) {
        params[offset] = function callback(err/*, varargs */) {
            if (pending) {
                pending = false;
                if (err)
                    reject(err);
                else {
                    var params = new Array(arguments.length - 1),
                        offset = 0;
                    while (offset < params.length)
                        params[offset++] = arguments[offset];
                    resolve.apply(null, params);
                }
            }
        };
        try {
            fn.apply(ctx || null, params);
        } catch (err) {
            if (pending) {
                pending = false;
                reject(err);
            }
        }
    });
}

var index$2 = createCommonjsModule(function (module, exports) {
"use strict";

/**
 * A minimal base64 implementation for number arrays.
 * @memberof util
 * @namespace
 */
var base64 = exports;

/**
 * Calculates the byte length of a base64 encoded string.
 * @param {string} string Base64 encoded string
 * @returns {number} Byte length
 */
base64.length = function length(string) {
    var p = string.length;
    if (!p)
        return 0;
    var n = 0;
    while (--p % 4 > 1 && string.charAt(p) === "=")
        ++n;
    return Math.ceil(string.length * 3) / 4 - n;
};

// Base64 encoding table
var b64 = new Array(64);

// Base64 decoding table
var s64 = new Array(123);

// 65..90, 97..122, 48..57, 43, 47
for (var i = 0; i < 64;)
    s64[b64[i] = i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i - 59 | 43] = i++;

/**
 * Encodes a buffer to a base64 encoded string.
 * @param {Uint8Array} buffer Source buffer
 * @param {number} start Source start
 * @param {number} end Source end
 * @returns {string} Base64 encoded string
 */
base64.encode = function encode(buffer, start, end) {
    var parts = null,
        chunk = [];
    var i = 0, // output index
        j = 0, // goto index
        t;     // temporary
    while (start < end) {
        var b = buffer[start++];
        switch (j) {
            case 0:
                chunk[i++] = b64[b >> 2];
                t = (b & 3) << 4;
                j = 1;
                break;
            case 1:
                chunk[i++] = b64[t | b >> 4];
                t = (b & 15) << 2;
                j = 2;
                break;
            case 2:
                chunk[i++] = b64[t | b >> 6];
                chunk[i++] = b64[b & 63];
                j = 0;
                break;
        }
        if (i > 8191) {
            (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
            i = 0;
        }
    }
    if (j) {
        chunk[i++] = b64[t];
        chunk[i++] = 61;
        if (j === 1)
            chunk[i++] = 61;
    }
    if (parts) {
        if (i)
            parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
        return parts.join("");
    }
    return String.fromCharCode.apply(String, chunk.slice(0, i));
};

var invalidEncoding = "invalid encoding";

/**
 * Decodes a base64 encoded string to a buffer.
 * @param {string} string Source string
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 * @returns {number} Number of bytes written
 * @throws {Error} If encoding is invalid
 */
base64.decode = function decode(string, buffer, offset) {
    var start = offset;
    var j = 0, // goto index
        t;     // temporary
    for (var i = 0; i < string.length;) {
        var c = string.charCodeAt(i++);
        if (c === 61 && j > 1)
            break;
        if ((c = s64[c]) === undefined)
            throw Error(invalidEncoding);
        switch (j) {
            case 0:
                t = c;
                j = 1;
                break;
            case 1:
                buffer[offset++] = t << 2 | (c & 48) >> 4;
                t = c;
                j = 2;
                break;
            case 2:
                buffer[offset++] = (t & 15) << 4 | (c & 60) >> 2;
                t = c;
                j = 3;
                break;
            case 3:
                buffer[offset++] = (t & 3) << 6 | c;
                j = 0;
                break;
        }
    }
    if (j === 1)
        throw Error(invalidEncoding);
    return offset - start;
};

/**
 * Tests if the specified string appears to be base64 encoded.
 * @param {string} string String to test
 * @returns {boolean} `true` if probably base64 encoded, otherwise false
 */
base64.test = function test(string) {
    return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(string);
};
});

var index$4 = EventEmitter;

/**
 * Constructs a new event emitter instance.
 * @classdesc A minimal event emitter.
 * @memberof util
 * @constructor
 */
function EventEmitter() {

    /**
     * Registered listeners.
     * @type {Object.<string,*>}
     * @private
     */
    this._listeners = {};
}

/**
 * Registers an event listener.
 * @param {string} evt Event name
 * @param {function} fn Listener
 * @param {*} [ctx] Listener context
 * @returns {util.EventEmitter} `this`
 */
EventEmitter.prototype.on = function on(evt, fn, ctx) {
    (this._listeners[evt] || (this._listeners[evt] = [])).push({
        fn  : fn,
        ctx : ctx || this
    });
    return this;
};

/**
 * Removes an event listener or any matching listeners if arguments are omitted.
 * @param {string} [evt] Event name. Removes all listeners if omitted.
 * @param {function} [fn] Listener to remove. Removes all listeners of `evt` if omitted.
 * @returns {util.EventEmitter} `this`
 */
EventEmitter.prototype.off = function off(evt, fn) {
    if (evt === undefined)
        this._listeners = {};
    else {
        if (fn === undefined)
            this._listeners[evt] = [];
        else {
            var listeners = this._listeners[evt];
            for (var i = 0; i < listeners.length;)
                if (listeners[i].fn === fn)
                    listeners.splice(i, 1);
                else
                    ++i;
        }
    }
    return this;
};

/**
 * Emits an event by calling its listeners with the specified arguments.
 * @param {string} evt Event name
 * @param {...*} args Arguments
 * @returns {util.EventEmitter} `this`
 */
EventEmitter.prototype.emit = function emit(evt) {
    var listeners = this._listeners[evt];
    if (listeners) {
        var args = [],
            i = 1;
        for (; i < arguments.length;)
            args.push(arguments[i++]);
        for (i = 0; i < listeners.length;)
            listeners[i].fn.apply(listeners[i++].ctx, args);
    }
    return this;
};

var index$6 = factory(factory);

/**
 * Reads / writes floats / doubles from / to buffers.
 * @name util.float
 * @namespace
 */

/**
 * Writes a 32 bit float to a buffer using little endian byte order.
 * @name util.float.writeFloatLE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Writes a 32 bit float to a buffer using big endian byte order.
 * @name util.float.writeFloatBE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Reads a 32 bit float from a buffer using little endian byte order.
 * @name util.float.readFloatLE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

/**
 * Reads a 32 bit float from a buffer using big endian byte order.
 * @name util.float.readFloatBE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

/**
 * Writes a 64 bit double to a buffer using little endian byte order.
 * @name util.float.writeDoubleLE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Writes a 64 bit double to a buffer using big endian byte order.
 * @name util.float.writeDoubleBE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Reads a 64 bit double from a buffer using little endian byte order.
 * @name util.float.readDoubleLE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

/**
 * Reads a 64 bit double from a buffer using big endian byte order.
 * @name util.float.readDoubleBE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

// Factory function for the purpose of node-based testing in modified global environments
function factory(exports) {

    // float: typed array
    if (typeof Float32Array !== "undefined") (function() {

        var f32 = new Float32Array([ -0 ]),
            f8b = new Uint8Array(f32.buffer),
            le  = f8b[3] === 128;

        function writeFloat_f32_cpy(val, buf, pos) {
            f32[0] = val;
            buf[pos    ] = f8b[0];
            buf[pos + 1] = f8b[1];
            buf[pos + 2] = f8b[2];
            buf[pos + 3] = f8b[3];
        }

        function writeFloat_f32_rev(val, buf, pos) {
            f32[0] = val;
            buf[pos    ] = f8b[3];
            buf[pos + 1] = f8b[2];
            buf[pos + 2] = f8b[1];
            buf[pos + 3] = f8b[0];
        }

        /* istanbul ignore next */
        exports.writeFloatLE = le ? writeFloat_f32_cpy : writeFloat_f32_rev;
        /* istanbul ignore next */
        exports.writeFloatBE = le ? writeFloat_f32_rev : writeFloat_f32_cpy;

        function readFloat_f32_cpy(buf, pos) {
            f8b[0] = buf[pos    ];
            f8b[1] = buf[pos + 1];
            f8b[2] = buf[pos + 2];
            f8b[3] = buf[pos + 3];
            return f32[0];
        }

        function readFloat_f32_rev(buf, pos) {
            f8b[3] = buf[pos    ];
            f8b[2] = buf[pos + 1];
            f8b[1] = buf[pos + 2];
            f8b[0] = buf[pos + 3];
            return f32[0];
        }

        /* istanbul ignore next */
        exports.readFloatLE = le ? readFloat_f32_cpy : readFloat_f32_rev;
        /* istanbul ignore next */
        exports.readFloatBE = le ? readFloat_f32_rev : readFloat_f32_cpy;

    // float: ieee754
    })(); else (function() {

        function writeFloat_ieee754(writeUint, val, buf, pos) {
            var sign = val < 0 ? 1 : 0;
            if (sign)
                val = -val;
            if (val === 0)
                writeUint(1 / val > 0 ? /* positive */ 0 : /* negative 0 */ 2147483648, buf, pos);
            else if (isNaN(val))
                writeUint(2143289344, buf, pos);
            else if (val > 3.4028234663852886e+38) // +-Infinity
                writeUint((sign << 31 | 2139095040) >>> 0, buf, pos);
            else if (val < 1.1754943508222875e-38) // denormal
                writeUint((sign << 31 | Math.round(val / 1.401298464324817e-45)) >>> 0, buf, pos);
            else {
                var exponent = Math.floor(Math.log(val) / Math.LN2),
                    mantissa = Math.round(val * Math.pow(2, -exponent) * 8388608) & 8388607;
                writeUint((sign << 31 | exponent + 127 << 23 | mantissa) >>> 0, buf, pos);
            }
        }

        exports.writeFloatLE = writeFloat_ieee754.bind(null, writeUintLE);
        exports.writeFloatBE = writeFloat_ieee754.bind(null, writeUintBE);

        function readFloat_ieee754(readUint, buf, pos) {
            var uint = readUint(buf, pos),
                sign = (uint >> 31) * 2 + 1,
                exponent = uint >>> 23 & 255,
                mantissa = uint & 8388607;
            return exponent === 255
                ? mantissa
                ? NaN
                : sign * Infinity
                : exponent === 0 // denormal
                ? sign * 1.401298464324817e-45 * mantissa
                : sign * Math.pow(2, exponent - 150) * (mantissa + 8388608);
        }

        exports.readFloatLE = readFloat_ieee754.bind(null, readUintLE);
        exports.readFloatBE = readFloat_ieee754.bind(null, readUintBE);

    })();

    // double: typed array
    if (typeof Float64Array !== "undefined") (function() {

        var f64 = new Float64Array([-0]),
            f8b = new Uint8Array(f64.buffer),
            le  = f8b[7] === 128;

        function writeDouble_f64_cpy(val, buf, pos) {
            f64[0] = val;
            buf[pos    ] = f8b[0];
            buf[pos + 1] = f8b[1];
            buf[pos + 2] = f8b[2];
            buf[pos + 3] = f8b[3];
            buf[pos + 4] = f8b[4];
            buf[pos + 5] = f8b[5];
            buf[pos + 6] = f8b[6];
            buf[pos + 7] = f8b[7];
        }

        function writeDouble_f64_rev(val, buf, pos) {
            f64[0] = val;
            buf[pos    ] = f8b[7];
            buf[pos + 1] = f8b[6];
            buf[pos + 2] = f8b[5];
            buf[pos + 3] = f8b[4];
            buf[pos + 4] = f8b[3];
            buf[pos + 5] = f8b[2];
            buf[pos + 6] = f8b[1];
            buf[pos + 7] = f8b[0];
        }

        /* istanbul ignore next */
        exports.writeDoubleLE = le ? writeDouble_f64_cpy : writeDouble_f64_rev;
        /* istanbul ignore next */
        exports.writeDoubleBE = le ? writeDouble_f64_rev : writeDouble_f64_cpy;

        function readDouble_f64_cpy(buf, pos) {
            f8b[0] = buf[pos    ];
            f8b[1] = buf[pos + 1];
            f8b[2] = buf[pos + 2];
            f8b[3] = buf[pos + 3];
            f8b[4] = buf[pos + 4];
            f8b[5] = buf[pos + 5];
            f8b[6] = buf[pos + 6];
            f8b[7] = buf[pos + 7];
            return f64[0];
        }

        function readDouble_f64_rev(buf, pos) {
            f8b[7] = buf[pos    ];
            f8b[6] = buf[pos + 1];
            f8b[5] = buf[pos + 2];
            f8b[4] = buf[pos + 3];
            f8b[3] = buf[pos + 4];
            f8b[2] = buf[pos + 5];
            f8b[1] = buf[pos + 6];
            f8b[0] = buf[pos + 7];
            return f64[0];
        }

        /* istanbul ignore next */
        exports.readDoubleLE = le ? readDouble_f64_cpy : readDouble_f64_rev;
        /* istanbul ignore next */
        exports.readDoubleBE = le ? readDouble_f64_rev : readDouble_f64_cpy;

    // double: ieee754
    })(); else (function() {

        function writeDouble_ieee754(writeUint, off0, off1, val, buf, pos) {
            var sign = val < 0 ? 1 : 0;
            if (sign)
                val = -val;
            if (val === 0) {
                writeUint(0, buf, pos + off0);
                writeUint(1 / val > 0 ? /* positive */ 0 : /* negative 0 */ 2147483648, buf, pos + off1);
            } else if (isNaN(val)) {
                writeUint(0, buf, pos + off0);
                writeUint(2146959360, buf, pos + off1);
            } else if (val > 1.7976931348623157e+308) { // +-Infinity
                writeUint(0, buf, pos + off0);
                writeUint((sign << 31 | 2146435072) >>> 0, buf, pos + off1);
            } else {
                var mantissa;
                if (val < 2.2250738585072014e-308) { // denormal
                    mantissa = val / 5e-324;
                    writeUint(mantissa >>> 0, buf, pos + off0);
                    writeUint((sign << 31 | mantissa / 4294967296) >>> 0, buf, pos + off1);
                } else {
                    var exponent = Math.floor(Math.log(val) / Math.LN2);
                    if (exponent === 1024)
                        exponent = 1023;
                    mantissa = val * Math.pow(2, -exponent);
                    writeUint(mantissa * 4503599627370496 >>> 0, buf, pos + off0);
                    writeUint((sign << 31 | exponent + 1023 << 20 | mantissa * 1048576 & 1048575) >>> 0, buf, pos + off1);
                }
            }
        }

        exports.writeDoubleLE = writeDouble_ieee754.bind(null, writeUintLE, 0, 4);
        exports.writeDoubleBE = writeDouble_ieee754.bind(null, writeUintBE, 4, 0);

        function readDouble_ieee754(readUint, off0, off1, buf, pos) {
            var lo = readUint(buf, pos + off0),
                hi = readUint(buf, pos + off1);
            var sign = (hi >> 31) * 2 + 1,
                exponent = hi >>> 20 & 2047,
                mantissa = 4294967296 * (hi & 1048575) + lo;
            return exponent === 2047
                ? mantissa
                ? NaN
                : sign * Infinity
                : exponent === 0 // denormal
                ? sign * 5e-324 * mantissa
                : sign * Math.pow(2, exponent - 1075) * (mantissa + 4503599627370496);
        }

        exports.readDoubleLE = readDouble_ieee754.bind(null, readUintLE, 0, 4);
        exports.readDoubleBE = readDouble_ieee754.bind(null, readUintBE, 4, 0);

    })();

    return exports;
}

// uint helpers

function writeUintLE(val, buf, pos) {
    buf[pos    ] =  val        & 255;
    buf[pos + 1] =  val >>> 8  & 255;
    buf[pos + 2] =  val >>> 16 & 255;
    buf[pos + 3] =  val >>> 24;
}

function writeUintBE(val, buf, pos) {
    buf[pos    ] =  val >>> 24;
    buf[pos + 1] =  val >>> 16 & 255;
    buf[pos + 2] =  val >>> 8  & 255;
    buf[pos + 3] =  val        & 255;
}

function readUintLE(buf, pos) {
    return (buf[pos    ]
          | buf[pos + 1] << 8
          | buf[pos + 2] << 16
          | buf[pos + 3] << 24) >>> 0;
}

function readUintBE(buf, pos) {
    return (buf[pos    ] << 24
          | buf[pos + 1] << 16
          | buf[pos + 2] << 8
          | buf[pos + 3]) >>> 0;
}

var index$8 = inquire;

/**
 * Requires a module only if available.
 * @memberof util
 * @param {string} moduleName Module to require
 * @returns {?Object} Required module if available and not empty, otherwise `null`
 */
function inquire(moduleName) {
    try {
        var mod = eval("quire".replace(/^/,"re"))(moduleName); // eslint-disable-line no-eval
        if (mod && (mod.length || Object.keys(mod).length))
            return mod;
    } catch (e) {} // eslint-disable-line no-empty
    return null;
}

var index$10 = createCommonjsModule(function (module, exports) {
"use strict";

/**
 * A minimal UTF8 implementation for number arrays.
 * @memberof util
 * @namespace
 */
var utf8 = exports;

/**
 * Calculates the UTF8 byte length of a string.
 * @param {string} string String
 * @returns {number} Byte length
 */
utf8.length = function utf8_length(string) {
    var len = 0,
        c = 0;
    for (var i = 0; i < string.length; ++i) {
        c = string.charCodeAt(i);
        if (c < 128)
            len += 1;
        else if (c < 2048)
            len += 2;
        else if ((c & 0xFC00) === 0xD800 && (string.charCodeAt(i + 1) & 0xFC00) === 0xDC00) {
            ++i;
            len += 4;
        } else
            len += 3;
    }
    return len;
};

/**
 * Reads UTF8 bytes as a string.
 * @param {Uint8Array} buffer Source buffer
 * @param {number} start Source start
 * @param {number} end Source end
 * @returns {string} String read
 */
utf8.read = function utf8_read(buffer, start, end) {
    var len = end - start;
    if (len < 1)
        return "";
    var parts = null,
        chunk = [],
        i = 0, // char offset
        t;     // temporary
    while (start < end) {
        t = buffer[start++];
        if (t < 128)
            chunk[i++] = t;
        else if (t > 191 && t < 224)
            chunk[i++] = (t & 31) << 6 | buffer[start++] & 63;
        else if (t > 239 && t < 365) {
            t = ((t & 7) << 18 | (buffer[start++] & 63) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63) - 0x10000;
            chunk[i++] = 0xD800 + (t >> 10);
            chunk[i++] = 0xDC00 + (t & 1023);
        } else
            chunk[i++] = (t & 15) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63;
        if (i > 8191) {
            (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
            i = 0;
        }
    }
    if (parts) {
        if (i)
            parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
        return parts.join("");
    }
    return String.fromCharCode.apply(String, chunk.slice(0, i));
};

/**
 * Writes a string as UTF8 bytes.
 * @param {string} string Source string
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 * @returns {number} Bytes written
 */
utf8.write = function utf8_write(string, buffer, offset) {
    var start = offset,
        c1, // character 1
        c2; // character 2
    for (var i = 0; i < string.length; ++i) {
        c1 = string.charCodeAt(i);
        if (c1 < 128) {
            buffer[offset++] = c1;
        } else if (c1 < 2048) {
            buffer[offset++] = c1 >> 6       | 192;
            buffer[offset++] = c1       & 63 | 128;
        } else if ((c1 & 0xFC00) === 0xD800 && ((c2 = string.charCodeAt(i + 1)) & 0xFC00) === 0xDC00) {
            c1 = 0x10000 + ((c1 & 0x03FF) << 10) + (c2 & 0x03FF);
            ++i;
            buffer[offset++] = c1 >> 18      | 240;
            buffer[offset++] = c1 >> 12 & 63 | 128;
            buffer[offset++] = c1 >> 6  & 63 | 128;
            buffer[offset++] = c1       & 63 | 128;
        } else {
            buffer[offset++] = c1 >> 12      | 224;
            buffer[offset++] = c1 >> 6  & 63 | 128;
            buffer[offset++] = c1       & 63 | 128;
        }
    }
    return offset - start;
};
});

var index$12 = pool;

/**
 * An allocator as used by {@link util.pool}.
 * @typedef PoolAllocator
 * @type {function}
 * @param {number} size Buffer size
 * @returns {Uint8Array} Buffer
 */

/**
 * A slicer as used by {@link util.pool}.
 * @typedef PoolSlicer
 * @type {function}
 * @param {number} start Start offset
 * @param {number} end End offset
 * @returns {Uint8Array} Buffer slice
 * @this {Uint8Array}
 */

/**
 * A general purpose buffer pool.
 * @memberof util
 * @function
 * @param {PoolAllocator} alloc Allocator
 * @param {PoolSlicer} slice Slicer
 * @param {number} [size=8192] Slab size
 * @returns {PoolAllocator} Pooled allocator
 */
function pool(alloc, slice, size) {
    var SIZE   = size || 8192;
    var MAX    = SIZE >>> 1;
    var slab   = null;
    var offset = SIZE;
    return function pool_alloc(size) {
        if (size < 1 || size > MAX)
            return alloc(size);
        if (offset + size > SIZE) {
            slab = alloc(SIZE);
            offset = 0;
        }
        var buf = slice.call(slab, offset, offset += size);
        if (offset & 7) // align to 32 bit
            offset = (offset | 7) + 1;
        return buf;
    };
}

var longbits = LongBits$1;



/**
 * Constructs new long bits.
 * @classdesc Helper class for working with the low and high bits of a 64 bit value.
 * @memberof util
 * @constructor
 * @param {number} lo Low 32 bits, unsigned
 * @param {number} hi High 32 bits, unsigned
 */
function LongBits$1(lo, hi) {

    // note that the casts below are theoretically unnecessary as of today, but older statically
    // generated converter code might still call the ctor with signed 32bits. kept for compat.

    /**
     * Low bits.
     * @type {number}
     */
    this.lo = lo >>> 0;

    /**
     * High bits.
     * @type {number}
     */
    this.hi = hi >>> 0;
}

/**
 * Zero bits.
 * @memberof util.LongBits
 * @type {util.LongBits}
 */
var zero = LongBits$1.zero = new LongBits$1(0, 0);

zero.toNumber = function() { return 0; };
zero.zzEncode = zero.zzDecode = function() { return this; };
zero.length = function() { return 1; };

/**
 * Zero hash.
 * @memberof util.LongBits
 * @type {string}
 */
var zeroHash = LongBits$1.zeroHash = "\0\0\0\0\0\0\0\0";

/**
 * Constructs new long bits from the specified number.
 * @param {number} value Value
 * @returns {util.LongBits} Instance
 */
LongBits$1.fromNumber = function fromNumber(value) {
    if (value === 0)
        return zero;
    var sign = value < 0;
    if (sign)
        value = -value;
    var lo = value >>> 0,
        hi = (value - lo) / 4294967296 >>> 0;
    if (sign) {
        hi = ~hi >>> 0;
        lo = ~lo >>> 0;
        if (++lo > 4294967295) {
            lo = 0;
            if (++hi > 4294967295)
                hi = 0;
        }
    }
    return new LongBits$1(lo, hi);
};

/**
 * Constructs new long bits from a number, long or string.
 * @param {Long|number|string} value Value
 * @returns {util.LongBits} Instance
 */
LongBits$1.from = function from(value) {
    if (typeof value === "number")
        return LongBits$1.fromNumber(value);
    if (minimal$2.isString(value)) {
        /* istanbul ignore else */
        if (minimal$2.Long)
            value = minimal$2.Long.fromString(value);
        else
            return LongBits$1.fromNumber(parseInt(value, 10));
    }
    return value.low || value.high ? new LongBits$1(value.low >>> 0, value.high >>> 0) : zero;
};

/**
 * Converts this long bits to a possibly unsafe JavaScript number.
 * @param {boolean} [unsigned=false] Whether unsigned or not
 * @returns {number} Possibly unsafe number
 */
LongBits$1.prototype.toNumber = function toNumber(unsigned) {
    if (!unsigned && this.hi >>> 31) {
        var lo = ~this.lo + 1 >>> 0,
            hi = ~this.hi     >>> 0;
        if (!lo)
            hi = hi + 1 >>> 0;
        return -(lo + hi * 4294967296);
    }
    return this.lo + this.hi * 4294967296;
};

/**
 * Converts this long bits to a long.
 * @param {boolean} [unsigned=false] Whether unsigned or not
 * @returns {Long} Long
 */
LongBits$1.prototype.toLong = function toLong(unsigned) {
    return minimal$2.Long
        ? new minimal$2.Long(this.lo | 0, this.hi | 0, Boolean(unsigned))
        /* istanbul ignore next */
        : { low: this.lo | 0, high: this.hi | 0, unsigned: Boolean(unsigned) };
};

var charCodeAt = String.prototype.charCodeAt;

/**
 * Constructs new long bits from the specified 8 characters long hash.
 * @param {string} hash Hash
 * @returns {util.LongBits} Bits
 */
LongBits$1.fromHash = function fromHash(hash) {
    if (hash === zeroHash)
        return zero;
    return new LongBits$1(
        ( charCodeAt.call(hash, 0)
        | charCodeAt.call(hash, 1) << 8
        | charCodeAt.call(hash, 2) << 16
        | charCodeAt.call(hash, 3) << 24) >>> 0
    ,
        ( charCodeAt.call(hash, 4)
        | charCodeAt.call(hash, 5) << 8
        | charCodeAt.call(hash, 6) << 16
        | charCodeAt.call(hash, 7) << 24) >>> 0
    );
};

/**
 * Converts this long bits to a 8 characters long hash.
 * @returns {string} Hash
 */
LongBits$1.prototype.toHash = function toHash() {
    return String.fromCharCode(
        this.lo        & 255,
        this.lo >>> 8  & 255,
        this.lo >>> 16 & 255,
        this.lo >>> 24      ,
        this.hi        & 255,
        this.hi >>> 8  & 255,
        this.hi >>> 16 & 255,
        this.hi >>> 24
    );
};

/**
 * Zig-zag encodes this long bits.
 * @returns {util.LongBits} `this`
 */
LongBits$1.prototype.zzEncode = function zzEncode() {
    var mask =   this.hi >> 31;
    this.hi  = ((this.hi << 1 | this.lo >>> 31) ^ mask) >>> 0;
    this.lo  = ( this.lo << 1                   ^ mask) >>> 0;
    return this;
};

/**
 * Zig-zag decodes this long bits.
 * @returns {util.LongBits} `this`
 */
LongBits$1.prototype.zzDecode = function zzDecode() {
    var mask = -(this.lo & 1);
    this.lo  = ((this.lo >>> 1 | this.hi << 31) ^ mask) >>> 0;
    this.hi  = ( this.hi >>> 1                  ^ mask) >>> 0;
    return this;
};

/**
 * Calculates the length of this longbits when encoded as a varint.
 * @returns {number} Length
 */
LongBits$1.prototype.length = function length() {
    var part0 =  this.lo,
        part1 = (this.lo >>> 28 | this.hi << 4) >>> 0,
        part2 =  this.hi >>> 24;
    return part2 === 0
         ? part1 === 0
           ? part0 < 16384
             ? part0 < 128 ? 1 : 2
             : part0 < 2097152 ? 3 : 4
           : part1 < 16384
             ? part1 < 128 ? 5 : 6
             : part1 < 2097152 ? 7 : 8
         : part2 < 128 ? 9 : 10;
};

var minimal$2 = createCommonjsModule(function (module, exports) {
"use strict";
var util = exports;

// used to return a Promise where callback is omitted
util.asPromise = index;

// converts to / from base64 encoded strings
util.base64 = index$2;

// base class of rpc.Service
util.EventEmitter = index$4;

// float handling accross browsers
util.float = index$6;

// requires modules optionally and hides the call from bundlers
util.inquire = index$8;

// converts to / from utf8 encoded strings
util.utf8 = index$10;

// provides a node-like buffer pool in the browser
util.pool = index$12;

// utility to work with the low and high bits of a 64 bit value
util.LongBits = longbits;

/**
 * An immuable empty array.
 * @memberof util
 * @type {Array.<*>}
 * @const
 */
util.emptyArray = Object.freeze ? Object.freeze([]) : /* istanbul ignore next */ []; // used on prototypes

/**
 * An immutable empty object.
 * @type {Object}
 * @const
 */
util.emptyObject = Object.freeze ? Object.freeze({}) : /* istanbul ignore next */ {}; // used on prototypes

/**
 * Whether running within node or not.
 * @memberof util
 * @type {boolean}
 * @const
 */
util.isNode = Boolean(commonjsGlobal.process && commonjsGlobal.process.versions && commonjsGlobal.process.versions.node);

/**
 * Tests if the specified value is an integer.
 * @function
 * @param {*} value Value to test
 * @returns {boolean} `true` if the value is an integer
 */
util.isInteger = Number.isInteger || /* istanbul ignore next */ function isInteger(value) {
    return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
};

/**
 * Tests if the specified value is a string.
 * @param {*} value Value to test
 * @returns {boolean} `true` if the value is a string
 */
util.isString = function isString(value) {
    return typeof value === "string" || value instanceof String;
};

/**
 * Tests if the specified value is a non-null object.
 * @param {*} value Value to test
 * @returns {boolean} `true` if the value is a non-null object
 */
util.isObject = function isObject(value) {
    return value && typeof value === "object";
};

/**
 * Checks if a property on a message is considered to be present.
 * This is an alias of {@link util.isSet}.
 * @function
 * @param {Object} obj Plain object or message instance
 * @param {string} prop Property name
 * @returns {boolean} `true` if considered to be present, otherwise `false`
 */
util.isset =

/**
 * Checks if a property on a message is considered to be present.
 * @param {Object} obj Plain object or message instance
 * @param {string} prop Property name
 * @returns {boolean} `true` if considered to be present, otherwise `false`
 */
util.isSet = function isSet(obj, prop) {
    var value = obj[prop];
    if (value != null && obj.hasOwnProperty(prop)) // eslint-disable-line eqeqeq, no-prototype-builtins
        return typeof value !== "object" || (Array.isArray(value) ? value.length : Object.keys(value).length) > 0;
    return false;
};

/**
 * Any compatible Buffer instance.
 * This is a minimal stand-alone definition of a Buffer instance. The actual type is that exported by node's typings.
 * @interface Buffer
 * @extends Uint8Array
 */

/**
 * Node's Buffer class if available.
 * @type {Constructor<Buffer>}
 */
util.Buffer = (function() {
    try {
        var Buffer = util.inquire("buffer").Buffer;
        // refuse to use non-node buffers if not explicitly assigned (perf reasons):
        return Buffer.prototype.utf8Write ? Buffer : /* istanbul ignore next */ null;
    } catch (e) {
        /* istanbul ignore next */
        return null;
    }
})();

// Internal alias of or polyfull for Buffer.from.
util._Buffer_from = null;

// Internal alias of or polyfill for Buffer.allocUnsafe.
util._Buffer_allocUnsafe = null;

/**
 * Creates a new buffer of whatever type supported by the environment.
 * @param {number|number[]} [sizeOrArray=0] Buffer size or number array
 * @returns {Uint8Array|Buffer} Buffer
 */
util.newBuffer = function newBuffer(sizeOrArray) {
    /* istanbul ignore next */
    return typeof sizeOrArray === "number"
        ? util.Buffer
            ? util._Buffer_allocUnsafe(sizeOrArray)
            : new util.Array(sizeOrArray)
        : util.Buffer
            ? util._Buffer_from(sizeOrArray)
            : typeof Uint8Array === "undefined"
                ? sizeOrArray
                : new Uint8Array(sizeOrArray);
};

/**
 * Array implementation used in the browser. `Uint8Array` if supported, otherwise `Array`.
 * @type {Constructor<Uint8Array>}
 */
util.Array = typeof Uint8Array !== "undefined" ? Uint8Array /* istanbul ignore next */ : Array;

/**
 * Any compatible Long instance.
 * This is a minimal stand-alone definition of a Long instance. The actual type is that exported by long.js.
 * @interface Long
 * @property {number} low Low bits
 * @property {number} high High bits
 * @property {boolean} unsigned Whether unsigned or not
 */

/**
 * Long.js's Long class if available.
 * @type {Constructor<Long>}
 */
util.Long = /* istanbul ignore next */ commonjsGlobal.dcodeIO && /* istanbul ignore next */ commonjsGlobal.dcodeIO.Long || util.inquire("long");

/**
 * Regular expression used to verify 2 bit (`bool`) map keys.
 * @type {RegExp}
 * @const
 */
util.key2Re = /^true|false|0|1$/;

/**
 * Regular expression used to verify 32 bit (`int32` etc.) map keys.
 * @type {RegExp}
 * @const
 */
util.key32Re = /^-?(?:0|[1-9][0-9]*)$/;

/**
 * Regular expression used to verify 64 bit (`int64` etc.) map keys.
 * @type {RegExp}
 * @const
 */
util.key64Re = /^(?:[\\x00-\\xff]{8}|-?(?:0|[1-9][0-9]*))$/;

/**
 * Converts a number or long to an 8 characters long hash string.
 * @param {Long|number} value Value to convert
 * @returns {string} Hash
 */
util.longToHash = function longToHash(value) {
    return value
        ? util.LongBits.from(value).toHash()
        : util.LongBits.zeroHash;
};

/**
 * Converts an 8 characters long hash string to a long or number.
 * @param {string} hash Hash
 * @param {boolean} [unsigned=false] Whether unsigned or not
 * @returns {Long|number} Original value
 */
util.longFromHash = function longFromHash(hash, unsigned) {
    var bits = util.LongBits.fromHash(hash);
    if (util.Long)
        return util.Long.fromBits(bits.lo, bits.hi, unsigned);
    return bits.toNumber(Boolean(unsigned));
};

/**
 * Merges the properties of the source object into the destination object.
 * @memberof util
 * @param {Object.<string,*>} dst Destination object
 * @param {Object.<string,*>} src Source object
 * @param {boolean} [ifNotSet=false] Merges only if the key is not already set
 * @returns {Object.<string,*>} Destination object
 */
function merge(dst, src, ifNotSet) { // used by converters
    for (var keys = Object.keys(src), i = 0; i < keys.length; ++i)
        if (dst[keys[i]] === undefined || !ifNotSet)
            dst[keys[i]] = src[keys[i]];
    return dst;
}

util.merge = merge;

/**
 * Converts the first character of a string to lower case.
 * @param {string} str String to convert
 * @returns {string} Converted string
 */
util.lcFirst = function lcFirst(str) {
    return str.charAt(0).toLowerCase() + str.substring(1);
};

/**
 * Creates a custom error constructor.
 * @memberof util
 * @param {string} name Error name
 * @returns {Constructor<Error>} Custom error constructor
 */
function newError(name) {

    function CustomError(message, properties) {

        if (!(this instanceof CustomError))
            return new CustomError(message, properties);

        // Error.call(this, message);
        // ^ just returns a new error instance because the ctor can be called as a function

        Object.defineProperty(this, "message", { get: function() { return message; } });

        /* istanbul ignore next */
        if (Error.captureStackTrace) // node
            Error.captureStackTrace(this, CustomError);
        else
            Object.defineProperty(this, "stack", { value: (new Error()).stack || "" });

        if (properties)
            merge(this, properties);
    }

    (CustomError.prototype = Object.create(Error.prototype)).constructor = CustomError;

    Object.defineProperty(CustomError.prototype, "name", { get: function() { return name; } });

    CustomError.prototype.toString = function toString() {
        return this.name + ": " + this.message;
    };

    return CustomError;
}

util.newError = newError;

/**
 * Constructs a new protocol error.
 * @classdesc Error subclass indicating a protocol specifc error.
 * @memberof util
 * @extends Error
 * @template T extends Message<T>
 * @constructor
 * @param {string} message Error message
 * @param {Object.<string,*>} [properties] Additional properties
 * @example
 * try {
 *     MyMessage.decode(someBuffer); // throws if required fields are missing
 * } catch (e) {
 *     if (e instanceof ProtocolError && e.instance)
 *         console.log("decoded so far: " + JSON.stringify(e.instance));
 * }
 */
util.ProtocolError = newError("ProtocolError");

/**
 * So far decoded message instance.
 * @name util.ProtocolError#instance
 * @type {Message<T>}
 */

/**
 * A OneOf getter as returned by {@link util.oneOfGetter}.
 * @typedef OneOfGetter
 * @type {function}
 * @returns {string|undefined} Set field name, if any
 */

/**
 * Builds a getter for a oneof's present field name.
 * @param {string[]} fieldNames Field names
 * @returns {OneOfGetter} Unbound getter
 */
util.oneOfGetter = function getOneOf(fieldNames) {
    var fieldMap = {};
    for (var i = 0; i < fieldNames.length; ++i)
        fieldMap[fieldNames[i]] = 1;

    /**
     * @returns {string|undefined} Set field name, if any
     * @this Object
     * @ignore
     */
    return function() { // eslint-disable-line consistent-return
        for (var keys = Object.keys(this), i = keys.length - 1; i > -1; --i)
            if (fieldMap[keys[i]] === 1 && this[keys[i]] !== undefined && this[keys[i]] !== null)
                return keys[i];
    };
};

/**
 * A OneOf setter as returned by {@link util.oneOfSetter}.
 * @typedef OneOfSetter
 * @type {function}
 * @param {string|undefined} value Field name
 * @returns {undefined}
 */

/**
 * Builds a setter for a oneof's present field name.
 * @param {string[]} fieldNames Field names
 * @returns {OneOfSetter} Unbound setter
 */
util.oneOfSetter = function setOneOf(fieldNames) {

    /**
     * @param {string} name Field name
     * @returns {undefined}
     * @this Object
     * @ignore
     */
    return function(name) {
        for (var i = 0; i < fieldNames.length; ++i)
            if (fieldNames[i] !== name)
                delete this[fieldNames[i]];
    };
};

/**
 * Default conversion options used for {@link Message#toJSON} implementations.
 *
 * These options are close to proto3's JSON mapping with the exception that internal types like Any are handled just like messages. More precisely:
 *
 * - Longs become strings
 * - Enums become string keys
 * - Bytes become base64 encoded strings
 * - (Sub-)Messages become plain objects
 * - Maps become plain objects with all string keys
 * - Repeated fields become arrays
 * - NaN and Infinity for float and double fields become strings
 *
 * @type {IConversionOptions}
 * @see https://developers.google.com/protocol-buffers/docs/proto3?hl=en#json
 */
util.toJSONOptions = {
    longs: String,
    enums: String,
    bytes: String,
    json: true
};

util._configure = function() {
    var Buffer = util.Buffer;
    /* istanbul ignore if */
    if (!Buffer) {
        util._Buffer_from = util._Buffer_allocUnsafe = null;
        return;
    }
    // because node 4.x buffers are incompatible & immutable
    // see: https://github.com/dcodeIO/protobuf.js/pull/665
    util._Buffer_from = Buffer.from !== Uint8Array.from && Buffer.from ||
        /* istanbul ignore next */
        function Buffer_from(value, encoding) {
            return new Buffer(value, encoding);
        };
    util._Buffer_allocUnsafe = Buffer.allocUnsafe ||
        /* istanbul ignore next */
        function Buffer_allocUnsafe(size) {
            return new Buffer(size);
        };
};
});

var writer = Writer;



var BufferWriter; // cyclic

var LongBits  = minimal$2.LongBits;
var base64    = minimal$2.base64;
var utf8      = minimal$2.utf8;

/**
 * Constructs a new writer operation instance.
 * @classdesc Scheduled writer operation.
 * @constructor
 * @param {function(*, Uint8Array, number)} fn Function to call
 * @param {number} len Value byte length
 * @param {*} val Value to write
 * @ignore
 */
function Op(fn, len, val) {

    /**
     * Function to call.
     * @type {function(Uint8Array, number, *)}
     */
    this.fn = fn;

    /**
     * Value byte length.
     * @type {number}
     */
    this.len = len;

    /**
     * Next operation.
     * @type {Writer.Op|undefined}
     */
    this.next = undefined;

    /**
     * Value to write.
     * @type {*}
     */
    this.val = val; // type varies
}

/* istanbul ignore next */
function noop() {} // eslint-disable-line no-empty-function

/**
 * Constructs a new writer state instance.
 * @classdesc Copied writer state.
 * @memberof Writer
 * @constructor
 * @param {Writer} writer Writer to copy state from
 * @ignore
 */
function State(writer) {

    /**
     * Current head.
     * @type {Writer.Op}
     */
    this.head = writer.head;

    /**
     * Current tail.
     * @type {Writer.Op}
     */
    this.tail = writer.tail;

    /**
     * Current buffer length.
     * @type {number}
     */
    this.len = writer.len;

    /**
     * Next state.
     * @type {State|null}
     */
    this.next = writer.states;
}

/**
 * Constructs a new writer instance.
 * @classdesc Wire format writer using `Uint8Array` if available, otherwise `Array`.
 * @constructor
 */
function Writer() {

    /**
     * Current length.
     * @type {number}
     */
    this.len = 0;

    /**
     * Operations head.
     * @type {Object}
     */
    this.head = new Op(noop, 0, 0);

    /**
     * Operations tail
     * @type {Object}
     */
    this.tail = this.head;

    /**
     * Linked forked states.
     * @type {Object|null}
     */
    this.states = null;

    // When a value is written, the writer calculates its byte length and puts it into a linked
    // list of operations to perform when finish() is called. This both allows us to allocate
    // buffers of the exact required size and reduces the amount of work we have to do compared
    // to first calculating over objects and then encoding over objects. In our case, the encoding
    // part is just a linked list walk calling operations with already prepared values.
}

/**
 * Creates a new writer.
 * @function
 * @returns {BufferWriter|Writer} A {@link BufferWriter} when Buffers are supported, otherwise a {@link Writer}
 */
Writer.create = minimal$2.Buffer
    ? function create_buffer_setup() {
        return (Writer.create = function create_buffer() {
            return new BufferWriter();
        })();
    }
    /* istanbul ignore next */
    : function create_array() {
        return new Writer();
    };

/**
 * Allocates a buffer of the specified size.
 * @param {number} size Buffer size
 * @returns {Uint8Array} Buffer
 */
Writer.alloc = function alloc(size) {
    return new minimal$2.Array(size);
};

// Use Uint8Array buffer pool in the browser, just like node does with buffers
/* istanbul ignore else */
if (minimal$2.Array !== Array)
    Writer.alloc = minimal$2.pool(Writer.alloc, minimal$2.Array.prototype.subarray);

/**
 * Pushes a new operation to the queue.
 * @param {function(Uint8Array, number, *)} fn Function to call
 * @param {number} len Value byte length
 * @param {number} val Value to write
 * @returns {Writer} `this`
 * @private
 */
Writer.prototype._push = function push(fn, len, val) {
    this.tail = this.tail.next = new Op(fn, len, val);
    this.len += len;
    return this;
};

function writeByte(val, buf, pos) {
    buf[pos] = val & 255;
}

function writeVarint32(val, buf, pos) {
    while (val > 127) {
        buf[pos++] = val & 127 | 128;
        val >>>= 7;
    }
    buf[pos] = val;
}

/**
 * Constructs a new varint writer operation instance.
 * @classdesc Scheduled varint writer operation.
 * @extends Op
 * @constructor
 * @param {number} len Value byte length
 * @param {number} val Value to write
 * @ignore
 */
function VarintOp(len, val) {
    this.len = len;
    this.next = undefined;
    this.val = val;
}

VarintOp.prototype = Object.create(Op.prototype);
VarintOp.prototype.fn = writeVarint32;

/**
 * Writes an unsigned 32 bit value as a varint.
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.uint32 = function write_uint32(value) {
    // here, the call to this.push has been inlined and a varint specific Op subclass is used.
    // uint32 is by far the most frequently used operation and benefits significantly from this.
    this.len += (this.tail = this.tail.next = new VarintOp(
        (value = value >>> 0)
                < 128       ? 1
        : value < 16384     ? 2
        : value < 2097152   ? 3
        : value < 268435456 ? 4
        :                     5,
    value)).len;
    return this;
};

/**
 * Writes a signed 32 bit value as a varint.
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.int32 = function write_int32(value) {
    return value < 0
        ? this._push(writeVarint64, 10, LongBits.fromNumber(value)) // 10 bytes per spec
        : this.uint32(value);
};

/**
 * Writes a 32 bit value as a varint, zig-zag encoded.
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.sint32 = function write_sint32(value) {
    return this.uint32((value << 1 ^ value >> 31) >>> 0);
};

function writeVarint64(val, buf, pos) {
    while (val.hi) {
        buf[pos++] = val.lo & 127 | 128;
        val.lo = (val.lo >>> 7 | val.hi << 25) >>> 0;
        val.hi >>>= 7;
    }
    while (val.lo > 127) {
        buf[pos++] = val.lo & 127 | 128;
        val.lo = val.lo >>> 7;
    }
    buf[pos++] = val.lo;
}

/**
 * Writes an unsigned 64 bit value as a varint.
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.uint64 = function write_uint64(value) {
    var bits = LongBits.from(value);
    return this._push(writeVarint64, bits.length(), bits);
};

/**
 * Writes a signed 64 bit value as a varint.
 * @function
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.int64 = Writer.prototype.uint64;

/**
 * Writes a signed 64 bit value as a varint, zig-zag encoded.
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.sint64 = function write_sint64(value) {
    var bits = LongBits.from(value).zzEncode();
    return this._push(writeVarint64, bits.length(), bits);
};

/**
 * Writes a boolish value as a varint.
 * @param {boolean} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.bool = function write_bool(value) {
    return this._push(writeByte, 1, value ? 1 : 0);
};

function writeFixed32(val, buf, pos) {
    buf[pos    ] =  val         & 255;
    buf[pos + 1] =  val >>> 8   & 255;
    buf[pos + 2] =  val >>> 16  & 255;
    buf[pos + 3] =  val >>> 24;
}

/**
 * Writes an unsigned 32 bit value as fixed 32 bits.
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.fixed32 = function write_fixed32(value) {
    return this._push(writeFixed32, 4, value >>> 0);
};

/**
 * Writes a signed 32 bit value as fixed 32 bits.
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.sfixed32 = Writer.prototype.fixed32;

/**
 * Writes an unsigned 64 bit value as fixed 64 bits.
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.fixed64 = function write_fixed64(value) {
    var bits = LongBits.from(value);
    return this._push(writeFixed32, 4, bits.lo)._push(writeFixed32, 4, bits.hi);
};

/**
 * Writes a signed 64 bit value as fixed 64 bits.
 * @function
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.sfixed64 = Writer.prototype.fixed64;

/**
 * Writes a float (32 bit).
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.float = function write_float(value) {
    return this._push(minimal$2.float.writeFloatLE, 4, value);
};

/**
 * Writes a double (64 bit float).
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.double = function write_double(value) {
    return this._push(minimal$2.float.writeDoubleLE, 8, value);
};

var writeBytes = minimal$2.Array.prototype.set
    ? function writeBytes_set(val, buf, pos) {
        buf.set(val, pos); // also works for plain array values
    }
    /* istanbul ignore next */
    : function writeBytes_for(val, buf, pos) {
        for (var i = 0; i < val.length; ++i)
            buf[pos + i] = val[i];
    };

/**
 * Writes a sequence of bytes.
 * @param {Uint8Array|string} value Buffer or base64 encoded string to write
 * @returns {Writer} `this`
 */
Writer.prototype.bytes = function write_bytes(value) {
    var len = value.length >>> 0;
    if (!len)
        return this._push(writeByte, 1, 0);
    if (minimal$2.isString(value)) {
        var buf = Writer.alloc(len = base64.length(value));
        base64.decode(value, buf, 0);
        value = buf;
    }
    return this.uint32(len)._push(writeBytes, len, value);
};

/**
 * Writes a string.
 * @param {string} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.string = function write_string(value) {
    var len = utf8.length(value);
    return len
        ? this.uint32(len)._push(utf8.write, len, value)
        : this._push(writeByte, 1, 0);
};

/**
 * Forks this writer's state by pushing it to a stack.
 * Calling {@link Writer#reset|reset} or {@link Writer#ldelim|ldelim} resets the writer to the previous state.
 * @returns {Writer} `this`
 */
Writer.prototype.fork = function fork() {
    this.states = new State(this);
    this.head = this.tail = new Op(noop, 0, 0);
    this.len = 0;
    return this;
};

/**
 * Resets this instance to the last state.
 * @returns {Writer} `this`
 */
Writer.prototype.reset = function reset() {
    if (this.states) {
        this.head   = this.states.head;
        this.tail   = this.states.tail;
        this.len    = this.states.len;
        this.states = this.states.next;
    } else {
        this.head = this.tail = new Op(noop, 0, 0);
        this.len  = 0;
    }
    return this;
};

/**
 * Resets to the last state and appends the fork state's current write length as a varint followed by its operations.
 * @returns {Writer} `this`
 */
Writer.prototype.ldelim = function ldelim() {
    var head = this.head,
        tail = this.tail,
        len  = this.len;
    this.reset().uint32(len);
    if (len) {
        this.tail.next = head.next; // skip noop
        this.tail = tail;
        this.len += len;
    }
    return this;
};

/**
 * Finishes the write operation.
 * @returns {Uint8Array} Finished buffer
 */
Writer.prototype.finish = function finish() {
    var head = this.head.next, // skip noop
        buf  = this.constructor.alloc(this.len),
        pos  = 0;
    while (head) {
        head.fn(head.val, buf, pos);
        pos += head.len;
        head = head.next;
    }
    // this.head = this.tail = null;
    return buf;
};

Writer._configure = function(BufferWriter_) {
    BufferWriter = BufferWriter_;
};

var writer_buffer = BufferWriter$1;

// extends Writer

(BufferWriter$1.prototype = Object.create(writer.prototype)).constructor = BufferWriter$1;



var Buffer = minimal$2.Buffer;

/**
 * Constructs a new buffer writer instance.
 * @classdesc Wire format writer using node buffers.
 * @extends Writer
 * @constructor
 */
function BufferWriter$1() {
    writer.call(this);
}

/**
 * Allocates a buffer of the specified size.
 * @param {number} size Buffer size
 * @returns {Buffer} Buffer
 */
BufferWriter$1.alloc = function alloc_buffer(size) {
    return (BufferWriter$1.alloc = minimal$2._Buffer_allocUnsafe)(size);
};

var writeBytesBuffer = Buffer && Buffer.prototype instanceof Uint8Array && Buffer.prototype.set.name === "set"
    ? function writeBytesBuffer_set(val, buf, pos) {
        buf.set(val, pos); // faster than copy (requires node >= 4 where Buffers extend Uint8Array and set is properly inherited)
                           // also works for plain array values
    }
    /* istanbul ignore next */
    : function writeBytesBuffer_copy(val, buf, pos) {
        if (val.copy) // Buffer values
            val.copy(buf, pos, 0, val.length);
        else for (var i = 0; i < val.length;) // plain array values
            buf[pos++] = val[i++];
    };

/**
 * @override
 */
BufferWriter$1.prototype.bytes = function write_bytes_buffer(value) {
    if (minimal$2.isString(value))
        value = minimal$2._Buffer_from(value, "base64");
    var len = value.length >>> 0;
    this.uint32(len);
    if (len)
        this._push(writeBytesBuffer, len, value);
    return this;
};

function writeStringBuffer(val, buf, pos) {
    if (val.length < 40) // plain js is faster for short strings (probably due to redundant assertions)
        minimal$2.utf8.write(val, buf, pos);
    else
        buf.utf8Write(val, pos);
}

/**
 * @override
 */
BufferWriter$1.prototype.string = function write_string_buffer(value) {
    var len = Buffer.byteLength(value);
    this.uint32(len);
    if (len)
        this._push(writeStringBuffer, len, value);
    return this;
};


/**
 * Finishes the write operation.
 * @name BufferWriter#finish
 * @function
 * @returns {Buffer} Finished buffer
 */

var reader = Reader;



var BufferReader; // cyclic

var LongBits$2  = minimal$2.LongBits;
var utf8$1      = minimal$2.utf8;

/* istanbul ignore next */
function indexOutOfRange(reader, writeLength) {
    return RangeError("index out of range: " + reader.pos + " + " + (writeLength || 1) + " > " + reader.len);
}

/**
 * Constructs a new reader instance using the specified buffer.
 * @classdesc Wire format reader using `Uint8Array` if available, otherwise `Array`.
 * @constructor
 * @param {Uint8Array} buffer Buffer to read from
 */
function Reader(buffer) {

    /**
     * Read buffer.
     * @type {Uint8Array}
     */
    this.buf = buffer;

    /**
     * Read buffer position.
     * @type {number}
     */
    this.pos = 0;

    /**
     * Read buffer length.
     * @type {number}
     */
    this.len = buffer.length;
}

var create_array = typeof Uint8Array !== "undefined"
    ? function create_typed_array(buffer) {
        if (buffer instanceof Uint8Array || Array.isArray(buffer))
            return new Reader(buffer);
        throw Error("illegal buffer");
    }
    /* istanbul ignore next */
    : function create_array(buffer) {
        if (Array.isArray(buffer))
            return new Reader(buffer);
        throw Error("illegal buffer");
    };

/**
 * Creates a new reader using the specified buffer.
 * @function
 * @param {Uint8Array|Buffer} buffer Buffer to read from
 * @returns {Reader|BufferReader} A {@link BufferReader} if `buffer` is a Buffer, otherwise a {@link Reader}
 * @throws {Error} If `buffer` is not a valid buffer
 */
Reader.create = minimal$2.Buffer
    ? function create_buffer_setup(buffer) {
        return (Reader.create = function create_buffer(buffer) {
            return minimal$2.Buffer.isBuffer(buffer)
                ? new BufferReader(buffer)
                /* istanbul ignore next */
                : create_array(buffer);
        })(buffer);
    }
    /* istanbul ignore next */
    : create_array;

Reader.prototype._slice = minimal$2.Array.prototype.subarray || /* istanbul ignore next */ minimal$2.Array.prototype.slice;

/**
 * Reads a varint as an unsigned 32 bit value.
 * @function
 * @returns {number} Value read
 */
Reader.prototype.uint32 = (function read_uint32_setup() {
    var value = 4294967295; // optimizer type-hint, tends to deopt otherwise (?!)
    return function read_uint32() {
        value = (         this.buf[this.pos] & 127       ) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) <<  7) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) << 14) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) << 21) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] &  15) << 28) >>> 0; if (this.buf[this.pos++] < 128) return value;

        /* istanbul ignore if */
        if ((this.pos += 5) > this.len) {
            this.pos = this.len;
            throw indexOutOfRange(this, 10);
        }
        return value;
    };
})();

/**
 * Reads a varint as a signed 32 bit value.
 * @returns {number} Value read
 */
Reader.prototype.int32 = function read_int32() {
    return this.uint32() | 0;
};

/**
 * Reads a zig-zag encoded varint as a signed 32 bit value.
 * @returns {number} Value read
 */
Reader.prototype.sint32 = function read_sint32() {
    var value = this.uint32();
    return value >>> 1 ^ -(value & 1) | 0;
};

/* eslint-disable no-invalid-this */

function readLongVarint() {
    // tends to deopt with local vars for octet etc.
    var bits = new LongBits$2(0, 0);
    var i = 0;
    if (this.len - this.pos > 4) { // fast route (lo)
        for (; i < 4; ++i) {
            // 1st..4th
            bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
        // 5th
        bits.lo = (bits.lo | (this.buf[this.pos] & 127) << 28) >>> 0;
        bits.hi = (bits.hi | (this.buf[this.pos] & 127) >>  4) >>> 0;
        if (this.buf[this.pos++] < 128)
            return bits;
        i = 0;
    } else {
        for (; i < 3; ++i) {
            /* istanbul ignore if */
            if (this.pos >= this.len)
                throw indexOutOfRange(this);
            // 1st..3th
            bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
        // 4th
        bits.lo = (bits.lo | (this.buf[this.pos++] & 127) << i * 7) >>> 0;
        return bits;
    }
    if (this.len - this.pos > 4) { // fast route (hi)
        for (; i < 5; ++i) {
            // 6th..10th
            bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
    } else {
        for (; i < 5; ++i) {
            /* istanbul ignore if */
            if (this.pos >= this.len)
                throw indexOutOfRange(this);
            // 6th..10th
            bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
    }
    /* istanbul ignore next */
    throw Error("invalid varint encoding");
}

/* eslint-enable no-invalid-this */

/**
 * Reads a varint as a signed 64 bit value.
 * @name Reader#int64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a varint as an unsigned 64 bit value.
 * @name Reader#uint64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a zig-zag encoded varint as a signed 64 bit value.
 * @name Reader#sint64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a varint as a boolean.
 * @returns {boolean} Value read
 */
Reader.prototype.bool = function read_bool() {
    return this.uint32() !== 0;
};

function readFixed32_end(buf, end) { // note that this uses `end`, not `pos`
    return (buf[end - 4]
          | buf[end - 3] << 8
          | buf[end - 2] << 16
          | buf[end - 1] << 24) >>> 0;
}

/**
 * Reads fixed 32 bits as an unsigned 32 bit integer.
 * @returns {number} Value read
 */
Reader.prototype.fixed32 = function read_fixed32() {

    /* istanbul ignore if */
    if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);

    return readFixed32_end(this.buf, this.pos += 4);
};

/**
 * Reads fixed 32 bits as a signed 32 bit integer.
 * @returns {number} Value read
 */
Reader.prototype.sfixed32 = function read_sfixed32() {

    /* istanbul ignore if */
    if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);

    return readFixed32_end(this.buf, this.pos += 4) | 0;
};

/* eslint-disable no-invalid-this */

function readFixed64(/* this: Reader */) {

    /* istanbul ignore if */
    if (this.pos + 8 > this.len)
        throw indexOutOfRange(this, 8);

    return new LongBits$2(readFixed32_end(this.buf, this.pos += 4), readFixed32_end(this.buf, this.pos += 4));
}

/* eslint-enable no-invalid-this */

/**
 * Reads fixed 64 bits.
 * @name Reader#fixed64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads zig-zag encoded fixed 64 bits.
 * @name Reader#sfixed64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a float (32 bit) as a number.
 * @function
 * @returns {number} Value read
 */
Reader.prototype.float = function read_float() {

    /* istanbul ignore if */
    if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);

    var value = minimal$2.float.readFloatLE(this.buf, this.pos);
    this.pos += 4;
    return value;
};

/**
 * Reads a double (64 bit float) as a number.
 * @function
 * @returns {number} Value read
 */
Reader.prototype.double = function read_double() {

    /* istanbul ignore if */
    if (this.pos + 8 > this.len)
        throw indexOutOfRange(this, 4);

    var value = minimal$2.float.readDoubleLE(this.buf, this.pos);
    this.pos += 8;
    return value;
};

/**
 * Reads a sequence of bytes preceeded by its length as a varint.
 * @returns {Uint8Array} Value read
 */
Reader.prototype.bytes = function read_bytes() {
    var length = this.uint32(),
        start  = this.pos,
        end    = this.pos + length;

    /* istanbul ignore if */
    if (end > this.len)
        throw indexOutOfRange(this, length);

    this.pos += length;
    if (Array.isArray(this.buf)) // plain array
        return this.buf.slice(start, end);
    return start === end // fix for IE 10/Win8 and others' subarray returning array of size 1
        ? new this.buf.constructor(0)
        : this._slice.call(this.buf, start, end);
};

/**
 * Reads a string preceeded by its byte length as a varint.
 * @returns {string} Value read
 */
Reader.prototype.string = function read_string() {
    var bytes = this.bytes();
    return utf8$1.read(bytes, 0, bytes.length);
};

/**
 * Skips the specified number of bytes if specified, otherwise skips a varint.
 * @param {number} [length] Length if known, otherwise a varint is assumed
 * @returns {Reader} `this`
 */
Reader.prototype.skip = function skip(length) {
    if (typeof length === "number") {
        /* istanbul ignore if */
        if (this.pos + length > this.len)
            throw indexOutOfRange(this, length);
        this.pos += length;
    } else {
        do {
            /* istanbul ignore if */
            if (this.pos >= this.len)
                throw indexOutOfRange(this);
        } while (this.buf[this.pos++] & 128);
    }
    return this;
};

/**
 * Skips the next element of the specified wire type.
 * @param {number} wireType Wire type received
 * @returns {Reader} `this`
 */
Reader.prototype.skipType = function(wireType) {
    switch (wireType) {
        case 0:
            this.skip();
            break;
        case 1:
            this.skip(8);
            break;
        case 2:
            this.skip(this.uint32());
            break;
        case 3:
            do { // eslint-disable-line no-constant-condition
                if ((wireType = this.uint32() & 7) === 4)
                    break;
                this.skipType(wireType);
            } while (true);
            break;
        case 5:
            this.skip(4);
            break;

        /* istanbul ignore next */
        default:
            throw Error("invalid wire type " + wireType + " at offset " + this.pos);
    }
    return this;
};

Reader._configure = function(BufferReader_) {
    BufferReader = BufferReader_;

    var fn = minimal$2.Long ? "toLong" : /* istanbul ignore next */ "toNumber";
    minimal$2.merge(Reader.prototype, {

        int64: function read_int64() {
            return readLongVarint.call(this)[fn](false);
        },

        uint64: function read_uint64() {
            return readLongVarint.call(this)[fn](true);
        },

        sint64: function read_sint64() {
            return readLongVarint.call(this).zzDecode()[fn](false);
        },

        fixed64: function read_fixed64() {
            return readFixed64.call(this)[fn](true);
        },

        sfixed64: function read_sfixed64() {
            return readFixed64.call(this)[fn](false);
        }

    });
};

var reader_buffer = BufferReader$1;

// extends Reader

(BufferReader$1.prototype = Object.create(reader.prototype)).constructor = BufferReader$1;



/**
 * Constructs a new buffer reader instance.
 * @classdesc Wire format reader using node buffers.
 * @extends Reader
 * @constructor
 * @param {Buffer} buffer Buffer to read from
 */
function BufferReader$1(buffer) {
    reader.call(this, buffer);

    /**
     * Read buffer.
     * @name BufferReader#buf
     * @type {Buffer}
     */
}

/* istanbul ignore else */
if (minimal$2.Buffer)
    BufferReader$1.prototype._slice = minimal$2.Buffer.prototype.slice;

/**
 * @override
 */
BufferReader$1.prototype.string = function read_string_buffer() {
    var len = this.uint32(); // modifies pos
    return this.buf.utf8Slice(this.pos, this.pos = Math.min(this.pos + len, this.len));
};

/**
 * Reads a sequence of bytes preceeded by its length as a varint.
 * @name BufferReader#bytes
 * @function
 * @returns {Buffer} Value read
 */

var service = Service;



// Extends EventEmitter
(Service.prototype = Object.create(minimal$2.EventEmitter.prototype)).constructor = Service;

/**
 * A service method callback as used by {@link rpc.ServiceMethod|ServiceMethod}.
 *
 * Differs from {@link RPCImplCallback} in that it is an actual callback of a service method which may not return `response = null`.
 * @typedef rpc.ServiceMethodCallback
 * @template TRes extends Message<TRes>
 * @type {function}
 * @param {Error|null} error Error, if any
 * @param {TRes} [response] Response message
 * @returns {undefined}
 */

/**
 * A service method part of a {@link rpc.Service} as created by {@link Service.create}.
 * @typedef rpc.ServiceMethod
 * @template TReq extends Message<TReq>
 * @template TRes extends Message<TRes>
 * @type {function}
 * @param {TReq|Properties<TReq>} request Request message or plain object
 * @param {rpc.ServiceMethodCallback<TRes>} [callback] Node-style callback called with the error, if any, and the response message
 * @returns {Promise<Message<TRes>>} Promise if `callback` has been omitted, otherwise `undefined`
 */

/**
 * Constructs a new RPC service instance.
 * @classdesc An RPC service as returned by {@link Service#create}.
 * @exports rpc.Service
 * @extends util.EventEmitter
 * @constructor
 * @param {RPCImpl} rpcImpl RPC implementation
 * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
 * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
 */
function Service(rpcImpl, requestDelimited, responseDelimited) {

    if (typeof rpcImpl !== "function")
        throw TypeError("rpcImpl must be a function");

    minimal$2.EventEmitter.call(this);

    /**
     * RPC implementation. Becomes `null` once the service is ended.
     * @type {RPCImpl|null}
     */
    this.rpcImpl = rpcImpl;

    /**
     * Whether requests are length-delimited.
     * @type {boolean}
     */
    this.requestDelimited = Boolean(requestDelimited);

    /**
     * Whether responses are length-delimited.
     * @type {boolean}
     */
    this.responseDelimited = Boolean(responseDelimited);
}

/**
 * Calls a service method through {@link rpc.Service#rpcImpl|rpcImpl}.
 * @param {Method|rpc.ServiceMethod<TReq,TRes>} method Reflected or static method
 * @param {Constructor<TReq>} requestCtor Request constructor
 * @param {Constructor<TRes>} responseCtor Response constructor
 * @param {TReq|Properties<TReq>} request Request message or plain object
 * @param {rpc.ServiceMethodCallback<TRes>} callback Service callback
 * @returns {undefined}
 * @template TReq extends Message<TReq>
 * @template TRes extends Message<TRes>
 */
Service.prototype.rpcCall = function rpcCall(method, requestCtor, responseCtor, request, callback) {

    if (!request)
        throw TypeError("request must be specified");

    var self = this;
    if (!callback)
        return minimal$2.asPromise(rpcCall, self, method, requestCtor, responseCtor, request);

    if (!self.rpcImpl) {
        setTimeout(function() { callback(Error("already ended")); }, 0);
        return undefined;
    }

    try {
        return self.rpcImpl(
            method,
            requestCtor[self.requestDelimited ? "encodeDelimited" : "encode"](request).finish(),
            function rpcCallback(err, response) {

                if (err) {
                    self.emit("error", err, method);
                    return callback(err);
                }

                if (response === null) {
                    self.end(/* endedByRPC */ true);
                    return undefined;
                }

                if (!(response instanceof responseCtor)) {
                    try {
                        response = responseCtor[self.responseDelimited ? "decodeDelimited" : "decode"](response);
                    } catch (err) {
                        self.emit("error", err, method);
                        return callback(err);
                    }
                }

                self.emit("data", response, method);
                return callback(null, response);
            }
        );
    } catch (err) {
        self.emit("error", err, method);
        setTimeout(function() { callback(err); }, 0);
        return undefined;
    }
};

/**
 * Ends this service and emits the `end` event.
 * @param {boolean} [endedByRPC=false] Whether the service has been ended by the RPC implementation.
 * @returns {rpc.Service} `this`
 */
Service.prototype.end = function end(endedByRPC) {
    if (this.rpcImpl) {
        if (!endedByRPC) // signal end to rpcImpl
            this.rpcImpl(null, null, null);
        this.rpcImpl = null;
        this.emit("end").off();
    }
    return this;
};

var rpc_1 = createCommonjsModule(function (module, exports) {
"use strict";

/**
 * Streaming RPC helpers.
 * @namespace
 */
var rpc = exports;

/**
 * RPC implementation passed to {@link Service#create} performing a service request on network level, i.e. by utilizing http requests or websockets.
 * @typedef RPCImpl
 * @type {function}
 * @param {Method|rpc.ServiceMethod<Message<{}>,Message<{}>>} method Reflected or static method being called
 * @param {Uint8Array} requestData Request data
 * @param {RPCImplCallback} callback Callback function
 * @returns {undefined}
 * @example
 * function rpcImpl(method, requestData, callback) {
 *     if (protobuf.util.lcFirst(method.name) !== "myMethod") // compatible with static code
 *         throw Error("no such method");
 *     asynchronouslyObtainAResponse(requestData, function(err, responseData) {
 *         callback(err, responseData);
 *     });
 * }
 */

/**
 * Node-style callback as used by {@link RPCImpl}.
 * @typedef RPCImplCallback
 * @type {function}
 * @param {Error|null} error Error, if any, otherwise `null`
 * @param {Uint8Array|null} [response] Response data or `null` to signal end of stream, if there hasn't been an error
 * @returns {undefined}
 */

rpc.Service = service;
});

var roots = {};

/**
 * Named roots.
 * This is where pbjs stores generated structures (the option `-r, --root` specifies a name).
 * Can also be used manually to make roots available accross modules.
 * @name roots
 * @type {Object.<string,Root>}
 * @example
 * // pbjs -r myroot -o compiled.js ...
 *
 * // in another module:
 * require("./compiled.js");
 *
 * // in any subsequent module:
 * var root = protobuf.roots["myroot"];
 */

var indexMinimal = createCommonjsModule(function (module, exports) {
"use strict";
var protobuf = exports;

/**
 * Build type, one of `"full"`, `"light"` or `"minimal"`.
 * @name build
 * @type {string}
 * @const
 */
protobuf.build = "minimal";

// Serialization
protobuf.Writer       = writer;
protobuf.BufferWriter = writer_buffer;
protobuf.Reader       = reader;
protobuf.BufferReader = reader_buffer;

// Utility
protobuf.util         = minimal$2;
protobuf.rpc          = rpc_1;
protobuf.roots        = roots;
protobuf.configure    = configure;

/* istanbul ignore next */
/**
 * Reconfigures the library according to the environment.
 * @returns {undefined}
 */
function configure() {
    protobuf.Reader._configure(protobuf.BufferReader);
    protobuf.util._configure();
}

// Configure serialization
protobuf.Writer._configure(protobuf.BufferWriter);
configure();
});

var minimal = indexMinimal;

var minimal_1 = minimal.Reader;
var minimal_2 = minimal.Writer;
var minimal_3 = minimal.util;
var minimal_4 = minimal.roots;

/*eslint-disable block-scoped-var, no-redeclare, no-control-regex, no-prototype-builtins*/
var $Reader = minimal_1;
var $Writer = minimal_2;
var $util = minimal_3;

var $root = minimal_4["default"] || (minimal_4["default"] = {});

var Message = $root.Message = function () {

    function Message(properties) {
        if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
            if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
        }
    }

    Message.prototype.senderId = 0;
    Message.prototype.recipientId = 0;
    Message.prototype.isInner = false;
    Message.prototype.content = $util.newBuffer([]);

    Message.create = function create(properties) {
        return new Message(properties);
    };

    Message.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.senderId != null && message.hasOwnProperty("senderId")) writer.uint32(8).uint32(message.senderId);
        if (message.recipientId != null && message.hasOwnProperty("recipientId")) writer.uint32(16).uint32(message.recipientId);
        if (message.isInner != null && message.hasOwnProperty("isInner")) writer.uint32(24).bool(message.isInner);
        if (message.content != null && message.hasOwnProperty("content")) writer.uint32(34).bytes(message.content);
        return writer;
    };

    Message.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.Message();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.senderId = reader.uint32();
                    break;
                case 2:
                    message.recipientId = reader.uint32();
                    break;
                case 3:
                    message.isInner = reader.bool();
                    break;
                case 4:
                    message.content = reader.bytes();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    };

    return Message;
}();

var user = $root.user = function () {

    var user = {};

    user.Message = function () {

        function Message(properties) {
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        Message.prototype.length = 0;
        Message.prototype.type = 0;
        Message.prototype.full = $util.newBuffer([]);
        Message.prototype.chunk = null;

        var $oneOfFields = void 0;

        Object.defineProperty(Message.prototype, "content", {
            get: $util.oneOfGetter($oneOfFields = ["full", "chunk"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        Message.create = function create(properties) {
            return new Message(properties);
        };

        Message.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.length != null && message.hasOwnProperty("length")) writer.uint32(8).uint32(message.length);
            if (message.type != null && message.hasOwnProperty("type")) writer.uint32(16).int32(message.type);
            if (message.full != null && message.hasOwnProperty("full")) writer.uint32(26).bytes(message.full);
            if (message.chunk != null && message.hasOwnProperty("chunk")) $root.user.Message.Chunk.encode(message.chunk, writer.uint32(34).fork()).ldelim();
            return writer;
        };

        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.user.Message();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.length = reader.uint32();
                        break;
                    case 2:
                        message.type = reader.int32();
                        break;
                    case 3:
                        message.full = reader.bytes();
                        break;
                    case 4:
                        message.chunk = $root.user.Message.Chunk.decode(reader, reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };

        Message.Chunk = function () {

            function Chunk(properties) {
                if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                    if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
                }
            }

            Chunk.prototype.id = 0;
            Chunk.prototype.number = 0;
            Chunk.prototype.content = $util.newBuffer([]);

            Chunk.create = function create(properties) {
                return new Chunk(properties);
            };

            Chunk.encode = function encode(message, writer) {
                if (!writer) writer = $Writer.create();
                if (message.id != null && message.hasOwnProperty("id")) writer.uint32(8).uint32(message.id);
                if (message.number != null && message.hasOwnProperty("number")) writer.uint32(16).uint32(message.number);
                if (message.content != null && message.hasOwnProperty("content")) writer.uint32(26).bytes(message.content);
                return writer;
            };

            Chunk.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length,
                    message = new $root.user.Message.Chunk();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                        case 1:
                            message.id = reader.uint32();
                            break;
                        case 2:
                            message.number = reader.uint32();
                            break;
                        case 3:
                            message.content = reader.bytes();
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                    }
                }
                return message;
            };

            return Chunk;
        }();

        Message.Type = function () {
            var valuesById = {},
                values = Object.create(valuesById);
            values[valuesById[0] = "STRING"] = 0;
            values[valuesById[1] = "ARRAY_BUFFER"] = 1;
            return values;
        }();

        return Message;
    }();

    return user;
}();

var inner = $root.inner = function () {

    var inner = {};

    inner.Message = function () {

        function Message(properties) {
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        Message.prototype.id = 0;
        Message.prototype.content = $util.newBuffer([]);

        Message.create = function create(properties) {
            return new Message(properties);
        };

        Message.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id")) writer.uint32(8).uint32(message.id);
            if (message.content != null && message.hasOwnProperty("content")) writer.uint32(18).bytes(message.content);
            return writer;
        };

        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.inner.Message();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.id = reader.uint32();
                        break;
                    case 2:
                        message.content = reader.bytes();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };

        return Message;
    }();

    return inner;
}();

var webChannel = $root.webChannel = function () {

    var webChannel = {};

    webChannel.Message = function () {

        function Message(properties) {
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        Message.prototype.initWebChannel = null;
        Message.prototype.ping = false;
        Message.prototype.pong = false;

        var $oneOfFields = void 0;

        Object.defineProperty(Message.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["initWebChannel", "ping", "pong"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        Message.create = function create(properties) {
            return new Message(properties);
        };

        Message.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.initWebChannel != null && message.hasOwnProperty("initWebChannel")) $root.webChannel.InitWebChannel.encode(message.initWebChannel, writer.uint32(10).fork()).ldelim();
            if (message.ping != null && message.hasOwnProperty("ping")) writer.uint32(16).bool(message.ping);
            if (message.pong != null && message.hasOwnProperty("pong")) writer.uint32(24).bool(message.pong);
            return writer;
        };

        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.webChannel.Message();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.initWebChannel = $root.webChannel.InitWebChannel.decode(reader, reader.uint32());
                        break;
                    case 2:
                        message.ping = reader.bool();
                        break;
                    case 3:
                        message.pong = reader.bool();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };

        return Message;
    }();

    webChannel.InitWebChannel = function () {

        function InitWebChannel(properties) {
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        InitWebChannel.prototype.topology = 0;
        InitWebChannel.prototype.wcId = 0;
        InitWebChannel.prototype.peerId = 0;

        InitWebChannel.create = function create(properties) {
            return new InitWebChannel(properties);
        };

        InitWebChannel.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.topology != null && message.hasOwnProperty("topology")) writer.uint32(8).uint32(message.topology);
            if (message.wcId != null && message.hasOwnProperty("wcId")) writer.uint32(16).uint32(message.wcId);
            if (message.peerId != null && message.hasOwnProperty("peerId")) writer.uint32(24).uint32(message.peerId);
            return writer;
        };

        InitWebChannel.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.webChannel.InitWebChannel();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.topology = reader.uint32();
                        break;
                    case 2:
                        message.wcId = reader.uint32();
                        break;
                    case 3:
                        message.peerId = reader.uint32();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };

        return InitWebChannel;
    }();

    return webChannel;
}();

var channelBuilder = $root.channelBuilder = function () {

    var channelBuilder = {};

    channelBuilder.Message = function () {

        function Message(properties) {
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        Message.prototype.request = null;
        Message.prototype.response = null;
        Message.prototype.failed = "";

        var $oneOfFields = void 0;

        Object.defineProperty(Message.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["request", "response", "failed"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        Message.create = function create(properties) {
            return new Message(properties);
        };

        Message.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.request != null && message.hasOwnProperty("request")) $root.channelBuilder.Connection.encode(message.request, writer.uint32(10).fork()).ldelim();
            if (message.response != null && message.hasOwnProperty("response")) $root.channelBuilder.Connection.encode(message.response, writer.uint32(18).fork()).ldelim();
            if (message.failed != null && message.hasOwnProperty("failed")) writer.uint32(26).string(message.failed);
            return writer;
        };

        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.channelBuilder.Message();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.request = $root.channelBuilder.Connection.decode(reader, reader.uint32());
                        break;
                    case 2:
                        message.response = $root.channelBuilder.Connection.decode(reader, reader.uint32());
                        break;
                    case 3:
                        message.failed = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };

        return Message;
    }();

    channelBuilder.Connection = function () {

        function Connection(properties) {
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        Connection.prototype.isWsListen = false;
        Connection.prototype.isWrtcSupport = false;
        Connection.prototype.url = "";

        Connection.create = function create(properties) {
            return new Connection(properties);
        };

        Connection.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.isWsListen != null && message.hasOwnProperty("isWsListen")) writer.uint32(8).bool(message.isWsListen);
            if (message.isWrtcSupport != null && message.hasOwnProperty("isWrtcSupport")) writer.uint32(16).bool(message.isWrtcSupport);
            if (message.url != null && message.hasOwnProperty("url")) writer.uint32(26).string(message.url);
            return writer;
        };

        Connection.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.channelBuilder.Connection();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.isWsListen = reader.bool();
                        break;
                    case 2:
                        message.isWrtcSupport = reader.bool();
                        break;
                    case 3:
                        message.url = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };

        return Connection;
    }();

    return channelBuilder;
}();

var fullyConnected = $root.fullyConnected = function () {

    var fullyConnected = {};

    fullyConnected.Message = function () {

        function Message(properties) {
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        Message.prototype.shouldConnectTo = null;
        Message.prototype.newJoiningPeer = null;
        Message.prototype.peerJoined = false;
        Message.prototype.tick = false;
        Message.prototype.tock = null;

        var $oneOfFields = void 0;

        Object.defineProperty(Message.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["shouldConnectTo", "newJoiningPeer", "peerJoined", "tick", "tock"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        Message.create = function create(properties) {
            return new Message(properties);
        };

        Message.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.shouldConnectTo != null && message.hasOwnProperty("shouldConnectTo")) $root.fullyConnected.ShouldConnectTo.encode(message.shouldConnectTo, writer.uint32(10).fork()).ldelim();
            if (message.newJoiningPeer != null && message.hasOwnProperty("newJoiningPeer")) $root.fullyConnected.NewJoiningPeer.encode(message.newJoiningPeer, writer.uint32(18).fork()).ldelim();
            if (message.peerJoined != null && message.hasOwnProperty("peerJoined")) writer.uint32(24).bool(message.peerJoined);
            if (message.tick != null && message.hasOwnProperty("tick")) writer.uint32(32).bool(message.tick);
            if (message.tock != null && message.hasOwnProperty("tock")) $root.fullyConnected.Tock.encode(message.tock, writer.uint32(42).fork()).ldelim();
            return writer;
        };

        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.fullyConnected.Message();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.shouldConnectTo = $root.fullyConnected.ShouldConnectTo.decode(reader, reader.uint32());
                        break;
                    case 2:
                        message.newJoiningPeer = $root.fullyConnected.NewJoiningPeer.decode(reader, reader.uint32());
                        break;
                    case 3:
                        message.peerJoined = reader.bool();
                        break;
                    case 4:
                        message.tick = reader.bool();
                        break;
                    case 5:
                        message.tock = $root.fullyConnected.Tock.decode(reader, reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };

        return Message;
    }();

    fullyConnected.ShouldConnectTo = function () {

        function ShouldConnectTo(properties) {
            this.peers = [];
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        ShouldConnectTo.prototype.peers = $util.emptyArray;

        ShouldConnectTo.create = function create(properties) {
            return new ShouldConnectTo(properties);
        };

        ShouldConnectTo.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.peers != null && message.peers.length) {
                writer.uint32(10).fork();
                for (var i = 0; i < message.peers.length; ++i) {
                    writer.uint32(message.peers[i]);
                }writer.ldelim();
            }
            return writer;
        };

        ShouldConnectTo.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.fullyConnected.ShouldConnectTo();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        if (!(message.peers && message.peers.length)) message.peers = [];
                        if ((tag & 7) === 2) {
                            var end2 = reader.uint32() + reader.pos;
                            while (reader.pos < end2) {
                                message.peers.push(reader.uint32());
                            }
                        } else message.peers.push(reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };

        return ShouldConnectTo;
    }();

    fullyConnected.Tock = function () {

        function Tock(properties) {
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        Tock.prototype.isJoining = false;

        Tock.create = function create(properties) {
            return new Tock(properties);
        };

        Tock.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.isJoining != null && message.hasOwnProperty("isJoining")) writer.uint32(8).bool(message.isJoining);
            return writer;
        };

        Tock.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.fullyConnected.Tock();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.isJoining = reader.bool();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };

        return Tock;
    }();

    fullyConnected.NewJoiningPeer = function () {

        function NewJoiningPeer(properties) {
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        NewJoiningPeer.prototype.jpId = 0;

        NewJoiningPeer.create = function create(properties) {
            return new NewJoiningPeer(properties);
        };

        NewJoiningPeer.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.jpId != null && message.hasOwnProperty("jpId")) writer.uint32(8).uint32(message.jpId);
            return writer;
        };

        NewJoiningPeer.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.fullyConnected.NewJoiningPeer();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.jpId = reader.uint32();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };

        return NewJoiningPeer;
    }();

    return fullyConnected;
}();

var webRTC = $root.webRTC = function () {

    var webRTC = {};

    webRTC.Message = function () {

        function Message(properties) {
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        Message.prototype.offer = null;
        Message.prototype.answer = null;
        Message.prototype.candidate = "";

        var $oneOfFields = void 0;

        Object.defineProperty(Message.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["offer", "answer", "candidate"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        Message.create = function create(properties) {
            return new Message(properties);
        };

        Message.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.offer != null && message.hasOwnProperty("offer")) $root.webRTC.SDP.encode(message.offer, writer.uint32(10).fork()).ldelim();
            if (message.answer != null && message.hasOwnProperty("answer")) $root.webRTC.SDP.encode(message.answer, writer.uint32(18).fork()).ldelim();
            if (message.candidate != null && message.hasOwnProperty("candidate")) writer.uint32(26).string(message.candidate);
            return writer;
        };

        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.webRTC.Message();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.offer = $root.webRTC.SDP.decode(reader, reader.uint32());
                        break;
                    case 2:
                        message.answer = $root.webRTC.SDP.decode(reader, reader.uint32());
                        break;
                    case 3:
                        message.candidate = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };

        return Message;
    }();

    webRTC.SDP = function () {

        function SDP(properties) {
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        SDP.prototype.type = "";
        SDP.prototype.sdp = "";

        SDP.create = function create(properties) {
            return new SDP(properties);
        };

        SDP.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.type != null && message.hasOwnProperty("type")) writer.uint32(10).string(message.type);
            if (message.sdp != null && message.hasOwnProperty("sdp")) writer.uint32(18).string(message.sdp);
            return writer;
        };

        SDP.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.webRTC.SDP();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.type = reader.string();
                        break;
                    case 2:
                        message.sdp = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };

        return SDP;
    }();

    return webRTC;
}();

var InnerMessageMixin = function () {
  function InnerMessageMixin(id, EncoderDecoder) {
    var msgStream = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
    classCallCheck(this, InnerMessageMixin);

    this.serviceId = id;
    this.EncoderDecoder = EncoderDecoder;
    if (msgStream !== undefined) {
      this.setInnerStream(msgStream);
    }
  }

  createClass(InnerMessageMixin, [{
    key: 'setInnerStream',
    value: function setInnerStream(msgStream) {
      var _this = this;

      this.innerStream = msgStream.filter(function (_ref) {
        var id = _ref.id;
        return id === _this.serviceId;
      }).map(function (_ref2) {
        var channel = _ref2.channel,
            senderId = _ref2.senderId,
            recipientId = _ref2.recipientId,
            content = _ref2.content;
        return {
          channel: channel,
          senderId: senderId,
          recipientId: recipientId,
          msg: _this.EncoderDecoder.decode(content)
        };
      });
    }
  }, {
    key: 'encode',
    value: function encode(msg) {
      var content = this.EncoderDecoder.encode(this.EncoderDecoder.create(msg)).finish();
      return inner.Message.encode(inner.Message.create({ id: this.serviceId, content: content })).finish();
    }
  }, {
    key: 'decode',
    value: function decode(bytes) {
      return this.EncoderDecoder.decode(bytes);
    }
  }]);
  return InnerMessageMixin;
}();

/**
 * It is responsible to preserve Web Channel
 * structure intact (i.e. all peers have the same vision of the Web Channel).
 * Among its duties are:
 *
 * - Add a new peer into Web Channel.
 * - Remove a peer from Web Channel.
 * - Send a broadcast message.
 * - Send a message to a particular peer.
 *
 * @see FullyConnectedService
 * @interface
 */
var TopologyInterface = function (_InnerMessageMixin) {
  inherits(TopologyInterface, _InnerMessageMixin);

  function TopologyInterface() {
    classCallCheck(this, TopologyInterface);
    return possibleConstructorReturn(this, (TopologyInterface.__proto__ || Object.getPrototypeOf(TopologyInterface)).apply(this, arguments));
  }

  createClass(TopologyInterface, [{
    key: 'add',

    /**
     * Adds a new peer into Web Channel.
     *
     * @abstract
     * @param  {Channel} ch - Channel to be added (it should has
     * the `webChannel` property).
     * @return {Promise} - Resolved once the channel has been succesfully added,
     * rejected otherwise.
     */
    value: function add(ch) {
      throw new Error('Must be implemented by subclass!');
    }

    /**
     * Send a message to all peers in Web Channel.
     *
     * @abstract
     * @param  {WebChannel} wc - Web Channel where the message will be propagated.
     * @param  {string} data - Data in stringified JSON format to be send.
     */

  }, {
    key: 'broadcast',
    value: function broadcast(wc, data) {
      throw new Error('Must be implemented by subclass!');
    }

    /**
     * Send a message to a particular peer in Web Channel.
     *
     * @abstract
     * @param  {string} id - Peer id.
     * @param  {WebChannel} wc - Web Channel where the message will be propagated.
     * @param  {string} data - Data in stringified JSON format to be send.
     */

  }, {
    key: 'sendTo',
    value: function sendTo(id, wc, data) {
      throw new Error('Must be implemented by subclass!');
    }

    /**
     * Leave Web Channel.
     *
     * @abstract
     * @param  {WebChannel} wc - Web Channel to leave.
     */

  }, {
    key: 'leave',
    value: function leave(wc) {
      throw new Error('Must be implemented by subclass!');
    }
  }]);
  return TopologyInterface;
}(InnerMessageMixin);

/**
 * {@link FullyConnectedService} identifier.
 * @ignore
 * @type {number}
 */
var FULLY_CONNECTED = 3;

/**
 * Fully connected web channel manager. Implements fully connected topology
 * network, when each peer is connected to each other.
 *
 * @extends module:webChannelManager~WebChannelTopologyInterface
 */
var FullyConnectedService = function (_TopologyInterface) {
  inherits(FullyConnectedService, _TopologyInterface);

  function FullyConnectedService(wc) {
    classCallCheck(this, FullyConnectedService);

    var _this = possibleConstructorReturn(this, (FullyConnectedService.__proto__ || Object.getPrototypeOf(FullyConnectedService)).call(this, FULLY_CONNECTED, fullyConnected.Message, wc._msgStream));

    _this.wc = wc;
    _this.init();
    _this.innerMessageSubscritption = _this.innerStream.subscribe(function (msg) {
      return _this._handleSvcMsg(msg);
    }, function (err) {
      return void 0;
    }, function () {
      _this.init();
      _this.clean();
    });
    return _this;
  }

  createClass(FullyConnectedService, [{
    key: 'init',
    value: function init() {
      this.channels = new Set();
      this.joiningPeers = new Map();
      this.pendingRequests = new Map();
    }
  }, {
    key: 'clean',
    value: function clean() {
      this.innerMessageSubscritption.unsubscribe();
    }
  }, {
    key: 'connectTo',
    value: function connectTo(peerIds) {
      var _this2 = this;

      var failed = [];
      if (peerIds.length === 0) {
        return Promise.resolve(failed);
      } else {
        return new Promise(function (resolve, reject) {
          var counter = 0;
          peerIds.forEach(function (id) {
            _this2.wc.channelBuilderSvc.connectTo(id).then(function (ch) {
              return _this2.onChannel(ch);
            }).then(function () {
              if (++counter === peerIds.length) resolve(failed);
            }).catch(function (reason) {
              failed.push({ id: id, reason: reason });
              if (++counter === peerIds.length) resolve(failed);
            });
          });
        });
      }
    }

    /**
     * Add a peer to the `WebChannel`.
     *
     * @param {WebSocket|RTCDataChannel} channel
     *
     * @returns {Promise<number, string>}
     */

  }, {
    key: 'add',
    value: function add(channel) {
      var _this3 = this;

      var wc = channel.webChannel;
      var peers = wc.members.slice();
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.joiningPeers.keys()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var jpId = _step.value;

          peers[peers.length] = jpId;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      this.setJP(channel.peerId, channel);
      wc._send({
        content: get(FullyConnectedService.prototype.__proto__ || Object.getPrototypeOf(FullyConnectedService.prototype), 'encode', this).call(this, { newJoiningPeer: { jpId: channel.peerId } })
      });
      channel.send(wc._encodeMain({
        recipientId: channel.peerId,
        content: get(FullyConnectedService.prototype.__proto__ || Object.getPrototypeOf(FullyConnectedService.prototype), 'encode', this).call(this, { shouldConnectTo: { peers: peers } })
      }));
      return new Promise(function (resolve, reject) {
        _this3.pendingRequests.set(channel.peerId, { resolve: resolve, reject: reject });
      });
    }

    /**
     * Send message to all `WebChannel` members.
     *
     * @param {ArrayBuffer} msg
     */

  }, {
    key: 'send',
    value: function send(msg) {
      var bytes = this.wc._encodeMain(msg);
      if (!msg.isInner) {
        // User Message
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = this.channels[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var c = _step2.value;

            c.send(bytes);
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      } else {
        // Inner Message
        var jp = this.joiningPeers.get(this.wc.myId);
        if (jp === undefined) {
          // I am member of the network
          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = this.channels[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var _c = _step3.value;

              _c.send(bytes);
            }
          } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
              }
            } finally {
              if (_didIteratorError3) {
                throw _iteratorError3;
              }
            }
          }
        } else {
          // I am joining the network
          jp.channel.send(bytes);
        }
      }
    }
  }, {
    key: 'sendTo',
    value: function sendTo(msg) {
      var bytes = this.wc._encodeMain(msg);
      if (!msg.isInner) {
        // User Message
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = this.channels[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var c = _step4.value;

            if (c.peerId === msg.recipientId) {
              c.send(bytes);
              return;
            }
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }
      } else {
        // Inner Message
        var jp = this.joiningPeers.get(this.wc.myId);
        if (jp === undefined) {
          jp = this.joiningPeers.get(msg.recipientId);
        }

        // If me or the recipient is joining the WebChannel,
        // then send data via intermediary passway
        if (jp !== undefined) {
          jp.channel.send(bytes);
        } else {
          // Otherwise me and the recipient are network
          // members, thus send data directly
          var _iteratorNormalCompletion5 = true;
          var _didIteratorError5 = false;
          var _iteratorError5 = undefined;

          try {
            for (var _iterator5 = this.channels[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
              var _c2 = _step5.value;

              if (_c2.peerId === msg.recipientId) {
                _c2.send(bytes);
                return;
              }
            }
          } catch (err) {
            _didIteratorError5 = true;
            _iteratorError5 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion5 && _iterator5.return) {
                _iterator5.return();
              }
            } finally {
              if (_didIteratorError5) {
                throw _iteratorError5;
              }
            }
          }
        }
      }
    }
  }, {
    key: 'leave',
    value: function leave() {
      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;

      try {
        for (var _iterator6 = this.channels[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var c = _step6.value;

          c.clearHandlers();
          c.close();
        }
      } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion6 && _iterator6.return) {
            _iterator6.return();
          }
        } finally {
          if (_didIteratorError6) {
            throw _iteratorError6;
          }
        }
      }

      this.channels.clear();
    }
  }, {
    key: 'onChannel',
    value: function onChannel(channel) {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        _this4.pendingRequests(channel.peerId, { resolve: resolve, reject: reject });
        channel.send(channel.webChannel._encodeMain({
          recipientId: channel.peerId,
          content: get(FullyConnectedService.prototype.__proto__ || Object.getPrototypeOf(FullyConnectedService.prototype), 'encode', _this4).call(_this4, { tick: true })
        }));
      });
    }

    /**
     * Close event handler for each `Channel` in the `WebChannel`.
     *
     * @param {CloseEvent} closeEvt
     * @param {Channel} channel
     *
     * @returns {boolean}
     */

  }, {
    key: 'onChannelClose',
    value: function onChannelClose(closeEvt, channel) {
      // TODO: need to check if this is a peer leaving and thus he closed channels
      // with all WebChannel members or this is abnormal channel closing
      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        for (var _iterator7 = this.channels[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          var c = _step7.value;

          if (c.peerId === channel.peerId) {
            return this.channels.delete(c);
          }
        }
      } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion7 && _iterator7.return) {
            _iterator7.return();
          }
        } finally {
          if (_didIteratorError7) {
            throw _iteratorError7;
          }
        }
      }

      this.joiningPeers.forEach(function (jp) {
        return jp.channels.delete(channel);
      });
      return false;
    }

    /**
     * Error event handler for each `Channel` in the `WebChannel`.
     *
     * @param {Event} evt
     * @param {Channel} channel
     */

  }, {
    key: 'onChannelError',
    value: function onChannelError(evt, channel) {
      console.error('Channel error with id: ' + channel.peerId + ': ', evt);
    }
  }, {
    key: '_handleSvcMsg',
    value: function _handleSvcMsg(_ref) {
      var _this5 = this;

      var channel = _ref.channel,
          senderId = _ref.senderId,
          recipientId = _ref.recipientId,
          msg = _ref.msg;

      var wc = channel.webChannel;
      switch (msg.type) {
        case 'shouldConnectTo':
          {
            var jpMe = this.setJP(wc.myId, channel);
            jpMe.channels.add(channel);
            this.connectTo(msg.shouldConnectTo.peers).then(function (failed) {
              var msg = { peerJoined: true };
              jpMe.channels.forEach(function (ch) {
                ch.send(wc._encodeMain({
                  recipientId: ch.peerId,
                  content: get(FullyConnectedService.prototype.__proto__ || Object.getPrototypeOf(FullyConnectedService.prototype), 'encode', _this5).call(_this5, msg)
                }));
                _this5.channels.add(ch);
                wc._onPeerJoin(ch.peerId);
              });
              _this5.joiningPeers.delete(wc.myId);
              _this5.joiningPeers.forEach(function (jp) {
                return wc._sendTo(jp.channel, _this5.id, msg);
              });
              wc._joinSucceed();
            });
            break;
          }
        case 'peerJoined':
          {
            var _jpMe = this.joiningPeers.get(wc.myId);
            this.joiningPeers.delete(senderId);
            if (_jpMe !== undefined) {
              _jpMe.channels.add(channel);
            } else {
              this.channels.add(channel);
              wc._onPeerJoin(senderId);
              var request = this.pendingRequests.get(senderId);
              if (request !== undefined) request.resolve(senderId);
            }
            break;
          }
        case 'tick':
          {
            this.setJP(senderId, channel);
            wc._sendTo({
              recipientId: channel.peerId,
              content: get(FullyConnectedService.prototype.__proto__ || Object.getPrototypeOf(FullyConnectedService.prototype), 'encode', this).call(this, { tock: {
                  isJoining: this.joiningPeers.get(wc.myId) !== undefined
                } })
            });
            break;
          }
        case 'tock':
          {
            if (msg.isJoining) {
              this.setJP(senderId, channel);
            } else {
              var jp = this.joiningPeers.get(wc.myId);
              if (jp !== undefined) {
                jp.channels.add(channel);
              }
            }
            this.pendingRequests.get(senderId).resolve();
            break;
          }
        case 'newJoiningPeer':
          this.setJP(msg.jpId, channel);
          break;
      }
    }

    /**
     * @private
     * @param {number} jpId
     * @param {WebSocket|RTCDataChannel} channel
     *
     * @returns {type} Description
     */

  }, {
    key: 'setJP',
    value: function setJP(jpId, channel) {
      var jp = this.joiningPeers.get(jpId);
      if (!jp) {
        jp = new JoiningPeer(channel);
        this.joiningPeers.set(jpId, jp);
      } else {
        jp.channel = channel;
      }
      return jp;
    }
  }]);
  return FullyConnectedService;
}(TopologyInterface);

/**
 * This class represents a temporary state of a peer, while he is about to join
 * the web channel. During the joining process every peer in the web channel
 * and the joining peer have an instance of this class with the same `id` and
 * `intermediaryId` attribute values. After the joining process has been finished
 * regardless of success, these instances will be deleted.
 */

var JoiningPeer = function JoiningPeer(channel) {
  classCallCheck(this, JoiningPeer);

  /**
   * The channel between the joining peer and intermediary peer. It is null
   * for every peer, but the joining and intermediary peers.
   *
   * @type {Channel}
   */
  this.channel = channel;

  /**
   * This attribute is proper to each peer. Array of channels which will be
   * added to the current peer once it becomes the member of the web channel.
   * @type {Channel[]}
   */
  this.channels = new Set();
};

/**
 * This class represents a door of the `WebChannel` for the current peer. If the door
 * is open, then clients can join the `WebChannel` through this peer. There are as
 * many doors as peers in the `WebChannel` and each of them can be closed or opened.
 */
var SignalingGate = function () {
  /**
   * @param {WebChannel} wc
   * @param {function(ch: RTCDataChannel)} onChannel
   */
  function SignalingGate(wc, onChannel) {
    classCallCheck(this, SignalingGate);

    /**
     * @type {WebChannel}
     */
    this.wc = wc;
    /**
     * Signaling server url.
     * @private
     * @type {string}
     */
    this.url = undefined;
    /**
     * Key related to the `url`.
     * @private
     * @type {string}
     */
    this.key = undefined;
    /**
     * Connection with the signaling server.
     * @private
     * @type {external:WebSocket|external:ws/WebSocket|external:EventSource}
     */
    this.stream = undefined;

    this.onChannel = onChannel;
  }

  /**
   * Open the gate.
   *
   * @param {string} url Signaling server url
   * @param {string} [key = this.generateKey()]
   * @param {Object} signaling
   * @returns {Promise<OpenData, string>}
   */


  createClass(SignalingGate, [{
    key: 'open',
    value: function open(url) {
      var _this = this;

      var key = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.generateKey();
      var signaling = arguments[2];

      if (signaling) {
        return this.listenOnOpen(url, key, signaling);
      } else {
        return this.wc.webSocketSvc.subject(url).then(function (signaling) {
          signaling.filter(function (msg) {
            return 'ping' in msg;
          }).subscribe(function () {
            return signaling.send(JSON.stringify({ pong: true }));
          });
          return _this.listenOnOpen(url, key, signaling);
        });
      }
    }
  }, {
    key: 'listenOnOpen',
    value: function listenOnOpen(url, key, signaling) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        signaling.filter(function (msg) {
          return 'first' in msg;
        }).subscribe(function (msg) {
          if (msg.first) {
            _this2.stream = signaling;
            _this2.key = key;
            _this2.url = url.endsWith('/') ? url.substr(0, url.length - 1) : url;
            resolve({ url: _this2.url, key: key });
          }
        }, function (err) {
          _this2.onClose();
          reject(err);
        }, function () {
          _this2.onClose();
          reject(new Error(''));
        });
        _this2.wc.webRTCSvc.onConnectionFromSignaling(signaling).subscribe(function (ch) {
          return _this2.onChannel(ch);
        });
        signaling.send(JSON.stringify({ open: key }));
      });
    }
  }, {
    key: 'join',
    value: function join(key, url, shouldOpen) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        _this3.wc.webSocketSvc.subject(url).then(function (signaling) {
          signaling.filter(function (msg) {
            return 'ping' in msg;
          }).subscribe(function () {
            return signaling.send(JSON.stringify({ pong: true }));
          });
          var subs = signaling.filter(function (msg) {
            return 'first' in msg;
          }).subscribe(function (msg) {
            if (msg.first) {
              subs.unsubscribe();
              if (shouldOpen) {
                _this3.open(url, key, signaling).then(function () {
                  return resolve();
                }).catch(function (err) {
                  return reject(err);
                });
              } else {
                signaling.close(1000);
                resolve();
              }
            } else {
              _this3.wc.webRTCSvc.connectOverSignaling(signaling).then(function (ch) {
                subs.unsubscribe();
                if (shouldOpen) {
                  _this3.open(url, key, signaling).then(function () {
                    return resolve(ch);
                  }).catch(function (err) {
                    return reject(err);
                  });
                } else {
                  signaling.close(1000);
                  resolve(ch);
                }
              }).catch(function (err) {
                signaling.close(1000);
                signaling.error(err);
              });
            }
          }, function (err) {
            return reject(err);
          });
          signaling.send(JSON.stringify({ join: key }));
        }).catch(function (err) {
          return reject(err);
        });
      });
    }

    /**
     * Check if the door is opened or closed.
     *
     * @returns {boolean} - Returns true if the door is opened and false if it is
     * closed
     */

  }, {
    key: 'isOpen',
    value: function isOpen() {
      return this.stream !== undefined;
    }

    /**
     * Get open data.
     *
     * @returns {OpenData|undefined} Open data if the door is open and null otherwise
     */

  }, {
    key: 'getOpenData',
    value: function getOpenData() {
      if (this.isOpen()) {
        return {
          url: this.url,
          key: this.key
        };
      }
      return undefined;
    }

    /**
     * Close the door if it is open and do nothing if it is closed already.
     */

  }, {
    key: 'close',
    value: function close() {
      if (this.isOpen()) {
        this.stream.close(1000);
      }
    }
  }, {
    key: 'onClose',
    value: function onClose() {
      if (this.isOpen()) {
        this.key = undefined;
        this.stream = undefined;
        this.url = undefined;
        this.wc.onClose();
      }
    }

    /**
     * Generate random key which will be used to join the `WebChannel`.
     *
     * @private
     * @returns {string} - Generated key
     */

  }, {
    key: 'generateKey',
    value: function generateKey() {
      var MIN_LENGTH = 5;
      var DELTA_LENGTH = 0;
      var MASK = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      var result = '';
      var length = MIN_LENGTH + Math.round(Math.random() * DELTA_LENGTH);

      for (var i = 0; i < length; i++) {
        result += MASK[Math.round(Math.random() * (MASK.length - 1))];
      }
      return result;
    }
  }]);
  return SignalingGate;
}();

var __extends$5 = (commonjsGlobal && commonjsGlobal.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};


/**
 * @class BehaviorSubject<T>
 */
var BehaviorSubject = (function (_super) {
    __extends$5(BehaviorSubject, _super);
    function BehaviorSubject(_value) {
        _super.call(this);
        this._value = _value;
    }
    Object.defineProperty(BehaviorSubject.prototype, "value", {
        get: function () {
            return this.getValue();
        },
        enumerable: true,
        configurable: true
    });
    BehaviorSubject.prototype._subscribe = function (subscriber) {
        var subscription = _super.prototype._subscribe.call(this, subscriber);
        if (subscription && !subscription.closed) {
            subscriber.next(this._value);
        }
        return subscription;
    };
    BehaviorSubject.prototype.getValue = function () {
        if (this.hasError) {
            throw this.thrownError;
        }
        else if (this.closed) {
            throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
        else {
            return this._value;
        }
    };
    BehaviorSubject.prototype.next = function (value) {
        _super.prototype.next.call(this, this._value = value);
    };
    return BehaviorSubject;
}(Subject_1.Subject));
var BehaviorSubject_2 = BehaviorSubject;

var __extends$6 = (commonjsGlobal && commonjsGlobal.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};

/* tslint:enable:max-line-length */
/**
 * Filter items emitted by the source Observable by only emitting those that
 * satisfy a specified predicate.
 *
 * <span class="informal">Like
 * [Array.prototype.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter),
 * it only emits a value from the source if it passes a criterion function.</span>
 *
 * <img src="./img/filter.png" width="100%">
 *
 * Similar to the well-known `Array.prototype.filter` method, this operator
 * takes values from the source Observable, passes them through a `predicate`
 * function and only emits those values that yielded `true`.
 *
 * @example <caption>Emit only click events whose target was a DIV element</caption>
 * var clicks = Rx.Observable.fromEvent(document, 'click');
 * var clicksOnDivs = clicks.filter(ev => ev.target.tagName === 'DIV');
 * clicksOnDivs.subscribe(x => console.log(x));
 *
 * @see {@link distinct}
 * @see {@link distinctUntilChanged}
 * @see {@link distinctUntilKeyChanged}
 * @see {@link ignoreElements}
 * @see {@link partition}
 * @see {@link skip}
 *
 * @param {function(value: T, index: number): boolean} predicate A function that
 * evaluates each value emitted by the source Observable. If it returns `true`,
 * the value is emitted, if `false` the value is not passed to the output
 * Observable. The `index` parameter is the number `i` for the i-th source
 * emission that has happened since the subscription, starting from the number
 * `0`.
 * @param {any} [thisArg] An optional argument to determine the value of `this`
 * in the `predicate` function.
 * @return {Observable} An Observable of values from the source that were
 * allowed by the `predicate` function.
 * @method filter
 * @owner Observable
 */
function filter$2(predicate, thisArg) {
    return this.lift(new FilterOperator(predicate, thisArg));
}
var filter_2 = filter$2;
var FilterOperator = (function () {
    function FilterOperator(predicate, thisArg) {
        this.predicate = predicate;
        this.thisArg = thisArg;
    }
    FilterOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new FilterSubscriber(subscriber, this.predicate, this.thisArg));
    };
    return FilterOperator;
}());
/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
var FilterSubscriber = (function (_super) {
    __extends$6(FilterSubscriber, _super);
    function FilterSubscriber(destination, predicate, thisArg) {
        _super.call(this, destination);
        this.predicate = predicate;
        this.thisArg = thisArg;
        this.count = 0;
        this.predicate = predicate;
    }
    // the try catch block below is left specifically for
    // optimization and perf reasons. a tryCatcher is not necessary here.
    FilterSubscriber.prototype._next = function (value) {
        var result;
        try {
            result = this.predicate.call(this.thisArg, value, this.count++);
        }
        catch (err) {
            this.destination.error(err);
            return;
        }
        if (result) {
            this.destination.next(value);
        }
    };
    return FilterSubscriber;
}(Subscriber_1.Subscriber));


var filter_1 = {
	filter: filter_2
};

Observable_1.Observable.prototype.filter = filter_1.filter;

var WebSocket = Util.require(Util.WEB_SOCKET);

var CONNECT_TIMEOUT = 3000;
var _isListening = new BehaviorSubject_2(false);
var wsStream = new Subject_2();
var url = '';

/**
 * Service class responsible to establish connections between peers via
 * `WebSocket`.
 */
var WebSocketService = function () {
  function WebSocketService(wc) {
    classCallCheck(this, WebSocketService);

    this.wc = wc;
  }
  /**
   * Creates WebSocket with server.
   *
   * @param {string} url - Server url
   * @returns {Promise<WebSocket, string>} It is resolved once the WebSocket has been created and rejected otherwise
   */


  createClass(WebSocketService, [{
    key: 'connect',
    value: function connect(url) {
      return new Promise(function (resolve, reject) {
        if (Util.isURL(url) && url.search(/^wss?/) !== -1) {
          var ws = new WebSocket(url);
          ws.onopen = function () {
            return resolve(ws);
          };
          // Timeout for node (otherwise it will loop forever if incorrect address)
          setTimeout(function () {
            if (ws.readyState !== ws.OPEN) {
              reject(new Error('WebSocket ' + CONNECT_TIMEOUT + 'ms connection timeout with ' + url));
            }
          }, CONNECT_TIMEOUT);
        } else {
          throw new Error(url + ' is not a valid URL');
        }
      });
    }
  }, {
    key: 'connectTo',
    value: function connectTo(url, id) {
      var _this = this;

      var fullUrl = url + '/internalChannel?wcId=' + this.wc.id + '&senderId=' + this.wc.myId;
      return new Promise(function (resolve, reject) {
        if (Util.isURL(url) && url.search(/^wss?/) !== -1) {
          var ws = new WebSocket(fullUrl);
          var channel = _this.wc._initConnection(ws, id);
          ws.onopen = function () {
            return resolve(channel);
          };
          // Timeout for node (otherwise it will loop forever if incorrect address)
          setTimeout(function () {
            if (ws.readyState !== ws.OPEN) {
              reject(new Error('WebSocket ' + CONNECT_TIMEOUT + 'ms connection timeout with ' + url));
            }
          }, CONNECT_TIMEOUT);
        } else {
          throw new Error(url + ' is not a valid URL');
        }
      });
    }
  }, {
    key: 'onConnection',
    value: function onConnection() {
      var _this2 = this;

      if (url) {
        return wsStream.filter(function (_ref) {
          var id = _ref.id;
          return id === _this2.wc.id;
        }).asObservable();
      }
      throw new Error('Peer is not listening on WebSocket');
    }
  }, {
    key: 'subject',
    value: function subject(url) {
      return this.connect(url).then(function (socket) {
        var subject = new Subject_2();
        socket.onmessage = function (evt) {
          try {
            subject.next(JSON.parse(evt.data));
          } catch (err) {
            console.error('WebSocket message error from ' + socket.url + ': ' + err.message + evt.data);
            socket.close(4000, err.message);
          }
        };
        socket.onerror = function (err) {
          return subject.error(err);
        };
        socket.onclose = function (closeEvt) {
          if (closeEvt.code === 1000) {
            subject.complete();
          } else {
            subject.error(new Error(closeEvt.code + ': ' + closeEvt.reason));
          }
        };
        subject.send = function (msg) {
          return socket.send(msg);
        };
        subject.close = function (code, reason) {
          return socket.close(code, reason);
        };
        subject.socket = socket;
        return subject;
      });
    }
  }]);
  return WebSocketService;
}();

var WebSocketChecker = function () {
  function WebSocketChecker() {
    classCallCheck(this, WebSocketChecker);
  }

  createClass(WebSocketChecker, null, [{
    key: 'isListening',
    value: function isListening() {
      return _isListening.asObservable();
    }
  }, {
    key: 'url',
    get: function get$$1() {
      return url;
    }
  }]);
  return WebSocketChecker;
}();

var BotHelper = function () {
  function BotHelper() {
    classCallCheck(this, BotHelper);
  }

  createClass(BotHelper, null, [{
    key: 'listen',
    value: function listen(serverUrl) {
      url = serverUrl;
      if (serverUrl) {
        _isListening.next(true);
      } else {
        _isListening.next(false);
      }
    }
  }, {
    key: 'wsStream',
    get: function get$$1() {
      return wsStream;
    }
  }]);
  return BotHelper;
}();

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof commonjsRequire=="function"&&commonjsRequire;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r);}return n[o].exports}var i=typeof commonjsRequire=="function"&&commonjsRequire;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */

'use strict';

// Shimming starts here.
(function() {
  // Utils.
  var utils = require('./utils');
  var logging = utils.log;
  var browserDetails = utils.browserDetails;
  // Export to the adapter global object visible in the browser.
  module.exports.browserDetails = browserDetails;
  module.exports.extractVersion = utils.extractVersion;
  module.exports.disableLog = utils.disableLog;

  // Uncomment the line below if you want logging to occur, including logging
  // for the switch statement below. Can also be turned on in the browser via
  // adapter.disableLog(false), but then logging from the switch statement below
  // will not appear.
  // require('./utils').disableLog(false);

  // Browser shims.
  var chromeShim = require('./chrome/chrome_shim') || null;
  var edgeShim = require('./edge/edge_shim') || null;
  var firefoxShim = require('./firefox/firefox_shim') || null;
  var safariShim = require('./safari/safari_shim') || null;

  // Shim browser if found.
  switch (browserDetails.browser) {
    case 'chrome':
      if (!chromeShim || !chromeShim.shimPeerConnection) {
        logging('Chrome shim is not included in this adapter release.');
        return;
      }
      logging('adapter.js shimming chrome.');
      // Export to the adapter global object visible in the browser.
      module.exports.browserShim = chromeShim;

      chromeShim.shimGetUserMedia();
      chromeShim.shimMediaStream();
      utils.shimCreateObjectURL();
      chromeShim.shimSourceObject();
      chromeShim.shimPeerConnection();
      chromeShim.shimOnTrack();
      chromeShim.shimGetSendersWithDtmf();
      break;
    case 'firefox':
      if (!firefoxShim || !firefoxShim.shimPeerConnection) {
        logging('Firefox shim is not included in this adapter release.');
        return;
      }
      logging('adapter.js shimming firefox.');
      // Export to the adapter global object visible in the browser.
      module.exports.browserShim = firefoxShim;

      firefoxShim.shimGetUserMedia();
      utils.shimCreateObjectURL();
      firefoxShim.shimSourceObject();
      firefoxShim.shimPeerConnection();
      firefoxShim.shimOnTrack();
      break;
    case 'edge':
      if (!edgeShim || !edgeShim.shimPeerConnection) {
        logging('MS edge shim is not included in this adapter release.');
        return;
      }
      logging('adapter.js shimming edge.');
      // Export to the adapter global object visible in the browser.
      module.exports.browserShim = edgeShim;

      edgeShim.shimGetUserMedia();
      utils.shimCreateObjectURL();
      edgeShim.shimPeerConnection();
      edgeShim.shimReplaceTrack();
      break;
    case 'safari':
      if (!safariShim) {
        logging('Safari shim is not included in this adapter release.');
        return;
      }
      logging('adapter.js shimming safari.');
      // Export to the adapter global object visible in the browser.
      module.exports.browserShim = safariShim;

      safariShim.shimCallbacksAPI();
      safariShim.shimAddStream();
      safariShim.shimOnAddStream();
      safariShim.shimGetUserMedia();
      break;
    default:
      logging('Unsupported browser!');
  }
})();

},{"./chrome/chrome_shim":3,"./edge/edge_shim":1,"./firefox/firefox_shim":5,"./safari/safari_shim":7,"./utils":8}],3:[function(require,module,exports){

/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';
var logging = require('../utils.js').log;
var browserDetails = require('../utils.js').browserDetails;

var chromeShim = {
  shimMediaStream: function() {
    window.MediaStream = window.MediaStream || window.webkitMediaStream;
  },

  shimOnTrack: function() {
    if (typeof window === 'object' && window.RTCPeerConnection && !('ontrack' in
        window.RTCPeerConnection.prototype)) {
      Object.defineProperty(window.RTCPeerConnection.prototype, 'ontrack', {
        get: function() {
          return this._ontrack;
        },
        set: function(f) {
          var self = this;
          if (this._ontrack) {
            this.removeEventListener('track', this._ontrack);
            this.removeEventListener('addstream', this._ontrackpoly);
          }
          this.addEventListener('track', this._ontrack = f);
          this.addEventListener('addstream', this._ontrackpoly = function(e) {
            // onaddstream does not fire when a track is added to an existing
            // stream. But stream.onaddtrack is implemented so we use that.
            e.stream.addEventListener('addtrack', function(te) {
              var receiver;
              if (RTCPeerConnection.prototype.getReceivers) {
                receiver = self.getReceivers().find(function(r) {
                  return r.track.id === te.track.id;
                });
              } else {
                receiver = {track: te.track};
              }

              var event = new Event('track');
              event.track = te.track;
              event.receiver = receiver;
              event.streams = [e.stream];
              self.dispatchEvent(event);
            });
            e.stream.getTracks().forEach(function(track) {
              var receiver;
              if (RTCPeerConnection.prototype.getReceivers) {
                receiver = self.getReceivers().find(function(r) {
                  return r.track.id === track.id;
                });
              } else {
                receiver = {track: track};
              }
              var event = new Event('track');
              event.track = track;
              event.receiver = receiver;
              event.streams = [e.stream];
              this.dispatchEvent(event);
            }.bind(this));
          }.bind(this));
        }
      });
    }
  },

  shimGetSendersWithDtmf: function() {
    if (typeof window === 'object' && window.RTCPeerConnection &&
        !('getSenders' in RTCPeerConnection.prototype) &&
        'createDTMFSender' in RTCPeerConnection.prototype) {
      RTCPeerConnection.prototype.getSenders = function() {
        return this._senders || [];
      };
      var origAddStream = RTCPeerConnection.prototype.addStream;
      var origRemoveStream = RTCPeerConnection.prototype.removeStream;

      if (!RTCPeerConnection.prototype.addTrack) {
        RTCPeerConnection.prototype.addTrack = function(track, stream) {
          var pc = this;
          if (pc.signalingState === 'closed') {
            throw new DOMException(
              'The RTCPeerConnection\'s signalingState is \'closed\'.',
              'InvalidStateError');
          }
          var streams = [].slice.call(arguments, 1);
          if (streams.length !== 1 ||
              !streams[0].getTracks().find(function(t) {
                return t === track;
              })) {
            // this is not fully correct but all we can manage without
            // [[associated MediaStreams]] internal slot.
            throw new DOMException(
              'The adapter.js addTrack polyfill only supports a single ' +
              ' stream which is associated with the specified track.',
              'NotSupportedError');
          }

          pc._senders = pc._senders || [];
          var alreadyExists = pc._senders.find(function(t) {
            return t.track === track;
          });
          if (alreadyExists) {
            throw new DOMException('Track already exists.',
                'InvalidAccessError');
          }

          pc._streams = pc._streams || {};
          var oldStream = pc._streams[stream.id];
          if (oldStream) {
            oldStream.addTrack(track);
            pc.removeStream(oldStream);
            pc.addStream(oldStream);
          } else {
            var newStream = new MediaStream([track]);
            pc._streams[stream.id] = newStream;
            pc.addStream(newStream);
          }

          var sender = {
            track: track,
            get dtmf() {
              if (this._dtmf === undefined) {
                if (track.kind === 'audio') {
                  this._dtmf = pc.createDTMFSender(track);
                } else {
                  this._dtmf = null;
                }
              }
              return this._dtmf;
            }
          };
          pc._senders.push(sender);
          return sender;
        };
      }
      RTCPeerConnection.prototype.addStream = function(stream) {
        var pc = this;
        pc._senders = pc._senders || [];
        origAddStream.apply(pc, [stream]);
        stream.getTracks().forEach(function(track) {
          pc._senders.push({
            track: track,
            get dtmf() {
              if (this._dtmf === undefined) {
                if (track.kind === 'audio') {
                  this._dtmf = pc.createDTMFSender(track);
                } else {
                  this._dtmf = null;
                }
              }
              return this._dtmf;
            }
          });
        });
      };

      RTCPeerConnection.prototype.removeStream = function(stream) {
        var pc = this;
        pc._senders = pc._senders || [];
        origRemoveStream.apply(pc, [stream]);
        stream.getTracks().forEach(function(track) {
          var sender = pc._senders.find(function(s) {
            return s.track === track;
          });
          if (sender) {
            pc._senders.splice(pc._senders.indexOf(sender), 1); // remove sender
          }
        });
      };
    }
  },

  shimSourceObject: function() {
    if (typeof window === 'object') {
      if (window.HTMLMediaElement &&
        !('srcObject' in window.HTMLMediaElement.prototype)) {
        // Shim the srcObject property, once, when HTMLMediaElement is found.
        Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
          get: function() {
            return this._srcObject;
          },
          set: function(stream) {
            var self = this;
            // Use _srcObject as a private property for this shim
            this._srcObject = stream;
            if (this.src) {
              URL.revokeObjectURL(this.src);
            }

            if (!stream) {
              this.src = '';
              return undefined;
            }
            this.src = URL.createObjectURL(stream);
            // We need to recreate the blob url when a track is added or
            // removed. Doing it manually since we want to avoid a recursion.
            stream.addEventListener('addtrack', function() {
              if (self.src) {
                URL.revokeObjectURL(self.src);
              }
              self.src = URL.createObjectURL(stream);
            });
            stream.addEventListener('removetrack', function() {
              if (self.src) {
                URL.revokeObjectURL(self.src);
              }
              self.src = URL.createObjectURL(stream);
            });
          }
        });
      }
    }
  },

  shimPeerConnection: function() {
    // The RTCPeerConnection object.
    if (!window.RTCPeerConnection) {
      window.RTCPeerConnection = function(pcConfig, pcConstraints) {
        // Translate iceTransportPolicy to iceTransports,
        // see https://code.google.com/p/webrtc/issues/detail?id=4869
        // this was fixed in M56 along with unprefixing RTCPeerConnection.
        logging('PeerConnection');
        if (pcConfig && pcConfig.iceTransportPolicy) {
          pcConfig.iceTransports = pcConfig.iceTransportPolicy;
        }

        return new webkitRTCPeerConnection(pcConfig, pcConstraints);
      };
      window.RTCPeerConnection.prototype = webkitRTCPeerConnection.prototype;
      // wrap static methods. Currently just generateCertificate.
      if (webkitRTCPeerConnection.generateCertificate) {
        Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
          get: function() {
            return webkitRTCPeerConnection.generateCertificate;
          }
        });
      }
    } else {
      // migrate from non-spec RTCIceServer.url to RTCIceServer.urls
      var OrigPeerConnection = RTCPeerConnection;
      window.RTCPeerConnection = function(pcConfig, pcConstraints) {
        if (pcConfig && pcConfig.iceServers) {
          var newIceServers = [];
          for (var i = 0; i < pcConfig.iceServers.length; i++) {
            var server = pcConfig.iceServers[i];
            if (!server.hasOwnProperty('urls') &&
                server.hasOwnProperty('url')) {
              console.warn('RTCIceServer.url is deprecated! Use urls instead.');
              server = JSON.parse(JSON.stringify(server));
              server.urls = server.url;
              newIceServers.push(server);
            } else {
              newIceServers.push(pcConfig.iceServers[i]);
            }
          }
          pcConfig.iceServers = newIceServers;
        }
        return new OrigPeerConnection(pcConfig, pcConstraints);
      };
      window.RTCPeerConnection.prototype = OrigPeerConnection.prototype;
      // wrap static methods. Currently just generateCertificate.
      Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
        get: function() {
          return OrigPeerConnection.generateCertificate;
        }
      });
    }

    var origGetStats = RTCPeerConnection.prototype.getStats;
    RTCPeerConnection.prototype.getStats = function(selector,
        successCallback, errorCallback) {
      var self = this;
      var args = arguments;

      // If selector is a function then we are in the old style stats so just
      // pass back the original getStats format to avoid breaking old users.
      if (arguments.length > 0 && typeof selector === 'function') {
        return origGetStats.apply(this, arguments);
      }

      // When spec-style getStats is supported, return those when called with
      // either no arguments or the selector argument is null.
      if (origGetStats.length === 0 && (arguments.length === 0 ||
          typeof arguments[0] !== 'function')) {
        return origGetStats.apply(this, []);
      }

      var fixChromeStats_ = function(response) {
        var standardReport = {};
        var reports = response.result();
        reports.forEach(function(report) {
          var standardStats = {
            id: report.id,
            timestamp: report.timestamp,
            type: {
              localcandidate: 'local-candidate',
              remotecandidate: 'remote-candidate'
            }[report.type] || report.type
          };
          report.names().forEach(function(name) {
            standardStats[name] = report.stat(name);
          });
          standardReport[standardStats.id] = standardStats;
        });

        return standardReport;
      };

      // shim getStats with maplike support
      var makeMapStats = function(stats) {
        return new Map(Object.keys(stats).map(function(key) {
          return [key, stats[key]];
        }));
      };

      if (arguments.length >= 2) {
        var successCallbackWrapper_ = function(response) {
          args[1](makeMapStats(fixChromeStats_(response)));
        };

        return origGetStats.apply(this, [successCallbackWrapper_,
          arguments[0]]);
      }

      // promise-support
      return new Promise(function(resolve, reject) {
        origGetStats.apply(self, [
          function(response) {
            resolve(makeMapStats(fixChromeStats_(response)));
          }, reject]);
      }).then(successCallback, errorCallback);
    };

    // add promise support -- natively available in Chrome 51
    if (browserDetails.version < 51) {
      ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
          .forEach(function(method) {
            var nativeMethod = RTCPeerConnection.prototype[method];
            RTCPeerConnection.prototype[method] = function() {
              var args = arguments;
              var self = this;
              var promise = new Promise(function(resolve, reject) {
                nativeMethod.apply(self, [args[0], resolve, reject]);
              });
              if (args.length < 2) {
                return promise;
              }
              return promise.then(function() {
                args[1].apply(null, []);
              },
              function(err) {
                if (args.length >= 3) {
                  args[2].apply(null, [err]);
                }
              });
            };
          });
    }

    // promise support for createOffer and createAnswer. Available (without
    // bugs) since M52: crbug/619289
    if (browserDetails.version < 52) {
      ['createOffer', 'createAnswer'].forEach(function(method) {
        var nativeMethod = RTCPeerConnection.prototype[method];
        RTCPeerConnection.prototype[method] = function() {
          var self = this;
          if (arguments.length < 1 || (arguments.length === 1 &&
              typeof arguments[0] === 'object')) {
            var opts = arguments.length === 1 ? arguments[0] : undefined;
            return new Promise(function(resolve, reject) {
              nativeMethod.apply(self, [resolve, reject, opts]);
            });
          }
          return nativeMethod.apply(this, arguments);
        };
      });
    }

    // shim implicit creation of RTCSessionDescription/RTCIceCandidate
    ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
        .forEach(function(method) {
          var nativeMethod = RTCPeerConnection.prototype[method];
          RTCPeerConnection.prototype[method] = function() {
            arguments[0] = new ((method === 'addIceCandidate') ?
                RTCIceCandidate : RTCSessionDescription)(arguments[0]);
            return nativeMethod.apply(this, arguments);
          };
        });

    // support for addIceCandidate(null or undefined)
    var nativeAddIceCandidate =
        RTCPeerConnection.prototype.addIceCandidate;
    RTCPeerConnection.prototype.addIceCandidate = function() {
      if (!arguments[0]) {
        if (arguments[1]) {
          arguments[1].apply(null);
        }
        return Promise.resolve();
      }
      return nativeAddIceCandidate.apply(this, arguments);
    };
  }
};


// Expose public methods.
module.exports = {
  shimMediaStream: chromeShim.shimMediaStream,
  shimOnTrack: chromeShim.shimOnTrack,
  shimGetSendersWithDtmf: chromeShim.shimGetSendersWithDtmf,
  shimSourceObject: chromeShim.shimSourceObject,
  shimPeerConnection: chromeShim.shimPeerConnection,
  shimGetUserMedia: require('./getusermedia')
};

},{"../utils.js":8,"./getusermedia":4}],4:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';
var logging = require('../utils.js').log;
var browserDetails = require('../utils.js').browserDetails;

// Expose public methods.
module.exports = function() {
  var constraintsToChrome_ = function(c) {
    if (typeof c !== 'object' || c.mandatory || c.optional) {
      return c;
    }
    var cc = {};
    Object.keys(c).forEach(function(key) {
      if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
        return;
      }
      var r = (typeof c[key] === 'object') ? c[key] : {ideal: c[key]};
      if (r.exact !== undefined && typeof r.exact === 'number') {
        r.min = r.max = r.exact;
      }
      var oldname_ = function(prefix, name) {
        if (prefix) {
          return prefix + name.charAt(0).toUpperCase() + name.slice(1);
        }
        return (name === 'deviceId') ? 'sourceId' : name;
      };
      if (r.ideal !== undefined) {
        cc.optional = cc.optional || [];
        var oc = {};
        if (typeof r.ideal === 'number') {
          oc[oldname_('min', key)] = r.ideal;
          cc.optional.push(oc);
          oc = {};
          oc[oldname_('max', key)] = r.ideal;
          cc.optional.push(oc);
        } else {
          oc[oldname_('', key)] = r.ideal;
          cc.optional.push(oc);
        }
      }
      if (r.exact !== undefined && typeof r.exact !== 'number') {
        cc.mandatory = cc.mandatory || {};
        cc.mandatory[oldname_('', key)] = r.exact;
      } else {
        ['min', 'max'].forEach(function(mix) {
          if (r[mix] !== undefined) {
            cc.mandatory = cc.mandatory || {};
            cc.mandatory[oldname_(mix, key)] = r[mix];
          }
        });
      }
    });
    if (c.advanced) {
      cc.optional = (cc.optional || []).concat(c.advanced);
    }
    return cc;
  };

  var shimConstraints_ = function(constraints, func) {
    constraints = JSON.parse(JSON.stringify(constraints));
    if (constraints && constraints.audio) {
      constraints.audio = constraintsToChrome_(constraints.audio);
    }
    if (constraints && typeof constraints.video === 'object') {
      // Shim facingMode for mobile & surface pro.
      var face = constraints.video.facingMode;
      face = face && ((typeof face === 'object') ? face : {ideal: face});
      var getSupportedFacingModeLies = browserDetails.version < 61;

      if ((face && (face.exact === 'user' || face.exact === 'environment' ||
                    face.ideal === 'user' || face.ideal === 'environment')) &&
          !(navigator.mediaDevices.getSupportedConstraints &&
            navigator.mediaDevices.getSupportedConstraints().facingMode &&
            !getSupportedFacingModeLies)) {
        delete constraints.video.facingMode;
        var matches;
        if (face.exact === 'environment' || face.ideal === 'environment') {
          matches = ['back', 'rear'];
        } else if (face.exact === 'user' || face.ideal === 'user') {
          matches = ['front'];
        }
        if (matches) {
          // Look for matches in label, or use last cam for back (typical).
          return navigator.mediaDevices.enumerateDevices()
          .then(function(devices) {
            devices = devices.filter(function(d) {
              return d.kind === 'videoinput';
            });
            var dev = devices.find(function(d) {
              return matches.some(function(match) {
                return d.label.toLowerCase().indexOf(match) !== -1;
              });
            });
            if (!dev && devices.length && matches.indexOf('back') !== -1) {
              dev = devices[devices.length - 1]; // more likely the back cam
            }
            if (dev) {
              constraints.video.deviceId = face.exact ? {exact: dev.deviceId} :
                                                        {ideal: dev.deviceId};
            }
            constraints.video = constraintsToChrome_(constraints.video);
            logging('chrome: ' + JSON.stringify(constraints));
            return func(constraints);
          });
        }
      }
      constraints.video = constraintsToChrome_(constraints.video);
    }
    logging('chrome: ' + JSON.stringify(constraints));
    return func(constraints);
  };

  var shimError_ = function(e) {
    return {
      name: {
        ConstraintNotSatisfiedError: 'OverconstrainedError',
        PermissionDeniedError: 'NotAllowedError',
        TrackStartError: 'NotReadableError'
      }[e.name] || e.name,
      message: e.message,
      constraint: e.constraintName,
      toString: function() {
        return this.name + (this.message && ': ') + this.message;
      }
    };
  };

  var getUserMedia_ = function(constraints, onSuccess, onError) {
    shimConstraints_(constraints, function(c) {
      navigator.webkitGetUserMedia(c, onSuccess, function(e) {
        onError(shimError_(e));
      });
    });
  };

  navigator.getUserMedia = getUserMedia_;

  // Returns the result of getUserMedia as a Promise.
  var getUserMediaPromise_ = function(constraints) {
    return new Promise(function(resolve, reject) {
      navigator.getUserMedia(constraints, resolve, reject);
    });
  };

  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {
      getUserMedia: getUserMediaPromise_,
      enumerateDevices: function() {
        return new Promise(function(resolve) {
          var kinds = {audio: 'audioinput', video: 'videoinput'};
          return MediaStreamTrack.getSources(function(devices) {
            resolve(devices.map(function(device) {
              return {label: device.label,
                kind: kinds[device.kind],
                deviceId: device.id,
                groupId: ''};
            }));
          });
        });
      },
      getSupportedConstraints: function() {
        return {
          deviceId: true, echoCancellation: true, facingMode: true,
          frameRate: true, height: true, width: true
        };
      }
    };
  }

  // A shim for getUserMedia method on the mediaDevices object.
  // TODO(KaptenJansson) remove once implemented in Chrome stable.
  if (!navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia = function(constraints) {
      return getUserMediaPromise_(constraints);
    };
  } else {
    // Even though Chrome 45 has navigator.mediaDevices and a getUserMedia
    // function which returns a Promise, it does not accept spec-style
    // constraints.
    var origGetUserMedia = navigator.mediaDevices.getUserMedia.
        bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function(cs) {
      return shimConstraints_(cs, function(c) {
        return origGetUserMedia(c).then(function(stream) {
          if (c.audio && !stream.getAudioTracks().length ||
              c.video && !stream.getVideoTracks().length) {
            stream.getTracks().forEach(function(track) {
              track.stop();
            });
            throw new DOMException('', 'NotFoundError');
          }
          return stream;
        }, function(e) {
          return Promise.reject(shimError_(e));
        });
      });
    };
  }

  // Dummy devicechange event methods.
  // TODO(KaptenJansson) remove once implemented in Chrome stable.
  if (typeof navigator.mediaDevices.addEventListener === 'undefined') {
    navigator.mediaDevices.addEventListener = function() {
      logging('Dummy mediaDevices.addEventListener called.');
    };
  }
  if (typeof navigator.mediaDevices.removeEventListener === 'undefined') {
    navigator.mediaDevices.removeEventListener = function() {
      logging('Dummy mediaDevices.removeEventListener called.');
    };
  }
};

},{"../utils.js":8}],5:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

var browserDetails = require('../utils').browserDetails;

var firefoxShim = {
  shimOnTrack: function() {
    if (typeof window === 'object' && window.RTCPeerConnection && !('ontrack' in
        window.RTCPeerConnection.prototype)) {
      Object.defineProperty(window.RTCPeerConnection.prototype, 'ontrack', {
        get: function() {
          return this._ontrack;
        },
        set: function(f) {
          if (this._ontrack) {
            this.removeEventListener('track', this._ontrack);
            this.removeEventListener('addstream', this._ontrackpoly);
          }
          this.addEventListener('track', this._ontrack = f);
          this.addEventListener('addstream', this._ontrackpoly = function(e) {
            e.stream.getTracks().forEach(function(track) {
              var event = new Event('track');
              event.track = track;
              event.receiver = {track: track};
              event.streams = [e.stream];
              this.dispatchEvent(event);
            }.bind(this));
          }.bind(this));
        }
      });
    }
  },

  shimSourceObject: function() {
    // Firefox has supported mozSrcObject since FF22, unprefixed in 42.
    if (typeof window === 'object') {
      if (window.HTMLMediaElement &&
        !('srcObject' in window.HTMLMediaElement.prototype)) {
        // Shim the srcObject property, once, when HTMLMediaElement is found.
        Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
          get: function() {
            return this.mozSrcObject;
          },
          set: function(stream) {
            this.mozSrcObject = stream;
          }
        });
      }
    }
  },

  shimPeerConnection: function() {
    if (typeof window !== 'object' || !(window.RTCPeerConnection ||
        window.mozRTCPeerConnection)) {
      return; // probably media.peerconnection.enabled=false in about:config
    }
    // The RTCPeerConnection object.
    if (!window.RTCPeerConnection) {
      window.RTCPeerConnection = function(pcConfig, pcConstraints) {
        if (browserDetails.version < 38) {
          // .urls is not supported in FF < 38.
          // create RTCIceServers with a single url.
          if (pcConfig && pcConfig.iceServers) {
            var newIceServers = [];
            for (var i = 0; i < pcConfig.iceServers.length; i++) {
              var server = pcConfig.iceServers[i];
              if (server.hasOwnProperty('urls')) {
                for (var j = 0; j < server.urls.length; j++) {
                  var newServer = {
                    url: server.urls[j]
                  };
                  if (server.urls[j].indexOf('turn') === 0) {
                    newServer.username = server.username;
                    newServer.credential = server.credential;
                  }
                  newIceServers.push(newServer);
                }
              } else {
                newIceServers.push(pcConfig.iceServers[i]);
              }
            }
            pcConfig.iceServers = newIceServers;
          }
        }
        return new mozRTCPeerConnection(pcConfig, pcConstraints);
      };
      window.RTCPeerConnection.prototype = mozRTCPeerConnection.prototype;

      // wrap static methods. Currently just generateCertificate.
      if (mozRTCPeerConnection.generateCertificate) {
        Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
          get: function() {
            return mozRTCPeerConnection.generateCertificate;
          }
        });
      }

      window.RTCSessionDescription = mozRTCSessionDescription;
      window.RTCIceCandidate = mozRTCIceCandidate;
    }

    // shim away need for obsolete RTCIceCandidate/RTCSessionDescription.
    ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
        .forEach(function(method) {
          var nativeMethod = RTCPeerConnection.prototype[method];
          RTCPeerConnection.prototype[method] = function() {
            arguments[0] = new ((method === 'addIceCandidate') ?
                RTCIceCandidate : RTCSessionDescription)(arguments[0]);
            return nativeMethod.apply(this, arguments);
          };
        });

    // support for addIceCandidate(null or undefined)
    var nativeAddIceCandidate =
        RTCPeerConnection.prototype.addIceCandidate;
    RTCPeerConnection.prototype.addIceCandidate = function() {
      if (!arguments[0]) {
        if (arguments[1]) {
          arguments[1].apply(null);
        }
        return Promise.resolve();
      }
      return nativeAddIceCandidate.apply(this, arguments);
    };

    // shim getStats with maplike support
    var makeMapStats = function(stats) {
      var map = new Map();
      Object.keys(stats).forEach(function(key) {
        map.set(key, stats[key]);
        map[key] = stats[key];
      });
      return map;
    };

    var modernStatsTypes = {
      inboundrtp: 'inbound-rtp',
      outboundrtp: 'outbound-rtp',
      candidatepair: 'candidate-pair',
      localcandidate: 'local-candidate',
      remotecandidate: 'remote-candidate'
    };

    var nativeGetStats = RTCPeerConnection.prototype.getStats;
    RTCPeerConnection.prototype.getStats = function(selector, onSucc, onErr) {
      return nativeGetStats.apply(this, [selector || null])
        .then(function(stats) {
          if (browserDetails.version < 48) {
            stats = makeMapStats(stats);
          }
          if (browserDetails.version < 53 && !onSucc) {
            // Shim only promise getStats with spec-hyphens in type names
            // Leave callback version alone; misc old uses of forEach before Map
            try {
              stats.forEach(function(stat) {
                stat.type = modernStatsTypes[stat.type] || stat.type;
              });
            } catch (e) {
              if (e.name !== 'TypeError') {
                throw e;
              }
              // Avoid TypeError: "type" is read-only, in old versions. 34-43ish
              stats.forEach(function(stat, i) {
                stats.set(i, Object.assign({}, stat, {
                  type: modernStatsTypes[stat.type] || stat.type
                }));
              });
            }
          }
          return stats;
        })
        .then(onSucc, onErr);
    };
  }
};

// Expose public methods.
module.exports = {
  shimOnTrack: firefoxShim.shimOnTrack,
  shimSourceObject: firefoxShim.shimSourceObject,
  shimPeerConnection: firefoxShim.shimPeerConnection,
  shimGetUserMedia: require('./getusermedia')
};

},{"../utils":8,"./getusermedia":6}],6:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

var logging = require('../utils').log;
var browserDetails = require('../utils').browserDetails;

// Expose public methods.
module.exports = function() {
  var shimError_ = function(e) {
    return {
      name: {
        InternalError: 'NotReadableError',
        NotSupportedError: 'TypeError',
        PermissionDeniedError: 'NotAllowedError',
        SecurityError: 'NotAllowedError'
      }[e.name] || e.name,
      message: {
        'The operation is insecure.': 'The request is not allowed by the ' +
        'user agent or the platform in the current context.'
      }[e.message] || e.message,
      constraint: e.constraint,
      toString: function() {
        return this.name + (this.message && ': ') + this.message;
      }
    };
  };

  // getUserMedia constraints shim.
  var getUserMedia_ = function(constraints, onSuccess, onError) {
    var constraintsToFF37_ = function(c) {
      if (typeof c !== 'object' || c.require) {
        return c;
      }
      var require = [];
      Object.keys(c).forEach(function(key) {
        if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
          return;
        }
        var r = c[key] = (typeof c[key] === 'object') ?
            c[key] : {ideal: c[key]};
        if (r.min !== undefined ||
            r.max !== undefined || r.exact !== undefined) {
          require.push(key);
        }
        if (r.exact !== undefined) {
          if (typeof r.exact === 'number') {
            r. min = r.max = r.exact;
          } else {
            c[key] = r.exact;
          }
          delete r.exact;
        }
        if (r.ideal !== undefined) {
          c.advanced = c.advanced || [];
          var oc = {};
          if (typeof r.ideal === 'number') {
            oc[key] = {min: r.ideal, max: r.ideal};
          } else {
            oc[key] = r.ideal;
          }
          c.advanced.push(oc);
          delete r.ideal;
          if (!Object.keys(r).length) {
            delete c[key];
          }
        }
      });
      if (require.length) {
        c.require = require;
      }
      return c;
    };
    constraints = JSON.parse(JSON.stringify(constraints));
    if (browserDetails.version < 38) {
      logging('spec: ' + JSON.stringify(constraints));
      if (constraints.audio) {
        constraints.audio = constraintsToFF37_(constraints.audio);
      }
      if (constraints.video) {
        constraints.video = constraintsToFF37_(constraints.video);
      }
      logging('ff37: ' + JSON.stringify(constraints));
    }
    return navigator.mozGetUserMedia(constraints, onSuccess, function(e) {
      onError(shimError_(e));
    });
  };

  // Returns the result of getUserMedia as a Promise.
  var getUserMediaPromise_ = function(constraints) {
    return new Promise(function(resolve, reject) {
      getUserMedia_(constraints, resolve, reject);
    });
  };

  // Shim for mediaDevices on older versions.
  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {getUserMedia: getUserMediaPromise_,
      addEventListener: function() { },
      removeEventListener: function() { }
    };
  }
  navigator.mediaDevices.enumerateDevices =
      navigator.mediaDevices.enumerateDevices || function() {
        return new Promise(function(resolve) {
          var infos = [
            {kind: 'audioinput', deviceId: 'default', label: '', groupId: ''},
            {kind: 'videoinput', deviceId: 'default', label: '', groupId: ''}
          ];
          resolve(infos);
        });
      };

  if (browserDetails.version < 41) {
    // Work around http://bugzil.la/1169665
    var orgEnumerateDevices =
        navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
    navigator.mediaDevices.enumerateDevices = function() {
      return orgEnumerateDevices().then(undefined, function(e) {
        if (e.name === 'NotFoundError') {
          return [];
        }
        throw e;
      });
    };
  }
  if (browserDetails.version < 49) {
    var origGetUserMedia = navigator.mediaDevices.getUserMedia.
        bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function(c) {
      return origGetUserMedia(c).then(function(stream) {
        // Work around https://bugzil.la/802326
        if (c.audio && !stream.getAudioTracks().length ||
            c.video && !stream.getVideoTracks().length) {
          stream.getTracks().forEach(function(track) {
            track.stop();
          });
          throw new DOMException('The object can not be found here.',
                                 'NotFoundError');
        }
        return stream;
      }, function(e) {
        return Promise.reject(shimError_(e));
      });
    };
  }
  navigator.getUserMedia = function(constraints, onSuccess, onError) {
    if (browserDetails.version < 44) {
      return getUserMedia_(constraints, onSuccess, onError);
    }
    // Replace Firefox 44+'s deprecation warning with unprefixed version.
    console.warn('navigator.getUserMedia has been replaced by ' +
                 'navigator.mediaDevices.getUserMedia');
    navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
  };
};

},{"../utils":8}],7:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
'use strict';
var safariShim = {
  // TODO: DrAlex, should be here, double check against LayoutTests

  // TODO: once the back-end for the mac port is done, add.
  // TODO: check for webkitGTK+
  // shimPeerConnection: function() { },

  shimAddStream: function() {
    if (typeof window === 'object' && window.RTCPeerConnection &&
        !('addStream' in window.RTCPeerConnection.prototype)) {
      RTCPeerConnection.prototype.addStream = function(stream) {
        var self = this;
        stream.getTracks().forEach(function(track) {
          self.addTrack(track, stream);
        });
      };
    }
  },
  shimOnAddStream: function() {
    if (typeof window === 'object' && window.RTCPeerConnection &&
        !('onaddstream' in window.RTCPeerConnection.prototype)) {
      Object.defineProperty(window.RTCPeerConnection.prototype, 'onaddstream', {
        get: function() {
          return this._onaddstream;
        },
        set: function(f) {
          if (this._onaddstream) {
            this.removeEventListener('addstream', this._onaddstream);
            this.removeEventListener('track', this._onaddstreampoly);
          }
          this.addEventListener('addstream', this._onaddstream = f);
          this.addEventListener('track', this._onaddstreampoly = function(e) {
            var stream = e.streams[0];
            if (!this._streams) {
              this._streams = [];
            }
            if (this._streams.indexOf(stream) >= 0) {
              return;
            }
            this._streams.push(stream);
            var event = new Event('addstream');
            event.stream = e.streams[0];
            this.dispatchEvent(event);
          }.bind(this));
        }
      });
    }
  },
  shimCallbacksAPI: function() {
    if (typeof window !== 'object' || !window.RTCPeerConnection) {
      return;
    }
    var prototype = RTCPeerConnection.prototype;
    var createOffer = prototype.createOffer;
    var createAnswer = prototype.createAnswer;
    var setLocalDescription = prototype.setLocalDescription;
    var setRemoteDescription = prototype.setRemoteDescription;
    var addIceCandidate = prototype.addIceCandidate;

    prototype.createOffer = function(successCallback, failureCallback) {
      var options = (arguments.length >= 2) ? arguments[2] : arguments[0];
      var promise = createOffer.apply(this, [options]);
      if (!failureCallback) {
        return promise;
      }
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };

    prototype.createAnswer = function(successCallback, failureCallback) {
      var options = (arguments.length >= 2) ? arguments[2] : arguments[0];
      var promise = createAnswer.apply(this, [options]);
      if (!failureCallback) {
        return promise;
      }
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };

    var withCallback = function(description, successCallback, failureCallback) {
      var promise = setLocalDescription.apply(this, [description]);
      if (!failureCallback) {
        return promise;
      }
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };
    prototype.setLocalDescription = withCallback;

    withCallback = function(description, successCallback, failureCallback) {
      var promise = setRemoteDescription.apply(this, [description]);
      if (!failureCallback) {
        return promise;
      }
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };
    prototype.setRemoteDescription = withCallback;

    withCallback = function(candidate, successCallback, failureCallback) {
      var promise = addIceCandidate.apply(this, [candidate]);
      if (!failureCallback) {
        return promise;
      }
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };
    prototype.addIceCandidate = withCallback;
  },
  shimGetUserMedia: function() {
    if (!navigator.getUserMedia) {
      if (navigator.webkitGetUserMedia) {
        navigator.getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
      } else if (navigator.mediaDevices &&
          navigator.mediaDevices.getUserMedia) {
        navigator.getUserMedia = function(constraints, cb, errcb) {
          navigator.mediaDevices.getUserMedia(constraints)
          .then(cb, errcb);
        }.bind(navigator);
      }
    }
  }
};

// Expose public methods.
module.exports = {
  shimCallbacksAPI: safariShim.shimCallbacksAPI,
  shimAddStream: safariShim.shimAddStream,
  shimOnAddStream: safariShim.shimOnAddStream,
  shimGetUserMedia: safariShim.shimGetUserMedia
  // TODO
  // shimPeerConnection: safariShim.shimPeerConnection
};

},{}],8:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

var logDisabled_ = true;

// Utility methods.
var utils = {
  disableLog: function(bool) {
    if (typeof bool !== 'boolean') {
      return new Error('Argument type: ' + typeof bool +
          '. Please use a boolean.');
    }
    logDisabled_ = bool;
    return (bool) ? 'adapter.js logging disabled' :
        'adapter.js logging enabled';
  },

  log: function() {
    if (typeof window === 'object') {
      if (logDisabled_) {
        return;
      }
      if (typeof console !== 'undefined' && typeof console.log === 'function') {
        console.log.apply(console, arguments);
      }
    }
  },

  /**
   * Extract browser version out of the provided user agent string.
   *
   * @param {!string} uastring userAgent string.
   * @param {!string} expr Regular expression used as match criteria.
   * @param {!number} pos position in the version string to be returned.
   * @return {!number} browser version.
   */
  extractVersion: function(uastring, expr, pos) {
    var match = uastring.match(expr);
    return match && match.length >= pos && parseInt(match[pos], 10);
  },

  /**
   * Browser detector.
   *
   * @return {object} result containing browser and version
   *     properties.
   */
  detectBrowser: function() {
    // Returned result object.
    var result = {};
    result.browser = null;
    result.version = null;

    // Fail early if it's not a browser
    if (typeof window === 'undefined' || !window.navigator) {
      result.browser = 'Not a browser.';
      return result;
    }

    // Firefox.
    if (navigator.mozGetUserMedia) {
      result.browser = 'firefox';
      result.version = this.extractVersion(navigator.userAgent,
          /Firefox\/(\d+)\./, 1);
    } else if (navigator.webkitGetUserMedia) {
      // Chrome, Chromium, Webview, Opera, all use the chrome shim for now
      if (window.webkitRTCPeerConnection) {
        result.browser = 'chrome';
        result.version = this.extractVersion(navigator.userAgent,
          /Chrom(e|ium)\/(\d+)\./, 2);
      } else { // Safari (in an unpublished version) or unknown webkit-based.
        if (navigator.userAgent.match(/Version\/(\d+).(\d+)/)) {
          result.browser = 'safari';
          result.version = this.extractVersion(navigator.userAgent,
            /AppleWebKit\/(\d+)\./, 1);
        } else { // unknown webkit-based browser.
          result.browser = 'Unsupported webkit-based browser ' +
              'with GUM support but no WebRTC support.';
          return result;
        }
      }
    } else if (navigator.mediaDevices &&
        navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) { // Edge.
      result.browser = 'edge';
      result.version = this.extractVersion(navigator.userAgent,
          /Edge\/(\d+).(\d+)$/, 2);
    } else if (navigator.mediaDevices &&
        navigator.userAgent.match(/AppleWebKit\/(\d+)\./)) {
        // Safari, with webkitGetUserMedia removed.
      result.browser = 'safari';
      result.version = this.extractVersion(navigator.userAgent,
          /AppleWebKit\/(\d+)\./, 1);
    } else { // Default fallthrough: not supported.
      result.browser = 'Not a supported browser.';
      return result;
    }

    return result;
  },

  // shimCreateObjectURL must be called before shimSourceObject to avoid loop.

  shimCreateObjectURL: function() {
    if (!(typeof window === 'object' && window.HTMLMediaElement &&
          'srcObject' in window.HTMLMediaElement.prototype)) {
      // Only shim CreateObjectURL using srcObject if srcObject exists.
      return undefined;
    }

    var nativeCreateObjectURL = URL.createObjectURL.bind(URL);
    var nativeRevokeObjectURL = URL.revokeObjectURL.bind(URL);
    var streams = new Map(), newId = 0;

    URL.createObjectURL = function(stream) {
      if ('getTracks' in stream) {
        var url = 'polyblob:' + (++newId);
        streams.set(url, stream);
        console.log('URL.createObjectURL(stream) is deprecated! ' +
                    'Use elem.srcObject = stream instead!');
        return url;
      }
      return nativeCreateObjectURL(stream);
    };
    URL.revokeObjectURL = function(url) {
      nativeRevokeObjectURL(url);
      streams.delete(url);
    };

    var dsc = Object.getOwnPropertyDescriptor(window.HTMLMediaElement.prototype,
                                              'src');
    Object.defineProperty(window.HTMLMediaElement.prototype, 'src', {
      get: function() {
        return dsc.get.apply(this);
      },
      set: function(url) {
        this.srcObject = streams.get(url) || null;
        return dsc.set.apply(this, [url]);
      }
    });

    var nativeSetAttribute = HTMLMediaElement.prototype.setAttribute;
    HTMLMediaElement.prototype.setAttribute = function() {
      if (arguments.length === 2 &&
          ('' + arguments[0]).toLowerCase() === 'src') {
        this.srcObject = streams.get(arguments[1]) || null;
      }
      return nativeSetAttribute.apply(this, arguments);
    };
  }
};

// Export.
module.exports = {
  log: utils.log,
  disableLog: utils.disableLog,
  browserDetails: utils.detectBrowser(),
  extractVersion: utils.extractVersion,
  shimCreateObjectURL: utils.shimCreateObjectURL,
  detectBrowser: utils.detectBrowser.bind(utils)
};

},{}]},{},[2]);

var __extends$10 = (commonjsGlobal && commonjsGlobal.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};

/**
 * A unit of work to be executed in a {@link Scheduler}. An action is typically
 * created from within a Scheduler and an RxJS user does not need to concern
 * themselves about creating and manipulating an Action.
 *
 * ```ts
 * class Action<T> extends Subscription {
 *   new (scheduler: Scheduler, work: (state?: T) => void);
 *   schedule(state?: T, delay: number = 0): Subscription;
 * }
 * ```
 *
 * @class Action<T>
 */
var Action = (function (_super) {
    __extends$10(Action, _super);
    function Action(scheduler, work) {
        _super.call(this);
    }
    /**
     * Schedules this action on its parent Scheduler for execution. May be passed
     * some context object, `state`. May happen at some point in the future,
     * according to the `delay` parameter, if specified.
     * @param {T} [state] Some contextual data that the `work` function uses when
     * called by the Scheduler.
     * @param {number} [delay] Time to wait before executing the work, where the
     * time unit is implicit and defined by the Scheduler.
     * @return {void}
     */
    Action.prototype.schedule = function (state, delay) {
        if (delay === void 0) { delay = 0; }
        return this;
    };
    return Action;
}(Subscription_1.Subscription));
var Action_2 = Action;


var Action_1 = {
	Action: Action_2
};

var __extends$9 = (commonjsGlobal && commonjsGlobal.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};


/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
var AsyncAction = (function (_super) {
    __extends$9(AsyncAction, _super);
    function AsyncAction(scheduler, work) {
        _super.call(this, scheduler, work);
        this.scheduler = scheduler;
        this.work = work;
        this.pending = false;
    }
    AsyncAction.prototype.schedule = function (state, delay) {
        if (delay === void 0) { delay = 0; }
        if (this.closed) {
            return this;
        }
        // Always replace the current state with the new state.
        this.state = state;
        // Set the pending flag indicating that this action has been scheduled, or
        // has recursively rescheduled itself.
        this.pending = true;
        var id = this.id;
        var scheduler = this.scheduler;
        //
        // Important implementation note:
        //
        // Actions only execute once by default, unless rescheduled from within the
        // scheduled callback. This allows us to implement single and repeat
        // actions via the same code path, without adding API surface area, as well
        // as mimic traditional recursion but across asynchronous boundaries.
        //
        // However, JS runtimes and timers distinguish between intervals achieved by
        // serial `setTimeout` calls vs. a single `setInterval` call. An interval of
        // serial `setTimeout` calls can be individually delayed, which delays
        // scheduling the next `setTimeout`, and so on. `setInterval` attempts to
        // guarantee the interval callback will be invoked more precisely to the
        // interval period, regardless of load.
        //
        // Therefore, we use `setInterval` to schedule single and repeat actions.
        // If the action reschedules itself with the same delay, the interval is not
        // canceled. If the action doesn't reschedule, or reschedules with a
        // different delay, the interval will be canceled after scheduled callback
        // execution.
        //
        if (id != null) {
            this.id = this.recycleAsyncId(scheduler, id, delay);
        }
        this.delay = delay;
        // If this action has already an async Id, don't request a new one.
        this.id = this.id || this.requestAsyncId(scheduler, this.id, delay);
        return this;
    };
    AsyncAction.prototype.requestAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        return root.root.setInterval(scheduler.flush.bind(scheduler, this), delay);
    };
    AsyncAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        // If this action is rescheduled with the same delay time, don't clear the interval id.
        if (delay !== null && this.delay === delay && this.pending === false) {
            return id;
        }
        // Otherwise, if the action's delay time is different from the current delay,
        // or the action has been rescheduled before it's executed, clear the interval id
        return root.root.clearInterval(id) && undefined || undefined;
    };
    /**
     * Immediately executes this action and the `work` it contains.
     * @return {any}
     */
    AsyncAction.prototype.execute = function (state, delay) {
        if (this.closed) {
            return new Error('executing a cancelled action');
        }
        this.pending = false;
        var error = this._execute(state, delay);
        if (error) {
            return error;
        }
        else if (this.pending === false && this.id != null) {
            // Dequeue if the action didn't reschedule itself. Don't call
            // unsubscribe(), because the action could reschedule later.
            // For example:
            // ```
            // scheduler.schedule(function doWork(counter) {
            //   /* ... I'm a busy worker bee ... */
            //   var originalAction = this;
            //   /* wait 100ms before rescheduling the action */
            //   setTimeout(function () {
            //     originalAction.schedule(counter + 1);
            //   }, 100);
            // }, 1000);
            // ```
            this.id = this.recycleAsyncId(this.scheduler, this.id, null);
        }
    };
    AsyncAction.prototype._execute = function (state, delay) {
        var errored = false;
        var errorValue = undefined;
        try {
            this.work(state);
        }
        catch (e) {
            errored = true;
            errorValue = !!e && e || new Error(e);
        }
        if (errored) {
            this.unsubscribe();
            return errorValue;
        }
    };
    AsyncAction.prototype._unsubscribe = function () {
        var id = this.id;
        var scheduler = this.scheduler;
        var actions = scheduler.actions;
        var index = actions.indexOf(this);
        this.work = null;
        this.delay = null;
        this.state = null;
        this.pending = false;
        this.scheduler = null;
        if (index !== -1) {
            actions.splice(index, 1);
        }
        if (id != null) {
            this.id = this.recycleAsyncId(scheduler, id, null);
        }
    };
    return AsyncAction;
}(Action_1.Action));
var AsyncAction_2 = AsyncAction;


var AsyncAction_1 = {
	AsyncAction: AsyncAction_2
};

var __extends$8 = (commonjsGlobal && commonjsGlobal.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};

/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
var QueueAction = (function (_super) {
    __extends$8(QueueAction, _super);
    function QueueAction(scheduler, work) {
        _super.call(this, scheduler, work);
        this.scheduler = scheduler;
        this.work = work;
    }
    QueueAction.prototype.schedule = function (state, delay) {
        if (delay === void 0) { delay = 0; }
        if (delay > 0) {
            return _super.prototype.schedule.call(this, state, delay);
        }
        this.delay = delay;
        this.state = state;
        this.scheduler.flush(this);
        return this;
    };
    QueueAction.prototype.execute = function (state, delay) {
        return (delay > 0 || this.closed) ?
            _super.prototype.execute.call(this, state, delay) :
            this._execute(state, delay);
    };
    QueueAction.prototype.requestAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        // If delay exists and is greater than 0, or if the delay is null (the
        // action wasn't rescheduled) but was originally scheduled as an async
        // action, then recycle as an async action.
        if ((delay !== null && delay > 0) || (delay === null && this.delay > 0)) {
            return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
        }
        // Otherwise flush the scheduler starting with this action.
        return scheduler.flush(this);
    };
    return QueueAction;
}(AsyncAction_1.AsyncAction));
var QueueAction_2 = QueueAction;


var QueueAction_1 = {
	QueueAction: QueueAction_2
};

/**
 * An execution context and a data structure to order tasks and schedule their
 * execution. Provides a notion of (potentially virtual) time, through the
 * `now()` getter method.
 *
 * Each unit of work in a Scheduler is called an {@link Action}.
 *
 * ```ts
 * class Scheduler {
 *   now(): number;
 *   schedule(work, delay?, state?): Subscription;
 * }
 * ```
 *
 * @class Scheduler
 */
var Scheduler = (function () {
    function Scheduler(SchedulerAction, now) {
        if (now === void 0) { now = Scheduler.now; }
        this.SchedulerAction = SchedulerAction;
        this.now = now;
    }
    /**
     * Schedules a function, `work`, for execution. May happen at some point in
     * the future, according to the `delay` parameter, if specified. May be passed
     * some context object, `state`, which will be passed to the `work` function.
     *
     * The given arguments will be processed an stored as an Action object in a
     * queue of actions.
     *
     * @param {function(state: ?T): ?Subscription} work A function representing a
     * task, or some unit of work to be executed by the Scheduler.
     * @param {number} [delay] Time to wait before executing the work, where the
     * time unit is implicit and defined by the Scheduler itself.
     * @param {T} [state] Some contextual data that the `work` function uses when
     * called by the Scheduler.
     * @return {Subscription} A subscription in order to be able to unsubscribe
     * the scheduled work.
     */
    Scheduler.prototype.schedule = function (work, delay, state) {
        if (delay === void 0) { delay = 0; }
        return new this.SchedulerAction(this, work).schedule(state, delay);
    };
    Scheduler.now = Date.now ? Date.now : function () { return +new Date(); };
    return Scheduler;
}());
var Scheduler_2 = Scheduler;


var Scheduler_1 = {
	Scheduler: Scheduler_2
};

var __extends$12 = (commonjsGlobal && commonjsGlobal.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};

var AsyncScheduler = (function (_super) {
    __extends$12(AsyncScheduler, _super);
    function AsyncScheduler() {
        _super.apply(this, arguments);
        this.actions = [];
        /**
         * A flag to indicate whether the Scheduler is currently executing a batch of
         * queued actions.
         * @type {boolean}
         */
        this.active = false;
        /**
         * An internal ID used to track the latest asynchronous task such as those
         * coming from `setTimeout`, `setInterval`, `requestAnimationFrame`, and
         * others.
         * @type {any}
         */
        this.scheduled = undefined;
    }
    AsyncScheduler.prototype.flush = function (action) {
        var actions = this.actions;
        if (this.active) {
            actions.push(action);
            return;
        }
        var error;
        this.active = true;
        do {
            if (error = action.execute(action.state, action.delay)) {
                break;
            }
        } while (action = actions.shift()); // exhaust the scheduler queue
        this.active = false;
        if (error) {
            while (action = actions.shift()) {
                action.unsubscribe();
            }
            throw error;
        }
    };
    return AsyncScheduler;
}(Scheduler_1.Scheduler));
var AsyncScheduler_2 = AsyncScheduler;


var AsyncScheduler_1 = {
	AsyncScheduler: AsyncScheduler_2
};

var __extends$11 = (commonjsGlobal && commonjsGlobal.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};

var QueueScheduler = (function (_super) {
    __extends$11(QueueScheduler, _super);
    function QueueScheduler() {
        _super.apply(this, arguments);
    }
    return QueueScheduler;
}(AsyncScheduler_1.AsyncScheduler));
var QueueScheduler_2 = QueueScheduler;


var QueueScheduler_1 = {
	QueueScheduler: QueueScheduler_2
};

/**
 *
 * Queue Scheduler
 *
 * <span class="informal">Put every next task on a queue, instead of executing it immediately</span>
 *
 * `queue` scheduler, when used with delay, behaves the same as {@link async} scheduler.
 *
 * When used without delay, it schedules given task synchronously - executes it right when
 * it is scheduled. However when called recursively, that is when inside the scheduled task,
 * another task is scheduled with queue scheduler, instead of executing immediately as well,
 * that task will be put on a queue and wait for current one to finish.
 *
 * This means that when you execute task with `queue` scheduler, you are sure it will end
 * before any other task scheduled with that scheduler will start.
 *
 * @examples <caption>Schedule recursively first, then do something</caption>
 *
 * Rx.Scheduler.queue.schedule(() => {
 *   Rx.Scheduler.queue.schedule(() => console.log('second')); // will not happen now, but will be put on a queue
 *
 *   console.log('first');
 * });
 *
 * // Logs:
 * // "first"
 * // "second"
 *
 *
 * @example <caption>Reschedule itself recursively</caption>
 *
 * Rx.Scheduler.queue.schedule(function(state) {
 *   if (state !== 0) {
 *     console.log('before', state);
 *     this.schedule(state - 1); // `this` references currently executing Action,
 *                               // which we reschedule with new state
 *     console.log('after', state);
 *   }
 * }, 0, 3);
 *
 * // In scheduler that runs recursively, you would expect:
 * // "before", 3
 * // "before", 2
 * // "before", 1
 * // "after", 1
 * // "after", 2
 * // "after", 3
 *
 * // But with queue it logs:
 * // "before", 3
 * // "after", 3
 * // "before", 2
 * // "after", 2
 * // "before", 1
 * // "after", 1
 *
 *
 * @static true
 * @name queue
 * @owner Scheduler
 */
var queue_1 = new QueueScheduler_1.QueueScheduler(QueueAction_1.QueueAction);


var queue = {
	queue: queue_1
};

/**
 * Represents a push-based event or value that an {@link Observable} can emit.
 * This class is particularly useful for operators that manage notifications,
 * like {@link materialize}, {@link dematerialize}, {@link observeOn}, and
 * others. Besides wrapping the actual delivered value, it also annotates it
 * with metadata of, for instance, what type of push message it is (`next`,
 * `error`, or `complete`).
 *
 * @see {@link materialize}
 * @see {@link dematerialize}
 * @see {@link observeOn}
 *
 * @class Notification<T>
 */
var Notification = (function () {
    function Notification(kind, value, error) {
        this.kind = kind;
        this.value = value;
        this.error = error;
        this.hasValue = kind === 'N';
    }
    /**
     * Delivers to the given `observer` the value wrapped by this Notification.
     * @param {Observer} observer
     * @return
     */
    Notification.prototype.observe = function (observer) {
        switch (this.kind) {
            case 'N':
                return observer.next && observer.next(this.value);
            case 'E':
                return observer.error && observer.error(this.error);
            case 'C':
                return observer.complete && observer.complete();
        }
    };
    /**
     * Given some {@link Observer} callbacks, deliver the value represented by the
     * current Notification to the correctly corresponding callback.
     * @param {function(value: T): void} next An Observer `next` callback.
     * @param {function(err: any): void} [error] An Observer `error` callback.
     * @param {function(): void} [complete] An Observer `complete` callback.
     * @return {any}
     */
    Notification.prototype.do = function (next, error, complete) {
        var kind = this.kind;
        switch (kind) {
            case 'N':
                return next && next(this.value);
            case 'E':
                return error && error(this.error);
            case 'C':
                return complete && complete();
        }
    };
    /**
     * Takes an Observer or its individual callback functions, and calls `observe`
     * or `do` methods accordingly.
     * @param {Observer|function(value: T): void} nextOrObserver An Observer or
     * the `next` callback.
     * @param {function(err: any): void} [error] An Observer `error` callback.
     * @param {function(): void} [complete] An Observer `complete` callback.
     * @return {any}
     */
    Notification.prototype.accept = function (nextOrObserver, error, complete) {
        if (nextOrObserver && typeof nextOrObserver.next === 'function') {
            return this.observe(nextOrObserver);
        }
        else {
            return this.do(nextOrObserver, error, complete);
        }
    };
    /**
     * Returns a simple Observable that just delivers the notification represented
     * by this Notification instance.
     * @return {any}
     */
    Notification.prototype.toObservable = function () {
        var kind = this.kind;
        switch (kind) {
            case 'N':
                return Observable_1.Observable.of(this.value);
            case 'E':
                return Observable_1.Observable.throw(this.error);
            case 'C':
                return Observable_1.Observable.empty();
        }
        throw new Error('unexpected notification kind value');
    };
    /**
     * A shortcut to create a Notification instance of the type `next` from a
     * given value.
     * @param {T} value The `next` value.
     * @return {Notification<T>} The "next" Notification representing the
     * argument.
     */
    Notification.createNext = function (value) {
        if (typeof value !== 'undefined') {
            return new Notification('N', value);
        }
        return this.undefinedValueNotification;
    };
    /**
     * A shortcut to create a Notification instance of the type `error` from a
     * given error.
     * @param {any} [err] The `error` error.
     * @return {Notification<T>} The "error" Notification representing the
     * argument.
     */
    Notification.createError = function (err) {
        return new Notification('E', undefined, err);
    };
    /**
     * A shortcut to create a Notification instance of the type `complete`.
     * @return {Notification<any>} The valueless "complete" Notification.
     */
    Notification.createComplete = function () {
        return this.completeNotification;
    };
    Notification.completeNotification = new Notification('C');
    Notification.undefinedValueNotification = new Notification('N', undefined);
    return Notification;
}());
var Notification_2 = Notification;


var Notification_1 = {
	Notification: Notification_2
};

var __extends$13 = (commonjsGlobal && commonjsGlobal.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};


/**
 *
 * Re-emits all notifications from source Observable with specified scheduler.
 *
 * <span class="informal">Ensure a specific scheduler is used, from outside of an Observable.</span>
 *
 * `observeOn` is an operator that accepts a scheduler as a first parameter, which will be used to reschedule
 * notifications emitted by the source Observable. It might be useful, if you do not have control over
 * internal scheduler of a given Observable, but want to control when its values are emitted nevertheless.
 *
 * Returned Observable emits the same notifications (nexted values, complete and error events) as the source Observable,
 * but rescheduled with provided scheduler. Note that this doesn't mean that source Observables internal
 * scheduler will be replaced in any way. Original scheduler still will be used, but when the source Observable emits
 * notification, it will be immediately scheduled again - this time with scheduler passed to `observeOn`.
 * An anti-pattern would be calling `observeOn` on Observable that emits lots of values synchronously, to split
 * that emissions into asynchronous chunks. For this to happen, scheduler would have to be passed into the source
 * Observable directly (usually into the operator that creates it). `observeOn` simply delays notifications a
 * little bit more, to ensure that they are emitted at expected moments.
 *
 * As a matter of fact, `observeOn` accepts second parameter, which specifies in milliseconds with what delay notifications
 * will be emitted. The main difference between {@link delay} operator and `observeOn` is that `observeOn`
 * will delay all notifications - including error notifications - while `delay` will pass through error
 * from source Observable immediately when it is emitted. In general it is highly recommended to use `delay` operator
 * for any kind of delaying of values in the stream, while using `observeOn` to specify which scheduler should be used
 * for notification emissions in general.
 *
 * @example <caption>Ensure values in subscribe are called just before browser repaint.</caption>
 * const intervals = Rx.Observable.interval(10); // Intervals are scheduled
 *                                               // with async scheduler by default...
 *
 * intervals
 * .observeOn(Rx.Scheduler.animationFrame)       // ...but we will observe on animationFrame
 * .subscribe(val => {                           // scheduler to ensure smooth animation.
 *   someDiv.style.height = val + 'px';
 * });
 *
 * @see {@link delay}
 *
 * @param {IScheduler} scheduler Scheduler that will be used to reschedule notifications from source Observable.
 * @param {number} [delay] Number of milliseconds that states with what delay every notification should be rescheduled.
 * @return {Observable<T>} Observable that emits the same notifications as the source Observable,
 * but with provided scheduler.
 *
 * @method observeOn
 * @owner Observable
 */
function observeOn(scheduler, delay) {
    if (delay === void 0) { delay = 0; }
    return this.lift(new ObserveOnOperator(scheduler, delay));
}
var observeOn_2 = observeOn;
var ObserveOnOperator = (function () {
    function ObserveOnOperator(scheduler, delay) {
        if (delay === void 0) { delay = 0; }
        this.scheduler = scheduler;
        this.delay = delay;
    }
    ObserveOnOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new ObserveOnSubscriber(subscriber, this.scheduler, this.delay));
    };
    return ObserveOnOperator;
}());
var ObserveOnOperator_1 = ObserveOnOperator;
/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
var ObserveOnSubscriber = (function (_super) {
    __extends$13(ObserveOnSubscriber, _super);
    function ObserveOnSubscriber(destination, scheduler, delay) {
        if (delay === void 0) { delay = 0; }
        _super.call(this, destination);
        this.scheduler = scheduler;
        this.delay = delay;
    }
    ObserveOnSubscriber.dispatch = function (arg) {
        var notification = arg.notification, destination = arg.destination;
        notification.observe(destination);
        this.unsubscribe();
    };
    ObserveOnSubscriber.prototype.scheduleMessage = function (notification) {
        this.add(this.scheduler.schedule(ObserveOnSubscriber.dispatch, this.delay, new ObserveOnMessage(notification, this.destination)));
    };
    ObserveOnSubscriber.prototype._next = function (value) {
        this.scheduleMessage(Notification_1.Notification.createNext(value));
    };
    ObserveOnSubscriber.prototype._error = function (err) {
        this.scheduleMessage(Notification_1.Notification.createError(err));
    };
    ObserveOnSubscriber.prototype._complete = function () {
        this.scheduleMessage(Notification_1.Notification.createComplete());
    };
    return ObserveOnSubscriber;
}(Subscriber_1.Subscriber));
var ObserveOnSubscriber_1 = ObserveOnSubscriber;
var ObserveOnMessage = (function () {
    function ObserveOnMessage(notification, destination) {
        this.notification = notification;
        this.destination = destination;
    }
    return ObserveOnMessage;
}());
var ObserveOnMessage_1 = ObserveOnMessage;


var observeOn_1 = {
	observeOn: observeOn_2,
	ObserveOnOperator: ObserveOnOperator_1,
	ObserveOnSubscriber: ObserveOnSubscriber_1,
	ObserveOnMessage: ObserveOnMessage_1
};

var __extends$7 = (commonjsGlobal && commonjsGlobal.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};






/**
 * @class ReplaySubject<T>
 */
var ReplaySubject = (function (_super) {
    __extends$7(ReplaySubject, _super);
    function ReplaySubject(bufferSize, windowTime, scheduler) {
        if (bufferSize === void 0) { bufferSize = Number.POSITIVE_INFINITY; }
        if (windowTime === void 0) { windowTime = Number.POSITIVE_INFINITY; }
        _super.call(this);
        this.scheduler = scheduler;
        this._events = [];
        this._bufferSize = bufferSize < 1 ? 1 : bufferSize;
        this._windowTime = windowTime < 1 ? 1 : windowTime;
    }
    ReplaySubject.prototype.next = function (value) {
        var now = this._getNow();
        this._events.push(new ReplayEvent(now, value));
        this._trimBufferThenGetEvents();
        _super.prototype.next.call(this, value);
    };
    ReplaySubject.prototype._subscribe = function (subscriber) {
        var _events = this._trimBufferThenGetEvents();
        var scheduler = this.scheduler;
        var subscription;
        if (this.closed) {
            throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
        else if (this.hasError) {
            subscription = Subscription_1.Subscription.EMPTY;
        }
        else if (this.isStopped) {
            subscription = Subscription_1.Subscription.EMPTY;
        }
        else {
            this.observers.push(subscriber);
            subscription = new SubjectSubscription_1.SubjectSubscription(this, subscriber);
        }
        if (scheduler) {
            subscriber.add(subscriber = new observeOn_1.ObserveOnSubscriber(subscriber, scheduler));
        }
        var len = _events.length;
        for (var i = 0; i < len && !subscriber.closed; i++) {
            subscriber.next(_events[i].value);
        }
        if (this.hasError) {
            subscriber.error(this.thrownError);
        }
        else if (this.isStopped) {
            subscriber.complete();
        }
        return subscription;
    };
    ReplaySubject.prototype._getNow = function () {
        return (this.scheduler || queue.queue).now();
    };
    ReplaySubject.prototype._trimBufferThenGetEvents = function () {
        var now = this._getNow();
        var _bufferSize = this._bufferSize;
        var _windowTime = this._windowTime;
        var _events = this._events;
        var eventsCount = _events.length;
        var spliceCount = 0;
        // Trim events that fall out of the time window.
        // Start at the front of the list. Break early once
        // we encounter an event that falls within the window.
        while (spliceCount < eventsCount) {
            if ((now - _events[spliceCount].time) < _windowTime) {
                break;
            }
            spliceCount++;
        }
        if (eventsCount > _bufferSize) {
            spliceCount = Math.max(spliceCount, eventsCount - _bufferSize);
        }
        if (spliceCount > 0) {
            _events.splice(0, spliceCount);
        }
        return _events;
    };
    return ReplaySubject;
}(Subject_1.Subject));
var ReplaySubject_2 = ReplaySubject;
var ReplayEvent = (function () {
    function ReplayEvent(time, value) {
        this.time = time;
        this.value = value;
    }
    return ReplayEvent;
}());

var __extends$14 = (commonjsGlobal && commonjsGlobal.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};

/**
 * Applies a given `project` function to each value emitted by the source
 * Observable, and emits the resulting values as an Observable.
 *
 * <span class="informal">Like [Array.prototype.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map),
 * it passes each source value through a transformation function to get
 * corresponding output values.</span>
 *
 * <img src="./img/map.png" width="100%">
 *
 * Similar to the well known `Array.prototype.map` function, this operator
 * applies a projection to each value and emits that projection in the output
 * Observable.
 *
 * @example <caption>Map every click to the clientX position of that click</caption>
 * var clicks = Rx.Observable.fromEvent(document, 'click');
 * var positions = clicks.map(ev => ev.clientX);
 * positions.subscribe(x => console.log(x));
 *
 * @see {@link mapTo}
 * @see {@link pluck}
 *
 * @param {function(value: T, index: number): R} project The function to apply
 * to each `value` emitted by the source Observable. The `index` parameter is
 * the number `i` for the i-th emission that has happened since the
 * subscription, starting from the number `0`.
 * @param {any} [thisArg] An optional argument to define what `this` is in the
 * `project` function.
 * @return {Observable<R>} An Observable that emits the values from the source
 * Observable transformed by the given `project` function.
 * @method map
 * @owner Observable
 */
function map$2(project, thisArg) {
    if (typeof project !== 'function') {
        throw new TypeError('argument is not a function. Are you looking for `mapTo()`?');
    }
    return this.lift(new MapOperator(project, thisArg));
}
var map_2 = map$2;
var MapOperator = (function () {
    function MapOperator(project, thisArg) {
        this.project = project;
        this.thisArg = thisArg;
    }
    MapOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new MapSubscriber(subscriber, this.project, this.thisArg));
    };
    return MapOperator;
}());
var MapOperator_1 = MapOperator;
/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
var MapSubscriber = (function (_super) {
    __extends$14(MapSubscriber, _super);
    function MapSubscriber(destination, project, thisArg) {
        _super.call(this, destination);
        this.project = project;
        this.count = 0;
        this.thisArg = thisArg || this;
    }
    // NOTE: This looks unoptimized, but it's actually purposefully NOT
    // using try/catch optimizations.
    MapSubscriber.prototype._next = function (value) {
        var result;
        try {
            result = this.project.call(this.thisArg, value, this.count++);
        }
        catch (err) {
            this.destination.error(err);
            return;
        }
        this.destination.next(result);
    };
    return MapSubscriber;
}(Subscriber_1.Subscriber));


var map_1 = {
	map: map_2,
	MapOperator: MapOperator_1
};

Observable_1.Observable.prototype.map = map_1.map;

var wrtc = Util.require(Util.WEB_RTC);
var CloseEvent = Util.require(Util.CLOSE_EVENT);

var ID$1 = 0;

var CONNECTION_TIMEOUT = 10000;

/**
 * Service class responsible to establish `RTCDataChannel` between two clients via
 * signaling server or `WebChannel`.
 *
 */
var WebRTCService = function (_InnerMessageMixin) {
  inherits(WebRTCService, _InnerMessageMixin);

  function WebRTCService(wc, iceServers) {
    classCallCheck(this, WebRTCService);

    var _this = possibleConstructorReturn(this, (WebRTCService.__proto__ || Object.getPrototypeOf(WebRTCService)).call(this, ID$1, webRTC.Message, wc._msgStream));

    _this.wc = wc;
    _this.rtcConfiguration = { iceServers: iceServers };
    return _this;
  }

  createClass(WebRTCService, [{
    key: 'onConnectionFromWebChannel',
    value: function onConnectionFromWebChannel() {
      var _this2 = this;

      if (WebRTCChecker.isSupported) {
        return this.onDataChannel(this.innerStream.map(function (_ref) {
          var msg = _ref.msg,
              senderId = _ref.senderId;
          return { msg: msg, id: senderId };
        }), function (msg, id) {
          return _this2.wc._sendTo({ recipientId: id, content: get(WebRTCService.prototype.__proto__ || Object.getPrototypeOf(WebRTCService.prototype), 'encode', _this2).call(_this2, msg) });
        });
      }
      throw new Error('Peer is not listening on RTCDataChannel');
    }

    /**
     * Establish an `RTCDataChannel` with a peer identified by `id` trough `WebChannel`.
     * Starts by sending an **SDP offer**.
     *
     * @param {number} id Peer id
     *
     * @returns {Promise<RTCDataChannel>} Data channel between you and `id` peer
     */

  }, {
    key: 'connectOverWebChannel',
    value: function connectOverWebChannel(id) {
      var _this3 = this;

      return this.createDataChannel(this.innerStream.filter(function (_ref2) {
        var senderId = _ref2.senderId;
        return senderId === id;
      }), function (msg) {
        return _this3.wc._sendTo({ recipientId: id, content: get(WebRTCService.prototype.__proto__ || Object.getPrototypeOf(WebRTCService.prototype), 'encode', _this3).call(_this3, msg) });
      }, id);
    }

    /**
     * Listen on `RTCDataChannel` from Signaling server. Starts to listen on **SDP answer**.
     *
     * @param {Subject} signalingStream Specific to Netflux RxJs Subject connection with Signaling server
     *
     * @returns {Observable<RTCDataChannel>} Observable emitting `RTCDataChannel`. Can emit errors and completes when the stream with Signaling server has completed.
     */

  }, {
    key: 'onConnectionFromSignaling',
    value: function onConnectionFromSignaling(signalingStream) {
      if (WebRTCChecker.isSupported) {
        return this.onDataChannel(signalingStream.filter(function (msg) {
          return 'id' in msg && 'data' in msg;
        }).map(function (_ref3) {
          var data = _ref3.data,
              id = _ref3.id;
          return { msg: data, id: id };
        }), function (msg, id) {
          return signalingStream.send(JSON.stringify({ id: id, data: msg }));
        });
      }
      throw new Error('Peer is not listening on RTCDataChannel');
    }

    /**
     * Establish an `RTCDataChannel` with a peer identified by `id` trough Signaling server.
     * Starts by sending an **SDP offer**.
     *
     * @param {Subject} signalingStream Specific to Netflux RxJs Subject connection with Signaling server
     *
     * @returns {Promise<RTCDataChannel>} Data channel between you and `id` peer
     */

  }, {
    key: 'connectOverSignaling',
    value: function connectOverSignaling(signalingStream) {
      return this.createDataChannel(signalingStream.filter(function (msg) {
        return 'data' in msg;
      }).map(function (msg) {
        return msg.data;
      }), function (msg) {
        return signalingStream.send(JSON.stringify({ data: msg }));
      });
    }

    /**
     * @private
     * @param  {Subject} stream
     * @param  {function(msg: Object): void} send
     * @param  {string} [peerId]
     * @return {Promise<RTCDataChannel>}
     */

  }, {
    key: 'createDataChannel',
    value: function createDataChannel(stream, send) {
      var _this4 = this;

      var peerId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

      var pc = new wrtc.RTCPeerConnection(this.rtcConfiguration);
      var remoteCandidateStream = new ReplaySubject_2();
      this.createLocalCandidateStream(pc).subscribe(function (candidate) {
        return send({ candidate: candidate });
      }, function (err) {
        return console.warn(err);
      }, function () {
        return send({ candidate: '' });
      });

      return new Promise(function (resolve, reject) {
        var subs = stream.subscribe(function (msg) {
          if (msg.answer !== undefined) {
            pc.setRemoteDescription(msg.answer).then(function () {
              remoteCandidateStream.subscribe(function (candidate) {
                pc.addIceCandidate(new wrtc.RTCIceCandidate(candidate)).catch(reject);
              }, function (err) {
                return console.warn(err);
              }, function () {
                return subs.unsubscribe();
              });
            }).catch(reject);
          } else {
            if (msg.candidate !== '') {
              remoteCandidateStream.next(msg.candidate);
            } else {
              remoteCandidateStream.complete();
            }
          }
        }, reject, function () {
          return reject(new Error('Failed to establish RTCDataChannel: the connection with Signaling server was closed'));
        });

        _this4.openDataChannel(pc, true, peerId).then(resolve).catch(reject);

        pc.createOffer().then(function (offer) {
          return pc.setLocalDescription(offer);
        }).then(function () {
          return send({ offer: {
              type: pc.localDescription.type,
              sdp: pc.localDescription.sdp
            } });
        }).catch(reject);
      });
    }

    /**
     * @private
     * @param  {Subject} stream
     * @param  {function(msg: Object, id: number): void} send
     * @param  {functioin} initFunc
     * @param  {RTCConfiguration} rtcConfiguration
     * @return {Observable<Channel>}
     */

  }, {
    key: 'onDataChannel',
    value: function onDataChannel(stream, send) {
      var _this5 = this;

      return Observable_2.create(function (observer) {
        var clients = new Map();
        stream.subscribe(function (_ref4) {
          var msg = _ref4.msg,
              id = _ref4.id;

          var client = clients.get(id);
          var pc = void 0;
          var remoteCandidateStream = void 0;
          if (client) {
            var _client = slicedToArray(client, 2);

            pc = _client[0];
            remoteCandidateStream = _client[1];
          } else {
            pc = new wrtc.RTCPeerConnection(_this5.rtcConfiguration);
            remoteCandidateStream = new ReplaySubject_2();
            _this5.createLocalCandidateStream(pc).subscribe(function (candidate) {
              return send({ candidate: candidate }, id);
            }, function (err) {
              return console.warn(err);
            }, function () {
              return send({ candidate: '' }, id);
            });
            clients.set(id, [pc, remoteCandidateStream]);
          }
          if (msg.offer !== undefined) {
            _this5.openDataChannel(pc, false).then(function (ch) {
              return observer.next(ch);
            }).catch(function (err) {
              clients.delete(id);
              console.log('error', err);
              console.warn('Client "' + id + '" failed to establish RTCDataChannel with you: ' + err.message);
            });
            pc.setRemoteDescription(msg.offer).then(function () {
              return remoteCandidateStream.subscribe(function (candidate) {
                pc.addIceCandidate(new wrtc.RTCIceCandidate(candidate)).catch(function (err) {
                  return console.warn(err);
                });
              }, function (err) {
                return console.warn(err);
              }, function () {
                return clients.delete(id);
              });
            }).then(function () {
              return pc.createAnswer();
            }).then(function (answer) {
              return pc.setLocalDescription(answer);
            }).then(function () {
              send({ answer: {
                  type: pc.localDescription.type,
                  sdp: pc.localDescription.sdp
                } }, id);
            }).catch(function (err) {
              clients.delete(id);
              console.warn(err);
            });
          } else {
            if (msg.candidate !== '') {
              remoteCandidateStream.next(msg.candidate);
            } else {
              remoteCandidateStream.complete();
            }
          }
        }, function (err) {
          return observer.error(err);
        }, function () {
          return observer.complete();
        });
      });
    }

    /**
     * @private
     * @param  {RTCPeerConnection} pc
     * @return {Observable<{candidate: string, sdpMid: string, sdpMLineIndex: string}>}
     */

  }, {
    key: 'createLocalCandidateStream',
    value: function createLocalCandidateStream(pc) {
      return Observable_2.create(function (observer) {
        pc.onicecandidate = function (evt) {
          if (evt.candidate !== null) {
            observer.next({
              candidate: evt.candidate.candidate,
              sdpMid: evt.candidate.sdpMid,
              sdpMLineIndex: evt.candidate.sdpMLineIndex
            });
          } else {
            observer.complete();
          }
        };
      });
    }

    /**
     * @private
     * @param  {RTCPeerConnection} pc
     * @param  {boolean} offerCreator
     * @param  {string} [peerId='']
     * @return {Promise<RTCDataChannel>}
     */

  }, {
    key: 'openDataChannel',
    value: function openDataChannel(pc, offerCreator, peerId) {
      var _this6 = this;

      if (offerCreator) {
        try {
          var dc = pc.createDataChannel(this.wc.myId);

          // Initialize dataChannel for WebChannel
          var channel = this.wc._initConnection(dc, peerId);

          // Configure disconnection
          this.configOnDisconnect(pc, dc);
          return new Promise(function (resolve, reject) {
            var timeout = setTimeout(function () {
              reject(new Error(CONNECTION_TIMEOUT + 'ms timeout'));
            }, CONNECTION_TIMEOUT);
            dc.onopen = function () {
              clearTimeout(timeout);
              resolve(channel);
            };
          });
        } catch (err) {
          return Promise.reject(err);
        }
      } else {
        return new Promise(function (resolve, reject) {
          var timeout = setTimeout(function () {
            reject(new Error(CONNECTION_TIMEOUT + 'ms timeout'));
          }, CONNECTION_TIMEOUT);
          pc.ondatachannel = function (dcEvt) {
            // Configure disconnection
            _this6.configOnDisconnect(pc, dcEvt.channel);
            dcEvt.channel.onopen = function (evt) {
              clearTimeout(timeout);

              // Initialize dataChannel for WebChannel
              resolve(_this6.wc._initConnection(dcEvt.channel, Number(dcEvt.channel.label)));
            };
          };
        });
      }
    }

    /**
     * @private
     * @param {RTCPeerConnection} pc
     * @param {RTCDataChannel} dc
     */

  }, {
    key: 'configOnDisconnect',
    value: function configOnDisconnect(pc, dc) {
      pc.oniceconnectionstatechange = function () {
        if (pc.iceConnectionState === 'disconnected' && dc.onclose) {
          dc.onclose(new CloseEvent('disconnect', {
            code: 4201,
            reason: 'disconnected'
          }));
        }
      };
    }
  }]);
  return WebRTCService;
}(InnerMessageMixin);

var WebRTCChecker = function () {
  function WebRTCChecker() {
    classCallCheck(this, WebRTCChecker);
  }

  createClass(WebRTCChecker, null, [{
    key: 'isSupported',
    get: function get$$1() {
      return wrtc !== undefined;
    }
  }]);
  return WebRTCChecker;
}();

var ID = 2;
var ME = {
  isWsListen: false,
  isWrtcSupport: false
};

var request = void 0;
var response = void 0;

/**
 * It is responsible to build a channel between two peers with a help of `WebSocketService` and `WebRTCService`.
 * Its algorithm determine which channel (socket or dataChannel) should be created
 * based on the services availability and peers' preferences.
 */
var ChannelBuilderService = function (_InnerMessageMixin) {
  inherits(ChannelBuilderService, _InnerMessageMixin);

  function ChannelBuilderService(wc) {
    classCallCheck(this, ChannelBuilderService);

    var _this = possibleConstructorReturn(this, (ChannelBuilderService.__proto__ || Object.getPrototypeOf(ChannelBuilderService)).call(this, ID, channelBuilder.Message, wc._msgStream));

    _this.wc = wc;
    _this.init();

    // Check whether the peer supports WebRTC
    ME.isWrtcSupport = WebRTCChecker.isSupported;

    // Check whether the peer is listening on WebSocket
    WebSocketChecker.isListening().subscribe(function (value) {
      ME.isWsListen = value;
      var content = {
        isWsListen: ME.isWsListen,
        isWrtcSupport: ME.isWrtcSupport,
        url: WebSocketChecker.url
      };
      request = get(ChannelBuilderService.prototype.__proto__ || Object.getPrototypeOf(ChannelBuilderService.prototype), 'encode', _this).call(_this, { request: content });
      response = get(ChannelBuilderService.prototype.__proto__ || Object.getPrototypeOf(ChannelBuilderService.prototype), 'encode', _this).call(_this, { response: content });
    });

    // Listen on RTCDataChannel
    if (ME.isWrtcSupport) {
      wc.webRTCSvc.onConnectionFromWebChannel().subscribe(function (ch) {
        return _this.onChannel(ch);
      });
    }

    // Listen on WebSocket
    if (ME.isWsListen) {
      wc.webSocketSvc.onConnection().subscribe(function (_ref) {
        var ch = _ref.ch;
        return _this.onChannel(ch);
      });
    }

    // Subscribe to WebChannel internal message stream for this service
    _this.innerStream.subscribe(function (msg) {
      return _this.handleSvcMsg(msg);
    }, function (err) {
      return void 0;
    }, function () {
      return _this.init();
    });
    return _this;
  }

  createClass(ChannelBuilderService, [{
    key: 'init',
    value: function init(wc) {
      this.pendingRequests = new Map();
    }

    /**
     * Establish a channel with the peer identified by `id`.
     *
     * @param {number} id
     *
     * @returns {Promise<Channel, string>}
     */

  }, {
    key: 'connectTo',
    value: function connectTo(id) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2.pendingRequests.set(id, { resolve: resolve, reject: reject });
        _this2.wc._sendTo({ recipientId: id, content: request });
      });
    }

    /**
     * @param {Channel} ch
     */

  }, {
    key: 'onChannel',
    value: function onChannel(ch) {
      var pendReq = this.pendingRequests.get(ch.peerId);
      if (pendReq) {
        pendReq.resolve(ch);
      }
    }

    /**
     * @param {Channel} channel
     * @param {number} senderId
     * @param {number} recipientId
     * @param {Object} msg
     */

  }, {
    key: 'handleSvcMsg',
    value: function handleSvcMsg(_ref2) {
      var _this3 = this;

      var channel = _ref2.channel,
          senderId = _ref2.senderId,
          recipientId = _ref2.recipientId,
          msg = _ref2.msg;

      var wc = channel.webChannel;

      switch (msg.type) {
        case 'failed':
          {
            this.pendingRequests.get(senderId).reject(new Error(msg.failed));
            break;
          }
        case 'request':
          {
            var _msg$request = msg.request,
                isWsListen = _msg$request.isWsListen,
                isWrtcSupport = _msg$request.isWrtcSupport,
                url = _msg$request.url;
            // If remote peer is listening on WebSocket, connect to him

            if (isWsListen) {
              this.wc.webSocketSvc.connectTo(url, senderId).then(function (ch) {
                return _this3.onChannel(ch);
              }).catch(function (reason) {
                if (ME.isWsListen) {
                  // Ask him to connect to me via WebSocket
                  wc._sendTo({ recipientId: senderId, content: response });
                } else {
                  // Send failed reason
                  wc._sendTo({
                    recipientId: senderId,
                    content: get(ChannelBuilderService.prototype.__proto__ || Object.getPrototypeOf(ChannelBuilderService.prototype), 'encode', _this3).call(_this3, { failed: 'Failed to establish a socket: ' + reason })
                  });
                }
              });

              // If remote peer is able to connect over RTCDataChannel, verify first if I am listening on WebSocket
            } else if (isWrtcSupport) {
              if (ME.isWsListen) {
                // Ask him to connect to me via WebSocket
                wc._sendTo({ recipientId: senderId, content: response });
              } else if (ME.isWrtcSupport) {
                this.wc.webRTCSvc.connectOverWebChannel(senderId).then(function (ch) {
                  return _this3.onChannel(ch);
                }).catch(function (reason) {
                  // Send failed reason
                  wc._sendTo({
                    recipientId: senderId,
                    content: get(ChannelBuilderService.prototype.__proto__ || Object.getPrototypeOf(ChannelBuilderService.prototype), 'encode', _this3).call(_this3, { failed: 'Failed establish a data channel: ' + reason })
                  });
                });
              } else {
                // Send failed reason
                wc._sendTo({
                  recipientId: senderId,
                  content: get(ChannelBuilderService.prototype.__proto__ || Object.getPrototypeOf(ChannelBuilderService.prototype), 'encode', this).call(this, { failed: 'No common connectors' })
                });
              }
              // If peer is not listening on WebSocket and is not able to connect over RTCDataChannel
            } else if (!isWsListen && !isWrtcSupport) {
              if (ME.isWsListen) {
                // Ask him to connect to me via WebSocket
                wc._sendTo({ recipientId: senderId, content: response });
              } else {
                // Send failed reason
                wc._sendTo({
                  recipientId: senderId,
                  content: get(ChannelBuilderService.prototype.__proto__ || Object.getPrototypeOf(ChannelBuilderService.prototype), 'encode', this).call(this, { failed: 'No common connectors' })
                });
              }
            }
            break;
          }
        case 'response':
          {
            var _msg$response = msg.response,
                _isWsListen = _msg$response.isWsListen,
                _url = _msg$response.url;

            if (_isWsListen) {
              this.wc.webSocketSvc.connectTo(_url, senderId).then(function (ch) {
                return _this3.onChannel(ch);
              }).catch(function (reason) {
                _this3.pendingRequests.get(senderId).reject(new Error('Failed to establish a socket: ' + reason));
              });
            }
            break;
          }
      }
    }
  }]);
  return ChannelBuilderService;
}(InnerMessageMixin);

var ted = Util.require(Util.TEXT_ENCODING);

/**
 * Maximum size of the user message sent over `Channel`. Is meant without metadata.
 * @type {number}
 */
var MAX_USER_MSG_SIZE = 15000;

/**
 * Maximum message id number.
 * @type {number}
 */
var MAX_MSG_ID_SIZE = 65535;

var stringEncoder = new ted.TextEncoder();
var stringDecoder = new ted.TextDecoder();

/**
 * Message builder service is responsible to build messages to send them over the
 * `WebChannel` and treat messages received by the `WebChannel`. It also manage
 * big messages (more then 16ko) sent by users. Internal messages are always less
 * 16ko.
 */
var UserMessage = function () {
  function UserMessage() {
    classCallCheck(this, UserMessage);

    this.buffers = new Map();
  }

  /**
   * @callback MessageService~Send
   * @param {ArrayBuffer} dataChunk - If the message is too big this
   * action would be executed for each data chunk until send whole message
   */

  /**
   * @private
   * @typedef {ARRAY_BUFFER_TYPE|STRING_TYPE} MessageTypeEnum
   */

  /**
   * Prepare user message to be sent over the `WebChannel`.
   *
   * @param {UserMessage} data Message to be sent
   * @param {number} senderId Id of the peer who sends this message
   * @param {number} recipientId Id of the recipient peer
   * @param {boolean} [isBroadcast=true] Equals to true if this message would be
   * sent to all `WebChannel` members and false if only to one member
   * @return {ArrayBuffer}
   */


  createClass(UserMessage, [{
    key: 'encode',
    value: function encode(data) {
      var _userDataToType = this.userDataToType(data),
          type = _userDataToType.type,
          bytes = _userDataToType.bytes;

      var msg = { length: bytes.byteLength, type: type };
      if (bytes.byteLength <= MAX_USER_MSG_SIZE) {
        msg.full = new Uint8Array(bytes);
      } else {
        var numberOfChunks = Math.ceil(bytes.byteLength / MAX_USER_MSG_SIZE);
        var msgId = Math.ceil(Math.random() * MAX_MSG_ID_SIZE);
        for (var chunkNumber = 0; chunkNumber < numberOfChunks; chunkNumber++) {
          var chunkLength = Math.min(MAX_USER_MSG_SIZE, bytes.byteLength - MAX_USER_MSG_SIZE * chunkNumber);
          var begin = MAX_USER_MSG_SIZE * chunkNumber;
          var end = begin + chunkLength;
          msg.chunk = {
            id: msgId,
            number: chunkNumber,
            content: new Uint8Array(bytes.slice(begin, end))
          };
        }
      }
      return user.Message.encode(user.Message.create(msg)).finish();
    }
  }, {
    key: 'decode',
    value: function decode(bytes, senderId) {
      var msg = user.Message.decode(new Uint8Array(bytes));
      var content = void 0;
      switch (msg.content) {
        case 'full':
          {
            content = msg.full;
            break;
          }
        case 'chunk':
          {
            var buffer = get(UserMessage.prototype.__proto__ || Object.getPrototypeOf(UserMessage.prototype), 'getItem', this).call(this, senderId, msg.chunk.id);
            if (buffer === undefined) {
              buffer = new Buffer$1(msg.length, msg.chunk.content, msg.chunk.number);
              get(UserMessage.prototype.__proto__ || Object.getPrototypeOf(UserMessage.prototype), 'setItem', this).call(this, senderId, msg.chunk.id, buffer);
              content = undefined;
            } else {
              content = buffer.append(msg.chunk.content, msg.chunk.number);
            }
            break;
          }
        default:
          {
            throw new Error('Unknown message integrity');
          }
      }
      return content !== undefined ? this.typeToUserData(content, msg.type) : undefined;
    }

    /**
     * Netflux sends data in `ArrayBuffer`, but the user can send data in different
     * types. This function retrieve the inital message sent by the user.
     * @private
     * @param {ArrayBuffer} buffer Message as it was received by the `WebChannel`
     * @param {MessageTypeEnum} type Message type as it was defined by the user
     * @returns {ArrayBuffer|TypedArray} Initial user message
     */

  }, {
    key: 'typeToUserData',
    value: function typeToUserData(buffer, type) {
      switch (type) {
        case user.Message.Type.ARRAY_BUFFER:
          return buffer;
        case user.Message.Type.STRING:
          return stringDecoder.decode(buffer);
        default:
          throw new Error('Unknown message type');
      }
    }

    /**
     * Identify the user message type.
     *
     * @private
     * @param {Message} data User message
     * @returns {MessageTypeEnum} User message type
     */

  }, {
    key: 'userDataToType',
    value: function userDataToType(data) {
      var type = void 0;
      var bytes = void 0;
      if (data instanceof ArrayBuffer) {
        type = user.Message.Type.ARRAY_BUFFER;
        bytes = data;
      } else if (typeof data === 'string' || data instanceof String) {
        type = user.Message.Type.STRING;
        bytes = stringEncoder.encode(data);
      } else if (ArrayBuffer.isView(data)) {
        type = user.Message.Type.ARRAY_BUFFER;
        bytes = data.buffer;
      } else {
        throw new Error('Unknown message object');
      }
      return { type: type, bytes: new Uint8Array(bytes) };
    }
  }]);
  return UserMessage;
}();

/**
 * Buffer class used when the user message exceeds the message size limit which
 * may be sent over a `Channel`. Each buffer is identified by `WebChannel` id,
 * peer id (who sends the big message) and message id (in case if the peer sends
 * more then 1 big message at a time).
 * @private
 */

var Buffer$1 = function () {
  /**
   * @param {number} fullDataSize The total user message size
   * @param {ArrayBuffer} data The first chunk of the user message
   * @param {number} chunkNb Number of the chunk
   * @param {function(buffer: ArrayBuffer)} action Callback to be executed when all
   * message chunks are received and thus the message is ready
   */
  function Buffer(fullDataSize, data, chunkNb) {
    classCallCheck(this, Buffer);

    this.fullData = new Uint8Array(fullDataSize);
    this.currentSize = 0;
    this.add(data, chunkNb);
  }

  /**
   * Add a chunk of message to the buffer.
   * @param {ArrayBuffer} data - Message chunk
   * @param {number} chunkNb - Number of the chunk
   * @return {undefined|ArrayBuffer}
   */


  createClass(Buffer, [{
    key: 'append',
    value: function append(data, chunkNb) {
      var dataChunk = new Uint8Array(data);
      this.currentSize += data.byteLength;
      var index = chunkNb * MAX_USER_MSG_SIZE;
      for (var i = 0; i < data.byteLength; i++) {
        this.fullData[index++] = dataChunk[i];
      }
      if (this.currentSize === this.fullData.byteLength) {
        return this.fullData.buffer;
      } else {
        return undefined;
      }
    }
  }]);
  return Buffer;
}();

/**
 * Maximum identifier number for {@link WebChannel#_generateId} function.
 * @type {number}
 */
var MAX_ID = 2147483647;

var REJOIN_MAX_ATTEMPTS = 10;
var REJOIN_TIMEOUT = 2000;

/**
 * Timout for ping `WebChannel` in milliseconds.
 * @type {number}
 */
var PING_TIMEOUT = 5000;

var ID_TIMEOUT = 10000;

var INNER_ID = 100;

/**
 * This class is an API starting point. It represents a group of collaborators
 * also called peers. Each peer can send/receive broadcast as well as personal
 * messages. Every peer in the `WebChannel` can invite another person to join
 * the `WebChannel` and he also possess enough information to be able to add it
 * preserving the current `WebChannel` structure (network topology).
 */
var WebChannel = function (_InnerMessageMixin) {
  inherits(WebChannel, _InnerMessageMixin);

  /**
   * @param {WebChannelSettings} settings Web channel settings
   */
  function WebChannel(settings) {
    classCallCheck(this, WebChannel);

    /**
     * @private
     * @type {WebChannelSettings}
     */
    var _this = possibleConstructorReturn(this, (WebChannel.__proto__ || Object.getPrototypeOf(WebChannel)).call(this, INNER_ID, webChannel.Message));

    _this.settings = settings;

    /**
     * This event handler is used to resolve *Promise* in {@link WebChannel#join}.
     * @private
     */
    _this._joinSucceed = function () {};

    /**
     * An array of all peer ids except this.
     * @type {number[]}
     */
    _this.members = [];

    /**
     * @private
     * @type {Set<number>}
     */
    _this._generatedIds = new Set();

    /**
     * @private
     * @type {Date}
     */
    _this._pingTime = 0;

    /**
     * @private
     * @type {number}
     */
    _this._maxTime = 0;

    /**
     * @private
     * @type {function(delay: number)}
     */
    _this._pingFinish = function () {};

    /**
     * @private
     * @type {number}
     */
    _this._pongNb = 0;

    /**
     * Unique `WebChannel` identifier. Its value is the same for all `WebChannel` members.
     * @type {number}
     */
    _this.id = _this._generateId();

    /**
     * Unique peer identifier of you in this `WebChannel`. After each `join` function call
     * this id will change, because it is up to the `WebChannel` to assign it when
     * you join.
     * @type {number}
     */
    _this.myId = _this._generateId();

    /**
     * Is the event handler called when a new peer has  joined the `WebChannel`.
     * @type {function(id: number)}
     */
    _this.onPeerJoin = function () {};

    /**
     * Is the event handler called when a peer hes left the `WebChannel`.
     * @type {function(id: number)}
     */
    _this.onPeerLeave = function () {};

    /**
     * Is the event handler called when a message is available on the `WebChannel`.
     * @type {function(id: number, msg: UserMessage, isBroadcast: boolean)}
     */
    _this.onMessage = function () {};

    /**
     * Is the event handler called when the `WebChannel` has been closed.
     * @type {function(closeEvt: CloseEvent)}
     */
    _this.onClose = function () {};

    /**
     * Message builder service instance.
     *
     * @private
     * @type {MessageService}
     */
    _this._userMsg = new UserMessage();

    _this._msgStream = new Subject_2();
    _this.webRTCSvc = new WebRTCService(_this, _this.settings.iceServers, _this._msgStream);
    _this.webSocketSvc = new WebSocketService(_this);
    _this._signalingGate = new SignalingGate(_this, function (ch) {
      return _this._addChannel(ch);
    });
    _this.channelBuilderSvc = new ChannelBuilderService(_this);
    get(WebChannel.prototype.__proto__ || Object.getPrototypeOf(WebChannel.prototype), 'setInnerStream', _this).call(_this, _this._msgStream);
    _this.innerMessageSubscritption = _this.innerStream.subscribe(function (msg) {
      return _this._handleInnerMessage(msg);
    }, function (err) {
      return void 0;
    }, function (complete) {
      return void 0;
    });

    /**
     * `WebChannel` topology.
     * @private
     * @type {Service}
     */
    _this._setTopology(_this.settings.topology);
    return _this;
  }

  /**
   * Join the `WebChannel`.
   *
   * @param  {string|WebSocket} keyOrChannel The key provided by one of the `WebChannel` members or a socket
   * @param  {string} [options] Join options
   * @returns {Promise<undefined,string>} It resolves once you became a `WebChannel` member.
   */


  createClass(WebChannel, [{
    key: 'join',
    value: function join(keyOrChannel) {
      var _this2 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var settings = {
        url: this.settings.signalingURL,
        open: true,
        rejoinAttempts: REJOIN_MAX_ATTEMPTS,
        rejoinTimeout: REJOIN_TIMEOUT
      };
      Object.assign(settings, options);
      return new Promise(function (resolve, reject) {
        if (keyOrChannel.constructor.name !== 'Channel') {
          _this2._joinRecursively(keyOrChannel, settings, function () {
            return resolve();
          }, function (err) {
            return reject(err);
          }, 0);
        } else {
          _this2._joinSucceed = function () {
            return resolve();
          };
        }
      });
    }

    /**
     * Invite a peer to join the `WebChannel`.
     *
     * @param {string} url
     *
     * @returns {Promise<undefined,string>}
     */

  }, {
    key: 'invite',
    value: function invite(url) {
      var _this3 = this;

      if (Util.isURL(url)) {
        return this.webSocketSvc.connect(url + '/invite?wcId=' + this.id + '&senderId=' + this.myId).then(function (connection) {
          return _this3._addChannel(_this3._initConnection(connection));
        });
      } else {
        return Promise.reject(new Error(url + ' is not a valid URL'));
      }
    }

    /**
     * Enable other peers to join the `WebChannel` with your help as an
     * intermediary peer.
     * @param  {string} [key] Key to use. If none provide, then generate one.
     * @returns {Promise} It is resolved once the `WebChannel` is open. The
     * callback function take a parameter of type {@link SignalingGate~AccessData}.
     */

  }, {
    key: 'open',
    value: function open() {
      var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

      if (key !== undefined) {
        return this._signalingGate.open(this.settings.signalingURL, key);
      } else {
        return this._signalingGate.open(this.settings.signalingURL);
      }
    }

    /**
     * Prevent clients to join the `WebChannel` even if they possesses a key.
     */

  }, {
    key: 'close',
    value: function close() {
      this._signalingGate.close();
    }

    /**
     * If the `WebChannel` is open, the clients can join it through you, otherwise
     * it is not possible.
     * @returns {boolean} True if the `WebChannel` is open, false otherwise
     */

  }, {
    key: 'isOpen',
    value: function isOpen() {
      return this._signalingGate.isOpen();
    }

    /**
     * Get the data allowing to join the `WebChannel`. It is the same data which
     * {@link WebChannel#open} callback function provides.
     * @returns {OpenData|null} - Data to join the `WebChannel` or null is the `WebChannel` is closed
     */

  }, {
    key: 'getOpenData',
    value: function getOpenData() {
      return this._signalingGate.getOpenData();
    }

    /**
     * Leave the `WebChannel`. No longer can receive and send messages to the group.
     */

  }, {
    key: 'leave',
    value: function leave() {
      this._pingTime = 0;
      if (this.members.length !== 0) {
        this.members = [];
        this._topologySvc.leave();
      }
      this._joinSucceed = function () {};
      this._msgStream.complete();
      this._signalingGate.close();
      this.innerMessageSubscritption.unsubscribe();
    }

    /**
     * Send the message to all `WebChannel` members.
     * @param  {UserMessage} data - Message
     */

  }, {
    key: 'send',
    value: function send(data) {
      if (this.members.length !== 0) {
        this._topologySvc.send({
          senderId: this.myId,
          recipientId: 0,
          isInner: false,
          content: this._userMsg.encode(data)
        });
      }
    }

    /**
     * Send the message to a particular peer in the `WebChannel`.
     * @param  {number} id - Id of the recipient peer
     * @param  {UserMessage} data - Message
     */

  }, {
    key: 'sendTo',
    value: function sendTo(id, data) {
      if (this.members.length !== 0) {
        this._topologySvc.sendTo({
          senderId: this.myId,
          recipientId: id,
          isInner: false,
          content: this._userMsg.encode(data)
        });
      }
    }

    /**
     * Get the ping of the `WebChannel`. It is an amount in milliseconds which
     * corresponds to the longest ping to each `WebChannel` member.
     * @returns {Promise}
     */

  }, {
    key: 'ping',
    value: function ping() {
      var _this4 = this;

      if (this.members.length !== 0 && this._pingTime === 0) {
        return new Promise(function (resolve, reject) {
          if (_this4._pingTime === 0) {
            _this4._pingTime = Date.now();
            _this4._maxTime = 0;
            _this4._pongNb = 0;
            _this4._pingFinish = function (delay) {
              return resolve(delay);
            };
            _this4._send({ content: get(WebChannel.prototype.__proto__ || Object.getPrototypeOf(WebChannel.prototype), 'encode', _this4).call(_this4, { ping: true }) });
            setTimeout(function () {
              return resolve(PING_TIMEOUT);
            }, PING_TIMEOUT);
          }
        });
      } else return Promise.reject(new Error('No peers to ping'));
    }

    /**
     * @private
     * @param {Channel} ch
     *
     * @returns {Promise<undefined,string>}
     */

  }, {
    key: '_addChannel',
    value: function _addChannel(ch) {
      ch.peerId = this._generateId();
      var msg = this._encodeMain({
        recipientId: 1,
        content: get(WebChannel.prototype.__proto__ || Object.getPrototypeOf(WebChannel.prototype), 'encode', this).call(this, { initWebChannel: {
            topology: this._topologySvc.id,
            wcId: this.id,
            peerId: ch.peerId
          } })
      });
      ch.send(msg);
      return this._topologySvc.add(ch);
    }

    /**
     * @private
     * @param {number} peerId
     */

  }, {
    key: '_onPeerJoin',
    value: function _onPeerJoin(peerId) {
      this.members[this.members.length] = peerId;
      this.onPeerJoin(peerId);
    }

    /**
     * @private
     * @param {number} peerId
     */

  }, {
    key: '_onPeerLeave',
    value: function _onPeerLeave(peerId) {
      this.members.splice(this.members.indexOf(peerId), 1);
      this.onPeerLeave(peerId);
    }

    /**
     * Send a message to a service of the same peer, joining peer or any peer in
     * the `WebChannel`.
     * @private
     * @param {Object} msg
     * @param {string} [msg.serviceId] - Service id
     * @param {number} [msg.recipientId] - Identifier of recipient peer id
     * @param {boolean} [msg.isInner] - SHould the message be forwarded?
     * @param {Object} [msg.content] - Message to send
     */

  }, {
    key: '_sendTo',
    value: function _sendTo() {
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref$senderId = _ref.senderId,
          senderId = _ref$senderId === undefined ? this.myId : _ref$senderId,
          _ref$recipientId = _ref.recipientId,
          recipientId = _ref$recipientId === undefined ? this.myId : _ref$recipientId,
          _ref$isInner = _ref.isInner,
          isInner = _ref$isInner === undefined ? true : _ref$isInner,
          _ref$content = _ref.content,
          content = _ref$content === undefined ? new Uint8Array() : _ref$content;

      var msg = { senderId: senderId, recipientId: recipientId, isInner: isInner, content: content };
      if (msg.recipientId === this.myId) {
        this._handleMessageToMe(undefined, msg);
      } else {
        this._topologySvc.sendTo(msg);
      }
    }

    /**
     * @private
     * @param {Object} msg
     * @param {boolean} isMeIncluded
     */

  }, {
    key: '_send',
    value: function _send() {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref2$senderId = _ref2.senderId,
          senderId = _ref2$senderId === undefined ? this.myId : _ref2$senderId,
          _ref2$recipientId = _ref2.recipientId,
          recipientId = _ref2$recipientId === undefined ? 0 : _ref2$recipientId,
          _ref2$isInner = _ref2.isInner,
          isInner = _ref2$isInner === undefined ? true : _ref2$isInner,
          _ref2$content = _ref2.content,
          content = _ref2$content === undefined ? new Uint8Array() : _ref2$content,
          _ref2$isMeIncluded = _ref2.isMeIncluded,
          isMeIncluded = _ref2$isMeIncluded === undefined ? false : _ref2$isMeIncluded;

      var msg = { senderId: senderId, recipientId: recipientId, isInner: isInner, content: content };
      if (isMeIncluded) {
        this._handleMessageToMe(undefined, msg);
      }
      this._topologySvc.send(msg);
    }

    /**
     * Message event handler (`WebChannel` mediator). All messages arrive here first.
     * @private
     * @param {Channel} channel - The channel the message came from
     * @param {external:ArrayBuffer} bytes - Message
     */

  }, {
    key: '_onMessage',
    value: function _onMessage(channel, bytes) {
      var msg = this._decodeMain(bytes);

      switch (msg.recipientId) {
        // If the message is broadcasted
        case 0:
          this._handleMessageToMe(channel, msg);
          this._topologySvc.send(msg);
          break;

        // If it is a private message to me
        case this.myId:
          this._handleMessageToMe(channel, msg);
          break;

        // If is is a message to me from a peer who does not know yet my ID
        case 1:
          // log.debug('UNDEFINED')
          this._handleMessageToMe(channel, msg);
          break;

        // Otherwise the message should be forwarded to the intended peer
        default:
          // log.debug('_onMessage topology.sendTo')
          this._topologySvc.sendTo(msg);
      }
    }
  }, {
    key: '_handleMessageToMe',
    value: function _handleMessageToMe(channel, msg) {
      if (!msg.isInner) {
        // User Message
        this.onMessage(msg.senderId, this._userMsg.decode(msg.content), msg.recipientId === 0);
      } else {
        // Inner Message
        this._msgStream.next(Object.assign({
          channel: channel,
          senderId: msg.senderId,
          recipientId: msg.recipientId
        }, inner.Message.decode(msg.content)));
      }
    }
  }, {
    key: '_handleInnerMessage',
    value: function _handleInnerMessage(_ref3) {
      var channel = _ref3.channel,
          senderId = _ref3.senderId,
          recipientId = _ref3.recipientId,
          msg = _ref3.msg;

      switch (msg.type) {
        case 'initWebChannel':
          {
            var _msg$initWebChannel = msg.initWebChannel,
                topology = _msg$initWebChannel.topology,
                wcId = _msg$initWebChannel.wcId,
                peerId = _msg$initWebChannel.peerId;

            this._setTopology(topology);
            this.myId = peerId;
            this.id = wcId;
            channel.peerId = senderId;
            break;
          }
        case 'ping':
          {
            this._sendTo({
              recipientId: channel.peerId,
              content: get(WebChannel.prototype.__proto__ || Object.getPrototypeOf(WebChannel.prototype), 'encode', this).call(this, { pong: true })
            });
            break;
          }
        case 'pong':
          {
            var now = Date.now();
            this._pongNb++;
            this._maxTime = Math.max(this._maxTime, now - this._pingTime);
            if (this._pongNb === this.members.length) {
              this._pingFinish(this._maxTime);
              this._pingTime = 0;
            }
            break;
          }
        default:
          throw new Error('Unknown message type: "' + msg.type + '"');
      }
    }

    /**
     * Initialize channel. The *Channel* object is a facade for *WebSocket* and
     * *RTCDataChannel*.
     * @private
     * @param {external:WebSocket|external:RTCDataChannel} connection - Channel to
     * initialize
     * @param {number} id
     * @returns {Promise} - Resolved once the channel is initialized on both sides
     */

  }, {
    key: '_initConnection',
    value: function _initConnection(connection, id) {
      var _this5 = this;

      var channel = new Channel(connection, this);
      if (id !== undefined) {
        channel.peerId = id;
      }
      channel.onMessage = function (data) {
        return _this5._onMessage(channel, data);
      };
      channel.onClose = function (closeEvt) {
        return _this5._topologySvc.onChannelClose(closeEvt, channel);
      };
      channel.onError = function (evt) {
        return _this5._topologySvc.onChannelError(evt, channel);
      };
      return channel;
    }

    /**
     *
     * @private
     * @param  {[type]} key
     * @param  {[type]} options
     * @param  {[type]} resolve
     * @param  {[type]} reject
     * @param  {[type]} attempt
     * @return {void}
     */

  }, {
    key: '_joinRecursively',
    value: function _joinRecursively(key, options, resolve, reject, attempt) {
      var _this6 = this;

      this._signalingGate.join(key, options.url, options.open).then(function (ch) {
        if (ch) {
          _this6._joinSucceed = function () {
            return resolve();
          };
        } else {
          resolve();
        }
      }).catch(function (err) {
        attempt++;
        console.log('Failed to join via ' + options.url + ' with ' + key + ' key: ' + err.message);
        if (attempt === options.rejoinAttempts) {
          reject(new Error('Failed to join via ' + options.url + ' with ' + key + ' key: reached maximum rejoin attempts (' + REJOIN_MAX_ATTEMPTS + ')'));
        } else {
          console.log('Trying to rejoin in ' + options.rejoinTimeout + ' the ' + attempt + ' time... ');
          setTimeout(function () {
            _this6._joinRecursively(key, options, function () {
              return resolve();
            }, function (err) {
              return reject(err);
            }, attempt);
          }, options.rejoinTimeout);
        }
      });
    }
  }, {
    key: '_setTopology',
    value: function _setTopology(topology) {
      if (this._topologySvc !== undefined) {
        if (this.settings.topology !== topology) {
          this.settings.topology = topology;
          this._topologySvc.clean();
          this._topologySvc = new FullyConnectedService(this);
        }
      } else {
        this.settings.topology = topology;
        this._topologySvc = new FullyConnectedService(this);
      }
    }

    /**
     * Generate random id for a `WebChannel` or a new peer.
     * @private
     * @returns {number} - Generated id
     */

  }, {
    key: '_generateId',
    value: function _generateId() {
      var _this7 = this;

      var _loop = function _loop() {
        var id = Math.ceil(Math.random() * MAX_ID);
        if (id === _this7.myId) return 'continue';
        if (_this7.members.includes(id)) return 'continue';
        if (_this7._generatedIds.has(id)) return 'continue';
        _this7._generatedIds.add(id);
        setTimeout(function () {
          return _this7._generatedIds.delete(id);
        }, ID_TIMEOUT);
        return {
          v: id
        };
      };

      do {
        var _ret = _loop();

        switch (_ret) {
          case 'continue':
            continue;

          default:
            if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
        }
      } while (true);
    }
  }, {
    key: '_encodeMain',
    value: function _encodeMain() {
      var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref4$senderId = _ref4.senderId,
          senderId = _ref4$senderId === undefined ? this.myId : _ref4$senderId,
          _ref4$recipientId = _ref4.recipientId,
          recipientId = _ref4$recipientId === undefined ? 0 : _ref4$recipientId,
          _ref4$isInner = _ref4.isInner,
          isInner = _ref4$isInner === undefined ? true : _ref4$isInner,
          _ref4$content = _ref4.content,
          content = _ref4$content === undefined ? new Uint8Array() : _ref4$content;

      var msg = { senderId: senderId, recipientId: recipientId, isInner: isInner, content: content };
      return Message.encode(Message.create(msg)).finish();
    }
  }, {
    key: '_decodeMain',
    value: function _decodeMain(bytes) {
      return Message.decode(new Uint8Array(bytes));
    }
  }]);
  return WebChannel;
}(InnerMessageMixin);

/**
 * @type {Object}
 * @property {FULLY_CONNECTED} defaults.topology Fully connected topology is the only one available for now
 * @property {string} defaults.signalingURL Signaling server url
 * @property {RTCIceServer} defaults.iceServers Set of ice servers for WebRTC
 */
var defaults$1 = {
  topology: FULLY_CONNECTED,
  signalingURL: 'wss://www.coedit.re:10473',
  iceServers: [{ urls: 'stun:stun3.l.google.com:19302' }]
};

/**
 * Create `WebChannel`.
 *
 * @param {WebChannelSettings} options
 * @param {FULLY_CONNECTED} [options.topology=FULLY_CONNECTED] Fully connected topology is the only one available for now
 * @param {string} [options.signalingURL='wss://www.coedit.re:10473'] Signaling server url
 * @param {RTCIceServer} [options.iceServers=[{urls:'stun3.l.google.com:19302'}]] Set of ice servers for WebRTC
 * @param {string} [options.listenOn=''] Server url when the peer is listen on web socket
 *
 * @returns {WebChannel}
 */
function create(options) {
  var mySettings = Object.assign({}, defaults$1, options);
  return new WebChannel(mySettings);
}

export { create };
