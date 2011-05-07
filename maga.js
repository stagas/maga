/*
 * mAKE a gaME (maga)
 *
 * by stagas (gstagas@gmail.com)
 *
 * MIT licenced
 */

var util = require('util')
  , EventEmitter = require('events').EventEmitter

var Maga = {}

var debug

/*
 * Game
 */
Maga.Game = function(name, options) {
  if ('object' === typeof name)
    options = name, name = 'Maga Game'

  this.name         = name
  this.frameTime    = 1000 / 45
  this.loopTime     = 1000 / 135
  this.maxFrameTime = 1000 / 45
  this.syncTime     = 1000 / 15
  this.lag          = 110
  this.draw         = ('undefined' !== typeof window)
  this.debug        = 0
  for (var k in options) {
    this[k] = options[k]
  }
 
  this.rooms = {}

  if (this.debug) debug = function(level) {
    if (level <= this.debug)
      console.log.apply(console, [].slice.call(arguments, 1))
  }  
}

// Get an option value
Maga.Game.prototype.get = function(key) {
  return this[key]
}

// Set an option value
Maga.Game.prototype.set = function(key, val) {
  return this[key] = val
}

// Create a room of ID
Maga.Game.prototype.createRoom = function(id) {
  if (!id) id = Math.random() * 100000 | 0
  this.rooms[id] = new Maga.Room(id, this)
  return this.rooms[id]
}

// Destroy a room by ID or object
Maga.Game.prototype.destroyRoom = function(room) {
  if ('object' !== typeof room) room = this.rooms[room]
  room.destroy()
  return this
}

/*
 * Protocol
 */
Maga.Protocol = function(room) {
  this.room = room
  this.state = room.state
  this.statePrevious = {}
  return this
}

// Serialize object <id> state
Maga.Protocol.prototype.stringify = function(id, force) {
  if ('object' === typeof id) id = id.id
  var obj = {}, state = {}
  state[id] = this.room.objects && id && this.room.objects[id] && this.room.objects[id].state()
  var diff = this.state.compare.call(this.state, state, this.statePrevious, ['input'])
  var str = ''
  if (diff.changes || force) {
    //if (!force)
      //diff = this.state.compare.call(this.state, state, this.statePrevious)

    obj[this.state.frame || 0] = state || {}
    str = JSON.stringify(obj)
    this.statePrevious = state
    //console.log('STRINGIFIED CURRENT:', str)
  }
  return str
}

// Parse state object
Maga.Protocol.prototype.parse = function(stringified, cb) {
  var state = JSON.parse(stringified)
  this.room.emit('state', state)
  //console.log('RECEIVED STRINGIFIED:', state)
  cb && cb(state)
  return state
}

/*
 * Room
 */
Maga.Room = function(id, game) {
  var self = this
  this.id = id
  this.game = game
  this.objects = {}
  this.state = new Maga.State(this)
  this.protocol = new Maga.Protocol(this)
  this.watching = {}
  setInterval(function() {
    var str, cb
    for (var id in self.watching) {
      cb = self.watching[id]
      str = self.stringify(id)
      if (str && str.length) {
        self.emit('sync', id, str)
        cb && cb(str)
      }
    }
  }, this.game.syncTime)
  EventEmitter.call(this)
}

util.inherits(Maga.Room, EventEmitter)

Maga.Room.prototype.stringify = function() {
  return this.protocol.stringify.apply(this.protocol, arguments)
}

Maga.Room.prototype.parse = function() {
  return this.protocol.parse.apply(this.protocol, arguments)
}

// Destroy room and remove from game
Maga.Room.prototype.destroy = function() {
  for (var id in this.objects) {
    delete this.objects[id]
  }
  delete this.game.rooms[this.id]
  return this
}

// Add an object to the room
Maga.Room.prototype.addObject = function(obj) {
  obj.room = this
  this.objects[obj.id] = obj
  return this
}

