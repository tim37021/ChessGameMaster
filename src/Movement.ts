import {Piece} from "./Piece";
import {WorldState} from "./WorldState";
import { Condition } from "./Condition";

export abstract class Movement {
    private conditionsP: Condition[] = new Array();

    public abstract exec(sigma: WorldState, p: Piece): void;
    public abstract movable(sigma: WorldState, p: Piece): boolean;

    public abstract get isAttack(): boolean;

    public get hasCondition(): boolean {
        return this.conditionsP.length > 0;
    }

    public checkConditions(sigma: WorldState, p: Piece): boolean {
        for (const cond of this.conditionsP) {
            if (!cond.eval(sigma, p, this)) {
                return false;
            }
        }
        return true;
    }

    public get conditions(): Condition[] {
        return this.conditionsP;
    }

    public set conditions(conds: Condition[]) {
        this.conditionsP = conds;
    }

    public abstract getMovePosition(p: Piece): [number, number];
    public abstract getAttackPosition(p: Piece): [number, number];
    public abstract get descrption(): string;

}
