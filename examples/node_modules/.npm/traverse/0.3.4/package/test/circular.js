var assert = require('assert');
var Traverse = require('traverse');
var util = require('util');

exports.circular = function (assert) {
    var obj = { x : 3 };
    obj.y = obj;
    var foundY = false;
    Traverse(obj).forEach(function (x) {
        if (this.path.join('') == 'y') {
            assert.equal(
                util.inspect(this.circular.node),
                util.inspect(obj)
            );
            foundY = true;
        }
    });
    assert.ok(foundY);
};

exports.deepCirc = function () {
    var obj = { x : [ 1, 2, 3 ], y : [ 4, 5 ] };
    obj.y[2] = obj;
    
    var times = 0;
    Traverse(obj).forEach(function (x) {
        if (this.circular) {
            assert.eql(this.circular.path, []);
            assert.eql(this.path, [ 'y', 2 ]);
            times ++;
        }
    });
    
    assert.eql(times, 1);
};

exports.doubleCirc = function () {
    var obj = { x : [ 1, 2, 3 ], y : [ 4, 5 ] };
    obj.y[2] = obj;
    obj.x.push(obj.y);
    
    var circs = [];
    Traverse(obj).forEach(function (x) {
        if (this.circular) {
            circs.push({ circ : this.circular, self : this, node : x });
        }
    });
    
    assert.eql(circs[0].self.path, [ 'x', 3, 2 ]);
    assert.eql(circs[0].circ.path, []);
     
    assert.eql(circs[1].self.path, [ 'y', 2 ]);
    assert.eql(circs[1].circ.path, []);
    
    assert.eql(circs.length, 2);
};

exports.circDubForEach = function () {
    var obj = { x : [ 1, 2, 3 ], y : [ 4, 5 ] };
    obj.y[2] = obj;
    obj.x.push(obj.y);
    
    Traverse(obj).forEach(function (x) {
        if (this.circular) this.update('...');
    });
    
    assert.eql(obj, { x : [ 1, 2, 3, [ 4, 5, '...' ] ], y : [ 4, 5, '...' ] });
};

exports.circDubMap = function () {
    var obj = { x : [ 1, 2, 3 ], y : [ 4, 5 ] };
    obj.y[2] = obj;
    obj.x.push(obj.y);
    
    var c = Traverse(obj).map(function (x) {
        if (this.circular) {
            this.update('...');
        }
    });
    
    assert.eql(c, { x : [ 1, 2, 3, [ 4, 5, '...' ] ], y : [ 4, 5, '...' ] });
};

exports.circClone = function () {
    var obj = { x : [ 1, 2, 3 ], y : [ 4, 5 ] };
    obj.y[2] = obj;
    obj.x.push(obj.y);
    
    var clone = Traverse.clone(obj);
    assert.ok(obj !== clone);
    
    assert.ok(clone.y[2] === clone);
    assert.ok(clone.y[2] !== obj);
    assert.ok(clone.x[3][2] === clone);
    assert.ok(clone.x[3][2] !== obj);
    assert.eql(clone.x.slice(0,3), [1,2,3]);
    assert.eql(clone.y.slice(0,2), [4,5]);
};
