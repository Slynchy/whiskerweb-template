import { IBattleState } from "../Types/Battle/IBattleState";
import { ICharacter } from "../Types/Battle/ICharacter";
import { ActionTypes } from "../Types/Battle/ActionTypes";
import { ICardInstance } from "../Types/ICardInstance";
import { TargetType } from "../Types/TargetType";
import { ICardEffect } from "../Types/ICardEffect";
import { CardEffectTypes } from "../Types/CardEffectTypes";
import { TBuffId, TCreatureId, TDebuffId } from "../Types/SharedTypes";
import { DiscardTypes } from "../Types/DiscardTypes";
import { DamageTypes } from "../Types/DamageTypes";
import { TSlotIds } from "../Types/TSlotIds";
import { ITurnData } from "../Types/Battle/ITurnData";
import {
  buttonify,
  Container,
  Engine,
  GameObject,
  Graphics,
  HelperFunctions,
  Helpers,
  LoaderType,
  Sprite,
  State,
  Text,
  TextStyle,
} from "whiskerweb";
import { CharacterObject } from "../GameObjects/CharacterObject";
import { CardObject } from "../GameObjects/CardObject";
import { TurnOrderObject } from "../Prefabs/TurnOrderObject";

const __LOGMODE = true;
const log = __LOGMODE
  ? function (...args: any[]) {
      console.log(...args);
    }
  : function () {};

export class BattleState extends State {
  public onResize(_engine: Engine, _params?: unknown): void {}

  private blockInput: boolean = false;

  private roundCounter = 0;
  private state: IBattleState;

  public currentTurnText: Text;
  public playerObjects: Record<TSlotIds, CharacterObject>;
  public enemyObjects: Record<TSlotIds, CharacterObject>;
  public playerCardPool: Array<CardObject> = [];
  public endTurnButton: GameObject;

  public turnOrderObject: TurnOrderObject;

  constructor(_initialState: IBattleState) {
    super();
    this.state = Object.assign({}, _initialState);
  }

  async onAwake(_engine: Engine, _params?: unknown): Promise<void> {
    _engine.getTicker().start();

    BattleState.createUI(this, async () => {
      if (this.blockInput) return;

      this.state = BattleState.executeTurnEnd(
        this.state,
        this.state.currentTurn,
      );
      if (!BattleState.isPlayersTurn(this.state)) {
        this.state = await BattleState.simulateUntilPlayerTurn(this);
      }
      this.state = BattleState.setupTurn(this.state, this.state.currentTurn);
      await BattleState.updateUI(this);
    });
    await BattleState.updateUI(this);

    // execute first turn action ("Combat start")
    this.state = BattleState.executeCombatStart(this.state);
    this.state = BattleState.executeRoundStart(this.state);
    // figure out the turn order
    const turnOrder = BattleState.getTurnOrderFromState(this.state);
    // make it the fastest characters turn
    this.state.currentTurn = turnOrder[0].uid;
    this.state = await BattleState.simulateUntilPlayerTurn(this);

    await BattleState.updateUI(this);
    this.state = BattleState.setupTurn(this.state, this.state.currentTurn);
    await BattleState.updateUI(this);
  }

  static setupTurn(_state: IBattleState, _target: TCreatureId): IBattleState {
    let res = Object.assign({}, _state);

    const characterData = BattleState.getCharactersFromState(res, _target)[0];
    let drawPile: ICardInstance[] = characterData.drawPile;
    let hand: ICardInstance[] = characterData.hand;
    let discardPile: ICardInstance[] = characterData.discardPile;
    // if(characterData.drawPile.length > characterData.characterData.cardDraw) {
    // more cards in drawpile than carddraw, can just slice the array
    // } else
    if (
      characterData.drawPile.length + characterData.discardPile.length <
      characterData.characterData.cardDraw
    ) {
      log("Creature %s can't draw enough cards, repopulating", _target);
      console.warn(discardPile);
      hand = [...drawPile, ...discardPile];
      drawPile = [];
      discardPile = [];
      characterData.hand = hand;
      characterData.discardPile = discardPile;
      characterData.drawPile = drawPile;
      return res;
    } else if (
      characterData.drawPile.length <= characterData.characterData.cardDraw
    ) {
      // empty drawpile -> generate new drawpile -> draw remainder of cards
      hand.push(...drawPile);
      drawPile = [...discardPile];
    }
    while (hand.length < characterData.characterData.cardDraw) {
      hand.push(characterData.drawPile.pop());
    }
    characterData.hand = hand;
    characterData.discardPile = discardPile;
    characterData.drawPile = drawPile;

    return res;
  }

