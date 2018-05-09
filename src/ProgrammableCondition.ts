import { Condition } from "./Condition";
import { WorldState } from "./WorldState";
import { Piece } from "./Piece";

export class ProgrammableCondition extends Condition {
    private runFunc: (sigma: WorldState, p: Piece) => boolean;
    private exprP: string;

    constructor(name: string, expr: string) {
        super(name);
        this.exprP = expr;
    }

    public eval(sigma: WorldState, p: Piece): boolean {
        return this.runFunc(sigma, p);
    }

    public get code(): string {
        return this.exprP;
    }

    public set code(source: string) {
        this.runFunc = eval(`(sigma, p) => { return ${source}}`);
        this.exprP = source;
    }
}
