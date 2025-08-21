var collab;
var moz=navigator.userAgent.toLowerCase().indexOf('firefox')>-1;
var atlasroot="WHS_SD_rat_atlas_v2";
var atlasorg="WHS_SD_Rat_v2_39um";
var atlas_config;
let cut_hack=false;
function startmv(){
    document.body.onpaste=pastecloud;
    document.body.onmouseup=gmup;
    document.body.onmousemove=gmmove;
    drag(cut_box,cut_handle);
    drag(simple_cloud,cloud_handle);
    drawCut();
    location.search.slice(1).split("&").forEach(function(pair){
        if(pair.length===0)return;
        var parts=pair.split("=");
        switch(parts[0]){
            case "atlas":
                atlasroot=atlasorg=parts[1];
                break;
            case "cloud":
                autoload(parts[1]);
                break;
            case "atlas_config":
                atlas_config=parts[1];
                break;
            case "rots":
                [orb,bob,scale.value]=parts[1].split(";").map(x=>parseFloat(x));
                break;
            case "cut":
                [cut_hrot.value,cut_vrot.value,cut_level.value]=
                        parts[1].split(";").map(x=>parseFloat(x));
                cut_range.value=cut_level.value;
                drawCut();
                cut_hack=true;
                break;
            default:
                const ctrl=document.getElementById(parts[0]);
                if(ctrl) {
                    if(ctrl.type==="color")
                        ctrl.value="#"+parts[1];
                    else
                        ctrl.value=parts[1];
                }
                else
                    console.log("?",pair);
        }
    });
    init();
    document.getElementById("atlas").innerText=atlasorg.replace(/_/g," ");

    let remaphack={
        "ABA_Mouse_CCFv3_2015_25um":"AMBA_CCFv3_2015_reduced",
        "ABA_Mouse_CCFv3_2017_25um":"AMBA_CCFv3_2017_full",
        "WHS_SD_Rat_v2_39um":"WHS_SD_rat_atlas_v2",
        "WHS_SD_Rat_v3_39um":"WHS_SD_rat_atlas_v3",
        "WHS_SD_Rat_v4_39um":"WHS_SD_rat_atlas_v4"
    }[atlasroot];
    if(remaphack)
        atlasroot=remaphack;
    
    var xhr=new XMLHttpRequest();
    xhr.open("GET",atlasroot+".json");
    xhr.responseType="json";
    xhr.onload=jsonready;
    xhr.send();


    if(opener!==null)
        openerThing();
    if(collab){
            document.getElementById("cloud_standalone").style.display="none";
            addptshead(collab.filename);
            collab.json.forEach(function(elem){
                addptscloud(elem.name,[elem.r,elem.g,elem.b],1);
                elem.r/=255;elem.g/=255;elem.b/=255;
                var pts=new Points(elem);
                pts.createBuffer(gl);
                points.push(pts);
            });
            redraw();
    } else {
            document.getElementById("cloud_collab").style.display="none";
    }
}

var atlas=new Map();
var total=0;
var loaded=0;
var treestring;
function jsonready(event){
    function walk(json,list,path){
        for(let id of path){
            let p=atlas.get(id);
            if(!p.children)
                p.children=[];
            p.children.push(json.id);
        }
        let node={};
        atlas.set(json.id,node);
        let litem=document.createElement("li");
        let li=document.createElement("span");
        li.className="litem";
        litem.appendChild(li);
        if(json.color){
            let color=document.createElement("input");
            node.c_color=color;
            color.type="color";
            color.value="#"+json.color;
            color.oninput=redraw;
            if(moz){
                color.oninput=doColor;
                color.style="background-color:#"+json.color;
            }
            li.appendChild(color);
        }
        let range=document.createElement("input");
        range.type="range";
        range.max=20;
        range.value=atlas_config?0:json.hasOwnProperty("alpha")?json.alpha:20;
        range.step=1;
        range.oninput=slide;
        li.appendChild(range);
        node.c_visibility=range;
        if(!json.children){
            litem.className="leaf";
            li.appendChild(document.createTextNode(json.name));
        }else{
            litem.className=json.color?"open mesh":"open nomesh";
            let b=document.createElement("button");
            b.innerText=json.name;
            b.onclick=openclose;
            li.appendChild(b);
            let ul=document.createElement("ul");
            path.push(json.id);
            for(let child of json.children)
                walk(child,ul,path);
            path.pop();
            litem.appendChild(ul);
        }
        list.appendChild(litem);
    }
    for(let node of event.target.response)
        walk(node,document.getElementById("tree"),[]);

    atlas.forEach(function(elem,idx){
        if(elem.c_color){
            var img=document.createElement("img");
            img.onload=imgLoad;
            img.src=atlasroot+"/"+idx+".png";
            img.atlasindex=idx;
            total++;
        }
    });
    
    if(atlas_config){
        function setTree(node,level){
            node.c_visibility.value=level;
            if(node.children)
                for(const child of node.children)
                    setTree(atlas.get(child),level);
        }
        const items=atlas_config.split(",");
        for(const item of items){
            const level=item.charCodeAt()-'A'.charCodeAt();
            const mode=item[1];
            const node=atlas.get(parseInt(item.substring(2)));
            if(mode==="-")
                node.c_visibility.value=level;
            if(mode==="+")
                setTree(node,level);
        }
    }

    progress();
    
    const copy=JSON.parse(JSON.stringify(event.target.response));
    function clear(node){
        for(const prop in node)
            if(prop!=="id" && prop!=="children")
                delete node[prop];
        if(node.children)
            for(const child of node.children)
                clear(child);
    }
    for(const node of copy)
        clear(node);
    treestring=JSON.stringify({code:0,children:copy});
}
function progress(){
    document.getElementById("counter").innerHTML=loaded!==total?loaded+"/"+total:"";
    if(loaded===total && cut_hack){
        cut.checked=true;
        toggleCut({target:cut});
    }
}
function doColor(event){
    event.target.style="background-color:"+event.target.value;
    redraw();
}
function openclose(event){
    let li=event.target.parentNode.parentNode;
    let cl=li.classList;
    if(!cl.replace("closed","open")){
        cl.replace("open","closed");
        li.getElementsByTagName("ul").item(0).hidden=true;
    }else{
        li.getElementsByTagName("ul").item(0).hidden=false;
    }
}
function slide(event){
    let p=event.target.parentNode.parentNode;
    if(p.classList.contains("closed") || p.classList.contains("nomesh")){
        let rs=p.getElementsByTagName("input");
        for(let i=0;i<rs.length;i++)
            if(rs.item(i).type==="range")
                rs.item(i).value=event.target.value;
    }
    redraw();
}

