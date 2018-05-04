import * as d3 from "d3";
import { ISelection } from "./ISelection";
interface AnimatorInfo {
    initSpeed: number;
    maxSpeed: number;
    // in milisecond
    duration: number;
    resolution: number;
}

class Animator {
    private maxSpeed: number;
    private curSpeed: number;
    private acc: number;
    private duration: number;
    private resolution: number;
    private hwnd: NodeJS.Timer;

    public setup(params: AnimatorInfo): void {
        this.curSpeed = params.initSpeed;
        this.maxSpeed = params.maxSpeed;
        this.acc = (params.maxSpeed - params.initSpeed) / params.duration;
        this.duration = params.duration;
        this.resolution = params.resolution;
    }

    public start(cbk: (speed: number) => void): void {
        if (this.hwnd != null) {
            return;
        }
        const handler = () => {
            cbk(this.curSpeed);
            this.curSpeed += this.acc * (this.duration / this.resolution);
            if (Math.abs(this.curSpeed) >= Math.abs(this.maxSpeed)) {
                this.curSpeed = this.maxSpeed;
            }
        };
        this.hwnd = setInterval(handler, this.duration / this.resolution);
    }

    public stop(): void {
        clearInterval(this.hwnd);
        this.hwnd = null;
    }
}

interface PickerCreateInfo {
    imgWidth: number;
    imgHeight: number;
}

export class Picker {
    private imgWidth: number;
    private imgHeight: number;
    private domElementP: HTMLElement;
    private selectionsP: ISelection[] = new Array();
    private selectionIdxP: number = -1;
    private dx: number = 0;
    private animator: Animator = new Animator();
    private changedEvent: (idx: number) => void;

    constructor(params: PickerCreateInfo) {
        const node = d3.create("div").classed("picker", true).style("-webkit-box-align", "center")
            .style("-webkit-box-pack", "center").style("display", "-webkit-box");
        /*node.append("div").classed("navigate-left", true).style("position", "absolute")
            .on("mouseover", this.onScrollLeft.bind(this)).on("mouseout", this.animator.stop.bind(this.animator));
        node.append("div").classed("navigate-right", true).style("position", "absolute")
            .on("mouseover", this.onScrollRight.bind(this)).on("mouseout", this.animator.stop.bind(this.animator));*/
        this.domElementP = node.node() as HTMLElement;
        this.imgWidth = params.imgWidth;
        this.imgHeight = params.imgHeight;
    }

    public get domElement(): HTMLElement {
        return this.domElementP;
    }

    public get selectionIndex(): number {
        return this.selectionIdxP;
    }

    public set selectionIndex(idx: number) {
        this.selectionIdxP = idx;
        this.updateSelection();
    }

    /*
    public add(imname: string, filename: string): void {
        this.selections.push({name: imname, filepath: filename});
    }
*/

    public update(): void {

        d3.select(this.domElement).selectAll(".selection")
            .data(this.selectionsP)
            .classed("selected", (d: ISelection, key: number) => {
                return ((key === this.selectionIdxP));
            })
            .enter().append("div")
            .classed("selection", true)
            .style("display", "inline-block")
            .style("left", "50%")
            .style("width", this.imgWidth)
            .style("height", this.imgHeight)
            .append((d: ISelection) => { return d.domElement; })
            .on("click", this.onClick.bind(this));
        this.updateTransform();
    }

    public on(eventName: string, cbk: (e: any) => void): void {
        if (eventName === "changed") {
            this.changedEvent = cbk;
        }
    }

    private updateTransform(): void {
        d3.select(this.domElement).selectAll(".selection").transition()
            .style("transform", (img: Selection, key: number) => {
                return `translate(${this.dx}px, 0px) scale(${this.selectionIdxP === key ? "1.0" : "0.8"})`;
            });
    }

    private updateSelection(): void {
        d3.select(this.domElement).selectAll(".selection").classed("selected", (d: ISelection, key: number) => {
            return ((key === this.selectionIdxP));
        });
        const w = d3.select(this.domElement).node().getBoundingClientRect().width;
        if (this.selectionsP.length * this.imgWidth <= w) {
            this.dx = -this.selectionIdxP * this.imgWidth +
                this.selectionsP.length * this.imgWidth / 2 - this.imgWidth / 2;
        } else {
            this.dx = -this.selectionIdxP * this.imgWidth + w / 2 - this.imgWidth / 2;
        }
        this.updateTransform();
    }


    public get selection(): ISelection {
        return this.selectionsP[this.selectionIdxP];
    }

    public get selections(): ISelection[] {
        return this.selectionsP;
    }

    private onClick(e: ISelection, idx: number): void {
        if (this.selectionIdxP !== idx) {
            this.selectionIndex = idx;
            if (this.changedEvent != null) {
                this.changedEvent(this.selectionIndex);
            }
        } else {
            this.selectionIndex = idx;
        }
    }

    private onScrollLeft(): void {
        this.dx += -500;
        this.updateTransform();
    }

    private onScrollRight(): void {
        this.dx += 500;
        this.updateTransform();
    }
}
