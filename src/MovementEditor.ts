import * as d3 from "d3";
import { FreeDeltaMovement, FreeDeltaMovementCreator } from "./FreeMovement";
import { PieceState } from "./PieceState";
import { Movement } from "./Movement";
import { WorldState } from "./WorldState";
import { Piece } from "./Piece";

interface MovementEditorEvents {
    onChanged?: (m: PieceState) => void;
    onCondSelector?: (m: Movement) => void;
    onPreviewMaskChanged?: (mask: boolean[]) => void;
}

export class MovementEditor {
    private targetPieceP: Piece = null;
    private d3root: d3.Selection<Element, undefined, null, undefined>;
    private innerBox: d3.Selection<d3.BaseType, undefined, null, undefined>;
    private creatorBox: d3.Selection<d3.BaseType, undefined, null, undefined>;
    private targetP: PieceState = null;
    private selectedP: Movement = null;
    private fdcreator: FreeDeltaMovementCreator;
    private events: MovementEditorEvents = {};
    private sigma: WorldState;

    constructor(sigma: WorldState) {
        this.sigma = sigma;
        this.d3root = d3.create("div").classed("movement-editor", true).attr("tabindex", "0");
        this.d3root
        .on("keydown", this.onKeydown.bind(this))
        .on("click", () => {
            if (this.selectedP != null && this.fdcreator.visible) {
                const idx = this.targetP.movements.indexOf(this.selectedP);
                this.targetP.movements[idx] = this.fdcreator.get();
                this.update();
                if (this.events.onChanged) {
                    this.events.onChanged(this.targetP);
                }
            }
            this.selected = null;
            this.fdcreator.visible = false;
        })
        .on("mousemove", () => {
            // show all movement
            const mask: boolean[] = new Array(this.targetP.movements.length);
            mask.fill(true);
            if (this.events.onPreviewMaskChanged) {
                this.events.onPreviewMaskChanged(mask);
            }
        });
        this.fdcreator = new FreeDeltaMovementCreator();
        this.fdcreator.visible = false;

        const outer = this.d3root.append("div").classed("movement-outerbox", true)
            .style("overflow-y", "scroll").style("max-height", "100%");
        const creatorBox = this.d3root.append("div").classed("creator-outerbox", true);
        creatorBox.append(() => {return this.fdcreator.domElement; });
        this.innerBox = outer.append("div").classed("movement-container", true);
        this.innerBox.append("div")
        .classed("new-movement", true)
        .text("+")
        .on("click", () => {
            d3.event.stopPropagation();
            this.targetP.movements.push(
                new FreeDeltaMovement({dx: 0, dy: 0, isAttack: false, attackDx: 0, attackDy: 0}));
            if (this.events.onChanged) {
                this.events.onChanged(this.targetP);
            }
            this.update();
        });


    }

    public update(): void {
        if (this.targetP == null) {
            this.innerBox.html("");
        }

        const entry = this.innerBox.selectAll(".movement").data(this.targetP.movements);

        const msCbk = (elmnt: Movement) => {
            d3.event.stopPropagation();
            if (this.events.onCondSelector) {
                this.events.onCondSelector(elmnt);
            }
        };

        entry.classed("selected", (elmnt) => {
            return elmnt === this.selectedP;
        }).on("click", (elmnt, i, nodes) => {
            d3.event.stopPropagation();
            this.selected = elmnt;
        }).each((elmnt, i, nodes) => {
            (elmnt as any).domElement = nodes[i];
        });
        entry.select("span").text((elmnt) => {
            return elmnt.descrption;
        });
        entry.select(".movement-status")
        .classed("false", (m: Movement) => {
            return !(this.targetPieceP == null || m.checkConditions(this.sigma, this.targetPieceP));
        }).on("click", msCbk);

        const newone = entry.enter()
        .insert("div", ".new-movement")
        .classed("movement", true)
        .each((elmnt, i, nodes) => {
            (elmnt as any).domElement = nodes[i];
        })
        .on("mousemove", (elmnt) => {
            d3.event.stopPropagation();
            const mask: boolean[] = new Array(this.targetP.movements.length);
            mask.fill(false);
            mask[this.targetP.movements.indexOf(elmnt)] = true;
            if (this.events.onPreviewMaskChanged) {
                this.events.onPreviewMaskChanged(mask);
            }
        })
        .on("click", (elmnt, i, nodes) => {
            d3.event.stopPropagation();
            this.selected = elmnt;
        })
        .on("dblclick", (elmnt, i, nodes) => {
            d3.event.stopPropagation();
            this.fdcreator.visible = true;
        });
        newone.append("span").text((elmnt) => {
            return elmnt.descrption;
        });
        newone.append("div")
        .classed("movement-status", true)
        .classed("false", (m: Movement) => {
            return !(this.targetPieceP == null || m.checkConditions(this.sigma, this.targetPieceP));
        }).on("click", msCbk);

        entry.exit().remove();
    }

    public get domElement(): HTMLDivElement {
        return this.d3root.node() as HTMLDivElement;
    }

    public set target(state: PieceState) {
        this.targetP = state;
        this.update();
    }

    public get target(): PieceState {
        return this.targetP;
    }

    public set targetPiece(p: Piece) {
        this.targetPieceP = p;
        if (p.state !== this.targetP) {
            this.targetPieceP = null;
        }
    }

    public set visible(val: boolean) {
        this.d3root.style("display", val ? null : "none");
    }

    public set selected(m: Movement) {
        if (this.targetP != null) {
            if (this.selectedP != null) {
                d3.select((this.selectedP as any).domElement).classed("selected", false);
            }
            const idx = this.targetP.movements.indexOf(m);
            if (idx >= 0) {
                d3.select((m as any).domElement).classed("selected", true);
                this.selectedP = m;
            } else {
                this.selectedP = null;
            }
        }
    }

    public on(ename: string, cbk: (e: any) => void) {
        if (ename === "change") {
            this.events.onChanged = cbk;
        }
        if (ename === "condselector") {
            this.events.onCondSelector = cbk;
        }
        if (ename === "maskchange") {
            this.events.onPreviewMaskChanged = cbk;
        }
    }

    private onKeydown(): void {
        if (d3.event.keyCode === 46) {
            const idx = this.targetP.movements.indexOf(this.selectedP);
            this.targetP.movements.splice(idx, 1);
            if (this.events.onChanged) {
                this.events.onChanged(this.targetP);
            }
            this.selectedP = null;
            this.update();
        }
    }
}
