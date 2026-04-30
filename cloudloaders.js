async function loadlz(filename) {
    const lz = await fetch(
            `https://data-proxy.ebrains.eu/api/v1/buckets/${state["clb-collab-id"]}/${filename}?redirect=false`,
            {headers: {Authorization: `Bearer ${state.token}`}})
            .then(response => response.json())
            .then(json => fetch(json.url.includes("?")?json.url:json.url+"?"+Date.now()))
            .then(response => response.json());
    const cloud = [];
    //debugger;
    const color = lz?.settings?.markercolor;
    const [r,g,b] = color ? [1,3,5].map(i => parseInt(color.substr(i,2),16)) : [0,0,0];
    for (const section of lz.sections)
        if (section.ouv && section.poi) { // todo: propagation, nonlin
            const {filename, ouv, poi} = section;
            const triplets = poi.flatMap(p2d => [
                    ouv[0] + p2d.x * ouv[3] / section.width + p2d.y * ouv[6] / section.height,
                    ouv[1] + p2d.x * ouv[4] / section.width + p2d.y * ouv[7] / section.height,
                    ouv[2] + p2d.x * ouv[5] / section.width + p2d.y * ouv[8] / section.height
                ]);
            cloud.push({name: filename, r, g, b, triplets});
        }
    return {filename, lz, cloud};
}

async function loadnutilzip(filename, pre) {
    let phase = 0;
    let msg = `Opening ${filename} `;
    const spinner = setInterval(() => {
        pre.innerText = msg + ("-\\|/".charAt(phase++));
        phase &= 3;
    }, 20);
    const update = line => msg += `\n${line}`;
    const stop = () => {
        clearInterval(spinner);
        pre.innerText = msg;
    };
    const zipdir = await netunzip( // TODO? Date.now()
            async() => fetch(
                `https://data-proxy.ebrains.eu/api/v1/buckets/${state["clb-collab-id"]}/${filename}?redirect=false`,
                {headers: {Authorization: `Bearer ${state.token}`}})
                .then(response => response.json()).then(json => json.url)).catch(ex => {
        update(ex);
    });
    if (!zipdir)
        return{stop};
    const td = new TextDecoder();
    let json, label;
    for (const [_, entry] of zipdir.entries) {
        if (entry.name.endsWith("combined.json")) {
            update("Combined JSON found ");
            json = JSON.parse(td.decode(await zipdir.get(entry)));
        }
        if (entry.name.endsWith("nutil.nut")) {
            update("Nutil configuration found ");
            label = td.decode(await zipdir.get(entry)).match(/label_file = (.*)/m)[1];
        }
    }
    if (label && json)
        return {label, json, update, stop};
    return{stop};
}

async function loadzip(url) {
    const buf = await fetch(url).then(response => response.arrayBuffer());
    const dv = new DataView(buf);
    let pos = 0;
    function uint32() {
        pos += 4;
        return dv.getUint32(pos - 4, true);
    }
    function uint16() {
        pos += 2;
        return dv.getUint16(pos - 2, true);
    }
    const dec = new TextDecoder();
    const groups = new Map;
    while (pos < dv.byteLength) {
        if (uint32() !== 0x04034b50)
            break;
        /*version*/uint16();
        /*flag*/uint16();
        let method = uint16();
        /*timestamp*/uint16();
        /*datestamp*/uint16();
        /*crc*/uint32();
        let csize = uint32();
        let ucsize = uint32();
        let fnlen = uint16();
//                    console.log(fnlen);
        let eflen = uint16();
        let name = dec.decode(new Uint8Array(buf, pos, fnlen));
        console.log(name, csize, ucsize);
        pos += fnlen + eflen;
        if (csize) {
            const data =
                    method === 8 ? inflate(new Uint8Array(buf, pos)) :
                    method === 0 ? new Uint8Array(buf, pos, csize).slice() :
                    0;
            const json = name.endsWith(".json")?JSON.parse(dec.decode(data)):false;
            if (!name.includes("/")) {
                addptshead(name.substring(0, name.length - 5));
                for (const cloud of json) {
                    addptscloud(cloud.name, [cloud.r, cloud.g, cloud.b], 1);
                    cloud.r /= 255;
                    cloud.g /= 255;
                    cloud.b /= 255;
                    var pts = new Points(cloud);
                    pts.createBuffer(gl);
                    points.push(pts);
                }
            } else {
                const parts = name.split(/\/([^/]+$)/);
                if(!groups.has(parts[0]))
                    groups.set(parts[0],new Map);
                groups.get(parts[0]).set(json?"json":parts[1],json||data);
            }
            pos += csize;
        }
    }
    for(const group of groups.values()) {
        console.log(group);
        const json = group.get("json");
        addptshead(json.name);
        for(const cloud of json.clouds) {
            addptscloud(cloud.name, [cloud.r, cloud.g, cloud.b], 1);
            const raw = group.get(cloud.name+".bin");
            const floats = new Float32Array(raw.buffer, 4);
            
            const buffer=gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, floats, gl.STATIC_DRAW);
            
            points.push({
                array:floats,
                buffer,
                r:cloud.r/255,g:cloud.g/255,b:cloud.b/255,
                count:floats.length/3,
                drawArray(gl,coords){
                    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
                    gl.vertexAttribPointer(coords, 3, gl.FLOAT, false, 3*4, 0);
                    gl.drawArrays(gl.POINTS,0,this.count);
                }
            });
        }
    }
    redraw();
}
