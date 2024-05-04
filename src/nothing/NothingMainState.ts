import {
  AnimatedSprite,
  buttonify,
  Container,
  Easing,
  Engine,
  Filters,
  GameObject,
  Graphics,
  HelperFunctions,
  Helpers,
  IVector2,
  LoaderType,
  Sprite,
  SpriteComponent,
  Spritesheet,
  State,
  Text,
  TextStyle,
  Texture,
} from "whiskerweb";
import OSUJSON from "./osu-json";
import { OsuCommon, OsuFile, OsuHitObject } from "./OsuCommon";
import AudioLoader from "audio-loader";
import { AudioSingleton } from "whiskerweb/dist/engine/AudioSingleton";

// import {
//   AUDIO_TYPES,
//   AudioSingleton,
// } from "whiskerweb/dist/engine/AudioSingleton";

export class NothingMainState extends State {
  private _notePoolGreen: Array<Sprite> = [];
  private _notePoolWhite: Array<Sprite> = [];
  private _fireworkTrailPool: Array<Graphics> = [];
  private _fireworkEffectPool: Array<AnimatedSprite> = [];
  private vignette: Sprite;
  private greenLight: Sprite;

  private _targetGreenlightScale: IVector2 = {
    x: 0.5,
    y: 0.133,
  };
  private _targetGreenlightBrightness: number = 0.0;