var gl;
var progs;
function init(){
    var cnv=document.getElementById("cnv");
    cnv.width=window.innerWidth-1;
    cnv.height=window.innerHeight-1;

    gl=cnv.getContext("webgl",{stencil:true,alpha:false/*,premultipliedAlpha:false*/});

    progs=buildshaders(gl);

    window.addEventListener("resize",resize);
}

var resizescheduled=false;
function resize(){
    var cnv=document.getElementById("cnv");
    cnv.width=window.innerWidth-1;
    cnv.height=window.innerHeight-1;
    gl.viewport(0,0,cnv.width,cnv.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if(!resizescheduled){
        resizescheduled=true;
        setTimeout(function(){resizescheduled=false;redraw();},500);
    }
}

function imgLoad(event){
    loaded++;
    progress();
    var img=event.target;
    var canvas=document.createElement("canvas");
    var w=img.width;
    var h=img.height;
    canvas.width=w;
    canvas.height=h;
    var ctx=canvas.getContext("2d");
    ctx.drawImage(img,0,0);
    var raw=ctx.getImageData(0,0,w,h).data;
    for(var i=0;i<w*h;i++){
        for(var j=0;j<3;j++)
            raw[i*3+j]=raw[i*4+j];
    }

    var mesh=new Mesh(raw.buffer);
    mesh.createBuffers(gl);

    atlas.get(img.atlasindex).mesh=mesh;

    redraw();
}

var orb=0;
var bob=0;
var mx,my;
function mdown(event){
    mx=event.offsetX;
    my=event.offsetY;
}
function mup(event){
    mx=undefined;
    my=undefined;
}
function mout(event){
    mx=undefined;
    my=undefined;
}
function mmove(event){
    if(!mx)return;
    orb+=mx;
    bob+=my;
    mx=event.offsetX;
    my=event.offsetY;
    orb-=mx;
    bob-=my;
    if(bob<-90)bob=-90;
    if(bob>90)bob=90;
    redraw();
}

var points=[];
var drawreq=false;
function redraw(){
    if(drawreq)return;
    drawreq=true;
    requestAnimationFrame(draw);
}
function draw(){
    drawreq=false;

    var nope=true;
    var nomesh=true;
    var minx=Number.MAX_VALUE;
    var miny=Number.MAX_VALUE;
    var minz=Number.MAX_VALUE;
    var maxx=-Number.MAX_VALUE;
    var maxy=-Number.MAX_VALUE;
    var maxz=-Number.MAX_VALUE;
    atlas.forEach(function(elem){
        if(elem.mesh){
            nomesh=false;
            elem.a=elem.c_visibility.valueAsNumber/20;
            if(elem.a>0){
                nope=false;
                if(minx>elem.mesh.minx)minx=elem.mesh.minx;
                if(miny>elem.mesh.miny)miny=elem.mesh.miny;
                if(minz>elem.mesh.minz)minz=elem.mesh.minz;
                if(maxx<elem.mesh.maxx)maxx=elem.mesh.maxx;
                if(maxy<elem.mesh.maxy)maxy=elem.mesh.maxy;
                if(maxz<elem.mesh.maxz)maxz=elem.mesh.maxz;
                var c=elem.c_color.value;
                elem.r=parseInt(c.substring(1,3),16)/255;
                elem.g=parseInt(c.substring(3,5),16)/255;
                elem.b=parseInt(c.substring(5,7),16)/255;
            }
        }
    });

    const clearColor=parseInt(document.getElementById("bgcolor").value.slice(-6),16);
    gl.clearColor((clearColor>>>16)/255,((clearColor>>8)&255)/255,(clearColor&255)/255,1);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

    if(nomesh)return;

    var center=ident();

    if(!nope){
        center[0][3]=-(maxx+minx)/2;
        center[1][3]=-(maxy+miny)/2;
        center[2][3]=-(maxz+minz)/2;
    }

    atlas.forEach(function(elem){
        if(elem.mesh){
            if(minx>elem.mesh.minx)minx=elem.mesh.minx;
            if(miny>elem.mesh.miny)miny=elem.mesh.miny;
            if(minz>elem.mesh.minz)minz=elem.mesh.minz;
            if(maxx<elem.mesh.maxx)maxx=elem.mesh.maxx;
            if(maxy<elem.mesh.maxy)maxy=elem.mesh.maxy;
            if(maxz<elem.mesh.maxz)maxz=elem.mesh.maxz;
        }
    });

    if(nope){
        center[0][3]=-(maxx+minx)/2;
        center[1][3]=-(maxy+miny)/2;
        center[2][3]=-(maxz+minz)/2;
    }

    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.depthMask(true);

    var scale=ident();
    scale[0][0]=scale[1][1]=scale[2][2]=parseFloat(document.getElementById("scale").value)/Math.sqrt(Math.pow(maxx-minx,2)+Math.pow(maxy-miny,2)+Math.pow(maxz-minz,2));

    var rot=ident();
    var sorb=Math.sin(orb*Math.PI/180);
    var corb=Math.cos(orb*Math.PI/180);
    rot[0][0]=rot[1][1]=corb;
    rot[0][1]=sorb;rot[1][0]=-sorb;

    var bb=ident();
    var sbob=Math.sin(bob*Math.PI/180);
    var cbob=Math.cos(bob*Math.PI/180);
    bb[0][0]=bb[2][2]=cbob;
    bb[0][2]=sbob;bb[2][0]=-sbob;

    var snap=zero();
    snap[0][1]=-1;
    snap[1][2]=snap[2][0]=snap[3][3]=1;

    var aspect=ident();
    aspect[2][2]=0.1;
    if(gl.drawingBufferWidth>gl.drawingBufferHeight){
        aspect[0][0]=gl.drawingBufferHeight/gl.drawingBufferWidth;
    }else{
        aspect[1][1]=gl.drawingBufferWidth/gl.drawingBufferHeight;
    }

    var trf=mult(mult(mult(mult(mult(aspect,snap),bb),rot),scale),center);
    var flatrf=trf[0].concat(trf[1]).concat(trf[2]).concat(trf[3]);
    var nrm=mult(mult(snap,bb),rot);
    var flatnrm=nrm[0].concat(nrm[1]).concat(nrm[2]).concat(nrm[3]);

    if(!document.getElementById("cut").checked){
        solidMesh(flatrf,flatnrm);
        solidCloud(flatrf);
        transparentMesh(flatrf);
    }else{
        if(!document.getElementById("cut_cloud").checked){
            cutMesh(flatrf,flatnrm,(maxx+minx)/2,(maxy+miny)/2,(maxz+minz)/2,maxx-minx,maxy-miny,maxz-minz);
            cutSurface(flatrf,nrm,(maxx+minx)/2,(maxy+miny)/2,(maxz+minz)/2,maxx-minx,maxy-miny,maxz-minz);
            cutCloud(flatrf,(maxx+minx)/2,(maxy+miny)/2,(maxz+minz)/2,maxx-minx,maxy-miny,maxz-minz);
        } else {
            solidMesh(flatrf,flatnrm);
            cutCloud(flatrf,(maxx+minx)/2,(maxy+miny)/2,(maxz+minz)/2,maxx-minx,maxy-miny,maxz-minz);
            transparentMesh(flatrf);
        }
    }
}

function solidCloud(flatrf){
    if(points.length){

        var prg=progs.solidcloud;
        gl.useProgram(prg);

        var coords = gl.getAttribLocation(prg, "coords");
        gl.enableVertexAttribArray(coords);

        gl.uniformMatrix4fv(gl.getUniformLocation(prg,"alltrf"),false,flatrf);
//        gl.uniform1f(gl.getUniformLocation(prg,"pointsize"),parseFloat(document.getElementById("psize").value));
        const psize=gl.getUniformLocation(prg,"pointsize");
        const psizebase=document.getElementById("psize").valueAsNumber;

        var color=gl.getUniformLocation(prg,"color");
        points.forEach(function(elem,idx){
            const pscale=document.getElementById("siz"+idx).valueAsNumber;
            if(pscale>0 /*elem.enabled && elem.a===1*/ && elem.count>0){
//                gl.uniform4f(color,elem.r,elem.g,elem.b,1);
                const rgb=document
                        .getElementById("clr"+idx)
                        .value
                        .substring(1)
                        .match(/(.{2})/g)
                        .map(x=>parseInt(x,16)/255);
                gl.uniform4f(color,rgb[0],rgb[1],rgb[2],1);
                gl.uniform1f(psize,psizebase*pscale);
                elem.drawArray(gl,coords);
            }
        });
//        gl.depthMask(false);
//        gl.enable(gl.BLEND);
//        gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
//        points.forEach(function(elem){
//            if(elem.enabled && elem.a!==1 && elem.count>0){
//                gl.uniform4f(color,elem.r,elem.g,elem.b,elem.a);
//                elem.drawArray(gl,coords);
//            }
//        });
//        gl.depthMask(true);
//        gl.disable(gl.BLEND);
    }
}

function cutCloud(flatrf,cx,cy,cz,sx,sy,sz){
    if(points.length){

        var prg=progs.cutcloud;
        gl.useProgram(prg);

        var coords = gl.getAttribLocation(prg, "coords");
        gl.enableVertexAttribArray(coords);

        gl.uniformMatrix4fv(gl.getUniformLocation(prg,"alltrf"),false,flatrf);
//        gl.uniform1f(gl.getUniformLocation(prg,"pointsize"),parseFloat(document.getElementById("psize").value));
        const psize=gl.getUniformLocation(prg,"pointsize");
        const psizebase=document.getElementById("psize").valueAsNumber;

        var cnp=collectCut(sx,sy,sz);
        var cutnormal=cnp.cutnormal;
        var pos=cnp.pos;

        gl.uniform3f(gl.getUniformLocation(prg,"cutbase"),cx+cutnormal[0]*pos,cy+cutnormal[1]*pos,cz+cutnormal[2]*pos);
        gl.uniform3fv(gl.getUniformLocation(prg,"cutnormal"),cutnormal.slice(0,3));

        var color=gl.getUniformLocation(prg,"color");
        points.forEach(function(elem,idx){
            const pscale=document.getElementById("siz"+idx).valueAsNumber;
            if(pscale>0 /*elem.enabled && elem.a===1*/ && elem.count>0){
//                gl.uniform4f(color,elem.r,elem.g,elem.b,1);
                const rgb=document
                        .getElementById("clr"+idx)
                        .value
                        .substring(1)
                        .match(/(.{2})/g)
                        .map(x=>parseInt(x,16)/255);
                gl.uniform4f(color,rgb[0],rgb[1],rgb[2],1);
                gl.uniform1f(psize,psizebase*document.getElementById("siz"+idx).valueAsNumber);
                elem.drawArray(gl,coords);
            }
        });

//        gl.depthMask(false);
//        gl.enable(gl.BLEND);
//        gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
//        points.forEach(function(elem){
//            if(elem.enabled && elem.a!==1 && elem.count>0){
//                gl.uniform4f(color,elem.r,elem.g,elem.b,elem.a);
//                elem.drawArray(gl,coords);
//            }
//        });
//        gl.depthMask(true);
//        gl.disable(gl.BLEND);
    }
}

function solidMesh(flatrf,flatnrm){
    var prg=progs.solidmesh;
    gl.useProgram(prg);

    gl.uniformMatrix4fv(gl.getUniformLocation(prg,"alltrf"),false,flatrf);
    gl.uniformMatrix4fv(gl.getUniformLocation(prg,"normtrf"),false,flatnrm);

    var coords = gl.getAttribLocation(prg, "coords");
    gl.enableVertexAttribArray(coords);
    var normals = gl.getAttribLocation(prg, "normals");
    gl.enableVertexAttribArray(normals);

    var color=gl.getUniformLocation(prg,"color");

    gl.depthMask(true);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    atlas.forEach(function(elem){
        if(elem.mesh && elem.a===1){
            gl.uniform3f(color,elem.r,elem.g,elem.b);
            elem.mesh.drawElements(gl,coords,normals);
        }
    });
    gl.disableVertexAttribArray(normals);
}
function cutMesh(flatrf,flatnrm,cx,cy,cz,sx,sy,sz){
    var prg=progs.cutmesh;
    gl.useProgram(prg);

    gl.uniformMatrix4fv(gl.getUniformLocation(prg,"alltrf"),false,flatrf);
    gl.uniformMatrix4fv(gl.getUniformLocation(prg,"normtrf"),false,flatnrm);

    var cnp=collectCut(sx,sy,sz);
    var cutnormal=cnp.cutnormal;
    var pos=cnp.pos;

    gl.uniform3f(gl.getUniformLocation(prg,"cutbase"),cx+cutnormal[0]*pos,cy+cutnormal[1]*pos,cz+cutnormal[2]*pos);
    gl.uniform3fv(gl.getUniformLocation(prg,"cutnormal"),cutnormal.slice(0,3));

    var coords = gl.getAttribLocation(prg, "coords");
    gl.enableVertexAttribArray(coords);
    var normals = gl.getAttribLocation(prg, "normals");
    gl.enableVertexAttribArray(normals);

    var color=gl.getUniformLocation(prg,"color");

    gl.depthMask(true);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    atlas.forEach(function(elem){
        if(elem.mesh && elem.a>0){
            gl.uniform3f(color,elem.r,elem.g,elem.b);
            elem.mesh.drawElements(gl,coords,normals);
        }
    });
    gl.disableVertexAttribArray(normals);
}
function cutSurface(flatrf,nrm,cx,cy,cz,sx,sy,sz){
    var prg=progs.cutsurface;
    gl.useProgram(prg);

    gl.uniformMatrix4fv(gl.getUniformLocation(prg,"alltrf"),false,flatrf);

    var cnp=collectCut(sx,sy,sz);
    var cutnormal=cnp.cutnormal;
    var pos=cnp.pos;

    var tmp=mult([cutnormal],inv4x4(nrm))[0];
    if(tmp[2]>0)return;

    gl.uniform3f(gl.getUniformLocation(prg,"cutbase"),cx+cutnormal[0]*pos,cy+cutnormal[1]*pos,cz+cutnormal[2]*pos);
    gl.uniform3fv(gl.getUniformLocation(prg,"cutnormal"),cutnormal.slice(0,3));

    var coords = gl.getAttribLocation(prg, "coords");
    gl.enableVertexAttribArray(coords);

    var color=gl.getUniformLocation(prg,"color");

    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.STENCIL_TEST);
    gl.stencilMask(1);

    atlas.forEach(function(elem){
        if(elem.mesh && elem.a>0){
            gl.uniform3f(color,elem.r,elem.g,elem.b);

            gl.clear(gl.STENCIL_BUFFER_BIT);
            gl.colorMask(false,false,false,false);
            gl.disable(gl.DEPTH_TEST);
            gl.stencilFunc(gl.ALWAYS,1,1);
            gl.stencilOp(gl.INVERT,gl.INVERT,gl.INVERT);
            elem.mesh.drawElements(gl,coords);

            gl.colorMask(true,true,true,true);
            gl.enable(gl.DEPTH_TEST);
            gl.stencilFunc(gl.EQUAL,1,1);
            gl.stencilOp(gl.KEEP,gl.KEEP,gl.KEEP);
            elem.mesh.drawElements(gl,coords);
        }
    });
    gl.enable(gl.CULL_FACE);
    gl.disable(gl.STENCIL_TEST);
}

