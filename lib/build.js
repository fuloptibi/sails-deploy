var spawn = require('child_process').spawn;
var archiver = require('archiver');
var fs = require('fs');
var pathResolve = require('path').resolve;
var _ = require('underscore');

function buildApp(appPath, buildLocaltion, bundlePath, callback) {
    
    fs.mkdirSync(buildLocaltion);
    
    callback = _.once(callback);
    var sourceDir = appPath;

    var output = fs.createWriteStream(bundlePath);
    var archive = archiver('tar', {
        gzip: true,
        gzipOptions: {
            level: 6
        }
    });

    archive.pipe(output);
    output.once('close', callback);

    archive.once('error', function (err) {
        console.log("=> Archiving failed:", err.message);
        callback(err);
    });

    var files = fs.readdirSync(sourceDir);
    for (var i = 0; i < files.length; i++) {
        var filePath = pathResolve(sourceDir, files[i]);
        var fileStats = fs.lstatSync(filePath);
        if (fileStats.isDirectory()){
            if (files[i] !== 'node_modules' && files[i] !== '.git' && files[i] !== '.tmp'){
                archive.directory(filePath, files[i]);
            }
        } else {
            archive.file(files[i], fs.readFileSync(filePath));
        }
    }
    archive.finalize();
}

module.exports = buildApp;