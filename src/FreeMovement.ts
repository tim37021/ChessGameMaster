import { Movement } from "./Movement";
import { Piece } from "./Piece";
import { WorldState } from "./WorldState";


interface IFreeMovementCreateInfo {
    dx: number;
    dy: number;

    isAttack: boolean;
    attackDx: number;
    attackDy: number;
}

export class FreeDeltaMovement extends Movement {
    public dx: number;
    public dy: number;
    public isAttack: boolean;
    public attackDx: number;
    public attackDy: number;
    constructor(params: IFreeMovementCreateInfo) {
        super();
        this.dx = params.dx;
        this.dy = params.dy;
        this.isAttack = params.isAttack;
        this.attackDx = params.attackDx;
        this.attackDy = params.attackDy;
    }

    public exec(sigma: WorldState, p: Piece): void {

        if (this.isAttack) {
            // remove the piece
            const ap = sigma.getPiece(p.x + this.attackDx, p.y + this.attackDy);
            sigma.removePiece(ap);
        }
        p.x += this.dx;
        p.y += this.dy;
    }

    public movable(sigma: WorldState, p: Piece): boolean {
        const newx = p.x + this.dx;
        const newy = p.x + this.dy;
        return (newx >= 0 && newx <= sigma.dimension[0]) && (newy >= 0 && newy <= sigma.dimension[1]) &&
            (sigma.getPiece(newx, newy) == null);
    }

    public get descrption(): string {
        return `Delta move (${this.dx}, ${this.dy})`;
    }
}
