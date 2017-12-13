
import Entity from "./entity";

export const TANK = {
    TANK1: 0,
    TANK2: 1,
    SIMPLE: 2,
    BMP: 3,
    CANNON: 4,
    STRONG: 5,
    PANZER: 6,
    RANDOM: 7,
};

export class Tank extends Entity {
    constructor(cx, cy, type) {
        super(cx, cy);
        this.type = type;
        this.animTrack = 0;
    }
    clear(level) {
        level.clearEntity(this);
    }
    draw(level) {
        level.drawEntityBegin(this, level.textures.tankTrack[this.angle][this.type][this.animTrack]);
        level.drawEntityBegin(this, level.textures.tankBodies[this.angle][this.type]);
        level.drawEntityBegin(this, level.textures.tankTurret[this.angle][this.type]);
        level.drawEntityEnd(this);
    }
    update(level, delta) {
        if (this.angle === 0 || this.angle === 2) this.cx = Math.round(this.cx);
        if (this.angle === 1 || this.angle === 3) this.cy = Math.round(this.cy);

        this.move(delta);
        if (level.collideTank(this)) this.move(-delta);
        else if (this.vel > 0.01) {
            this.animTrack = ++this.animTrack % level.textures.tankTrack[this.angle][this.type].length | 0;
        }
    }
}
