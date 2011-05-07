var PlayerManager = module.exports = function(room, magaObject, options) {
  if (!(this instanceof PlayerManager)) return new PlayerManager(room, magaObject, options)
  this.room = room
  this.game = room.game
  this.magaObject = magaObject
  this.players = {}
  this.me
  this.state
  this.ignore = []
  for (var k in options) {
    this[k] = options[k]
  }
  return this
}

PlayerManager.prototype = {
  set: function(state) {
    this.state = state
    for (var frame in state) {
      for (var id in state[frame]) {
        if (this.me && id == this.me.id) {
          delete state[frame][id]
          continue
        
        } else if (id == 'disconnectId') {
          console.log('DISCONNECTED', state[frame].disconnectId)
          return this.remove(state[frame].disconnectId)
          
        } else if (!(id in this.players) && !~this.ignore.indexOf(id)) {
          console.log('ADDING PLAYER ' + id)
          var player = this.create(id)
          this.room.addObject(this.players[id])
        }
      }
    }
    return state
  }
, get: function() {
    return this.state
  }
, create: function(id) {
    this.players[id] = new this.magaObject.Player(id)
    if (this.game.draw) this.players[id].create()
    return this.players[id]
  }
, remove: function(id) {
    return this.room.removeObject(id)
  }
, createMyself: function(id) {
    this.me = this.create(id)
    return this.me
  }
, forEach: function(fn) {
    for (var id in this.players) {
      fn(this.players[id], id)
    }
  }
}
