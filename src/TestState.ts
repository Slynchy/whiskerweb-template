import {
    PlayerDataSingleton,
    buttonify,
    HelperFunctions,
    Engine,
    State,
    GameObject,
    SpriteComponent,
    TWEENFunctions,
    TWEENDirection
} from "whiskerweb";


export class TestState extends State {

    private sprite: GameObject;

    constructor() {
        super();
    }

    onAwake(_engine: Engine, _params?: unknown): void {
        _engine.setBackgroundColor(0xf8f8f8);
        console.log("Sprite tests start...");
        const testSprite = this.sprite = new GameObject();
        testSprite.addComponent(new SpriteComponent(
          "whiskerweb"
        ));
        testSprite.getComponent(SpriteComponent).pivot.x =
          testSprite.getComponent(SpriteComponent).width / 2;
        testSprite.getComponent(SpriteComponent).pivot.y =
          testSprite.getComponent(SpriteComponent).height / 2;
        this.scene.addObject(testSprite);
        testSprite.scale.set(0.5, 0.5);
        this.onResize(_engine);
        console.log("Sprite tests pass!");

        console.log("PlayerDataSingleton tests start...");
        if(
          PlayerDataSingleton.getData("testKey1") === "testValue1"
        ) {
            console.log("PlayerDataSingleton tests pass!");
        } else {
            PlayerDataSingleton.setData("testKey1", "testValue1");
            console.warn("PlayerDataSingleton tests initialized for next run...");
        }

        let tween;
        console.log("Interaction test start...");
        buttonify(testSprite, {
            onFire: (ev) => {
                console.log("Interaction test passed!");

                console.log("TWEEN test start...");
                if(tween) {
                    tween.cancel();
                    tween = null;
                    testSprite.rotation = 0;
                }
                tween = HelperFunctions.TWEENAsPromise(
                  testSprite,
                  "rotation",
                  Math.PI * 2,
                  {
                      function: TWEENFunctions.Elastic,
                      direction: TWEENDirection.Out
                  },
                );
                tween.promise.then(() => {
                    console.log("TWEEN test passed!");
                    testSprite.rotation = 0;
                });
            }
        });

        _engine.getTicker().start();
    }

    onResize(_engine: Engine, _params?: unknown): void {
        this.sprite.position.set(
          ENGINE.getRenderManager().width / 2,
          ENGINE.getRenderManager().height / 2,
        );
    }

    preload(_engine: Engine): Promise<void> {
        return Promise.resolve(undefined);
    }

}