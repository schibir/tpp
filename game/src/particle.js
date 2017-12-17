
import { Entity, EntityManager } from "./entity";
import { PART } from "./global";

class Particle {
    constructor(cx, cy) {
        this.entity = new Entity(cx, cy);
        this.creationTime = Date.now();
        this.alive = true;
    }
    clear(level) {
        level.clearEntity(this.entity);
    }
    draw(level) {
        const ind = ((Date.now() - this.creationTime) / 40) % level.textures.sparksFire.length | 0;
        level.drawEntity(this.entity, level.textures.sparksFire[ind]);
    }
    update(level, delta) {}
}

export default class ParticleManager extends EntityManager {
    emit(cx, cy) {
        this.objects.push(new Particle(cx, cy));
    }
}
