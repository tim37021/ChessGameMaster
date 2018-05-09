import * as d3 from "d3";
import { Condition } from "./Condition";
import { ProgrammableCondition } from "./ProgrammableCondition";

export class ConditionSelector {
    private conditionsP: Condition[] = [];
    private domElementP: d3.Selection<Element, undefined, null, undefined>;
    private innerBox: d3.Selection<d3.BaseType, undefined, null, undefined>;
    private selectedP: Condition[] = new Array();
    private editingCondition: Condition = null;
    private editingNode: d3.Selection<d3.BaseType, {}, null, undefined>;

    // Set a timer flag to toggle dbclick and disabl single click
    // Not used
    private dbstatus: boolean = false;
    private dbtimer: any;

    constructor() {
        this.domElementP = d3.create("div").classed("cond-selector", true).attr("tabindex", 0)
            .on("click", () => {
                if (this.editingCondition != null) {
                    (this.editingCondition as ProgrammableCondition).code =
                        this.editingNode.select(".editcontent").text();
                    this.editingNode.classed("edited", false).html("");
                    this.editingCondition = null;
                    this.update();
                }
            });
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
        .on("click", (elmnt, key, nodes) => {
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
            if (this.editingCondition !== elmnt) {
                if (this.editingCondition != null) {
                    (this.editingCondition as ProgrammableCondition).code =
                        this.editingNode.select(".editcontent").text();
                    this.editingNode.classed("edited", false).html("");
                    this.editingCondition = null;
                    this.update();
                }
            }
        }).on("dblclick", (elmnt, key, nodes) =>{
            if (d3.select(nodes[key]).classed("edited")){
                d3.select(nodes[key]).html("").append("a").text(elmnt.name);
            }
            d3.selectAll(".edited").classed("edited", false);
            d3.select(nodes[key]).classed("edited", true);
            d3.select(nodes[key])
            .append("div")
            .classed("editcontent", true)
            .attr("contenteditable", true)
            .text((elmnt as ProgrammableCondition).code);
            this.editingCondition = elmnt;
            this.editingNode = d3.select(nodes[key]);
        }).on("keydown", (elmnt, key, nodes) => {
            if (d3.event.key === "Enter") {
                if (this.editingCondition != null) {
                    (this.editingCondition as ProgrammableCondition).code =
                        this.editingNode.select(".editcontent").text();
                    this.editingNode.classed("edited", false).html("");
                    this.editingCondition = null;
                    this.update();
                }
            }
        }).each((elmnt, key, nodes) => {
            (elmnt as any).domElement = nodes[key];
        }).append("a")
        .text((elmnt) => {
            return elmnt.name;
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
