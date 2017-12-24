
import { getMapSize } from "./utils";
import { Entity, EntityManager } from "./entity";
import { getItem, itemRespawnTime } from "./global";

class Item extends Entity {
    constructor() {
        const { mapWidth, mapHeight } = getMapSize();
        const cx = Math.random() * (mapWidth - 4) + 1 | 0;
        const cy = Math.random() * (mapHeight - 4) + 1 | 0;
        super(cx, cy);

        this.type = getItem();
    }
    draw(level) {
        level.drawEntityBegin(this, level.textures.item[this.type]);
    }
    update(level, time) {}
}

export default class ItemManager extends EntityManager {
    constructor(difficulty, event) {
        super();
        this.event = event;
        this.difficulty = difficulty;
    }
    reset(time) {
        super.reset();
        this.respawnTime = time + itemRespawnTime(this.difficulty);
    }
    update(level, time) {
        if (time > this.respawnTime) {
            this.objects.push(new Item());
            this.respawnTime = time + itemRespawnTime(this.difficulty);
        }

        super.update(level, time);
    }
}
