
import Entity from "./entity";
import { PART } from "./global";

class Particle {
    constructor(cx, cy) {
        this.entity = new Entity(cx, cy);
        this.creationTime = Date.now();
    }
    clear(level) {
        level.clearEntity(this.entity);
    }
    draw(level, delta) {
        const ind = ((Date.now() - this.creationTime) / 40) % level.textures.sparksFire.length | 0;
        level.drawEntity(this.entity, level.textures.sparksFire[ind]);
    }
}

export default class ParticleManager {
    constructor() {
        this.particles = [];
    }
    emit(cx, cy) {
        this.particles.push(new Particle(cx, cy));
    }
    clear(level) {
        this.particles.forEach((part) => part.clear(level));
    }
    draw(level, delta) {
        this.particles.forEach((part) => part.draw(level, delta));
    }
}
