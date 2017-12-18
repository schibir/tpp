
import { Entity, EntityManager } from "./entity";
import { PART } from "./global";
import { rand } from "./utils";

class Particle {
    constructor(cx, cy, type) {
        const angle = Math.random() * 2 * Math.PI;
        const vel = rand(1, 0.5);
        const size = type === PART.FIRE ? 2 : 0.5;
        this.entity = new Entity(cx, cy, size, angle, vel);
        this.type = type;
        this.creationTime = Date.now();
        this.alive = true;
        this.random = Math.random();

        this.lifetime = 250;
    }
    clear(level) {
        level.clearEntity(this.entity);
    }
    draw(level) {
        const dt = Date.now() - this.creationTime;
        if (dt >= this.lifetime) this.alive = false;
        else {
            switch (this.type) {
            case PART.SPARK: {
                const ind = dt / this.lifetime * level.textures.sparksBullet.length | 0;
                level.drawEntity(this.entity, level.textures.sparksBullet[ind]);
                break;
            }
            case PART.FIRE: {
                const id = this.random * level.textures.sparksFire.length | 0;
                const ind = dt / this.lifetime * level.textures.sparksFire[id].length | 0;
                level.drawEntity(this.entity, level.textures.sparksFire[id][ind]);
                break;
            }
            }
        }
    }
    update(level, delta) {
        this.entity.moveEx(delta);
    }
}

export default class ParticleManager extends EntityManager {
    emit(cx, cy, type) {
        const count = type === PART.FIRE ? 1 : 5;
        for (let i = 0; i < count; i++) {
            this.objects.push(new Particle(cx, cy, type));
        }
    }
}
