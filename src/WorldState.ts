import {Piece} from "./Piece";
interface WorldStateCreateInfo {
    dims: [number, number];
}

export class WorldState {
    private piecesP: Piece[] = new Array();
    private dimsP: [number, number];
    private steps: number = 0;

    constructor(info: WorldStateCreateInfo) {
        this.dimsP = info.dims;
    }

    get dims(): [number, number] {
        return this.dimsP;
    }

    public pushPiece(p: Piece): boolean {
        if (p.x >= 0 && p.x <= this.dimsP[0]) {
            if (p.y >= 0 && p.y <= this.dimsP[1]) {
                this.piecesP.push(p);
                return true;
            }
        }
        return false;
    }

    public getPiece(xy: [number, number]): Piece {
        let result: Piece = null;
        [].forEach.call(this.piecesP, (e: Piece) => {
            if (e.x === xy[0] && e.y === xy[1]) {
                result = e;
            }
        });
        return result;
    }

    public getPiecesByStateName(name: string): Piece[] {
        return this.piecesP.filter((p) => {
            return p.state.name === name;
        });
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

    public nextStep() {
        this.steps ++;
    }
}
