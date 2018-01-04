console.clear();

var liquidSize = 5.5;
var liquidOpacity = 0.6;
var liquidColor = 0xf9b52c;

var glassImageSrc = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/557388/glass.png';

// This Stage class is where I do all my Pixi.js (canvas) stuff.
var Stage = (function() {
  // We pass in the HTMLElement
  function Stage(canvas) {
    // Create a new Pixi.js application, and add the canvas to our HTMLElement container
    this.containers = [];
    this.particles = [];
    this.textures = [];

    // We center everything when the window resizes
    this.onResize = function() {
      this.app.renderer.resize(this.element.offsetWidth, this.element.offsetHeight);
      this.stage.position.x = window.innerWidth / 2;
      this.stage.position.y = window.innerHeight / 2;
    };

    this.newParticle = function(color) {
      // this function makes 1 particle, adds it to the
      // ParticleContainer and returns it.
      // This function is called from outside the class.
      var texture = this.textures[0];
      var container = this.containers[0];
      // make a new particle sprite from the texture and
      // add it to the correct ParticleContainer
      var sprite = new PIXI.Sprite(texture);
      this.particles.push(sprite);
      this.add(sprite);
      // return the particle so the main app can update
      // it's position later.
      return sprite;
    };

    this.add = function(element) {
      this.containers[0].addChild(element);
    };

    this.element = canvas;

    this.app = new PIXI.Application(this.element.offsetWidth, this.element.offsetHeight, {
      backgroundColor: 0xd3cfe5
    });

    this.element.appendChild(this.app.view);
    // The stage container is where we put everything you see.
    // It's usefull to have a root container, that way we can
    // move, rotate, etc everything in one go.
    this.stage = new PIXI.Container();
    this.app.stage.addChild(this.stage);
    // We're also going to have another container to hold all
    // the particles and glass assets. Then juiceContainer gets
    // added to the stage container.
    this.juiceContainer = new PIXI.Container();

    this.stage.addChild(this.juiceContainer);

    var glassTexture = PIXI.Texture.fromImage(glassImageSrc);

    var glass = new PIXI.Sprite(glassTexture);
    glass.scale.set(0.5, 0.49);
    glass.position.x = -106;
    glass.position.y = -100;

    this.juiceContainer.addChild(glass);

    var container = new PIXI.particles.ParticleContainer(9999);
    this.containers.push(container);
    this.juiceContainer.addChild(container);
    // We also need to draw the particle texture as well.
    // This will be used later when we create the new
    // particle sprites.
    var graphic = new PIXI.Graphics();
    graphic.beginFill(liquidColor, liquidOpacity);
    graphic.drawCircle(0, 0, liquidSize);
    graphic.endFill();

    var texture = this.app.renderer.generateTexture(graphic);
    this.textures.push(texture);

    this.onResize();
  }
  return Stage;
})();

//
//
//
//
//
//
//
//
// This Sim class is where most of the LiquidFun (Box2D) stuff is done.
var Sim = (function() {
  function Sim(world) {
    var _this = this;
    // this.width = 1000;
    // this.height = 1000;

    // these are setting for the simulation
    this.timeStep = 1 / 60;
    // this.velocityIterations = 8;
    // this.positionIterations = 3;
    // this.cooldown = 100;
    // this.cooling = false;

    // these consts define how things are positioned
    // outside the sim. METER is used to scale up
    // the simulations positions to standard pixels.
    // So for example when the Sim says a particle is
    // at 0.33 the output for Pixi.js will be 33px
    this.METER = 68;
    this.OFFSET_X = -3;
    this.OFFSET_Y = 0;
    this.PADDING = 54;

    this.onResize = function() {
      // var h = window.innerHeight;
      this.width = 200;
      this.height = 246;
      // this.height -= this.PADDING;
    };

    // this.onMotion = function(x, y) {
    //   if (x && y) {
    //     var gravity_1 = new b2Vec2(-y / 5, x / 1.9);
    //     this.world.SetGravity(gravity_1);
    //   }
    // };

    this.step = function() {
      this.world.Step(this.timeStep, this.velocityIterations, this.positionIterations);
      this.time += 1 / 60;
    };

    this.addParticles = function() {
      var _this = this;

      if (!this.cooling) {
        this.cooling = true;
        this.particle.position.Set(this.width / 2 / this.METER, this.height / 1.8 / this.METER);
        this.particle.radius = 1.4;
        var particleGroupDef = new b2ParticleGroupDef();
        particleGroupDef.shape = this.particle;
        this.particleSystem.CreateParticleGroup(particleGroupDef);

        setTimeout(function() {
          _this.cooling = false;
        }, this.cooldown);
      }
    };

    this.world = world;

    var liquidContainerDef = new b2BodyDef();

    var liquidContainer = this.world.CreateBody(liquidContainerDef);

    this.onResize();
    var floor = this.createWallShape(
      this.width / this.METER / 2,
      0.05,
      new b2Vec2(this.width / this.METER / 2, this.height / this.METER + 0.05)
    );

    var leftWall = this.createWallShape(
      0.05,
      this.height / this.METER / 2,
      new b2Vec2(-0.05, this.height / this.METER / 2)
    );

    var rightWall = this.createWallShape(
      0.05,
      this.height / this.METER / 2,
      new b2Vec2(this.width / this.METER + 0.05, this.height / this.METER / 2)
    );

    // if (window.DeviceOrientationEvent) {
    //   window.addEventListener(
    //     'deviceorientation',
    //     function(e) {
    //       _this.onMotion(e.beta, e.gamma);
    //     },
    //     true
    //   );
    // } else if (window.DeviceMotionEvent) {
    //   window.addEventListener(
    //     'devicemotion',
    //     function(e) {
    //       _this.onMotion(e.accelerationIncludingGravity.X * 2, e.accelerationIncludingGravity.Y * 2);
    //     },
    //     true
    //   );
    // }

    liquidContainer.CreateFixtureFromDef(floor);
    liquidContainer.CreateFixtureFromDef(leftWall);
    liquidContainer.CreateFixtureFromDef(rightWall);

    var particleSystemDef = new b2ParticleSystemDef();
    particleSystemDef.radius = 0.03;
    particleSystemDef.dampingStrength = 0.2;

    this.particleSystem = this.world.CreateParticleSystem(particleSystemDef);
    this.particle = new b2CircleShape();
  }

  Sim.prototype.createWallShape = function(width, height, angle) {
    var wallShape = new b2PolygonShape();
    wallShape.SetAsBoxXYCenterAngle(width, height, angle, 0);
    var fixtureDef = new b2FixtureDef();
    fixtureDef.shape = wallShape;
    // fixtureDef.density = 5;
    return fixtureDef;
  };

  Sim.prototype.getParticles = function() {
    return this.world.particleSystems[0].GetPositionBuffer();
  };

  return Sim;
})();

var stage = new Stage(document.getElementById('canvas'));
var gravity = new b2Vec2(0, 30);
var world = new b2World(gravity);
var sim = new Sim(world);

function tick() {
  sim.step();
  var particles = sim.getParticles();

  for (var i = 0; i < particles.length / 2; i++) {
    var p = !stage.particles[i] ? stage.newParticle() : stage.particles[i];
    var x = sim.width / 2 - particles[i * 2] * sim.METER + sim.OFFSET_X;
    var y = sim.height - 100 - (sim.height - particles[i * 2 + 1] * sim.METER + sim.OFFSET_Y);
    p.position.set(x, y);
  }

  requestAnimationFrame(tick);
}

sim.addParticles();

tick();