  private _spawnCount = 1;
  private _fireworksMode: "more" | "restricted" | "none" = "none";
  private _cameraSwayValue = 1;
  private _brightnessSpeed = 1;
  private _fireworkTimeThreshold = 300;
  private _backgroundTargetBrightness = 1;
  private _starBrightnessFlickerSpeed = 40;
  private _starBrightnessFlickerVariance = 0.1;
  private _targetStarBrightness = 0;
  private _brightnessVariance = 0.02;
  private _timingPointFunctions: Array<() => void> = [
    () => {
      const dimensions = {
        x: 1920,
        y: 1080,
      };

      console.log("Timing point 1");
      const whiteGraphics = new Graphics()
        .rect(0, 0, dimensions.x, dimensions.y)
        .fill({
          color: 0xfefefe,
        });
      whiteGraphics.position.copyFrom(this.backgroundContainer.position);
      this.sceneContainer.addChild(whiteGraphics);

      const duration = 1500;

      const cachedScale = this.scene.getStage().scale.clone();
      this.scene.getStage().scale.set(3.5);
      // this.sceneContainer.pivot.x =
      //   dimensions.x * (1 / this.sceneContainer.scale.x) * 0.5;
      // this.sceneContainer.pivot.y =
      //   dimensions.y * (1 / this.sceneContainer.scale.y) * 0.5;
      // this.sceneContainer.position.set(
      //   -((dimensions.x * this.sceneContainer.scale.x - dimensions.x) * 0.5),
      //   -((dimensions.y * this.sceneContainer.scale.y - dimensions.y) * 0.5),
      // );

      // this.sceneContainer.rotation = Math.PI / 15;
      // HelperFunctions.TWEENAsPromise(
      //   this.sceneContainer,
      //   "rotation",
      //   0,
      //   Easing.Circular.Out,
      //   duration,
      // );
      HelperFunctions.TWEENVec2AsPromise(
        this.scene.getStage().scale,
        cachedScale,
        Easing.Sinusoidal.Out,
        duration * 2.33,
        (obj, elapsed) => {
          this.scene
            .getStage()
            .position.set(
              -(
                (dimensions.x * this.scene.getStage().scale.x - dimensions.x) *
                0.5
              ),
              -(
                (dimensions.y * this.scene.getStage().scale.y - dimensions.y) *
                0.5
              ),
            );
          // this.sceneContainer.position.set(0, 0);
          return true;
        },
      );

      HelperFunctions.TWEENAsPromise(
        whiteGraphics,
        "alpha",
        0,
        Easing.Linear.None,
        duration,
      ).promise.then(() => {
        whiteGraphics.removeFromParent();
        whiteGraphics.destroy();
      });

      this._fireworksMode = "restricted";
    },
    () => {
      console.log("Timing point 2");
      HelperFunctions.TWEENAsPromise(
        this,
        "_targetGreenlightBrightness",
        0.9,
        Easing.Linear.None,
        2000,
      );
      // start showing stars in the sky
      HelperFunctions.TWEENAsPromise(
        this.starsBackground,
        "alpha",
        0.1,
        Easing.Linear.None,
        7000,
      );
      HelperFunctions.TWEENAsPromise(
        this,
        "_targetStarBrightness",
        8,
        Easing.Linear.None,
        12000,
      );
    },
    () => {
      this._fireworksMode = "none";
      console.log("Timing point 3");
      // starting to ramp up
      HelperFunctions.TWEENAsPromise(
        this,
        "_cameraSwayValue",
        2,
        Easing.Linear.None,
        4000,
      );
    },
    () => {
      console.log("Timing point 3.9");
      // intense mode about to start in 300ms
      const whiteGraphics = new Graphics().rect(0, 0, 1920, 1080).fill({
        color: 0xfefefe,
      });
      whiteGraphics.position.copyFrom(this.backgroundContainer.position);
      this.sceneContainer.addChild(whiteGraphics);
      whiteGraphics.alpha = 0;
      HelperFunctions.TWEENAsPromise(
        whiteGraphics,
        "alpha",
        1,
        Easing.Linear.None,
        200,
      )
        .promise.then(() => {
          this.starsBackground.filters[0].bloomScale = 2;
          this._targetStarBrightness *= 2;
          this._backgroundTargetBrightness = 2;
          this._targetGreenlightScale.x = 0.8;
          this._targetGreenlightScale.y = 0.8;
          this.greenLight.filters[0].threshold = 1;
          this.cityForeground_green.visible = true;
          this.greenLight.visible = true;
          return HelperFunctions.TWEENAsPromise(
            whiteGraphics,
            "alpha",
            0,
            Easing.Linear.None,
            600,
          ).promise;
        })
        .then(() => {
          whiteGraphics.removeFromParent();
          whiteGraphics.destroy();
        });
    },
    () => {
      console.log("Timing point 4");
      this._spawnCount = 1;
      // intense mode start
      HelperFunctions.TWEENAsPromise(
        this,
        "_backgroundTargetBrightness",
        1.5,
        Easing.Linear.None,
        8000,
      );
      // this._targetStarBrightness = 10;
      this._starBrightnessFlickerVariance = 4;
      this._starBrightnessFlickerSpeed = 1.8;
      HelperFunctions.TWEENAsPromise(
        this,
        "_cameraSwayValue",
        4,
        Easing.Linear.None,
        2000,
      );
    },
    () => {
      console.log("Timing point 5");
      // still fast paced, more intense
    },
    () => {
      // cooldown here
      console.log("Timing point 6");
      this._spawnCount = 1;
      HelperFunctions.TWEENAsPromise(
        this,
        "_backgroundTargetBrightness",
        1,
        Easing.Linear.None,
        5000,
      );
      HelperFunctions.TWEENAsPromise(
        this,
        "_cameraSwayValue",
        1,
        Easing.Linear.None,
        2000,
      );
      HelperFunctions.TWEENAsPromise(
        this,
        "_starBrightnessFlickerSpeed",
        40,
        Easing.Linear.None,
        4000,
      );
      HelperFunctions.TWEENAsPromise(
        this,
        "_starBrightnessFlickerVariance",
        0.1,
        Easing.Linear.None,
        4000,
      );
      HelperFunctions.TWEENAsPromise(
        this,
        "_targetStarBrightness",
        4,
        Easing.Linear.None,
        4000,
      );
      HelperFunctions.TWEENAsPromise(
        this.starsBackground.filters[0],
        "bloomScale",
        1,
        Easing.Linear.None,
        5000,
      );
    },
    () => {
      console.log("Timing point 7");
      // starting to pick up again
    },
    () => {
      console.log("Timing point 8");
    },
    () => {
      console.log("Timing point 8.9");
      // intense time coming up
    },
    () => {
      console.log("Timing point 8");
      // drums starting
      const whiteGraphics = new Graphics().rect(0, 0, 1920, 1080).fill({
        color: 0xfefefe,
      });
      whiteGraphics.position.copyFrom(this.backgroundContainer.position);
      this.sceneContainer.addChild(whiteGraphics);
      whiteGraphics.alpha = 0;
      HelperFunctions.TWEENAsPromise(
        whiteGraphics,
        "alpha",
        1,
        Easing.Linear.None,
        200,
      )
        .promise.then(() => {
          this._backgroundTargetBrightness = 2;
          this.starsBackground.filters[0].bloomScale = 2;
          HelperFunctions.TWEENAsPromise(
            this,
            "_backgroundTargetBrightness",
            1.5,
            Easing.Linear.None,
            8000,
          );
          this._targetStarBrightness = 10;
          this._starBrightnessFlickerVariance = 4;
          this._starBrightnessFlickerSpeed = 1.8;
          this._fireworksMode = "more";
          HelperFunctions.TWEENAsPromise(
            this,
            "_cameraSwayValue",
            4,
            Easing.Linear.None,
            2000,
          );
          return HelperFunctions.TWEENAsPromise(
            whiteGraphics,
            "alpha",
            0,
            Easing.Linear.None,
            600,
          ).promise;
        })
        .then(() => {
          whiteGraphics.removeFromParent();
          whiteGraphics.destroy();
        });
    },
    () => {
      console.log("Timing point 8.9");
      // intense time coming up
    },
    () => {
      console.log("Timing point 9");
      // intense
    },
    () => {
      console.log("Timing point 10");
      this._fireworksMode = "none";
      HelperFunctions.TWEENAsPromise(
        this.starsBackground.filters[0],
        "bloomScale",
        1,
        Easing.Linear.None,
        5000,
      );
      // cooldown
      HelperFunctions.TWEENAsPromise(
        this,
        "_backgroundTargetBrightness",
        1,
        Easing.Linear.None,
        5000,
      );
      HelperFunctions.TWEENAsPromise(
        this,
        "_cameraSwayValue",
        1,
        Easing.Linear.None,
        2000,
      );
      HelperFunctions.TWEENAsPromise(
        this,
        "_starBrightnessFlickerSpeed",
        40,
        Easing.Linear.None,
        4000,
      );
      HelperFunctions.TWEENAsPromise(
        this,
        "_starBrightnessFlickerVariance",
        0.1,
        Easing.Linear.None,
        4000,
      );
      HelperFunctions.TWEENAsPromise(
        this,
        "_targetStarBrightness",
        1,
        Easing.Linear.None,
        4000,
      );
      HelperFunctions.TWEENAsPromise(
        this.starsBackground,
        "alpha",
        0,
        Easing.Linear.None,
        12000,
      );
    },
    () => {
      console.log("Timing point 11, end");
      // end
      const blackGraphics = new Graphics().rect(0, 0, 1920, 1080).fill({
        color: 0x070707,
      });
      blackGraphics.position.copyFrom(this.backgroundContainer.position);
      this.sceneContainer.addChild(blackGraphics);
      blackGraphics.alpha = 0;
      HelperFunctions.TWEENAsPromise(
        blackGraphics,
        "alpha",
        1,
        Easing.Linear.None,
        3000,
      )
        .promise.then(() => HelperFunctions.wait(2000))
        .then(() => {
          const text = new Text({
            text: '"Nothing"\nby\nPikasonic',
            style: new TextStyle({
              fill: 0xfefefe,
              fontSize: 80,
              fontFamily: "Times New Roman",
              align: "center",
            }),
          });
          text.anchor.set(0.5, 0.5);
          text.position.set(1920 * 0.5, 1080 * 0.5);
          text.alpha = 0;
          this.sceneContainer.addChild(text);
          HelperFunctions.TWEENAsPromise(
            text,
            "alpha",
            1,
            Easing.Linear.None,
            1000,
          ).promise.then(() => {
            HelperFunctions.wait(3000).then(() => {
              console.log("kill");
              ENGINE.getTicker().stop();
            });
          });
        });
    },
  ];