  static async updateUI(_instance: BattleState): Promise<void> {
    _instance.turnOrderObject.update(
      BattleState.getTurnOrderFromState(_instance.state),
    );
    _instance.turnOrderObject.position.set(
      -(_instance.turnOrderObject.width * 0.5) +
        ENGINE.getRenderManager().width * 0.5,
      12,
    );

    _instance.enemyObjects.slot_0.updateFromState(
      _instance.state.enemies.slot_0,
    );
    _instance.enemyObjects.slot_1.updateFromState(
      _instance.state.enemies.slot_1,
    );
    _instance.enemyObjects.slot_2.updateFromState(
      _instance.state.enemies.slot_2,
    );
    _instance.enemyObjects.slot_3.updateFromState(
      _instance.state.enemies.slot_3,
    );
    _instance.playerObjects.slot_0.updateFromState(
      _instance.state.players.slot_0,
    );
    _instance.playerObjects.slot_1.updateFromState(
      _instance.state.players.slot_1,
    );
    _instance.playerObjects.slot_2.updateFromState(
      _instance.state.players.slot_2,
    );
    _instance.playerObjects.slot_3.updateFromState(
      _instance.state.players.slot_3,
    );

    _instance.currentTurnText.text = `Current turn: ${_instance.state.currentTurn}`;

    if (BattleState.isPlayersTurn(_instance.state)) {
      BattleState.showPlayerHand(
        _instance,
        _instance.state.currentTurn,
        BattleState.getCharactersFromState(
          _instance.state,
          _instance.state.currentTurn,
        )[0].hand,
      );
    }

    _instance.blockInput = true;
    return HelperFunctions.wait(1000).then(() => {
      _instance.blockInput = false;
    });
  }

  static showPlayerHand(
    _instance: BattleState,
    _playerId: TCreatureId,
    _hand: Array<ICardInstance>,
  ): void {
    _instance.playerCardPool.forEach((e) => (e.visible = false));
    for (let i = 0; i < _hand.length; i++) {
      const cardData = _hand[i];
      const cardObj = _instance.playerCardPool[i];
      cardObj.visible = true;
      cardObj.update(cardData, () => {
        if (_instance.blockInput) return;
        _instance.state = BattleState.playCard_player(
          _instance.state,
          _playerId,
          cardData,
        );
        BattleState.updateUI(_instance);
      });
      cardObj.position.set(
        ENGINE.getRenderManager().width * 0.5 +
          i * (180 + 5) +
          (180 + 5) * -Math.floor(_hand.length * 0.5),
        cardObj.position.y,
      );
    }
  }

  static playCard_player(
    _state: IBattleState,
    _playerId: TCreatureId,
    _cardData: ICardInstance,
    _target?: TCreatureId,
  ): IBattleState {
    let res: IBattleState = Object.assign({}, _state);
    let creature = BattleState.getCharactersFromState(res, _playerId)[0];
    const currTargets: TCreatureId[] =
      BattleState.getValidTargetIdsForNPCFromTargetType(
        res,
        _playerId,
        _cardData.targetType,
      );
    if (_target && currTargets.indexOf(_target) === -1) {
      console.log("Invalid target");
    }
    res.turnStack[res.turnStack.length - 1].stack.push({
      actor_uid: _playerId,
      targets: currTargets,
      type: ActionTypes.PlayCard,
    });
    _cardData.effects.forEach((e) => {
      res = BattleState.executeCardEffectOnTarget(
        res,
        e,
        _playerId,
        currTargets,
      );
    });
    creature = BattleState.getCharactersFromState(res, _playerId)[0];
    // if(_card.type === CardType.Attack) {
    //
    // } else if(_card.type === CardType.Magic) {
    //
    // } else if(_card.type === CardType.Skill) {
    //
    // } else {
    //     throw new Error(`Unknown card type: ${_card.type}`);
    // }

    switch (_cardData.discardType) {
      case DiscardTypes.Discard:
        creature.drawPile = [_cardData, ...creature.drawPile];
        break;
      case DiscardTypes.Vanish:
        creature.discardPile = [...creature.discardPile, _cardData];
        break;
    }
    creature.hand.splice(
      creature.hand.findIndex((e) => e.uid === _cardData.uid),
      1,
    );

    return res;
  }

