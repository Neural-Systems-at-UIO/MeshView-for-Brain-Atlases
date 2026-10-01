class Sphere {
    constructor(x, y, z, r) {
        const phi = (Math.sqrt(5) + 1) / 2;
        const a = 1;
        const b = 1 / phi;
        const vertices = this.vertices = [
            [0, b, -a],
            [b, a, 0],
            [-b, a, 0],
            [0, b, a],
            [0, -b, a],
            [-a, 0, b],
            [0, -b, -a],
            [a, 0, -b],
            [a, 0, b],
            [-a, 0, -b],
            [b, -a, 0],
            [-b, -a, 0]
        ];
        this.triangles = [
            [3, 2, 1],
            [2, 3, 4],
            [6, 5, 4],
            [5, 9, 4],
            [8, 7, 1],
            [7, 10, 1],
            [12, 11, 5],
            [11, 12, 7],
            [10, 6, 3],
            [6, 10, 12],
            [9, 8, 2],
            [8, 9, 11],
            [3, 6, 4],
            [9, 2, 4],
            [10, 3, 1],
            [2, 8, 1],
            [12, 10, 7],
            [8, 11, 7],
            [6, 12, 5],
            [11, 9, 5]
        ].map(triangle => triangle.map(index => index - 1));

        const half = (a, b) => {
            a = vertices[a];
            b = vertices[b];
            vertices.push([
                (a[0] + b[0]) / 2,
                (a[1] + b[1]) / 2,
                (a[2] + b[2]) / 2
            ]);
            return vertices.length - 1;
        };

        for (let i = 0; i < 3; i++) {
            const halfpoints = new Map;
            const triangles = [];
            for (const t of this.triangles) {
                const [a, b, c] = t;
                let ab = halfpoints.get(a + ";" + b);
                if (!ab) {
                    halfpoints.set(b + ";" + a, ab = half(a, b));
                }
                let bc = halfpoints.get(b + ";" + c);
                if (!bc) {
                    halfpoints.set(c + ";" + b, bc = half(b, c));
                }
                let ca = halfpoints.get(c + ";" + a);
                if (!ca) {
                    halfpoints.set(a + ";" + c, ca = half(c, a));
                }
                triangles.push(
                        [a, ab, ca],
                        [ab, b, bc],
                        [bc, c, ca],
                        [ca, ab, bc]
                        );
            }
            this.triangles = triangles;

            for (const v of vertices) {
                const l = Math.hypot(...v);
                for (let i = 0; i < 3; i++)
                    v[i] /= l;
            }
        }

        for (const v of vertices) {
            for (let i = 0; i < 3; i++) {
                v.push(v[i]);
                v[i] *= r;
                v[i] += [x, y, z][i];
            }
        }
    }
    createBuffers(gl) {
        const vb = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vb);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices.flat()), gl.STATIC_DRAW);
        const ib = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.triangles.flat()), gl.STATIC_DRAW);
        this.vertexbuffer = vb;
        this.indexbuffer = ib;
    }
    drawElements(gl, coords, normals) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexbuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexbuffer);
        gl.vertexAttribPointer(coords, 3, gl.FLOAT, false, 6 * 4, 0);
        gl.vertexAttribPointer(normals, 3, gl.FLOAT, false, 6 * 4, 3 * 4);
        gl.drawElements(gl.TRIANGLES, this.triangles.length * 3, gl.UNSIGNED_SHORT, 0);
    }
}
