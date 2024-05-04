import { ActionTypes } from "./ActionTypes";
import { TCardId, TCreatureId } from "../SharedTypes";

export interface IAction {
    actor_uid: string;
    type: ActionTypes;
    targets: (TCardId | TCreatureId)[];
}