  static createUI(_instance: BattleState, _onEndTurnClicked: () => void): void {
    // bg
    const texture = ENGINE.getTexture(`${_instance.state.sceneId}_SCENE`);
    const bg = new Sprite(texture);
    bg.anchor.set(0.5, 0.5);
    bg.position.set(
      Math.round(ENGINE.getRenderManager().width * 0.5),
      Math.round(ENGINE.getRenderManager().height * 0.5),
    );
    HelperFunctions.smartScale2D(
      {
        x: ENGINE.getRenderManager().width,
        y: undefined,
      },
      bg,
    );
    _instance.scene.addObject(bg);

    const currentTurnText = (_instance.currentTurnText = new Text({
      text: "Current turn: %s",
      style: {
        fill: 0xff0000,
        fontSize: 22,
        fontWeight: "bold",
        fontFamily: "Arial",
        align: "center",
      },
    }));
    currentTurnText.anchor.set(0.5, 0.5);
    currentTurnText.position.set(ENGINE.getRenderManager().width * 0.5, 40);
    _instance.scene.addObject(currentTurnText);

    const turnOrderObj = (_instance.turnOrderObject = new TurnOrderObject());
    _instance.scene.addObject(turnOrderObj);

    // enemies
    const enemies: Record<TSlotIds, CharacterObject> = (_instance.enemyObjects =
      {
        slot_0: new CharacterObject("enemy_slot_0"),
        slot_1: new CharacterObject("enemy_slot_1"),
        slot_2: new CharacterObject("enemy_slot_2"),
        slot_3: new CharacterObject("enemy_slot_3"),
      });
    // players
    const players: Record<TSlotIds, CharacterObject> =
      (_instance.playerObjects = {
        slot_0: new CharacterObject("player_slot_0"),
        slot_1: new CharacterObject("player_slot_1"),
        slot_2: new CharacterObject("player_slot_2"),
        slot_3: new CharacterObject("player_slot_3"),
      });

    // enemies
    Object.keys(enemies).forEach((e: TSlotIds, i) => {
      const enemyObj = enemies[e];
      _instance.scene.addObject(enemyObj as GameObject);
      enemyObj.position.set(
        ENGINE.getRenderManager().width - (4 - i) * 100,
        ENGINE.getRenderManager().height * 0.5,
      );
    });
    Object.keys(players).forEach((e: TSlotIds, i) => {
      const playerObj = players[e];
      _instance.scene.getStage().addChild(playerObj);
      playerObj.position.set(
        (4 - i) * 100,
        ENGINE.getRenderManager().height * 0.5,
      );
    });

    // todo: create player cards here
    const len = 20;
    const cardContainer = new Container();
    cardContainer.sortableChildren = true;
    _instance.scene.addObject(cardContainer);
    for (let i = 0; i < len; i++) {
      const card = new CardObject();
      card.position.set(
        0,
        // (tsthreeConfig.width * 0.5) +
        //     (i * 135) +
        //     (135 * -Math.floor(len * 0.5)),
        ENGINE.getRenderManager().height * 0.98,
      );
      card.visible = false;
      cardContainer.addChild(card);
      _instance.playerCardPool.push(card);
    }

    const endTurnButton = (_instance.endTurnButton = new GameObject());
    const endTurnButtonBg = new Graphics()
      .stroke({ width: 2, color: 0xff0000 })
      .rect(0, 0, 150, 40);
    endTurnButton.addChild(endTurnButtonBg);
    endTurnButton.position.set(
      ENGINE.getRenderManager().width - 200,
      ENGINE.getRenderManager().height - 100,
    );
    const endTurnButtonText = new Text(
      "End turn",
      new TextStyle({
        fill: "#ff0000",
        fontFamily: "Arial",
        fontSize: 32,
      }),
    );
    buttonify(endTurnButton, {
      onFire: () => _onEndTurnClicked(),
    });
    endTurnButtonText.anchor.set(0.5, 0.5);
    endTurnButtonText.position.set(75, 20);
    endTurnButton.addChild(endTurnButtonText);
    _instance.scene.addObject(endTurnButton);
  }

  static async simulateUntilPlayerTurn(
    _instance: BattleState,
  ): Promise<IBattleState> {
    // let res = cloneObj(_instance.state);

    while (!BattleState.isPlayersTurn(_instance.state)) {
      _instance.state = await BattleState.executeTurn_npc(_instance);
      await BattleState.updateUI(_instance);
    }

    log("It is now the players turn");

    return _instance.state;
  }

