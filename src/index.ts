import { Engine, LoaderType } from "whiskerweb";
import { TestState } from "./TestState";

async function main() {
  console.log("Test");

  const engine = new Engine();
  // Every config field is optional; these are the ones TestState needs or the template changes from the defaults
  await engine.init(new TestState(), {
    antialias: true,
    autoStart: false, // TestState starts the ticker at the end of onAwake
    backgroundColor: 0xfafafa,
    playerDataKeys: ["testKey1"],
    bootAssets: [
      {
        key: "whiskerweb",
        path: "whiskerweb.png",
        type: LoaderType.PIXI,
      },
    ],
    showFPSTracker: true,
  });
}

main();
