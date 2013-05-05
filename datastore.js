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
       actually, we don't need to escape stuff, just split
       exactly 3 times.    always quads.
*/

// see also mugl/dataset.js

var fs = require('fs');
var _ = require('underscore');

var formatHandler = {
    rawq: require('./rawq'),
}

var datastore = module.exports = function (comment) {

    that = {}
    that.comment = comment;
    that.tuples = [];

    that.isBlank = function(term) {
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

    that.toString = function (limit) {
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

    that.pipeOLD = function (out) {
	out.write("# "+that.tuples.length+" statements\n");
	for (var i=0; i<that.tuples.length; i++) {
	    var qtuple = _.map(that.tuples[i], function(s) {
		return s.replace(/\\/g, '\\\\').replace(/\t/g, '\\t');
	    });
	    out.write(qtuple.join("\t"));
	    out.write("\n");
	}
    }

    that.pipe = function (out, suffix) {
	out.write('# datastore comment: '+comment);
	if (suffix === undefined) suffix = 'rawq';
	formatHandler[suffix].pipe(out, that);
    }

    that.loadFile = function (filename, callback) {
	var dotpos = filename.lastIndexOf('.');
	if (dotpos < 1) {
	    callback('no-filename-suffix-unknown-format');
	}
	var suffix = filename.slice(1+dotpos);
	fs.readFile(filename, {encoding:'utf-8'}, function(err, data) {
	    if (err) callback(err, null);
	    var handler = formatHandler[suffix];
	    if (handler) {
		handler.parseString(data, that);
		// pass errors...
		callback(null);
	    } else {
		callback('no-handlers-for-'+suffix);
	    }
	});
    }

    that.matchTuple = matchTuple;
    that.match = match;
    that.add = add;
    return that;
}






// other modules should add themselves to this, based on the
// filename suffix they can handle.

if (true) {
    var g = datastore();
    g.add(["s1","s2","s3"]);
    g.add(["s1","s2","s4"]);
    g.add(["s4","s2","s4"]);
    g.add(["s1","s3","s5"]);
    g.add(['_x',"s3","s5"]);
    g.add(['_x',"s3","s6"]);
    
    g.pipe(process.stdout);
    
    g.matchTuple(['?x',"s3",'?z'], { '?x': "s1", '?y': "s3" }, function(b) {
	console.log("found binding", b);
    });
    console.log("---");
    
    if (true) {
	g.match([['?x',"s2",'?y'], ['?x',"s3",'?z']], function(b) {
	    console.log("FOUND BINDING", b);
	});
    }

    // so.... what does this mean for DIFF?
    // don't do the WITHOUTs if we don't have to.
    //   MINIMAL diff.
}


exports.formatHandler = formatHandler;