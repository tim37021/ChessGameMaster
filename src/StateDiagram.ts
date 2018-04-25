import * as d3 from "d3";
import { State } from "./State";
import { Transition } from "./Transition";

interface StateDiagramCreateInfo {
    width: string;
    height: string;
}

export class StateDiagram {
    public data: State[];
    private domElementP: SVGElement;
    private onDrag: any;
    private entryG: d3.Selection<d3.BaseType, {}, null, undefined>;
    private cachedLinks: Transition[] = new Array();

    constructor(params: StateDiagramCreateInfo) {
        this.domElementP = d3.create("svg").attr("id", "state-diagram").style("width", params.width)
            .style("height", params.height).node() as SVGElement;

        const defs = d3.select(this.domElementP).append("svg:defs");
        defs.append("svg:marker")
            .attr("id", "end-arrow")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", "32")
            .attr("markerWidth", 3.5)
            .attr("markerHeight", 3.5)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");
        defs.append("svg:marker")
            .attr("id", "mark-end-arrow")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 7)
            .attr("markerWidth", 3.5)
            .attr("markerHeight", 3.5)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");

        const zoomed = () => {
            this.entryG.attr("transform", d3.event.transform);
        };

        // create rect first then g
        d3.select(this.domElementP).append("rect")
        .attr("width", params.width)
        .attr("height", params.height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .call(d3.zoom()
            .scaleExtent([1 / 2, 4])
            .on("zoom", zoomed));

        this.entryG = d3.select(this.domElement).append("g");

        this.onDrag = d3.drag().on("start", (elmnt: State, key: number, data: Element[]) => {
            //
        })
        .on("drag", (elmnt: State, key: number, data: Element[]) => {
            (elmnt as any).x = d3.event.x - 25;
            (elmnt as any).y = d3.event.y - 25;
            d3.select(data[key]).attr("transform", `translate(${d3.event.x - 25} ${d3.event.y - 25})`);

            this.entryG.selectAll(".transition").data(this.cachedLinks)
            .attr("d", (l: any) => {
                return `M${l.srcState.x},${l.srcState.y}L${l.dstState.x},${l.dstState.y}`;
            });
        })
        .on("end", (elmnt: Element, key: number, data: Element[]) => {
            //
        });
    }

    public get domElement(): SVGElement {
        return this.domElementP;
    }

    public update(): void {
        this.updateCache();

        this.entryG.selectAll(".transition")
        .data(this.cachedLinks)
        .enter()
        .append("path")
        .classed("transition", true)
        .attr("d", (l: any) => {
            return `M${l.srcState.x},${l.srcState.y}L${l.dstState.x},${l.dstState.y}`;
        }).style("marker-end", "url('#end-arrow')")
        .on("mousedown", (elmnt: Transition, key: number, node: Element[]) => {
            if (d3.event.button === 0) {
                const tarState = ((elmnt as any).srcState as State);
                const index = tarState.transitionRules.indexOf(elmnt);
                if (index > -1) {
                    tarState.transitionRules.splice(index, 1);
                }
                node[key].remove();
            }
            this.updateCache();
        });


        const newGs = this.entryG.selectAll(".state")
        .data(this.data)
        .enter()
        .append("g")
        .classed("state", true)
        .call(this.onDrag);


        newGs.append("circle")
        .attr("r", 50);

        newGs.append("text")
        .attr("text-anchor", "middle")
        .text((d: State) => { return d.name; });
    }

    public on(ename: string, cbk: (e: any) => void): void {
        //
    }

    private updateCache(): void {
        this.cachedLinks = [];
        // add new member in transition rule and push it into links
        this.data.forEach((state: State) => {
            if ((state as any).x === undefined) {
                (state as any).x = 0;
                (state as any).y = 0;
            }
            state.transitionRules.forEach((t: Transition) => {
                (t as any).srcState = state;
                this.cachedLinks.push(t);
            });
        });
    }
}
