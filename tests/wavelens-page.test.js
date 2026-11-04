const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('WaveLens is reachable from the About dropdown without changing its first two entries', () => {
  for (const page of ['index.html', 'about.html', 'guide.html', 'map.html', 'rankings.html', 'planner.html', 'wavelens.html']) {
    const menu = read(page).match(/<div class="nav-menu" id="about-menu">([\s\S]*?)<\/div>/);
    assert.ok(menu, page);
    assert.ok(menu[1].indexOf('Our Mission') < menu[1].indexOf('Wi-Fi guide'), page);
    assert.ok(menu[1].indexOf('Wi-Fi guide') < menu[1].indexOf('wavelens.html'), page);
  }
});

test('the concept page keeps measurement claims conditional and labels its illustration', () => {
  const page = read('wavelens.html');
  assert.match(page, /NOT DEPLOYED/);
  assert.match(page, /not a photograph of a working device/);
  assert.match(page, /not been documented as built or validated/);
  assert.match(page, /materials-cost target, not a verified total/);
  assert.match(page, /43\.9 cm across/);
  assert.match(page, /not a verified Wi-Fi fix|not a proven Wi-Fi fix/i);
  assert.match(read('about.html'), /Not built or validated in this repository/);
});
