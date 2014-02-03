#!/usr/bin/env node

// based on https://github.com/kjbekkelund/js-build

require('shelljs/make');
require('colors');

var fs = require('fs');
var glob = require('glob');
var path = require('path');
var UglifyJS = require("uglify-js");
var uglifycss = require('uglifycss');
var imageinliner = require('imageinliner');
var zlib = require('zlib');
var hogan = require('hogan.js');
var npmBin = require('npm-bin');

var isWin = (process.platform === 'win32');

/*** CONFIG ********/

var outputDir = process.env.OUTPUT_DIR || path.join('build');
var webapp = path.join('src');

var outputHtmlFile = path.join(outputDir, 'index.html');

/*** TARGETS ********/

target.all = function() {
    target.build();
};

target.build = function() {
    createCleanDir(outputDir);

    target.buildImg();
    target.buildHtml();
    target.compress();

    echo();echo();
    success("Build succeeded!");
};


/*** APP FUNCTIONS ********/

target.buildImg = function() {

    var srcImageFolder = path.join(webapp, 'images');
    var outputImageFolder = path.join(outputDir, 'images');

    cp('-R', srcImageFolder, outputDir);

    var pngs = glob.sync(path.join(outputImageFolder, '*.png'));

    section('Optimizing svgs');

    res = npmBin('svgo', ['-f ' + outputImageFolder], {silent: true});

    done(res);
};

target.buildHtml = function() {
    var htmlFile = path.join(webapp, 'index.mustache');


    section('Building HTML → ' + htmlFile);
    renderAndWriteMustache(htmlFile, outputHtmlFile, {
        css: minifyCss(),
        js: minifyJs()
    });
};

target.compress = function() {
    gzip(outputHtmlFile);
};

var renderAndWriteMustache = function(from, to, data) {
    var mustache = fs.readFileSync(from).toString();
    var template = hogan.compile(mustache);
    var html = template.render(data);

    fs.writeFileSync(to, html);

    success();
};


var minifyCss = function() {
    var mainCssFile = path.join(webapp, 'css', 'style.css');

    var uglified = uglifycss.processFiles([mainCssFile]);

    return imageinliner.css(uglified, {
        cssBasePath:        outputDir,
        compressOutput:     true
    });
};

var minifyJs = function() {
    var mainJsFile = path.join(webapp, 'js', 'main.js');

    return UglifyJS.minify(mainJsFile).code;
};

var gzip = function(file) {
    var gzip = zlib.createGzip();
    var input = fs.createReadStream(file);
    var output = fs.createWriteStream(file + '.gz');

    section('Gzipping ' + file);
    input.pipe(gzip).pipe(output);
    success();
};


/*** HELPER FUNCTIONS ********/

var createCleanDir = function(dir) {
    if (test('-d', dir)) {
        rm('-rf', dir);
    }

    mkdir('-p', dir);

    return dir;
};

var section = function(header) {
    echo();
    echo('    ' + header.bold);
};

var done = function(res) {
    if (res.code === 0) {
        success();
    } else {
        fail();
    }
};

var success = function(text) {
    text = text || 'done';
    var s = isWin ? '»' : '✓';
    echo('    ' + s.green + ' ' + text.green);
};

var fail = function(text) {
    text = text || 'failed';
    var s = isWin ? '×' : '✘';
    echo('    ' + s.red + ' ' + text.red);
    exit(1);
};