  static executeTurnStart(
    _state: IBattleState,
    _charId: TCreatureId,
  ): IBattleState {
    let res = Object.assign({}, _state);
    log("Executing turn start for %s", _charId);
    return res;
  }

  static executeTurnEnd(
    _state: IBattleState,
    _charId: TCreatureId,
  ): IBattleState {
    let res = Object.assign({}, _state);
    log("Executing turn end for %s", _charId);

    const hand = BattleState.getHandFromCharacter(_state, _charId);
    if (hand.length > 0) {
      // move hand to discard
      const discardPile = BattleState.getDiscardPileFromCharacter(
        _state,
        _charId,
      );
      discardPile.push(...hand);
    }

    res.actedCreatures.push(res.currentTurn);
    let turnOrder = BattleState.getTurnOrderFromState(res);
    if (turnOrder.filter((e) => e.hasActed === false).length === 0) {
      res = BattleState.executeRoundEnd(res);
      res = BattleState.executeRoundStart(res);
      turnOrder = BattleState.getTurnOrderFromState(res);
    }
    res.currentTurn = turnOrder[0].uid;
    return res;
  }

  static getDiscardPileFromCharacter(
    _state: IBattleState,
    _characterId: TCreatureId,
  ): ICardInstance[] {
    return BattleState.getCharactersFromState(_state, _characterId)[0]
      .discardPile;
  }

  static getHandFromCharacter(
    _state: IBattleState,
    _characterId: TCreatureId,
  ): ICardInstance[] {
    return BattleState.getCharactersFromState(_state, _characterId)[0].hand;
  }

  static async playCardsInHand_npc(
    _instance: BattleState,
    _creatureId: string,
  ): Promise<IBattleState> {
    // let res: IBattleState = cloneObj(_instance.state);
    log("Playing hand for NPC %s", _creatureId);
    while (
      BattleState.getHandFromCharacter(_instance.state, _creatureId).length !==
      0
    ) {
      let hand = BattleState.getHandFromCharacter(_instance.state, _creatureId);
      log("Playing card %s for NPC %s", hand[hand.length - 1].id, _creatureId);
      _instance.state = BattleState.executeCard_npc(
        _instance.state,
        _creatureId,
        hand[hand.length - 1].uid,
      );
      await BattleState.updateUI(_instance);
      hand = BattleState.getHandFromCharacter(_instance.state, _creatureId);
      const card = hand.pop();
      const discardPile = BattleState.getDiscardPileFromCharacter(
        _instance.state,
        _creatureId,
      );
      discardPile.push(card);
    }
    return _instance.state;
  }

  /**
   * This function is for NPCs only! Use .setupTurn/.endTurn for players
   * A turn is described as:
   * Starting with the TurnStart action for that character
   * Playing their cards sequentially
   * Ending with the TurnEnd action, with the currentTurn being set to the next character
   * @param _instance
   */
  static async executeTurn_npc(_instance: BattleState): Promise<IBattleState> {
    // let res: IBattleState = cloneObj(_instance.state);

    log("Starting turn for %s", _instance.state.currentTurn);

    const creatureId: string = BattleState.getAllCreaturesIdsFromState(
      _instance.state,
    ).find((e) => e === _instance.state.currentTurn);

    const turn: ITurnData = {
      stack: [],
    };
    _instance.state.turnStack.push(turn);

    _instance.state = BattleState.executeTurnStart(_instance.state, creatureId);
    await BattleState.updateUI(_instance);
    turn.stack.push({
      actor_uid: creatureId,
      targets: [],
      type: ActionTypes.StartTurn,
    });

    // play the NPCs hand
    _instance.state = await BattleState.playCardsInHand_npc(
      _instance,
      creatureId,
    );

    turn.stack.push({
      actor_uid: creatureId,
      targets: [],
      type: ActionTypes.EndTurn,
    });

    // Turn order stuff
    _instance.state = BattleState.executeTurnEnd(_instance.state, creatureId);

    return _instance.state;
  }

  static isCreatureIdAPlayer(
    _state: IBattleState,
    _creatureId: string,
  ): boolean {
    return (
      _state.players.slot_0?.uid === _creatureId ||
      _state.players.slot_1?.uid === _creatureId ||
      _state.players.slot_2?.uid === _creatureId ||
      _state.players.slot_3?.uid === _creatureId
    );
  }

