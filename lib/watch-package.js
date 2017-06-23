'use strict';
const {EventEmitter} = require('events');
const extend = require('extend');
const isWindows = require('is-windows');
const {join: joinPath} = require('path');
const nodemon = require('nodemon');
const promiseTry = require('es6-promise-try');
const through = require('through2');

const npm = isWindows() ? 'npm.cmd' : 'npm';

function deepAssign(target, ...sources) {
  return extend(true, target, ...sources);
}

/*function prefixer(prefix) {
  return through((line, _, callback) => {
    line = line.toString();

    if (line.match('to restart at any time') === null) {
      this.push(`${prefix} ${line}`);
    }

    callback();
  })
}*/

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
      this.processConfigs = {};
      this.processes = {};

      //this.inputListener();

      return this.start();
    }).catch(error => this.emit('error', error));
  }

  config(taskName) {
    return this.processConfigs[taskName];
  }

  /*inputListener() {
    this.stdin = through((line, _, callback) => {
      line = line.toString();

      const match = line.match(/^rs\s+(\w+)/);

      if (match === null) {
        this.emit('log', `Unrecognized input: ${line}`);
      } else {
        const nodemonProcess = this.processes[match[1]];

        if (nodemonProcess === undefined) {
          this.emit('log', `Couldn't find process: ${match[1]}`);
        } else {
          nodemonProcess.stdin.write('rs\n');
        }
      }

      callback();
    });

    this.stdin.stderr = through();
    this.stdin.stdout = through();
  }*/

  quit() {
    /*if (this.stdin) {
      this.stdin.end();
      this.stdin.stderr.end();
      this.stdin.stdout.end();
    }*/

    Object.keys(this.processes).forEach(name => this.processes[name].emit('quit'));
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

      if (Array.isArray(task)) {
        nodemonConfig.patterns = task;
      } else if (typeof task === 'object') {
        deepAssign(nodemonConfig, task);
      } else {
        nodemonConfig.patterns = [task];
      }

      this.processConfigs[taskName] = deepAssign({}, nodemonConfig);

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

      const nodemonProcess = nodemon(nodemonConfig)
        /*.on('readable', () => {
          if (inherit || nodemonConfig.quiet) {
            nodemonProcess.stdout.pipe(this.stdin.stdout);
            nodemonProcess.stderr.pipe(this.stdin.stderr);
          } else {
            nodemonProcess.stdout.pipe(prefixer(`[${taskName}]`)).pipe(this.stdin.stdout);
            nodemonProcess.stderr.pipe(prefixer(`[${taskName}]`)).pipe(this.stdin.stderr);
          }

          this.emit('readable', taskName);
        })*/
        .on('start', () => this.emit('start', taskName))
        .on('exit', () => this.emit('exit', taskName))
        .on('crash', () => this.emit('crash', taskName))
        .on('restart', files => this.emit('restart', taskName, files))
        .once('quit', () => {
          this.emit('quit', taskName);
          nodemonProcess.reset();
          delete this.processConfigs[taskName];
          delete this.processes[taskName];
        });

      this.processes[taskName] = nodemonProcess;
    });
  }
}

function watchPackage(cfg) {
  return new Watcher(cfg);
}

module.exports = watchPackage;
