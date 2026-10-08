# whiskerweb-template

Starter project for **Whiskerweb**, a TypeScript entity-component framework built on PixiJS v8.
`src/TestState.ts` is a smoke test of the framework: sprite rendering, saved data, click handling and tweens. Its logo is drawn at a fixed 512 CSS px, so it overflows narrow phone screens; that is expected.

## Layout and commands

- `lib/whiskerweb/` is the framework, a git submodule (github.com/Slynchy/whiskerweb). Framework changes are made there and committed in the submodule, separately from this repo.
- `src/index.ts` is the entry point: `new Engine()`, then `await engine.init(new TestState(), config)`.
- `assets/` is copied to `dist/assets/`; asset paths in the config are relative to it (the engine prefixes `./assets/`). `src/index.html` is copied to `dist/`.
- `src/index.html` must keep its mobile viewport meta tag (`width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0`). Without it, phones lay the page out 980px wide and zoom out, the canvas size then feeds back into `window.innerWidth`, and the scene ends up off-centre.
- `npm start`: esbuild watch + serve `dist/` on http://localhost:8080. `npm run build`: minified `dist/index.js` (about 710 KB, 210 KB gzipped). The watcher only rebuilds on code changes, so restart `npm start` after editing `src/index.html` or `assets/`.
- Both scripts run under ts-node, which needs CommonJS; tsconfig's `ts-node` section sets that, while the project itself uses `module: es2020` (needed for the `import()` in `WASMLoader`).
- tsconfig `paths` maps `whiskerweb` and `whiskerweb/*` to `./lib/whiskerweb/src`, so the app compiles the framework source directly (no framework build step). Framework dependencies live in `lib/whiskerweb/node_modules`.
- There is one PIXI at runtime: the root `node_modules/pixi.js` (8.22). `scripts/build.ts` and `scripts/server.ts` alias `pixi.js` to it, and tsconfig `paths` does the same for type-checking. Without the alias, esbuild resolves the framework's own `lib/whiskerweb/node_modules/pixi.js` (installed as its peer dependency) and bundles that copy instead. Keep the two at the same version, and keep the alias in any new build script.
- `@pixi/sound` must stay on v6 or later; v5 is the PIXI v7 line and pulls a second PIXI core into the bundle.
- PIXI 8.22's type declarations need TypeScript 5.7+. The template is on 5.3 and relies on `skipLibCheck`; the framework has its own TypeScript 5.9.
- Don't add `baseUrl` to the framework's tsconfig: bare imports such as `"gameanalytics"` would then resolve to the entry files in `lib/whiskerweb/src/` (in both tsc and esbuild) instead of the npm packages.
- Import PIXI classes (Sprite, Container, Graphics, Text, Texture...) from `"whiskerweb"` rather than `pixi.js`.

## Framework exports

