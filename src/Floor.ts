import * as THREE from "three";
import {Stack} from "./Stack";

interface IFloorCreateInfo {
    dims: [number, number];
    blockWidth: number;
}

export class Floor {
    private dims: [number, number];
    private blocksP: THREE.Mesh[] = new Array();
    private cursorBlockP: THREE.Mesh;
    private state: Stack<THREE.Scene> = new Stack<THREE.Scene>();
    private sceneNode: THREE.Scene = new THREE.Scene();
    private blockWidthP: number;

    constructor(params: IFloorCreateInfo) {
        this.init(params);
    }

    // currently this implementation is memory consuming but simple
    public pushState(): void {
        this.state.push(this.sceneNode.clone(true));
    }

    public popState(): void {
        if (!this.state.isEmpty()) {
            const sc = this.state.pop();
            // minus one for cursor block
            for (let i = 0; i < sc.children.length - 1; i++) {
                this.blocksP[i].material = (sc.children[i] as THREE.Mesh).material;
            }
        }
    }

    public get scene(): THREE.Scene {
        return this.sceneNode;
    }

    public get blocks(): THREE.Mesh[] {
        return this.blocksP;
    }

    public get blockWidth(): number {
        return this.blockWidthP;
    }

    public get cursorBlock(): THREE.Mesh {
        return this.cursorBlockP;
    }

    // return floor json
    public encode(): string {
        return "";
    }

    public decode(): void {
        // TODO
    }

    private init(params: IFloorCreateInfo): void {
        this.dims = params.dims;
        this.blockWidthP = params.blockWidth;
        this.createFloor();
        const w = this.blockWidth + 1;
        const rollOverGeo = new THREE.BoxGeometry(w, w, w);
        this.cursorBlockP = new THREE.Mesh(rollOverGeo, null);
        this.sceneNode.add(this.cursorBlockP);
    }

    private createFloor(): void {
        const w = this.blockWidth;
        const geometry = new THREE.BoxGeometry(w, w, w);
        const material = new THREE.MeshPhongMaterial({color: 0xFFFFFF});
        // x = -this._dim[width]/2*20
        const t = -this.dims[0] / 2 * this.blockWidth;
        const l = -this.dims[1] / 2 * this.blockWidth;
        for (let i = 0; i < this.dims[1]; i++) {
            for (let j = 0; j < this.dims[0]; j++) {
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.x = t + j * w + w / 2;
                mesh.position.y = l + i * w + w / 2;
                this.sceneNode.add(mesh);
                this.blocksP.push(mesh);
            }
        }
    }
}
