
import { Entity, EntityManager } from "./entity";
import { PART } from "./global";
import { rand } from "./utils";

class Particle {
    constructor(cx, cy, type) {
        this.entity = new Entity(cx, cy, 0.5, Math.random() * 2 * Math.PI, rand(1, 0.5));
        this.type = type;
        this.creationTime = Date.now();
        this.alive = true;
        this.random = Math.random();
        this.lifetime = 250;
        this.deltatime = 0;

        if (type === PART.FIRE) this.entity.size = 2;
        if (type === PART.BRICK) {
            this.entity.cx += rand(0, 0.5);
            this.entity.cy += rand(0, 0.5);
            this.lifetime += rand(0, 100);
            this.maxvel = this.entity.vel;
            this.startAngle = Math.random();
            this.invAngle = Math.random() ? 1 : -1;
        }
    }
    clear(level) {
        level.clearEntity(this.entity);
    }
    getBrickTexture(level) {
        const id = this.random * level.textures.sparksBrick.length | 0;
        const ind = (this.invAngle * this.deltatime / 30 + level.textures.sparksBrick[id].length * this.startAngle | 0) %
            level.textures.sparksBrick[id].length | 0;
        this.entity.vel = this.maxvel * (1 - this.deltatime / this.lifetime);
        return level.textures.sparksBrick[id][ind];
    }
    draw(level) {
        if (this.alive) {
            switch (this.type) {
            case PART.SPARK: {
                const ind = this.deltatime / this.lifetime * level.textures.sparksBullet.length | 0;
                level.drawEntity(this.entity, level.textures.sparksBullet[ind]);
                break;
            }
            case PART.FIRE: {
                const id = this.random * level.textures.sparksFire.length | 0;
                const ind = this.deltatime / this.lifetime * level.textures.sparksFire[id].length | 0;
                level.drawEntity(this.entity, level.textures.sparksFire[id][ind]);
                break;
            }
            case PART.BRICK: {
                this.entity.vel = this.maxvel * (1 - this.deltatime / this.lifetime);
                level.drawEntity(this.entity, this.getBrickTexture(level));
                break;
            }
            default: break;
            }
        }
    }
    update(level, delta) {
        this.deltatime = Date.now() - this.creationTime;
        if (this.deltatime >= this.lifetime) {
            this.alive = false;
            if (this.type === PART.BRICK) {
                level.drawEntityToAllLayers(this.entity, this.getBrickTexture(level));
            }
        }

        if (this.type !== PART.FIRE) {
            this.entity.moveEx(delta);
        }
    }
}

export default class ParticleManager extends EntityManager {
    emit(cx, cy, type) {
        let count = 1;
        if (type === PART.SPARK) count = 5;
        else if (type === PART.BRICK) count = 10;
        for (let i = 0; i < count; i++) {
            this.objects.push(new Particle(cx, cy, type));
        }
    }
}
