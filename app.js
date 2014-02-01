#!/usr/bin/env node


var port = Number(process.env.PORT || 5000);

var static = require('node-static');

var fileServer = new static.Server('./build', { gzip: true });

require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        fileServer.serve(request, response);
    }).resume();
}).listen(port);

console.log("Server started on port " + port);
