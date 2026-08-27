# 🥊 Vibe Fight Club

A free, browser-based arena where you code up a robot (humanoid or not) and
watch it fight your friends' robots. Runs entirely client-side with
[Matter.js](https://brm.io/matter-js/) physics — no server, no cost.

## Quick start

1. Clone this repo.
2. Open `index.html` in a browser (or run any static server, e.g.
   `npx serve .`).
3. Pick two bots from the dropdowns, hit **Fight!**

## How to submit your own bot

1. Copy `bots/example-brawler.js` (humanoid) or `bots/example-spinner.js`
   (non-humanoid) as a starting point.
2. Create `bots/yourname.js`. Your file must call:

   ```js
   BOT_REGISTRY.push({
     name: 'YourBotName',

     // Build your robot's physical body out of Matter.js shapes + constraints.
     // x = your starting x position in the arena (given to you).
     create(Matter, x) {
       const body = Matter.Bodies.rectangle(x, 300, 40, 80, { density: 0.01 });
       return {
         parts: [body],       // all physics bodies that make up your bot
         constraints: [],     // joints connecting your parts (if any)
         main: body,          // the "core" body used for HP/ring-out tracking
       };
     },

     // Called ~60x per second. This is your bot's "brain."
     // Apply forces/torques to your own parts based on where the opponent is.
     control({ Matter, self, opponent, arena }) {
       const dx = opponent.main.position.x - self.main.position.x;
       Matter.Body.applyForce(self.main, self.main.position, {
         x: 0.0005 * Math.sign(dx),
         y: 0,
       });
     },
   });
   ```

3. Add your bot's script tag to `index.html`, right after the other
   `bots/*.js` tags (order matters — `bots/index.js` must load first):

   ```html
   <script src="bots/yourname.js"></script>
   ```

4. Push a PR (or just push to a shared branch if it's just your group).
   Anyone who pulls the repo can now fight your bot.

## Rules of the arena

- **HP**: every bot starts at 100 HP. Damage is dealt automatically based on
  impact speed when your parts collide with the opponent's parts — you don't
  need to write hit detection yourself.
- **Ring-out**: if your bot's `main` body falls below the arena, it's
  instant 0 HP.
- **Time limit**: 60 seconds. If neither bot is knocked out, whoever has more
  HP wins.
- **No humanoid requirement**: build a wheel, a spinner, a blob, a multi-limb
  thing — anything Matter.js can express as bodies + constraints.
- **Keep `control()` cheap**: it runs every physics tick (60/sec). Avoid
  heavy loops or allocations inside it.

## Deploying so friends can watch without cloning

Push this repo to GitHub, then connect it to **Vercel**, **Netlify**, or
**GitHub Pages** (all free) for instant static hosting — any push to `main`
auto-redeploys. Share the URL in your group chat; everyone always sees the
latest bot roster.

For live shared spectating (same match, multiple viewers, in real time),
screen-sharing the page in a Discord call works great with zero extra
infrastructure. If you outgrow that, a small free-tier WebSocket relay
(Render/Fly.io) can broadcast fight state to all viewers — ask if you want
that added later.

## Ideas for later
- Weight classes / bot size limits so no one just builds a giant box
- A tournament bracket script that runs every bot vs every bot and tallies
  wins
- Replay recording via the canvas `MediaRecorder` API, auto-uploaded as a
  GIF/MP4 for the group chat
- A "sensor" API (raycasts) so bots can react to more than just opponent
  position
