/*
 * Simple circles game
 */

var util = require('util')
  , help = require('lib/helpers')
  , Maga = require('maga')

var Circle = function() {
  Maga.Object.apply(this, arguments)

  var val = parseInt(this.id, 32), size
  size = parseInt(val.toString().substr(0, 2), 10)

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
    , width: size
    , height: size
    }
    
    // Values that don't change
  , static: {
      f: 0.95
    }
  })
}

util.inherits(Circle, Maga.Object)

Circle.prototype.update = function() {
  this.vx += ((this.tx - this.ox) / 135)
  this.vy += ((this.ty - this.oy) / 135)
  this.x += this.vx
  this.y += this.vy
  this.x = Math.floor(this.x)
  this.y = Math.floor(this.y)
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
    }
  })
  this.ox = this.x
  this.oy = this.y
  return this
}

Circle.prototype.move = function(x, y) {
  this.tx = x
  this.ty = y
  return this
}

Circle.prototype.create = function() {
  var val = parseInt(this.id, 32), r, g, b
  r = parseInt(val.toString().substr(5, 3), 10)
  while (r > 255) { r = Math.floor(r / 2) }
  g = parseInt(val.toString().substr(9, 3), 10)
  while (g > 255) { g = Math.floor(g / 2) }
  b = parseInt(val.toString().substr(11, 3), 10)
  while (b > 255) { b = Math.floor(b / 2) }

  this.object = $('<div class="circle" style="background-color:rgb(' + [r,g,b] + ') !important; width:' + this.width +'px; height:' + this.height + 'px; margin-left: -'+this.width/2+'px; margin-top: -'+this.height/2+'px;" id="'+ this.id +'"></div>')
  this.object.appendTo('body')
  return this
}

Circle.prototype.render = function(state) {
  this.object.css({ left: state.x, top: state.y })
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

// helpers
