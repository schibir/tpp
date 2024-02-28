
import { rand, clamp } from "../utils";

function lerp(a, b, t) {
    return a * (1 - t) + b * t;
}

function norm(x) {
    const a = 1 / (Math.sqrt(2 * Math.PI));
    const b = -x * x / 2;
    return a * Math.exp(b);
}

export default class SimpleBuffer {
    constructor(size) {
        this.data = new Float32Array(size * size);
        this.size = size;
    }
    getData(x, y) {
        if (x < 0 || x > this.size - 1) return 0.0;
        if (y < 0 || y > this.size - 1) return 0.0;
        return this.data[y * this.size + x | 0];
    }
    setData(x, y, val) {
        if (x < 0 || x > this.size - 1) return;
        if (y < 0 || y > this.size - 1) return;
        this.data[y * this.size + x | 0] = val;
    }
    getColor(col = [255, 255, 255], mask = null) {
        return this.getColor2([0, 0, 0], col, mask);
    }
    getColor2(col0 = [0, 0, 0], col1 = [255, 255, 255], mask = null) {
        console.assert(!mask || mask.size === this.size, "Require same size");
        const canvas = document.createElement("canvas");
        canvas.width = this.size;
        canvas.height = this.size;
        const context = canvas.getContext("2d");
        const imageData = context.createImageData(this.size, this.size);
        for (let i = 0; i < this.size * this.size; i++) {
            imageData.data[4 * i + 0] = clamp(lerp(col0[0], col1[0], this.data[i]), 0, 255) | 0;
            imageData.data[4 * i + 1] = clamp(lerp(col0[1], col1[1], this.data[i]), 0, 255) | 0;
            imageData.data[4 * i + 2] = clamp(lerp(col0[2], col1[2], this.data[i]), 0, 255) | 0;
            imageData.data[4 * i + 3] = mask ? mask.data[i] * 255 | 0 : 255;
        }
        context.putImageData(imageData, 0, 0);
        return canvas;
    }
    getColorLerp(img0, img1, mask = null) {
        console.assert(img0.width === img1.width, "Require same image");
        console.assert(img0.height === img1.height, "Require same image");
        console.assert(img0.width === this.size, "Require same image");
        console.assert(img0.height === this.size, "Require same image");
        console.assert(!mask || mask.size === this.size, "Require same size");

        const data0 = img0.getContext("2d").getImageData(0, 0, this.size, this.size).data;
        const data1 = img1.getContext("2d").getImageData(0, 0, this.size, this.size).data;
        const canvas = document.createElement("canvas");
        canvas.width = this.size;
        canvas.height = this.size;
        const context = canvas.getContext("2d");
        const imageData = context.createImageData(this.size, this.size);
        for (let i = 0; i < this.size * this.size; i++) {
            imageData.data[4 * i + 0] = lerp(data0[4 * i + 0], data1[4 * i + 0], this.data[i]) | 0;
            imageData.data[4 * i + 1] = lerp(data0[4 * i + 1], data1[4 * i + 1], this.data[i]) | 0;
            imageData.data[4 * i + 2] = lerp(data0[4 * i + 2], data1[4 * i + 2], this.data[i]) | 0;
            imageData.data[4 * i + 3] = mask ? mask.data[i] * 255 | 0 : 255;
        }
        context.putImageData(imageData, 0, 0);
        return canvas;
    }
    perlin(startFreq, koef) {
        const time = Date.now();
        const extrem = (freq, ampl) => {
            const dispersion = (rad) => rand(0, rad);

            const ret = new Array(freq * freq);
            for (let i = 0; i < freq * freq; i++) {
                ret[i] = dispersion(ampl);
            }
            return ret;
        };
        const cosLerp = (a, b, t) => {
            const ft = t * Math.PI;
            const f = (1 - Math.cos(ft)) * 0.5;
            return a * (1 - f) + b * f;
        };

        let ampl = 1;
        let freq = startFreq;

        do {
            const buf = extrem(freq, ampl);
            const bufData = (x, y) => buf[y * freq + x | 0];

            for (let j = 0; j < this.size; j++) {
                for (let i = 0; i < this.size; i++) {
                    let x = i * freq / this.size | 0;
                    let y = j * freq / this.size | 0;
                    const tx = i * freq / this.size - x;
                    const ty = j * freq / this.size - y;
                    const x1 = bufData(x, y);
                    const oldX = x;
                    x++;
                    if (x > freq - 1) x = 0;
                    const x2 = bufData(x, y);
                    const xx = cosLerp(x1, x2, tx);

                    y++;
                    if (y > freq - 1) y = 0;
                    const y1 = bufData(oldX, y);
                    const y2 = bufData(x, y);
                    const yy = cosLerp(y1, y2, tx);
                    const h = cosLerp(xx, yy, ty);

                    this.data[this.size * j + i | 0] += h;
                }
            }
            freq *= 2;
            ampl *= koef;
        }
        while (freq < this.size);

        return this;
    }
    normalize(a, b) {
        const time = Date.now();
        let min = this.data[0];
        let max = this.data[0];
        for (let i = 1; i < this.size * this.size; i++) {
            max = Math.max(max, this.data[i]);
            min = Math.min(min, this.data[i]);
        }
        const k = (b - a) / (max - min);
        for (let i = 0; i < this.size * this.size; i++) {
            this.data[i] = (this.data[i] - min) * k + a;
        }
        return this;
    }
    forEach(fun) {
        const time = Date.now();
        for (let j = 0; j < this.size; j++) {
            for (let i = 0; i < this.size; i++) {
                const ind = j * this.size + i | 0;
                this.data[ind] = fun(this.data[ind], i, j);
            }
        }
        return this;
    }
    forBuf(buf, fun) {
        const time = Date.now();
        console.assert(this.size === buf.size, "Sizes of buffers must be equal");
        for (let j = 0; j < this.size; j++) {
            for (let i = 0; i < this.size; i++) {
                const ind = j * this.size + i | 0;
                this.data[ind] = fun(this.data[ind], buf.data[ind], i, j);
            }
        }
        return this;
    }
    clamp(a, b) {
        const time = Date.now();
        for (let i = 0; i < this.size * this.size; i++) {
            this.data[i] = clamp(this.data[i], a, b);
        }
        return this;
    }
    gaussianFast(srcBuf, radius, dir) {
        const time = Date.now();
        console.assert(this.size === srcBuf.size, "Sizes of buffers must be equal");
        console.assert(this !== srcBuf, "Source buffer must does not be same with this");

        for (let j = 0; j < this.size; j++) {
            for (let i = 0; i < this.size; i++) {
                let kol = 0.0;
                let sum = 0.0;
                for (let p = -radius; p <= radius; p++) {
                    let x = i + dir[0] * p;
                    let y = j + dir[1] * p;

                    const sx = (x - i) / radius;
                    const sy = (y - j) / radius;
                    const r = Math.sqrt(sx * sx + sy * sy);
                    const koef = norm(r * 3);
                    kol += koef;

                    if (x < 0) x += this.size;
                    if (y < 0) y += this.size;
                    if (x > this.size - 1) x -= this.size;
                    if (y > this.size - 1) y -= this.size;

                    sum += koef * srcBuf.data[y * this.size + x | 0];
                }
                const ind = i + j * this.size | 0;
                this.data[ind] = sum / kol;
            }
        }
    }
    gaussian(radius) {
        const blur = new SimpleBuffer(this.size);
        blur.gaussianFast(this, radius, [1, 0]);
        this.gaussianFast(blur, radius, [0, 1]);
        return this;
    }
    copy(src) {
        const time = Date.now();
        console.assert(this.size === src.size, "Sizes of buffers must be equal");
        console.assert(this !== src, "Source buffer must does not be same with this");

        for (let i = 0; i < this.size * this.size; i++) {
            this.data[i] = src.data[i];
        }

        return this;
    }
    bresenham(x0, y0, x1, y1, val) {
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = (dx > dy ? dx : -dy) / 2;
        let x = x0;
        let y = y0;

        for (;;) {
            this.setData(x, y, val);
            if (x === x1 && y === y1) break;
            const e2 = err;
            if (e2 > -dx) {
                err -= dy;
                x += sx;
            }
            if (e2 < dy) {
                err += dx;
                y += sy;
            }
        }
        return this;
    }
    differential(fun) {
        for (let j = 0; j < this.size; j++) {
            for (let i = 0; i < this.size; i++) {
                let nx = i + 1;
                let ny = j + 1;
                if (nx > this.size - 1) nx = 0;
                if (ny > this.size - 1) ny = 0;
                const ind00 = j * this.size + i;
                const ind01 = ny * this.size + i;
                const ind10 = j * this.size + nx;
                const col00 = this.data[ind00];
                const col01 = this.data[ind01];
                const col10 = this.data[ind10];
                const dx = (col10 - col00) * 0.5;
                const dy = (col01 - col00) * 0.5;
                fun(ind00, dx, dy);
            }
        }
    }
    diff(dir) {
        const time = Date.now();

        const buf = new SimpleBuffer(this.size);
        buf.copy(this);
        buf.differential((ind, dx, dy) => {
            this.data[ind] = dx * dir[0] + dy * dir[1];
        });

        return this;
    }
    diffFree() {
        const time = Date.now();

        const buf = new SimpleBuffer(this.size);
        buf.copy(this);
        buf.differential((ind, dx, dy) => {
            this.data[ind] = Math.sqrt(dx * dx + dy * dy);
        });

        return this;
    }
    brick(countWidth, countHeight, alternat = true) {
        const time = Date.now();

        const brickWidth = this.size / countWidth;
        const brickHeight = this.size / countHeight;

        for (let brickY = 0; brickY < countHeight; brickY++) {
            const startX = (brickY % 2 | 0) && alternat ? (-brickWidth * 0.5 | 0) : 0;
            const startY = brickY * brickHeight | 0;
            for (let brickX = 0; brickX < countWidth; brickX++) {
                const color = Math.random();
                const X = startX + brickX * brickWidth | 0;
                for (let j = startY; j < startY + brickHeight; j++) {
                    if (j > this.size - 1) break;
                    for (let i = X; i < X + brickWidth; i++) {
                        const x = i < 0 ? this.size + i : i;
                        this.data[j * this.size + x] = color;
                    }
                }
            }
        }

        return this;
    }
    brickMask(countWidth, countHeight, alternat = true) {
        const time = Date.now();

        const brickWidth = this.size / countWidth;
        const brickHeight = this.size / countHeight;

        for (let brickY = 0; brickY < countHeight; brickY++) {
            const y = brickY * brickHeight | 0;
            const startX = (brickY % 2 | 0) && alternat ? (-brickWidth * 0.5 | 0) : 0;
            this.bresenham(0, y, this.size, y, 1);

            for (let brickX = 0; brickX < countWidth; brickX++) {
                let x = startX + brickX * brickWidth | 0;
                if (x < 0) x += this.size;
                this.bresenham(x, y, x, y + brickHeight | 0, 1);
            }
        }

        return this;
    }
    normDist(rad, dx = 0, dy = 0) {
        const time = Date.now();

        for (let j = 0; j < this.size; j++) {
            for (let i = 0; i < this.size; i++) {
                const x = ((i - this.size * 0.5) / (this.size * 0.5) + dx) / rad;
                const y = ((j - this.size * 0.5) / (this.size * 0.5) + dy) / rad;
                const r = Math.sqrt(x * x + y * y);
                const koef = norm(r * 3);
                this.data[j * this.size + i] = koef;
            }
        }

        return this;
    }
    normSquare(minRad, rad) {
        const time = Date.now();

        for (let j = 0; j < this.size; j++) {
            for (let i = 0; i < this.size; i++) {
                const x = (i - this.size * 0.5) / (this.size * 0.5);
                const y = (j - this.size * 0.5) / (this.size * 0.5);
                let r = 0;
                if (Math.abs(x) > minRad && Math.abs(y) > minRad) {
                    const sx = Math.abs(x) - minRad;
                    const sy = Math.abs(y) - minRad;
                    r = Math.sqrt(sx * sx + sy * sy);
                } else if (Math.abs(x) > minRad) r = Math.abs(x) - minRad;
                else if (Math.abs(y) > minRad) r = Math.abs(y) - minRad;
                r /= rad;
                const koef = norm(r * 3);
                this.data[j * this.size + i] = koef;
            }
        }

        return this;
    }
}