- Every folder under `lib/whiskerweb/src/` has an `index.ts` barrel re-exporting its files (and its subfolders' barrels). The main entry point `lib/whiskerweb/src/index.ts` is assembled from them: `engine`, `config` and `lib` are exported flat; `Constants`, `Helpers` (the `engine/HelperFunctions/` folder) and `FullscreenFunctions` are namespaces; `buttonify`, `uid`, `TWEENFunctions` and `TWEENDirection` are also exported flat for backwards compatibility; `Easing`, `Tween` and `Group` come from tween.js.
- Optional integrations have their own entry points, so they're only bundled when imported. Each needs optional peer dependencies of the framework; these are installed in `lib/whiskerweb/node_modules` as dev dependencies, so the template can import them as is.
  - `whiskerweb/firebase`: `FirebaseSingleton`, `FirebaseAnalytics`, `FirebaseFeatures` (needs `firebase`).
  - `whiskerweb/gameanalytics`: `GameAnalytics`, `IGameAnalyticsOptions` (needs `gameanalytics`).
  - `whiskerweb/capacitor`: `CapacitorSDK`, `ICapacitorSDKOptions`, and AdMob's `BannerAdSize`, `BannerAdPosition`, `MaxAdContentRating` (needs `@capacitor/core`, `@capacitor/app`, `@capacitor/screen-orientation`, `@capacitor-community/admob`).
  - `whiskerweb/filters`: everything in pixi-filters (needs `pixi-filters`).
- Nothing outside `FirebaseSingleton.ts`, `Analytics/FirebaseAnalytics.ts`, `Analytics/GameAnalytics.ts` and `PlatformSDKs/CapacitorSDK.ts` may import those packages, or they end up in every bundle again.
- When adding a file, add an `export * from "./NewFile";` line to its folder's `index.ts` (use `export { default as X }` for default exports, as `engine/index.ts` does for `InputManager`).
- Inside the framework, import from the specific file (`../Systems/System`), never from a barrel or the root index. Barrels importing modules that import barrels creates circular imports, which fail at load time with errors like "Class extends value undefined".
- `./HelperFunctions` resolves to the `HelperFunctions.ts` static class, not the folder; the folder's barrel must be referenced as `./HelperFunctions/index`.

## Boot sequence (`Engine.init`)

- `Engine` is a singleton, also exposed as the global `ENGINE`; a second `new Engine()` throws.
- `init(state, config?)`: every config field is optional and the defaults are applied by `resolveWhiskerConfig` (see Config notes).
- Order:
  1. InputManager, then the default texture scale mode (`scaleMode`).
  2. The renderer (WebGPU preferred, WebGL fallback; canvas appended to `<body>`).
  3. The resize hook, which fires once immediately, before any state exists.
  4. The platform SDK (`gamePlatform`), then the analytics handler for the `analytics` modules.
  5. `await platformSdk.initialize()`. Errors are logged, not thrown.
  6. Focus-loss pause hooks, then analytics init (`autoInitAnalytics`).
  7. `PlayerDataSingleton` loaded for `playerDataKeys`.
  8. The ticker started or stopped per `autoStart`.
  9. `bootAssets` loaded, then `changeState(initialState)`.
- `init()` resolves even when loading fails. If loading the boot assets or starting the first state fails, the error is only `console.error`'d and the first state never starts. An asset that still fails after its loader's single retry makes `loadAssets` reject, once everything else has loaded, with the failed keys. An unknown `gamePlatform` string (including the old `"capacitor"`) makes `init()` reject.

## Main loop

- The PIXI ticker (`engine.getTicker()`) runs each frame:
  1. The engine's tween group.
  2. The active state's `onStep`.
  3. The loading screen, while it is visible.
  4. Render.
- With `autoStart: false` (this template's setting) nothing updates, tweens or renders until a state calls `engine.getTicker().start()`. TestState does this at the end of `onAwake`.
- Tweens (tween.js 25):
  - New tweens aren't in any group, so add yours to the engine's group, which is exported as `tweenGroup` and also returned by `engine.getTweenGroup()`: `tweenGroup.add(new Tween(obj).to({ x: 10 }, 500).start())`. Start them with no time argument; the group uses tween.js's default clock (`performance.now`).
  - Tweens are removed from the group once they have finished or been stopped. Add a tween again if you restart it.
  - Tweens run on wall-clock time, so stopping the ticker yourself makes running tweens jump ahead when it restarts. `engine.pause()` / `engine.resume()` stop and restart the ticker and also pause and resume every tween in the group; `pauseOnFocusLoss` uses them.
- `engine.deltaTime` is PIXI's frame-scaled delta (about 1 at 60 fps), not milliseconds; use `ENGINE.getTicker().deltaMS` for ms. The framework's own `Ticker` class is deprecated.

## States and scenes

- Subclass `State` and implement `onAwake(engine, params)`, `onResize(engine)` and `preload(engine): Promise<void>`; `onStep` and `onDestroy` are optional.
- `engine.changeState(state, params)` does this:
  1. The old state's `onDestroy` runs and its stage is destroyed.
  2. The new scene is attached.
  3. `await preload()`, then `onAwake(engine, params)`.

  If another `changeState` happens during `preload()`, the replaced state's `onAwake` is skipped. A State object can be entered again later; its scene gets a fresh stage.
- Add objects with `this.scene.addObject(obj)` (a GameObject or any PIXI container). Every object in the active scene that has an `onStep(dt)` method is stepped each frame, recursively (`Scene.stepObject`). `scene.removeAllObjects(destroy?)` empties the stage.
- The first resize fires before the state exists, so call `this.onResize(engine)` at the end of `onAwake` to lay out.
- For layout, `ENGINE.getRenderManager().width` / `.height` give the visible stage size in the same units as object positions.
- Stage units are CSS pixels, so objects appear the same size at any devicePixelRatio; the canvas renders at devicePixelRatio, so higher-DPR screens are sharper rather than bigger. This costs fill rate on phones (a Pixel 9 draws ~1080x2420 pixels); to cap it, clamp the ratio read in `RenderManager.configureRenderer2d` (e.g. `Math.min(window.devicePixelRatio, 2)`).

## Loading screen

- Config `loadingScreenComponent` creates `engine.loadingScreenObject`, a GameObject holding that component. It sits on the engine stage above every scene and is visible from the start of boot.
- It is stepped each frame while visible, so its system's `onStep` can animate it. Nothing renders while the ticker is stopped, though, so with `autoStart: false` it isn't drawn during boot.
- Every component of it with a `progress` property gets 0-100 progress (`engine.setLoadingScreenProgress`): boot asset progress, then `loadAssets` progress whenever it is visible.
- `autoHideLoadingScreen` hides it after each `changeState` finishes (`onAwake` has run).
- `showLoadingScreenOnStateChange` shows it again (at 0%) at the start of every `changeState`. If `preload` fails it stays up.
- `engine.showLoadingScreen()` / `hideLoadingScreen()` / `isLoadingScreenVisible` control it by hand.

## Entities, components, systems

- `GameObject` extends PIXI `Container`; position, scale, rotation, children and interactivity live on it directly. `translate(dx, dy)` moves it along its own rotated axes.
- Components hold data. Subclass `Component` and define:
  - `public static readonly id = "UniqueName"`. Duplicate checks and `hasComponent` compare this; without it the component inherits `"component"` and collides with other components.
  - `protected static readonly _system = MySystem`. Without it `addComponent` throws "has no static _system".
  - `onAttach`, `onDetach` and `onComponentAttached`; optionally `onDestroy()`.
- Systems are static-only classes (the constructor throws) with `static onAwake(comp)`, `static onStep(dt, comp)`, `static onDestroy(comp)`, `static onEnable(comp)` and `static onDisable(comp)`.
- `addComponent` does this:
  1. Throws on a duplicate `id`.
  2. Sets `parent`.
  3. Calls `System.onAwake`, then `comp.onAttach`.
  4. Notifies the sibling components, then fires the `onAddComponent()` handlers with the component.

  `getComponent(Class)` matches the exact constructor (not subclasses). `Component.instances` lists every attached component.
- `removeComponent(instanceOrClass)` calls `comp.onDetach`, then `System.onDestroy` (the base implementation calls `comp.onDestroy()`), then fires the `onRemoveComponent()` handlers.
  - Release the component's listeners, tweens and ticker callbacks in `System.onDestroy`.
  - `comp.parent` stays set afterwards, so async callbacks should check `comp.parent.destroyed`.
- `gameObject.destroy()` runs its `onDestroy()` handlers, removes every component as above, then destroys all its children (whatever `options.children` says) and itself.
- `isActive(bool, recursive?)` calls `System.onEnable` / `onDisable` on each component when the state changes. Children are only affected with `recursive`.
- `GameObject.onStep` only runs while the object is active, so an inactive object's components get no `onStep`. `ActivityViaViewportSystem` checks visibility from its own ticker callback for this reason.
- A non-looping `GenericAnimationComponent` removes itself when it finishes.
- `lib/whiskerweb/src/engine/States/StressTestState.ts` has a minimal custom component + system.

## Sprites and assets

- `new SpriteComponent("key")` wraps a PIXI Sprite and adds it as a child of the GameObject on attach. The texture must already be loaded when the component is constructed. An unknown key, or a spritesheet key, gives `Texture.EMPTY` with a warning. Destroying the component destroys the sprite but not its texture.
- `bootAssets: [{ key, path, type: LoaderType.PIXI | LoaderType.JSON | LoaderType.WASM }]`. For per-state assets, call `engine.loadAssets([...])` inside `preload()`.
  - `loadAssets` calls run one at a time and report progress from 0 to 100.
  - Each loader retries a failed asset once.
  - Spritesheet frames are cached under their frame names.
  - Fetch assets with `getPIXIResource` / `getJSON` / `getWASM`.
  - `engine.isLoaderLoading()` is true while any load runs.
- `LoaderType.WASM` loads a JS module (e.g. a WASM build's glue code) with `import()`; `getWASM(key)` returns the module namespace.
- `engine.getTexture(key)` returns `Texture.EMPTY` and logs a warning when the key isn't loaded or isn't a texture.
- `engine.unloadPIXIResource(key)` removes an asset from the cache. For keys loaded through `loadAssets` it also unloads the asset from PIXI Assets, which destroys its textures and drops a spritesheet's frames.

## Saved data

- `PlayerDataSingleton.getData` / `setData` only accept keys listed in config `playerDataKeys`; other keys log an error and do nothing.
- `setData` marks a key dirty. Objects and arrays are always marked dirty, since they may have been changed in place.
- Autosave:
  - With `autoSave > 0` (default 1000 ms), dirty keys are saved that often, and also when the page is hidden or closed.
  - `autoSave: 0` turns autosave off; save manually with `engine.getSaveHandler().flush()`.
  - Keys whose save fails stay dirty and are retried.
- `LocalStorageSaver` (used on every platform) stores each key as JSON under `saveKeyPrefix + key`, so numbers, booleans, objects and null come back with their types.
  - Values saved as raw text by older versions are parsed as JSON when they can be (so `"5"` becomes `5`), and returned as strings otherwise.
  - Keys that have never been saved read as `null`.
- `PlayerDataSingleton.resetAllData()` sets every key to null and removes this game's keys from storage. It only removes keys the saver has loaded or saved, not the whole origin.

## Platforms and analytics

- `PlatformSDK` gives every method an "offline" default, so a custom platform overrides only what it supports. The defaults are:
  - No ads, IAP, friends, contexts or tournaments.
  - An anonymous local player whose locale is `navigator.language` with `_` (e.g. `en_GB`).
  - Pause and resume on window blur and focus.
  - In-memory save and load.
  - `initialize`/`startGame` resolve immediately, and `setLoadingProgress` does nothing.
- `DummySDK` (`gamePlatform: "offline"`) overrides a few of these for testing: it reports ads and IAP as available (fake ads that always succeed), plus a test player and context.
- `CapacitorSDK` (from `whiskerweb/capacitor`) takes an options object: `adUnitIds` per placement, `testing` (Google's sample ads), `testingDevices`, `npa`, banner size/position/margin, `admobOptions`, `requestTrackingAuthorization`.
  - Ads only work on Android/iOS once AdMob has initialised, and AdMob isn't initialised in browsers.
  - Banners default to bottom-centre, matching `adjustHeightForBannerAd`.
  - Pass it as `gamePlatform: CapacitorSDK` or `gamePlatform: new CapacitorSDK({...})`.
- `handleAd(engine, type, placement)` resolves true only if an ad was actually shown (for rewarded ads, only if the reward was earned) and never rejects.
- Analytics modules are passed as config `analytics` and initialised during init unless `autoInitAnalytics: false`. In that case call `engine.initializeAnalytics()` later, e.g. after consent. `engine.addAnalyticsModule(m)` adds one after init.
  - `new GameAnalytics({ gameKey, secretKey, build?, infoLog?, verboseLog?, userId?, eventSubmission? })` throws without both keys. `GameAnalytics.sdk` is the full GameAnalytics API.
  - For Firebase, call `FirebaseSingleton.initialize(firebaseOptions, [FirebaseFeatures.Analytics, ...])` first, then pass `new FirebaseAnalytics(FirebaseSingleton.getAnalytics())`. A feature that fails to start is logged and left unavailable.
- `engine.logEvent(name, value?, params?)` sends an event to every module. `logErrors: "analytics"` also reports uncaught errors and promise rejections that way.

## Input, tweens, helpers

- `buttonify(target, { onFire, onPointerDown/Up/Over/Out/Move, ... })` handles click/tap and returns an unbind function. Calling it again on the same target replaces the earlier binding.
- `HelperFunctions.TWEENAsPromise(target, prop, to, { function: TWEENFunctions.X, direction: TWEENDirection.Y }, ms = 1000)` returns `{ promise, cancel, progress }`. It runs on the engine's tween group.
  - `.promise` resolves when the tween completes, is cancelled, or its `onTick` callback returns false.
  - `cancel()` stops the tween where it is; it does not jump to the end value.
  - `TWEENVec2AsPromise`, `lerpToPromise` and `tweenScalarPromise` are built on it, so all helper tweens follow the ticker and `engine.pause()`.
  - An easing pair that doesn't exist in tween.js logs a warning and falls back to linear (`getEasingFunction`).
- `engine.getInputManager()` polls input:
  - `isKeyDown(key)` takes a `KeyboardEvent.key` value in any case, e.g. `"ArrowLeft"`.
  - `isMouseButtonPressed(button)`.
  - `isPointerDown(button = 0)` is true while any mouse, pen or touch pointer holds that button.
  - `getMousePosition()` gives the last pointer position in window coordinates, not stage coordinates.
  - Everything is released when the window loses focus or the page is hidden.
- The `Helpers` namespace (the `engine/HelperFunctions/` folder) is the home for helpers. `HelperFunctions` is the legacy static class; methods that duplicated a folder helper now delegate to it and are marked `@deprecated`. Notable behaviour:
  - `Helpers.getMainCanvasElement()` returns the renderer's canvas.
  - `clamp`/`mathClamp` return `min` when min > max.
  - `getRelativePosition`/`getPositionRelativeToParent` account for scale, rotation and pivot (via `toLocal`).
  - `formatTimeTo*` format durations, while `formatTimestamp*` and `formatCurrentTime` format local clock times.
- `SeededRandom` and `getSeededRandomFromString` return values in [0, 1). Their sequences changed when a precision bug was fixed, so seeds from older versions give different values.

## Config notes (`TWhiskerConfig` in `lib/whiskerweb/src/config/whiskerConfig.ts`)

- Every field is optional; the JSDoc there gives each default. The defaults most likely to matter:
  - `autoStart: true`.
  - `autoSave: 1000`.
  - `gamePlatform: "offline"`, `analytics: []` and `autoInitAnalytics: true`.
  - `width`/`height`/`devicePixelRatio` from the window.
  - `autoResize: "either"`.
  - `backgroundColor: 0x000000`, `antialias: false`.
- `autoResize`: `"either"` and `"auto"` choose width- or height-fitting from the initial aspect ratio; `"width"`, `"height"` and `"none"` are used as given. With `"none"` the canvas stays at the config `width` x `height`.
- `devicePixelRatio` sets the starting render resolution; every resize switches to the live `window.devicePixelRatio` (set in `RenderManager.configureRenderer2d`).
- `gamePlatform`: `"offline"` (DummySDK), a `PlatformSDK` subclass (constructed with no arguments), or an instance. The engine awaits its `initialize()`.
- `pauseOnFocusLoss`: calls `engine.pause()` on blur and `engine.resume()` on focus, but only if the ticker was running when focus was lost.
- `scaleMode` (`"linear"` / `"nearest"`) sets the default for textures created afterwards.
- `adjustHeightForBannerAd` makes the stage 60px shorter than the window and keeps the canvas clear of the bottom 60px.
- `saveKeyPrefix` (default `""`) is prepended to every localStorage key, so games on the same origin don't collide. Changing it on a released game orphans existing saves.
- `logErrors`: `"none"`, `"analytics"` (`"firebase"` is an old name for it), or `"sentry"` (not implemented; warns).
- Removed fields: `autoInitFirebase` (use `whiskerweb/firebase`), `sharedTicker`, `sharedLoader`, `defaultCameraType` and `printFatalErrorsToHTML`.
- `__WWPRODUCTION = true` in `engine/Constants/Constants.ts` turns debug logging off. `ENGINE_DEBUG_MODE`, `LOADTIME_DEBUG_MODE` and `ANALYTICS_DEBUG_MODE` all follow it.

## Checking changes

There is no automated test suite (`npm test` is a placeholder).

- `npx tsc --noEmit -p .` type-checks the app and the parts of the framework it imports. Run it in `lib/whiskerweb` too, which checks every framework file (including the opt-in integrations) against the framework's own PIXI copy.
- `npm run lint` in `lib/whiskerweb` runs ESLint 9 with `eslint.config.mjs`; it should report no errors. Use the npm script rather than `npx eslint`, which can pick up a global ESLint.
- Run `npm start`, open http://localhost:8080 and watch the console: TestState logs a start/pass pair for each check.
  - The saved-data check only passes on the second page load.
  - The interaction and tween checks need a click on the sprite.
  - Browsers pause `requestAnimationFrame` in background tabs, so the scene only updates while the page is visible.
- For mobile layout, use the browser devtools' device emulation or a phone on the same network.
