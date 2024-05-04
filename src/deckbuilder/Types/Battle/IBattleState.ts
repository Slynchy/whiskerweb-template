import { ITurnData } from "./ITurnData";
import { ICharacter } from "./ICharacter";
import { TSlotIds } from "../TSlotIds";
import { TSceneId } from "../TSceneId";

export interface IBattleState {

    currentTurn: string;
    turnStack: ITurnData[];
    actedCreatures: string[];
    roundCounter: number;
    sceneId: TSceneId;

    players: Record<TSlotIds, ICharacter | null>;
    enemies: Record<TSlotIds, ICharacter | null>;
}