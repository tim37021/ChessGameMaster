import * as d3 from "d3";

interface Image {
    name: string;
    filepath: string;
}

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

export class ImagePicker {
    private domElementP: HTMLElement;
    private images: Image[] = new Array();
    private selectionP: number = 0;
    private dx: number = 0;
    private animator: Animator = new Animator();
    private changedEvent: (idx: number) => void;

    constructor() {
        const node = d3.create("div").classed("image-picker", true).style("-webkit-box-align", "center")
            .style("-webkit-box-pack", "center").style("display", "-webkit-box");
        /*node.append("div").classed("navigate-left", true).style("position", "absolute")
            .on("mouseover", this.onScrollLeft.bind(this)).on("mouseout", this.animator.stop.bind(this.animator));
        node.append("div").classed("navigate-right", true).style("position", "absolute")
            .on("mouseover", this.onScrollRight.bind(this)).on("mouseout", this.animator.stop.bind(this.animator));*/
        this.domElementP = node.node() as HTMLElement;
    }

    public get domElement(): HTMLElement {
        return this.domElementP;
    }

    public get selectionIndex(): number {
        return this.selectionP;
    }

    public set selectionIndex(idx: number) {
        this.selectionP = idx;
        this.updateSelection();
    }

    public addImage(imname: string, filename: string): void {
        this.images.push({name: imname, filepath: filename});
    }

    public update(): void {

        d3.select(this.domElement).selectAll(".images")
            .data(this.images)
            .classed("selected", (d: Image, key: number) => {
                return ((key === this.selectionP));
            })
            .enter().append("div")
            .classed("images", true)
            .style("display", "inline-block")
            .style("left", "50%")
            .style("width", "128px")
            .style("height", "128px")
            .append("img")
            .attr("src", (d: Image) => { return d.filepath; } )
            .on("click", this.onClick.bind(this));
        this.updateTransform();
    }

    public on(eventName: string, cbk: (e: any) => void): void {
        if (eventName === "changed") {
            this.changedEvent = cbk;
        }
    }

    private updateTransform(): void {
        d3.select(this.domElement).selectAll(".images").transition()
            .style("transform", (img: Image, key: number) => {
                return `translate(${this.dx}px, 0px) scale(${this.selectionP === key ? "1.1" : "0.8"})`;
            });
    }

    private updateSelection(): void {
        d3.select(this.domElement).selectAll(".images").classed("selected", (d: Image, key: number) => {
            return ((key === this.selectionP));
        });
        const w = d3.select(this.domElement).node().getBoundingClientRect().width;
        if (this.images.length * 128 <= w) {
            this.dx = -this.selectionP * 128 + this.images.length * 128 / 2 - 64;
        } else {
            this.dx = -this.selectionP * 128 + w / 2 - 64;
        }
        this.updateTransform();
    }


    public get selection(): Image {
        return this.images[this.selectionP];
    }

    private onClick(e: Image, idx: number): void {
        if (this.selectionP !== idx) {
            this.selectionIndex = idx;
            this.changedEvent(this.selectionIndex);
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
