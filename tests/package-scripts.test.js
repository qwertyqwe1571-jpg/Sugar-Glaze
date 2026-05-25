const test = require('node:test');
const assert = require('node:assert/strict');
const packageJson = require('../package.json');

test('style scripts call Sass through Node instead of a platform shell shim', () => {
  assert.match(packageJson.scripts.build, /^node \.\/node_modules\/sass\/sass\.js /);
  assert.match(packageJson.scripts['sass:watch'], /^node \.\/node_modules\/sass\/sass\.js /);
});

test('npm test runs the automated test suite', () => {
  assert.equal(packageJson.scripts.test, 'node --test');
});
