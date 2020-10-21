function Points(data){
//    this.idx=data.idx;
    this.count=data.triplets.length/3;//data.count;
    this.r=data.r;
    this.g=data.g;
    this.b=data.b;
    this.a=data.hasOwnProperty("a")?data.a:1;
    this.name=data.name;
    this.array=new Float32Array(data.triplets);
    this.enabled=true;
}

Points.prototype.createBuffer=function(gl){
    this.buffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.array, gl.STATIC_DRAW);
};

Points.prototype.drawArray=function(gl,coords){
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.vertexAttribPointer(coords, 3, gl.FLOAT, false, 3*4, 0);
    gl.drawArrays(gl.POINTS,0,this.count);
};
