import { WorldState } from "./WorldState";
import { Piece } from "./Piece";
import { Movement } from "./Movement";

export abstract class Condition {
    private nameP: string;
    constructor(name: string) {
        this.nameP = name;
    }
    public abstract eval(sigma: WorldState, p: Piece, m: Movement): boolean;

    public get name(): string {
        return this.nameP;
    }
}
