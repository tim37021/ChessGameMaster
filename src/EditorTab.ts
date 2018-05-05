import * as THREE from "three";
import * as d3 from "d3";
import { ChessEditor } from "./ChessEditor";
import { StateDiagram } from "./StateDiagram";
import { Tab } from "./Tabstrip";
import { Picker } from "./Picker";
import { ImageSelection } from "./ImageSelection";
import { ModelPreviewer } from "./ModelPreviewer";
import { PieceState } from "./PieceState";
import { Piece } from "./Piece";

export class EditorTab extends Tab {
    private imgPicker: Picker;
    private meshPicker: Picker;
    private chessEditorP: ChessEditor;
    private stateEditor: StateDiagram;
    private workspaceDomElementP: HTMLElement = null;
    private lc: HTMLElement;
    private rc: HTMLElement;
    private defaultMesh: THREE.Mesh;

    constructor(name: string) {
        super(name);
        this.reinit();
    }

    public reinit() {
        if (this.workspaceDomElementP != null && this.workspaceDomElementP.parentElement != null) {
            this.workspaceDomElementP.parentElement.removeChild(this.workspaceDomElementP);
        }
        this.workspaceDomElementP = d3.create("div").classed("workspace", true)
            .style("display", "none").node() as HTMLElement;

        this.lc = d3.select(this.workspaceDomElementP).append("div")
            .classed("workspace-left-column", true).node() as HTMLElement;

        const sb = d3.select(this.lc).append("div").classed("sidebar", true);

        this.meshPicker = new Picker({imgWidth: 128, imgHeight: 128});
        sb.append("div").classed("meshpicker-container", true).append(() => { return this.meshPicker.domElement; });

        // create image picker
        this.imgPicker = new Picker({imgWidth: 64, imgHeight: 64});
        sb.append("div").classed("imgpicker-container", true).append(() => { return this.imgPicker.domElement; });

        // create mesh picker
        this.stateEditor = new StateDiagram({width: "100%", height: "100%"});
        sb.append("div").classed("sd-container", true).append(() => { return this.stateEditor.domElement; });

        this.rc = d3.select(this.workspaceDomElementP).append("div")
            .classed("workspace-right-column", true).node() as HTMLElement;

        this.chessEditorP = new ChessEditor({dims: [8, 8], width: 0, height: 1});
        this.rc.appendChild(this.chessEditorP.domElement);

        // share...
        this.stateEditor.states = this.chessEditorP.board.states;

        this.defaultMesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10),
            new THREE.MeshPhongMaterial({color: 0xFFFFFF}));

        this.setupEvents();
    }

    public get workspaceDomElement(): HTMLElement {
        return this.workspaceDomElementP;
    }

    public get chessEditor(): ChessEditor {
        return this.chessEditorP;
    }

    public set visible(val: boolean) {
        if (val) {
            d3.select(this.workspaceDomElementP).style("display", null);
        } else {
            d3.select(this.workspaceDomElementP).style("display", "none");
        }
    }

    public update(): void {
        this.chessEditorP.update();
    }

    public render(): void {
        this.chessEditorP.render();
    }

    public loadTexture(filename: string): void {
        this.chessEditor.registerTexture("UNTITLED", filename);
        this.imgPicker.selections.push(new ImageSelection({name: "UNTITLED", filePath: filename}));
        this.imgPicker.update();
    }

    public loadMesh(filename: string): void {
        this.chessEditor.registerGeometry("UNTITLED", filename, (mesh: THREE.Mesh) => {
            const mp = new ModelPreviewer({name: "UNTITLED", width: 128, height: 128});
            mp.mesh = mesh;
            mp.render();
            this.meshPicker.selections.push(mp);
            this.meshPicker.update();
            const newstate = new PieceState("UNTITLED", mesh);
            this.stateEditor.states.push(newstate);
            this.stateEditor.update();
        });
    }

    public on(ename: string, cbk: (args: any) => void) {
        if (ename === "message") {
            //
        }
    }

    private setupEvents(): void {
        this.chessEditorP.on("mapcursormaterial", (idx: number) => {
            this.imgPicker.selectionIndex = idx;
        });
        this.chessEditorP.on("previewstatechange", (idx: number) => {
            this.stateEditor.locateState(this.chessEditorP.board.states[idx]);
        });
        this.chessEditorP.on("pieceselectchange", (p: Piece) => {
            this.stateEditor.selectedState = p.state;
            this.stateEditor.locateState(p.state);
        });
        this.imgPicker.on("changed", (idx: number) => {
            this.chessEditorP.setPreviewMaterial(idx);
        });
        this.meshPicker.on("changed", (idx: number) => {
            this.chessEditor.setPreviewState(idx);
        });
        this.stateEditor.on("new", () => {
            return new PieceState("UNTITLED", this.defaultMesh);
        });
    }
}
