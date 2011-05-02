mAKE a gaME (maga)
==================
maga is a lightweight framework for developing multiplayer physics-based games

Installing
----------
    npm install maga

To run the example
------------------

If you installed with npm:

    npm explore maga
    node maga/examples/simple.js [8080] [localhost]

If cloned:

    cd maga
    node maga/examples/simple.js [8080] [localhost]


What it does
------------
Provides a framework for game development, for syncing state 
across the network using a built-in timestep based
authority scheme with client prediction.

This means, all
clients run their own simulation of the entire game while
compensating for the roundtrip lag by advancing frame steps.
Every client runs to catch the fastest one.

How to get started
------------------
You start by creating a new game object like this:
    
    var Maga = require('maga')
    
    var game = new Maga.Game({
          frameTime    : 1000 / 45
        , loopTime     : 1000 / 135
        , maxFrameTime : 1000 / 45
        , syncTime     : 1000 / 15
        })
    
In this game we can create channels like this:

    var channel = game.createChannel()

And we'll also need a protocol instance:

    var protocol = new Maga.Protocol(game, channel)

You define your objects yourself and inherit from `Maga.Object`.
Here is from the example Circles game source:

    var Circle = function() {
      Maga.Object.apply(this, arguments)

      this.register({
        // Values used to render (draw) object
        render: {
          x: 0
        , y: 0
        }
        
        // Input values that determine behavior
      , input: {
          tx: 0
        , ty: 0
        }

        // Values that change
      , dynamic: {
          vx: 0
        , vy: 0
        , ox: 0
        , oy: 0  
        }
        
        // Values that don't change
      , static: {
          f: 0.94
        }
      })
    }

    util.inherits(Circle, Maga.Object)

Your objects require to have these methods: `.update` `.render` `.destroy`
The `update` method is called to advances the physics state by 1 frame
The `render` method is called with an object argument containing
the render registered properties. You can use them to draw wherever
you like, a canvas, the DOM, it's up to you.
The `destroy` method to remove the object.

Protocol
--------

`protocol.stringify(myId)` returns a stringified representation of the object with myId.
This automatically accounts for changes, so if the inputs don't change, it returns nothing.

`protocol.parse(state_message)` parses a serialized state and returns a state object.

`protocol.applyState(state)` to apply a state object to the game. Automatically handles client rewind/prediction.
