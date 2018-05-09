import {Piece} from "./Piece";
import {State} from "./State";
import {WorldState} from "./WorldState";
import { Condition } from "./Condition";
import { PieceState } from "./PieceState";
import { Movement } from "./Movement";

export abstract class Transition {
    private conditionsP: Condition[] = new Array();
    private dstStateP: State;
    constructor(dst: State) {
        this.dstStateP = dst;
    }
    public checkConditions(sigma: WorldState, p: Piece, m: Movement): boolean {
        for (const cond of this.conditionsP) {
            if (!cond.eval(sigma, p, m)) {
                return false;
            }
        }
        return true;
    }
    public run(sigma: WorldState, p: Piece): void {
        p.state = this.dstStateP as PieceState;
    }

    public get dstState(): State {
        return this.dstStateP;
    }
    public get conditions(): Condition[] {
        return this.conditionsP;
    }
}
