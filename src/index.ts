import { Engine, LoaderType, uid } from "whiskerweb";
import { TestState } from "./TestState";
import { M22Scene } from "./m22/M22Scene";
import { HelldiversScene } from "./helldivers/HelldiversScene";
import { BattleState } from "./deckbuilder/States/BattleState";
import { CardType } from "./deckbuilder/Types/CardType";
import { DiscardTypes } from "./deckbuilder/Types/DiscardTypes";
import { TargetType } from "./deckbuilder/Types/TargetType";
import { CardEffectTypes } from "./deckbuilder/Types/CardEffectTypes";
import { DamageTypes } from "./deckbuilder/Types/DamageTypes";
import { NothingMainState } from "./nothing/NothingMainState";
// import {Application, autoDetectRenderer, Container, Graphics} from "pixi.js";

async function main() {
  console.log("Test");

  const engine = new Engine();
  await engine.init(
    new NothingMainState(),
    // new TestState(),
    // new M22Scene("katawa_1.json"),
    // new HelldiversScene(),
    // new BattleState({
    //   currentTurn: "",
    //   sceneId: "Crypt",
    //   actedCreatures: [],
    //   roundCounter: 0,
    //   enemies: {
    //     slot_0: {
    //       uid: uid(),
    //       drawPile: [
    //         {
    //           uid: uid(),
    //           id: "NPC_ATTACK_TEST",
    //           type: CardType.Attack,
    //           cost: 0,
    //           discardType: DiscardTypes.Discard,
    //           targetType: TargetType.FrontHero,
    //           effects: [
    //             {
    //               type: CardEffectTypes.Damage,
    //               target: "inherit",
    //               amount: 4,
    //               damageType: DamageTypes.Slashing,
    //             },
    //           ],
    //         },
    //         {
    //           uid: uid(),
    //           id: "NPC_ATTACK_TEST",
    //           type: CardType.Attack,
    //           cost: 0,
    //           discardType: DiscardTypes.Discard,
    //           targetType: TargetType.FrontHero,
    //           effects: [
    //             {
    //               type: CardEffectTypes.Damage,
    //               target: "inherit",
    //               amount: 4,
    //               damageType: DamageTypes.Slashing,
    //             },
    //           ],
    //         },
    //       ],
    //       discardPile: [],
    //       vanishPile: [],
    //       hand: [],
    //       buffs: [],
    //       debuffs: [],
    //       enchantments: [],
    //       characterData: {
    //         id: "TestCreature",
    //         speed: 14,
    //         cardDraw: 2,
    //         health: 100,
    //         maxHealth: 100,
    //         shield: 0,
    //       },
    //     },
    //     slot_1: null,
    //     slot_2: null,
    //     slot_3: null,
    //   },
    //   players: {
    //     slot_0: {
    //       uid: uid(),
    //       drawPile: [
    //         {
    //           uid: uid(),
    //           id: "WPN_SMALL_SWORD_TEST",
    //           type: CardType.Attack,
    //           cost: 0,
    //           discardType: DiscardTypes.Discard,
    //           targetType: TargetType.Enemy,
    //           effects: [
    //             {
    //               type: CardEffectTypes.Damage,
    //               target: "inherit",
    //               amount: 4,
    //               damageType: DamageTypes.Slashing,
    //             },
    //           ],
    //         },
    //         {
    //           uid: uid(),
    //           id: "WPN_SMALL_SWORD_TEST",
    //           type: CardType.Attack,
    //           cost: 0,
    //           discardType: DiscardTypes.Discard,
    //           targetType: TargetType.Enemy,
    //           effects: [
    //             {
    //               type: CardEffectTypes.Damage,
    //               target: "inherit",
    //               amount: 4,
    //               damageType: DamageTypes.Slashing,
    //             },
    //           ],
    //         },
    //         {
    //           uid: uid(),
    //           id: "WPN_SMALL_SWORD_TEST",
    //           type: CardType.Attack,
    //           cost: 0,
    //           discardType: DiscardTypes.Discard,
    //           targetType: TargetType.Enemy,
    //           effects: [
    //             {
    //               type: CardEffectTypes.Damage,
    //               target: "inherit",
    //               amount: 4,
    //               damageType: DamageTypes.Slashing,
    //             },
    //           ],
    //         },
    //       ],
    //       discardPile: [],
    //       vanishPile: [],
    //       hand: [],
    //       buffs: [],
    //       debuffs: [],
    //       enchantments: [],
    //       characterData: {
    //         id: "PlayerCharacter",
    //         speed: 16,
    //         cardDraw: 5,
    //         health: 65,
    //         maxHealth: 65,
    //         shield: 0,
    //       },
    //     },
    //     slot_1: null,
    //     slot_2: null,
    //     slot_3: null,
    //   },
    //   turnStack: [],
    // }),
    {
      renderType: "webgpu",
      adjustHeightForBannerAd: false,
      antialias: true,
      autoInitAnalytics: false,
      autoInitFirebase: false,
      autoResize: "either",
      autoSave: 1000,
      autoStart: false,
      backgroundAlpha: 1,
      backgroundColor: 0xfafafa,
      playerDataKeys: ["testKey1"],
      bootAssets: [
        {
          key: "whiskerweb",
          path: "whiskerweb.png",
          type: LoaderType.PIXI,
        },
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
      roundPixels: false,
      sharedLoader: false,
      sharedTicker: false,
      showFPSTracker: true,
      width: window.innerWidth,
    },
  );
}

main();
// main2();
