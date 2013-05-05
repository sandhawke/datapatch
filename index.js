

var datastore = require('./datastore');
var _ = require('underscore');

exports.diff = function (v1, v2, callback) {
    var g1 = datastore('call me g1');
    var g2 = datastore('call me g2');
    
    console.log(g1, g2, g1===g2);
    g1.loadFile(v1, function(err) {
	if (err) throw err;
	process.stdout.write('g1:');
	g1.pipe(process.stdout);
	g2.loadFile(v2, function(err) {
	    if (err) throw err;
	    process.stdout.write('g2:');
	    g2.pipe(process.stdout);

	    // at this point, we treat blank node labels as stable
	    // so we can find the basic inserts/deletes by just a linear
	    // comparison.
	    g1.tuples.sort();
	    g2.tuples.sort();
	    var dlist=[], ilist=[];
	    var p1=0, p2=0;
	    var dlist_bnodes={}, bnodeTuples=[];
	    while (p1<g1.tuples.length || p2<g2.tuples.length) {
		var t1 = g1.tuples[p1];
		var t2 = g2.tuples[p2];
		console.log('advancing', p1, p2, t1, t2);
		
		// remember any g1 triples that use blank nodes
		if (t1) {
		    for (var i=0; i<t1.length; i++) {
			var term=t1[i];
			if (g1.isBlank(term)) {
			    bnodeTuples.push(t1);
			    break;
			}
		    }
		}
		
		if (t1 < t2 || t2 === undefined) {
		    console.log('delete t1')
		    dlist.push(t1);
		    p1++;
		    
		    // remember any bnodes used in dlist triples
		    for (var i=0; i<t1.length; i++) {
			var term=t1[i];
			if (g1.isBlank(term)) {
			    dlist_bnodes[term] = true;
			}
		    }
		} else if (t1 > t2 || t1 === undefined) {
		    console.log('insert t2')

		    ilist.push(t2);
		    p2++;
		} else {
		    console.log('same!')
		    p1++;
		    p2++;
		}

	    }
	    var blist = Object.keys(dlist_bnodes);
	    var where;
	    if (blist.length) {
		where = bnodeTuples;
		// do a smarter version some day, where we remove
		// unnecessary ones, and put them in the best order
	    }
	    
	    p = datastore();
	    console.log('dlist', dlist);
	    _.each(dlist, function(t) {
		var tt=['_delete'].concat(t);
		console.log('d', tt);
		p.add(tt);
	    });
	    _.each(ilist, function(t) {
		var tt=['_insert'].concat(t);
		console.log('i', tt);
		p.add(tt);
	    });

	    callback(null, p);
	});
    });
}

exports.apply = function (v1, patch) {
    console.log('diff', v1, patch);
}

