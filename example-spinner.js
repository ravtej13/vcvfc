// A non-humanoid "beyblade" style bot: a body with a heavy spinning blade.
// Shows that bots don't need to be humanoid at all.

BOT_REGISTRY.push({
  name: 'Spinner',

  create(Matter, x) {
    const core = Matter.Bodies.circle(x, 300, 22, { label: 'core', density: 0.02 });
    const blade = Matter.Bodies.rectangle(x, 300, 70, 8, { label: 'blade', density: 0.01, friction: 0.02 });

    const pivot = Matter.Constraint.create({
      bodyA: core, pointA: { x: 0, y: 0 },
      bodyB: blade, pointB: { x: 0, y: 0 },
      stiffness: 1, length: 0,
    });

    return {
      parts: [core, blade],
      constraints: [pivot],
      main: core,
    };
  },

  control({ Matter, self, opponent }) {
    const core = self.parts[0];
    const blade = self.parts[1];
    const dx = opponent.main.position.x - core.position.x;

    // Chase the opponent
    Matter.Body.applyForce(core, core.position, { x: 0.0005 * Math.sign(dx), y: 0 });

    // Keep the blade spinning fast
    Matter.Body.setAngularVelocity(blade, 0.9);
  },
});
