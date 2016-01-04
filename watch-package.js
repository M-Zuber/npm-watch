'use strict';

var path = require('path')
var spawn = require('child_process').spawn

var through = require('through2')

var npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
var nodemon = process.platform === 'win32' ? 'nodemon.cmd' : 'nodemon';

module.exports = function watchPackage (pkgDir, exit) {
  var pkg = require(path.join(pkgDir, 'package.json'))
  var processes = {}

  if (typeof pkg.watch !== 'object') {
    die('No "watch" config in package.json')
  }

  // send 'rs' commands to the right proc
  var stdin = through(function (line, _, callback) {
    line = line.toString()
    var match = line.match(/^rs\s+(\w+)/)
    if (!match) {
      console.log('Unrecognized input:', line)
      return callback()
    }
    var proc = processes[match[1]]
    if (!proc) {
      console.log('Couldn\'t find process:', match[1])
      return callback()
    }
    proc.stdin.write('rs\n')
    callback()
  })

  stdin.stderr = through()
  stdin.stdout = through()

  Object.keys(pkg.watch).forEach(function (script) {
    if (!pkg.scripts[script]) {
      die('No such script "' + script + '"', 2)
    }
    var exec = [npm, 'run', script].join(' ')
    var patterns = null
    var extensions = null
    var ignores = null

    if (typeof pkg.watch[script] === 'object' && !Array.isArray(pkg.watch[script])) {
      patterns = pkg.watch[script].patterns
      extensions = pkg.watch[script].extensions
      ignores = pkg.watch[script].ignore
    } else {
      patterns = pkg.watch[script]
    }

    patterns = [].concat(patterns).map(function (pattern) {
      return ['--watch', pattern]
    }).reduce(function (a, b) {
      return a.concat(b)
    })

    if (ignores) {
      ignores = [].concat(ignores).map(function (ignore) {
        return ['--ignore', ignore]
      }).reduce(function (a, b) {
        return a.concat(b)
      })
    }

    var args = extensions ? ['--ext', extensions] : []
    args = args.concat(patterns)
    if (ignores) { args = args.concat(ignores) }
    args = args.concat(['--exec', exec])
    console.log(args);
    var proc = processes[script] = spawn(nodemon, args, {
      env: process.env,
      cwd: pkgDir,
      stdio: 'pipe'
    })
    proc.stdout.pipe(prefixer('[' + script + ']')).pipe(stdin.stdout)
    proc.stderr.pipe(prefixer('[' + script + ']')).pipe(stdin.stderr)
  })

  return stdin

  function die (message, code) {
    stdin.stderr.write(message)
    stdin.end()
    stdin.stderr.end()
    stdin.stdout.end()
    exit(code || 1)
  }
}

function prefixer (prefix) {
  return through(function (line, _, callback) {
    line = line.toString()
    if (!line.match('to restart at any time')) {
      this.push(prefix + ' ' + line)
    }
    callback()
  })
}