  public activeTrack: OsuFile;
  public sceneContainer: Container;
  public meteorContainer: Container;
  public backgroundContainer: GameObject;
  public foregroundContainer: GameObject;

  public skyBackground: GameObject;
  public skyBackgroundComponent: SpriteComponent;
  public starsBackground: GameObject;
  public starsBackgroundComponent: SpriteComponent;
  public cityForeground: GameObject;
  public cityForegroundComponent: SpriteComponent;
  public cityForeground_green: GameObject;
  public cityForegroundComponent_green: SpriteComponent;
  public footer: GameObject;
  public footerComponent: SpriteComponent;
  public leftChar: GameObject;
  public leftCharComponent: SpriteComponent;
  public rightChar: GameObject;
  public rightCharComponent: SpriteComponent;

  public onAwake(_engine: Engine, _params?: unknown): void {
    _engine.setBackgroundColor(0x070707);

    this.sceneContainer = new Container();
    console.log(this.scene);
    this.scene.addObject(this.sceneContainer);

    const temp = this.activeTrack.HitObjects;
    const cache = {};
    temp.forEach((e) => {
      if (e.type.isOsuMania == true) {
        const travelTime = e["endTime"] - e.time;
        if (!cache[travelTime]) {
          cache[travelTime] = 1;
        } else {
          cache[travelTime]++;
        }
      }
    });
    console.log(cache);

    const advBloomFilter = new Filters.AdvancedBloomFilter({
      threshold: 0.23,
      brightness: 1.3,
      bloomScale: 1,
      pixelSize: { x: 1, y: 1 },
    });

    this.backgroundContainer = new GameObject();
    // this.backgroundContainer.filters = [advBloomFilter];
    this.sceneContainer.addChild(this.backgroundContainer);

    this.foregroundContainer = new GameObject();
    this.sceneContainer.addChild(this.foregroundContainer);

    this.skyBackground = new GameObject();
    this.skyBackgroundComponent = new SpriteComponent("skyBackground");
    this.skyBackground.addComponent(this.skyBackgroundComponent);
    this.skyBackgroundComponent.anchor.set(0);
    this.backgroundContainer.addChild(this.skyBackground);

    // const greenLightContainer = new Container();
    this.greenLight = new Sprite(
      ENGINE.getPIXIResource("greenlight") as Texture,
    );
    // this.greenLight.scale.set(0.33);
    this.greenLight.filters = [
      new Filters.AdvancedBloomFilter({
        threshold: 0.85,
        brightness: 1,
        blur: 1,
        bloomScale: 1,
        pixelSize: { x: 1.0, y: 1.0 },
      }),
    ];
    this.greenLight.visible = true;
    this.greenLight.anchor.set(0.5, 1);
    this.greenLight.position.set(1920 * 0.5, 1080 * 0.5 + 95);
    this.greenLight.alpha = 1;
    let counter = 0;
    setInterval(() => {
      counter += 0.0033;
      // this.greenLight.filters[0].threshold = 1;
      // this.greenLight.scale.set(1, 1 + Math.sin(counter) * 0.003);
      this.greenLight.scale.set(
        this._targetGreenlightScale.x,
        this._targetGreenlightScale.y + Math.sin(counter) * 0.003,
      );
      this.greenLight.alpha =
        this._targetGreenlightBrightness + Math.sin(counter) * 0.1;
      this.greenLight.filters[0].brightness =
        this._targetGreenlightBrightness + Math.sin(counter) * 0.1;
      this.cityForeground_green.alpha = this.greenLight.alpha;
    });
    this.skyBackground.addChild(this.greenLight);

    this.starsBackground = new GameObject();
    this.starsBackgroundComponent = new SpriteComponent("stars");
    this.starsBackground.addComponent(this.starsBackgroundComponent);
    this.starsBackgroundComponent.anchor.set(0.5);
    HelperFunctions.smartScale2D(
      {
        x: _engine.getRenderManager().width,
        y: undefined,
      },
      this.starsBackgroundComponent.getSpriteObj(),
    );
    this.starsBackground.filters = [
      new Filters.AdvancedBloomFilter({
        threshold: 1,
        brightness: this._targetStarBrightness,
        blur: 5,
        bloomScale: 4,
        pixelSize: { x: 1.2, y: 1.2 },
      }),
    ];
    // 'inherit' | 'normal' | 'add' | 'multiply' | 'screen' | 'darken' | 'lighten' |
    // 'erase' | 'color-dodge' | 'color-burn' | 'linear-burn' | 'linear-dodge' | 'linear-light' |
    // 'hard-light' | 'soft-light' | 'pin-light' | 'difference' | 'exclusion' |
    // 'overlay' | 'saturation' | 'color' | 'luminosity' | 'normal-npm' | 'add-npm' |
    // 'screen-npm' | 'none' | 'subtract' | 'divide' | 'vivid-light' | 'hard-mix' | 'negation'
    this.starsBackgroundComponent.blendMode = "add";
    this.starsBackground.alpha = 0.0;
    this.backgroundContainer.addChild(this.starsBackground);

    this.cityForeground = new GameObject();
    this.cityForegroundComponent = new SpriteComponent("cityForeground");
    this.cityForeground.addComponent(this.cityForegroundComponent);
    this.cityForegroundComponent.anchor.set(0);
    this.cityForeground.filters = [advBloomFilter];
    this.backgroundContainer.addChild(this.cityForeground);

    this.cityForeground_green = new GameObject();
    this.cityForegroundComponent_green = new SpriteComponent("foreground_g");
    this.cityForeground_green.addComponent(this.cityForegroundComponent_green);
    // this.cityForeground_green.alpha = 1;
    this.cityForeground_green.visible = false;
    this.cityForegroundComponent_green.anchor.set(0);
    this.cityForeground_green.filters = [advBloomFilter];
    this.backgroundContainer.addChild(this.cityForeground_green);

    this.meteorContainer = new Container();
    this.meteorContainer.filters = [
      new Filters.AdvancedBloomFilter({
        threshold: 0.4,
        bloomScale: 4,
        blur: 5,
        brightness: 1,
        pixelSize: { x: 1, y: 1 },
      }),
      // new Filters.MotionBlurFilter({
      //   kernelSize: 5,
      //   velocity: [0, 1],
      //   offset: 0,
      // }),
    ];
    this.backgroundContainer.addChild(this.meteorContainer);

    this.footer = new GameObject();
    this.footerComponent = new SpriteComponent("footer");
    this.footer.addComponent(this.footerComponent);
    this.footerComponent.anchor.set(0);
    this.foregroundContainer.addChild(this.footer);

    this.leftChar = new GameObject();
    this.leftCharComponent = new SpriteComponent("left");
    this.leftChar.addComponent(this.leftCharComponent);
    this.leftCharComponent.anchor.set(0);
    this.foregroundContainer.addChild(this.leftChar);

    this.rightChar = new GameObject();
    this.rightCharComponent = new SpriteComponent("right");
    this.rightChar.addComponent(this.rightCharComponent);
    this.rightCharComponent.anchor.set(0);
    this.foregroundContainer.addChild(this.rightChar);

    this.vignette = new Sprite(ENGINE.getPIXIResource("vignette") as Texture);
    this.vignette.anchor.set(0.5, 1);
    this.vignette.position.set(
      ENGINE.getRenderManager().width * 0.5,
      ENGINE.getRenderManager().height,
    );
    this.vignette.alpha = 0.4;
    this.sceneContainer.addChild(this.vignette);

    this.onResize(_engine);

    AudioLoader("./assets/audio/audio.mp3").then((obj: AudioBuffer) => {
      console.log("Audio loaded %o", obj);
      const start = new Text({
        style: { fill: 0xfefefe },
      });
      start.text = "Start";
      buttonify(start, {
        onFire: () => {
          start.removeFromParent();
          start.destroy();
          OsuCommon.initializeAudioCTX(obj);
          OsuCommon.setTimingPointData(this.activeTrack.TimingPoints[0]);
          if (this._timingPointFunctions[0]) {
            this._timingPointFunctions[0]();
          }
          if (
            this._timingPointFunctions.length !==
            this.activeTrack["TimingPoints"].length
          ) {
            console.warn(
              "Timing point functions length mismatch %i vs %i",
              this._timingPointFunctions.length,
              this.activeTrack["TimingPoints"].length,
            );
          }
          OsuCommon.createScheduler();
          const startTime = 0;
          this.scheduleHitObjectSpawns(startTime).then(() => {
            console.log("Hitobjects scheduled");
            return this.scheduleTimingPoints(startTime).then(() => {
              console.log("Tpoints scheduled");
              return this.scheduleSampleEvents(startTime).then(() => {
                console.log("Samples scheduled");
                OsuCommon.playTrack(1, startTime);
              });
            });
          });
        },
      });
      start.position.set(
        ENGINE.getRenderManager().width * 0.5,
        ENGINE.getRenderManager().height * 0.5,
      );
      this.sceneContainer.addChild(start);
    });

    // _engine.setMaxFPS(60);
    _engine.getTicker().start();
    // setTimeout(() => {
    //   _engine.getTicker().stop();
    // }, 16);
  }

