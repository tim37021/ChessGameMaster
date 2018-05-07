import {Piece} from "./Piece";
import {WorldState} from "./WorldState";

export abstract class Movement {
    private cond: (sigma: WorldState, p: Piece) => boolean = null;

    public abstract exec(sigma: WorldState, p: Piece): void;
    public abstract movable(sigma: WorldState, p: Piece): boolean;

    public get hasCondition(): boolean {
        return this.cond != null;
    }

    public checkCondition(sigma: WorldState, p: Piece): boolean {
        return this.cond(sigma, p);
    }

    public set condition(cond: (sigma: WorldState, p: Piece) => boolean) {
        this.cond = cond;
    }

    public abstract get descrption(): string;

}