function transparentMesh(flatrf){
    var prg=progs.transparentmesh;
    gl.useProgram(prg);

    gl.uniformMatrix4fv(gl.getUniformLocation(prg,"alltrf"),false,flatrf);

    var coords = gl.getAttribLocation(prg, "coords");
    gl.enableVertexAttribArray(coords);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);

    var color=gl.getUniformLocation(prg,"color");

    var a=0.5;

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);
    atlas.forEach(function(elem){
        var f=elem.a;
        if(elem.mesh && f>0 && f<1){
            gl.uniform4f(color,elem.r*(a+f),elem.g*(a+f),elem.b*(a+f),f);
            elem.mesh.drawElements(gl,coords);
        }
    });
    gl.cullFace(gl.BACK);
    atlas.forEach(function(elem){
        var f=elem.a;
        if(elem.mesh && f>0 && f<1){
            gl.uniform4f(color,elem.r*(a+f),elem.g*(a+f),elem.b*(a+f),f);
            elem.mesh.drawElements(gl,coords);
        }
    });

    gl.depthMask(true);
    gl.disable(gl.BLEND);
}

function autoload(url){
    var start=Date.now();
    var xhr=new XMLHttpRequest();
    xhr.open("GET",url);
    xhr.responseType="json";
    xhr.onload=function(){
        var data=xhr.response;
        if(!data){
            var secs=(Date.now()-start)/1000;
            if(secs>15)
                alert("Loading of point cloud "+url+" has failed. As "+secs+" seconds have passed, the given point cloud may be too large for this browser or a network timeout occurred. Sorry for the inconvenience.");
            else
                alert("Loading of point cloud "+url+" has failed.");
            return;
        }
        var m=url.match(/.*\/(.*\/.*$)/);
        if(m && m[1])
            url=m[1].replace("/"," ");
        addptshead(url);
        data.forEach(function(elem){
            addptscloud(elem.name,[elem.r,elem.g,elem.b],1);
            elem.r/=255;elem.g/=255;elem.b/=255;
            var pts=new Points(elem);
            pts.createBuffer(gl);
            points.push(pts);
        });
        redraw();
    };
    xhr.send();
}
function loadfiles(event)
{
    for(let file of event.target.files){
        let fr=new FileReader();
        fr.onload=function(){
            var data=JSON.parse(fr.result);
            addptshead(file.name);
            data.forEach(function(elem){
                addptscloud(elem.name,[elem.r,elem.g,elem.b],1);
                elem.r/=255;elem.g/=255;elem.b/=255;
                var pts=new Points(elem);
                pts.createBuffer(gl);
                points.push(pts);
            });
            redraw();
        };
        fr.readAsText(file);
    }
}
function openerThing(){
    opener.postMessage("ready.","*");
    onmessage=function(event){
            var data=event.data;
            addptshead("Preview");
            data.forEach(function(elem){
                addptscloud(elem.name,[elem.r,elem.g,elem.b],1);
                elem.r/=255;elem.g/=255;elem.b/=255;
                var pts=new Points(elem);
                pts.createBuffer(gl);
                points.push(pts);
            });
            redraw();
    };
}
function showall(){
    for(var i=0;i<points.length;i++){
//        points[i].enabled=true;
//        document.getElementById("c"+i).checked=true;
        document.getElementById("siz"+i).value=1;
    }
    redraw();
}
function hideall(){
    for(var i=0;i<points.length;i++){
//        points[i].enabled=false;
//        document.getElementById("c"+i).checked=false;
        document.getElementById("siz"+i).value=0;
    }
    redraw();
}
//function toggle(idx){
//    points[idx].enabled=document.getElementById("c"+idx).checked;
//    redraw();
//}

