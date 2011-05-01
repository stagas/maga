//
// Cars game
//

Math.PIHC = Math.PI / 180

Math.cosa = function(a) {
  return Math.round(Math.cos(a * Math.PIHC) * 10000) / 10000
}

Math.sina = function(a) {
  return Math.round(Math.sin(a * Math.PIHC) * 10000) / 10000
}

Math.sgn = function(a) {
  if (a<0) return -1
  else if (a>0) return 1
  else return 0
}

var util = require('util')
  , Keys = require('keys')
  , Maga = require('maga')

var Car = function() {
  Maga.Object.apply(this, arguments)

  this.register({
    // Values used to render (draw) object
    render: {
      x: 100
    , y: 100
    , a: 0
    }
    
    // Input values that determine behavior
  , input: {
      steer: 0
    , torque: 0
    , brakes: 0
    }

    // Values that change
  , dynamic: {
      keys: 0
    , v: 0
    , vx: 0
    , vy: 0
    }
    
    // Values that don't change
  , static: {
      f: 0.985
    , acc: 1.044
    , maxVelocity: 14
    , steerSpeed: 4
    }
  })
}

util.inherits(Car, Maga.Object)

Car.prototype.update = function() {
  this.a += this.steer * this.steerSpeed
  if (this.torque) {
    this.v = Math.min(Math.max(1, this.v * ((5 / (1 + this.v)) * this.acc), this.maxVelocity))
    // calculate new xy velocities
    this.vx += (this.v * Math.cosa(this.a)) / 50
    this.vy += (this.v * Math.sina(this.a)) / 50
  } else {
    // calculate new xy velocities
    this.vx += (this.v * Math.cosa(this.a)) / 200
    this.vy += (this.v * Math.sina(this.a)) / 200
  }
  this.x += this.vx
  this.y += this.vy
  if (this.x < 30) this.x = 30
  if (this.x > 1200) this.x = 1200
  if (this.y < 50) this.y = 50
  if (this.y > 600) this.y = 600
  this.vx *= this.f
  this.vy *= this.f  
  this.v *= this.f
  return this
}

Car.prototype.processKeys = function(keys) {
  this.keys = keys
  if (keys.up) this.torque = 1, this.brakes = 0
  if (keys.right) this.steer = 1
  if (keys.left) this.steer = -1
  if (keys.down) this.torque = 0, this.brakes = 1
  if (!keys.right && !keys.left) this.steer = 0
  if (!keys.up) this.torque = 0
  return this
}

Car.prototype.create = function() {
  var val = parseInt(this.id, 32), r, g, b
  r = parseInt(val.toString().substr(5, 3), 10)
  while (r > 255) { r = Math.floor(r / 2) }
  g = parseInt(val.toString().substr(9, 3), 10)
  while (g > 255) { g = Math.floor(g / 2) }
  b = parseInt(val.toString().substr(11, 3), 10)
  while (b > 255) { b = Math.floor(b / 2) }

  this.object = $('<div class="car" style="background-color:rgb(' + [r,g,b] + ') !important;" id="'+ this.id +'"></div>')
  this.object.appendTo('body')

  return this
}

Car.prototype.render = function(state) {
  this.object.css({ left: state.x, top: state.y })
  this.object.css('transform', 'rotate(' + state.a + 'deg)')
  return this
}

Car.prototype.destroy = function() {
  this.object.remove()
}

// The player!
var Player = exports.Player = function() {
  Car.apply(this, arguments)
}
util.inherits(Player, Car)
