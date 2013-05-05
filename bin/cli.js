#!/usr/bin/env node

// I think optimist does more harm than good here right now, but maybe
// some day we'll have some options...
var usage = '$0 cmd args...\n  diff v1file v2file\n  patch v1file patchfile\n';
var argv = require('optimist')
    .usage(usage)
    .argv;
var dp = require('../index.js');

(function() {
    if (argv._.length == 3) {
	var cmd=argv._[0];
	switch (cmd) {
	case 'diff':
	    dp.diff(argv._[1], argv._[2], function (err, ds) {
		if (err) throw err;
		ds.pipe(process.stdout);
	    });
	    return;
	case 'apply':
	    dp.patch(argv._[1], argv._[2]);
	    return;
	}
    }
    console.log(usage);
})();


