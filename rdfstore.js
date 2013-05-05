/*

  Simple RDF Store

  We store triples and/or quad (or whatever, we don't care).

  We store terms just as strings; the first char tells us what it is.

      iris      - ihttp://www.w3.org
      bnodes    - _ux456
      xs:string - sHello World
      typed     - thttp://www.w3.org/type/foo ThenTheLexRep
      lang      - @en-us then the string

  We can read/write this form, tab delimited, tabs backslash escaped

*/

// see also mugl/dataset.js

var fs = require('fs');
var _ = require('underscore');


var dataset = function() {

    var that = {
	tuples: []
    }

    var isBlank = function(term) {
	return term.substring(0,1) === "_"
    }

    // should we maintain any index, and prevent dups?
    var add = function(t) { that.tuples.push(t) };

    // can pat and tuple be made identical terms?  If so, as a side effect
    // add a binding.
    var unify = function(pat, tuple, bindings) {
	var boundTo = bindings[pat];
	if (boundTo === undefined) {
	    if (pat[0] === '?' || (pat[0] === '_' & tuple[0] === '_')) {
		boundTo = tuple;
		bindings[pat] = tuple;
		return true;
	    }
	    boundTo = pat;
	}
	return tuple === boundTo;
    };

    // see how many times the pat pattern triple can match a triple
    // we're storing; call the callback for each.
    var matchTuple = function(pat, bindings, callback) {
	//console.log('matchTuple',pat,bindings);
	_.each(that.tuples, function(tuple) {
	    var bcopy = _.clone(bindings);
	    for (var i=0; i<tuple.length; i++) {
		if (!unify(pat[i], tuple[i], bcopy)) return;
	    }
	    //console.log(' = matchTuple',bcopy);
	    callback(bcopy);
	});
	//console.log(' < matchTuple',pat,bindings);
    };

    var match_i = function(pat, n, bindings, callback) {
	if (n >= pat.length) return callback(bindings);
	that.matchTuple(pat[n], bindings, function(new_bindings) {
	    match_i(pat, n+1, new_bindings, callback);
	});
	// try the matches without triple n
	var new_bindings = _.clone(bindings);
	new_bindings['without '+n] = true;
	match_i(pat, n+1, new_bindings, callback);
    };

    var match = function(pat, callback) {
	return match_i(pat, 0, {}, callback);
    }

    that.matchTuple = matchTuple;
    that.match = match;
    that.add = add;
    return that;

    var toString = function (limit) {
	if (limit === undefined) limit=10;
	var s = "";
	s+="# "+tuples.length+" statements\n";
	for (var i=0; i<tuples.length; i++) {
	    s += i + ". "+tuples[i]+"\n";
	    if (i+2 > limit) {
		s+="..."+limit;
		break;
	    };
	};
	return s;
    };

    var pipe = function (out) {
	out.write("# "+tuples.length+" statements\n");
	for (var i=0; i<tuples.length; i++) {
	    out.write(tuples[i].join(" "));
	    out.write("\n");
	}
    }


}

var g = dataset();
g.add([1,2,3]);
g.add([1,2,4]);
g.add([4,2,4]);
g.add([1,3,5]);
g.add(['_x',3,5]);
g.add(['_x',3,6]);

g.pipe(process.stdout);

g.matchTuple(['?x',3,'?z'], { '?x': 1, '?y': 3 }, function(b) {
    console.log("found binding", b);
});
console.log("---");

if (true) {
    g.match([['?x',2,'?y'], ['?x',3,'?z']], function(b) {
	console.log("FOUND BINDING", b);
    });
}

// so.... what does this mean for DIFF?
// don't do the WITHOUTs if we don't have to.
//   MINIMAL diff.


exports.load = function (filename, callback) {
    var g = dataset();
    fs.readFile(filename, function(err, data) {
	if (err) callback(err, null);
	var lines = data.split('\n');
	for (var i=0; i<lines.length; i++) {
	    var line = lines[i];
	    if (line[0] === '#') continue;
	    var terms = line.split(/\s+/);
	    g.add(terms);
	}
	callback(null, g);
    });
};