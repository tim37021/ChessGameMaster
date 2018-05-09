import * as THREE from "three";
import { Movement } from "./Movement";
import { WorldState } from "./WorldState";
import { Piece } from "./Piece";

interface MovementPreviewerCreateInfo {
    dims: [number, number];
    blockWidth: number;
    moveColor?: THREE.Color;
    attackColor?: THREE.Color;
}

export class MovementPreviewer {
    private dims: [number, number];
    private target: Piece;
    private maskP: boolean[];
    private meshes: THREE.Mesh[] = new Array();
    private plane: THREE.Geometry;
    private blockWidth: number;
    private sceneP: THREE.Scene;
    private checkMovableP: boolean = false;
    private checkConditionP: boolean = false;
    private moveColor: THREE.Color;
    private attackColor: THREE.Color;

    constructor(params: MovementPreviewerCreateInfo) {
        this.blockWidth = params.blockWidth;
        this.dims = params.dims;
        this.moveColor = params.moveColor ? params.moveColor : new THREE.Color(0x99cccc);
        this.attackColor = params.attackColor ? params.moveColor : new THREE.Color(0x990000);
        this.plane = new THREE.PlaneGeometry(params.blockWidth, params.blockWidth);
        this.sceneP = new THREE.Scene();
    }

    public set piece(p: Piece) {
        this.target = p;
        this.maskP = new Array(p.state.movements.length);
        this.maskP.fill(true);
    }

    public get mask(): boolean[] {
        return this.maskP;
    }

    public update(sigma: WorldState): void {
        if (this.target != null) {
            // clear scene
            while (this.sceneP.children.length > 0) {
                this.sceneP.remove(this.sceneP.children[0]);
            }
            this.meshes = [];
            if (this.maskP.length !== this.target.state.movements.length) {
                // reassign
                this.piece = this.target;
            }

            for (let i = 0; i < this.target.state.movements.length; i++) {
                if (this.maskP[i]) {
                    if (!this.checkMovableP || this.target.state.movements[i].movable(sigma, this.target)) {
                        const next = this.target.state.movements[i].getMovePosition(this.target);
                        const plane = this.buildPreviewPlane(next, this.moveColor);
                        this.meshes.push(this.buildPreviewPlane(next, this.moveColor));
                        // const anext = this.target.state.movements[i].getAttackPosition(this.target);
                        // this.meshes.push(this.buildPreviewPlane(anext, this.attackColor));
                        this.sceneP.add(plane);
                    }

                    if (!this.checkConditionP || this.target.state.movements[i].checkConditions(sigma, this.target)) {
                        //
                    }
                }
            }
        }
    }

    public get scene(): THREE.Scene {
        return this.sceneP;
    }

    private buildPreviewPlane(p: [number, number], c: THREE.Color): THREE.Mesh {
        const w = this.blockWidth;
        const t = -this.dims[0] / 2 * w;
        const l = -this.dims[1] / 2 * w;

        const mesh = new THREE.Mesh(this.plane,
            new THREE.MeshBasicMaterial({color: c, transparent: true, opacity: 0.5}));
        mesh.position.x = t + p[0] * w + w / 2;
        mesh.position.y = l + p[1] * w + w / 2;
        return mesh;
    }
}
