
import { getMapSize } from "./utils";
import { Entity, EntityManager } from "./entity";
import { tankRadius, getItem, itemRespawnTime } from "./global";

class Item extends Entity {
    constructor(event) {
        const { mapWidth, mapHeight } = getMapSize();
        const cx = Math.random() * (mapWidth - 4) + 1 | 0;
        const cy = Math.random() * (mapHeight - 4) + 1 | 0;
        super(cx, cy);

        this.type = getItem();
        this.event = event;
    }
    draw(level) {
        level.drawEntityBegin(this, level.textures.item[this.type]);
    }
    update(tanks) {
        tanks.objects.forEach((tank) => {
            if (this.collide(tank, tankRadius(tank.type), 0.8)) {
                this.alive = false;
                this.event.emit("item", this.type, tank);
            }
        });
    }
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
    update(level, tanks, time) {
        if (time > this.respawnTime) {
            this.objects.push(new Item(this.event));
            this.respawnTime = time + itemRespawnTime(this.difficulty);
        }

        this.objects.forEach((item) => item.update(tanks));
        this.splice();
    }
}