  static getValidTargetIdsForNPCFromTargetType(
    _state: IBattleState,
    _playerId: string,
    _targetType: TargetType,
  ): string[] {
    const res: string[] = [];
    const validPlayerIds = [
      _state.players.slot_0?.uid,
      _state.players.slot_1?.uid,
      _state.players.slot_2?.uid,
      _state.players.slot_3?.uid,
    ].filter((e) => Boolean(e));
    const validEnemyIds = [
      _state.enemies.slot_0?.uid,
      _state.enemies.slot_1?.uid,
      _state.enemies.slot_2?.uid,
      _state.enemies.slot_3?.uid,
    ].filter((e) => Boolean(e));

    switch (_targetType) {
      case TargetType.RandomHero:
      case TargetType.AllHeroes:
      case TargetType.BackHero:
      case TargetType.FrontHero:
      case TargetType.Hero:
      case TargetType.MiddleHero:
        if (validPlayerIds.length === 0) {
          return res;
        }
        break;
      case TargetType.Enemy:
      case TargetType.RandomEnemy:
      case TargetType.AllEnemies:
      case TargetType.FrontEnemy:
      case TargetType.BackEnemy:
      case TargetType.MiddleEnemy:
        if (validEnemyIds.length === 0) {
          return res;
        }
        break;
    }

    switch (_targetType) {
      case TargetType.AllEnemies:
        if (_state.enemies.slot_0) {
          res.push(_state.enemies.slot_0.uid);
        }
        if (_state.enemies.slot_1) {
          res.push(_state.enemies.slot_1.uid);
        }
        if (_state.enemies.slot_2) {
          res.push(_state.enemies.slot_2.uid);
        }
        if (_state.enemies.slot_2) {
          res.push(_state.enemies.slot_2.uid);
        }
        break;
      case TargetType.AllHeroes:
        if (_state.players.slot_0) {
          res.push(_state.players.slot_0.uid);
        }
        if (_state.players.slot_1) {
          res.push(_state.players.slot_1.uid);
        }
        if (_state.players.slot_2) {
          res.push(_state.players.slot_2.uid);
        }
        if (_state.players.slot_2) {
          res.push(_state.players.slot_2.uid);
        }
        break;
      case TargetType.Self:
        res.push(_playerId);
        break;
      case TargetType.RandomEnemy:
      case TargetType.Enemy:
        // some random enemy
        res.push(
          validEnemyIds[Math.floor(Math.random() * validEnemyIds.length)],
        );
        break;
      case TargetType.RandomHero:
        res.push(
          validPlayerIds[Math.floor(Math.random() * validPlayerIds.length)],
        );
        break;
      case TargetType.FrontHero:
        res.push(validPlayerIds[0]);
        break;
      case TargetType.BackHero:
        res.push(validPlayerIds[validPlayerIds.length - 1]);
        break;
      case TargetType.MiddleHero:
        switch (validPlayerIds.length) {
          case 1:
          case 2:
            res.push(
              validPlayerIds[Math.floor(Math.random() * validPlayerIds.length)],
            );
            break;
          case 3:
            res.push(validPlayerIds[1]);
            break;
          case 4:
            res.push(validPlayerIds[Math.ceil(Math.random() * 2)]);
            break;
          default:
            throw new Error(
              "Invalid amount of valid player IDs: " + validEnemyIds.length,
            );
        }
        break;
      case TargetType.FrontEnemy:
        res.push(validEnemyIds[0]);
        break;
      case TargetType.BackEnemy:
        res.push(validEnemyIds[validEnemyIds.length - 1]);
        break;
      case TargetType.MiddleEnemy:
        switch (validEnemyIds.length) {
          case 1:
          case 2:
            res.push(
              validEnemyIds[Math.floor(Math.random() * validEnemyIds.length)],
            );
            break;
          case 3:
            res.push(validEnemyIds[1]);
            break;
          case 4:
            res.push(validEnemyIds[Math.ceil(Math.random() * 2)]);
            break;
          default:
            throw new Error(
              "Invalid amount of valid enemy IDs: " + validEnemyIds.length,
            );
        }
        break;
    }
    return res;
  }

