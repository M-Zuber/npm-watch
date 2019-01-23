# npm-watch

Run scripts from package.json when files change.

## Synopsis

Install it:

    npm install npm-watch

Add a top-level `"watch"` config to your `package.json` and a "watch" script to
your `"scripts"`:

```javascript
{
  "watch": {
    "test": "{src,test}/*.js"
  },
  "scripts": {
    "test": "tape test/*.js",
    "watch": "npm-watch"
  }
}
```

Possibilty to watch for different tasks

```javascript
  {
    "watch": {
      "run_android": {
        "patterns": [
          "app"
        ],
        "extensions": "ts,html,scss",
        "quiet": false
      },
      "run_ios": {
        "patterns": [
          "app"
        ],
        "extensions": "ts,html,scss",
        "quiet": false
      }
    },
    "scripts": {
      "watch_android": "npm-watch run_android",
      "watch_ios": "npm-watch run_ios",
      "run_android": "tns run android --emulator",
      "run_ios": "tns run ios --emulator"
    }
  }
```

The top level keys of the `"watch"` config should match the names of your `"scripts"`, and
the values should be a glob pattern or array of glob patterns to watch.

Also it is now possible to obtain a second parameter to define the script which should be run for watching and not watch all possible scripts at once.

If you need to watch files with extensions other than those that `nodemon` watches [by default](https://github.com/remy/nodemon#specifying-extension-watch-list) (`.js`, `.coffee`, `.litcoffee`), you can set the value to an object with `patterns` and `extensions` keys. You can also add an `ignore` key (a list or a string) to ignore specific files. Finally, you can add a `quiet` flag to hide the script name in any output on stdout or stderr, or you can use the `inherit` flag to preserve the original's process stdout or stderr. You can enable `nodemon` [legacy watch](https://github.com/remy/nodemon#application-isnt-restarting) and specify the restart [delay](https://github.com/remy/nodemon#delaying-restarting) in milliseconds with the corresponding flags.

> The `quiet` flag was changed from a `string` to a `boolean` in `0.1.5`. Backwards compatability will be kept for two patch versions.

Use  `runOnChangeOnly` to set the nodemon option [--on-change-only](https://github.com/remy/nodemon/blob/master/doc/cli/options.txt "--on-change-only"). Setting this to `true` tells nodemon to execute script on change only, not startup.

```javascript
{
  "watch": {
    "test": {
      "patterns": ["src", "test"],
      "extensions": "js,jsx",
      "ignore": "src/vendor/external.min.js",
      "quiet": true,
      "legacyWatch": true,
      "delay": 2500,
      "runOnChangeOnly": false
    }
  },
  "scripts": {
    "test": "tape test/*.js"
  }
}
```

Start the watcher with `npm run watch` in a terminal, then edit some files:

```bash
mkdir src test
npm run watch &
cat <<EOF > test/test-sum.js
var test = require('tape')
test('sum module', function (t) {
  var sum = require('../src/sum.js')
  t.ok(sum(1, 2), 3, "Sums appear correct")
  t.end()
})
EOF
```

_(Feel free to use the editor of your choice, `cat` just makes for easy demos)_

You should see that your tests ran automatically, and failed because `src/sum.js`
is missing. Let's fix that:

```bash
cat <<EOF > src/sum.js
module.exports = function (a, b)  {
  return 1
}
EOF
```

Our tests will run again, and this time they *almost* work. Let's fix `sum.js`:

```bash
cat <<EOF > src/sum.js
module.exports = function (a, b)  {
  return a + b
}
EOF
```

Tests run *perfectly*, ship it to the enterprise!

### Options

#### `patterns`

Array of paths to watch

#### `extensions`

Array of file extensions to watch

#### `ignore`

String or array of paths to ignore

#### `quiet`

Boolean to hide the script name in any output on stdout and stderr

#### `inherit`

Boolean to preserve the original process' stdout and stderr

#### `legacyWatch`

Boolean to enable [legacy watch](https://github.com/remy/nodemon#application-isnt-restarting)

#### `delay`

Number of milliseconds to [delay](https://github.com/remy/nodemon#delaying-restarting) before checking for new files

#### `clearBuffer`

Boolean to clear the buffer after detecting a new change

#### `verbose`

Boolean to turn on the nodemons verbose mode

#### `silent`

Boolean to turn on nodemons silent (quiet) mode
Silent was used as we already had an existing flag called quiet. This may change in a future release

#### `Ignore files`

Add an `ignore` property to your `watch` object. The value of `ignore` can be a string if you only want to ignore
a single glob:

```
"watch": {
  "build": {
    "ignore": "build",
    ...
  }
  ...
}
```

Or an array if you want to ignore multiple globs:

```
"watch": {
  "build": {
    "ignore": [
      "build",
      "node_modules"
    ],
    ...
  }
  ...
}
```

## Acknowledgements

This module does very little but run [`nodemon`](http://npm.im/nodemon) for you, all
credit for the reliable file watching and process restarting should go to there.

## License

MIT
