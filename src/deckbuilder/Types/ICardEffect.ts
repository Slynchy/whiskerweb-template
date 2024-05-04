import { CardEffectTypes } from "./CardEffectTypes";
import { DamageTypes } from "./DamageTypes";
import { TBuffId, TDebuffId, TEnchantmentId } from "./SharedTypes";

export interface ICardEffect {
    type: CardEffectTypes;
    target: "inherit" | "self";
    amount: number;
    buffId?: TBuffId;
    debuffId?: TDebuffId;
    enchantmentId?: TEnchantmentId;
    damageType?: DamageTypes;
}