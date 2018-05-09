import * as d3 from "d3";
import { FreeDeltaMovement, FreeDeltaMovementCreator } from "./FreeMovement";
import { PieceState } from "./PieceState";
import { Movement } from "./Movement";

interface MovementEditorEvents {
    onChanged?: (m: PieceState) => void;
}

export class MovementEditor {
    private d3root: d3.Selection<Element, undefined, null, undefined>;
    private innerBox: d3.Selection<d3.BaseType, undefined, null, undefined>;
    private targetP: PieceState = null;
    private selectedP: Movement = null;
    private fdcreator: FreeDeltaMovementCreator;
    private events: MovementEditorEvents = {};

    constructor() {
        this.d3root = d3.create("div").classed("movement-editor", true).attr("tabindex", "0");
        this.d3root
        .on("keydown", this.onKeydown.bind(this))
        .on("click", () => {
            d3.event.stopPropagation();
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
        });

        const outer = this.d3root.append("div").style("overflow-y", "scroll").style("max-height", "100%");
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

        this.fdcreator = new FreeDeltaMovementCreator();
        this.fdcreator.visible = false;
    }

    public update(): void {
        if (this.targetP == null) {
            this.innerBox.html("");
        }

        const entry = this.innerBox.selectAll(".movement").data(this.targetP.movements);

        entry.classed("selected", (elmnt) => {
            return elmnt === this.selectedP;
        }).on("click", (elmnt, i, nodes) => {
            d3.event.stopPropagation();
            this.selected = elmnt;
        }).each((elmnt, i, nodes) => {
            (elmnt as any).domElement = nodes[i];
        }).select("span").text((elmnt) => {
            return elmnt.descrption;
        });

        const newone = entry.enter()
        .insert("div", ".new-movement")
        .classed("movement", true)
        .each((elmnt, i, nodes) => {
            (elmnt as any).domElement = nodes[i];
        })
        .on("click", (elmnt, i, nodes) => {
            d3.event.stopPropagation();
            this.selected = elmnt;
        })
        .on("dblclick", (elmnt, i, nodes) => {
            d3.event.stopPropagation();
            this.fdcreator.visible = true;
            this.fdcreator.translate = [d3.event.clientX, d3.event.clientY];
        });
        newone.append("span").text((elmnt) => {
            return elmnt.descrption;
        });
        newone.append("div")
        .classed("movement-status", true);

        entry.exit().remove();
    }

    public get domElement(): HTMLDivElement {
        return this.d3root.node() as HTMLDivElement;
    }

    public get creatorDomElement(): HTMLDivElement {
        return this.fdcreator.domElement;
    }

    public set target(state: PieceState) {
        this.targetP = state;
        this.update();
    }

    public get target(): PieceState {
        return this.targetP;
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