  async scheduleTimingPoints(startTime?: number) {
    for (let i = 1; i < this.activeTrack["TimingPoints"].length; i++) {
      let current = this.activeTrack["TimingPoints"][i];
      const _i = i;
      let data = Object.assign({}, current);
      // data.context = context;

      OsuCommon._trackClock.insert(
        current.offset * 0.001 - (startTime || 0),
        (e) => {
          if (this._timingPointFunctions[_i]) {
            this._timingPointFunctions[_i]();
          }
          this._setTimingPointData(e);
        },
        data,
      );
    }
  }

  async scheduleSampleEvents(startTime) {
    // not used yet
  }

  _setTimingPointData(data) {
    OsuCommon.setTimingPointData(data.args);
  }

  async scheduleHitObjectSpawns(startTime?: number) {
    OsuCommon._fadein = OsuCommon.calculateFadein(
      this.activeTrack["Difficulty"],
    );
    OsuCommon._preempt = OsuCommon.calculatePreempt(
      this.activeTrack["Difficulty"],
    );
    for (let k = 0; k < this.activeTrack.HitObjects.length; k++) {
      let current = this.activeTrack.HitObjects[k];

      let timestamp = current.time * 0.001 - (startTime || 0);
      if (timestamp < 0) continue;
      OsuCommon._trackClock.insert(timestamp, () => {
        let diff = Math.abs(timestamp - OsuCommon.__AUDIOCTX.currentTime);
        if (diff >= 33) {
          console.warn("Out of timing by %ims", diff * 1000);
        }
        if (diff >= 333) {
          console.warn(
            "Not spawning object because timing exceeds hard threshold",
          );
          return;
        }

        // hack for big firework explosion
        // current["endTime"] -= startTime || 0;
        if (current.time == 154920) {
          current.time = Math.floor(timestamp * 1000);
          for (let i = 0; i < 20; i++) {
            this.spawnFirework(current, i, 20);
          }
        } else {
          current.time = Math.floor(timestamp * 1000);
          for (let i = 0; i < this._spawnCount; i++) {
            if (
              this._fireworksMode == "restricted" ||
              current.type.type == "circle" ||
              this._fireworkTimeThreshold === -1 ||
              current["endTime"] - current.time < this._fireworkTimeThreshold
            ) {
              this.spawnNote(current);
              if (this._fireworksMode == "more") {
                this.spawnFirework(current);
              }
            } else {
              this.spawnFirework(current);
            }
          }
        }
      });
    }
  }

