//
// Haxball game
//

var util = require('util')
  , help = require('lib/helpers')
  , Maga = require('maga')

var Circle = function() {
  Maga.Object.apply(this, arguments)
  
  var val = parseInt(this.id, 32), size
  size = 30

  this.register({
    // Values used to render (draw) object
    render: 
      { x: Math.random() * 800 | 0
      , y: Math.random() * 400 | 0
      }
    
    // Input values that determine behavior
  , input: 
      { k: 0
      , shot: 0
      , shoot: false
      , name: val
      }

    // Values that change
  , dynamic: 
      { keys: {}
      , v: 0
      , vx: 0
      , vy: 0
      , a: 0
      }
    
    // Values that don't change
  , static:
      { f: 0.971
      , acc: 0.17
      , bounce: 0.35
      , maxVelocity: 5
      , steer: 14
      , width: size
      , height: size
      , color: null
      }
  })
}

util.inherits(Circle, Maga.Object)

Circle.prototype.update = function() {
  var hw = this.width / 2 | 0
    , hh = this.height / 2 | 0
  
  if (this.keys.up) this.vy -= this.acc
  if (this.keys.down) this.vy += this.acc
  if (this.keys.left) this.vx -= this.acc
  if (this.keys.right) this.vx += this.acc
  if (this.vx > this.maxVelocity) this.vx = this.maxVelocity
  else if (this.vx < -this.maxVelocity) this.vx = -this.maxVelocity
  if (this.vy > this.maxVelocity) this.vy = this.maxVelocity
  else if (this.vy < -this.maxVelocity) this.vy = -this.maxVelocity
  
  this.x += this.vx
  this.y += this.vy
  if (this.x < hw) this.x = hw, this.vx = -this.vx * this.bounce
  if (this.x > 800 - hw) this.x = 800 - hw, this.vx = -this.vx * this.bounce
  if (this.y < hh) this.y = hh, this.vy = -this.vy * this.bounce
  if (this.y > 400 - hh) this.y = 400 - hh, this.vy = -this.vy * this.bounce
  this.vx *= this.f
  this.vy *= this.f  

  var self = this
  var dist, minDist, dx, dy, angle, sx, sy
    , tx, ty

  Object.keys(this.room.objects).sort(help.randOrd).forEach(function(id) {
    if (id == self.id) return

    var obj = self.room.objects[id]
    if (!obj.x || !obj.y) return
    
    var c = help.circleToCircle(self, obj)

    if (c.collided) {
      self.x -= c.sx
      self.y -= c.sy
      self.vx -= c.sx / 12
      self.vy -= c.sy / 12
      obj.vx += c.sx / 12
      obj.vy += c.sy / 12

      if (self.id === 'ball' && obj.shoot) {
        self.vx -= c.sx * 50
        self.vy -= c.sy * 50
      } else if (obj.id === 'ball' && self.shoot) {
        obj.vx += c.sx * 50
        obj.vy += c.sy * 50
      }
        
    }
  })
  this.ox = this.x
  this.oy = this.y
  return this
}

Circle.prototype.processKeys = function(keys) {
  this.keys = keys
  this.k = keys.pressed
  this.shoot = keys.shoot ? true : false
  return this
}

Circle.prototype.create = function() {
  var val = parseInt(this.id, 32), r, g, b
  if (!this.color) {
    if (val % 2 === 0) {
      r = 0
      g = 0
      b = 255
    } else {
      r = 255
      g = 0
      b = 0
    }
  } else r = this.color[0], g = this.color[1], b = this.color[2]

  this.object = $('<div class="circle" style="background-color:rgb(' + [r,g,b] + ') !important; width:' + this.width +'px; height:' + this.height + 'px; margin-left: -'+Math.floor(this.width/2)+'px; margin-top: -'+Math.floor(this.height/2)+'px;" id="'+ this.id +'"></div>')
  this.object.appendTo('body')
  return this
}

Circle.prototype.render = function(state) {
  this.object.css({ left: state.x, top: state.y })
  if (this.oldShoot != this.shoot) {
    this.object[(this.shoot ? 'add' : 'remove') + 'Class']('highlight')
    this.oldShoot = this.shoot
  }
  if (this.oldName != this.name) {
    this.oldName = this.name
  }
  return this
}

Circle.prototype.destroy = function() {
  this.object.remove()
}

// The player!
var Player = exports.Player = function() {
  Circle.apply(this, arguments)
}
util.inherits(Player, Circle)

// The ball!
var Ball = exports.Ball = function() {
  Circle.apply(this, arguments)
  this.id = 'ball'
  this.register({ input: { collision: false } })
  this.color = [ 255, 255, 255 ]
  this.f = 0.995
  this.width = 40
  this.height = 40
  this.bounce = 0.85
}

util.inherits(Ball, Circle)
