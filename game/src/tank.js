
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
    }
    draw(level) {
        level.drawEntity(this, level.textures.tankTrack[this.type]);
        level.drawEntity(this, level.textures.tankBodies[this.type]);
        level.drawEntity(this, level.textures.tankTurret[this.type]);
    }
}

