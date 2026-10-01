class Lines {
    constructor(data, mode) {
        this.r = data.r;
        this.g = data.g;
        this.b = data.b;
        this.mode = mode;
        //this.a = data.hasOwnProperty("a") ? data.a : 1;
        this.name = data.name;
        this.array = new Float32Array(data.triplets);
        this.count = data.triplets.length / 3;
    }
    createBuffer(gl) {
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.array, gl.STATIC_DRAW);
    }
    drawArray(gl, coords) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.vertexAttribPointer(coords, 3, gl.FLOAT, false, 3 * 4, 0);
        gl.drawArrays(this.mode, 0, this.count);
    }
}