  static findCardById(_state: IBattleState, _cardId: string): ICardInstance {
    const playerKeys = Object.keys(_state.players);
    const enemyKeys = Object.keys(_state.enemies);
    for (let i = 0; i < playerKeys.length; i++) {
      const e: TSlotIds = playerKeys[i] as TSlotIds;
      const found =
        _state.players[e]?.hand.find((e) => e.uid === _cardId) ||
        _state.players[e]?.drawPile.find((e) => e.uid === _cardId) ||
        _state.players[e]?.discardPile.find((e) => e.uid === _cardId) ||
        _state.players[e]?.vanishPile.find((e) => e.uid === _cardId);
      if (found) return found;
    }
    for (let i = 0; i < enemyKeys.length; i++) {
      const e = enemyKeys[i] as TSlotIds;
      const found =
        _state.enemies[e]?.hand.find((e) => e.uid === _cardId) ||
        _state.enemies[e]?.drawPile.find((e) => e.uid === _cardId) ||
        _state.enemies[e]?.discardPile.find((e) => e.uid === _cardId) ||
        _state.enemies[e]?.vanishPile.find((e) => e.uid === _cardId);
      if (found) return found;
    }
    throw new Error("Failed to find card of ID: " + _cardId);
  }

  static executeCard_npc(
    _state: IBattleState,
    _playerId: string,
    _cardId: string,
  ): IBattleState {
    let res = Object.assign({}, _state);
    const _card = BattleState.findCardById(res, _cardId);
    const creature = BattleState.getCharactersFromState(res, _playerId)[0];
    const currTargets: TCreatureId[] =
      BattleState.getValidTargetIdsForNPCFromTargetType(
        res,
        _playerId,
        _card.targetType,
      );
    res.turnStack[res.turnStack.length - 1].stack.push({
      actor_uid: _playerId,
      targets: currTargets,
      type: ActionTypes.PlayCard,
    });
    _card.effects.forEach((e) => {
      res = BattleState.executeCardEffectOnTarget(
        res,
        e,
        _playerId,
        currTargets,
      );
    });
    // if(_card.type === CardType.Attack) {
    //
    // } else if(_card.type === CardType.Magic) {
    //
    // } else if(_card.type === CardType.Skill) {
    //
    // } else {
    //     throw new Error(`Unknown card type: ${_card.type}`);
    // }

    switch (_card.discardType) {
      case DiscardTypes.Discard:
        creature.drawPile = [_card, ...creature.drawPile];
        break;
      case DiscardTypes.Vanish:
        creature.discardPile = [...creature.discardPile, _card];
        break;
    }

    return res;
  }

  static applyHealing(
    _state: IBattleState,
    _targetId: string,
    _amount: number,
    _source?: unknown,
  ): IBattleState {
    let res = Object.assign({}, _state);
    log("Applying %i heal to %s", _amount, _targetId);
    const target = BattleState.getCharactersFromState(_state, _targetId)[0];
    let heal = _amount;
    target.characterData.health = Math.max(
      target.characterData.health + heal,
      target.characterData.maxHealth,
    );

    return res;
  }

  static applyDamage(
    _state: IBattleState,
    _targetId: string,
    _damageType: DamageTypes,
    _amount: number,
    _source?: unknown,
  ): IBattleState {
    let res = Object.assign({}, _state);

    log(
      "Applying %i damage of type %s to %s",
      _amount,
      DamageTypes[_damageType],
      _targetId,
    );

    const target = BattleState.getCharactersFromState(res, _targetId)[0];
    let damage = _amount;

    if (target.characterData.shield > 0) {
      damage = Math.max(_amount - target.characterData.shield, 0);
      target.characterData.shield = Math.max(
        target.characterData.shield - _amount,
        0,
      );
    }

    target.characterData.health -= damage;

    log("Target %s now has %i health", target.uid, target.characterData.health);

    return res;
  }

  static applyDebuff(
    _state: IBattleState,
    _targetId: string,
    _debuffId: TDebuffId,
    _amount: number,
    _source?: unknown,
  ): IBattleState {
    let res = Object.assign({}, _state);

    const target = BattleState.getCharactersFromState(_state, _targetId)[0];
    target.debuffs.push({
      debuffId: _debuffId,
      amount: _amount,
      source: _source,
    });

    return res;
  }

  static applyBuff(
    _state: IBattleState,
    _targetId: string,
    _buffId: TBuffId,
    _amount: number,
    _source?: unknown,
  ): IBattleState {
    let res = Object.assign({}, _state);

    const target = BattleState.getCharactersFromState(_state, _targetId)[0];
    target.buffs.push({
      buffId: _buffId,
      amount: _amount,
      source: _source,
    });

    return res;
  }

