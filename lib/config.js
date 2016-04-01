var cjson = require('cjson');
var path = require('path');
var fs = require('fs');
var helpers = require('./helpers');
var format = require('util').format;

require('colors');

exports.read = function () {
    var jsonConfigFile = process.argv[process.argv.length - 1];
    
    if (!/\.json$/.test(jsonConfigFile)) {
        console.error('Please specify your JSON config file as the last argument!'.red.bold);
        helpers.printHelp();
        return process.exit(1);
    }

    var sdepJsonPath = path.resolve(jsonConfigFile);
    if (fs.existsSync(sdepJsonPath)) {
        var sdepJson = cjson.load(sdepJsonPath);

        //initialize options
        sdepJson.env = sdepJson.env || {};

        if (typeof sdepJson.setupNode === "undefined") {
            sdepJson.setupNode = true;
        }
        if (typeof sdepJson.setupPhantom === "undefined") {
            sdepJson.setupPhantom = false;
        }
        if (typeof sdepJson.appName === "undefined") {
            console.error('appName is missing from the config!'.red.bold);
            
        }
        if (typeof sdepJson.enableUploadProgressBar === "undefined") {
            sdepJson.enableUploadProgressBar = true;
            return process.exit(1);
        }

        //validating servers
        if (!sdepJson.servers || sdepJson.servers.length == 0) {
            sdepErrorLog('Server information does not exist');
        } else {
            sdepJson.servers.forEach(function (server) {
                var sshAgentExists = false;
                var sshAgent = process.env.SSH_AUTH_SOCK;
                if (sshAgent) {
                    sshAgentExists = fs.existsSync(sshAgent);
                    server.sshOptions = server.sshOptions || {};
                    server.sshOptions.agent = sshAgent;
                }

                if (!server.host) {
                    sdepErrorLog('Server host does not exist');
                } else if (!server.username) {
                    sdepErrorLog('Server username does not exist');
                } else if (!server.password && !server.pem && !sshAgentExists) {
                    sdepErrorLog('Server password, pem or a ssh agent does not exist');
                } else if (!sdepJson.app) {
                    sdepErrorLog('Path to app does not exist');
                }

                server.os = server.os || "linux";

                if (server.pem) {
                    server.pem = rewriteHome(server.pem);
                }

                server.env = server.env || {};
                var defaultEndpointUrl =
                        format("http://%s:%s", server.host, sdepJson.env['PORT'] || 80);
                server.env['CLUSTER_ENDPOINT_URL'] =
                        server.env['CLUSTER_ENDPOINT_URL'] || defaultEndpointUrl;
            });
        }

        //rewrite ~ with $HOME
        sdepJson.app = path.resolve(sdepJsonPath, '..', rewriteHome(sdepJson.app));

        if (sdepJson.ssl) {
            sdepJson.ssl.backendPort = sdepJson.ssl.backendPort || 80;
            sdepJson.ssl.pem = path.resolve(rewriteHome(sdepJson.ssl.pem));
            if (!fs.existsSync(sdepJson.ssl.pem)) {
                sdepErrorLog('SSL pem file does not exist');
            }
        }
        
        return sdepJson;
    } else {
        console.error('JSON config file does not exist!'.red.bold);
        helpers.printHelp();
        process.exit(1);
    }
};

function rewriteHome(location) {
    if (/^win/.test(process.platform)) {
        return location.replace('~', process.env.USERPROFILE);
    } else {
        return location.replace('~', process.env.HOME);
    }
}

function sdepErrorLog(message) {
    var errorMessage = 'Invalid JSON config file: ' + message;
    console.error(errorMessage.red.bold);
    process.exit(1);
}

function getCanonicalPath(location) {
    var localDir = path.resolve(__dirname, location);
    if (fs.existsSync(localDir)) {
        return localDir;
    } else {
        return path.resolve(rewriteHome(location));
    }
}