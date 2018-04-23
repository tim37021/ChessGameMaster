import {remote} from "electron";
import * as fs from "fs";

import { ChessEditor } from "./ChessEditor";
import { ModelPreviewer } from "./ModelPreviewer";
import { PieceState } from "./PieceState";


const dialog = remote.dialog;

let stopbtn: HTMLElement;
let board: ChessEditor;
let sd: ModelPreviewer;

function init() {
    const container = document.getElementById("container");
    const stateconatiner = document.getElementById("state-container");
    board = new ChessEditor(container, {dims: [8, 8]});
    sd = new ModelPreviewer({width: 256, height: 256});
    stateconatiner.appendChild(sd.domElement);
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
            board.registerTexture("UNTITLED", filename);
        });
    }
    board.focus();
}

function load_mesh() {
    const filenames = dialog.showOpenDialog({properties: ["openFile", "multiSelections"]});
    if (filenames !== undefined) {
        filenames.forEach((filename) => {
            board.registerTexture("UNTITLED", filename);
        });
    }
    board.focus();
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
