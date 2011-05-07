/*
 * Cars game server
 */

require.paths.unshift(__dirname, __dirname + '/../')

var util = require('util')
  , express = require('express')
  , expose = require('express-expose')
  , io = require('socket.io')
  , config = require('confu')(__dirname, 'config.json')

config.port = +(process.env.PORT || process.env.POLLA_PORT || process.argv[2] || config.port || 8080)
config.host = process.env.HOST || process.env.POLLA_HOST || process.argv[3] || config.host || 'localhost'
config.address = 'http://' + config.host + (process.env.PORT || process.env.POLLA_PORT || config.port == 80 ? '' : ':' + config.port)

// http server
var app = express.createServer()

// middleware
app.use(function(req, res, next) {
  log(req.url, req.connection.remoteAddress)
  next()
})
app.use(function(req, res, next) {
  if (req.url === '/') req.url = '/hax.html'
  next()
})
app.use(app.router)
app.use(express.static(__dirname))

// expose libs to client
app.exposeRequire()
app.expose(config, 'config')
app.expose({ inherits: util.inherits }, 'util')
app.exposeModule('lib/events', 'events')
app.exposeModule('maga', 'maga')
app.exposeModule('middleware/playerManager', 'middleware/playerManager')
app.exposeModule('lib/keys', 'lib/keys')
app.exposeModule('lib/helpers', 'lib/helpers')
app.exposeModule('hax', 'hax')
app.get('/exposed.js', function(req, res) {
  res.send(app.exposed())
})

// listen http server
app.listen(config.port, config.host, function() {
  log('HTTP Server listening')
})

// maga
var Maga = require('maga')
  , playerManager = require('middleware/playerManager')
  , help = require('lib/helpers')
  , Hax = require('hax')

// new game
var game = new Maga.Game('Hax', { syncTime: 1000 / 1, lag: 50 }) // todo: determine lag
  , room = game.createRoom()
  , players = playerManager(room, Hax, { ignore: 'ball' })

var ball = new Hax.Ball()
room.addObject(ball)

// todo: this is common, should be an internal method
var statePrevious = {}
setInterval(function() {
  var obj = {}
  var diff = room.state.compare(room.state.current, statePrevious)
  if (diff.changes) {
    obj[room.state.frame] = diff.diff
    socket.broadcast(JSON.stringify(obj))
  }
  statePrevious = room.state.current || {}
}, 1000)

// main loop
room.loop(function() {
  //
})

// socket.io server
var socket = io.listen(app)

socket.on('connection', function(client) {
  var playerId = parseInt(client.sessionId, 10).toString(32)
  log('***** Joined:', playerId)

  // send ball
  client.send(room.stringify(ball, true))

  // send other players state to our newly joined client
  players.forEach(function(player, id) {
    client.send(room.stringify(player, true))
  })

  // add player to room
  var player = players.create(playerId)
  room.addObject(player)

  // parse incoming client action
  client.on('message', function(message) {
    room.parse(message, function(state) {
      players.set(state)
      room.applyState(state)
    })
    
    // broadcast to other clients
    client.broadcast(message)
  })

  // player disconnected
  client.on('disconnect', function() {
    var playerId = parseInt(this.sessionId, 10).toString(32)
    log('***** Left:', playerId)
    players.remove(playerId)
    socket.broadcast(JSON.stringify({ 0: { disconnectId: playerId } }))
  })
})

// utilities
function log() {
  var args = [].slice.call(arguments)
  var d = new Date()
  args.unshift(
    d.toUTCString().split(' ').splice(1,2).join(' ')
  , d.toTimeString().split(' ').splice(0,1).join(' ')
  , '-'
  , config.address
  , '-'
  )
  console.log.apply(this, args)
}