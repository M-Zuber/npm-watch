'use strict';
const basename = require('path').basename;
const decache = require('decache');
const expect = require('chai').expect;
const fs = require('fs-extra');

const basenames = paths => {
  return paths.map(path => basename(path));
};

const cli = (...args) => {
  process.argv.push(...args);
  decache('../lib/cli');
  return require('../lib/cli');
};

const argv = process.argv;
const env = process.env;

beforeEach(() => {
  process.argv = ['/path/to/node', '/path/to/npm-watch'];
  process.env = Object.assign({ NPM_WATCH_TEST: 'true' }, env);
  return fs.copy('test/fixtures', 'test/fixtures_temp');
});

afterEach(() => fs.remove('test/fixtures_temp/script-output'));

after(() => {
  process.argv = argv;
  process.env = env;
  return fs.remove('test/fixtures_temp');
});



it('rejects non-existent task names', done => {
  cli('unknown').on('error', error => {
    expect(error).to.be.an('error');
    done();
  });
});



it('accepts a string config', done => {
  const eventHistory = [];
  const fileHistory = [];

  function assertions() {
    fs.pathExists('test/fixtures_temp/script-output').then(exists => {
      expect(exists).to.be.true;
      expect(eventHistory).to.deep.equal([
        'start',
        'exit',
        'start',
        'restart',
        'exit'
      ]);
      expect(fileHistory).to.deep.equal(['file.txt']);
      done();
    });
  }

  cli('test_string')
    .on('start', script => eventHistory.push('start'))
    .on('exit', function(script) {
      if (eventHistory.push('exit') < 3) {
        fs.outputFile('test/fixtures_temp/file.txt', 'changed').catch(error => done(error));
      } else {
        this.quit();
      }
    })
    .on('crash', script => eventHistory.push('crash'))
    .on('restart', (script, files) => {
      eventHistory.push('restart');
      fileHistory.push(...basenames(files));
    })
    .on('quit', script => assertions())
    .on('error', error => done(error));
});



it('accepts an array config', done => {
  const eventHistory = [];
  const fileHistory = [];

  function assertions() {
    fs.pathExists('test/fixtures_temp/script-output').then(exists => {
      expect(exists).to.be.true;
      expect(eventHistory).to.deep.equal([
        'start',
        'exit',
        'start',
        'restart',
        'exit',
        'start',
        'restart',
        'exit'
      ]);
      expect(fileHistory).to.deep.equal([
        'file.js',
        'file.txt'
      ]);
      done();
    });
  }

  cli('test_array')
    .on('start', script => eventHistory.push('start'))
    .on('exit', function(script) {
      const numEvents = eventHistory.push('exit');
      if (numEvents === 2) {
        fs.outputFile('test/fixtures_temp/file.js', 'changed').catch(error => done(error));
      } else if (numEvents === 5) {
        fs.outputFile('test/fixtures_temp/file.txt', 'changed').catch(error => done(error));
      } else if (numEvents > 5) {
        this.quit();
      }
    })
    .on('crash', script => eventHistory.push('crash'))
    .on('restart', (script, files) => {
      eventHistory.push('restart');
      fileHistory.push(...basenames(files));
    })
    .on('quit', script => assertions())
    .on('error', error => done(error));
});



it('accepts an object config', done => {
  const eventHistory = [];
  const fileHistory = [];

  function assertions() {
    fs.pathExists('test/fixtures_temp/script-output').then(exists => {
      expect(exists).to.be.true;
      expect(eventHistory).to.deep.equal([
        'start',
        'exit',
        'start',
        'restart',
        'exit',
        'start',
        'restart',
        'exit'
      ]);
      expect(fileHistory).to.deep.equal([
        'file.css',
        'file.js'
      ]);
      done();
    });
  }

  cli('test_object')
    .on('start', script => eventHistory.push('start'))
    .on('exit', function(script) {
      const numEvents = eventHistory.push('exit');
      if (numEvents === 2) {
        fs.outputFile('test/fixtures_temp/file.css', 'changed').catch(error => done(error));
      } else if (numEvents === 5) {
        fs.outputFile('test/fixtures_temp/file.js', 'changed').catch(error => done(error));
      } else if (numEvents > 5) {
        this.quit();
      }
    })
    .on('crash', script => eventHistory.push('crash'))
    .on('restart', (script, files) => {
      eventHistory.push('restart');
      fileHistory.push(...basenames(files));
    })
    .on('quit', script => assertions())
    .on('error', error => done(error));
});



// TODO :: task without script