function cchange(idx){
    var c=document.getElementById("c"+idx).value.substring(1);
    atlas[idx].r=parseInt(c.substring(0,2),16);
    atlas[idx].g=parseInt(c.substring(2,4),16);
    atlas[idx].b=parseInt(c.substring(4,6),16);
    redraw();
}
function vchange(idx){
    atlas[idx].visibility=document.getElementById("v"+idx).valueAsNumber/20;
    redraw();
}

function setGlobal(event){
    var visibility=event.target.value;
    atlas.forEach(function(elem){
        elem.c_visibility.value=visibility;
    });
    redraw();
}

var firstCut=true;
function toggleCut(event){
    cut_box.style.display=event.target.checked?"block":"none";
    if(firstCut){
//                    cut_box.style.left=document.getElementById("meshpanel").offsetWidth+"px";
        cut_box.style.left=document.getElementById("spacer").offsetLeft+"px";
        cut_box.style.top=document.getElementById("meshpanel").offsetTop+"px";
    }
    firstCut=false;
    redraw();
}
function drag(target,handle){
    handle.addEventListener("mousedown",mdown,true);
    var pick;
    function mdown(event){
        pick=[event.clientX,event.clientY];
        document.addEventListener("mouseup",mup,true);
//                    document.addEventListener("mouseout",mup,true);
        document.addEventListener("mousemove",mmove,true);
    }
    function mup(event){
        document.removeEventListener("mouseup",mup,true);
//                    document.removeEventListener("mouseout",mup,true);
        document.removeEventListener("mousemove",mmove,true);
    }
    function mmove(event){
        target.style.left=(target.offsetLeft+event.clientX-pick[0])+"px";
        target.style.top=(target.offsetTop+event.clientY-pick[1])+"px";
        pick=[event.clientX,event.clientY];
    }
}
function drawCut(){
    var ctx=cut_cnv.getContext("2d");
    ctx.fillStyle="darkgray";
    ctx.fillRect(0,0,361,181);
    ctx.beginPath();
    ctx.rect(0,0,361,181);
    ctx.moveTo(180.5,0);
    ctx.lineTo(180.5,181);
    ctx.moveTo(0,90.5);
    ctx.lineTo(361,90.5);
    for(var i=0;i<361;i+=10){
        ctx.moveTo(i+0.5,85.5);
        ctx.lineTo(i+0.5,94.5);
        ctx.moveTo(175.5,i+0.5);
        ctx.lineTo(184.5,i+0.5);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cut_hrot.valueAsNumber+180.5,90.5-cut_vrot.valueAsNumber,5,0,Math.PI*2);
    ctx.fillStyle="red";
    ctx.fill();
}
var cut_down=false;
function cut_mdown(event){
    cut_down=true;
    cut_input(event);
}
function cut_mup(event){
    cut_down=false;
}
function cut_input(event){
    switch(event.target){
        case cut_level:
            cut_range.value=cut_level.value;
            break;
        case cut_range:
            cut_level.value=cut_range.value;
            break;
        case cut_cnv:
            if(!cut_down)break;
            cut_hrot.value=Math.max(Math.min(event.offsetX-180,180),-180);
            cut_vrot.value=-Math.max(Math.min(event.offsetY-90,90),-90);
        case cut_hrot:
        case cut_vrot:
            drawCut();
            break;
    }
    redraw();
}
function collectCut(sx,sy,sz){
//                var bob=parseFloat(document.getElementById("cutv").value)*Math.PI/180;
    var bob=document.getElementById("cut_vrot").valueAsNumber*Math.PI/180;
    var cutnormal=[0,Math.cos(bob),Math.sin(bob),1];
//                var rot=parseFloat(document.getElementById("cuth").value)*Math.PI/180;
    var rot=document.getElementById("cut_hrot").value*Math.PI/180;
    var srot=Math.sin(rot);
    var crot=Math.cos(rot);
    rot=ident();
    rot[0][0]=rot[1][1]=crot;
    rot[0][1]=srot;rot[1][0]=-srot;
    cutnormal=mult([cutnormal],rot)[0];

    var pos=-(document.getElementById("cut_level").valueAsNumber-50)*Math.sqrt(sx*sx+sy*sy+sz*sz)/100;

    return {cutnormal:cutnormal,pos:pos};
}
var firstCloud=true;
function simple_open(){
    document.getElementById("simple_cloud").style.display="block";
    if(firstCloud){
        simple_cloud.style.left=document.getElementById("meshpanel").offsetWidth+"px";
        simple_cloud.style.top=document.getElementById("meshpanel").offsetTop+"px";
    }
    firstCloud=false;
}
function simple_close(){
    document.getElementById("cloud_text").value="";
    document.getElementById("simple_cloud").style.display="none";
}

