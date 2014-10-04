#!/usr/bin/env node
'use strict';
var path = require('path')

var windows = process.platform === 'win32'
var pathVar = (windows && !('PATH' in process.env)) ? 'Path' : 'PATH'
var pathSep = windows ? ';' : ':'

process.env[pathVar] += pathSep + path.join(__dirname, 'node_modules', '.bin')

var watchPackage = require('./watch-package')

var watcher = watchPackage(process.argv[2] || process.cwd(), process.exit)

process.stdin.pipe(watcher)
watcher.stdout.pipe(process.stdout)
watcher.stderr.pipe(process.stderr)
