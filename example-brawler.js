// A simple humanoid: torso + one punching arm on a motor-ish constraint.
// control() is called ~60x/sec and should apply forces/torques based on
// self position vs opponent position. Keep it cheap — no heavy compute per tick.

BOT_REGISTRY.push({
  name: 'Brawler',

  create(Matter, x) {
    const torso = Matter.Bodies.rectangle(x, 300, 40, 80, { label: 'torso', density: 0.01 });
    const arm = Matter.Bodies.rectangle(x + 35, 300, 50, 14, { label: 'arm', density: 0.005 });

    const shoulder = Matter.Constraint.create({
      bodyA: torso, pointA: { x: 15, y: -20 },
      bodyB: arm, pointB: { x: -20, y: 0 },
      stiffness: 0.6, length: 5,
    });

    return {
      parts: [torso, arm],
      constraints: [shoulder],
      main: torso,
    };
  },

  control({ Matter, self, opponent }) {
    const torso = self.parts[0];
    const arm = self.parts[1];
    const oppX = opponent.main.position.x;
    const dx = oppX - torso.position.x;
    const dist = Math.abs(dx);

    // Walk toward opponent
    const walkForce = 0.0006 * Math.sign(dx);
    Matter.Body.applyForce(torso, torso.position, { x: walkForce, y: 0 });

    // When close, throw a punch: spin the arm toward the opponent
    if (dist < 90) {
      Matter.Body.applyForce(arm, arm.position, { x: 0.002 * Math.sign(dx), y: -0.0006 });
    }

    // Keep it from tipping over forever — small upright correction
    Matter.Body.setAngularVelocity(torso, torso.angularVelocity * 0.9);
  },
});
