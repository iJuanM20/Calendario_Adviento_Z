"use strict";

const YEAR = 2026;
const TOTAL = SORPRESAS.length;
const STORAGE_KEY = `adviento-z:${YEAR}:abiertas`;
const SOUND_KEY = "adviento-z:sonido";
const DOOR_COLORS = ["wine", "cream", "pine", "night", "wine", "pine", "cream", "wine"];
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
  castillo: '<path d="M5 42h38M9 42V22H6l7-10 7 10h-3v6h14v-6h-3l7-10 7 10h-3v20M19 28v-9l5-7 5 7v9M22 42v-5a2 2 0 0 1 4 0v5M13 29v5m22-5v5M24 3v5m-2.5-2.5h5"/>',
  varita: '<path d="m10 39 19-21 3 3L13 42zM35 5v10m-5-5h10M16 8v8m-4-4h8m17 14v8m-4-4h8"/>',
  nieve: '<path d="M24 5v38M7.5 14.5l33 19m0-19-33 19M19 9l5 5 5-5m-10 30 5-5 5 5M8 21l7-2-2-7m22 24-2-7 7-2m-32 0 7 2-2 7m22-24-2 7 7 2"/>',
  vela: '<path d="M19 42V24h10v18M14 42h20M24 20c-6 0-7-5 0-14 7 9 6 14 0 14Zm0 0v4M8 12v8m-4-4h8m24-5v9m-4.5-4.5h9"/>',
};
const ORNAMENT_ORDER = ["estrella", "carta", "castillo", "pino", "varita", "corazón", "regalo", "adorno"];
const ICONS = {
  closed: '<rect x="4" y="7" width="8" height="7" rx="1.5"/><path d="M6 7V5a2 2 0 0 1 4 0v2"/>',
  open: '<path d="m3 8 3 3 7-7"/>',
  ready: '<path d="M8 2v12M2 8h12"/>',
};

const doors = document.getElementById("doors");
const calendar = document.getElementById("calendario");
const dialog = document.getElementById("gift-dialog");
const giftCelebration = document.getElementById("gift-celebration");
const giftCandles = document.getElementById("gift-candles");
const ambientSound = document.getElementById("ambient-sound");
const giftSound = document.getElementById("gift-sound");
const finaleSound = document.getElementById("finale-sound");
const soundButton = document.getElementById("sound");
const soundLabel = document.getElementById("sound-label");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const progress = document.getElementById("progress");
const progressLabel = document.getElementById("progress-label");
const availability = document.getElementById("availability");
const toast = document.getElementById("toast");
const shareButton = document.getElementById("share");
const opened = readOpenedDays();
let dateShown;
let dialogDay;
let toastTimer;
let celebrationTimer;
let soundEnabled = true;
let audioContext;
let activeEffect;
let effectRequest = 0;
const effectBuffers = new Map();
const AudioContextClass = window.AudioContext || window.webkitAudioContext;

try {
  soundEnabled = localStorage.getItem(SOUND_KEY) !== "off";
} catch {}

function updateSoundButton() {
  const playing = soundEnabled && !ambientSound.paused;
  soundButton.setAttribute("aria-pressed", String(playing));
  soundLabel.textContent = playing ? "Silenciar" : "Activar música";
}

for (const event of ["playing", "pause", "error"]) {
  ambientSound.addEventListener(event, updateSoundButton);
}

soundButton.addEventListener("click", () => {
  soundEnabled = ambientSound.paused || !soundEnabled;
  if (soundEnabled) playAmbience();
  else {
    ambientSound.pause();
    stopGiftSound();
  }
  updateSoundButton();
  try {
    localStorage.setItem(SOUND_KEY, soundEnabled ? "on" : "off");
  } catch {}
});

function playAmbience() {
  if (!soundEnabled || !ambientSound.paused) return;
  // Safari must receive the play request directly from the tap.
  try {
    if (navigator.audioSession) navigator.audioSession.type = "playback";
  } catch {}
  if (ambientSound.error) ambientSound.load();
  ambientSound.play().catch(updateSoundButton);
}

function stopGiftSound() {
  effectRequest++;
  if (activeEffect) {
    activeEffect.stop();
    activeEffect = undefined;
  }
  giftSound.pause();
  finaleSound.pause();
}

