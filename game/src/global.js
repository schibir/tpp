
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

export function tankRadius(type) {
    return type < TANK.PANZER ? 0.8 : 1;
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
    SPARK: 0,
    FIRE: 1,
    BRICK: 2,
    BETON: 4,
    EXPLODE: 8,
};
