import * as d3 from "d3";
import { FreeDeltaMovement } from "./FreeMovement";
import { PieceState } from "./PieceState";
import { Movement } from "./Movement";


export class MovementEditor {
    private d3root: d3.Selection<Element, undefined, null, undefined>;
    private innerBox: d3.Selection<d3.BaseType, undefined, null, undefined>;
    private targetP: PieceState = null;
    private selectedP: Movement = null;

    constructor() {
        this.d3root = d3.create("div").classed("movement-editor", true).attr("tabindex", "0");
        this.d3root.on("keydown", this.onKeydown.bind(this));

        const outer = this.d3root.append("div").style("overflow-y", "scroll").style("max-height", "100%");
        this.innerBox = outer.append("div").classed("movement-container", true);
        this.innerBox.append("div")
        .classed("new-movement", true)
        .text("+")
        .on("click", () => {
            this.targetP.movements.push(
                new FreeDeltaMovement({dx: 0, dy: 0, isAttack: false, attackDx: 0, attackDy: 0}));
            this.update();
        });
    }

    public update(): void {
        if (this.targetP == null) {
            this.innerBox.html("");
        }

        const entry = this.innerBox.selectAll(".movement").data(this.targetP.movements);

        entry.text((elmnt) => {
            return elmnt.descrption;
        }).classed("selected", (elmnt) => {
            return elmnt === this.selectedP;
        }).on("click", (elmnt, i, nodes) => {
            this.selected = elmnt;
        }).each((elmnt, i, nodes) => {
            (elmnt as any).domElement = nodes[i];
        });

        entry.enter()
        .insert("div", ".new-movement")
        .classed("movement", true)
        .text((elmnt) => {
            return elmnt.descrption;
        })
        .each((elmnt, i, nodes) => {
            (elmnt as any).domElement = nodes[i];
        })
        .on("click", (elmnt, i, nodes) => {
            this.selected = elmnt;
        });

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

    public set visible(val: boolean) {
        this.d3root.style("display", val ? null : "none");
    }

    public set selected(m: Movement) {
        if (this.targetP != null) {
            const idx = this.targetP.movements.indexOf(m);
            if (idx >= 0) {

                if (this.selectedP != null) {
                    d3.select((this.selectedP as any).domElement).classed("selected", false);
                }
                d3.select((m as any).domElement).classed("selected", true);
                this.selectedP = m;
            }
        }
    }

    private onKeydown(): void {
        if (d3.event.keyCode === 46) {
            const idx = this.targetP.movements.indexOf(this.selectedP);
            this.targetP.movements.splice(idx, 1);
            this.selectedP = null;
            this.update();
        }
    }
}
