import {Engine, LoaderType} from "whiskerweb";
import {TestState} from "./TestState";

async function main() {
    console.log("Test");

    const engine = new Engine();
    await engine.init(
        new TestState(),
        {
            renderType: "webgpu",
            adjustHeightForBannerAd: false,
            antialias: true,
            autoInitAnalytics: false,
            autoInitFirebase: false,
            autoResize: undefined,
            autoSave: undefined,
            autoStart: false,
            backgroundAlpha: 1,
            backgroundColor: 0x080808,
            playerDataKeys: ["testKey1"],
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

main();