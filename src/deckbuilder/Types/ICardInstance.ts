import { CardType } from "./CardType";
import { TCardId } from "./SharedTypes";
import { TargetType } from "./TargetType";
import { ICardEffect } from "./ICardEffect";
import { DiscardTypes } from "./DiscardTypes";

export interface ICardInstance {
    uid: string;
    id: TCardId;
    type: CardType;
    discardType: DiscardTypes;
    cost: number;
    targetType: TargetType;
    effects: Array<ICardEffect>;
}