import { TEnchantmentId } from "./SharedTypes";
import { ActionTypes } from "./Battle/ActionTypes";
import { ICardEffect } from "./ICardEffect";

export interface IEnchantmentInstance {
    id: TEnchantmentId;
    amount: number;
    triggersOn: ActionTypes;
    effects: ICardEffect[];
}