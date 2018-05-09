import * as d3 from "d3";
import { Movement } from "./Movement";
import { Piece } from "./Piece";
import { WorldState } from "./WorldState";


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
    public isAttack: boolean;
    public attackDx: number;
    public attackDy: number;
    constructor(params: IFreeMovementCreateInfo) {
        super();
        this.dx = params.dx;
        this.dy = params.dy;
        this.isAttack = (params.isAttack === undefined ? false : params.isAttack);
        this.attackDx = (params.attackDx === undefined ? 0 : params.attackDx);
        this.attackDy = (params.attackDy === undefined ? 0 : params.attackDy);
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
        const newy = p.y + this.dy;
        return (newx >= 0 && newx <= sigma.dimension[0]) && (newy >= 0 && newy <= sigma.dimension[1]) &&
            (sigma.getPiece(newx, newy) == null);
    }


    public getMovePosition(p: Piece): [number, number] {
        return [p.x + this.dx, p.y + this.dy];
    }

    public getAttackPosition(p: Piece): [number, number] {
        return [p.x + this.attackDx, p.y + this.attackDy];
    }

    public get descrption(): string {
        return `Delta move (${this.dx}, ${this.dy})`;
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
