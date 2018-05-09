import { Piece } from "./Piece";
import { State } from "./State";
import { Transition } from "./Transition";
import { WorldState } from "./WorldState";

export class ProgrammableTransition extends Transition {
    private chkFunc: (sigma: WorldState, p: Piece) => boolean;
    private codeP: string;
    private runFunc: (sigma: WorldState, p: Piece) => void;

    constructor(dst: State, code: string) {
        super(dst);
        this.code = code;
    }

    public run(sigma: WorldState, p: Piece): void {
        super.run(sigma, p);
        this.runFunc(sigma, p);
    }

    public get code(): string {
        return this.codeP;
    }

    public set code(source: string) {
        this.runFunc = eval(source);
        this.codeP = source;
    }
}
