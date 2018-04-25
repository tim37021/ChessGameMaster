import { Piece } from "./Piece";
import { Transition } from "./Transition";
import { WorldState } from "./WorldState";

export abstract class State {
    public transitionRules: Transition[] = new Array();
    public name: string;

    constructor(name: string) {
        this.name = name;
    }

    public checkCandidateState(sigma: WorldState, p: Piece): State[] {
        const passed: State[] = [];
        this.transitionRules.forEach((r: Transition) => {
            if (r.check(sigma, p)) {
                passed.push(r.dstState);
            }
        });
        return passed;
    }
}
