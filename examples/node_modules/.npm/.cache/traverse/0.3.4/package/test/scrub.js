var assert = require('assert');
var Traverse = require('traverse');

exports.remove = function (assert) {
    var obj = { a : 1, b : [ 2, function () {}, 3 ], c : function () {} };
    
    var objT = Traverse(obj).map(function (x) {
        if (typeof x === 'function') this.remove();
    });
    
    assert.eql(Object.keys(obj), [ 'a', 'b', 'c' ]);
    assert.eql(typeof obj.b[1], 'function');
    assert.eql(obj.a, 1);
    assert.eql(obj.b[0], 2);
    assert.eql(obj.b[2], 3);
    assert.eql(typeof obj.c, 'function');
    
    assert.eql(objT, { a : 1, b : [ 2, 3 ] });
    assert.eql(Object.keys(objT), [ 'a', 'b' ]);
};

exports.delete = function (assert) {
    var obj = { a : 1, b : [ 2, function () {}, 3 ], c : function () {} };
    
    var objT = Traverse(obj).map(function (x) {
        if (typeof x === 'function') this.delete();
    });
    
    assert.eql(Object.keys(obj), [ 'a', 'b', 'c' ]);
    assert.eql(typeof obj.b[1], 'function');
    assert.eql(obj.a, 1);
    assert.eql(obj.b[0], 2);
    assert.eql(obj.b[2], 3);
    assert.eql(typeof obj.c, 'function');
    
    assert.eql(Object.keys(objT), [ 'a', 'b' ]);
    assert.eql(objT.a, 1);
    assert.eql(objT.b.length, 3);
    assert.eql(objT.b[0], 2);
    assert.ok(objT.b[1] === undefined);
    assert.eql(objT.b[2], 3);
};
