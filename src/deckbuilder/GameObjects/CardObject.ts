import {
  buttonify,
  Easing,
  GameObject,
  Graphics,
  HelperFunctions,
  Sprite,
  Text,
  TextStyle,
  Texture,
} from "whiskerweb";
import { ICardInstance } from "../Types/ICardInstance";
import { CardEffectTypes } from "../Types/CardEffectTypes";
import { TargetType } from "../Types/TargetType";
import { DamageTypes } from "../Types/DamageTypes";
import { CardIDtoString } from "../Data/CardIDtoString";

export class CardObject extends GameObject {
  public cardName: Text;
  public cardDesc: Text;
  public cardPortrait: Sprite;
  public onClick: () => void;

  constructor() {
    super("CardObject");

    const cardPortrait = (this.cardPortrait = new Sprite(Texture.EMPTY));
    cardPortrait.anchor.set(0.5, 1);
    cardPortrait.position.set(0, -123);
    this.addChild(cardPortrait);

    const cardBg = new Sprite(ENGINE.getTexture("card_golden"));
    // cardBg.filters = [
    //     new filters.FXAAFilter()
    // ];
    HelperFunctions.smartScale2D(
      {
        x: 180,
        y: undefined,
      },
      cardBg,
    );
    cardBg.anchor.set(0.5, 1);
    this.addChild(cardBg);

    const textStyle = new TextStyle({
      fill: "#0a0a0a",
      fontSize: 32,
      fontFamily: "Arial",
      fontWeight: "bold",
      align: "center",
    });
    this.cardName = new Text("", textStyle);
    this.cardName.anchor.set(0.5, 0.5);
    this.cardName.position.set(0, -105);
    this.addChild(this.cardName);

    this.cardDesc = new Text(
      "",
      new TextStyle({
        fill: "#0a0a0a",
        fontSize: 11 * 3,
        fontFamily: "Arial",
        fontWeight: "bold",
        align: "center",
        wordWrapWidth: 128 * 3,
        wordWrap: true,
      }),
    );
    this.cardDesc.anchor.set(0.5, 0.5);
    this.cardDesc.position.set(0, -72);
    this.addChild(this.cardDesc);

    let anim = null;
    buttonify(this, {
      onFire: () => this.onClick?.(),
      onPointerMove: () => {
        if (anim || this.scale.x == 1.3) return;
        anim = HelperFunctions.TWEENVec2AsPromise(
          this.scale,
          { x: 1.3, y: 1.3 },
          Easing.Linear.None,
          66,
        ).promise.then(() => {
          anim = null;
        });
        // this.scale.set(1.3);
        this.zIndex = 100;
      },
      onPointerOut: () => {
        this.zIndex = 0;
        HelperFunctions.TWEENVec2AsPromise(
          this.scale,
          { x: 1, y: 1 },
          Easing.Linear.None,
          66,
        );
      },
    });
  }

  public update(_card: ICardInstance, _onClick: typeof this.onClick): void {
    this.onClick = _onClick;

    let descString = "";
    for (let i = 0; i < _card.effects.length; i++) {
      switch (_card.effects[i].type) {
        case CardEffectTypes.ApplyBuff:
          descString += `Apply ${_card.effects[i].amount} ${_card.effects[i].buffId}`;
          break;
        case CardEffectTypes.Damage:
          descString += `Deal ${_card.effects[i].amount} ${
            DamageTypes[_card.effects[i].damageType]
          } damage`;
          break;
        case CardEffectTypes.ApplyDebuff:
          descString += `Apply ${_card.effects[i].amount} ${_card.effects[i].buffId}`;
          break;
        case CardEffectTypes.ApplyEnchantment:
          descString += `Apply ${_card.effects[i].enchantmentId}`;
          break;
        case CardEffectTypes.Heal:
          descString += `Heal ${_card.effects[i].amount}`;
          break;
      }
    }

    // this.cardName.text = `${_card.id}\n${TargetType[_card.targetType]}\n`;
    this.cardName.text = `${
      CardIDtoString[_card.id] ? CardIDtoString[_card.id] : _card.id
    }`;
    HelperFunctions.smartScale2D(
      {
        x: 128,
        y: undefined,
      },
      this.cardName,
    );
    this.cardDesc.text = descString;
    HelperFunctions.smartScale2D(
      {
        x: 128,
        y: undefined,
      },
      this.cardDesc,
    );

    if (ENGINE.hasPIXIResource(_card.id)) {
      this.cardPortrait.texture = ENGINE.getTexture(_card.id);
      HelperFunctions.smartScale2D(
        {
          x: 172,
          y: undefined,
        },
        this.cardPortrait,
      );
    }
  }
}
