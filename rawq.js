/*

   Parse and Serialize to RawQuads format.

   Should probably be re-written to use clever stream2 stuff, someday.
   Actually, doing a streaming version is a little tricky...

   lines are:   label subject property value
   
   value is
      i(iri)
      _(blank)
      s(string)
      @(lang)(space)(string)
      t(typeiri)(space)(string)

   label, subject, and property can only be "i" or "_"; they cant
   contain spaces.   that works fine...     

   label can also be the keyword "default".

*/

var ds = require('./datastore');
var util = require('util');

exports.parseString = function (text, store) {
    if (store === undefined) store = ds.datastore();
    var lines = text.split('\n');
    for (var i=0; i<lines.length; i++) {
	var line = lines[i];
	if (line.match(/^[ \t]*(#.*)?$/)) continue;
	var parts = line.split(/[ \t]+/, 4);
	console.log(line, parts);
	if (parts.length != 4) {
	    throw 'bad line: '+util.inspect(line)
	}
	switch (parts[3][0]) {
	case 'i':
	case '_':
	case 's':
	case '@':
	case 't':
	    // actually, we just pass these through as-is
	    break;
	default:
	    throw 'bad line: '+util.inspect(line)
	}
	store.add(parts);
    }
    return store;
}

// should return a Promise?
exports.parseFile = function (filename, store, callback) {
    if (arguments.length === 1) {
	throw 'callback_required';
    } else if (arguments.length === 2) {
	store = ds.datastore();
	callback = arguments[1];
    }

    fs.readFile(filename, {encoding:'utf-8'}, function(err, data) {
	if (err) callback(err, null);
	exports.parseString(data, store);
	
	callback(err, store);
    });
}	    


exports.pipe = function (out, that) {
    out.write("# "+that.tuples.length+" statements\n");
    for (var i=0; i<that.tuples.length; i++) {
	out.write(that.tuples[i].join("\t"));
	out.write("\n");
    }
}

