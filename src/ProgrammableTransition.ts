import { Piece } from "./Piece";
import { State } from "./State";
import { Transition } from "./Transition";
import { WorldState } from "./WorldState";


export class ProgrammableTransition extends Transition {
    private dst: State;
    private chkFunc: (sigma: WorldState, p: Piece) => boolean;
    private runFunc: (sigma: WorldState, p: Piece) => void;

    constructor(dst: State, chkFunc: (sigma: WorldState, p: Piece) => boolean,
                runFunc: (sigma: WorldState, p: Piece) => void) {
        super();
        this.dst = dst;
        this.chkFunc = chkFunc;
        this.runFunc = runFunc;
    }

    public check(sigma: WorldState, p: Piece): boolean {
        return this.chkFunc(sigma, p);
    }

    public run(sigma: WorldState, p: Piece): void {
        return this.runFunc(sigma, p);
    }
    public get dstState(): State {
        return this.dst;
    }
}
