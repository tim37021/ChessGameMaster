import {remote} from "electron";
import * as fs from "fs";

import { ChessEditor } from "./ChessEditor";

import { Picker } from "./Picker";
import { ModelPreviewer } from "./ModelPreviewer";
import { PieceState } from "./PieceState";
import { ProgrammableTransition } from "./ProgrammableTransition";
import { StateDiagram } from "./StateDiagram";


const dialog = remote.dialog;

let board: ChessEditor;
let mp: Picker;
let ip: Picker;
let sd: StateDiagram;

function init() {
    const container = document.getElementById("container");
    const stateconatiner = document.getElementById("state-container");
    const ipcontainer = document.getElementById("ip-container");
    const sdcontainer = document.getElementById("sd-container");
    board = new ChessEditor({dims: [8, 8], width: 512, height: 512});
    /*mp = new Picker({width: "256px", height: "256px"});
    ip = new Picker({width: "128px", height: "128px"});*/
    sd = new StateDiagram({width: "100%", height: "100%"});

    board.on("mapcursormaterial", (idx: number) => {
        ip.selectionIndex = idx;
    });

    sd.on("selected", (d: any) => {
        console.log(d);
    });

    ip.on("changed", (idx: number) => {
        board.setEditMaterial(idx);
    });
    stateconatiner.appendChild(mp.domElement);
    ipcontainer.appendChild(ip.domElement);
    sdcontainer.appendChild(sd.domElement);

    sd.update();

    ipcontainer.addEventListener("click", board.focus.bind(board));

    [].forEach.call(document.getElementsByClassName("stopbtn"), (stopbtn: HTMLElement) => {
        stopbtn.addEventListener("click", () => {
            board.editMode = "normal";
            stopbtn.style.display = "none";
            [].forEach.call(document.getElementsByClassName("modebtn"), (elmnt: HTMLElement) => {
                elmnt.style.display = null;
            });
        });

    });
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
            ip.selections.push(new ImageSelection({name: "UNTITLED", filePath: filename}));
        });
    }
    board.focus();
    ip.update();
}
import * as THREE from "three";
import { ImageSelection } from "./ImageSelection";
// 以any方式引入 防止typescript哀號
const {OBJLoader}: any = require("../src/OBJLoader.js");
// 怒把THREE裡的prototype 換成真的實作
(THREE as any).OBJLoader = OBJLoader;
function load_mesh() {
    const filenames = dialog.showOpenDialog({properties: ["openFile", "multiSelections"]});
    if (filenames !== undefined) {
        filenames.forEach((filename) => {
            const nmp = new ModelPreviewer({name: "UNTITLED", width: 256, height: 256});
            mp.selections.push(nmp);
            board.registerGeometry("UNTITLED", filename, (mesh: THREE.Mesh) => {
                nmp.mesh = mesh;
            });
        });
    }
    mp.update();

}

window.onload = () => {
    init();
    animate();

    document.getElementById("openbtn").addEventListener("click", load_textures);
    document.getElementById("openmeshbtn").addEventListener("click", load_mesh);
    document.getElementById("undobtn").addEventListener("click", (e: MouseEvent) => {
        board.undo();
    });

    document.getElementById("newstatebtn").addEventListener("click", (e: MouseEvent) => {
        //
    });

    [].forEach.call(document.getElementsByClassName("modebtn"), (elmnt: HTMLElement) => {
        elmnt.addEventListener("click", (e: MouseEvent) => {
            if (board.editMode !== "normal") {
                return;
            }
            board.editMode = elmnt.dataset.mode;
            (e.target as HTMLElement).style.display = "none";
            ((e.target as HTMLElement).nextElementSibling as HTMLElement).style.display = null;
        });
    });
};
