//
// Simple circles game
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

function randOrd(){
return (Math.round(Math.random())-0.5); }

Circle.prototype.update = function() {
  this.vx += (this.tx - this.ox) / 80
  this.vy += (this.ty - this.oy) / 80
  this.x += this.vx
  this.y += this.vy
  this.vx *= this.f
  this.vy *= this.f

  var self = this
  var dist, minDist, dx, dy, angle, sx, sy
    , tx, ty
  Object.keys(this.channel.objects).sort(randOrd).forEach(function(id) {
    
    if (id == self.id) return
    
    var obj = self.channel.objects[id]
    if (!obj.x || !obj.y) return
    
    dx = obj.x - self.x
    dy = obj.y - self.y
    dist = Math.sqrt(dx*dx + dy*dy)
    minDist = self.width / 2 + obj.width / 2
    if (dist < minDist) {
      angle = Math.atan2(dy, dx)
      tx = self.x + (Math.cos(angle) * minDist)
      ty = self.y + (Math.sin(angle) * minDist)
      sx = tx - obj.x
      sy = ty - obj.y
      
      self.x -= sx
      self.y -= sy
      self.vx -= sx / 3
      self.vy -= sy / 3 
      obj.vx += sx / 3
      obj.vy += sy / 3
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
