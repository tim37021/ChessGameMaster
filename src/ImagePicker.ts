import * as d3 from "d3";

interface Image {
    name: string;
    filepath: string;
}

export class ImagePicker {
    private domElementP: HTMLElement;
    private images: Image[] = new Array();
    private selectionP: number;

    constructor() {
        const data = [4, 8, 15, 16, 23];
        const node = d3.create("div").classed("image-picker", true);
        node.append("div").classed("navigate-left", true).style("position", "absolute");
        node.append("div").classed("navigate-right", true).style("position", "absolute");
        this.domElementP = node.node() as HTMLElement;
    }

    public get domElement(): HTMLElement {
        return this.domElementP;
    }

    addImage(imname: string, filename: string): void {
        this.images.push({name: imname, filepath: filename});
    }

    public update(): void {
        d3.select(this.domElement).selectAll(".images")
            .data(this.images)
            .attr("class", (d: Image, key: number) => { return (key==this.selectionP)?"selected": "not-selected"; })
            .classed("images", true)
            .enter().append("div")
            .classed("images", true)
            .style("display", "inline-block")
            .style("width", "128px")
            .style("height", "128px")
            .append("img")
            .attr("src", (d: Image) => { return d.filepath; })
            .on("click", this.onClick.bind(this));
    }
    
    public get selection(): Image {
        return this.images[this.selectionP];
    }

    public get selectionIndex(): number {
        return this.selectionP;
    }

    private onClick(e: Image, idx: number): void {
        this.selectionP = idx;
        this.update();
    }
}
