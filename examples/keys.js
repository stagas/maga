var Keys = function(game) {
  var self = this
  
  this.chr = 0
  this.pressed = 0
  
  this.left = 0
  this.up = 0
  this.right = 0
  this.down = 0
  this.shoot = 0
  this.shootKey = [32,18,16,190,191,90,122,88,120]
  this.game = game
  
  document.onkeydown = function(e) {
    e.preventDefault()
    
    self.checkkeydown(e)
    
    return false
  }
  
  document.onkeyup = function(e) {
    e.preventDefault()
    
    self.checkkeyup(e)
    
    return false
  }
}

Keys.prototype = {
  checkkeydown: function(e) {
    if (typeof e.which === 'undefined' || typeof e.charCode === 'undefined') this.chr = e.keyCode    // IE, Opera
    else if (typeof e.which !== 'undefined' && typeof e.charCode !== 'undefined') this.chr = e.which	  // All others

    switch (this.chr) {
    case 37:
    case 74:
      this.right = 0
      this.left = 1
      break
    case 38:
    case 73:
      this.down = 0
      this.up = 2
      break
    case 39:
    case 76:
      this.left = 0
      this.right = 4
      break
    case 40:
    case 75:
      this.up = 0
      this.down = 8
      break
    default:
      if ( ~this.shootKey.indexOf(this.chr) ) {
        this.shoot = 1
      }
      break
    }

    this.pressed = this.left
                 + this.up
                 + this.right
                 + this.down
  }
	
, checkkeyup: function(e) {
    if (typeof e.which === 'undefined' || typeof e.charCode === 'undefined') this.chr = e.keyCode    // IE, Opera
    else if (typeof e.which !== 'undefined' && typeof e.charCode !== 'undefined') this.chr = e.which	  // All others

    switch (this.chr) {
    case 37:
    case 74:
      this.left = 0
      break
    case 38:
    case 73:
      this.up = 0
      break
    case 39:
    case 76:
      this.right = 0
      break
    case 40:
    case 75:
      this.down = 0
      break
    default:
      if ( ~this.shootKey.indexOf(this.chr) ) {
        this.shoot = 0       
      }
      break
    }

    this.pressed = this.left
                 + this.up
                 + this.right
                 + this.down
  }
}

module.exports = Keys
