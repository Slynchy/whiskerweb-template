import { TBuffId } from "./SharedTypes";

export interface IBuffInstance {
    amount: number;
    buffId: TBuffId;
    source?: unknown;
}