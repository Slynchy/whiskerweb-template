import { ICardInstance } from "../ICardInstance";
import { ICharacterData } from "../ICharacterData";
import { IBuffInstance } from "../IBuffInstance";
import { IDebuffInstance } from "../IDebuffInstance";
import { IEnchantmentInstance } from "../IEnchantmentInstance";

export interface ICharacter {
    uid: string;

    /**
     * The cards that can be played
     */
    drawPile: ICardInstance[];

    /**
     * The cards that have been played
     */
    discardPile: ICardInstance[];

    /**
     * The cards that have been played and exiled
     */
    vanishPile: ICardInstance[];

    /**
     * The cards that are going to be played (i.e. empty after their turn before round end)
     */
    hand: ICardInstance[];

    /**
     * Info such as health, speed, etc.
     */
    characterData: ICharacterData;

    buffs: IBuffInstance[];
    debuffs: IDebuffInstance[];
    enchantments: IEnchantmentInstance[];
}