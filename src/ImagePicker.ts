import * as d3 from "d3";

interface Image {
    name: string;
    filepath: string;
}

export class ImagePicker {
    private domElementP: HTMLElement;
    private images: Image[];

    constructor() {
        d3.create("div").classed("image-picker", true);
    }

    public get domElement(): HTMLElement {
        return this.domElementP;
    }
}
