"use strict";

const YEAR = 2026;
const TOTAL = SORPRESAS.length;
const STORAGE_KEY = `adviento-z:${YEAR}:abiertas`;
const DOOR_COLORS = ["wine", "cream", "pine", "rose", "wine", "pine", "cream", "wine"];
const DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit",
});

const ORNAMENTS = {
  carta: '<path d="M7 17.5h34v23H7zM7 18l17 13 17-13M7 40l11-11m23 11L30 29"/><path d="M24 4v9M19.5 8.5h9M35 6v6m-3-3h6"/>',
  pino: '<path d="M24 6 15.5 17H20l-10 11h6L6.5 39h35L32 28h6L28 17h4.5L24 6Zm0 33v5M37 6v8m-4-4h8M8 10v6m-3-3h6"/>',
  regalo: '<path d="M8 22v18h32V22M5 15.5h38V23H5zM24 16v24m0-24s-8 1-11-3c-4-5 4-9 8-3l3 6Zm0 0s8 1 11-3c4-5-4-9-8-3l-3 6Z"/>',
  estrella: '<path d="m25 5 4.3 11.7L41 21l-11.7 4.3L25 37l-4.3-11.7L9 21l11.7-4.3L25 5ZM9 31v10m-5-5h10m22-4v9m-4.5-4.5h9M10 7v7m-3.5-3.5h7"/>',
  adorno: '<path d="M24 3v6m-5 3h10v5H19zM24 17a14 14 0 1 0 0 28 14 14 0 0 0 0-28Z"/><path d="M11 27c7 2 19 2 26 0m-26 9c7-2 19-2 26 0M36 5v8m-4-4h8"/>',
  corazón: '<path d="M24 41S6 30 6 20c0-9 12-11 18-3 6-8 18-6 18 3 0 10-18 21-18 21ZM24 3v8m-4-4h8"/>',
};
const ORNAMENT_ORDER = ["estrella", "carta", "pino", "adorno", "regalo", "corazón"];
const ICONS = {
  closed: '<rect x="4" y="7" width="8" height="7" rx="1.5"/><path d="M6 7V5a2 2 0 0 1 4 0v2"/>',
  open: '<path d="m3 8 3 3 7-7"/>',
  ready: '<path d="M8 2v12M2 8h12"/>',
};

const doors = document.getElementById("doors");
const calendar = document.getElementById("calendario");
const dialog = document.getElementById("gift-dialog");
const progress = document.getElementById("progress");
const progressLabel = document.getElementById("progress-label");
const availability = document.getElementById("availability");
const previewBar = document.getElementById("preview-bar");
const toast = document.getElementById("toast");
const shareButton = document.getElementById("share");
const opened = readOpenedDays();
let preview = false;
let dateShown;
let dialogDay;
let toastTimer;

function readOpenedDays() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return new Set(Array.isArray(saved) ? saved.filter(day => Number.isInteger(day) && day >= 1 && day <= TOTAL) : []);
  } catch {
    return new Set();
  }
}

function dateInColombia() {
  const parts = Object.fromEntries(DATE_FORMAT.formatToParts(new Date()).map(part => [part.type, part.value]));
  return Number(parts.year) * 10000 + Number(parts.month) * 100 + Number(parts.day);
}

function dateForDay(day) {
  return YEAR * 10000 + 1200 + day;
}

