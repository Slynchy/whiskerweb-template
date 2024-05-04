import { AnimatedSprite, Engine, GameObject, Graphics, HelperFunctions, IVector2, LoaderType, Sprite, State, Helpers } from "whiskerweb";
import { AimingReticule } from "./AimingReticule";

const playerBulletOriginOffset: IVector2 = {
  x: -30,
  y: 100
};

export class HelldiversScene extends State {

  public playerPosition: IVector2 = {x: 0, y: 0};
  public bgContainer: GameObject;
  public player: GameObject;
  public playerSprite: AnimatedSprite;
  public playerSpeed: IVector2 = {x: 0, y: 0};
  public playerVelocityDebug: Graphics;
  public bulletPool: Graphics[] = [];
  public bulletTimer: number = 0;
  public aimingReticule: AimingReticule;

  public enemyPool: GameObject[] = [];

  constructor() {
    super();
  }

  private createEnemy(): GameObject {
    const enemy = new GameObject();
    return enemy;
  }

  private getEnemy(): GameObject {
    for (let i = 0; i < this.enemyPool.length; i++) {
      if (!this.enemyPool[i].visible) {
        return this.enemyPool[i];
      }
    }
    const enemy = this.createEnemy();
    this.enemyPool.push(enemy);
    return enemy;
  }

  private getBullet(): Graphics {
    for (let i = 0; i < this.bulletPool.length; i++) {
      if (!this.bulletPool[i].visible) {
        return this.bulletPool[i];
      }
    }
    const bullet = new Graphics();
    bullet
      .lineTo(0, 20)
      .stroke({
        color: 0xffffff,
        width: 2
      });
    this.bgContainer.addChild(bullet);
    this.bulletPool.push(bullet);
    return bullet;
  }

  onResize(_engine: Engine, _params?: unknown): void {
    return;
  }

  preload(_engine: Engine): Promise<void> {
    return _engine.loadAssets(
      [
        {
          key: 'helldivers_bg',
          path: 'bg-texture.png',
          type: LoaderType.PIXI
        },
        {
          key: 'helldivers_player_sprite',
          path: 'topdown_test.png',
          type: LoaderType.PIXI
        },
        ...(new Array(50).fill(0).map((e, i) => {
          const key = `Armature_newAnimation_${i < 10 ? '0' : ''}${i}`;
          return {
            key: key,
            path: `run/${key}.png`,
            type: LoaderType.PIXI
          }
        })),
        ...(new Array(20).fill(0).map((e, i) => {
          const key = `armature_run_${i < 10 ? '0' : ''}${i}`;
          return {
            key: key,
            path: `enemy_run/${key}.png`,
            type: LoaderType.PIXI
          }
        }))
      ]
    );
  }

  onAwake(_engine: Engine, _params?: unknown) {
    console.log("HelldiversScene onAwake");

    _engine.setBackgroundColor(0x0e0e0e);

    this.bgContainer = new GameObject();
    this.scene.addObject(this.bgContainer);
    for (let x = 0; x < 24; x++) {
      for (let y = 0; y < 24; y++) {
        const bg = new Sprite(_engine.getTexture('helldivers_bg'));
        bg.position.set(x * bg.width, y * bg.height);
        this.bgContainer.addChild(bg);
      }
    }
    this.bgContainer.position.set(
      this.bgContainer.width * -0.5 + _engine.getRenderManager().width * 0.5,
      this.bgContainer.height * -0.5 + _engine.getRenderManager().height * 0.5
    );

    this.player = new GameObject();
    this.player.position.set(0, 0);
    this.playerSprite = new AnimatedSprite(
      new Array(50).fill(0).map((e, i) => {
        const key = `Armature_newAnimation_${i < 10 ? '0' : ''}${i}`;
        return _engine.getTexture(key);
      })
    );
    this.playerSprite.animationSpeed = 1;
    this.playerSprite.play();
    this.playerSprite.anchor.set(0.5, 0.5);
    this.playerSprite.scale.set(0.8);
    this.player.position.set(
      _engine.getRenderManager().width * 0.5,
      _engine.getRenderManager().height * 0.5
    );
    this.playerSprite.rotation = 0; // down
    this.player.addChild(this.playerSprite);
    this.scene.addObject(this.player);

    this.playerVelocityDebug = new Graphics();
    this.playerVelocityDebug
      .circle(0, 0, 6)
      .fill({
        color: 0xffffff,
        alpha: 1
      })
      .stroke({
        color: 0xff0000,
        width: 2
      });
    this.scene.addObject(this.playerVelocityDebug);

    const playerBulletOrigin = new Graphics()
      .circle(0, 0, 6)
      .fill({
        color: 0x00ff00,
        alpha: 1
      })
      .stroke({
        color: 0x0000ff,
        width: 2
      });
    playerBulletOrigin.position.set(
      playerBulletOriginOffset.x * this.playerSprite.scale.x, playerBulletOriginOffset.y * this.playerSprite.scale.y
    );
    this.player.addChild(playerBulletOrigin);

    this.playerVelocityDebug
      .circle(0, 0, 6)
      .fill({
        color: 0xffffff,
        alpha: 1
      })
      .stroke({
        color: 0xff0000,
        width: 2
      });
    this.scene.addObject(this.playerVelocityDebug);

    this.aimingReticule = new AimingReticule();
    this.aimingReticule.setCenterRef(this.playerPosition);
    this.aimingReticule.setTargetObject(this.player);
    this.scene.addObject(this.aimingReticule);

    _engine.getTicker().start();
  }

