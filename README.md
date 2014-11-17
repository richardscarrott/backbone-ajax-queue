# Backbone Ajax Queue

Backbone Ajax Queue updates `Backbone.sync` to help support the development of [asynchronous user interfaces as described here](http://old.alexmaccaw.com//posts/async_ui).

Whilst there are already a number of code snippets floating around to queue Backbone ajax requests I found they all shared the [same problem](https://github.com/jashkenas/backbone/issues/345):

    var model = new Backbone.Model({
        url: '/foo'
    });

    // Correctly issues `POST /foo`
    model.save({
        foo: true
    }, { queue: true });

    // Incorrectly issues `POST /foo` because the model is still considered new until the first POST returns.
    model.save({
        foo: false
    }, { queue: true });

    // Incorrectly issues no request because the model is still considered new until the first POST returns.
    model.destroy({ queue: true });

So, even though they are queuing ajax requests, they don't manage the model properly. With Backbone Ajax Queue you instead get:

    var model = new Backbone.Model({
        url: '/foo'
    });

    // Issues `POST /foo`
    model.save({
        foo: true
    }, { queue: true });

    // Issues `PUT /foo/{id-from-server}`
    model.save({
        foo: false
    }, { queue: true });

    // Issues DELETE `/foo/{id-from-server}`
    model.destroy({ queue: true });

## TODO
- Flesh out README.
- Write tests.
- Create dist task.

