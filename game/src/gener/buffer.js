
export default class SimpleBuffer {
    constructor(size) {
        this.data = new Float32Array(size * size);
        this.size = size;
        this.data.fill(0.0);
    }
    getData(x, y) {
        return y !== undefined ? this.data[y * this.size + x | 0] : this.data[x];
    }
    setData(x, y, val) {
        if (val !== undefined) this.data[y * this.size + x | 0] = val;
        else this.data[x] = y; // setData(index, val);
    }
    getSize() {
        return this.size;
    }
    getColor(context) {
        const imageData = context.createImageData(this.size, this.size);
        for (let i = 0; i < this.size * this.size; i++) {
            imageData.data[4 * i + 0] = this.data[i] * 255 | 0;
            imageData.data[4 * i + 1] = this.data[i] * 255 | 0;
            imageData.data[4 * i + 2] = this.data[i] * 255 | 0;
            imageData.data[4 * i + 3] = 255;
        }
        return imageData;
    }
    perlin(startFreq, koef) {
        const time = Date.now();
        const extrem = (freq, ampl) => {
            const dispersion = (rad) => 2 * rad * Math.random() - rad;

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

        console.log("Perlin noise = ", Date.now() - time);
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
        console.log("Normalize = ", Date.now() - time);
        return this;
    }
    forEach(fun) {
        const time = Date.now();
        for (let j = 0; j < this.size; j++) {
            for (let i = 0; i < this.size; i++) {
                this.data[j * this.size + i | 0] = fun(this.getData(i, j), i, j);
            }
        }
        console.log("For each = ", Date.now() - time);
        return this;
    }
    forBuf(buf, fun) {
        const time = Date.now();
        console.assert(this.size === buf.getSize(), "Sizes of buffers must be equal");
        for (let j = 0; j < this.size; j++) {
            for (let i = 0; i < this.size; i++) {
                this.data[j * this.size + i | 0] = fun(this.getData(i, j), buf.getData(i, j), i, j);
            }
        }
        console.log("For buffer = ", Date.now() - time);
        return this;
    }
    clamp(a, b) {
        const time = Date.now();
        for (let i = 0; i < this.size * this.size; i++) {
            this.data[i] = Math.max(a, Math.min(b, this.data[i]));
        }
        console.log("Clamp = ", Date.now() - time);
        return this;
    }
    /* this.gaussian_fast = function(radius, src_buf, dir, mask)
    {
        var time = Date.now();
        Console.assert(size === src_buf.getSize(), "Sizes of buffers must be equal");
        Console.assert(self !== src_buf, "Source buffer must does not be same with this");
        if (mask)
        {
            Console.assert(size === mask.getSize(), "Sizes of buffers must be equal");
            Console.assert(self !== mask, "Source buffer must does not be same with this");
        }

        function norm(x)
        {
            const a = 1 / (Math.sqrt(2 * Math.PI));
            const b = -x * x / 2;
            return a * Math.exp(b);
        }

        for (var j = 0; j < size; j++)
        {
            for (var i = 0; i < size; i++)
            {
                if (mask && mask.getData(i, j) < 0.5)
                    continue;

                var kol = 0.0;
                var sum = 0.0;
                for (var p = -radius; p <= radius; p++)
                {
                    var x = i + dir[0] * p;
                    var y = j + dir[1] * p;
                    if (y < 0) continue;
                    if (y >= size) break;
                    if (x < 0) continue;
                    if (x >= size) break;

                    var sx = (x - i) / radius;
                    var sy = (y - j) / radius;
                    var r = Math.sqrt(sx * sx + sy * sy);
                    var koef = norm(r * 3);
                    kol += koef;
                    sum += koef * src_buf.getData(x, y);
                }
                var ind = i + j * size | 0;
                data[ind] = sum / kol;
            }
        }
        Console.info("Gaussian fast = ", Date.now() - time);
    }
    this.getGaussian = function(radius, mask)
    {
        var blur_x = new Buffer(size);
        var blur = new Buffer(size);
        blur_x.gaussian_fast(radius, self, [1, 0], mask);
        blur.gaussian_fast(radius, blur_x, [0, 1], mask);
        return blur;
    }
    this.copy = function(src_image)
    {
        var time = Date.now();
        Console.assert(size === src_image.getSize(), "Sizes of buffers must be equal");
        Console.assert(self !== src_image, "Source buffer must does not be same with this");

        for (var i = 0;  i < size * size; i++)
            data[i] = src_image.getData(i);

        Console.info("Copy = ", Date.now() - time);
    }
    this.bresenham = function(x0, y0, x1, y1, val)
    {
        var dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
        var dy = Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
        var err = (dx > dy ? dx : -dy) / 2;

        while (true)
        {
            if (x0 >= 0 && x0 < size &&
                y0 >= 0 && y0 < size)
            {
                data[x0 + y0 * size] = val;
            }
            if (x0 === x1 && y0 === y1) break;
            var e2 = err;
            if (e2 > -dx) { err -= dy; x0 += sx; }
            if (e2 < dy) { err += dx; y0 += sy; }
        }
    } */
}