async function playGiftSound(isFinale = false) {
  if (!soundEnabled) return;
  stopGiftSound();
  const sound = isFinale ? finaleSound : giftSound;
  if (!AudioContextClass || location.protocol === "file:") {
    sound.currentTime = 0;
    sound.play().catch(() => {});
    return;
  }
  const request = effectRequest;
  try {
    // Mix effects separately so Safari keeps the background audio element playing.
    audioContext ??= new AudioContextClass();
    const resumed = audioContext.state === "running" ? Promise.resolve() : audioContext.resume();
    if (!effectBuffers.has(sound)) {
      const buffer = fetch(sound.src)
        .then(response => {
          if (!response.ok) throw new Error("No se pudo cargar el efecto de audio");
          return response.arrayBuffer();
        })
        .then(bytes => audioContext.decodeAudioData(bytes))
        .catch(error => {
          effectBuffers.delete(sound);
          throw error;
        });
      effectBuffers.set(sound, buffer);
    }
    const [, buffer] = await Promise.all([resumed, effectBuffers.get(sound)]);
    if (request !== effectRequest) return;

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.onended = () => {
      source.disconnect();
      if (activeEffect === source) activeEffect = undefined;
    };
    source.start();
    activeEffect = source;
  } catch {
    // A failed effect must not interrupt the background music.
  }
}

const arrival = document.getElementById("arrival");
const arrivalButton = document.getElementById("open-arrival");
const arrivalOrnaments = document.getElementById("arrival-ornaments");
const calendarContent = document.getElementById("calendar-content");

function revealCalendar() {
  calendarContent.hidden = false;
  arrival.classList.add("is-revealing");
}

function finishArrival() {
  revealCalendar();
  arrival.hidden = true;
  arrivalOrnaments.replaceChildren();
  const directToCalendar = location.hash === "#calendario";
  const directToMap = location.hash === "#mapa";
  requestAnimationFrame(() => {
    if (directToMap) {
      document.getElementById("mapa").scrollIntoView();
      document.querySelector(".hunt-cover").focus({ preventScroll: true });
      return;
    }
    if (directToCalendar) calendar.scrollIntoView();
    document.getElementById(directToCalendar ? "calendar-title" : "portada").focus({ preventScroll: true });
  });
}

function fillArrivalOrnaments() {
  const symbols = ["estrella", "nieve", "regalo", "vela", "castillo", "varita", "adorno", "carta"];
  const colors = ["#733955", "#294b49", "#51416c", "#8a613e", "#342f58"];
  const width = arrival.clientWidth;
  const height = arrival.clientHeight;
  const columns = Math.max(5, Math.min(15, Math.round(width / 90)));
  const rows = Math.max(5, Math.min(11, Math.round(height / 78)));
  const grid = document.createDocumentFragment();
  for (let index = 0; index < columns * rows; index++) {
    const x = ((index % columns + .17 + Math.random() * .66) / columns) * width;
    const y = ((Math.floor(index / columns) + .18 + Math.random() * .64) / rows) * height;
    const tile = document.createElement("span");
    tile.className = "arrival-ornament";
    tile.style.setProperty("--tile-x", `${x}px`);
    tile.style.setProperty("--tile-y", `${y}px`);
    tile.style.setProperty("--tile-from-x", `${width * .5 - x}px`);
    tile.style.setProperty("--tile-from-y", `${height * .55 - y}px`);
    tile.style.setProperty("--tile-rotate", `${Math.round(Math.random() * 68 - 34)}deg`);
    tile.style.setProperty("--tile-size", `${Math.min(width / columns, height / rows) * (.68 + Math.random() * .52)}px`);
    tile.style.setProperty("--tile-color", colors[index % colors.length]);
    tile.style.setProperty("--tile-delay", `${Math.round(490 + Math.random() * 570)}ms`);
    tile.style.setProperty("--tile-duration", `${Math.round(420 + Math.random() * 390)}ms`);
    tile.innerHTML = `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">${ORNAMENTS[symbols[index % symbols.length]]}</svg>`;
    grid.append(tile);
  }
  arrivalOrnaments.replaceChildren(grid);
}

