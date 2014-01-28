require('shelljs/make');
require('colors');

var _ = require('underscore'),
    fs = require('fs'),
    glob = require('glob'),
    path = require('path'),
    zlib = require('zlib'),
    hogan = require('hogan.js'),
    moment = require('moment');

var isWin = (process.platform === 'win32');

/*** CONFIG ********/

var version = process.env.VERSION || moment().format('YYYYMMDD');
    targetDir = process.env.OUTPUT_DIR || path.join('build');

var webapp = path.join('src'),

    indexFile = path.join(webapp, 'index.mustache'),
    mainCssFile = path.join(webapp, 'css', 'style.css');


/*** TARGETS ********/

target.all = function() {
    target.check();
    target.jshint();
    target.test();
    target.build();
};

target.jshint = function() {
    var files = glob.sync(path.join(webapp, 'js', '**', '*.js'));

    section('Running JSHint');
    bin('jshint', '--config ' + jshintConfig, files.join(' '));
};

target.test = function() {
    section('Running JavaScript tests');
    bin('karma', 'start', 'karma.conf.js', '--browsers PhantomJS', '--single-run');
};

target.build = function() {
    createCleanDir(targetDir);


    target.buildImg();

    echo();echo();
    success("Build succeeded!");
};


/*** APP FUNCTIONS ********/

target.buildImg = function() {
    var pngs = glob.sync(path.join(webapp, 'images', '*.png'));

    section('Optimizing pngs');

    var to = path.join(targetDir, 'images');

    bin('optipng-bin', '-strip all', '-dir ' + to, pngs.join(' '))
};

target.buildHtml = function() {
    var htmlFile = path.join(targetDir, 'index.mustache');

    section('Building HTML → ' + htmlFile);
    renderAndWriteMustache(indexFile, htmlFile, {
        cssFile: cssFileName,
        jsFile: jsFileName
    });
};


target.buildCss = function() {
    section('Building Less → ' + cssFile);
    bin('lessc', [mainLessFile, cssFile]);
};


var renderAndWriteMustache = function(from, to, data) {
    var mustache = fs.readFileSync(from).toString();
    var template = hogan.compile(mustache);
    var html = template.render(data);

    fs.writeFileSync(to, html);

    success();
};


/*** HELPER FUNCTIONS ********/

var bin = function() {

};

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
