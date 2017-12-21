
import { Entity, EntityManager } from "./entity";
import { PART } from "./global";
import { rand } from "./utils";

class Particle extends Entity {
    constructor(cx, cy, type) {
        super(cx, cy, 0.5, Math.random() * 2 * Math.PI, rand(1, 0.5));
        this.type = type;
        this.creationTime = 0;
        this.alive = true;
        this.random = Math.random();
        this.lifetime = 250;
        this.deltatime = 0;

        if (type === PART.FIRE) this.size = 2;
        if (type & (PART.BRICK | PART.BETON)) {
            this.cx += Math.cos(this.angle) * 0.5 * Math.random();
            this.cy += Math.sin(this.angle) * 0.5 * Math.random();
            this.lifetime += rand(100, 100);
            this.maxvel = this.vel;
            this.startAngle = Math.random();
            this.omega = rand(0, 1 / 30);
        }
    }
    clear(level) {
        level.clearEntity(this);
    }
    getBrickTexture(level) {
        const textures = this.type === PART.BRICK ? level.textures.sparksBrick : level.textures.sparksBeton;
        const id = this.random * textures.length | 0;
        let ind = (this.deltatime * this.omega + textures[id].length * this.startAngle | 0) % textures[id].length | 0;
        if (ind < 0) ind += textures[id].length;
        return textures[id][ind];
    }
    draw(level) {
        if (this.alive) {
            switch (this.type) {
            case PART.SPARK: {
                const ind = this.deltatime / this.lifetime * level.textures.sparksBullet.length | 0;
                level.drawEntity(this, level.textures.sparksBullet[ind]);
                break;
            }
            case PART.FIRE: {
                const id = this.random * level.textures.sparksFire.length | 0;
                const ind = this.deltatime / this.lifetime * level.textures.sparksFire[id].length | 0;
                level.drawEntity(this, level.textures.sparksFire[id][ind]);
                break;
            }
            case PART.BRICK: 
            case PART.BETON: {
                this.vel = this.maxvel * (1 - this.deltatime / this.lifetime);
                level.drawEntity(this, this.getBrickTexture(level));
                break;
            }
            default: break;
            }
        }
    }
    update(level, time) {
        if (!this.creationTime) this.creationTime = time;
        const delta = this.getDelta(time);
        this.deltatime = time - this.creationTime;
        if (this.deltatime >= this.lifetime) {
            this.alive = false;
            if (this.type & (PART.BRICK | PART.BETON)) {
                level.drawEntityToAllLayers(this, this.getBrickTexture(level));
            }
        }

        if (this.type !== PART.FIRE) {
            this.moveEx(delta);
        }
    }
}

export default class ParticleManager extends EntityManager {
    emit(cx, cy, type) {
        let count = 1;
        if (type === PART.SPARK) count = 5;
        else if (type & (PART.BRICK | PART.BETON)) count = 10;
        for (let i = 0; i < count; i++) {
            this.objects.push(new Particle(cx, cy, type));
        }
    }
}
