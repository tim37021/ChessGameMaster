import {Piece} from "./Piece";
import {State} from "./State";
import {WorldState} from "./WorldState";

export abstract class Transition {
    public abstract check(sigma: WorldState, p: Piece): boolean;
    public abstract run(sigma: WorldState, p: Piece): void;
    abstract get finalState(): State;
}
