
import { Entity, EntityManager } from "./entity";
import { PART } from "./global";
import { rand } from "./utils";

class Particle extends Entity {
    constructor(cx, cy, type) {
        super(cx, cy, 0.5, Math.random() * 2 * Math.PI, rand(1, 0.5));
        this.type = type;
        this.creationTime = 0;
        this.random = Math.random();
        this.lifetime = 250;
        this.deltatime = 0;

        if (type === PART.FIRE) this.size = 2;
        else if (type === PART.EXPLODE) {
            this.size = 4;
            this.lifetime = 400;
            this.decal = new Entity(cx, cy, 3);
        } else if (type & (PART.BRICK | PART.BETON)) {
            this.cx += Math.cos(this.angle) * 0.5 * Math.random();
            this.cy += Math.sin(this.angle) * 0.5 * Math.random();
            this.lifetime += rand(100, 100);
            this.maxvel = this.vel;
            this.startAngle = Math.random();
            this.omega = rand(0, 1 / 30);
        } else if (type & PART.SMOKE) {
            this.size = 1;
            this.lifetime = rand(1000, 500);
            this.angle = rand(-1, 0.2);
            this.vel = rand(0.5, 0.2);
            this.cx = rand(cx, 0.1);
            this.cy = rand(cy, 0.1);
        }
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
            case PART.EXPLODE: {
                const id = this.random * level.textures.explode.length | 0;
                const ind = this.deltatime / this.lifetime * level.textures.explode[id].length | 0;
                level.drawEntity(this, level.textures.explode[id][ind]);
                if (this.decal) {
                    const index = Math.random() * level.textures.decals.length | 0;
                    level.drawEntityToAllLayers(this.decal, level.textures.decals[index]);
                    this.decal = null;
                }
                break;
            }
            case PART.SMOKE0:
            case PART.SMOKE1:
            case PART.SMOKE2:
            case PART.SMOKE3: {
                const ind = this.deltatime / this.lifetime * level.textures.smokes[this.type].length | 0;
                level.drawEntity(this, level.textures.smokes[this.type][ind]);
                break;
            }
            default: break;
            }
        }
    }
    update(level) {
        const time = Date.now();
        if (!this.creationTime) this.creationTime = time;
        const delta = this.getDelta(time);
        this.deltatime = time - this.creationTime;
        if (this.deltatime >= this.lifetime) {
            this.alive = false;
            if (this.type & (PART.BRICK | PART.BETON)) {
                level.drawEntityToAllLayers(this, this.getBrickTexture(level));
            }
        }

        if (this.type & (PART.SPARK | PART.BRICK | PART.BETON | PART.SMOKE)) {
            this.moveEx(delta);
        }
    }
}

export default class ParticleManager extends EntityManager {
    constructor(event) {
        super();

        const emit = (cx, cy, type) => {
            let count = 1;
            if (type === PART.SPARK) count = 5;
            else if (type & (PART.BRICK | PART.BETON)) count = 10;
            for (let i = 0; i < count; i++) {
                this.objects.push(new Particle(cx, cy, type));
            }
        };

        event.on("particle", (cx, cy, type) => emit(cx, cy, type));
        event.on("tankDead", (tank) => emit(tank.cx, tank.cy, PART.EXPLODE));
    }
    draw(level, layer) {
        const layer0 = PART.BRICK | PART.BETON;
        const layer1 = PART.SPARK | PART.FIRE | PART.EXPLODE | PART.SMOKE;
        this.objects.forEach((part) => {
            if ((part.type & layer0) && (layer === 0)) part.draw(level);
            else if ((part.type & layer1) && (layer === 1)) part.draw(level);
        });
    }
}
