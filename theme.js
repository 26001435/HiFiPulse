/* Shared, persistent light/dark preference. System setting is the default. */
(function () {
  'use strict';
  function preference() {
    try {
      var saved = localStorage.getItem('hifipulse:theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) { /* Storage can be disabled. */ }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function apply(value) {
    document.documentElement.dataset.theme = value;
    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      var dark = value === 'dark';
      button.textContent = dark ? 'Light mode' : 'Dark mode';
      button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      button.setAttribute('aria-pressed', String(dark));
    });
  }
  apply(preference());
  document.addEventListener('DOMContentLoaded', function () {
    apply(preference());
    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      button.addEventListener('click', function () {
        var next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem('hifipulse:theme', next); } catch (e) {}
        apply(next);
      });
    });
    var dropdowns = Array.prototype.slice.call(document.querySelectorAll('.nav-dropdown'));
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function closeDropdown(dropdown) {
      if (!dropdown.open || dropdown.classList.contains('is-closing')) return;
      if (reduceMotion) { dropdown.open = false; return; }
      dropdown.classList.add('is-closing');
      window.setTimeout(function () {
        dropdown.open = false;
        dropdown.classList.remove('is-closing');
      }, 170);
    }
    dropdowns.forEach(function (dropdown) {
      dropdown.querySelector('summary').addEventListener('click', function (event) {
        if (dropdown.open) { event.preventDefault(); closeDropdown(dropdown); }
      });
      dropdown.addEventListener('toggle', function () {
        if (dropdown.open && !dropdown.classList.contains('is-closing')) dropdowns.forEach(function (other) {
          if (other !== dropdown) closeDropdown(other);
        });
      });
    });
    document.addEventListener('click', function (event) {
      if (!event.target.closest('.nav-dropdown')) dropdowns.forEach(closeDropdown);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      dropdowns.forEach(function (dropdown) {
        if (dropdown.open && !dropdown.classList.contains('is-closing')) {
          closeDropdown(dropdown);
          dropdown.querySelector('summary').focus();
        }
      });
    });
    if (window.matchMedia) {
      var media = window.matchMedia('(prefers-color-scheme: dark)');
      var onSystemChange = function () {
        try { if (localStorage.getItem('hifipulse:theme')) return; } catch (e) {}
        apply(preference());
      };
      if (media.addEventListener) media.addEventListener('change', onSystemChange);
      else if (media.addListener) media.addListener(onSystemChange);
    }
  });
})();
