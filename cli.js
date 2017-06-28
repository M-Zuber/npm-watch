#!/usr/bin/env node
'use strict';
const {delimiter: pathDelimiter, join: joinPath} = require('path');
const isWindows = require('is-windows');
const watchPackage = require('./watch-package');

const path = (isWindows() && !('PATH' in process.env)) ? 'Path' : 'PATH';

process.env[path] += pathDelimiter + joinPath(__dirname, 'node_modules', '.bin');

const testing = !!process.env.NPM_WATCH_TEST;

const log = function() {
  if (!testing) {
    console.log.apply(null, arguments);
  }
};

log.error = function() {
  if (!testing) {
    console.error.apply(null, arguments);
  }
};

log.info = function() {
  if (!testing) {
    console.info.apply(null, arguments);
  }
};

const config = {
  pkgDir: process.cwd(),
  taskName: process.argv[2],
  taskArgs: process.argv.slice(3)
};

module.exports = watchPackage(config)
  .on('readable', function() {
    if (!testing) {
      /*process.stdin.pipe(this.stdin);
      this.stdout.pipe(process.stdin.stdout);
      this.stderr.pipe(process.stdin.stderr);*/
    }
  })
  /*.on('start', () => log('App has started'))
  .on('exit', () => log('App has exited'))
  .on('crash', () => log('App has crashed'))
  .on('restart', files => log('App restarted due to: ', files))
  .on('quit', () => log('App has quit'))*/
  .on('info', message => log.info(message))
  .on('log', message => log(message))
  .on('error', function(error) {
    log.error(error/*.message*/);

    if (!testing) {
      process.exitCode = 1;
    }
  });
