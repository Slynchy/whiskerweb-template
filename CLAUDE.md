# whiskerweb-template

Starter project for **Whiskerweb**, a TypeScript entity-component framework built on PixiJS v8.
`src/TestState.ts` is a smoke test of the framework: sprite rendering, saved data, click handling and tweens. Its logo is drawn at a fixed 512 CSS px, so it overflows narrow phone screens; that is expected.

## Layout and commands

- `lib/whiskerweb/` is the framework, a git submodule (github.com/Slynchy/whiskerweb). Framework changes are made there and committed in the submodule, separately from this repo.
- `src/index.ts` is the entry point: `new Engine()`, then `await engine.init(new TestState(), config)`.
- `assets/` is copied to `dist/assets/`; asset paths in the config are relative to it. `src/index.html` is copied to `dist/`.
- `src/index.html` must keep its mobile viewport meta tag (`width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0`). Without it, phones lay the page out 980px wide and zoom out, the canvas size then feeds back into `window.innerWidth`, and the scene ends up off-centre.
- `npm start`: esbuild watch + serve `dist/` on http://localhost:8080. `npm run build`: minified `dist/index.js`. The watcher only rebuilds on code changes, so restart `npm start` after editing `src/index.html` or `assets/`.
- tsconfig `paths` maps `whiskerweb` to `./lib/whiskerweb/src`, so the app compiles the framework source directly (no framework build step). Framework dependencies live in `lib/whiskerweb/node_modules`; `pixi.js` is in the root `node_modules`.
- Import PIXI classes (Sprite, Container, Graphics, Text, Texture, Filters...) from `"whiskerweb"` rather than `pixi.js`.

## Boot sequence (`Engine.init`)

- `Engine` is a singleton, also exposed as the global `ENGINE`; a second `new Engine()` throws.
- Order: InputManager, renderer (WebGPU preferred, WebGL fallback; canvas appended to `<body>`), resize hook (fires once immediately, before any state exists), platform SDK + savers, focus-loss pause hooks, `PlayerDataSingleton` loaded for `playerDataKeys`, ticker started/stopped per `autoStart`, `bootAssets` loaded, then `changeState(initialState)`.
- Errors while loading assets or starting the first state are caught and only `console.error`'d; `init()` still resolves.

## Main loop

