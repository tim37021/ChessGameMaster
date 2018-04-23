import * as THREE from "three";
import { PieceState } from "./PieceState";
import { WorldState } from "./WorldState";

interface IBoardCreateInfo {
    dims: [number, number];
    blockWidth: number;
}

export class Board {
    private sigma: WorldState;
    private sceneNode: THREE.Scene = new THREE.Scene();
    private statesP: PieceState[] = new Array();
    private blockWidth: number;

    constructor(params: IBoardCreateInfo) {
        this.sigma = new WorldState({dims: params.dims});
        this.blockWidth = params.blockWidth;
    }

    // caution: time consuming! call only when sigma changed
    public prepareScene(): void {
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }

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

    public get states(): PieceState[] {
        return this.statesP;
    }

    public get scene(): THREE.Scene {
        return this.sceneNode;
    }
}
