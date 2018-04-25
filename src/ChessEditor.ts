import * as THREE from "three";
import {OrbitControls} from "three-orbitcontrols-ts";
import { Board } from "./Board";
import {Floor} from "./Floor";
import {Stack} from "./Stack";

interface IEditorCreateInfo {
    dims: [number, number];
}

interface IKeybinding {
    SWITCHMATERIAL: number;
}

interface IMapEditContext {
    materialIdx: number;
}

interface ITextureInfo {
    name: string;
    filepath: string;
    texture: THREE.Texture;
}

interface IMeshInfo {
    name: string;
    filepath: string;
    mesh: THREE.Mesh;
}

export class ChessEditor {
    public keybinding: IKeybinding = {SWITCHMATERIAL: 9};

    private dims: [number, number];
    private floor: Floor;
    private board: Board;
    private textures: ITextureInfo[] = new Array();
    private meshes: IMeshInfo[] = new Array();
    private mapEditContext: IMapEditContext = {materialIdx: 0};
    private mode: string;

    // threejs stuff
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.Camera;
    private controls: OrbitControls;

    // control
    private mouse: THREE.Vector2;
    private raycaster: THREE.Raycaster;

    private scene: THREE.Scene;
    private gridHelper: THREE.GridHelper;
    // helper box
    private rollOverMaterial: THREE.Material;

    constructor(container: HTMLElement, params: IEditorCreateInfo) {
        this.dims = params.dims;
        this.init(container.clientWidth, container.clientHeight);
        this.editMode = "normal";
        container.appendChild(this.renderer.domElement);
    }

    public registerTexture(texname: string, filename: string): void {
        const tex: ITextureInfo = { name: texname, filepath: filename, texture: null };
        this.textures.push(tex);
        new THREE.TextureLoader().load(filename, (text: THREE.Texture) => {
            this.textures[this.textures.indexOf(tex)].texture = text;
        });
    }

    public registerMesh(mname: string, filename: string): void {
        new THREE.OBJLoader().load(filename, (object: THREE.Mesh) => {
            this.meshes.push({name: mname, filepath: filename, mesh: object});
        });
    }

    public get textureList(): ITextureInfo[] {
        return this.textures;
    }

    public get meshList(): IMeshInfo[] {
        return this.meshes;
    }

    public render(): void {
        this.renderer.render(this.scene, this.camera);
    }

    public update(): void {
        this.controls.update();
    }

    public focus(): void {
        this.renderer.domElement.focus();
    }

    public setEditMaterial(idx: number): void {
        this.mapEditContext.materialIdx = idx;
        this.floor.cursorBlock.material = new THREE.MeshPhongMaterial({map: this.textures[idx].texture});
    }

    public set editMode(mode: string) {
        if (mode === "editboard") {
            this.mode = "editboard";
        } else if (mode === "placepiece") {
            this.mode = "placepiece";
        } else {
            this.mode = "normal";
        }
        this.floor.cursorBlock.visible = false;
    }

    public undo(): void {
        if (this.mode === "editboard") {
            this.floor.popState();
        }
    }

    private init(width: number, height: number): void {

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(0x000000, 0);
        // renderer.setClearColor( scene.fog.color );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( width, height );

        this.camera = new THREE.PerspectiveCamera( 45, width / height, 1, 3500 );
        this.camera.position.z = 250;
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.controls.enablePan = false;
        this.controls.mouseButtons = { ORBIT: THREE.MOUSE.RIGHT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.LEFT };

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog( 0x050505, 2000, 3500 );
        this.scene.add( new THREE.AmbientLight( 0x444444 ) );

        this.floor = new Floor({dims: this.dims, blockWidth: 20});
        this.floor.scene.position.z = 20;
        this.scene.add(this.floor.scene);

        this.board = new Board({dims: this.dims, blockWidth: 20});
        this.board.scene.position.z = 30;
        this.scene.add(this.board.scene);

        // setup lighting
        const light = new THREE.DirectionalLight( 0xFFFFFF, 1.0);
        light.position.set( 1, 1, 1 );
        this.scene.add( light );

        this.gridHelper = new THREE.GridHelper(160, 8);
        this.gridHelper.rotation.x = -Math.PI / 2.0;
        this.scene.add(this.gridHelper);

        this.rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );
        this.floor.cursorBlock.material = this.rollOverMaterial;

        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();

        this.renderer.domElement.addEventListener( "mousedown", this.onMouseDown.bind(this), false );
        this.renderer.domElement.addEventListener( "mousemove", this.onMouseMove.bind(this), false );
        this.renderer.domElement.setAttribute("tabindex", "0");
        this.renderer.domElement.addEventListener( "keydown", this.onKeyDown.bind(this), false );
    }

    private cumulativeOffset(element: HTMLElement): [number, number] {
        let top = 0;
        let left = 0;
        do {
            top += element.offsetTop  || 0;
            left += element.offsetLeft || 0;
            element = (element.offsetParent as HTMLElement);
        } while (element);
        return [left, top];
    }

    private onMouseDown(event: MouseEvent): void {
        event.preventDefault();
        if (event.button !== 0) {
            return;
        }

        this.renderer.domElement.focus();
        this.raycaster.setFromCamera( this.mouse, this.camera );
        if (this.mode === "editboard") {
            const intersects = this.raycaster.intersectObjects( this.floor.blocks );
            if (intersects.length > 0) {
                const intersect = intersects[ 0 ];
                if (this.floor.cursorBlock.material !== this.rollOverMaterial) {
                    this.floor.pushState();
                    (intersect.object as THREE.Mesh).material = this.floor.cursorBlock.material;
                }
            }
        }
    }

    private onMouseMove(event: MouseEvent): void {
        event.preventDefault();
        const width = this.renderer.domElement.clientWidth;
        const height = this.renderer.domElement.clientHeight;
        const offset = this.cumulativeOffset(this.renderer.domElement);
        this.mouse.set( ( (event.clientX - offset[0]) / width ) * 2 - 1,
            - ( (event.clientY  - offset[1]) / height ) * 2 + 1 );
        this.raycaster.setFromCamera( this.mouse, this.camera );

        if (this.mode === "editboard") {
            const intersects = this.raycaster.intersectObjects( this.floor.blocks );
            if (intersects.length > 0) {
                const obj = intersects[ 0 ].object;
                this.floor.cursorBlock.position.copy(obj.position);
                this.floor.cursorBlock.visible = true;
            } else {
                this.floor.cursorBlock.visible = false;
            }
        }
    }

    private onKeyDown(event: KeyboardEvent): void {
        // tab
        if (event.keyCode === 9) {
            event.preventDefault();
        }

        if (event.keyCode === this.keybinding.SWITCHMATERIAL) {
            if (this.mode === "editboard") {
                const idx = this.mapEditContext.materialIdx;
                if (idx < this.textures.length) {
                    this.floor.cursorBlock.material = new THREE.MeshPhongMaterial({map: this.textures[idx].texture});
                } else {
                    this.floor.cursorBlock.material = this.rollOverMaterial;
                }
                this.mapEditContext.materialIdx = (this.mapEditContext.materialIdx + 1) % (this.textures.length + 1);
            }
        }
    }
}