arrivalButton.addEventListener("click", () => {
  if (arrival.classList.contains("is-opening")) return;
  playAmbience();
  playGiftSound();
  if (reducedMotion.matches) {
    finishArrival();
    return;
  }

  arrival.classList.add("is-opening");
  arrivalButton.setAttribute("aria-disabled", "true");
  fillArrivalOrnaments();
  setTimeout(revealCalendar, 1550);
  setTimeout(finishArrival, 2690);
});

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
    const openingDate = dateForDay(day);
    const today = openingDate === dateShown;
    const available = openingDate <= dateShown;
    const isOpened = available && opened.has(day);
    if (isOpened) openedCount++;
    const state = isOpened ? "open" : available ? "ready" : "closed";
    const label = isOpened ? "Abierta" : today ? "Abrir hoy" : available ? "Abrir" : `Abre el ${day} dic.`;
    const ornament = day === TOTAL ? ORNAMENTS.regalo : ORNAMENTS[ORNAMENT_ORDER[index % ORNAMENT_ORDER.length]];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "door";
    if (day === TOTAL) button.classList.add("finale");
    if (today) button.classList.add("today");
    button.dataset.day = day;
    button.dataset.color = DOOR_COLORS[index % DOOR_COLORS.length];
    button.setAttribute("aria-label", available
      ? `${day} de diciembre · ${label}`
      : `Día ${day}: abre el ${day} de diciembre a medianoche`);
    button.innerHTML = `<span class="door-number" aria-hidden="true">${String(day).padStart(2, "0")}</span>
      <span class="door-ornament" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">${ornament}</svg></span>
      <span class="door-state" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${ICONS[state]}</svg>${label}</span>`;
    fragment.append(button);
  });
  doors.replaceChildren(fragment);
  if (focusedDay) doors.querySelector(`[data-day="${focusedDay}"]`)?.focus({ preventScroll: true });
  progress.value = openedCount;
  progressLabel.textContent = `${openedCount} de ${TOTAL} abiertas`;
  if (dateShown < dateForDay(1)) {
    availability.textContent = "La primera puerta se abre el 1 de diciembre a medianoche.";
  } else if (dateShown >= dateForDay(TOTAL)) {
    availability.textContent = "Ya puedes abrir cualquiera de las 24 sorpresas.";
  } else {
    const nextDay = dateShown - dateForDay(1) + 2;
    availability.textContent = `La próxima puerta se abre el ${nextDay} de diciembre a medianoche.`;
  }
}

function showGift(day) {
  const available = dateForDay(day) <= dateInColombia();
  const isFinale = available && day === TOTAL;
  const gift = SORPRESAS[day - 1];
  const paragraphs = available
    ? gift.texto.split("\n\n")
    : [`${day === 1 ? "La primera puerta" : "Esta puerta"} se abre el ${day} de diciembre a medianoche.`];
  if (available) {
    opened.add(day);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...opened]));
    } catch {
      announce("La sorpresa se abrió. Este navegador no pudo guardar el progreso.");
    }
    render();
  }
  dialogDay = day;
  updateHuntDoor(day, available);
  dialog.classList.toggle("is-finale", isFinale);
  document.getElementById("gift-seal").textContent = isFinale ? "★" : available ? "✦" : "✧";
  document.getElementById("gift-date").textContent = available ? `${gift.tipo} · ${day} de diciembre` : `Día ${day}`;
  document.getElementById("gift-title").textContent = available ? gift.titulo : "Todavía falta un poquito";
  document.getElementById("gift-copy").replaceChildren(...paragraphs.map(text => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    return paragraph;
  }));
  dialog.showModal();
  if (available) {
    playAmbience();
    playGiftSound(isFinale);
    lightFloatingCandles(isFinale);
    celebrateGift(isFinale);
  }
}

function lightFloatingCandles(isFinale) {
  const width = dialog.clientWidth;
  const gutter = Math.max(31, (width - dialog.querySelector(".dialog-content").offsetWidth) / 2 - 14);
  const perSide = isFinale ? 8 : 5;
  const candles = document.createDocumentFragment();
  for (let index = 0; index < perSide * 2; index++) {
    const level = Math.floor(index / 2);
    const margin = 7 + Math.random() * (gutter - 7);
    const candle = document.createElement("span");
    candle.className = "floating-candle";
    candle.style.setProperty("--candle-x", `${index % 2 === 0 ? margin : width - margin}px`);
    candle.style.setProperty("--candle-y", `${8 + level * (70 / perSide) + Math.random() * 6}%`);
    candle.style.setProperty("--candle-size", `${Math.round(24 + Math.random() * 16)}px`);
    candle.style.setProperty("--candle-phase", `${-Math.round(index * 450 + Math.random() * 190)}ms`);
    candles.append(candle);
  }
  giftCandles.replaceChildren(candles);
}

