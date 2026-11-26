"use strict";

const updateHuntDoor = (() => {
  const storageKey = "adviento-z:mapa-del-buho:2026:peliculas";
  const trials = {
    estrella: {
      object: "Cáliz de Fuego",
      title: "El cuarto nombre",
      intro: "El cáliz sacó el nombre de Harry aunque él nunca lo puso ahí. ¿Cuál es el apellido de quien lo inscribió?",
      clues: ["Se hizo pasar por el profesor de Defensa Contra las Artes Oscuras.", "Al verdadero profesor lo encontraron dentro de un baúl."],
      hint: "En la película, el impostor y su padre comparten nombre y apellido.",
      answers: ["CROUCH", "BARTYCROUCH", "BARTYCROUCHJR", "BARTYCROUCHJUNIOR"],
      fragment: "dos motivos",
    },
    pluma: {
      object: "Pensadero",
      title: "Los recuerdos mezclados",
      intro: "Se mezclaron tres escenas en el Pensadero. Ordénalas de la primera película en estrenarse a la última. Escribe sus tres letras en ese orden.",
      clues: [
        "Z · Una cierva plateada guía a Harry hasta un estanque helado.",
        "L · Fawkes lleva el Sombrero Seleccionador a la Cámara de los Secretos.",
        "U · Harry ahuyenta a los dementores a orillas de un lago.",
      ],
      hint: "La escena de la cierva sucede cuando Harry ya dejó Hogwarts.",
      answers: ["LUZ"],
      fragment: "para brindar.",
    },
    luna: {
      object: "Espejo de Oesed",
      title: "La inscripción del espejo",
      intro: "Harry vio a sus papás en este espejo. El sello parece haber copiado una palabra del reflejo. Léela como la verías del otro lado.",
      clues: ["O · E · S · E · D"],
      hint: "La primera letra que buscas está en el extremo derecho.",
      answers: ["DESEO"],
      fragment: "Cuando arda la última vela,",
    },
    llave: {
      object: "Ajedrez mágico",
      title: "La jugada de Ron",
      intro: "En el ajedrez gigante de la primera película, Ron monta una pieza y se sacrifica para que Harry y Hermione sigan. ¿Cuál es esa pieza?",
      clues: [
        "Para recordar la pieza, imagínala en B2. Puede llegar a D3 en un solo movimiento.",
      ],
      hint: "Cuenta dos casillas en una dirección y una hacia un lado. El recorrido dibuja una L.",
      answers: ["CABALLO", "ELCABALLO", "CABALLERO"],
      fragment: "Hogwarts guardará",
    },
  };
  const solution = ["luna", "llave", "estrella", "pluma"];
  const sealButtons = document.querySelectorAll("[data-seal]");
  const status = document.getElementById("hunt-status");
  const puzzle = document.getElementById("hunt-puzzle");
  const fragmentList = document.getElementById("hunt-fragments");
  const phrase = document.getElementById("hunt-phrase");
  const check = document.getElementById("hunt-check");
  const reward = document.getElementById("hunt-reward");
  const clue = document.getElementById("gift-clue");
  const clueText = document.getElementById("gift-clue-text");
  const traceList = document.getElementById("hunt-traces");
  const traceClue = document.getElementById("hunt-trace-clue");
  const mapMotion = document.getElementById("map-motion");
  const mapPlan = document.querySelector(".hunt-plan");
  const doorSeal = document.querySelector(".door-seal");
  const trialDialog = document.getElementById("hunt-dialog");
  const trialForm = document.getElementById("trial-form");
  const trialCode = document.getElementById("trial-code");
  const trialFeedback = document.getElementById("trial-feedback");
  const trialHelp = document.getElementById("trial-help");
  const trialTitle = document.getElementById("trial-title");
  const trialIntro = document.getElementById("trial-intro");
  const trialClues = document.getElementById("trial-clues");
  const trialHint = document.getElementById("trial-hint");
  const found = new Set();
  let solved = false;
  let attempt = [];
  let activeSeal;

  mapMotion.addEventListener("click", () => {
    const paused = mapPlan.toggleAttribute("data-paused");
    mapMotion.textContent = paused ? "Reanudar huellas" : "Pausar huellas";
  });

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved?.found)) {
      for (const seal of saved.found) {
        if (Object.hasOwn(trials, seal)) found.add(seal);
      }
      solved = found.size === solution.length && saved.solved === true;
    }
  } catch {}

  function saveHunt() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ found: [...found], solved }));
    } catch {}
  }

  function renderHunt() {
    for (const button of sealButtons) {
      button.setAttribute("aria-pressed", String(found.has(button.dataset.seal)));
    }
    status.textContent = solved ? "Mapa descifrado." : `${found.size} de ${solution.length} sellos descifrados.`;
    puzzle.hidden = solved || found.size !== solution.length;
    reward.hidden = !solved;
  }

  function renderAttempt() {
    for (const button of fragmentList.querySelectorAll("button")) {
      const order = attempt.indexOf(button.dataset.fragment) + 1;
      button.setAttribute("aria-pressed", String(order > 0));
      button.firstElementChild.textContent = order || "";
    }
    phrase.textContent = attempt.map(seal => trials[seal].fragment).join(" ") || "El mensaje se escribe aquí.";
    check.disabled = attempt.length !== solution.length;
  }

  for (const button of sealButtons) {
    button.addEventListener("click", () => {
      activeSeal = button.dataset.seal;
      const trial = trials[activeSeal];
      const completed = found.has(activeSeal);
      trialTitle.textContent = trial.title;
      trialIntro.textContent = trial.intro;
      trialClues.replaceChildren(...trial.clues.map(text => {
        const item = document.createElement("li");
        item.textContent = text;
        return item;
      }));
      trialHelp.open = false;
      trialHelp.hidden = completed;
      trialHint.textContent = trial.hint;
      trialForm.hidden = completed;
      trialForm.reset();
      trialFeedback.textContent = completed ? `Guardaste «${trial.fragment}» en el mapa.` : "";
      trialDialog.showModal();
    });
  }

  trialForm.addEventListener("submit", event => {
    event.preventDefault();
    const answer = trialCode.value.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s,.-]/g, "");
    const trial = trials[activeSeal];
    if (!trial.answers.includes(answer)) {
      trialFeedback.textContent = "El sello sigue cerrado. Revisa la prueba y vuelve a intentar.";
      trialCode.select();
      return;
    }
    found.add(activeSeal);
    saveHunt();
    renderHunt();
    trialForm.hidden = true;
    trialHelp.hidden = true;
    trialFeedback.textContent = `Sello descifrado. «${trial.fragment}» quedó en el mapa.`;
    trialDialog.querySelector(".close-dialog").focus();
  });

  for (const [seal, trial] of Object.entries(trials)) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.fragment = seal;
    button.setAttribute("aria-pressed", "false");
    const order = document.createElement("span");
    order.setAttribute("aria-hidden", "true");
    button.append(order, trial.object);
    button.addEventListener("click", () => {
      attempt = attempt.includes(seal) ? attempt.filter(item => item !== seal) : [...attempt, seal];
      status.textContent = "Los cuatro sellos están descifrados.";
      renderAttempt();
    });
    fragmentList.append(button);
  }

  document.getElementById("hunt-reset").addEventListener("click", () => {
    attempt = [];
    status.textContent = "Puedes volver a ordenar los fragmentos.";
    renderAttempt();
    fragmentList.firstElementChild.focus();
  });

  check.addEventListener("click", () => {
    if (!solution.every((seal, index) => attempt[index] === seal)) {
      status.textContent = "El mapa rechazó ese orden. Piensa en la primera escena de cada objeto.";
      return;
    }
    solved = true;
    saveHunt();
    renderHunt();
    reward.focus();
  });

  reward.querySelector("blockquote").textContent = solution.map(seal => trials[seal].fragment).join(" ");
  PISTAS.forEach((hint, index) => {
    const day = index + 1;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(day);
    button.setAttribute("aria-label", `Pista del día ${day}`);
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      traceList.querySelector('[aria-pressed="true"]')?.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-pressed", "true");
      traceClue.textContent = `Día ${day} · ${hint}`;
    });
    traceList.append(button);
  });
  renderHunt();

  return (day, available) => {
    clue.hidden = !solved || available;
    clueText.textContent = clue.hidden ? "" : PISTAS[day - 1];
    doorSeal.hidden = day !== 9;
  };
})();
