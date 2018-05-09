import { Piece } from "./Piece";
import { Transition } from "./Transition";
import { WorldState } from "./WorldState";
import { Movement } from "./Movement";

export abstract class State {
    public transitionRules: Transition[] = new Array();
    public name: string;

    constructor(name: string) {
        this.name = name;
    }

    public checkCandidateState(sigma: WorldState, p: Piece, m: Movement): State[] {
        const passed: State[] = [];
        this.transitionRules.forEach((r: Transition) => {
            if (r.checkConditions(sigma, p, m)) {
                passed.push(r.dstState);
            }
        });
        return passed;
    }
}
