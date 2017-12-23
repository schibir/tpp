
import { rand, getProbability } from "./utils";

export const TANK = {
    TANK1: 0,
    TANK2: 1,
    SIMPLE: 2,
    BMP: 3,
    CANNON: 4,
    STRONG: 5,
    PANZER: 6,
    RANDOM: 7,
};

export const STATE = {
    DEAD: 0,
    RESPAWN: 1,
    GOD: 2,
    NORMAL: 3,
};

export function tankRadius(type) {
    return type < TANK.PANZER ? 0.8 : 1;
}

export function tankLife(type) {
    console.assert(type >= TANK.TANK1 && type <= TANK.RANDOM, "Wrong tank type");
    const lifeTable = [1, 1, 1, 1, 1, 4, 6, 0];
    return lifeTable[type];
}

export function botTypeProbability(difficulty) {
    const botTypeProbabilities = [
        [0, 0, 10, 6, 6, 3, 1],         // Private
        [0, 0, 5, 5, 5, 3, 2],          // Sergeant
        [0, 0, 2, 4, 4, 4, 3],          // Lieutenant
        [0, 0, 1, 3, 3, 4, 4],          // General
    ];
    const ind = difficulty / 4 | 0;
    console.assert(ind >= 0 && ind < 4, "Wrong difficulty value");
    return getProbability(botTypeProbabilities[ind]);
}

export function angleProbability() {
    return getProbability([1, 3, 5, 3]);
}

export function shootTime(difficulty) {
    const shootTable = [
        2000, 1700, 1300, 1000,
        800, 750, 700, 650,
        600, 500, 450, 400,
        350, 300, 250, 200,
    ];
    console.assert(difficulty >= 0 && difficulty < 16, "Wrong difficulty value");
    return shootTable[difficulty];
}

export function tankVelocity(type) {
    console.assert(type >= TANK.TANK1 && type <= TANK.RANDOM, "Wrong tank type");
    return [1.5, 1.5, 1.2, 2.4, 1.2, 1, 0.75, 0][type];
}

export function directionTime(collision) {
    return collision ? rand(250, 150) : rand(3000, 1000);
}

export const BULLET = {
    SIMPLE: 0,
    SINGLE: 1,
    DOUBLE: 2,
    POWER: 3,
    FIRE: 4,
};

export function bulletVelocity(type) {
    return type & (BULLET.SINGLE | BULLET.DOUBLE) ? 7.2 : 2.88;
}

export function bulletsCount(type) {
    return type & BULLET.DOUBLE ? 2 : 1;
}

export const ITEM = {
    LIFE: 0,
    KNUKLE: 1,
    STAR: 2,
    SPEED: 3,
    FIREBALL: 4,
};

export const PART = {
    SPARK: 1,
    FIRE: 2,
    BRICK: 4,
    BETON: 8,
    EXPLODE: 16,
};

export function timeToRespawn(difficulty) {
    const respTable = [
        5000, 4000, 3000, 2000,
        1500, 1350, 1200, 1100,
        1000, 850, 700, 600,
        500, 400, 300, 200,
    ];
    console.assert(difficulty >= 0 && difficulty < 16, "Wrong difficulty value");
    return respTable[difficulty] + Math.random() * 3000;
}
