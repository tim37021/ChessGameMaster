import * as THREE from "three";
import {PieceState} from "./PieceState";

interface IPieceCreateInfo {
    x: number;
    y: number;
    owner: number;
    state: PieceState;
}

export class Piece {
    public x: number;
    public y: number;
    public owner: number;
    public state: PieceState;

    constructor(info: IPieceCreateInfo) {
        this.x = info.x;
        this.y = info.y;
        this.owner = info.owner;
        this.state = info.state;
    }

    public encode(): string {
        return "";
    }
}
