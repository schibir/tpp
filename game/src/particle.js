
import { Entity, EntityManager } from "./entity";
import { PART } from "./global";

class Particle {
    constructor(cx, cy) {
        this.entity = new Entity(cx, cy);
        this.creationTime = Date.now();
        this.lifetime = 250;
        this.alive = true;
    }
    clear(level) {
        level.clearEntity(this.entity);
    }
    draw(level) {
        const dt = Date.now() - this.creationTime;
        if (dt >= this.lifetime) this.alive = false;
        else {
            const ind = dt / this.lifetime * level.textures.sparksFire.length | 0;
            level.drawEntity(this.entity, level.textures.sparksFire[ind]);
        }
    }
    update(level, delta) {}
}

export default class ParticleManager extends EntityManager {
    emit(cx, cy) {
        this.objects.push(new Particle(cx, cy));
    }
}
