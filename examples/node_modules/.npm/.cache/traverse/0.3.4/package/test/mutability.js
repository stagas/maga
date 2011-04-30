var assert = require('assert');
var Traverse = require('traverse');

exports.mutate = function () {
    var obj = { a : 1, b : 2, c : [ 3, 4 ] };
    var res = Traverse(obj).forEach(function (x) {
        if (typeof x === 'number' && x % 2 === 0) {
            this.update(x * 10);
        }
    });
    assert.eql(obj, res);
    assert.eql(obj, { a : 1, b : 20, c : [ 3, 40 ] });
};

exports.mutateT = function () {
    var obj = { a : 1, b : 2, c : [ 3, 4 ] };
    var res = Traverse.forEach(obj, function (x) {
        if (typeof x === 'number' && x % 2 === 0) {
            this.update(x * 10);
        }
    });
    assert.eql(obj, res);
    assert.eql(obj, { a : 1, b : 20, c : [ 3, 40 ] });
};

exports.map = function () {
    var obj = { a : 1, b : 2, c : [ 3, 4 ] };
    var res = Traverse(obj).map(function (x) {
        if (typeof x === 'number' && x % 2 === 0) {
            this.update(x * 10);
        }
    });
    assert.eql(obj, { a : 1, b : 2, c : [ 3, 4 ] });
    assert.eql(res, { a : 1, b : 20, c : [ 3, 40 ] });
};

exports.mapT = function () {
    var obj = { a : 1, b : 2, c : [ 3, 4 ] };
    var res = Traverse.map(obj, function (x) {
        if (typeof x === 'number' && x % 2 === 0) {
            this.update(x * 10);
        }
    });
    assert.eql(obj, { a : 1, b : 2, c : [ 3, 4 ] });
    assert.eql(res, { a : 1, b : 20, c : [ 3, 40 ] });
};

exports.clone = function () {
    var obj = { a : 1, b : 2, c : [ 3, 4 ] };
    var res = Traverse(obj).clone();
    assert.eql(obj, res);
    assert.ok(obj !== res);
    obj.a ++;
    assert.eql(res.a, 1);
    obj.c.push(5);
    assert.eql(res.c, [ 3, 4 ]);
};

exports.cloneT = function () {
    var obj = { a : 1, b : 2, c : [ 3, 4 ] };
    var res = Traverse.clone(obj);
    assert.eql(obj, res);
    assert.ok(obj !== res);
    obj.a ++;
    assert.eql(res.a, 1);
    obj.c.push(5);
    assert.eql(res.c, [ 3, 4 ]);
};

exports.reduce = function () {
    var obj = { a : 1, b : 2, c : [ 3, 4 ] };
    var res = Traverse(obj).reduce(function (acc, x) {
        if (this.isLeaf) acc.push(x);
        return acc;
    }, []);
    assert.eql(obj, { a : 1, b : 2, c : [ 3, 4 ] });
    assert.eql(res, [ 1, 2, 3, 4 ]);
};

exports.reduceInit = function () {
    var obj = { a : 1, b : 2, c : [ 3, 4 ] };
    var res = Traverse(obj).reduce(function (acc, x) {
        if (this.isRoot) assert.fail('got root');
        return acc;
    });
    assert.eql(obj, { a : 1, b : 2, c : [ 3, 4 ] });
    assert.eql(res, obj);
};