  private createFireworkTrail(): Graphics {
    const firework = new Graphics().lineTo(0, 10).stroke({
      color: 0xfa2121,
      width: 1,
    });
    return firework;
  }

  private createFireworkEffect(): AnimatedSprite {
    const animatedSprite = new AnimatedSprite(
      (
        ENGINE.getPIXIResource(
          "firework" + Math.ceil(Math.random() * 3),
        ) as Spritesheet
      ).animations["vnbv"],
    );
    animatedSprite.anchor.set(0.5);
    animatedSprite.loop = false;
    animatedSprite.onComplete = () => {
      animatedSprite.visible = false;
      animatedSprite.removeFromParent();
    };
    animatedSprite.alpha = 0;
    return animatedSprite;
  }

  public spawnFirework(
    data: OsuHitObject,
    isMega?: number,
    megaMax?: number,
  ): void {
    // spawn instantly
    // travel time is data["endTime"] - data.time
    const travelTime = (data["endTime"] || data.time + 333) - data.time;
    // console.log(travelTime);
    // console.log(data["endTime"]);
    if (isMega === undefined) {
      // @ts-ignore
      isMega = false;
    } else {
      isMega += 1;
    }

    const fireworkContainer = new Container();

    const randomValue = Math.random();

    let animatedSprite = this._fireworkEffectPool.find(
      (e) => e.visible == false,
    );
    if (!animatedSprite) {
      animatedSprite = this.createFireworkEffect();
      this._fireworkEffectPool.push(animatedSprite);
    }
    fireworkContainer.addChild(animatedSprite);
    animatedSprite.visible = true;
    animatedSprite.alpha = 0;

    let firework = this._fireworkTrailPool.find((e) => e.visible == false);
    if (!firework) {
      firework = this.createFireworkTrail();
      this._fireworkTrailPool.push(firework);
    }
    fireworkContainer.addChild(firework);
    firework.visible = true;
    this.backgroundContainer.addChild(fireworkContainer);
    if (isMega) {
      fireworkContainer.position.set(
        (1920 / megaMax) * isMega + (Math.random() - 0.5) * 50,
        1080 * (0.8 + Math.random() * 0.2),
      );
    } else {
      fireworkContainer.position.set(
        1920 * 0.2 + Math.random() * (1920 * 0.6),
        1080 * (0.8 + Math.random() * 0.2),
      );
    }
    // let id = null;
    // AudioSingleton.playSound("firework_trail").then((_id) => (id = _id));
    HelperFunctions.TWEENVec2AsPromise(
      fireworkContainer.position,
      {
        x: fireworkContainer.position.x,
        y: 1080 * 0.54 + (randomValue - 0.5) * 120,
      },
      Easing.Cubic.Out,
      travelTime,
    ).promise.then(() => {
      // if (id) AudioSingleton.stopAllSoundsOfId(id);

      // explosion!
      if (isMega) {
        animatedSprite.scale.set(3.5);
      } else {
        animatedSprite.scale.set(1 + Math.random() * 0.5);
      }
      animatedSprite.alpha = 0.8;
      animatedSprite.currentFrame = 0;
      animatedSprite.play();
      // AudioSingleton.playSound("firework_expl", {
      //   volume: 0.1,
      // });
      HelperFunctions.waitForTruth(() => animatedSprite.visible == false).then(
        () => {
          fireworkContainer.removeFromParent();
        },
      );
      firework.visible = false;
      // firework.removeFromParent();
    });
  }

