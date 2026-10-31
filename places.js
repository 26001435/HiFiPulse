/* Curated campus place names with an editable, keyboard-accessible combobox. */
(function () {
  "use strict";
  var names = [
    "Main Library (Library)", "Main Library (Zus Coffee)", "Main Library (24HR)",
    "He & She Coffee (UMS)", "He & She Coffee (KK12)", "KK12 (Cafeteria)",
    "Study Cube KK12 (Main)", "Study Cube KK12 (Male)", "Study Cube KK12 (Female)",
    "Daun Cafe PASUM", "Surau Alumni PASUM", "COLA PASUM", "PASUM Main Building",
    "KK12 (Blok A)", "KK12 (Blok B)", "KK12 (Blok C)", "KK12 (Blok D)",
    "Study Cube KK11 (Male)", "Study Cube KK11 (Female)", "Kafeteria PASUM",
    "IAS (Main)", "IAS (Andalus Cafe)", "KPPI", "KK12 Foody Avenue",
    "Bangunan Lama PASUM", "KOOP PASUM", "Kafeteria KK11",
    "KPS (Study Area)", "KPS (Outside)", "Novi Cafe", "Za'aba Library",
    "BILIK TUTORIAL BT 1", "BILIK TUTORIAL BT 2", "BILIK TUTORIAL BT 3",
    "BILIK TUTORIAL BT 4", "BILIK TUTORIAL BT 5", "BILIK TUTORIAL BT 6",
    "BILIK TUTORIAL BT 7", "BILIK TUTORIAL BT B", "BILIK TUTORIAL BT 13",
    "BILIK TUTORIAL BT 15", "MAKMAL PENYELIDIKAN BAHAN", "STOR AAJ",
    "MAKMAL PENYELIDIKAN BIOLOGI", "BILIK PENSYARAH 3",
    "BILIK TUTORIAL ABT 1", "BILIK TUTORIAL ABT 2", "BILIK TUTORIAL ABT 3",
    "BILIK TUTORIAL ABT 18", "BILIK TUTORIAL ABT 11", "BILIK TUTORIAL ABT 12",
    "BILIK TUTORIAL ART 4", "BILIK TUTORIAL ART S", "BILIK TUTORIAL ART &",
    "BILIK TUTORIAL ART 7", "TUTORIAL ART", "BILIK TUTORIAL ART",
    "KEDAI CETAK", "BILIK KAWALAN AAJ", "BILIK PENSYARAH 2", "BILIK SAKURA",
    "PANTRI STAFF", "BILIK MESYUARAT AAJ", "BILIK PENSYARAHN 1",
    "STOR ICT AAJ", "BILIK AVA", "BILIK JURUTEKNIK", "MAKMAL BAHASA",
    "BILIK SERVER ICT", "BILIK KETUA GURU JEPUN", "BILIK PENYELARAS RPKJ",
    "DEWAN ADK 1", "DEWAN ADK 2", "DEWAN KULIAH UTAMA",
    "MAKMAL FIZIK JEPUN", "MAKMAL KIMIA JEPUN"
  ];
  function normal(value) { return value.trim().replace(/\s+/g, " ").toLocaleLowerCase(); }
  var seen = new Set();
  names = names.filter(function (name) {
    var key = normal(name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  document.addEventListener("DOMContentLoaded", function () {
    var input = document.getElementById("input-building");
    var list = document.getElementById("place-suggestions");
    var active = -1;
    var choices = [];
    try {
      var saved = localStorage.getItem("hifipulse:input-building");
      if (saved === "custom") saved = localStorage.getItem("hifipulse:input-custom-building");
      if (saved) input.value = saved.slice(0, 60);
    } catch (e) { /* Storage is optional. */ }

    function close() {
      list.hidden = true;
      list.replaceChildren();
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      active = -1;
    }
    function choose(value) {
      input.value = value;
      try { localStorage.setItem("hifipulse:input-building", value); } catch (e) {}
      close();
      input.focus();
    }
    function highlight(index) {
      active = index;
      Array.from(list.children).forEach(function (option, i) {
        option.setAttribute("aria-selected", String(i === active));
      });
      if (active >= 0) {
        input.setAttribute("aria-activedescendant", list.children[active].id);
        list.children[active].scrollIntoView({ block: "nearest" });
      } else input.removeAttribute("aria-activedescendant");
    }
    function render() {
      var query = normal(input.value);
      var matches = names.filter(function (name) { return !query || normal(name).includes(query); });
      matches.sort(function (a, b) {
        return Number(normal(b).startsWith(query)) - Number(normal(a).startsWith(query));
      });
      choices = matches.slice(0, 8).map(function (name) { return { label: name, value: name }; });
      if (query && !names.some(function (name) { return normal(name) === query; })) {
        choices.push({ label: 'Use new place: "' + input.value.trim() + '"', value: input.value.trim() });
      }
      list.replaceChildren();
      choices.forEach(function (choice, i) {
        var option = document.createElement("li");
        option.id = "place-option-" + i;
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", "false");
        option.textContent = choice.label;
        // Keep focus in the text field until the choice is applied.
        option.addEventListener("pointerdown", function (event) {
          event.preventDefault();
          choose(choice.value);
        });
        list.appendChild(option);
      });
      active = -1;
      input.removeAttribute("aria-activedescendant");
      list.hidden = !choices.length;
      input.setAttribute("aria-expanded", String(choices.length > 0));
    }
    input.addEventListener("focus", render);
    input.addEventListener("input", function () {
      render();
      try { localStorage.setItem("hifipulse:input-building", input.value); } catch (e) {}
    });
    input.addEventListener("keydown", function (event) {
      if (event.key === "Escape") { close(); return; }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (list.hidden) render();
        if (choices.length) highlight((active + (event.key === "ArrowDown" ? 1 : choices.length - 1) + choices.length) % choices.length);
      } else if (event.key === "Enter" && !list.hidden && active >= 0) {
        event.preventDefault();
        choose(choices[active].value);
      }
    });
    input.addEventListener("blur", function () {
      // Canonicalize an exact match even when the user types it in lowercase.
      var match = names.find(function (name) { return normal(name) === normal(input.value); });
      if (match) { input.value = match; try { localStorage.setItem("hifipulse:input-building", match); } catch (e) {} }
      close();
    });
  });
})();
