import {Engine, State} from "./lib/whiskerweb";
import {Container, Graphics, Sprite, Texture} from "pixi.js";

export class TestState extends State {
    constructor() {
        super();
    }

    onAwake(_engine: Engine, _params?: unknown): void {
        // const container = new Container();
        // _engine.getStage().addChild(container);

        // const bg =
        //     new Graphics()
        //         .fill(0xfafafa)
        //         .rect(0, 0, 256, 256)
        //         .fill(0xfafafa);
        // container.addChild(bg);

        const spr = new Sprite();
        spr.texture =
            _engine.getPIXIResource("whiskerweb") as Texture;
        _engine.getStage().addChild(spr);

        _engine.getTicker().start();
    }

    onResize(_engine: Engine, _params?: unknown): void {
    }

    preload(_engine: Engine): Promise<void> {
        return Promise.resolve(undefined);
    }

}