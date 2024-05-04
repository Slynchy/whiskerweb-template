import { Container, GameObject, Graphics, HelperFunctions, Sprite, Text, TextStyle, Texture } from "whiskerweb";
import { IBattleState } from "../Types/Battle/IBattleState";
import { TCreatureId } from "../Types/SharedTypes";

const POOL_SIZE = 10; // shouldnt exceed 8

export class TurnOrderObject extends GameObject {

    private cardPool: Array<{
        portrait: Sprite;
        card: Sprite;
        container: Container;
        text: Text;
        overlay: Graphics;
    }> = [];

    constructor() {
        super();
        this.initializePool();
    }

    public isInitialized(): boolean {
        return (this.cardPool.length >= POOL_SIZE);
    }

    public update(_turnOrder: Array<{
        creatureId: TCreatureId;
        uid: string;
        speed: number;
        hasActed: boolean;
    }>): void {
        if(!this.isInitialized()) return;

        const firstHasActedIndex = _turnOrder.findIndex((e) => e.hasActed == true);
        this.cardPool.forEach((e, i) => {
            if(i < _turnOrder.length) {
                e.container.visible = true;
                e.portrait.texture = ENGINE.getTexture(_turnOrder[i].creatureId);
                HelperFunctions.smartScale2D(
                    {
                        x: 96,
                        y: undefined,
                    },
                    e.portrait
                );

                if(i < firstHasActedIndex || firstHasActedIndex === -1) {
                    e.container.position.set(
                        100 * i,
                        0
                    );
                    e.overlay.visible = false;
                } else {
                    e.overlay.visible = true;
                    e.container.position.set(
                        (100 * i) + 20,
                        0
                    );
                }
                e.text.text = _turnOrder[i].speed.toString();
            } else {
                e.container.visible = false;
            }
        });
    }

    private initializePool(): void {
        if(this.cardPool.length >= POOL_SIZE) return;

        while(this.cardPool.length < POOL_SIZE) {
            const container = new Container();

            const portrait = new Sprite(
                Texture.EMPTY
                // ENGINE.getTexture("PlayerCharacter")
            );
            portrait.position.set(2, 2);
            HelperFunctions.smartScale2D(
                {
                    x: 96,
                    y: undefined,
                },
                portrait
            );
            container.addChild(portrait);

            const card = new Sprite(
                ENGINE.getTexture("card_square")
            );
            HelperFunctions.smartScale2D(
                {
                    x: 100,
                    y: 100,
                },
                card
            );
            container.addChild(card);

            const text = new Text("99", new TextStyle({
                fontFamily: "Arial",
                fill: 0x090909,
                fontSize: 22,
                fontWeight: "bold",
            }));
            text.anchor.set(0.5, 0.5);
            text.position.set(50, 84);
            container.addChild(text);

            const overlay = new Graphics();
            overlay
              .fill({color: 0x000000, alpha: 0.6})
              .rect(0, 0, 100, 100);
            overlay.blendMode = 2 as any;
            container.addChild(overlay);

            this.addChild(container);
            this.cardPool.push({
                card,
                portrait,
                overlay,
                container,
                text
            });
        }
        this.cardPool.forEach((e) => e.container.visible = false);
    }
}