  onStep(_engine: Engine, _params?: unknown) {
    super.onStep(_engine);

    let isSprinting = _engine.getInputManager().isKeyDown("shift");
    let maxSpeed = isSprinting ? 4 : 1;
    let isMoving = false;
    if (_engine.getInputManager().isKeyDown("w")) {
      isMoving = true;
      this.playerSpeed.y =
        Math.max(Math.min(
          HelperFunctions.lerp(this.playerSpeed.y, -maxSpeed, _engine.deltaTime * 0.66),
          maxSpeed,
        ), -maxSpeed);
    }
    if (_engine.getInputManager().isKeyDown("s")) {
      isMoving = true;
      this.playerSpeed.y =
        Math.max(Math.min(
          HelperFunctions.lerp(this.playerSpeed.y, maxSpeed, _engine.deltaTime * 0.66),
          maxSpeed,
        ), -maxSpeed);
    }
    if (_engine.getInputManager().isKeyDown("a")) {
      isMoving = true;
      this.playerSpeed.x =
        Math.max(Math.min(
          HelperFunctions.lerp(this.playerSpeed.x, -maxSpeed, _engine.deltaTime * 0.66),
          maxSpeed,
        ), -maxSpeed);
    }
    if (_engine.getInputManager().isKeyDown("d")) {
      isMoving = true;
      this.playerSpeed.x =
        Math.max(Math.min(
          HelperFunctions.lerp(this.playerSpeed.x, maxSpeed, _engine.deltaTime * 0.66),
          maxSpeed,
        ), -maxSpeed);
    }
    if(isSprinting)
      this.playerSprite.animationSpeed = 3;
    else if(isMoving)
      this.playerSprite.animationSpeed = 1;
    else
      this.playerSprite.animationSpeed = 0;
    this.playerPosition.x += (this.playerSpeed.x = HelperFunctions.lerp(this.playerSpeed.x, 0, _engine.deltaTime * 0.33));
    this.playerPosition.y += (this.playerSpeed.y = HelperFunctions.lerp(this.playerSpeed.y, 0, _engine.deltaTime * 0.33));

    this.playerVelocityDebug.position.set(
      _engine.getRenderManager().width * 0.5 + this.playerSpeed.x * 50,
      _engine.getRenderManager().height * 0.5+ this.playerSpeed.y * 50
    );

    if(_engine.getInputManager().isMouseButtonPressed(2)) {
      // todo: add zooming

      this.player.position.set(
        _engine.getRenderManager().width * 0.5,
        _engine.getRenderManager().height * 0.5
      );
      this.bgContainer.position.set(
        this.bgContainer.width * -0.5 + _engine.getRenderManager().width * 0.5 + (this.playerPosition.x * -1),
        this.bgContainer.height * -0.5 + _engine.getRenderManager().height * 0.5 + (this.playerPosition.y * -1)
      );
    } else {
      this.player.position.set(
        _engine.getRenderManager().width * 0.5,
        _engine.getRenderManager().height * 0.5
      );
      this.bgContainer.position.set(
        this.bgContainer.width * -0.5 + _engine.getRenderManager().width * 0.5 + (this.playerPosition.x * -1),
        this.bgContainer.height * -0.5 + _engine.getRenderManager().height * 0.5 + (this.playerPosition.y * -1)
      );
    }

    if(
      _engine.getInputManager().isMouseButtonPressed(0) &&
      (this.bulletTimer > 4 || this.bulletTimer == 0)
    ) {
      this.bulletTimer = 0.01;
      const bullet = this.getBullet();
      bullet.rotation = Math.atan2(
        this.aimingReticule.getActualAimPosition().y - _engine.getRenderManager().height * 0.5,
        this.aimingReticule.getActualAimPosition().x - _engine.getRenderManager().width * 0.5
      ) - Math.PI * 0.5 + (Math.random() - 0.5) * 0.033;
      const playerOffsetRotated = HelperFunctions.rotateIVec2(
        Helpers.multiplyVector(playerBulletOriginOffset, this.playerSprite.scale.x),
        HelperFunctions.rad2deg(this.player.rotation)
      );
      bullet.position.set(
        this.bgContainer.width * 0.5  + this.playerPosition.x + (playerOffsetRotated.x),
        this.bgContainer.height * 0.5 + this.playerPosition.y + (playerOffsetRotated.y),
      );

      // get distance between the aim point and the shoot point
      const aim = this.aimingReticule.getActualAimPosition();
      const shootPoint = {
        x: this.player.x + (playerOffsetRotated.x),
        y: this.player.y + (playerOffsetRotated.y),
      }

      function calculateTriangleAnglesFromPoints(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): [number, number, number] {
        // Helper function to calculate distance between two points
        const distance = (x1: number, y1: number, x2: number, y2: number): number => {
          return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        };

        // Calculate the lengths of each side of the triangle
        const A = distance(x2, y2, x3, y3); // side opposite the first angle
        const B = distance(x1, y1, x3, y3); // side opposite the second angle
        const C = distance(x1, y1, x2, y2); // side opposite the third angle

        // Helper function to calculate angle in degrees from sides
        const angleFromSides = (a: number, b: number, c: number): number => {
          const cosTheta = (b*b + c*c - a*a) / (2 * b * c);
          const thetaRadians = Math.acos(cosTheta);
          const thetaDegrees = thetaRadians * (180 / Math.PI);
          return thetaDegrees;
        };

        // Calculate each angle using the Law of Cosines
        const alpha = angleFromSides(A, B, C); // angle opposite side A
        const beta = angleFromSides(B, A, C);  // angle opposite side B
        const gamma = angleFromSides(C, A, B); // angle opposite side C

        return [alpha, beta, gamma];
      }
      const angle = calculateTriangleAnglesFromPoints(
        shootPoint.x, shootPoint.y,
        aim.x, aim.y,
        ENGINE.getRenderManager().width * 0.5, ENGINE.getRenderManager().height * 0.5
      )[1];
      bullet.rotation -= HelperFunctions.deg2rad(angle);

      bullet.visible = true;
    } else if(_engine.getInputManager().isMouseButtonPressed(0)) {
      this.bulletTimer += _engine.deltaTime;
      if(this.playerSprite.animationSpeed != 9.8)
        this.playerSprite.animationSpeed = 9.8;
    } else {
      this.bulletTimer = 0;
    }
    this.bulletPool.forEach((e) => {
      if(e.visible) {
        // translate forward
        e.position.x += Math.cos(e.rotation + Math.PI * 0.5) * 22;
        e.position.y += Math.sin(e.rotation + Math.PI * 0.5) * 22;
        // check if out of bounds
        if(
          e.position.x < 50 ||
          e.position.x > this.bgContainer.width - 50 ||
          e.position.y < 50 ||
          e.position.y > this.bgContainer.height - 50
        ) {
          e.visible = false;
          e.position.set(0, 0);
        }
      } else {
        e.position.set(0, 0);
      }
    })
  }
}