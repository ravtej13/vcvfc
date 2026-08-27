// main.js — wires the bot registry to the UI

const canvas = document.getElementById('arena');
const p1select = document.getElementById('p1select');
const p2select = document.getElementById('p2select');
const fightBtn = document.getElementById('fightBtn');
const resetBtn = document.getElementById('resetBtn');
const logEl = document.getElementById('log');
const p1fill = document.getElementById('p1fill');
const p2fill = document.getElementById('p2fill');
const p1name = document.getElementById('p1name');
const p2name = document.getElementById('p2name');

let currentFight = null;

function populateSelects() {
  BOT_REGISTRY.forEach((bot, i) => {
    const opt1 = new Option(bot.name, i);
    const opt2 = new Option(bot.name, i);
    p1select.add(opt1);
    p2select.add(opt2);
  });
  if (BOT_REGISTRY.length > 1) p2select.selectedIndex = 1;
}

function log(msg) {
  const line = document.createElement('div');
  line.textContent = msg;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

function startFight() {
  logEl.innerHTML = '';
  const defA = BOT_REGISTRY[p1select.value];
  const defB = BOT_REGISTRY[p2select.value];
  p1name.textContent = defA.name;
  p2name.textContent = defB.name;

  currentFight = new Fight(defA, defB, canvas);
  currentFight.onLog = log;
  currentFight.onUpdate = (botA, botB) => {
    p1fill.style.width = `${(botA.hp / 100) * 100}%`;
    p2fill.style.width = `${(botB.hp / 100) * 100}%`;
  };
  currentFight.start();
  log(`${defA.name} vs ${defB.name} — fight!`);
}

fightBtn.addEventListener('click', startFight);
resetBtn.addEventListener('click', () => {
  if (currentFight) currentFight.running = false;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  p1fill.style.width = '100%';
  p2fill.style.width = '100%';
  logEl.innerHTML = '';
});

populateSelects();
