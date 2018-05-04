import * as THREE from "three";
import { PieceState } from "./PieceState";
import { WorldState } from "./WorldState";
import { Piece } from "./Piece";

interface IBoardCreateInfo {
    dims: [number, number];
    blockWidth: number;
}

export class Board {
    private sigma: WorldState;
    private sceneNode: THREE.Scene = new THREE.Scene();
    private statesP: PieceState[] = new Array();
    private blockWidth: number;
    private rollOverMesh: THREE.Mesh;
    private cursorPosP: [number, number];
    private boxGeometry: THREE.Geometry;
    private stateIdx: number;

    constructor(params: IBoardCreateInfo) {
        this.sigma = new WorldState({dims: params.dims});
        this.blockWidth = params.blockWidth;
        this.boxGeometry = new THREE.BoxGeometry(this.blockWidth, this.blockWidth, this.blockWidth);
        this.rollOverMesh = new THREE.Mesh(
            this.boxGeometry,
            new THREE.MeshBasicMaterial({color: 0xFF0000, opacity: 0.5, transparent: true}));
        this.rollOverMesh.visible = false;
        this.stateIdx = -1;
    }

    // caution: time consuming! call only when sigma changed
    public prepareScene(): void {
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
        this.scene.add(this.rollOverMesh);

        const w = this.blockWidth;
        const t = -this.sigma.dimension[0] / 2 * w;
        const l = -this.sigma.dimension[1] / 2 * w;

        const pieces = this.sigma.pieces;
        for (const p of pieces) {
            const mesh = p.state.mesh.clone();
            mesh.position.x = t + p.x * w + w / 2;
            mesh.position.y = l + p.y * w + w / 2;
            this.scene.add(mesh);
        }
    }

    public put(): void {
        const filter = this.sigma.pieces.filter((p: Piece) => {
            return p.x === this.cursorPosP[0] && p.y === this.cursorPosP[1];
        });
        if (filter.length >= 1 || this.stateIdx === -1) {
            return;
        }
        this.sigma.pushPiece(
            new Piece({x: this.cursorPosP[0], y: this.cursorPosP[1], owner: 0, state: this.statesP[this.stateIdx]}));
        this.prepareScene();
    }

    public set cursorMeshIdx(idx: number) {
        if (idx < 0 || idx >= this.statesP.length) {
            this.rollOverMesh.geometry = this.boxGeometry;
            this.stateIdx = -1;
        } else {
            this.rollOverMesh.geometry = this.statesP[idx].mesh.geometry;
            this.rollOverMesh.rotation.copy(this.states[idx].mesh.rotation);
            this.stateIdx = idx;
        }
    }

    public get cursorMesh(): THREE.Mesh {
        return this.rollOverMesh;
    }

    public set cursorPos(pos: [number, number]) {
        const w = this.blockWidth;
        const t = -this.sigma.dimension[0] / 2 * w;
        const l = -this.sigma.dimension[1] / 2 * w;
        this.rollOverMesh.position.x = t + pos[0] * w + w / 2;
        this.rollOverMesh.position.y = l + pos[1] * w + w / 2;
        this.cursorPosP = pos;
    }

    public set enableCursor(val: boolean) {
        this.rollOverMesh.visible = val;
    }

    public get states(): PieceState[] {
        return this.statesP;
    }

    public get scene(): THREE.Scene {
        return this.sceneNode;
    }

    public get worldState(): WorldState {
        return this.sigma;
    }
}
