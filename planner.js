/* Device-only task list; evidence comes from the existing campus CSV and local tests. */
(function () {
  'use strict';
  var core = window.HifiStability;
  var tasks = [], records = [];
  var names = {quiz:'Online quiz or test', upload:'Upload assignment', video:'Watch lecture video', reading:'Read saved PDF'};
  function $(id) { return document.getElementById(id); }
  function node(tag, cls, text) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function render() {
    var list = $('task-list'); list.replaceChildren();
    tasks.forEach(function (task, index) {
      var item = node('li','task-item');
      item.appendChild(node('span','',task.label));
      var remove = node('button','','Remove');
      remove.type = 'button';
      remove.setAttribute('aria-label','Remove ' + task.label);
      remove.addEventListener('click', function () { tasks.splice(index,1); render(); });
      item.appendChild(remove); list.appendChild(item);
    });
    $('task-count').textContent = tasks.length + ' task' + (tasks.length === 1 ? '' : 's') + ' in this tab.';
    var host = $('planner-results'); host.replaceChildren();
    if (!tasks.length) {
      host.appendChild(node('p','note','Add a task to see an evidence-aware plan.'));
      return;
    }
    var zones = core.zones(records, Date.now());
    window.HifiPlanner.plan(tasks, zones).forEach(function (entry, index) {
      var card = node('article','plan-item');
      card.appendChild(node('p','eyebrow',String(index+1).padStart(2,'0') + ' / ' + names[entry.task.type]));
      card.appendChild(node('h3','',entry.task.label));
      card.appendChild(node('p','plan-location',entry.location));
      card.appendChild(node('p','',entry.time));
      card.appendChild(node('p','note',entry.evidence));
      if (entry.zone) {
        var link = node('a','','View approximate map position →');
        link.href = 'map.html?lat=' + encodeURIComponent(entry.zone.lat) + '&lon=' + encodeURIComponent(entry.zone.lon);
        card.appendChild(link);
      }
      host.appendChild(card);
    });
  }
  function localRows() {
    try {
      var data = JSON.parse(localStorage.getItem('hifipulse:results') || '[]');
      return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
  }
  async function load() {
    var local = localRows().map(function (r) { return core.normalise(r, window.HifiPlaceCheck); }).filter(Boolean);
    records = core.dedupe(local);
    render();
    $('planner-status').textContent = 'Checking community evidence… ' + local.length + ' eligible test(s) saved here.';
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 12000);
    try {
      var response = await fetch(window.HIFIPULSE.sheetCsvUrl, { cache:'no-store', signal:controller.signal });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      var text = await response.text();
      if (/^\s*</.test(text)) throw new Error('Expected CSV');
      var rows = window.HifiCsv.toObjects(window.HifiCsv.parse(text));
      var remote = rows.map(function (r) { return core.normalise(r, window.HifiPlaceCheck); }).filter(Boolean);
      records = core.dedupe(remote.concat(local));
      $('planner-status').textContent = records.length + ' eligible Campus Wi-Fi attempt(s) from the community feed and this device, past 30 days. Places and floors are self-reported.';
    } catch (e) {
      records = core.dedupe(local);
      $('planner-status').textContent = local.length ?
        'Community feed unavailable; using only tests saved on this device.' :
        'Community feed unavailable and no eligible local tests. Online tasks have no evidence-backed location.';
    } finally { clearTimeout(timeout); render(); }
  }
  document.addEventListener('DOMContentLoaded', function () {
    $('planner-form').addEventListener('submit', function (event) {
      event.preventDefault();
      if (tasks.length >= 12) { $('task-count').textContent = 'Limit of 12 tasks in this tab. Remove one to add another.'; return; }
      var type = $('task-type').value;
      if (!names[type]) return;
      tasks.push({ type:type, label:$('task-name').value.trim().slice(0,60) || names[type] });
      $('task-name').value = '';
      render();
    });
    render(); load();
  });
})();
