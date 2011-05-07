// helpers

exports.cosa = function(a) {
  return Math.round(Math.cos(a * (Math.PI / 180)) * 10000) / 10000
}

exports.sina = function(a) {
  return Math.round(Math.sin(a * (Math.PI / 180)) * 10000) / 10000
}

exports.circleToCircle = function(a, b, distOffset) {
  var ret = { collided: false }
  distOffset = distOffset || 0
  var ho = distOffset / 2
  ret.dx = (b.x - ho) - (a.x - ho)
  ret.dy = (b.y - ho) - (a.y - ho)
  ret.dist = Math.sqrt(ret.dx*ret.dx + ret.dy*ret.dy)
  ret.minDist = (a.width / 2 + b.width / 2) + distOffset
  if (ret.dist < ret.minDist) {
    ret.collided = true
    ret.angle = Math.atan2(ret.dy, ret.dx)
    ret.tx = (a.x - ho) + (Math.cos(ret.angle) * ret.minDist)
    ret.ty = (a.y - ho) + (Math.sin(ret.angle) * ret.minDist)
    ret.sx = ret.tx - (b.x - ho)
    ret.sy = ret.ty - (b.y - ho)
  }
  return ret
}

exports.randOrd = function() {
  return Math.round(Math.random()) - 0.5
}