function appendFireworks(layer, width) {
  const bursts = [
    [13, 19, 540, "#ffd77a"],
    [86, 25, 930, "#9cebd3"],
    [48, 12, 1480, "#f8b4db"],
    [12, 62, 2020, "#bfb5ff"],
    [86, 63, 2460, "#ffc986"],
    [52, 19, 3020, "#fff0b9"],
  ];
  bursts.forEach(([left, top, delay, color], burstIndex) => {
    const burst = document.createElement("span");
    burst.className = "firework-burst";
    burst.style.setProperty("--burst-x", `${left}%`);
    burst.style.setProperty("--burst-y", `${top}%`);
    burst.style.setProperty("--burst-delay", `${delay}ms`);
    burst.style.setProperty("--burst-color", color);

    const radius = Math.min(148, width * .24) * (burstIndex === bursts.length - 1 ? 1.26 : 1);
    for (let ray = 0; ray < 24; ray++) {
      const angle = (ray / 24) * 2 * Math.PI + burstIndex * .13;
      const distance = radius * (ray % 3 === 0 ? .55 : .78 + Math.random() * .29);
      const spark = document.createElement("i");
      spark.className = "firework-spark";
      spark.style.setProperty("--ray-angle", `${angle}rad`);
      spark.style.setProperty("--ray-length", `${Math.round(distance)}px`);
      burst.append(spark);
    }
    layer.append(burst);
  });
}

function clearGiftCelebration() {
  clearTimeout(celebrationTimer);
  giftCelebration.replaceChildren();
  dialog.classList.remove("is-celebrating");
}

function celebrateGift(isFinale) {
  clearGiftCelebration();
  if (reducedMotion.matches) return;

  const colors = ["#f9d06d", "#fff5c4", "#d64568", "#6cd9b0", "#ff9d93", "#bda2f0"];
  const count = isFinale ? 170 : 112;
  const width = dialog.clientWidth;
  const height = dialog.clientHeight;
  const confetti = document.createDocumentFragment();
  for (let index = 0; index < count; index++) {
    const rain = index >= count * .56;
    const side = index % 2 === 0 ? 1 : -1;
    const x = rain ? Math.random() * width : side === 1 ? -10 : width + 10;
    const y = rain ? -20 : height * (.66 + Math.random() * .22);
    const drift = rain ? (Math.random() - .5) * 180 : side * width * (.3 + Math.random() * .73);
    const rise = rain ? height * .42 : -height * (.24 + Math.random() * .52);
    const fall = height - y + 40;
    const piece = document.createElement("span");
    piece.className = "gift-particle";
    piece.style.setProperty("--particle-color", colors[index % colors.length]);
    piece.style.setProperty("--start-x", `${Math.round(x)}px`);
    piece.style.setProperty("--start-y", `${Math.round(y)}px`);
    piece.style.setProperty("--drift-x", `${Math.round(drift)}px`);
    piece.style.setProperty("--arc-y", `${Math.round(rise)}px`);
    piece.style.setProperty("--fall-y", `${Math.round(fall)}px`);
    piece.style.setProperty("--spin", `${Math.round(Math.random() * 1160 - 580)}deg`);
    piece.style.setProperty("--size", (.72 + Math.random() * .75).toFixed(2));
    piece.style.setProperty("--delay", `${Math.round((rain ? 420 : 25) + Math.random() * (rain ? 940 : 420))}ms`);
    piece.style.setProperty("--duration", `${Math.round(1800 + Math.random() * 1080)}ms`);
    confetti.append(piece);
  }
  const starCount = isFinale ? 44 : 28;
  for (let index = 0; index < starCount; index++) {
    const star = document.createElement("span");
    star.className = "falling-star";
    star.textContent = index % 5 === 0 ? "★" : "✦";
    star.style.setProperty("--star-x", `${((index + .1 + Math.random() * .8) / starCount * 100).toFixed(1)}%`);
    star.style.setProperty("--star-size", `${Math.round(19 + Math.random() * 15)}px`);
    star.style.setProperty("--star-delay", `${Math.round(310 + Math.random() * 1350)}ms`);
    star.style.setProperty("--star-duration", `${Math.round(2750 + Math.random() * 1100)}ms`);
    star.style.setProperty("--star-fall", `${height + 90}px`);
    confetti.append(star);
  }
  if (isFinale) appendFireworks(confetti, width);
  giftCelebration.append(confetti);
  dialog.classList.add("is-celebrating");
  celebrationTimer = setTimeout(clearGiftCelebration, 5600);
}

function announce(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 4300);
}

doors.addEventListener("click", event => {
  const door = event.target.closest(".door");
  if (door) showGift(Number(door.dataset.day));
});

dialog.addEventListener("close", () => {
  clearGiftCelebration();
  giftCandles.replaceChildren();
  dialog.classList.remove("is-finale");
  stopGiftSound();
  doors.querySelector(`[data-day="${dialogDay}"]`)?.focus({ preventScroll: true });
});

shareButton.hidden = !["http:", "https:"].includes(location.protocol);
shareButton.addEventListener("click", async () => {
  const url = new URL(location.href);
  url.hash = "";
  url.search = "";
  if (navigator.share) {
    try {
      await navigator.share({ title: "Calendario de Adviento para Zaret", url: url.href });
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
