import * as d3 from "d3";
import { Tabstrip, Tab } from "./Tabstrip";
import { EditorTab } from "./EditorTab";
import { RenderableVertex } from "three";
import {remote} from "electron";
const dialog = remote.dialog;

const tabstrip = new Tabstrip();
let footer: HTMLElement;

function animate() {
    if (tabstrip.activeTab != null) {
        (tabstrip.activeTab as EditorTab).update();
        (tabstrip.activeTab as EditorTab).render();
    }
    requestAnimationFrame(animate);
}

function newtab() {
    const tab = new EditorTab("New Tab");
    footer.parentElement.insertBefore(tab.workspaceDomElement, footer);
    tabstrip.push(tab);
    tabstrip.activeTab = tab;
}

function load_textures() {
    if (tabstrip.activeTab == null) {
        return;
    }
    const filenames = dialog.showOpenDialog({properties: ["openFile", "multiSelections"]});
    if (filenames !== undefined) {
        filenames.forEach((filename) => {
            (tabstrip.activeTab as EditorTab).loadTexture(filename);
        });
    }
    (tabstrip.activeTab as EditorTab).chessEditor.focus();
}

function load_meshes() {
    if (tabstrip.activeTab == null) {
        return;
    }
    const filenames = dialog.showOpenDialog({properties: ["openFile", "multiSelections"]});
    if (filenames !== undefined) {
        filenames.forEach((filename) => {
            (tabstrip.activeTab as EditorTab).loadMesh(filename);
        });
    }
    (tabstrip.activeTab as EditorTab).chessEditor.focus();
}

window.onload = () => {
    const tscontainer = d3.select("#tabstripcontainer").node() as HTMLElement;

    tscontainer.appendChild(tabstrip.domElement);

    footer = d3.select(".footer").node() as HTMLElement;

    tabstrip.on("tabchanged", (d: EditorTab, lastd: EditorTab) => {
        if (lastd != null) {
            lastd.visible = false;
        }
        d.visible = true;
        d.chessEditor.resize(window.innerWidth * 0.6, window.innerHeight * 0.8);
    });

    d3.selectAll(".menuroot").on("click", (nothing: any, i: number, nodes: Element[]) => {
        d3.event.stopPropagation();
        d3.select(nodes[i]).select(".submenu").style("display", null);
    });

    d3.selectAll(".newbtn").on("click.nt", () => {newtab(); });

    d3.selectAll(".importimgbtn").on("click.im", () => {load_textures(); });
    d3.selectAll(".importmeshbtn").on("click.im", () => {load_meshes(); });

    d3.selectAll(".menu").on("click.cl", () => {
        d3.event.stopPropagation();
        d3.selectAll(".menuroot").selectAll(".submenu").style("display", "none");
    });

    d3.selectAll(".editboardbtn").on("click.cl", () => {
        if (tabstrip.activeTab != null) {
            (tabstrip.activeTab as EditorTab).chessEditor.editMode = "editboard";
        }
    });

    d3.selectAll(".normalmodebtn").on("click.cl", () => {
        if (tabstrip.activeTab != null) {
            (tabstrip.activeTab as EditorTab).chessEditor.editMode = "normal";
        }
    });

    d3.selectAll(".playbtn").on("click.cl", () => {
        if (tabstrip.activeTab != null) {
            (tabstrip.activeTab as EditorTab).chessEditor.editMode = "play";
        }
    });

    d3.selectAll(".placepiecebtn").on("click.cl", () => {
        if (tabstrip.activeTab != null) {
            (tabstrip.activeTab as EditorTab).chessEditor.editMode = "placepiece";
        }
    });

    document.addEventListener("click", () => {
        d3.selectAll(".menuroot").selectAll(".submenu").style("display", "none");
    });

    requestAnimationFrame(animate);
};

window.onresize = () => {
    if (tabstrip != null && tabstrip.activeTab != null) {
        (tabstrip.activeTab as EditorTab).chessEditor.resize(window.innerWidth * 0.6, window.innerHeight * 0.8);
    }
};

