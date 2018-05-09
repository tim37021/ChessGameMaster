import {Piece} from "./Piece";
interface WorldStateCreateInfo {
    dims: [number, number];
}

export class WorldState {
    private piecesP: Piece[] = new Array();
    private dims: [number, number];

    constructor(info: WorldStateCreateInfo) {
        this.dims = info.dims;
    }

    get dimension(): [number, number] {
        return this.dims;
    }

    public pushPiece(p: Piece): boolean {
        if (p.x >= 0 && p.x <= this.dims[0]) {
            if (p.y >= 0 && p.y <= this.dims[1]) {
                this.piecesP.push(p);
                return true;
            }
        }
        return false;
    }

    public getPiece(x: number, y: number): Piece {
        let result: Piece = null;
        [].forEach.call(this.piecesP, (e: Piece) => {
            if (e.x === x && e.y === y) {
                result = e;
            }
        });
        return result;
    }
    // removing null is accept
    public removePiece(p: Piece): boolean {
        const idx = this.piecesP.indexOf(p, 0);
        if (idx > -1) {
            this.piecesP.splice(idx, 1);
            return true;
        }
        return false;
    }

    public get pieces(): Piece[] {
        return this.piecesP;
    }
}
