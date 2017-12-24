
import { getMapSize } from "./utils";
import { Entity, EntityManager } from "./entity";
import { getItem } from "./global";

class Item extends Entity {
    constructor(time) {
        const { mapWidth, mapHeight } = getMapSize();
        const cx = Math.random() * (mapWidth - 4) + 1 | 0;
        const cy = Math.random() * (mapHeight - 4) + 1 | 0;
        super(cx, cy);

        this.lifeTime = time + 10000;
        this.type = getItem();
    }
    draw(level) {
        level.drawEntityBegin(this, level.textures.item[this.type]);
    }
}

export default class ItemManager extends EntityManager {
    constructor(event) {
        super();
        this.event = event;
    }
}
