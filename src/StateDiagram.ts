import * as d3 from "d3";
import { State } from "./State";
import { Transition } from "./Transition";
import { PieceState } from "./PieceState";
import { ProgrammableTransition } from "./ProgrammableTransition";

interface StateDiagramCreateInfo {
    width: string;
    height: string;
}

interface IPosition {
    x: number;
    y: number;
}

interface IStateDiagramEvent {
    onStateSelected: (state: State) => void;
    onTransitionSelected: (state: Transition) => void;
    onNewState: () => State;
}

export class StateDiagram {
    private statesP: State[] = new Array();
    private domElementP: SVGElement;
    private onDrag: any;
    private onClicked: (elmnt: Transition, i: number, nodes: Element[]) => void;
    private zoomer: d3.Selection<d3.BaseType, {}, null, undefined>;
    private entryG: d3.Selection<d3.BaseType, {}, null, undefined>;
    private entryTG: d3.Selection<d3.BaseType, {}, null, undefined>;
    private entrySG: d3.Selection<d3.BaseType, {}, null, undefined>;
    private dragLine: d3.Selection<d3.BaseType, {}, null, undefined>;
    private cachedLinks: Transition[] = new Array();
    private selectedP: any = null;
    private dragState: State = null;
    private d: IPosition = {x: 0, y: 0};
    private events: IStateDiagramEvent = {onStateSelected: null, onTransitionSelected: null, onNewState: null};
    private zoom: d3.ZoomBehavior<Element, {}>;

