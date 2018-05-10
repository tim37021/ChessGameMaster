import * as THREE from "three";
import {PieceState} from "./PieceState";

interface IPieceCreateInfo {
    x: number;
    y: number;
    owner: number;
    state: PieceState;
    texture?: THREE.Texture;
}

export class Piece {
    public x: number;
    public y: number;
    public owner: number;
    public state: PieceState;
    public steps: number = 0;
    public texture: THREE.Texture = null;
    public color: THREE.Color = new THREE.Color(0xFFFFFF);
    public rotation: THREE.Euler = new THREE.Euler();

    constructor(info: IPieceCreateInfo) {
        this.x = info.x;
        this.y = info.y;
        this.owner = info.owner;
        this.state = info.state;
        this.texture = info.texture ? info.texture : null;
    }

    public encode(): string {
        return "";
    }
}