  private createNote(isGreen: boolean): Sprite {
    const graphics = new Sprite(
      ENGINE.getPIXIResource(
        isGreen ? "meteorite_green" : "meteorite_white",
        // data.type.type == "circle"
        //   ?
        // ["meteorite_green", "meteorite_white"][Math.floor(Math.random() * 2)],
        // : "meteorite_red",
      ) as Texture,
    );
    graphics.anchor.set(0.5, 1);
    return graphics;
  }

  public spawnNote(data: OsuHitObject) {
    // console.log("Spawning object %O", data);
    const scale = 2;

    // const graphics = new Graphics()
    //   .lineTo((data.x - 475 * 0.5) * 0.166 * scale, -30 * scale)
    //   .stroke({
    //     color: data.type.type == "circle" ? 0xfafafa : 0xfa2121,
    //     width: data.type.type == "circle" ? 6 : 9,
    //   });
    let isGreen = data.type.type !== "circle";
    const pool = isGreen ? this._notePoolGreen : this._notePoolWhite;
    let graphics = pool.find((e) => e.visible == false);
    if (!graphics) {
      graphics = this.createNote(isGreen);
      pool.push(graphics);
      this.meteorContainer.addChild(graphics);
    }
    graphics.visible = true;

    let duration = 333;
    if (data.type.type == "osu!mania" || data.type.type == "slider") {
      duration = Math.max(500, data["endTime"] - data.time);
    }

    graphics.position.set(1920 * 0.5 + (data.x - 475 * 0.5) * 5, 0);
    const dest = {
      x: 1920 * 0.5 + (data.x - 475 * 0.5),
      y: 1080 * 0.585,
    };
    graphics.rotation =
      Helpers.getAngleBetweenTwoPoints(graphics.position, dest) - Math.PI * 0.5;

    graphics.alpha = 1;
    graphics.scale.set(
      0.1 + Math.random() * 0.15 + (data.type.type == "circle" ? 0 : 0.15),
    );
    const scaleCopy = graphics.scale.clone();
    HelperFunctions.TWEENAsPromise(
      graphics,
      "alpha",
      0,
      Easing.Quartic.In,
      duration * (data.type.type == "circle" ? 1.2 : 1.6),
    ).promise.then(() => {
      graphics.visible = false;
    });
    HelperFunctions.TWEENVec2AsPromise(
      graphics.scale,
      { x: scaleCopy.x * 0.9, y: scaleCopy.y * 0.7 },
      Easing.Cubic.Out,
      duration * (data.type.type == "circle" ? 2 : 2.66),
    );
    HelperFunctions.TWEENVec2AsPromise(
      graphics.position,
      dest,
      Easing.Cubic.Out,
      duration * (data.type.type == "circle" ? 2 : 2.66),
    );
  }

