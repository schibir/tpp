
import { getMapSize, Random } from "./utils";
import { Entity, EntityManager } from "./entity";
import {
    STATE, TANK, tankRadius, getItem, itemRespawnTime,
} from "./global";

class Item extends Entity {
    constructor(event) {
        const { mapWidth, mapHeight } = getMapSize();
        const cx = Random.next((mapWidth - 4)) + 1 | 0;
        const cy = Random.next((mapHeight - 4)) + 1 | 0;
        super(cx, cy);

        this.type = getItem();
        this.event = event;
    }
    draw(level) {
        level.drawEntityBegin(this, level.textures.item[this.type]);
    }
    update(tanks) {
        tanks.objects.forEach((tank) => {
            if (tank.state <= STATE.RESPAWN || tank.type === TANK.EAGLE || !this.alive) return;
            if (this.collide(tank, tankRadius(tank.type), 0.8)) {
                this.alive = false;
                this.event.emit("item", this.type, tank);
            }
        });
    }
}

export default class ItemManager extends EntityManager {
    constructor(difficulty, event, mode) {
        super();
        this.event = event;
        this.mode = mode;
        this.difficulty = difficulty;
        this.end_of_time = false;

        event.on("levelup", (diff) => {
            this.difficulty = diff;
        });
        event.on("endOfTime", () => {
            this.end_of_time = this.mode !== "bench";
        });
    }
    reset() {
        this.respawnTime = itemRespawnTime(this.difficulty);
        this.end_of_time = false;
    }
    update(tanks, time) {
        if (time > this.respawnTime && !this.end_of_time) {
            this.objects.push(new Item(this.event));
            this.respawnTime = time + itemRespawnTime(this.difficulty);
        }

        this.objects.forEach((item) => item.update(tanks));
        this.splice();
    }
    addItem(type, cx, cy) {
        const item = new Item(this.event);
        item.type = type;
        item.cx = cx;
        item.cy = cy;
        this.objects.push(item);
    }
}
