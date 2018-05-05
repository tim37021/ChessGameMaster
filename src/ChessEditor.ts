import * as THREE from "three";
import {OrbitControls} from "three-orbitcontrols-ts";
import { Board } from "./Board";
import {Floor} from "./Floor";
import {Stack} from "./Stack";
import { PieceState } from "./PieceState";
import { Piece } from "./Piece";
// 以any方式引入 防止typescript哀號
const {OBJLoader}: any = require("../src/OBJLoader.js");
// 怒把THREE裡的prototype 換成真的實作
(THREE as any).OBJLoader = OBJLoader;

interface IEditorCreateInfo {
    dims: [number, number];
    width: number;
    height: number;
}

interface IKeybinding {
    SWITCHMATERIAL: number;
}

interface IEditContext {
    materialIdx: number;
    stateIdx: number;
    selectedMesh: THREE.Mesh;
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

interface IChessEditorEvent {
    onMaterialSelectChanged: (idx: number) => void;
    onStateSelectChanged: (idx: number) => void;
    onPieceSelectChanged: (p: Piece) => void;
}

export class ChessEditor {
    public keybinding: IKeybinding = {SWITCHMATERIAL: 9};

    private dims: [number, number];
    private floor: Floor;
    private boardP: Board;
    private textures: ITextureInfo[] = new Array();
    private meshes: IMeshInfo[] = new Array();
    private editContext: IEditContext = {materialIdx: 0, stateIdx: 0, selectedMesh: null};
    private mode: string;
    private events: IChessEditorEvent = {
        onMaterialSelectChanged: null,
        onPieceSelectChanged: null,
        onStateSelectChanged: null,
    };

    // threejs stuff
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private controls: OrbitControls;
    private objloader: THREE.OBJLoader = new THREE.OBJLoader();

    // control
    private mouse: THREE.Vector2;
    private raycaster: THREE.Raycaster;

    private scene: THREE.Scene;
    private gridHelper: THREE.GridHelper;
    // helper box
    private rollOverMaterial: THREE.Material;

    constructor(params: IEditorCreateInfo) {
        this.dims = params.dims;
        this.init(params.width, params.height);
        this.editMode = "normal";
    }

    public registerTexture(texname: string, filename: string): void {
        const tex: ITextureInfo = { name: texname, filepath: filename, texture: null };
        this.textures.push(tex);
        new THREE.TextureLoader().load(filename, (text: THREE.Texture) => {
            this.textures[this.textures.indexOf(tex)].texture = text;
        });
    }