  static getCharactersFromState(
    _state: IBattleState,
    _id: string | string[],
  ): ICharacter[] {
    const res: ICharacter[] = [];

    if (_state.players.slot_0) {
      res.push(_state.players.slot_0);
    }
    if (_state.players.slot_1) {
      res.push(_state.players.slot_1);
    }
    if (_state.players.slot_2) {
      res.push(_state.players.slot_2);
    }
    if (_state.players.slot_3) {
      res.push(_state.players.slot_3);
    }
    if (_state.enemies.slot_0) {
      res.push(_state.enemies.slot_0);
    }
    if (_state.enemies.slot_1) {
      res.push(_state.enemies.slot_1);
    }
    if (_state.enemies.slot_2) {
      res.push(_state.enemies.slot_2);
    }
    if (_state.enemies.slot_3) {
      res.push(_state.enemies.slot_3);
    }

    if (Array.isArray(_id)) {
      return res.filter((e) => _id.includes(e.uid));
    } else {
      return [res.find((e) => e.uid === _id)];
    }
  }

  static executeCardEffectOnTarget(
    _state: Readonly<IBattleState>,
    _cardEffect: ICardEffect,
    _playerId: string,
    _targetIds: string[],
  ): IBattleState {
    let res = Object.assign({}, _state);
    log(
      "Executing card effect of type %s of amount %i against %o",
      CardEffectTypes[_cardEffect.type],
      _cardEffect.amount,
      _targetIds,
    );

    // let targets: ICharacter[];
    // if(_cardEffect.target === "inherit") {
    //     targets = BattleState.getCharactersFromState(_targetIds, _state);
    // } else if(_cardEffect.target === "self") {
    //     targets = BattleState.getCharactersFromState([_playerId], _state);
    // } else {
    //     throw new Error(`Unknown card target: ${_cardEffect.target}`);
    // }

    switch (_cardEffect.type) {
      case CardEffectTypes.ApplyBuff:
        if (typeof _cardEffect.buffId === "undefined") {
          throw new Error(
            `Missing buff ID on card effect: ${JSON.stringify(_cardEffect)}`,
          );
        }
        _targetIds.forEach((e) => {
          res = BattleState.applyBuff(
            res,
            e,
            _cardEffect.buffId,
            _cardEffect.amount,
            _playerId,
          );
        });
        break;
      case CardEffectTypes.ApplyDebuff:
        if (typeof _cardEffect.debuffId === "undefined") {
          throw new Error(
            `Missing debuff ID on card effect: ${JSON.stringify(_cardEffect)}`,
          );
        }
        _targetIds.forEach((e) => {
          res = BattleState.applyDebuff(
            res,
            e,
            _cardEffect.debuffId,
            _cardEffect.amount,
            _playerId,
          );
        });
        break;
      case CardEffectTypes.ApplyEnchantment:
        if (typeof _cardEffect.enchantmentId === "undefined") {
          throw new Error(
            `Missing enchant ID on card effect: ${JSON.stringify(_cardEffect)}`,
          );
        }
        break;
      case CardEffectTypes.Damage:
        if (typeof _cardEffect.damageType === "undefined") {
          throw new Error(
            `Missing damage type on card effect: ${JSON.stringify(
              _cardEffect,
            )}`,
          );
        }
        _targetIds.forEach((e) => {
          res = BattleState.applyDamage(
            res,
            e,
            _cardEffect.damageType,
            _cardEffect.amount,
            _playerId,
          );
        });
        break;
      case CardEffectTypes.Heal:
        _targetIds.forEach((e) => {
          res = BattleState.applyHealing(res, e, _cardEffect.amount, _playerId);
        });
        break;
    }

    return res;
  }

  static isPlayersTurn(_state: IBattleState): boolean {
    return (
      _state.currentTurn === _state.players.slot_0?.uid ||
      _state.currentTurn === _state.players.slot_1?.uid ||
      _state.currentTurn === _state.players.slot_2?.uid ||
      _state.currentTurn === _state.players.slot_3?.uid
    );
  }

  static executeCombatStart(_state: IBattleState): IBattleState {
    let res = Object.assign({}, _state);
    log("Executing first turn");

    _state.turnStack.push({
      stack: [
        {
          actor_uid: "",
          type: ActionTypes.CombatStart,
          targets: [],
        },
      ],
    });

    // todo: Add iteration over player items and activate if combat start

    return res;
  }