  public onResize(_engine: Engine, _params?: unknown): void {
    const targetRes = {
      x: 1920,
      y: 1080,
    };

    targetRes.x *= this.sceneContainer.scale.x;
    targetRes.y *= this.sceneContainer.scale.y;

    this.backgroundContainer.position.set(
      targetRes.x * -0.5 + _engine.getRenderManager().width * 0.5,
      _engine.getRenderManager().height - targetRes.y,
    );
    this.foregroundContainer.position.set(
      targetRes.x * -0.5 + _engine.getRenderManager().width * 0.5,
      _engine.getRenderManager().height - targetRes.y,
    );
    this.starsBackground.position.set(1920 * 0.5, 1080 * 0.5);
    this.vignette.position.set(
      ENGINE.getRenderManager().width * 0.5,
      ENGINE.getRenderManager().height,
    );
    // this.footer.position.set(
    //   targetRes.x * -0.5 + _engine.getRenderManager().width * 0.5,
    //   _engine.getRenderManager().height - targetRes.y,
    // );
    // this.leftChar.position.set(
    //   targetRes.x * -0.5 + _engine.getRenderManager().width * 0.5,
    //   _engine.getRenderManager().height - targetRes.y,
    // );
    // this.rightChar.position.set(
    //   targetRes.x * -0.5 + _engine.getRenderManager().width * 0.5,
    //   _engine.getRenderManager().height - targetRes.y,
    // );
  }