    public registerGeometry(mname: string, filename: string,
                            cbk: (mesh: THREE.Mesh) => void = () => { return; }): void {
        const geo: IMeshInfo = {name: mname, filepath: filename, mesh: null};
        this.meshes.push(geo);
        this.objloader.load(filename, (object: THREE.Mesh) => {
            const child: THREE.Mesh = object.children[0] as THREE.Mesh;
            object.material = new THREE.MeshPhongMaterial({color: 0xFFFFFF});
            child.geometry.computeBoundingBox();
            const length = child.geometry.boundingBox.max.y - child.geometry.boundingBox.min.y;
            const mid = child.geometry.boundingBox.min.add(child.geometry.boundingBox.max).multiplyScalar(-0.5);
            const mat = new THREE.Matrix4().set(
                1, 0, 0, mid.x,
                0, 1, 0, mid.y,
                0, 0, 1, mid.z,
                0, 0, 0, 1);
            const mat2 = new THREE.Matrix4().set(
                20 / length, 0, 0, 0,
                0, 20 / length, 0, 0,
                0, 0, 20 / length, 0,
                0, 0, 0, 1);

            child.geometry.applyMatrix(mat2);

            this.meshes[this.meshes.indexOf(geo)].mesh = child;
            cbk(child);
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

    public setPreviewMaterial(idx: number): void {
        this.editContext.materialIdx = idx;
        this.floor.cursorBlock.material = new THREE.MeshPhongMaterial({map: this.textures[idx].texture});
    }

    public setPreviewState(idx: number) {
        this.editContext.stateIdx = idx;
        this.boardP.cursorMeshIdx = idx;
    }

    public set editMode(mode: string) {
        if (mode === "editboard") {
            this.mode = "editboard";
            this.boardP.scene.visible = false;
        } else if (mode === "placepiece") {
            this.mode = "placepiece";
            this.boardP.scene.visible = true;
        } else {
            this.mode = "normal";
            this.boardP.scene.visible = true;
        }
        this.floor.cursorBlock.visible = false;
    }

    public get editMode(): string {
        return this.mode;
    }

    public get domElement(): HTMLCanvasElement {
        return this.renderer.domElement;
    }

    public get board(): Board {
        return this.boardP;
    }

    public undo(): void {
        if (this.mode === "editboard") {
            this.floor.popState();
        }
    }

    public resize(width: number, height: number): void {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    public on(ename: string, cbk: (e: any) => void): void {
        if (ename === "mapcursormaterial") {
            this.events.onMaterialSelectChanged = cbk;
        } else if (ename === "previewstatechange") {
            this.events.onStateSelectChanged = cbk;
        } else if (ename === "pieceselectchange") {
            this.events.onPieceSelectChanged = cbk;
        }
    }

    private init(width: number, height: number): void {

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(0x666666, 1);
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

        this.boardP = new Board({dims: this.dims, blockWidth: 20});
        this.boardP.scene.position.z = 30;
        this.scene.add(this.boardP.scene);
        const geo = new THREE.BoxGeometry(20, 20, 20);
        const material = new THREE.MeshPhongMaterial({color: 0xFFFFFF});

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
            const intersect = this.floor.intersect(this.raycaster);
            if (intersect != null) {
                if (this.floor.cursorBlock.material !== this.rollOverMaterial) {
                    this.floor.pushState();
                    (intersect.object as THREE.Mesh).material = this.floor.cursorBlock.material;
                }
            }
        }

        if (this.mode === "placepiece") {
            this.boardP.put();
        }

        if (this.mode === "normal") {
            const intersect = this.boardP.intersect(this.raycaster);
            if (intersect != null) {
                if (this.events.onPieceSelectChanged != null) {
                    this.events.onPieceSelectChanged(intersect.p);
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
            const intersect = this.floor.intersect(this.raycaster);
            if (intersect != null) {
                this.floor.cursorPos = [intersect.x, intersect.y];
                this.floor.enableCursor = true;
            } else {
                this.floor.enableCursor = false;
            }
        }

        if (this.mode === "placepiece") {
            const intersect = this.floor.intersect(this.raycaster);
            if (intersect != null) {
                this.boardP.cursorPos = [intersect.x, intersect.y];
                this.boardP.enableCursor = true;
            } else {
                this.boardP.enableCursor = false;
            }
        }

        if (this.mode === "normal") {
            const intersect = this.boardP.intersect(this.raycaster);
            if (this.editContext.selectedMesh != null) {
                (this.editContext.selectedMesh.material as THREE.MeshPhongMaterial).color = new THREE.Color(0xFFFFFF);
                this.editContext.selectedMesh = null;
            }
            if (intersect != null) {
                (intersect.object.material as THREE.MeshPhongMaterial).color = new THREE.Color(0x00FF00);
                this.editContext.selectedMesh = intersect.object;
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
                const idx = this.editContext.materialIdx;
                if (idx < this.textures.length) {
                    this.floor.cursorBlock.material = new THREE.MeshPhongMaterial({map: this.textures[idx].texture});
                    if (this.events.onMaterialSelectChanged != null) {
                        this.events.onMaterialSelectChanged(idx);
                    }
                } else {
                    this.floor.cursorBlock.material = this.rollOverMaterial;
                    if (this.events.onMaterialSelectChanged != null) {
                        // deselect
                        this.events.onMaterialSelectChanged(-1);
                    }
                }
                this.editContext.materialIdx = (this.editContext.materialIdx + 1) % (this.textures.length + 1);
            }

            if (this.mode === "placepiece") {
                const idx = this.editContext.stateIdx;
                this.boardP.cursorMeshIdx = idx;
                if (this.events.onStateSelectChanged != null && idx < this.boardP.states.length) {
                    this.events.onStateSelectChanged(idx);
                }
                this.editContext.stateIdx = (this.editContext.stateIdx + 1) % (this.boardP.states.length + 1);
            }
        }
    }
}