  static executeRoundEnd(_state: IBattleState): IBattleState {
    let res = Object.assign({}, _state);

    log("Executing round end");

    res.actedCreatures = [];

    res.turnStack.push({
      stack: [
        {
          actor_uid: "",
          type: ActionTypes.RoundEnd,
          targets: [],
        },
      ],
    });

    return res;
  }

  static executeRoundStart(_state: IBattleState): IBattleState {
    let res = Object.assign({}, _state);
    res.roundCounter++;

    log("Executing round start");

    // Move enemy cards back to their hand
    for (let e = 0; e < 4; e++) {
      const enemy = res.enemies[`slot_${e}` as TSlotIds];
      if (enemy) {
        enemy.hand = [];
        enemy.drawPile = [...enemy.discardPile, ...enemy.drawPile];
        for (let i = 0; i < enemy.characterData.cardDraw; i++) {
          enemy.hand.push(res.enemies.slot_0.drawPile.pop());
        }
      }
    }

    res.turnStack.push({
      stack: [
        {
          actor_uid: "",
          type: ActionTypes.RoundStart,
          targets: [],
        },
      ],
    });

    return res;
  }

  static getAllCreaturesFromState(_state: IBattleState): Array<ICharacter> {
    return [
      _state.enemies.slot_0,
      _state.enemies.slot_1,
      _state.enemies.slot_2,
      _state.enemies.slot_3,
      _state.players.slot_0,
      _state.players.slot_1,
      _state.players.slot_2,
      _state.players.slot_3,
    ].filter((e) => Boolean(e));
  }

  static getAllCreaturesIdsFromState(_state: IBattleState): Array<string> {
    return [
      _state.enemies.slot_0?.uid,
      _state.enemies.slot_1?.uid,
      _state.enemies.slot_2?.uid,
      _state.enemies.slot_3?.uid,
      _state.players.slot_0?.uid,
      _state.players.slot_1?.uid,
      _state.players.slot_2?.uid,
      _state.players.slot_3?.uid,
    ].filter((e) => Boolean(e));
  }

  static getTurnOrderFromState(_state: IBattleState): Array<{
    uid: string;
    speed: number;
    creatureId: TCreatureId;
    hasActed: boolean;
  }> {
    return BattleState.getAllCreaturesFromState(_state)
      .map((e) => {
        return {
          uid: e.uid,
          speed: e.characterData.speed,
          creatureId: e.characterData.id,
          hasActed: _state.actedCreatures.indexOf(e.uid) !== -1,
        };
      })
      .sort((a, b) => {
        return b.speed - a.speed;
      })
      .sort((a, b) => {
        if (a.hasActed === b.hasActed) return 0; // If both have the same "hasActed" status, keep their original order
        if (a.hasActed) return 1; // If a has acted, move it to the end
        if (!a.hasActed) return -1; // If a has not acted, move it to the beginning
      });
    // .filter((e) => {
    //     return _state.actedCreatures.findIndex((i) => e.uid === i) === -1;
    // });
  }

  onStep(_engine: Engine) {
    super.onStep(_engine);
  }

  preload(_engine: Engine): Promise<void> {
    const bgKey = `${this.state.sceneId}_SCENE`;
    const assets = [
      {
        key: bgKey,
        path: `sprites/Scenes/${this.state.sceneId}/bg.png`,
        type: LoaderType.PIXI,
      },
    ];
    if (!_engine.hasPIXIResource("MediEvilSpritesheet")) {
      assets.push(
        ...[
          {
            key: "MediEvilSpritesheet",
            path: "sprites/Spritesheets/medievil_card_game.json",
            type: LoaderType.PIXI,
          },
        ],
      );
    }
    if (!_engine.hasPIXIResource("CreaturesSpritesheet")) {
      assets.push(
        ...[
          {
            key: "CreaturesSpritesheet",
            path: "sprites/Spritesheets/Creatures/medievil_creatures.json",
            type: LoaderType.PIXI,
          },
        ],
      );
    }
    if (!_engine.hasPIXIResource("CardsSpritesheet")) {
      assets.push(
        ...[
          {
            key: "CardsSpritesheet",
            path: "sprites/Spritesheets/Cards/medievil_cards.json",
            type: LoaderType.PIXI,
          },
        ],
      );
    }

    return _engine.loadAssets(assets);
  }
}
