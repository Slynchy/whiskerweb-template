import { Container, GameObject, Graphics, HelperFunctions, Sprite, Text, TextStyle, Texture } from "whiskerweb";
import { IBattleState } from "../Types/Battle/IBattleState";
import { ICharacter } from "../Types/Battle/ICharacter";
import { CardIDtoString } from "../Data/CardIDtoString";
import { CreatureIDtoString } from "../Data/CreatureIDtoString";

export class CharacterObject extends GameObject {

    public cardName: Text;
    public debugText: Text;
    public cardPortrait: Sprite;
    public healthBar: Graphics;
    public healthBarText: Text;

    constructor(name?: string) {
        super(name);

        const cardPortrait = this.cardPortrait = new Sprite(Texture.EMPTY);
        cardPortrait.anchor.set(0.5, 0);
        cardPortrait.position.set(0, -132);
        this.addChild(cardPortrait);

        const cardBg = new Sprite(
            ENGINE.getTexture("card_golden")
        );
        cardBg.anchor.set(0.5, 0.5);
        HelperFunctions.smartScale2D(
            {
                x: 192,
                y: undefined
            },
            cardBg
        );
        this.addChild(cardBg);

        const healthBarContainer = new Container();
        healthBarContainer.position.set(0, -144);
        this.addChild(healthBarContainer);
        const healthBarBg = new Graphics();
        healthBarBg.beginFill(0xff0000);
        healthBarBg.drawRect(-60, -8, 120, 16);
        healthBarBg.endFill();
        healthBarContainer.addChild(healthBarBg);
        const healthBar = this.healthBar = new Graphics();
        healthBar.beginFill(0x00ff00);
        healthBar.drawRect(0, 0, 120, 16);
        healthBar.endFill();
        healthBar.position.set(-60, -8);
        healthBarContainer.addChild(healthBar);
        const healthBarText =
            this.healthBarText = new Text("0/0", new TextStyle({
                fill: 0x0a0a0a,
                fontFamily: "Arial",
                fontWeight: "bolder",
                fontSize: 16
            }));
        healthBarText.anchor.set(0.5, 0.5);
        healthBarContainer.addChild(healthBarText);

        const textStyle = new TextStyle({
            fill: "#0a0a0a",
            fontSize: 32,
            fontFamily: "Arial",
            fontWeight: "bold",
            align: "center",
        });
        this.cardName = new Text("", textStyle);
        this.cardName.anchor.set(0.5, 0.5);
        this.cardName.position.set(0, 24);
        this.addChild(this.cardName);

        if(true) {
            const textBg = new Graphics();
            textBg.beginFill(0x000000, 0.6);
            textBg.drawRect(-70, -40, 140, 80);
            textBg.endFill();
            textBg.position.set(0, -200);
            this.addChild(textBg);
            const text = this.debugText = new Text("", new TextStyle({
                fontFamily: "Arial",
                fontSize: 14,
                align: "center",
                wordWrapWidth: 120,
                wordWrap: true,
                fill: 0xff0000,
            }));
            text.anchor.set(0.5, 0.5);
            text.position.set(0, -200);
            this.addChild(text);
        }
    }

    public updateFromState(
        _stateData: ICharacter,
    ): void {
        if(!_stateData) {
            this.visible = false;
            return;
        }
        if(ENGINE.hasPIXIResource(_stateData.characterData.id)) {
            this.cardPortrait.texture = ENGINE.getTexture(_stateData.characterData.id);
            HelperFunctions.smartScale2D(
                {
                    x: 178,
                    y: undefined
                }, this.cardPortrait
            );
        }
        this.cardName.text = `${
            CreatureIDtoString[_stateData.characterData.id] ?
                CreatureIDtoString[_stateData.characterData.id]
                :
                _stateData.characterData.id
        }`;
        HelperFunctions.smartScale2D(
            {
                x: 100,
                y: undefined
            },
            this.cardName
        );
        this.healthBarText.text =
            _stateData.characterData.health + "/" + _stateData.characterData.maxHealth;
        this.healthBar.scale.set(
            (_stateData.characterData.health / _stateData.characterData.maxHealth),
            1
        );

        if(this.debugText) {
            let txtStr = _stateData.characterData.id +
                "\n" +
                _stateData.uid +
                "\nHP: " +
                _stateData.characterData.health + "/" + _stateData.characterData.maxHealth;
            this.debugText.text = txtStr;
        }
    }

    public onStep(_dt: number): void {
        super.onStep(_dt);
    }
}