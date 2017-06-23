'use strict';
const {EventEmitter} = require('events');
const isWindows = require('is-windows');
const {join: joinPath} = require('path');
const nodemon = require('nodemon');
const promiseTry = require('es6-promise-try');
const through = require('through2');

const npm = isWindows() ? 'npm.cmd' : 'npm';

function prefixer(prefix) {
  return through((line, _, callback) => {
    if (!line.toString().match('to restart at any time')) {
      this.push(`${prefix} ${line}`);
    }

    callback();
  })
}

class Watcher extends EventEmitter {
  constructor(cfg) {
    super();

    promiseTry(() => {
      const pkg = require(joinPath(cfg.pkgDir, 'package.json'));

      if (typeof pkg.watch !== 'object') {
        throw new Error('No "watch" config in package.json');
      }

      if (typeof cfg.taskName === 'string') {
        cfg.taskName = cfg.taskName.trim();
      } else {
        cfg.taskName = '';
      }

      this.cfg = cfg;
      this.pkg = pkg;
      this.processes = {};

      this.inputListener();

      return this.start();
    }).catch(error => this.emit('error', error));
  }

  inputListener() {
    this.stdin = through((line, _, callback) => {
      line = line.toString();

      const match = line.match(/^rs\s+(\w+)/);

      if (!match) {
        this.emit('log', `Unrecognized input: ${line}`);
        return callback();
      }

      const nodemonProcess = this.processes[match[1]];

      if (!proc) {
        this.emit('log', `Couldn't find process: ${match[1]}`);
        return callback();
      }

      nodemonProcess.stdin.write('rs\n');
      callback();
    });

    this.stdin.stderr = through();
    this.stdin.stdout = through();
  }

  quit() {
    Object.keys(this.processes).forEach(name => {
      this.processes[name].emit('quit');
      this.processes[name].reset();
    });

    if (this.stdin) {
      this.stdin.end();
      this.stdin.stderr.end();
      this.stdin.stdout.end();
    }
  }

  start() {
    let tasks;

    if (this.cfg.taskName === '') {
      this.emit('info', 'No task specified. Will go through all possible tasks');
      tasks = Object.keys(this.pkg.watch).map(taskName => this.startTask(taskName));
    } else {
      tasks = [ this.startTask(this.cfg.taskName) ];
    }

    return Promise.all(tasks);
  }

  startTask(taskName) {
    return promiseTry(() => {
      const task = this.pkg.watch[taskName];

      if (!task) {
        throw new Error(`No such script "${taskName}"`);
      }

      const nodemonConfig = {};

      if (typeof task === 'object' && !Array.isArray(task)) {
        Object.assign(nodemonConfig, task);
      /*} else if (!Array.isArray(task)) {
        nodemonConfig.watch = [task];*/
      } else {
        nodemonConfig.watch = task;
      }

      if (nodemonConfig.extensions) {
        nodemonConfig.ext = nodemonConfig.extensions;
        delete nodemonConfig.extensions;
      }

      /*if (nodemonConfig.inherit) {
        inherit = nodemonConfig.inherit;
        delete nodemonConfig.inherit;
      }*/

      if (nodemonConfig.patterns) {
        nodemonConfig.watch = nodemonConfig.patterns;
        delete nodemonConfig.patterns;
      }

      nodemonConfig.exec = [npm, 'run', '-s', taskName].join(' ');
      //nodemonConfig.stdout = false;

      console.log(nodemonConfig)

      const nodemonProcess = this.processes[taskName] = nodemon(nodemonConfig)
        .on('readable', () => {
          if (/*inherit || */config.quiet === true || config.quiet === 'true') {
            //nodemonProcess.stdout.pipe(this.stdin.stdout);
            //nodemonProcess.stderr.pipe(this.stdin.stderr);
          } else {
            //nodemonProcess.stdout.pipe(prefixer(`[${taskName}]`)).pipe(this.stdin.stdout);
            //nodemonProcess.stderr.pipe(prefixer(`[${taskName}]`)).pipe(this.stdin.stderr);
          }

          this.emit('readable');
        })
        .on('start', () => this.emit('start'))
        .on('exit', () => this.emit('exit'))
        .on('crash', () => this.emit('crash'))
        .on('restart', files => this.emit('restart', files))
        .on('quit', () => this.emit('quit'));
    });
  }
}

function watchPackage(cfg) {
  return new Watcher(cfg);
}

module.exports = watchPackage;
