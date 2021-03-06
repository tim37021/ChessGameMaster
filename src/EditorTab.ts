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
import { ISelection } from "./ISelection";
import { State } from "./State";
import { MovementEditor } from "./MovementEditor";
import { ConditionSelector } from "./ConditionsSelector";
import { ProgrammableCondition } from "./ProgrammableCondition";
import { Movement } from "./Movement";
import { Transition } from "./Transition";

export class EditorTab extends Tab {
    private imgPicker: Picker;
    private meshPicker: Picker;
    private chessEditorP: ChessEditor;
    private stateEditor: StateDiagram;
    private movementEditor: MovementEditor;
    private workspaceDomElementP: HTMLElement = null;
    private lc: HTMLElement;
    private rc: HTMLElement;
    private defaultMesh: THREE.Mesh;
    private condSelector: ConditionSelector;

    constructor(name: string) {
        super(name);
        this.reinit();
    }

    public reinit() {
        if (this.workspaceDomElementP != null && this.workspaceDomElementP.parentElement != null) {
            this.workspaceDomElementP.parentElement.removeChild(this.workspaceDomElementP);
        }
        this.chessEditorP = new ChessEditor({dims: [8, 8], width: 0, height: 1});
        // state editor and movement editor
        this.stateEditor = new StateDiagram({width: "100%", height: "100%"});
        this.movementEditor = new MovementEditor(this.chessEditorP.board.worldState);
        this.condSelector = new ConditionSelector();
        this.meshPicker = new Picker({imgWidth: 128, imgHeight: 128});
        // create image picker
        this.imgPicker = new Picker({imgWidth: 64, imgHeight: 64});

        this.workspaceDomElementP = d3.create("div").classed("workspace", true)
            .style("display", "none").node() as HTMLElement;

        this.lc = d3.select(this.workspaceDomElementP).append("div")
            .classed("workspace-left-column", true).node() as HTMLElement;

        const sb = d3.select(this.lc).append("div").classed("sidebar", true);


        sb.append("div").classed("meshpicker-container", true).append(() => { return this.meshPicker.domElement; });


        sb.append("div").classed("imgpicker-container", true).append(() => { return this.imgPicker.domElement; });

        this.movementEditor.visible = false;

        this.condSelector.conditions = [
            new ProgrammableCondition("Enemy exists",
                `sigma.getPiece(m.getAttackPosition(p))!=null`),
            new ProgrammableCondition("King is dead", `sigma.getPiecesByStateName("King").length===0`),
            new ProgrammableCondition("Been moved",
                `p.steps>=1`),
            new ProgrammableCondition("In promotion area",
                `p.y===0 || p.y+1 === sigma.dims[1]`),
        ];
        this.condSelector.update();
        this.condSelector.visible = true;

        const sdcontainer = sb.append("div").classed("sd-container", true);
        const title = sdcontainer.append("div").classed("title", true);
        title.append("span").classed("title-text", true)
        .text("State Diagram")
        .on("click", (elmnt, i, nodes: HTMLElement[]) => {
            this.stateEditor.visible = true;
            this.movementEditor.visible = false;
            title.select(".subtitle-text").text("");
        });
        title.append("span").classed("subtitle-text", true)
        .text("");

        const content = sdcontainer
        .append("div").classed("content", true);
        content
        .append(() => { return this.stateEditor.domElementInputBox; });
        content
        .append(() => { return this.stateEditor.domElement; });
        content
        .append(() => { return this.movementEditor.domElement; });
        content
        .append(() => { return this.condSelector.domElement; });

        this.rc = d3.select(this.workspaceDomElementP).append("div")
            .classed("workspace-right-column", true).node() as HTMLElement;

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
        const regex = /[A-Za-z]?[:]?[\\\/]?.*[\/\\](.*)\..*/;
        const fname = regex.exec(filename)[1];
        this.chessEditor.registerGeometry(fname, filename, (mesh: THREE.Mesh) => {
            const mp = new ModelPreviewer({name: fname, width: 128, height: 128});
            mp.mesh = mesh;
            mp.render();
            this.meshPicker.selections.push(mp);
            this.meshPicker.update();
            const newstate = new PieceState(fname, mesh);
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
        d3.select(this.workspaceDomElementP).on("click", () => {
            this.condSelector.visible = false;
        });
        this.chessEditorP.on("mapcursormaterial", (idx: number) => {
            this.imgPicker.selectionIndex = idx;
        });
        this.chessEditorP.on("previewstatechange", (idx: number) => {
            const state = this.chessEditorP.board.states[idx];
            this.stateEditor.selectedState = state;
            this.stateEditor.locateState(state);
            const mpidx = this.meshPicker.selections.findIndex((selection: ISelection) => {
                return (selection as ModelPreviewer).mesh === state.mesh;
            });
            if (mpidx >= 0) {
                this.meshPicker.selectionIndex = mpidx;
            }
        });
        this.chessEditorP.on("pieceselectchange", (p: Piece) => {
            this.stateEditor.selectedState = p.state;
            this.stateEditor.locateState(p.state);
            const mpidx = this.meshPicker.selections.findIndex((selection: ISelection) => {
                return (selection as ModelPreviewer).mesh === p.state.mesh;
            });
            this.meshPicker.selectionIndex = mpidx;

            const tidx = this.chessEditorP.textureList.findIndex((t) => {
                return t.texture === p.texture;
            });
            this.imgPicker.selectionIndex = tidx;
            this.movementEditor.target = p.state;
            this.movementEditor.targetPiece = p;
            this.movementEditor.update();
            d3.select(this.workspaceDomElementP).select(".subtitle-text").text(p.state.name);
        });
        this.imgPicker.on("changed", (idx: number) => {
            this.chessEditorP.setPreviewMaterial(idx);
        });
        this.meshPicker.on("changed", (idx: number) => {
            // make sure the selected item is state
            if (this.stateEditor.selected instanceof State) {
                (this.stateEditor.selected as PieceState).mesh = (this.meshPicker.selection as ModelPreviewer).mesh;
            }
        });
        this.movementEditor.on("change", (p) => {
            this.chessEditorP.updateMovementPreview();
        });
        this.movementEditor.on("condselector", (m: Movement) => {
            this.condSelector.selected = m.conditions;
            this.condSelector.update();
            this.condSelector.visible = true;
            this.condSelector.translate = [d3.event.clientX, d3.event.clientY];
        });
        this.movementEditor.on("maskchange", (mask: boolean[]) => {
            this.chessEditorP.setMovementPreviewMask(mask);
        });
        this.stateEditor.on("edittransition", (t: Transition) => {
            this.condSelector.selected = t.conditions;
            this.condSelector.update();
            this.condSelector.visible = true;
            this.condSelector.translate = [d3.event.clientX, d3.event.clientY];
        });
        this.stateEditor.on("new", () => {
            return new PieceState("UNTITLED", this.defaultMesh);
        });
        this.stateEditor.on("selectstate", (state: PieceState) => {
            const mpidx = this.meshPicker.selections.findIndex((selection: ISelection) => {
                return (selection as ModelPreviewer).mesh === state.mesh;
            });
            if (mpidx >= 0) {
                this.meshPicker.selectionIndex = mpidx;
            }
            this.chessEditorP.setPreviewState(this.chessEditorP.board.states.indexOf(state));
        });
        this.stateEditor.on("editstate", (state: PieceState) => {
            this.stateEditor.visible = false;
            this.movementEditor.target = state;
            this.movementEditor.update();
            this.movementEditor.visible = true;
            d3.select(this.workspaceDomElementP).select(".subtitle-text").text(state.name);
        });
    }
}
