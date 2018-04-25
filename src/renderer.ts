import {remote} from "electron";
import * as fs from "fs";

import { ChessEditor } from "./ChessEditor";

import { ImagePicker } from "./ImagePicker";
import { ModelPreviewer } from "./ModelPreviewer";
import { PieceState } from "./PieceState";
import { ProgrammableTransition } from "./ProgrammableTransition";
import { StateDiagram } from "./StateDiagram";


const dialog = remote.dialog;

let stopbtn: HTMLElement;
let board: ChessEditor;
let mp: ModelPreviewer;
let ip: ImagePicker;
let sd: StateDiagram;

function init() {
    const container = document.getElementById("container");
    const stateconatiner = document.getElementById("state-container");
    const ipcontainer = document.getElementById("ip-container");
    const sdcontainer = document.getElementById("sd-container");
    board = new ChessEditor(container, {dims: [8, 8]});
    mp = new ModelPreviewer({width: 256, height: 256});
    ip = new ImagePicker();
    sd = new StateDiagram({width: "100%", height: "100%"});

    sd.data = [new PieceState("GG", null), new PieceState("GG2", null)];
    sd.data[0].transitionRules.push(new ProgrammableTransition(sd.data[1], null, null));

    ip.on("changed", (idx: number) => {
        board.setEditMaterial(idx);
    });
    stateconatiner.appendChild(mp.domElement);
    ipcontainer.appendChild(ip.domElement);
    sdcontainer.appendChild(sd.domElement);

    sd.update();

    stopbtn = document.getElementById("stopbtn");
}

function animate() {
    requestAnimationFrame( animate );
    render();
}

function render() {
    board.update();
    board.render();
}

function load_textures() {
    const filenames = dialog.showOpenDialog({properties: ["openFile", "multiSelections"]});
    if (filenames !== undefined) {
        filenames.forEach((filename) => {
            console.log(filename);
            board.registerTexture("UNTITLED", filename);
            ip.addImage("UNTITLED", filename);
        });
    }
    board.focus();
    ip.update();
}

function load_mesh() {
    const filenames = dialog.showOpenDialog({properties: ["openFile", "multiSelections"]});
    if (filenames !== undefined) {
        filenames.forEach((filename) => {
            board.registerTexture("UNTITLED", filename);
        });
    }
    ip.update();

}

window.onload = () => {
    init();
    animate();

    document.getElementById("openbtn").addEventListener("click", load_textures);
    document.getElementById("undobtn").addEventListener("click", (e: MouseEvent) => {
        board.undo();
    });

    document.getElementById("newstatebtn").addEventListener("click", (e: MouseEvent) => {
        //
    });

    document.getElementById("editboardbtn").addEventListener("click", (e: MouseEvent) => {
        board.editMode = "editboard";
        (e.target as HTMLElement).style.display = "none";
        stopbtn.style.display = null;
    });
    stopbtn.addEventListener("click", () => {
        board.editMode = "normal";
        stopbtn.style.display = "none";
        [].forEach.call(document.getElementsByClassName("modebtn"), (element: HTMLElement) => {
            element.style.display = null;
        });
    });
};
