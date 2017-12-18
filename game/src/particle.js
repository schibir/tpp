
import { Entity, EntityManager } from "./entity";
import { PART } from "./global";

class Particle {
    constructor(cx, cy, type) {
        const size = type === PART.FIRE ? 2 : 1;
        this.entity = new Entity(cx, cy, size);
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
    update(level, delta) {}
}

export default class ParticleManager extends EntityManager {
    emit(cx, cy, type) {
        this.objects.push(new Particle(cx, cy, type));
    }
}
