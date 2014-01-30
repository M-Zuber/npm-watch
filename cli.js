#!/usr/bin/env node

var watchPackage = require('./watch-package')

process.env.PATH = __dirname + '/node_modules/.bin:' + process.env.PATH

var watcher = watchPackage(process.argv[2] || process.cwd(), process.exit)

process.stdin.pipe(watcher)
watcher.stdout.pipe(process.stdout)
watcher.stderr.pipe(process.stderr)
