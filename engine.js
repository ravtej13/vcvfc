// engine.js — the fight-club "referee"
// Wraps Matter.js: spawns two bots, runs the physics loop, applies damage,
// and calls each bot's control() function every tick.

const ARENA_W = 800;
const ARENA_H = 450;
const FLOOR_Y = ARENA_H - 30;
const TICK_MS = 1000 / 60;
const MAX_HP = 100;
const MATCH_TIME_S = 60;

class Fight {
  constructor(botDefA, botDefB, canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.engine = Matter.Engine.create();
    this.engine.gravity.y = 1;
    this.world = this.engine.world;

    this.buildArena();

    this.botA = this.spawnBot(botDefA, 200, 'A');
    this.botB = this.spawnBot(botDefB, 600, 'B');

    this.timeLeft = MATCH_TIME_S;
    this.running = false;
    this.winner = null;
    this.onLog = () => {};
    this.onUpdate = () => {};

    // Track impact damage via collision events
    Matter.Events.on(this.engine, 'collisionStart', (evt) => this.handleCollisions(evt));
  }

  buildArena() {
    const floor = Matter.Bodies.rectangle(ARENA_W / 2, FLOOR_Y + 15, ARENA_W, 30, { isStatic: true, label: 'floor' });
    const leftWall = Matter.Bodies.rectangle(-10, ARENA_H / 2, 20, ARENA_H, { isStatic: true, label: 'wall' });
    const rightWall = Matter.Bodies.rectangle(ARENA_W + 10, ARENA_H / 2, 20, ARENA_H, { isStatic: true, label: 'wall' });
    Matter.World.add(this.world, [floor, leftWall, rightWall]);
  }

  // botDef = { name, create(Matter, x) => {parts:[...], constraints:[...], main: part}, control(ctx) => void }
  spawnBot(botDef, x, side) {
    const built = botDef.create(Matter, x);
    Matter.World.add(this.world, built.parts);
    if (built.constraints) Matter.World.add(this.world, built.constraints);
    built.parts.forEach(p => { p.botSide = side; p.botHP = MAX_HP; });
    return {
      def: botDef,
      side,
      parts: built.parts,
      main: built.main || built.parts[0],
      hp: MAX_HP,
      alive: true,
    };
  }

  handleCollisions(evt) {
    for (const pair of evt.pairs) {
      const { bodyA, bodyB } = pair;
      if (bodyA.botSide && bodyB.botSide && bodyA.botSide !== bodyB.botSide) {
        // relative speed at impact = crude damage proxy
        const relVel = Matter.Vector.sub(bodyA.velocity, bodyB.velocity);
        const speed = Matter.Vector.magnitude(relVel);
        const dmg = Math.min(15, speed * 1.2);
        if (dmg > 0.5) {
          this.applyDamage(bodyA.botSide === 'A' ? this.botB : this.botA, dmg);
        }
      }
    }
  }

  applyDamage(bot, dmg) {
    bot.hp = Math.max(0, bot.hp - dmg);
    if (dmg > 3) this.onLog(`${bot.def.name} takes ${dmg.toFixed(1)} dmg (HP ${bot.hp.toFixed(0)})`);
  }

  start() {
    this.running = true;
    this.loop();
  }

  loop() {
    if (!this.running) return;

    // Let each bot's brain act
    this.tickBot(this.botA, this.botB);
    this.tickBot(this.botB, this.botA);

    Matter.Engine.update(this.engine, TICK_MS);

    // Ring-out check
    [this.botA, this.botB].forEach(bot => {
      const y = bot.main.position.y;
      if (y > ARENA_H + 100) { bot.hp = 0; }
    });

    this.timeLeft -= TICK_MS / 1000;

    this.render();
    this.onUpdate(this.botA, this.botB, this.timeLeft);

    if (this.botA.hp <= 0 || this.botB.hp <= 0 || this.timeLeft <= 0) {
      this.endMatch();
      return;
    }

    requestAnimationFrame(() => this.loop());
  }

  endMatch() {
    this.running = false;
    if (this.botA.hp <= 0 && this.botB.hp <= 0) this.winner = 'Draw';
    else if (this.botA.hp <= 0) this.winner = this.botB.def.name;
    else if (this.botB.hp <= 0) this.winner = this.botA.def.name;
    else this.winner = this.botA.hp >= this.botB.hp ? this.botA.def.name : this.botB.def.name;
    this.onLog(`🏆 Winner: ${this.winner}`);
  }

  tickBot(self, opp) {
    if (!self.def.control) return;
    try {
      self.def.control({
        Matter,
        engine: this.engine,
        self,
        opponent: opp,
        arena: { w: ARENA_W, h: ARENA_H, floorY: FLOOR_Y },
      });
    } catch (e) {
      // A buggy bot shouldn't crash the whole fight
      console.error(`${self.def.name} control() error:`, e);
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, ARENA_W, ARENA_H);

    // floor
    ctx.fillStyle = '#333';
    ctx.fillRect(0, FLOOR_Y, ARENA_W, ARENA_H - FLOOR_Y);

    [this.botA, this.botB].forEach(bot => {
      ctx.fillStyle = bot.side === 'A' ? '#4da6ff' : '#ff5c5c';
      bot.parts.forEach(part => this.drawBody(part));
    });
  }

  drawBody(body) {
    const ctx = this.ctx;
    const vertices = body.vertices;
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) ctx.lineTo(vertices[i].x, vertices[i].y);
    ctx.closePath();
    ctx.fill();
  }
}