// Remove an object from the room
Maga.Room.prototype.removeObject = function(id) {
  if ('object' === typeof id) id = id.id
  this.game.draw && this.objects[id] && this.objects[id].destroy()
  delete this.objects[id]
  return this
}

Maga.Room.prototype.applyState = function(state) {
  for (var frame in state) {
    if (!frame || isNaN(frame)) continue
    var newState = this.state.replay(frame, state[frame])
    this.state.set(newState)
  }
}

Maga.Room.prototype.watch = function(id, cb) {
  if ('object' === typeof id) id = id.id
  this.watching[id] = cb
}

Maga.Room.prototype.unwatch = function(id) {
  if ('object' === typeof id) id = id.id
  delete this.watching[id]
}

// Main room game loop
Maga.Room.prototype.loop = function(fn) {
  var self = this
  self.state.tick()
  fn && fn.call(self)
  setTimeout(function() {
    self.loop(fn)
  }, self.game.loopTime)
}

/*
 * Object
 */
Maga.Object = function(id, room) {
  this.id = id
  this.room = room
  
  // Our property types
  this.properties = {
    all: []
  , render: []
  , input: []
  , dynamic: []
  , static: []
  }
}

// Register object properties
// This defines properties types but they are
// all available in this.<property>
Maga.Object.prototype.register = function(obj) {
  for (var type in obj) {
    for (var p in obj[type]) {
      this[p] = obj[type][p]
      this.properties[type].push(p)
      if (type !== 'static') this.properties.all.push(p)
    }
  }
  return this
}

// Get current object state
Maga.Object.prototype.state = function() {
  var state = {}
  for (var p, i = this.properties.all.length; i--; ) {
    p = this.properties.all[i]
    state[p] = this[p]
  }
  return state
}

// Change entire object state
// optionally using only specific property types
Maga.Object.prototype.applyState = function(state, types) {
  if (!types || !types.length)
    for (var p in state) {
      this[p] = state[p]
    }
  else
    for (var p in state) {
      for (var i = types.length; i--;) {
        if (~this.properties[types[i]].indexOf(p)) {
          this[p] = state[p]
          break
        }
      }
    }
  return this
}

/*
 * Timer
 */

// NOTE: Maybe all objects should have a timer instance
Maga.Timer = function(game, target) {
  this.game = game
	this.now = Date.now()
	this.before = this.now
  this.target = target
	this.accumulator = game[this.target || 'frameTime']
}

// Calculate new tick
Maga.Timer.prototype.tick = function() {
  this.now = Date.now()
  this.accumulator += Math.min(this.now - this.before, this.game.maxFrameTime)
  this.before = this.now
}

// Overflow timer based on given ms
Maga.Timer.prototype.overflow = function() {
  return this.accumulator >= this.game[this.target || 'frameTime'] && 
    !!(this.accumulator -= this.game[this.target || 'frameTime'])
}

// Calculate alpha
Maga.Timer.prototype.alpha = function() {
  return this.accumulator / this.game[this.target || 'frameTime']
}

/*
 * State
 */
Maga.State = function(room) {
  this.room = room
  this.game = room.game

  // Current and previous state objects
  this.current = {}
  this.previous = {}

  // Frame position
  this.frame = 1
  
  // History object
  this.history = {}

  // Init timer
  this.timer = new Maga.Timer(room.game)
}

// Update state of all our objects (move 1 frame forward)
Maga.State.prototype.update = function() {
  for (var id in this.room.objects) {
    this.room.objects[id].update()
  }
  return this
}

// Advance state by n frames
Maga.State.prototype.advance = function(n) {
  while (n--) {
    this.update()
  }
}

// Get entire room current state
Maga.State.prototype.get = function() {
  var state = {}
  for (var id in this.room.objects) {
    state[id] = this.room.objects[id].state()
  }
  return state
}

// Apply an entire room state
Maga.State.prototype.set = function(state, types) {
  for (var id in state) {
    if (this.room.objects.hasOwnProperty(id))
      this.room.objects[id].applyState(state[id], types)
  }
  this.current = state
  return this.room.state.get()
}

