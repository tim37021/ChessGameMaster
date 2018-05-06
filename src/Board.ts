import * as THREE from "three";
import { PieceState } from "./PieceState";
import { WorldState } from "./WorldState";
import { Piece } from "./Piece";

interface IBoardCreateInfo {
    dims: [number, number];
    blockWidth: number;
}

interface IntersectInfo {
    object: THREE.Mesh;
    p: Piece;
    x: number;
    y: number;
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
    private scenePieces: THREE.Mesh[] = new Array();

    constructor(params: IBoardCreateInfo) {
        this.sigma = new WorldState({dims: params.dims});
        this.blockWidth = params.blockWidth;
        this.boxGeometry = new THREE.BoxGeometry(this.blockWidth, this.blockWidth, this.blockWidth);
        this.rollOverMesh = new THREE.Mesh(
            this.boxGeometry,
            new THREE.MeshBasicMaterial({color: 0xFF0000, opacity: 0.5, transparent: true}));
        this.rollOverMesh.visible = false;
        this.stateIdx = -1;
        this.prepareScene();
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
        this.scenePieces = [];
        for (const p of pieces) {
            const mesh = new THREE.Mesh(p.state.mesh.geometry.clone(),
                (p.state.mesh.material as THREE.Material).clone());
            mesh.position.x = t + p.x * w + w / 2;
            mesh.position.y = l + p.y * w + w / 2;
            // TODO: rotate by 90 elsewhere
            mesh.rotateX(Math.PI / 2);
            this.scene.add(mesh);
            this.scenePieces.push(mesh);
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

    public intersect(raycaster: THREE.Raycaster): IntersectInfo {
        const objs = raycaster.intersectObjects(this.scenePieces);
        const w = this.blockWidth;
        const t = -this.sigma.dimension[0] / 2 * 20;
        const l = -this.sigma.dimension[1] / 2 * 20;
        if (objs.length > 0) {
            const X = (objs[0].object.position.x - t - w / 2) / w;
            const Y = (objs[0].object.position.y - l - w / 2) / w;
            const P = this.worldState.getPiece(X, Y);
            return {object: objs[0].object as THREE.Mesh, p: P, x: X, y: Y};
        } else {
            return null;
        }
    }

    public set cursorMeshIdx(idx: number) {
        if (idx < 0 || idx >= this.statesP.length) {
            this.rollOverMesh.geometry = this.boxGeometry;
            this.stateIdx = -1;
        } else {
            this.rollOverMesh.geometry = this.statesP[idx].mesh.geometry.clone();
            // this.rollOverMesh.geometry = this.statesP[idx].mesh.geometry;
            // TODO: rotate elsewhere
            this.rollOverMesh.rotation.x = Math.PI / 2;
            // this.rollOverMesh.rotation.copy(this.states[idx].mesh.rotation);
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
