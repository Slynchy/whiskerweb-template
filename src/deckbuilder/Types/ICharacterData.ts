import { TCreatureId } from "./SharedTypes";

export interface ICharacterData {
    id: TCreatureId;
    speed: number;
    health: number;
    cardDraw: number;
    maxHealth: number;
    shield: number;
}