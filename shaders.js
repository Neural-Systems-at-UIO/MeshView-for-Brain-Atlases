function buildprogram(gl,vsrc,fsrc){
    var vs=gl.createShader(gl.VERTEX_SHADER);
    var fs=gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(vs,vsrc);
    gl.shaderSource(fs,fsrc);
    gl.compileShader(vs);
    gl.compileShader(fs);
    prg=gl.createProgram();
    gl.attachShader(prg, vs);
    gl.attachShader(prg, fs);
    gl.linkProgram(prg);
    return prg;
}
function buildshaders(gl){
    return {
        solidcloud:buildprogram(gl,
            "attribute vec3 coords;"+

            "uniform mat4 alltrf;"+
            "uniform float pointsize;"+

            "void main(void)"+
            "{"+
            "    gl_Position = vec4(coords, 1.)*alltrf;"+
            "    gl_PointSize = pointsize;"+
            "}",
        
            "precision highp float;"+
            "uniform vec4 color;"+
            "void main(void)"+
            "{"+
//                if(distance(gl_PointCoord,vec2(0.5,0.5))>=0.5)discard;
            "    vec2 v=gl_PointCoord-vec2(0.5,0.5);"+
            "    if(dot(v,v)>0.25)discard;"+
//                if(dot(gl_PointCoord-vec2(0.5,0.5),gl_PointCoord-vec2(0.5,0.5))>=0.25)discard;
            "    gl_FragColor=color;"+
            "}"
        ),
        cutcloud:buildprogram(gl,
            "attribute vec3 coords;"+

            "uniform mat4 alltrf;"+
            "uniform float pointsize;"+

            "uniform vec3 cutbase;"+
            "uniform vec3 cutnormal;"+

            "varying float height;"+
            "void main(void)"+
            "{"+
            "    height=dot(cutbase-coords,cutnormal);"+
            "    gl_Position = vec4(coords, 1.)*alltrf;"+
            "    gl_PointSize = pointsize;"+
            "}",
        
            "precision highp float;"+
            "uniform vec4 color;"+
            "varying float height;"+
            "void main(void)"+
            "{"+
            "    if(height>=0.)discard;"+
//                if(distance(gl_PointCoord,vec2(0.5,0.5))>=0.5)discard;
            "    vec2 v=gl_PointCoord-vec2(0.5,0.5);"+
            "    if(dot(v,v)>0.25)discard;"+
//                if(dot(gl_PointCoord-vec2(0.5,0.5),gl_PointCoord-vec2(0.5,0.5))>=0.25)discard;
            "    gl_FragColor=color;"+
            "}"
        ),
        slicecloud:buildprogram(gl,
            "attribute vec3 coords;"+

            "uniform mat4 alltrf;"+
            "uniform float pointsize;"+

            "uniform vec3 cutbase;"+
            "uniform vec3 cutbase2;"+
            "uniform vec3 cutnormal;"+

            "varying float height;"+
            "varying float height2;"+
            "void main(void)"+
            "{"+
            "    height=dot(cutbase-coords,cutnormal);"+
            "    height2=dot(cutbase2-coords,cutnormal);"+
            "    gl_Position = vec4(coords, 1.)*alltrf;"+
            "    gl_PointSize = pointsize;"+
            "}",

            "precision highp float;"+
            "uniform vec4 color;"+
            "varying float height;"+
            "varying float height2;"+
            "void main(void)"+
            "{"+
            "    if(height>=0. || height2<=0.)discard;"+
//                if(distance(gl_PointCoord,vec2(0.5,0.5))>=0.5)discard;
            "    vec2 v=gl_PointCoord-vec2(0.5,0.5);"+
            "    if(dot(v,v)>0.25)discard;"+
//                if(dot(gl_PointCoord-vec2(0.5,0.5),gl_PointCoord-vec2(0.5,0.5))>=0.25)discard;
            "    gl_FragColor=color;"+
            "}"
        ),
        solidmesh:buildprogram(gl,
            "attribute vec3 coords;"+
            "attribute vec3 normals;"+

            "uniform mat4 normtrf;"+
            "uniform mat4 alltrf;"+

            "varying vec4 norm4;"+
            "void main(void)"+
            "{"+
            "    norm4=vec4(normals,1.)*normtrf;"+
            "    gl_Position = vec4(coords, 1.)*alltrf;"+
            "}",

            "precision highp float;"+
            "uniform vec3 color;"+
            "varying vec4 norm4;"+
            "void main(void)"+
            "{"+
            "    float n=abs(normalize(norm4).z);"+
            "    gl_FragColor=vec4(color*n,1.);"+
            "}"
        ),
        cutmesh:buildprogram(gl,
            "attribute vec3 coords;"+
            "attribute vec3 normals;"+

            "uniform mat4 normtrf;"+
            "uniform mat4 alltrf;"+
            
            "uniform vec3 cutbase;"+
            "uniform vec3 cutnormal;"+

            "varying vec4 norm4;"+
            "varying float height;"+
            "void main(void)"+
            "{"+
            "    norm4=vec4(normals,1.)*normtrf;"+
            "    height=dot(cutbase-coords,cutnormal);"+
            "    gl_Position = vec4(coords, 1.)*alltrf;"+
            "}",

            "precision highp float;"+
            "uniform vec3 color;"+
            "varying vec4 norm4;"+
            "varying float height;"+
            "void main(void)"+
            "{"+
            "    if(height<=0.)discard;"+
            "    float n=abs(normalize(norm4).z);"+
            "    gl_FragColor=vec4(color*n,1.);"+
            "}"
        ),
        cutsurface:buildprogram(gl,
            "attribute vec3 coords;"+

            "uniform mat4 alltrf;"+
            
            "uniform vec3 cutbase;"+
            "uniform vec3 cutnormal;"+

            "varying float height;"+
            "void main(void)"+
            "{"+
            "    height=dot(cutbase-coords,cutnormal);"+
            "    gl_Position = vec4(coords, 1.)*alltrf;"+
            "}",

            "precision highp float;"+
            "uniform vec3 color;"+
            "varying float height;"+
            "void main(void)"+
            "{"+
            "    if(height<=0.)discard;"+
            "    gl_FragColor=vec4(color,1.);"+
            "}"
        ),
        cutmesh2:buildprogram(gl,
            "attribute vec3 coords;"+
            "attribute vec3 normals;"+

            "uniform mat4 normtrf;"+
            "uniform mat4 alltrf;"+
            
            "uniform vec3 cutbase;"+
            "uniform vec3 cutnormal;"+
            "uniform vec3 cutbase2;"+
            "uniform vec3 cutnormal2;"+

            "varying vec4 norm4;"+
            "varying float height;"+
            "varying float height2;"+
            "void main(void)"+
            "{"+
            "    norm4=vec4(normals,1.)*normtrf;"+
            "    height=dot(cutbase-coords,cutnormal);"+
            "    height2=dot(cutbase2-coords,cutnormal2);"+
            "    gl_Position = vec4(coords, 1.)*alltrf;"+
            "}",

            "precision highp float;"+
            "uniform vec3 color;"+
            "varying vec4 norm4;"+
            "varying float height;"+
            "varying float height2;"+
            "void main(void)"+
            "{"+
  //          "    if(height<=0. || height2<=0.)discard;"+
            "    if(height<=0. && height2<=0.)discard;"+
            "    float n=abs(normalize(norm4).z);"+
            "    gl_FragColor=vec4(color*n,1.);"+
            "}"
        ),
        cutsurface2:buildprogram(gl,
            "attribute vec3 coords;"+

            "uniform mat4 alltrf;"+
            
            "uniform vec3 cutbase;"+
            "uniform vec3 cutnormal;"+
            "uniform vec3 cutbase2;"+
            "uniform vec3 cutnormal2;"+

            "varying float height;"+
            "varying float height2;"+
            "void main(void)"+
            "{"+
            "    height=dot(cutbase-coords,cutnormal);"+
            "    height2=dot(cutbase2-coords,cutnormal2);"+
            "    gl_Position = vec4(coords, 1.)*alltrf;"+
            "}",

            "precision highp float;"+
            "uniform vec3 color;"+
            "varying float height;"+
            "varying float height2;"+
            "void main(void)"+
            "{"+
//            "    if(height<=0. || height2<=0.)discard;"+
            "    if(height<=0. && height2<=0.)discard;"+
            "    gl_FragColor=vec4(color,1.);"+
            "}"
        ),
        cutmesh3:buildprogram(gl,
            "attribute vec3 coords;"+
            "attribute vec3 normals;"+

            "uniform mat4 normtrf;"+
            "uniform mat4 alltrf;"+
            
            "uniform vec3 cutbase;"+
            "uniform vec3 cutnormal;"+
            "uniform vec3 cutbase2;"+
            "uniform vec3 cutnormal2;"+
            "uniform vec3 cutbase3;"+
            "uniform vec3 cutnormal3;"+

            "varying vec4 norm4;"+
            "varying float height;"+
            "varying float height2;"+
            "varying float height3;"+
            "void main(void)"+
            "{"+
            "    norm4=vec4(normals,1.)*normtrf;"+
            "    height=dot(cutbase-coords,cutnormal);"+
            "    height2=dot(cutbase2-coords,cutnormal2);"+
            "    height3=dot(cutbase3-coords,cutnormal3);"+
            "    gl_Position = vec4(coords, 1.)*alltrf;"+
            "}",

            "precision highp float;"+
            "uniform vec3 color;"+
            "varying vec4 norm4;"+
            "varying float height;"+
            "varying float height2;"+
            "varying float height3;"+
            "void main(void)"+
            "{"+
//            "    if(height<=0. || height2<=0. || height3<=0.)discard;"+
            "    if(height<=0. && height2<=0. && height3<=0.)discard;"+
            "    float n=abs(normalize(norm4).z);"+
            "    gl_FragColor=vec4(color*n,1.);"+
            "}"
        ),
        cutsurface3:buildprogram(gl,
            "attribute vec3 coords;"+

            "uniform mat4 alltrf;"+
            
            "uniform vec3 cutbase;"+
            "uniform vec3 cutnormal;"+
            "uniform vec3 cutbase2;"+
            "uniform vec3 cutnormal2;"+
            "uniform vec3 cutbase3;"+
            "uniform vec3 cutnormal3;"+

            "varying float height;"+
            "varying float height2;"+
            "varying float height3;"+
            "void main(void)"+
            "{"+
            "    height=dot(cutbase-coords,cutnormal);"+
            "    height2=dot(cutbase2-coords,cutnormal2);"+
            "    height3=dot(cutbase3-coords,cutnormal3);"+
            "    gl_Position = vec4(coords, 1.)*alltrf;"+
            "}",

            "precision highp float;"+
            "uniform vec3 color;"+
            "varying float height;"+
            "varying float height2;"+
            "varying float height3;"+
            "void main(void)"+
            "{"+
//            "    if(height<=0. || height2<=0. || height3<=0.)discard;"+
            "    if(height<=0. && height2<=0. && height3<=0.)discard;"+
            "    gl_FragColor=vec4(color,1.);"+
            "}"
        ),
        ghostmesh:buildprogram(gl,
            "attribute vec3 coords;"+
            "attribute vec3 normals;"+

            "uniform mat4 normtrf;"+
            "uniform mat4 alltrf;"+

            "varying vec4 norm4;"+
            "void main(void)"+
            "{"+
            "    norm4=vec4(normals,1.)*normtrf;"+
            "    gl_Position = vec4(coords, 1.)*alltrf;"+
            "}",

            "precision highp float;"+
            "uniform vec3 color;"+
            "varying vec4 norm4;"+
            "void main(void)"+
            "{"+
            "    float n=abs(normalize(norm4).z);"+
//            "    float n=max(normalize(norm4).z,0.);"+
//            "    gl_FragColor=vec4(color*n*(1.-n),1.-n);"+
//            "    gl_FragColor=vec4(color*n,1.-n);"+
//            "    gl_FragColor=vec4(color*n,1.-n);"+
//            "    gl_FragColor=vec4(color*n*0.3,1.-n);"+
//            "    gl_FragColor=vec4(color*n*0.3,(1.-n)*n);"+
//            "    gl_FragColor=vec4(color*n*0.3,(1.-n)*(1.-n));"+
//            "    gl_FragColor=vec4(color*(1.-n),1.-n);"+
//            "    gl_FragColor=vec4(color*(1.-n)*0.5,1.-n);"+
            "    gl_FragColor=vec4(color*n,1.-n);"+
//            "    float n=pow(1.-abs(normalize(norm4).z),2.);"+
//            "    gl_FragColor=vec4(color*(1.-n)*0.3,n);"+
            "}"
        ),
        transparentmesh:buildprogram(gl,
            "attribute vec3 coords;"+
//            "attribute vec3 normals;"+

//            "uniform mat4 normtrf;"+
            "uniform mat4 alltrf;"+

//            "varying vec4 norm4;"+
            "void main(void)"+
            "{"+
//            "    norm4=vec4(normals,1.)*normtrf;"+
            "    gl_Position = vec4(coords, 1.)*alltrf;"+
            "}",

            "precision highp float;"+
            "uniform vec4 color;"+
//            "varying vec4 norm4;"+
            "void main(void)"+
            "{"+
//            "    float n=abs(normalize(norm4).z);"+
//            "    float n=max(normalize(norm4).z,0.);"+
//            "    gl_FragColor=vec4(color*n*(1.-n),1.-n);"+
//            "    gl_FragColor=vec4(color*n,1.-n);"+
//            "    gl_FragColor=vec4(color*n,1.-n);"+
//            "    gl_FragColor=vec4(color*n*0.3,1.-n);"+
//            "    gl_FragColor=vec4(color*n*0.3,(1.-n)*n);"+
//            "    gl_FragColor=vec4(color*n*0.3,(1.-n)*(1.-n));"+
//            "    gl_FragColor=vec4(color*(1.-n),1.-n);"+
//            "    gl_FragColor=vec4(color*(1.-n)*0.5,1.-n);"+
//            "    gl_FragColor=vec4(color*n,1.-n);"+
//            "    float n=pow(1.-abs(normalize(norm4).z),2.);"+
//            "    gl_FragColor=vec4(color*(1.-n)*0.3,n);"+
            "    gl_FragColor=color;"+
            "}"
        )
    };
}