#!/usr/bin/env node
'use strict';
const {delimiter: pathDelimiter, join: joinPath} = require('path');
const isWindows = require('is-windows');
const watchPackage = require('./watch-package');

const path = (isWindows() && !('PATH' in process.env)) ? 'Path' : 'PATH';

process.env[path] += pathDelimiter + joinPath(__dirname, 'node_modules', '.bin');

const testing = !!process.env.NPM_WATCH_TEST;

const log = (message, scriptName, verbose=false) => {
  if (!testing && (!quiet(scriptName) || verbose)) {
    console.log(prefix(message, scriptName));
  }
};

log.error = (message, scriptName, verbose=false) => {
  if (!testing && (!quiet(scriptName) || verbose)) {
    console.error(prefix(message, scriptName));
  }
};

log.info = (message, scriptName, verbose=false) => {
  if (!testing && (!quiet(scriptName) || verbose)) {
    console.info(prefix(message, scriptName));
  }
};

const prefix = (message, scriptName) => {
  if (!quiet(scriptName)) {
    message = `[${scriptName}] ${message}`;
  }

  return message;
}

const quiet = scriptName => {
  return watcher.config(scriptName).quiet;
};

const watcher = watchPackage({
    pkgDir: process.cwd(),
    //stdout: false,
    taskName: process.argv[2]
  })
  /*.on('readable', function(scriptName) {
    if (!testing) {
      process.stdin.pipe(this.stdin);
      this.stdout.pipe(process.stdin.stdout);
      this.stderr.pipe(process.stdin.stderr);
    }
  })*/
  .on('start', scriptName => log('started', scriptName, true))
  .on('exit', scriptName => log('exited', scriptName, true))
  .on('crash', scriptName => log('crashed', scriptName, true))
  .on('restart', (scriptName, files) => log(`restarted due to: ${files}`, scriptName))
  .on('quit', scriptName => log('quit', scriptName, true))
  .on('info', message => log.info(message))
  .on('log', message => log(message))
  .once('error', function(error) {
    this.quit();

    log.error(error.message);

    if (!testing) {
      process.exitCode = 1;
    }
  });

module.exports = watcher;
