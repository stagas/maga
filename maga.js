/*
 * mAKE a gaME (maga)
 *
 * by stagas (gstagas@gmail.com)
 */

var util = require('util')

var Maga = {}

/*
 * Protocol
 * Usage: new Maga.Protocol(game instance, channel instance)
 */
Maga.Protocol = function(game, channel) {
  this.game = game
  this.channel = channel || game.createChannel()
  game.protocol = this
  this.statePrevious = {}
  return this
}

// Serialize state of object id
Maga.Protocol.prototype.stringify = function(id) {
  var obj = {}, state = {}
  state[id] = this.channel.state.current[id]
  var diff = this.channel.state.compare.call(this.channel.state, state, this.statePrevious, ['input'])
  this.statePrevious = state
  obj[this.channel.state.frame || 0] = state || {}
  var str = ''
  if (diff.changes) {
    str = JSON.stringify(obj)
    //console.log('STRINGIFIED CURRENT:', str)
  }
  return str
}
 
// Apply given state to game 
Maga.Protocol.prototype.parse = function(stringified) {
  var state = JSON.parse(stringified)
  //console.log('RECEIVED STRINGIFIED:', state)
  return state
}

Maga.Protocol.prototype.applyState = function(myId, state) {
  for (var frame in state) {
    if (!frame) frame = 0
    this.channel.state.set.call(this.channel.state, state[frame])
    this.channel.state.replay.call(this.channel.state, myId, frame, state[frame])
  }
}

/*
 * Game
 */
Maga.Game = function(options) {
  this.name = 'Maga Game'
  this.frameTime    = 1000 / 45
  this.loopTime     = 1000 / 135
  this.maxFrameTime = 1000 / 46
  this.syncTime     = 1000 / 15
  for (var k in options) {
    this[k] = options[k]
  }
  this.channels = {}
  this.protocol = null
}

// Get an option value
Maga.Game.prototype.get = function(key) {
  return this[key]
}

// Set an option value
Maga.Game.prototype.set = function(key, val) {
  return this[key] = val
}

// Create a channel of ID
Maga.Game.prototype.createChannel = function(id) {
  if (!id) id = Math.random() * 100000 | 0
  this.channels[id] = new Maga.Channel(id, this)
  return this.channels[id]
}

// Destroy a channel by ID or object
Maga.Game.prototype.destroyChannel = function(channel) {
  if ('object' !== typeof channel) channel = this.channels[channel]
  channel.destroy()
  return this
}

/*
 * Channel
 */
Maga.Channel = function(id, game) {
  this.id = id
  this.game = game
  this.objects = {}
  this.state = new Maga.State(this)
}

// Destroy channel and remove from game
Maga.Channel.prototype.destroy = function() {
  for (var id in this.objects) {
    delete this.objects[id]
  }
  delete this.game.channels[this.id]
  return this
}

// Add an object to the channel
Maga.Channel.prototype.addObject = function(obj) {
  obj.channel = this
  this.objects[obj.id] = obj
  return this
}

// Remove an object from the channel
Maga.Channel.prototype.removeObject = function(obj) {
  if ('object' !== typeof obj) obj = this.objects[obj]
  obj && obj.destroy()
  delete this.objects[obj.id]
  return this
}

// Main channel game loop
Maga.Channel.prototype.loop = function() {
  var self = this
  self.state.tick()
  setTimeout(function() {
    self.loop()
  }, self.game.loopTime)
}

/*
 * Object
 */
Maga.Object = function(id, channel) {
  this.id = id
  this.channel = channel
  
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
      this.properties.all.push(p)
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
Maga.State = function(channel) {
  this.channel = channel

  // Current and previous state objects
  this.current = {}
  this.previous = {}

  // Frame position
  this.frame = 0
  
  // History object
  this.history = {}

  // Init timer
  this.timer = new Maga.Timer(channel.game)
  
  var self = this
  setTimeout(function() {
    if (!self.frame || isNaN(self.frame)) self.frame = 1
  }, 5000)
}

// Update state of all our objects (move 1 frame forward)
Maga.State.prototype.update = function() {
  for (var id in this.channel.objects) {
    this.channel.objects[id].update()
  }
  return this
}

// Advance state by n frames
Maga.State.prototype.advance = function(n) {
  while (n--) {
    this.update()
  }
}

// Get entire channel current state
Maga.State.prototype.get = function() {
  var state = {}
  for (var id in this.channel.objects) {
    state[id] = this.channel.objects[id].state()
  }
  return state
}

// Apply an entire channel state
Maga.State.prototype.set = function(state, types) {
  for (var id in state) {
    if (this.channel.objects.hasOwnProperty(id))
      this.channel.objects[id].applyState(state[id], types)
  }
  this.current = state
  return this.channel.state.get()
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
    delete this.history[this.frame - 500]
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
    }

    alpha[id] = frame
  }
  return alpha
}

// Render objects with given state
Maga.State.prototype.render = function(state) {
  for (var id in state) {
    if (state[id] && this.channel.objects[id]) this.channel.objects[id].render(state[id])
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
// NOTE: Not quite yet - now just advances only the received object
// TODO: Need to resolve conflicts
Maga.State.prototype.replay = function(myId, frame, state) {
  delete state[myId]
  frame = parseInt(frame, 10)
  if (!isNaN(frame) && !this.frame && frame && frame > 0) {
    console.log('SETTING FRAME:', frame)
    this.frame = frame
  }

  if (!this.frame || isNaN(frame) || frame == 0) return

  this.set(state)

  for (var id in state) {
    if (this.channel.objects.hasOwnProperty(id)) {
      this.channel.objects[id].applyState(state[id])  
    }
  }
  
  var newState = {}

  if (frame > this.frame) this.frame = frame - 1
  else for (var f = 0; f < (this.frame - frame); f++) {
    if (!this.history[f]) this.history[f] = {}
  
    for (var id in state) {
      if (this.channel.objects.hasOwnProperty(id)) {
        history[f] && this.channel.objects[id].applyState(history[f][id], ['input'])
        this.channel.objects[id].update()
        newState[id] = this.channel.objects[id].state()
        this.history[f][id] = newState[id]       
      }
    }
  }
    
  this.frame--
  if (Object.keys(newState).length) {
    this.set(newState)
    return newState
  }
  
  return
}

// Compare two states and return a diff
Maga.State.prototype.compare = function(a, b, types) {
  var self = this
    , changes = 0
    , diff = {}
  
  function exists(id, p) {
    var exists = false  

    for (var type, i = types.length; i--;) {
      type = types[i]
      if (~self.channel.objects[id].properties[type].indexOf(p)) {
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
        }
        else if (a[id][p] !== b[id][p]) {
          changes++
          diff[id][p] = a[id][p]
        }
      }
    }
  }

  return { diff: diff, changes: changes }
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
