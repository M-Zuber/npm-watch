'use strict';
const basename = require('path').basename;
const expect = require('chai').expect;
const fs = require('fs-extra');
const requireUncached = require('require-uncached');

const basenames = paths => {
  return paths.map(path => basename(path));
};

const cli = (...args) => {
  process.argv.push(...args);
  return requireUncached('./cli');
};

const argv = process.argv;
const env = process.env;

beforeEach(() => {
  process.argv = ['/path/to/node', '/path/to/npm-watch'];
  process.env = Object.assign({ NPM_WATCH_TEST: 'true' }, env);
  return fs.copy('fixtures', 'fixtures_temp');
})

after(() => {
  process.argv = argv;
  process.env = env;
  return fs.remove('fixtures_temp');
})

/*
  .on('start', () => console.log('App has started'))
  .on('crash', () => console.log('App has crashed'))
  .on('exit', () => console.log('App has exited'))
  .on('restart', files => console.log('App restarted due to: ', files))
  .on('quit', () => console.log('App has quit'))
  .on('info', message => console.log(message))
  .on('log', message => console.log(message))
  .on('error', error => done(error));
*/

it('rejects non-existent task names', done => {
  cli('unknown').on('error', error => {
    expect(error).to.be.an('error');
    done();
  });
});



it('accepts a string config', done => {
  const eventHistory = [];
  const fileHistory = [];

  cli('test_string')
    .on('start', () => eventHistory.push('start'))
    .on('exit', function() {
      if (eventHistory.push('exit') < 3) {
        fs.outputFile('fixtures_temp/file.txt', 'changed').catch(error => done(error));
      } else {
        this.quit();
      }
    })
    .on('crash', () => done(new Error('This should not have been called')))
    .on('restart', files => {
      eventHistory.push('restart');
      fileHistory.push(...basenames(files));
    })
    .on('quit', () => {
      expect(eventHistory).to.deep.equal([
        'start',
        'exit',
        'start',
        'restart',
        'exit'
      ]);
      expect(fileHistory).to.deep.equal(['file.txt']);
      done();
    })
    .on('error', error => done(error));
});



// TODO :: https://github.com/remy/nodemon/issues/1058
it.skip('accepts an array config', done => {
  const eventHistory = [];
  const fileHistory = [];

  cli('test_array')
    .on('start', () => eventHistory.push('start'))
    .on('exit', function() {
      console.log('exit')
      const numEvents = eventHistory.push('exit');
      if (numEvents === 2) {
        fs.outputFile('fixtures_temp/file.js', 'changed').catch(error => done(error));
      } else if (numEvents === 5) {
        fs.outputFile('fixtures_temp/file.txt', 'changed').catch(error => done(error));
      } else if (numEvents > 5) {
        this.quit();
      }
    })
    .on('crash', () => done(new Error('This should not have been called')))
    .on('restart', files => {
      eventHistory.push('restart');
      fileHistory.push(...basenames(files));
    })
    .on('quit', () => {
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
    })
    .on('error', error => done(error));
});



it.only('accepts an object config', done => {
  const eventHistory = [];
  const fileHistory = [];

  cli('test_object')
    .on('start', () => { console.log('start'); eventHistory.push('start') })
    .on('exit', function() {
      const numEvents = eventHistory.push('exit');
      console.log('exit', numEvents)
      if (numEvents === 2) {
        fs.outputFile('fixtures_temp/file.css', 'changed').catch(error => done(error));
      } else if (numEvents === 5) {
        fs.outputFile('fixtures_temp/file.js', 'changed').catch(error => done(error));
      } else if (numEvents > 5) {
        this.quit();
      }
    })
    .on('crash', () => done(new Error('This should not have been called')))
    .on('restart', files => {
      console.log('restart')
      eventHistory.push('restart');
      fileHistory.push(...basenames(files));
    })
    .on('quit', () => {
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
    })
    .on('error', error => done(error));
});


// TODO :: task without script