function simple_add(text){
    try{
//        var table=points.length>0?document.getElementById("ptstable").innerHTML:
//                "<tr><td><button onclick='showall()'>Show all</button></td><td><button onclick='hideall()'>Hide all</button></td></tr>";
        if(!text)addptshead(cloud_head.value);
//        table+="<tr><td colspan='2' style='background-color:lightgray'>"+cloud_head.value+"</td></tr>";
        var lines=(text||document.getElementById("cloud_text").value).split(/\r?\n/);
        var name,r=0,g=0,b=0;
        var batch=[];
        function add(){
            if(batch.length){
//                var idx=points.length;
                if(!name)name="Cloud #"+(/*idx*/points.length+1);
                addptscloud(name,[Math.floor(r*255),Math.floor(g*255),Math.floor(b*255)],1);
                var pts=new Points({/*idx:idx,*/r:r,g:g,b:b,name:name,/*count:batch.length/3,*/triplets:batch});
                pts.createBuffer(gl);
                points.push(pts);
//                table+="<tr><td><input type='checkbox' checked='true' id='c"+idx+"' onchange='toggle("+idx+")'></td><td>"+name+"</td></tr>";
                name=undefined;
                batch=[];
            }
        }
        lines.forEach(function(line){
            line=line.trim();
            var coords=line.match(/^([\d\.]+)[\s,]+([\d\.]+)[\s,]+([\d\.]+)/);
            if(coords)coords.slice(1).forEach(function(x,i){
                x=parseFloat(x);
                if(i===0){
                    if(WHS_flip.checked)x=511-x;
                    else if(ABA_flip.checked)x=455-x;
                }
                batch.push(parseFloat(x));
            });
            else{
                add();
                var colors=line.match(/^RGB\s*([\d\.]+)[\s,]+([\d\.]+)[\s,]+([\d\.]+)/);
                if(colors){
                    r=Math.max(0,Math.min(1,parseFloat(colors[1])));
                    g=Math.max(0,Math.min(1,parseFloat(colors[2])));
                    b=Math.max(0,Math.min(1,parseFloat(colors[3])));
                }else
                    if(line[0]==="#")name=line.substring(1).trim();
            }
        });
        add();

//        document.getElementById("ptstable").innerHTML=table;
        redraw();
        simple_close();
    }catch(e){
        alert("Sum Ting Wong says: "+e);
    }
}

