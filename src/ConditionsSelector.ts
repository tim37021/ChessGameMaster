import * as d3 from "d3";
import { Condition } from "./Condition";

export class ConditionSelector {
    private conditionsP: Condition[] = null;
    private domElementP: d3.Selection<Element, undefined, null, undefined>;
    private innerBox: d3.Selection<d3.BaseType, undefined, null, undefined>;
    private selectedP: Condition[] = new Array();

    constructor() {
        this.domElementP = d3.create("div").classed("cond-selector", true);
        this.innerBox = this.domElementP.append("div");
    }

    public update(): void {
        const entry = this.innerBox.selectAll(".condition").data(this.conditionsP);
        entry
        .text((elmnt) => {
            return elmnt.name;
        }).each((elmnt, key, nodes) => {
            (elmnt as any).domElement = nodes[key];
        });

        entry.enter()
        .append("div")
        .classed("condition", true)
        .text((elmnt) => {
            return elmnt.name;
        }).on("click", (elmnt, key, nodes) => {
            d3.event.stopPropagation();
            const sel = !d3.select(nodes[key]).classed("selected");
            d3.select(nodes[key]).classed("selected", sel);
            const idx = this.selectedP.indexOf(elmnt);
            if (sel) {
                if (idx === -1) {
                    this.selectedP.push(elmnt);
                }
            } else {
                if (idx > -1) {
                    this.selectedP.splice(idx, 1);
                }
            }
        }).each((elmnt, key, nodes) => {
            (elmnt as any).domElement = nodes[key];
        });

        entry.exit().remove();
    }

    public clearSelections(): void {
        this.domElementP.selectAll(".condition").classed("selected", false);
    }

    public get selected(): Condition[] {
        return this.selectedP;
    }

    public get domElement(): HTMLDivElement {
        return this.domElementP.node() as HTMLDivElement;
    }

    public set conditions(conds: Condition[]) {
        this.conditionsP = conds;
    }

    public set visible(val: boolean) {
        this.domElementP.style("display", val ? null : "none");
    }
}
