import {Engine, LoaderType} from "./lib/whiskerweb";
import {TestState} from "./TestState";
import {Application, autoDetectRenderer, Container, Graphics} from "pixi.js";

async function main() {
    console.log("Test");

    const engine = new Engine();
    await engine.init(
        new TestState(),
        {
            renderType: "webgl",
            adjustHeightForBannerAd: false,
            antialias: true,
            autoInitAnalytics: false,
            autoInitFirebase: false,
            autoResize: undefined,
            autoSave: undefined,
            autoStart: false,
            backgroundAlpha: 1,
            backgroundColor: 0x080808,
            bootAssets: [
                {
                    key: "whiskerweb",
                    path: "whiskerweb.png",
                    type: LoaderType.PIXI
                }
            ],
            devicePixelRatio: window.devicePixelRatio,
            gamePlatform: "offline",
            getLatestData(e: any[]): any {
                return e[0];
            },
            height: window.innerHeight,
            loadingScreenComponent: undefined,
            logErrors: "none",
            pauseOnFocusLoss: false,
            printFatalErrorsToHTML: false,
            scaleMode: "linear",
            sharedLoader: false,
            sharedTicker: false,
            showFPSTracker: true,
            width: window.innerWidth
        }
    );
}

async function main2() {
    const renderer = await autoDetectRenderer({
        preference: "webgpu",
    })
    document.body.appendChild(renderer.canvas);

    const container = new Container();
    // renderer.stage.addChild(container);

    const bg =
        new Graphics()
            .fill(0xfafafa)
            .rect(0, 0, 256, 256)
            .fill(0xfafafa);
    container.addChild(bg);

    renderer.render(container);
}

main();
// main2();