// Push a state frame
Maga.State.prototype.push = function(state) {
  // Save previous state
  this.previous = this.current
  
  if (this.frame) {
    // Advance frame position
    this.frame++

    // Save to history
    this.history[this.frame] = this.current
  
    // Limit history length
    try {
      delete this.history[this.frame - 100]
    } catch(e) {}
  }

  // Set our new state
  this.current = state
}

// Calculate alpha state position
Maga.State.prototype.alpha = function(a) {
  var alpha = {}
    , current
    , previous
    , frame
    
  for (var id in this.current) {
    frame = {}
    
    current = this.current[id]
    previous = this.previous && this.previous[id] || this.current[id]
    
    for (var p in current) {
      // Interpolate number values between previous and current based on alpha,
      if ('number' === typeof previous[p])
        frame[p] = Math.round(current[p] * a + previous[p] * (1 - a))

      // or pick a state based on how close we are to each state
      else frame[p] = a >= 0.5
        ? current[p] 
        : 'undefined' !== typeof previous[p] && previous[p]
          || current[p]
      if (isNaN(frame[p])) frame[p] = current[p]
    }

    alpha[id] = frame
  }
  return alpha
}

// Render objects with given state
Maga.State.prototype.render = function(state) {
  if (this.game.draw) {
    for (var id in state) {
      if (state[id] && this.room.objects[id] && this.room.objects[id]) this.room.objects[id].render(state[id])
    }
  }
}

// Main state tick
Maga.State.prototype.tick = function() {
  // Tick timer
  this.timer.tick()
  
  // If timer lags behind, push states quickly to catch up
  while (this.timer.overflow()) {
    this.update()
    this.push(this.get())
  }
  
  // Finally render,
  this.render(
    // an alpha state,
    this.alpha(
      // according to our time position
      this.timer.alpha()
    )
  )
}

// Replay a history range according to some state input in the past
Maga.State.prototype.replay = function(frame, state) {
  frame = parseInt(frame, 10)
  
  var lag = Math.round(this.game.lag / this.game.frameTime)
  if (frame + lag > this.frame) {
    this.frame = frame + lag
  } else if (frame + lag < this.frame - lag) {
    this.frame = frame + Math.round(lag * 1.1)
  }

  if (Math.abs(this.frame - frame) > 100) return
  
  this.previous = this.get()

  this.set(state)


  var newState = {}

  for (var f = frame; f < this.frame; f++) {
    for (var id in state) {
      if (id in this.room.objects) {
        this.room.objects[id].update()
        newState[id] = this.room.objects[id].state()
      }
    }
  }
  
  this.set(newState)
  
  return newState
}

// Compare two states and return a diff
Maga.State.prototype.compare = function(a, b, types) {
  var self = this
    , changes = 0
    , percentage = 0
    , diff = {}
  
  types = types || [ 'all' ]
  
  function exists(id, p) {
    var exists = false

    for (var type, i = types.length; i--;) {
      type = types[i]
      if (~self.room.objects[id].properties[type].indexOf(p)) {
        exists = true
        break
      }
    }
    
    return exists
  }
  for (var id in a) {
    if ('undefined' === typeof diff[id]) diff[id] = {}
    for (var p in a[id]) {
      if (exists(id, p)) {
        if (!b[id]) b[id] = {}
        if ('undefined' === typeof b[id][p]) {
          changes++
          diff[id][p] = a[id][p]
          percentage += 1
        }
        else if (a[id][p] !== b[id][p]) {
          changes++
          diff[id][p] = a[id][p]
          percentage += Math.abs((diff[id][p] - b[id][p]) / diff[id][p])
        }
      }
    }
  }

  return { diff: diff, changes: changes, percentage: percentage / changes }
}

module.exports = exports = Maga

// Utils

function clone(o) {
  if(o == null || typeof(o) != 'object')
    return o

  var temp = o.constructor()

  for(var k in o)
    temp[k] = clone(o[k])
    
  return temp
}
