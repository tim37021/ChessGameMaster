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
    public checkMovable: boolean = false;
    public checkConditions: boolean = false;

    private dims: [number, number];
    private target: Piece;
    private maskP: boolean[] = new Array();
    private availableMoves: THREE.Mesh[] = new Array();
    private plane: THREE.Geometry;
    private blockWidth: number;
    private sceneP: THREE.Scene;
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
        if (p != null) {
            this.maskP = new Array(p.state.movements.length);
            this.maskP.fill(true);
        }
    }

    public get mask(): boolean[] {
        return this.maskP;
    }

    public update(sigma: WorldState): void {
        // clear scene
        while (this.sceneP.children.length > 0) {
            this.sceneP.remove(this.sceneP.children[0]);
        }
        if (this.target != null) {
            this.availableMoves = [];
            if (this.maskP.length !== this.target.state.movements.length) {
                // reassign
                this.piece = this.target;
            }

            for (let i = 0; i < this.target.state.movements.length; i++) {
                if (this.maskP[i]) {
                    if (this.checkConditions && !this.target.state.movements[i].checkConditions(sigma, this.target)) {
                        continue;
                    }
                    if (!this.checkMovable || this.target.state.movements[i].movable(sigma, this.target)) {
                        const next = this.target.state.movements[i].getMovePosition(this.target);
                        const plane = this.buildPreviewPlane(next, this.moveColor);
                        // insert member
                        (plane as any).movement = this.target.state.movements[i];
                        this.availableMoves.push(plane);
                        this.sceneP.add(plane);
                        if (this.target.state.movements[i].isAttack) {
                            const anext = this.target.state.movements[i].getAttackPosition(this.target);
                            const aplane = this.buildPreviewPlane(anext, this.attackColor);
                            aplane.position.z += 0.1;
                            // this.meshes.push(aplane);
                            this.sceneP.add(aplane);
                        }
                    }
                }
            }
        }
    }

    public intersectMovement(raycaster: THREE.Raycaster): Movement {
        const objs = raycaster.intersectObjects(this.availableMoves);
        const w = this.blockWidth;
        const t = -this.dims[0] / 2 * w;
        const l = -this.dims[1] / 2 * w;
        if (objs.length > 0) {
            const X = (objs[0].object.position.x - t - w / 2) / w;
            const Y = (objs[0].object.position.y - l - w / 2) / w;
            return (objs[0].object as any).movement;
        } else {
            return null;
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
