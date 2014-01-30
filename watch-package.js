var spawn = require('child_process').spawn

var through = require('through2')

module.exports = function watchPackage (pkgDir, exit) {
  var pkg = require(pkgDir + '/package.json')
  var processes = {}

  if (typeof pkg.watch !== 'object') {
    die('No "watch" config in package.json')
  }

  // send 'rs' commands to the right proc
  var stdin = through(function (line, _, callback) {
    line = line.toString()
    var match = line.match(/^rs\s+(\w+)/)
    if (!match) {
      console.log("Unrecognized input:", line)
      return callback()
    }
    var proc = processes[match[1]]
    if (!proc) {
      console.log("Couldn't find process:", match[1])
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
    var exec = ['npm', 'run', script].join(' ')
    var patterns = [].concat(pkg.watch[script]).map(function (pattern) {
      return ['--watch', pattern]
    }).reduce(function (a, b) {
      return a.concat(b)
    })
    var args = patterns.concat(['--exec', exec])
    var proc = processes[script] = spawn('nodemon', args, {
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

