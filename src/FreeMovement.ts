import * as d3 from "d3";
import { Movement } from "./Movement";
import { Piece } from "./Piece";
import { WorldState } from "./WorldState";
import { PieceState } from "./PieceState";


interface IFreeMovementCreateInfo {
    dx: number;
    dy: number;

    isAttack?: boolean;
    attackDx?: number;
    attackDy?: number;
}

export class FreeDeltaMovement extends Movement {
    public dx: number;
    public dy: number;
    public isAttackP: boolean;
    public attackDx: number;
    public attackDy: number;
    constructor(params: IFreeMovementCreateInfo) {
        super();
        this.dx = params.dx;
        this.dy = params.dy;
        this.isAttackP = (params.isAttack === undefined ? false : params.isAttack);
        this.attackDx = (params.attackDx === undefined ? 0 : params.attackDx);
        this.attackDy = (params.attackDy === undefined ? 0 : params.attackDy);
    }

    public exec(sigma: WorldState, p: Piece): void {
        const newxy = this.getMovePosition(p);
        const anewxy = this.getAttackPosition(p);

        if (this.isAttackP) {
            // remove the piece
            const ap = sigma.getPiece(anewxy);
            sigma.removePiece(ap);
        }
        p.x = newxy[0];
        p.y = newxy[1];
        p.steps ++;

        const states = p.state.checkCandidateState(sigma, p, this);
        if (states.length === 1) {
            p.state = states[0] as PieceState;
        }
    }

    public movable(sigma: WorldState, p: Piece): boolean {
        const newxy = this.getMovePosition(p);
        const anewxy = this.getAttackPosition(p);

        // if next position is within board and there's no piece occupying
        // unless attackPos == movePos
        return (newxy[0] >= 0 && newxy[0] < sigma.dimension[0]) && (newxy[1] >= 0 && newxy[1] < sigma.dimension[1]) &&
            ((this.isAttack && newxy[0] === anewxy[0] && newxy[1] === anewxy[1]) || (sigma.getPiece(newxy) == null));
    }


    public getMovePosition(p: Piece): [number, number] {
        const mpos = [this.dx, this.dy];
        return [p.x + this.round(mpos[0] * Math.cos(p.rotation.z) - mpos[1] * Math.sin(p.rotation.z)),
        p.y + this.round(mpos[0] * Math.sin(p.rotation.z) + mpos[1] * Math.cos(p.rotation.z))];

    }

    public getAttackPosition(p: Piece): [number, number] {
        const mpos = [this.attackDx, this.attackDy];
        return [p.x + this.round(mpos[0] * Math.cos(p.rotation.z) - mpos[1] * Math.sin(p.rotation.z)),
        p.y + this.round(mpos[0] * Math.sin(p.rotation.z) + mpos[1] * Math.cos(p.rotation.z))];
    }

    public get isAttack(): boolean {
        return this.isAttackP;
    }

    public get descrption(): string {
        return `Move by (${this.dx}, ${this.dy})`;
    }

    private round(v: number): number {
        return (v >= 0 ? 1 : -1) * Math.round(Math.abs(v));
    }
}

export class FreeDeltaMovementCreator {
    private domElementP: d3.Selection<Element, undefined, null, undefined>;
    private gridBox: d3.Selection<d3.BaseType, undefined, null, undefined>;

    constructor() {
        this.domElementP = d3.create("div").classed("fd-creator", true).classed("creator", true);
        this.gridBox = this.domElementP.append("div").classed("grid-box", true);
        for (let i = 0; i < 49; i++) {
            const grid = this.gridBox.append("div");
            if (i === 24) {
                grid.classed("piece", true);
            } else {
                grid.on("mousedown", (elmnt, key, nodes) => {
                    d3.event.stopPropagation();
                    const sel = d3.select(nodes[key]);
                    let move = sel.classed("move");
                    let attack = sel.classed("attack");
                    if (d3.event.button === 0) {
                        move = !move;
                    }
                    if (d3.event.button === 2) {
                        attack = !attack;
                    }

                    sel.classed("move", move);
                    sel.classed("attack", attack);
                }).on("click", () => {
                    d3.event.stopPropagation();
                });
            }
        }
    }

    public get domElement(): HTMLDivElement {
        return this.domElementP.node() as HTMLDivElement;
    }

    public set visible(val: boolean) {
        this.domElementP.style("display", val ? null : "none");
    }

    public get visible(): boolean {
        return this.domElementP.style("display") !== "none";
    }

    public set translate(pos: [number, number]) {
        this.domElementP.style("transform", `translate(${pos[0]}px, ${pos[1]}px)`);
    }

    public get(): Movement {
        const midx = [].indexOf.call((this.gridBox.node() as HTMLElement).children,
            this.gridBox.select(".move").node());
        const aidx = [].indexOf.call((this.gridBox.node() as HTMLElement).children,
            this.gridBox.select(".attack").node());
        return new FreeDeltaMovement({
            attackDx: Math.floor(aidx % 7) - 3,
            attackDy: -(Math.floor(aidx / 7) - 3),
            dx: Math.floor(midx % 7) - 3,
            dy: -(Math.floor(midx / 7) - 3),
            isAttack: aidx !== -1,
        });
    }
}