function render() {
  dateShown = dateInColombia();
  const focusedDay = doors.contains(document.activeElement) ? document.activeElement.dataset.day : null;
  const fragment = document.createDocumentFragment();
  let openedCount = 0;
  SORPRESAS.forEach((gift, index) => {
    const day = index + 1;
    const today = dateForDay(day) === dateShown;
    const isOpened = dateForDay(day) <= dateShown && opened.has(day);
    if (isOpened) openedCount++;
    const available = preview || dateForDay(day) <= dateShown;
    const state = isOpened ? "open" : available ? "ready" : "closed";
    const label = preview ? "Ver sorpresa" : isOpened ? "Abierta" : today ? "Abrir hoy" : available ? "Abrir" : "Cerrada";
    const ornament = day === TOTAL ? ORNAMENTS.regalo : ORNAMENTS[ORNAMENT_ORDER[index % ORNAMENT_ORDER.length]];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "door";
    if (day === TOTAL) button.classList.add("finale");
    if (today) button.classList.add("today");
    button.dataset.day = day;
    button.dataset.color = DOOR_COLORS[index % DOOR_COLORS.length];
    button.setAttribute("aria-label", `${day} de diciembre · ${label}`);
    button.innerHTML = `<span class="door-number" aria-hidden="true">${String(day).padStart(2, "0")}</span>
      <span class="door-ornament" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">${ornament}</svg></span>
      <span class="door-state" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${ICONS[state]}</svg>${label}</span>`;
    fragment.append(button);
  });
  doors.replaceChildren(fragment);
  if (focusedDay) doors.querySelector(`[data-day="${focusedDay}"]`)?.focus({ preventScroll: true });
  progress.value = openedCount;
  progressLabel.textContent = `${openedCount} de ${TOTAL} abiertas`;
  availability.textContent = dateShown < dateForDay(1)
    ? "La primera puerta se abre el 1 de diciembre a medianoche en Colombia."
    : dateShown > dateForDay(TOTAL)
      ? "Ya puedes volver a cualquiera de las 24 sorpresas."
      : "Cada puerta se abre en su fecha, a medianoche en Colombia.";
}

function showGift(day) {
  const available = preview || dateForDay(day) <= dateInColombia();
  const gift = SORPRESAS[day - 1];
  const paragraphs = available
    ? gift.texto.split("\n\n")
    : [`Podrás abrir esta puerta el ${day} de diciembre de ${YEAR}, a medianoche en Colombia.`];
  if (available && !preview) {
    opened.add(day);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...opened]));
    } catch {
      announce("La sorpresa se abrió. Este navegador no pudo guardar el progreso.");
    }
    render();
  }
  dialogDay = day;
  document.getElementById("gift-seal").textContent = available ? "✦" : "✧";
  document.getElementById("gift-date").textContent = available ? `${gift.tipo} · ${day} de diciembre` : `Día ${day}`;
  document.getElementById("gift-title").textContent = available ? gift.titulo : "Todavía falta un poquito";
  document.getElementById("gift-copy").replaceChildren(...paragraphs.map(text => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    return paragraph;
  }));
  dialog.showModal();
}

function announce(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 4300);
}

const previewButton = document.getElementById("hero-preview");
const localPreview = location.protocol === "file:" || ["localhost", "127.0.0.1"].includes(location.hostname);
previewButton.hidden = !localPreview && new URLSearchParams(location.search).get("vista") !== "previa";
previewButton.addEventListener("click", () => {
  preview = true;
  previewBar.hidden = false;
  render();
  calendar.scrollIntoView();
  doors.querySelector("button").focus({ preventScroll: true });
});

document.getElementById("exit-preview").addEventListener("click", () => {
  preview = false;
  previewBar.hidden = true;
  render();
  doors.querySelector("button").focus({ preventScroll: true });
});

doors.addEventListener("click", event => {
  const door = event.target.closest(".door");
  if (door) showGift(Number(door.dataset.day));
});

dialog.addEventListener("close", () => {
  doors.querySelector(`[data-day="${dialogDay}"]`)?.focus({ preventScroll: true });
});

shareButton.hidden = !["http:", "https:"].includes(location.protocol);
shareButton.addEventListener("click", async () => {
  const url = new URL(location.href);
  url.hash = "";
  url.search = "";
  if (navigator.share) {
    try {
      await navigator.share({ title: "Diciembre contigo", url: url.href });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(url.href);
    announce("Enlace copiado");
  } catch {
    announce("Puedes copiar el enlace desde la barra de direcciones.");
  }
});

function refreshDate() {
  if (dateInColombia() !== dateShown) render();
}

window.addEventListener("focus", refreshDate);
setInterval(refreshDate, 30_000);
render();
