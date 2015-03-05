define([
    'underscore',
    'jquery',
    'backbone',
    './jquery.ajaxqueue'
], function (_, $, Backbone) {

    'use strict';

    var _sync = Backbone.sync;
    
    /**
     * If `options.queue` is set then sync optimistically sets the models id on
     * 'create' to ensure subsequent Backbone REST methods react as if the call
     * was successful. It also manages the `$.ajaxQueue`.
     * @override
     */
    Backbone.sync = function(method, model, options) {

        // If no queue is set then carry on as normal.
        if (!options.queue) {
            return _sync.apply(this, arguments);
        }

        var xhr,
            noop = function() {},
            beforeSend = options.beforeSend || noop,
            queueError = options.queueError || noop;

        options = _.extend(options, {
            beforeSend: function(xhr, settings) {
                // Now the real id is available replace the temp cid from the url and payload.
                settings.url = (settings.url || '').replace(model.cid, model.id);
                settings.data = (settings.data || '').replace(model.cid, model.id);
                xhr._type = settings.type;
                return beforeSend.apply(this, arguments);
            },
            queueError: function(xhr) {
                // Cancel queue if the failed request was a POST.
                if ((xhr._type || '').toUpperCase() === 'POST') {
                    return false;
                }
                return queueError.apply(this, arguments);
            }
        });

        xhr = _sync(method, model, options);

        // Set the id *after* the 'create' sync has been called to ensure the
        // model no longer `isNew`.
        if (method === 'create') {
            model.set(model.idAttribute, model.cid, {
                silent: true
            });
        }

        return xhr;
    };

    /**
     * Use `jQuery.fn.ajaxQueue` instead of `jQuery.fn.ajax`.
     * @override
     */
    Backbone.ajax = function() {
        return $.ajaxQueue.apply(this, arguments);
    };

});
