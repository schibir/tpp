
import { getMapSize } from "./utils";
import { Entity, EntityManager } from "./entity";
import { LEVEL_TIME, STATE, TANK, tankRadius, getItem, itemRespawnTime } from "./global";

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
    update(tanks, time) {
        tanks.objects.forEach((tank) => {
            if (tank.state <= STATE.RESPAWN || tank.type === TANK.EAGLE || !this.alive) return;
            if (this.collide(tank, tankRadius(tank.type), 0.8)) {
                this.alive = false;
                this.event.emit("item", this.type, tank, time);
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

        event.on("levelup", (diff) => {
            this.difficulty = diff;
        });
    }
    reset(time) {
        super.reset();
        this.respawnTime = time + itemRespawnTime(this.difficulty);
        this.endTime = time + LEVEL_TIME;
    }
    update(level, tanks, time) {
        if (time > this.respawnTime && time < this.endTime) {
            this.objects.push(new Item(this.event));
            this.respawnTime = time + itemRespawnTime(this.difficulty);
        }

        if (this.mode === "bench") this.endTime = time + LEVEL_TIME;

        this.objects.forEach((item) => item.update(tanks, time));
        this.splice();
    }
}
