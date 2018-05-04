import * as d3 from "d3";
import { ISelection } from "./ISelection";

interface ImageSelectionCreateInfo {
    name: string;
    filePath: string;
}

export class ImageSelection extends ISelection {
    private domElementP: HTMLImageElement;
    private nameP: string;

    constructor(params: ImageSelectionCreateInfo) {
        super();
        this.domElementP = d3.create("img").attr("src", params.filePath).node() as HTMLImageElement;
        this.nameP = name;
    }

    public get name(): string {
        return this.nameP;
    }

    public get domElement(): HTMLElement {
        return this.domElementP;
    }
}