async function collab_open() {
    const {cancel,pick}=await dppick({
        bucket:state["clb-collab-id"],
        token:state.token,
        title:"Select Nutil result pack or LocaliZoom file",
        extensions:[".zip",".lz"]
    });
    if(cancel)
        return;
    let cloud=[];
    if(pick.endsWith(".lz")) {
        ({cloud}=await loadlz(pick));
        //atlasroot=atlasorg=data.lz.atlas;
    } else {
        const cstyle=document.getElementById("consolediv").style;
        cstyle.display="block";
        const cpre=document.getElementById("consolepre");
        const {label,json,update,stop}=await loadzip(pick,cpre);
        stop();
        cloud=json;
        cstyle.display="none";
    }
    if(cloud && cloud.length) {
        addptshead(pick);
        for(const elem of cloud) {
            addptscloud(elem.name,[elem.r,elem.g,elem.b],1);
            elem.r/=255;elem.g/=255;elem.b/=255;
            const pts=new Points(elem);
            pts.createBuffer(gl);
            points.push(pts);
        };
        redraw();
    } else {
        alert("No point clouds added.");
    }
}

let sizedrag=false;
function hdrag1(event){
    if(!sizedrag){
    sizedrag={x1:event.offsetX};
    console.log(sizedrag);
}
}
function hdrag2(event){
    if(!sizedrag){
    sizedrag={x2:event.target.offsetWidth-event.offsetX};
    console.log(sizedrag);
}
}
function gmmove(event){
    if(sizedrag){
        if(sizedrag.hasOwnProperty("x1"))
            console.log(document.getElementById("meshpanel").style.width=(event.clientX-sizedrag.x1-5)+"px");
        if(sizedrag.hasOwnProperty("x2"))
            console.log(document.getElementById("ptspanel").style.width=(window.innerWidth-event.clientX-sizedrag.x2)+"px");
    }
}
function gmup(event){
    sizedrag=false;
}
function help(){
    window.open("https://meshview-for-brain-atlases.readthedocs.io/en/latest/",Date.now());
}