    constructor(params: StateDiagramCreateInfo) {
        this.domElementP = d3.create("svg").classed("state-diagram", true).style("width", params.width)
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
        this.zoom = d3.zoom()
        .scaleExtent([1 / 2, 4])
        .on("zoom", zoomed);
        this.zoomer = d3.select(this.domElementP).append("rect")
        .attr("width", params.width)
        .attr("height", params.height)
        .style("fill", "gray")
        .style("pointer-events", "all")
        .call(this.zoom);

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
            this.statesP.forEach((state: any) => {
                const d = (this.d.x - state.x) * (this.d.x - state.x) +
                    (this.d.y - state.y) * (this.d.y - state.y);
                if (minState == null || mind > d) {
                    minState = state;
                    mind = d;
                }
            });
            if (mind < 2500) {
                if (this.dragState.transitionRules.filter((d: Transition) => d.dstState === minState).length === 0) {
                    this.dragState.transitionRules.push(
                        new ProgrammableTransition(minState, () => { return true; }, () => { return; }));
                    this.update();
                }
            }
            this.dragState = null;
            this.dragLine.attr("visibility", "hidden");
        });

        this.onClicked = (elmnt: any, i: number, nodes: Element[]) => {
            if (this.selectedP != null) {
                const dom = this.selectedP.domElement;
                d3.select(dom).classed("selected", false);
            }
            if (this.selectedP !== elmnt) {
                if (elmnt instanceof State && this.events.onStateSelected !== null) {
                    this.events.onStateSelected(elmnt);
                }
                if (elmnt instanceof Transition && this.events.onTransitionSelected !== null) {
                    this.events.onTransitionSelected(elmnt);
                }
            }
            this.selectedP = elmnt;
            d3.select(nodes[i]).classed("selected", true);
            d3.select(nodes[i]).raise();
        };

    }

    public get domElement(): SVGElement {
        return this.domElementP;
    }

    public set states(arr: State[]) {
        this.statesP = arr;
        this.update();
    }

    public get states(): State[] {
        return this.statesP;
    }

    public update(): void {
        this.updateCache();

        const transitions = this.entryTG.selectAll(".transition").data(this.cachedLinks);

        transitions.attr("d", (l: any) => {
            return `M${l.srcState.x},${l.srcState.y}L${l.dstState.x},${l.dstState.y}`;
        });

        transitions
        .enter()
        .append("path")
        .classed("transition", true)
        .style("marker-end", "url('#end-arrow')")
        .attr("d", (l: any) => {
            return `M${l.srcState.x},${l.srcState.y}L${l.dstState.x},${l.dstState.y}`;
        })
        .on("click", this.onClicked.bind(this))
        .each((data: Transition, i: number, nodes: Element[]) => {
            (data as any).domElement = nodes[i];
        });

        transitions.exit().remove();

        const newGs = this.entrySG.selectAll(".state").data(this.statesP);
        newGs
        .attr("transform", (d: any) => `translate(${d.x}, ${d.y})`)
        .select("text")
        .text((d: State) => { return d.name; });

        const enterstate = newGs.enter()
        .append("g")
        .attr("transform", (d: any) => `translate(${d.x}, ${d.y})`)
        .classed("state", true)
        .on("click", this.onClicked.bind(this))
        .on("dblclick", (elmnt) => {
            this.locateState(elmnt);
        })
        .call(this.onDrag)
        .each((data: State, i: number, nodes: Element[]) => {
            (data as any).domElement = nodes[i];
        });
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
        .attr("r", "1")
        .transition()
        .duration(300)
        .attr("r", 50);

        enterstate.append("text")
        .attr("text-anchor", "middle")
        .text((d: State) => { return d.name; });

        newGs.exit().remove();
    }

    public on(ename: string, cbk: (e: any) => void): void {
        if (ename === "selectstate") {
            this.events.onStateSelected = cbk;
        } else if (ename === "selecttransition") {
            this.events.onTransitionSelected = cbk;
        } else if (ename === "select") {
            this.events.onStateSelected = cbk;
            this.events.onTransitionSelected = cbk;
        } else if (ename === "new") {
            this.events.onNewState = cbk.bind(null);
        }
    }

    public set selectedState(state: State) {
        const idx = this.statesP.indexOf(state);
        if (idx !== -1) {
            // find out the node corresponding to the state and center it
            /*let ans: Element = null;
            let mind = 0;

            this.entrySG.selectAll(".state").each((dummy, i, nodes) => {
                const t = this.parseTranslate(d3.select(nodes[i]).attr("transform"));
                const d = ((state as any).x - t[0]) * ((state as any).x - t[0])
                    + ((state as any).y - t[1]) * ((state as any).y - t[1]);
                if (ans == null || mind > d) {
                    ans = nodes[i] as Element;
                    mind = d;
                }
            });*/

            if (this.selectedP != null) {
                d3.select(this.selectedP.domElement).classed("selected", false);
            }
            d3.select((state as any).domElement).classed("selected", true);
            this.selectedP = state;
        }
    }

    public get selected(): Transition | State {
        return this.selectedP;
    }

    public locateState(state: State): void {
        if (this.statesP.indexOf(state) === -1) {
            return;
        }
        const transform = this.entryG.attr("transform");
        const translate = this.parseTranslate(transform);
        const scale = this.parseScale(transform);
        const mid = [this.domElement.clientWidth / 2, this.domElement.clientHeight / 2];

        this.entryG.transition().duration(300)
        .attr("transform",
        `translate(${mid[0] - scale * (state as any).x}, ${mid[1] - scale * (state as any).y}) scale(${scale})`)
        .on("end", () => {
            this.zoomer.call(this.zoom.translateTo, (state as any).x, (state as any).y);
        });
    }

    private parseTranslate(attr: string): [number, number] {
        const reg = /translate\(([-+]?[0-9]*\.?[0-9]+),\s*([-+]?[0-9]*\.?[0-9]+)\)/;
        const match = reg.exec(attr);
        if (match != null) {
            return [Number(match[1]), Number(match[2])];
        }
        return [0, 0];
    }

    private parseScale(attr: string): number {
        const reg = /scale\(([0-9]+\.?[0-9]*)\)/;
        const match = reg.exec(attr);
        if (match != null) {
            return Number(match[1]);
        }
        return 1;
    }

    private updateCache(): void {
        this.cachedLinks = [];
        // add new member in transition rule and push it into links
        this.statesP.forEach((state: State) => {
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
            if (this.selectedP.object == null) {
                return;
            }
            if (this.selectedP.object instanceof State) {
                const idx = this.statesP.indexOf(this.selectedP.object);
                if (idx !== -1) {
                    this.statesP.splice(idx, 1);
                }

                this.statesP.forEach((state: State) => {
                    state.transitionRules = state.transitionRules.filter((t: Transition) => {
                        return this.selectedP.object !== t.dstState;
                    });
                });
                this.selectedP = null;
                this.update();
            } else if (this.selectedP.object instanceof Transition) {
                const tarState = ((this.selectedP.object as any).srcState as State);
                const index = tarState.transitionRules.indexOf(this.selectedP.object);
                if (index > -1) {
                    tarState.transitionRules.splice(index, 1);
                }
                this.selectedP.node.remove();
                this.selectedP = null;
                this.updateCache();
            }
        }

        if ((d3.event as KeyboardEvent).keyCode === 45) {
            // clear related state.
            const newstate = this.events.onNewState();

            const mid = [this.domElement.clientWidth / 2, this.domElement.clientHeight / 2];
            const transform = this.entryG.attr("transform");
            const translate = this.parseTranslate(transform);
            const scale = this.parseScale(transform);

            // insert members
            (newstate as any).x = (mid[0] - translate[0]) / scale;
            (newstate as any).y = (mid[1] - translate[1]) / scale;

            this.statesP.push(newstate);
            this.update();
            this.selectedState = newstate;
            // this.locateState(newstate);
        }
    }
}
