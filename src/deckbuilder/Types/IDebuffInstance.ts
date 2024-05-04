import { TDebuffId } from "./SharedTypes";

export interface IDebuffInstance {
    amount: number;
    debuffId: TDebuffId;
    source?: unknown;
}