  onStep(_engine: Engine) {
    super.onStep(_engine);
    const now = Date.now() * 0.001;

    if (_engine.getInputManager().isKeyDown("e")) {
      console.log(Math.floor(OsuCommon._trackClock.currentTime * 1000));
      this.spawnFirework(
        this.activeTrack.HitObjects.find((e) => e.time == 154920),
        0,
        2,
      );
    }

    // if (_engine.getInputManager().isKeyDown("s")) {
    //   AudioSingleton.playSound("firework_expl", {
    //     volume: 0.0,
    //   });
    // }

    const skySwayValues: IVector2 = {
      x: Math.sin(now) * 2 * this._cameraSwayValue,
      y: Math.cos(now) * 1 * this._cameraSwayValue,
    };
    this.skyBackground?.position.set(skySwayValues.x, skySwayValues.y);
    this.cityForeground?.position.copyFrom(this.skyBackground.position);
    this.cityForeground_green?.position.copyFrom(this.skyBackground.position);

    this.footer?.position.set(
      Math.sin(now + 0.32) * 2.33 * this._cameraSwayValue,
      Math.cos(now) * 1.11 * this._cameraSwayValue,
    );
    this.leftChar?.position.copyFrom(this.footer.position);
    this.rightChar?.position.copyFrom(this.footer.position);

    if (this.leftChar)
      this.leftChar.alpha = OsuCommon.__AUDIOCTX
        ? 1 -
          Easing.Exponential.In(
            OsuCommon.__AUDIOCTX?.currentTime /
              (this.activeTrack.HitObjects[
                this.activeTrack.HitObjects.length - 1
              ].time *
                0.001),
          )
        : 1;

    if (this.cityForeground && this.cityForeground.filters?.[0])
      this.cityForeground.filters[0].brightness = Math.max(
        0,
        this._backgroundTargetBrightness +
          Math.sin(now * this._brightnessSpeed) * this._brightnessVariance,
      );

    if (this.starsBackground && this.starsBackground.filters?.[0]) {
      this.starsBackground.rotation += 0.00003;
      this.starsBackground.filters[0].brightness = HelperFunctions.lerp(
        this.starsBackground.filters[0].brightness,
        this._targetStarBrightness +
          Math.sin(now * this._starBrightnessFlickerSpeed) *
            this._starBrightnessFlickerVariance,
        _engine.deltaTime * 0.1,
      );
      this.starsBackground.position.set(
        1920 * 0.5 + skySwayValues.x,
        1080 * 0.5 + skySwayValues.y,
      );
    }

    this.leftChar?.scale.set(1, 1 + Math.sin(now + 0.12) * 0.001);
    this.rightChar?.scale.set(1, 1 + Math.sin(now + 0.12) * 0.001);

    // this.backgroundContainer.filters[0].
  }

  public async preload(_engine: Engine): Promise<void> {
    await _engine.loadAssets(
      [
        {
          key: "skyBackground",
          type: LoaderType.PIXI,
          path: "pieces/sky.png",
        },
        {
          key: "cityForeground",
          type: LoaderType.PIXI,
          path: "pieces/foreground.png",
        },
        {
          key: "footer",
          type: LoaderType.PIXI,
          path: "pieces/footer.png",
        },
        {
          key: "left",
          type: LoaderType.PIXI,
          path: "pieces/left.png",
        },
        {
          key: "right",
          type: LoaderType.PIXI,
          path: "pieces/right.png",
        },
        {
          key: "stars",
          type: LoaderType.PIXI,
          path: "pieces/stars.png",
        },
        {
          key: "firework1",
          type: LoaderType.PIXI,
          path: "firework1/firework1-0.json",
        },
        {
          key: "firework2",
          type: LoaderType.PIXI,
          path: "firework1/firework2-0.json",
        },
        {
          key: "firework3",
          type: LoaderType.PIXI,
          path: "firework1/firework3-0.json",
        },
        {
          key: "meteorite_blue",
          type: LoaderType.PIXI,
          path: "pieces/meteorite_blue.png",
        },
        {
          key: "meteorite_white",
          type: LoaderType.PIXI,
          path: "pieces/meteorite_white.png",
        },
        {
          key: "meteorite_green",
          type: LoaderType.PIXI,
          path: "pieces/meteorite_green.png",
        },
        {
          key: "meteorite_red",
          type: LoaderType.PIXI,
          path: "pieces/meteorite_red.png",
        },
        {
          key: "vignette",
          type: LoaderType.PIXI,
          path: "pieces/vignette.png",
        },
        {
          key: "greenlight",
          type: LoaderType.PIXI,
          path: "pieces/greenlight.png",
        },
        {
          key: "foreground_g",
          type: LoaderType.PIXI,
          path: "pieces/foreground_g.png",
        },
      ],
      (_prog) => {
        console.log("Progress %o", _prog);
      },
    );

    const osuSrc = await fetch("./assets/PIKASONIC-Nothing.osu");
    return osuSrc
      .text()
      .then((osuText) => {
        return OSUJSON.ParseOSUFileAsync(osuText);
      })
      .then((f: OsuFile) => {
        console.log(f);
        this.activeTrack = f;

        // return AudioSingleton.playSound("audio", {
        //   audioType: AUDIO_TYPES.MUSIC,
        // });
      })
      .then(() => {
        // AudioSingleton.stopAllSounds();
      });
  }
}