- The PIXI ticker (`engine.getTicker()`) runs each frame: `TWEEN.update`, active state `onStep`, render.
- With `autoStart: false` (this template's setting) nothing updates, tweens or renders until a state calls `engine.getTicker().start()`. TestState does this at the end of `onAwake`.
- `engine.deltaTime` is PIXI's frame-scaled delta (about 1 at 60 fps), not milliseconds; use `ENGINE.getTicker().deltaMS` for ms. The framework's own `Ticker` class is deprecated.

## States and scenes

- Subclass `State` and implement `onAwake(engine, params)`, `onResize(engine)` and `preload(engine): Promise<void>`; `onStep` and `onDestroy` are optional.
- `engine.changeState(state, params)`: the old state's `onDestroy` runs and its stage is destroyed, the new scene is attached, then `await preload()`, then `onAwake()`.
- Add objects with `this.scene.addObject(obj)` (a GameObject or any PIXI container). Every object in the active scene that has an `onStep(dt)` method is stepped each frame, recursively.
- The first resize fires before the state exists, so call `this.onResize(engine)` at the end of `onAwake` to lay out.
- For layout, `ENGINE.getRenderManager().width` / `.height` give the visible stage size in the same units as object positions.
- Stage units are CSS pixels, so objects appear the same size at any devicePixelRatio; the canvas renders at devicePixelRatio, so higher-DPR screens are sharper rather than bigger. This costs fill rate on phones (a Pixel 9 draws ~1080x2420 pixels); to cap it, clamp the ratio read in `RenderManager.configureRenderer2d` (e.g. `Math.min(window.devicePixelRatio, 2)`).

## Entities, components, systems

- `GameObject` extends PIXI `Container`; position, scale, rotation, children and interactivity live on it directly.
- Components hold data. Subclass `Component` and define:
  - `public static readonly id = "UniqueName"`. Duplicate checks and `hasComponent` compare this; without it the component inherits `"component"` and collides with other components.
  - `protected static readonly _system = MySystem`. Without it `addComponent` crashes.
  - `onAttach`, `onDetach` and `onComponentAttached`.
- Systems are static-only classes (the constructor throws) with `static onAwake(comp)`, `static onStep(dt, comp)` and `static onDestroy(comp)`.
- `addComponent` rejects a duplicate `id`, sets `parent`, calls `System.onAwake` then `comp.onAttach`, then notifies the sibling components. `getComponent(Class)` matches the exact constructor (not subclasses).
- `GameObject.onStep` (only while `isActive()`) calls each component's `System.onStep`.
- `lib/whiskerweb/src/engine/States/StressTestState.ts` has a minimal custom component + system.

## Sprites and assets

- `new SpriteComponent("key")` wraps a PIXI Sprite and adds it as a child of the GameObject on attach. The texture must already be loaded when the component is constructed; an unknown key silently gives an empty sprite.
- `bootAssets: [{ key, path, type: LoaderType.PIXI | LoaderType.JSON | LoaderType.WASM }]`. For per-state assets call `engine.loadAssets([...])` inside `preload()`. Spritesheet frames are cached under their frame names. Fetch with `getPIXIResource` / `getJSON` / `getWASM`.
- `engine.getTexture(key)` returns `Texture.EMPTY` and logs a warning when the key isn't loaded.

## Saved data

- `PlayerDataSingleton.getData` / `setData` only accept keys listed in config `playerDataKeys`; other keys log an error and do nothing.
- `setData` marks a key dirty, and dirty keys autosave every `autoSave` ms (to localStorage with `gamePlatform: "offline"`).
- localStorage values are only JSON-parsed when they start with `{` or `[`, so numbers and booleans come back as strings.

## Input, tweens, helpers

- `buttonify(target, { onFire, onPointerDown/Up/Over/Out/Move, ... })` handles click/tap.
- `HelperFunctions.TWEENAsPromise(target, prop, to, { function: TWEENFunctions.X, direction: TWEENDirection.Y }, ms = 1000)` returns `{ promise, cancel, progress }`; await `.promise`. Tweens only advance while the ticker runs.
- `engine.getInputManager()` polls input: `isKeyDown(lowercaseKey)`, `isMouseButtonPressed`, `isPointerDown`, `getMousePosition`.
- `HelperFunctions` is the legacy static helper class; the `Helpers` namespace is the newer home for helpers.

## Config notes (`TWhiskerConfig` in `lib/whiskerweb/src/config/whiskerConfig.ts`)

- `autoResize`: `"either"` and `"auto"` choose width- or height-fitting from the initial aspect ratio; `"width"`, `"height"` and `"none"` are used as given. With `"none"` the canvas stays at the config `width` x `height`.
- `devicePixelRatio` sets the starting render resolution; every resize switches to the live `window.devicePixelRatio` (set in `RenderManager.configureRenderer2d`).
- `gamePlatform`: `"offline"`, `"capacitor"`, or a custom `PlatformSDK` subclass (constructed with no arguments; gets LocalStorageSaver + GameAnalytics like the built-in platforms).
- `pauseOnFocusLoss`: stops the ticker on blur and restarts it on focus only if it was running when focus was lost.
- Ignored by the engine: `scaleMode`, `sharedTicker`, `sharedLoader`, `defaultCameraType`.
- `__WWPRODUCTION = true` in `engine/Constants/Constants.ts` turns debug logging off.

## Checking changes

There is no automated test suite (`npm test` is a placeholder). Run `npm start`, open http://localhost:8080 and watch the console: TestState logs a start/pass pair for each check. The saved-data check only passes on the second page load, and the interaction and tween checks need a click on the sprite. For mobile layout, use the browser devtools' device emulation or a phone on the same network.
