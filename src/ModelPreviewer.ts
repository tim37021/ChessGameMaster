import * as d3 from "d3";
import * as THREE from "three";
import { OrbitControls } from "three-orbitcontrols-ts";
import { ISelection } from "./ISelection";

interface IModelPreviewerCreateInfo {
    name: string;
    width: number;
    height: number;
}

export class ModelPreviewer extends ISelection {
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.Camera;
    private controls: OrbitControls;
    private nameP: string;

    constructor(params: IModelPreviewerCreateInfo) {
        super();
        this.init(params);
        this.nameP = params.name;
    }

    public set mesh(mesh: THREE.Mesh) {
        if (this.scene.children.length > 2) {
            this.scene.children[2] = mesh;
        } else {
            this.scene.add(mesh);
        }
    }

    public get mesh(): THREE.Mesh {
        if (this.scene.children.length > 2) {
            return this.scene.children[2] as THREE.Mesh;
        } else {
            return null;
        }
    }

    public get name(): string {
        return this.nameP;
    }

    public get domElement(): HTMLCanvasElement {
        return this.renderer.domElement;
    }

    public render(): void {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    private init(params: IModelPreviewerCreateInfo): void {
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(0x000000, 0);
        // renderer.setClearColor( scene.fog.color );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize(params.width, params.height);

        this.scene = new THREE.Scene();
        // setup lighting
        const light = new THREE.DirectionalLight( 0xFFFFFF, 1.0);
        light.position.set( 1, 1, 1 );
        this.scene.add( light );

        this.scene.add(new THREE.AxesHelper(100));

        this.camera = new THREE.PerspectiveCamera( 45, 1, 1, 3500 );
        this.camera.position.z = 25;
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.controls.enablePan = false;
        this.controls.mouseButtons = { ORBIT: THREE.MOUSE.RIGHT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.LEFT };

        d3.select(this.renderer.domElement).on( "mousedown", this.render.bind(this))
        .on("mousemove", this.render.bind(this))
        .on("wheel", this.render.bind(this));
        this.render();
    }
}
