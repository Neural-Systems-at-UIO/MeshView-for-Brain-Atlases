function Mesh(rawdata){
    var view=new DataView(rawdata);
    var idx=4;
    this.minx=view.getFloat32(idx);idx+=4;
    this.maxx=view.getFloat32(idx);idx+=4;
    this.miny=view.getFloat32(idx);idx+=4;
    this.maxy=view.getFloat32(idx);idx+=4;
    this.minz=view.getFloat32(idx);idx+=4;
    this.maxz=view.getFloat32(idx);idx+=4;
    this.chunks=view.getUint8(idx);idx+=1;
    this.lists=[];
    for(var i=0;i<this.chunks;i++){
        var vertices=view.getUint16(idx);idx+=2;
        var list=new Float32Array(vertices*6);
        for(var j=0;j<vertices*6;j++){
            list[j]=view.getFloat32(idx);idx+=4;
        }
        this.lists.push(list);
        var indices=view.getUint32(idx);idx+=4;
        list=new Uint16Array(indices);
        for(var j=0;j<indices;j++){
            list[j]=view.getUint16(idx);idx+=2;
        }
        this.lists.push(list);
    }
}

Mesh.prototype.createBuffers=function(gl){
    this.buffers=[];
    for(var i=0;i<this.chunks;i++){
        var vertexbuff=gl.createBuffer();
        var indexbuff=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexbuff);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexbuff);
        gl.bufferData(gl.ARRAY_BUFFER, this.lists[i*2], gl.STATIC_DRAW);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.lists[i*2+1], gl.STATIC_DRAW);
        this.buffers.push(vertexbuff);
        this.buffers.push(indexbuff);
    }
};

Mesh.prototype.drawElements=function(gl,coords,normals){
    for(var i=0;i<this.chunks;i++){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[i*2]);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers[i*2+1]);
        gl.vertexAttribPointer(coords, 3, gl.FLOAT, false, 6*4, 0);
        if(typeof normals!=="undefined")gl.vertexAttribPointer(normals, 3, gl.FLOAT, false, 6*4, 3*4);
        gl.drawElements(gl.TRIANGLES, this.lists[i*2+1].length, gl.UNSIGNED_SHORT,0);
    }
};
