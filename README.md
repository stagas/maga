mAKE a gaME (maga)
==================
maga is a lightweight framework for developing multiplayer physics-based games

**WARNING: API unstable - This is an early release of the library. I will be juggling things around as I dig deeper so expect things to change. Suggestions/contributing is welcome**

Installing
----------
    npm install maga

To run the examples
------------------

`npm explore maga` or `cd maga` if you cloned:

    node examples/circles-server.js [8080] [localhost]
    node examples/cars-server.js [8080] [localhost]
    node examples/hax-server.js [8080] [localhost]

Introduction
------------
maga is a framework to assist in game development, syncing physics state 
across the network among multiple clients using a built-in timestep based
authority scheme with client prediction. It runs in any CommonJS enviroment,
so you can use it in both node.js and the browser. You get to use
the same code in your server backend simulation and the browser's simulation.

Every instance is both a sender and a receiver, it runs its own simulation
of the entire game while compensating for the roundtrip lag by advancing frame steps.
Every client runs to catch the fastest one.

See the hax example for both server/client usage.

How to get started
------------------
You start by creating a new game object like this:
    
    var Maga = require('maga')
    var game = new Maga.Game()
    
In this game we can create rooms like this:

    var room = game.createRoom()

The Room
--------

`room.watch(object || objectId, function(serialized) { ... })` watches an object for changes and returns a
serialized string you can then send over the network.

`room.parse(serialized, function(state) { ... })` parses a serialized state and returns a state object.

`room.applyState(state)` to apply an incoming state object to the room. Automatically handles client prediction.

`room.on('state', function(state) { ... })` fires whenever a message is parsed with `room.parse()`

`room.loop(fn)` The room's main loop. Calls fn on each iteration. `this` is the room object.

`room.addObject(object)` Add an object to the game.

`room.removeObject(object || objectId)` Remove an object from the game.

`room.stringify(object || objectId)` returns a stringified representation of the object with id.
This automatically accounts for changes, so if the inputs don't change, it returns nothing.

Objects
-------
You create your objects yourself and inherit from `Maga.Object`.
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

Your objects require to have these methods: `update` `create` `render` and `destroy`

The `update` method advances the physics state by 1 frame.

The `render` method is called with an object argument containing
the render properties. You can use them to draw wherever
you like, a canvas, the DOM, it's up to you.

The `create` method is used to create the DOM/canvas object.

The `destroy` method to remove the object.

How to handle players
---------------------
Luckily, maga comes with a `playerManager` middleware included. You can use it to do simple player
management for a jump start. Here's an example:

    // maga
    var Maga = require('maga')
      , playerManager = require('middleware/playerManager')
      , Circles = require('circles')

    // new game
    var game = new Maga.Game('Circles')
      , room = game.createRoom()
      , players = playerManager(room, Circles)

The `players` object then has these methods:

`players.set(state)` This parses an incoming state, should be used in the `room.parse()` callback just before `room.applyState()`

`state = players.get()` Gets current state

`player = players.create(id)` Create a new player using our object constructor

`players.remove(object || id)` Remove a player

`me = players.createMyself(id)` Create our character

`players.forEach(function(player, id) { ... })` Iterate players in the room

How to require() in the browser?
--------------------------------
Use this:
    
[express-expose](https://github.com/visionmedia/express-expose)

and then you can do this in your express server:

    app.exposeRequire()
    app.expose(config, 'config')
    app.expose({ inherits: util.inherits }, 'util')
    app.exposeModule(__dirname + '/../maga', 'maga')
    app.exposeModule(__dirname + '/circles', 'circles')
    app.get('/exposed.js', function(req, res) {
      res.setHeader('Content-Type', 'application/javascript')
      res.send(app.exposed())
    })    

in index.html:

    <script src="/exposed.js"></script>
    <script>
    var util = require('util')
      , Maga = require('maga')
      , Circles = require('circles')
      , config = require('config')
    </script>

Resources / Credits
-------------------
[Gaffer on Games](http://gafferongames.com/) Great resource by Glenn Fiedler about physics networking for programmers