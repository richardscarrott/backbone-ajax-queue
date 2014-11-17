define([
    'jquery'
], function ($) {

    'use strict';

    var XhrProxy,
        queues = {},
        DEFAULT_QUEUE = 'default';

    /**
     * XhrProxy is a wrapper around a future xhr object proxying its methods
     * and state.
     * NOTE: currently only abort is proxied.
     * @constructor
     */
    XhrProxy = function() {
        var deferred = this._deferred = new $.Deferred();
        deferred.promise(this);
    };

    XhrProxy.prototype = {

        constructor: XhrProxy,

        /**
         * The real xhr object.
         * @type {Null|jqXhr}
         */
        xhr: null,

        /**
         * The deferred object.
         * @private
         * @type {Null|$.Deferred}
         */
        _deferred: null,

        /**
         * Flag to determine whether the xhr is, or should be, aborted.
         * @private
         * @type {Boolean}
         */
        _aborted: false,

        /**
         * Proxies into the real xhr if it exists, otherwise flags the xhr as
         * aborted to be handled in the future.
         */
        abort: function() {
            if (this.xhr) {
                this.xhr.abort();
            }
            this._aborted = true;
        },

        /**
         * Sets the xhr and proxies any state changes both ways.
         * @private
         * @param {jqXhr} xhr The actual xhr object.
         */
        _setXhr: function(xhr) {
            var self = this;
            this.xhr = xhr;
            if (this._aborted) {
                xhr.abort();
            }
            this.xhr
                .done(function() {
                    self._deferred.resolveWith(this, arguments);
                })
                .fail(function() {
                    self._deferred.rejectWith(this, arguments);
                });
        }

    };
    
    /**
     * Dispatches requests in queues.
     * @param  {String}         url           The url.
     * @param  {Boolean|String} options.queue The name of the queue.
     * @return {XhrProxy}                     A proxy to the real xhr.
     */
    $.ajaxQueue = function(url, options) {

        var xhrProxy,
            queue,
            promise;

        // If url is an object, simulate pre-1.5 signature.
        if (typeof url === 'object') {
            options = url;
            url = void 0;
        }

        // Force options to be an object.
        options = options || {};

        // If no queue is set then carry on as normal.
        if (!options.queue) {
            return $.ajax.apply($, arguments);
        }

        // Queue.
        xhrProxy = new XhrProxy();
        queue = typeof options.queue === 'string' ? options.queue : DEFAULT_QUEUE;
        promise = queues[queue];

        if (!promise) {
            xhrProxy._setXhr($.ajax(options));
        } else {
            promise
                .done(function() {
                    xhrProxy._setXhr($.ajax(options));
                })
                .fail(function() {
                    // Allow the `queueError` callback to determine whether
                    // the queue should be continued or not.
                    if ((options.queueError || $.noop).apply(this, arguments) !== false) {
                        xhrProxy._setXhr($.ajax(options));
                    } else {
                        // Manually call error and complete handlers as otherwise they won't be triggered.
                        if (options.error) {
                            options.error.apply(this, arguments);
                        }
                        if (options.complete) {
                            options.complete.apply(this, arguments);
                        }
                        // Rejecting the deferred will propagate to all other requests in the queue.
                        xhrProxy._deferred.rejectWith(this, arguments);
                        queues[queue] = null;
                    }
                });
        }

        return queues[queue] = xhrProxy;
    };

});
