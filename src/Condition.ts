import { WorldState } from "./WorldState";
import { Piece } from "./Piece";

export abstract class Condition {
    private nameP: string;
    constructor(name: string) {
        this.nameP = name;
    }
    public abstract eval(sigma: WorldState, p: Piece): boolean;

    public get name(): string {
        return this.nameP;
    }
}
