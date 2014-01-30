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

The keys of the `"watch"` config should match the names of your `"scripts"`, and
the values should be a glob pattern or array of glob patterns to watch.

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

## Acknowledgements

This module does very little but run [`nodemon`](http://npm.im/nodemon) for you, all
credit for the reliable file watching and process restarting should go to there.

## License

MIT
