async function loadlz(filename) {
    const lz = await fetch(
            `https://data-proxy.ebrains.eu/api/v1/buckets/${state["clb-collab-id"]}/${filename}?redirect=false`,
            {headers: {Authorization: `Bearer ${state.token}`}})
            .then(response => response.json())
            .then(json => fetch(json.url))
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
