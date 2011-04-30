//
// Simple example server
//

var util = require('util')
  , express = require('express')
  , expose = require('express-expose')
  , io = require('socket.io')
  , config = require('confu')(__dirname, 'config.json')

config.port = +(process.env.PORT || process.env.POLLA_PORT || process.argv[2] || config.port || 8080)
config.host = process.env.HOST || process.env.POLLA_HOST || process.argv[3] || config.host || 'localhost'
config.address = 'http://' + config.host + (process.env.PORT || process.env.POLLA_PORT || config.port == 80 ? '' : ':' + config.port)

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
var initDate = new Date().toUTCString()

var app = express.createServer()

app.use(app.router)
app.use(express.static(__dirname))

app.exposeRequire()
app.expose(config, 'config')
app.expose({ inherits: util.inherits }, 'util')
app.exposeModule(__dirname + '/../maga', 'maga')
app.exposeModule(__dirname + '/circles', 'circles')

app.get('/exposed.js', function(req, res) {
  res.setHeader('Content-Type', 'application/javascript')
  res.setHeader('Last-Modified', initDate)
  if (req.headers['if-modified-since'] === initDate) {
    return res.send(304)
  }
  res.send(app.exposed())
})

var cnt = 0
var queue = []
var flush = function() {
  var q
  while (q = queue.shift()) {
    log('flush', ++cnt)
    q.client.broadcast(q.message)
  }
}

var socket = io.listen(app)
socket.on('connection', function(client) {
  var playerId = parseInt(client.sessionId, 10).toString(32)
  log('***** Joined:', playerId)
  config['test latency'] && flush()
  client.on('message', function(message) {
    if (config['test latency']) {
      queue.push({ client: client, message: message })
      setTimeout(function() {
        flush()
      }, Math.random() * config['test latency'] | 0)
    } else client.broadcast(message)
  })
  client.on('disconnect', function() {
    var playerId = parseInt(this.sessionId, 10).toString(32)
    socket.broadcast(JSON.stringify({ 0: { disconnectId: playerId } }))
    log('***** Left:', playerId)
  })
})

app.listen(config.port, config.host, function() {
  log('HTTP Server listening')
})