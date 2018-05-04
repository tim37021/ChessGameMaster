import * as d3 from "d3";

interface TabCreateInfo {
    name: string;
}

export class Tab {
    private nameP: string;
    private domElementP: HTMLElement = null;

    constructor(name: string) {
        this.name = name;
    }

    public get domElement(): HTMLElement {
        return this.domElementP;
    }

    public set domElement(node: HTMLElement) {
        this.domElementP = node;
    }

    public set name(newname: string) {
        this.nameP = newname;
        if (this.domElementP != null) {
            d3.select(this.domElementP).text(this.nameP);
        }
    }

    public get name(): string {
        return this.nameP;
    }
}

interface TabstripEvent {
    onTabChanged: (tab: Tab, lastTab: Tab) => void;
}

export class Tabstrip {
    private tabsP: Tab[] = new Array();
    private activeTabP: Tab = null;
    private events: TabstripEvent = {onTabChanged: null};
    private domElementP: HTMLElement;
    private tabOnClick: (d: Tab) => void;

    constructor() {
        this.domElementP = d3.create("div").classed("tabstrip", true).node() as HTMLElement;
        this.tabOnClick = (d: Tab) => {
            if (this.activeTabP != null) {
                d3.select(this.activeTabP.domElement).classed("selected", false);
            }
            if (this.events.onTabChanged != null) {
                this.events.onTabChanged(d, this.activeTabP);
            }
            this.activeTabP = d;
            d3.select(this.activeTabP.domElement).classed("selected", true);
        };
    }

    public on(ename: string, cbk: (params: any, params2: any) => void): void {
        if (ename === "tabchanged") {
            this.events.onTabChanged = cbk;
        }
    }

    public push(newtab: Tab): void {
        if (this.tabsP.indexOf(newtab) === -1) {
            this.tabsP.push(newtab);
            this.update();
        }
    }

    public get activeTab(): Tab {
        return this.activeTabP;
    }

    public set activeTab(t: Tab) {
        if (this.tabsP.indexOf(t) !== -1) {
            t.domElement.click();
        }
    }

    public get tabs(): Tab[] {
        return this.tabsP;
    }

    public get domElement(): HTMLElement {
        return this.domElementP;
    }

    private update(): void {
        const tabs = d3.select(this.domElementP).selectAll(".tab");
        const entry = tabs.data(this.tabsP);

        // remove and re-append
        entry.text((d: Tab, i: number, nodes: HTMLElement[]) => {
            d.domElement = nodes[i];
            return d.name;
        })
        .classed("selected", (d: Tab) => {
            return d === this.activeTabP;
        })
        .on("click", this.tabOnClick.bind(this));

        entry.enter()
        .append("div")
        .classed("tab", true)
        .text((d: Tab, i: number, nodes: HTMLElement[]) => {
            d.domElement = nodes[i];
            return d.name;
        })
        .classed("selected", (d: Tab) => {
            return d === this.activeTabP;
        })
        .on("click", this.tabOnClick.bind(this))
        .style("transform", "scale(0)")
        .transition()
        .duration(300)
        .style("transform", "scale(1)");

        entry.exit().remove();
    }
}
