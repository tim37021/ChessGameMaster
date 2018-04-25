import * as d3 from "d3";
import { State } from "./State";
import { Transition } from "./Transition";
import { PieceState } from "./PieceState";
import { ProgrammableTransition } from "./ProgrammableTransition";

interface StateDiagramCreateInfo {
    width: string;
    height: string;
}

interface SelectedState {
    object: any;
    node: Element;
}

interface IPosition {
    x: number;
    y: number;
}

export class StateDiagram {
    public data: State[];
    private domElementP: SVGElement;
    private onDrag: any;
    private onClicked: any;
    private entryG: d3.Selection<d3.BaseType, {}, null, undefined>;
    private entryTG: d3.Selection<d3.BaseType, {}, null, undefined>;
    private entrySG: d3.Selection<d3.BaseType, {}, null, undefined>;
    private dragLine: d3.Selection<d3.BaseType, {}, null, undefined>;
    private cachedLinks: Transition[] = new Array();
    private selected: SelectedState = null;
    private dragState: State = null;
    private d: IPosition = {x: 0, y: 0};

    constructor(params: StateDiagramCreateInfo) {
        this.domElementP = d3.create("svg").attr("id", "state-diagram").style("width", params.width)
            .style("height", params.height).attr("focusable", "false").node() as SVGElement;

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

        d3.select(this.domElementP)
        .on("keydown", this.onKeydown.bind(this))
        .on("focus", () => { return; });

        this.entryG = d3.select(this.domElement).append("g");
        this.entryTG = this.entryG.append("g");
        this.entrySG = this.entryG.append("g");

        // displayed when dragging between nodes
        this.dragLine = this.entryG.append("svg:path")
        .attr("visibility", "hidden")
        .attr("class", "dragline")
        .attr("d", "M0,0L0,0")
        .style("marker-end", "url('#mark-end-arrow')");

        this.onDrag = d3.drag()
        .on("start", (elmnt: any, key: number, data: Element[]) => {
            d3.select(data[key]).raise();
            this.d = {x: elmnt.x, y: elmnt.y};
        })
        .on("drag", (elmnt: any, key: number, data: Element[]) => {
            if (d3.event.sourceEvent.shiftKey) {
                // data[key].dispatchEvent(new Event("mouseup"));
                this.d.x += d3.event.dx;
                this.d.y += d3.event.dy;
                this.dragState = (elmnt as State);
                this.dragLine
                .attr("visibility", null)
                .attr("d", `M${elmnt.x},${elmnt.y},L${this.d.x},${this.d.y}`);
            } else {
                this.dragLine.attr("visibility", "hidden");
                (elmnt as any).x += d3.event.dx;
                (elmnt as any).y += d3.event.dy;
                d3.select(data[key]).attr("transform", `translate(${(elmnt as any).x} ${(elmnt as any).y})`);
                this.entryTG.selectAll(".transition").data(this.cachedLinks)
                .attr("d", (l: any) => {
                    return `M${l.srcState.x},${l.srcState.y}L${l.dstState.x},${l.dstState.y}`;
                });
            }
        })
        .on("end", (elmnt: IPosition, key: number, data: Element[]) => {
            if (this.dragState == null) {
                return;
            }
            let mind: number;
            let minState: State = null;
            const srcState = this.dragState as any;
            this.data.forEach((state: any) => {
                const d = (this.d.x - state.x) * (this.d.x - state.x) +
                    (this.d.y - state.y) * (this.d.y - state.y);
                if (minState == null || mind > d) {
                    minState = state;
                    mind = d;
                }
            });
            if (mind < 2500) {
                this.dragState.transitionRules.push(
                    new ProgrammableTransition(minState, () => { return true; }, () => { return; }));
                this.update();
            }
            this.dragState = null;
            this.dragLine.attr("visibility", "hidden");
        });

        this.onClicked = (elmnt: IPosition, key: number, nodes: Element[]) => {
            if (this.selected !== null) {
                d3.select(this.selected.node).classed("selected", false);
            }
            this.selected = {object: elmnt, node: nodes[key]};
            d3.select(this.selected.node).classed("selected", true);
        };
    }

    public get domElement(): SVGElement {
        return this.domElementP;
    }

    public update(): void {
        this.updateCache();

        const transitions = this.entryTG.selectAll(".transition").data(this.cachedLinks);

        transitions.enter()
        .append("path")
        .classed("transition", true)
        .attr("d", (l: any) => {
            return `M${l.srcState.x},${l.srcState.y}L${l.dstState.x},${l.dstState.y}`;
        }).style("marker-end", "url('#end-arrow')")
        .on("click", this.onClicked.bind(this));

        transitions.exit().remove();

        const newGs = this.entrySG.selectAll(".state").data(this.data);
        newGs
        .attr("transform", (d: any) => `translate(${d.x}, ${d.y})`)
        .select("text")
        .text((d: State) => { return d.name; });

        const enterstate = newGs.enter()
        .append("g")
        .classed("state", true)
        .on("click", this.onClicked.bind(this))
        .call(this.onDrag);
        /*.on("mousedown", (elmnt: any) => {
            elmnt.dragged = true;
        })
        .on("mousemove", (elmnt: any) => {
            if (elmnt.dragged) {
                elmnt.x += d3.event.dx;
                elmnt.y += d3.event.dy;
            }
            this.update();
        })
        .on("mouseup", (elmnt: any) => {
            elmnt.dragged = false;
        });*/

        enterstate.append("circle")
        .attr("r", 50);

        enterstate.append("text")
        .attr("text-anchor", "middle")
        .text((d: State) => { return d.name; });

        newGs.exit().remove();
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

    private onKeydown(): void {
        if ((d3.event as KeyboardEvent).keyCode === 46) {
            if (this.selected.object instanceof State) {
                const idx = this.data.indexOf(this.selected.object);
                if (idx !== -1) {
                    this.data.splice(idx, 1);
                }
                // clear related state.
                this.data.forEach((state: State) => {
                    state.transitionRules = state.transitionRules.filter((t: Transition) => {
                        return this.selected.object !== t.dstState;
                    });
                });
                this.selected = null;
                this.update();
            } else if (this.selected.object instanceof Transition) {
                const tarState = ((this.selected.object as any).srcState as State);
                const index = tarState.transitionRules.indexOf(this.selected.object);
                if (index > -1) {
                    tarState.transitionRules.splice(index, 1);
                }
                this.selected.node.remove();
                this.selected = null;
                this.updateCache();
            }
        }

        if ((d3.event as KeyboardEvent).keyCode === 45) {
            this.data.push(new PieceState("UNTITLED", null));
            this.update();
        }
    }
}
