import { Condition } from "./Condition";
import { WorldState } from "./WorldState";
import { Piece } from "./Piece";
import * as tp from "typescript";
import { Movement } from "./Movement";
export class ProgrammableCondition extends Condition {
    private runFunc: (sigma: WorldState, p: Piece, m: Movement) => boolean;
    private exprP: string;

    constructor(name: string, expr: string) {
        super(name);
        this.code = expr;
    }

    public eval(sigma: WorldState, p: Piece, m: Movement): boolean {
        return this.runFunc(sigma, p, m);
    }

    public get code(): string {
        return this.exprP;
    }

    public set code(source: string) {
        let d: tp.Diagnostic[];
        const compiled = tp.transpile(`(sigma: any, p: any, m: any) => { return ${source}}`,
            {noEmitOnError: true}, undefined, d);
        console.log(d);
        console.log(compiled);
        this.runFunc = eval(compiled);
        this.exprP = source;
    }
}
