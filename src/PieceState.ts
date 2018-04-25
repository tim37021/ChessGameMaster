import * as THREE from "three";
import { Movement } from "./Movement";
import { Piece } from "./Piece";
import { State } from "./State";
import { WorldState } from "./WorldState";

export class PieceState extends State {
    public mesh: THREE.Mesh;
    public movements: Movement[] = Array();

    constructor(name: string, mesh: THREE.Mesh) {
        super(name);
        this.mesh = mesh;
    }
}
