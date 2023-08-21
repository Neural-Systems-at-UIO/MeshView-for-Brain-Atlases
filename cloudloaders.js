async function loadlz(filename) {
    const lz = await fetch(
            `https://data-proxy.ebrains.eu/api/v1/buckets/${state["clb-collab-id"]}/${filename}?redirect=false`,
            {headers: {Authorization: `Bearer ${state.token}`}})
            .then(response => response.json())
            .then(json => fetch(json.url.includes("?")?json.url:json.url+"?"+Date.now()))
            .then(response => response.json());
    const cloud = [];
    //debugger;
    for (const section of lz.sections)
        if (section.ouv && section.poi) { // todo: propagation, nonlin
            const {filename, ouv, poi} = section;
            const triplets = poi.flatMap(p2d => [
                    ouv[0] + p2d.x * ouv[3] / section.width + p2d.y * ouv[6] / section.height,
                    ouv[1] + p2d.x * ouv[4] / section.width + p2d.y * ouv[7] / section.height,
                    ouv[2] + p2d.x * ouv[5] / section.width + p2d.y * ouv[8] / section.height
                ]);
            cloud.push({name: filename, r: 0, g: 0, b: 0, triplets});
        }
    return {filename, lz, cloud};
}

async function loadzip(filename, pre) {
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