function screenshot(){
    draw();
    document.getElementById("cnv").toBlob(blob=>{
        let url=URL.createObjectURL(blob);
        let a=document.createElement("a");
        a.href=url;
        a.download=atlasorg+"_"+new Date().toISOString().replace(/[:.]/g,"-")+".png";
        a.click();
        URL.revokeObjectURL(url);
    });
}

function getptstable(){
    document.getElementById("ptsbuttons").style.display="inline";
    return document.getElementById("ptstable");
}
function addptshead(name){
    const tr=document.createElement("tr");
    const td=document.createElement("td");
    td.setAttribute("colspan","3");
    td.style="background-color:lightgray";
    td.innerText=name;
    tr.appendChild(td);
    getptstable().appendChild(tr);
}
function addptscloud(name,color,size){
    const idx=points.length;
    const tr=document.createElement("tr");
    const ctd=document.createElement("td");
    const col=document.createElement("input");
    col.type="color";
    col.id="clr"+idx;
    col.value="#"+color.map(x=>x.toString(16).padStart(2,0)).join("");
    col.oninput=redraw;
    const rtd=document.createElement("td");
    const ran=document.createElement("input");
    ran.type="range";
    ran.id="siz"+idx;
    ran.min=0;
    ran.max=1;
    ran.step=0.1;
    ran.value=size;
    ran.oninput=redraw;
    const ntd=document.createElement("td");
    ntd.innerText=name;
    ctd.appendChild(col);
    tr.appendChild(ctd);
    rtd.appendChild(ran);
    tr.appendChild(rtd);
    tr.appendChild(ntd);
    getptstable().appendChild(tr);
}
function pastecloud(event) {
    if(document.getElementById("simple_cloud").style.display==="block")
        return;
    simple_add(event.clipboardData.getData("text"));
}
function configString(){
    const tree=JSON.parse(treestring);
    const set=new Set;
    function fill(node){
        if(node.id){
            node.code=String.fromCharCode(atlas.get(node.id).c_visibility.valueAsNumber+'A'.charCodeAt());
            if(node.code)
                set.add(node);
            node.subcodes=new Map([[
                    node.code,
                    [node]
            ]]);
        }
        if(node.children)
            for(const child of node.children){
                fill(child);
                if(node.id){
                    for(const [k,v] of child.subcodes){
                        if(node.subcodes.has(k))
                            node.subcodes.set(k,[...node.subcodes.get(k),...v]);
                        else
                            node.subcodes.set(k,[...v]);
                    }
                }
            }
    }
    fill(tree);
    
    function checkTree(node){
        if(!node.children)
            return true;
    }

//    function count
    let result="";
    for(const node of set){
        const subcodes=node.subcodes;
        if(subcodes.size===1){
            result+=","+node.code+"+"+node.id;
            for(const sub of node.subcodes.values().next().value)
                set.delete(sub);
        } else {
            result+=","+node.code+"-"+node.id;
        }
    }
    //prompt("Configuration string","&atlas_config="+result.substring(1));
    
    let link=location.origin+location.pathname+"?";
    for(const pair of location.search.slice(1).split("&")){
        const parts=pair.split("=");
        if(!["rots","cut","atlas_config"].includes(parts[0]))
            link+=link.endsWith("?")?pair:"&"+pair;
    }
    link+=`&rots=${orb};${bob};${scale.value}`
        +`&atlas_config=${result.substring(1)}`;
    if(cut.checked)
        link+=`&cut=${cut_hrot.value};${cut_vrot.value};${cut_level.value}`;

    navigator.clipboard.writeText(link)
            .then(()=>popover("Link copied to clipboard."))
            .catch(ex=>alert(ex));
}
function popover(html){
    const p=document.getElementById("popover");
    p.innerHTML=html;
    p.showPopover();
    setTimeout(()=>p.hidePopover(),2000);
}
