/**
 * 
 * @param {Object} config - Configuration object
 * @param {string} config.bucket - Identifier of bucket
 * @param {string[]} config.extensions - List of extensions
 * @param {string} config.title - Title
 * @param {string} config.token - JWT
 * @param {string} config.path - Starting path
 * @param {boolean} config.nocancel - 
 * @param {boolean} config.folder -
 * @param {string} config.create -
 * @param {string} config.createplaceholder -
 * @param {string} config.createbutton -
 * @returns {Promise}
 */
function dppick(config) {
    return new Promise(resolve => {
        let {bucket, title, extensions = [], token, path = "", nocancel, folder, create, createdefault, createplaceholder, createbutton, createnowarn} = config;
        const cover = document.createElement("div");
        cover.style = "background:gray;background:rgba(0,0,0,0.5);position:absolute;top:0;left:0;width:100vw;height:100vh;";
        const pane = document.createElement("div");
        pane.style = "background:white;width:600px;position:absolute;height:80vh;left:0;right:0;top:0;bottom:0;margin:auto;display:flex;flex-direction:column;";
        pane.onclick = event => event.stopPropagation();
        pane.innerHTML = title || `Please select a ${folder ? "folder" : "file"}`;
        const pathdiv = document.createElement("div");
        pathdiv.style = "position:static;";
        pane.appendChild(pathdiv);
        const tdiv = document.createElement("div");
        tdiv.style = "flex:auto;overflow-y:scroll;position:static;";
        const table = document.createElement("table");
        table.innerHTML = "<thead style='position:sticky;top:0;background:white;'><tr><th>Filename</th><th>Size</th><th>Modified</th></tr></thead>";
        table.style = "width:100%";
        const tbody = document.createElement("tbody");
        table.appendChild(tbody);
        tdiv.appendChild(table);
        pane.appendChild(tdiv);

        if (create) {
            let completing = false;
            async function complete() {
                if (completing || input.value === "" || input.value === create)
                    return;
                completing = true;
                const fullname = path + input.value;
                const urlobj = await(token ?
                        fetch(`https://data-proxy.ebrains.eu/api/v1/buckets/${bucket}/${fullname}?redirect=false`,
                                {headers: {authorization: `Bearer ${token}`}})
                        : fetch(`https://data-proxy.ebrains.eu/api/v1/public/buckets/${bucket}/${fullname}?redirect=false`)
                        ).then(response => response.json()).catch(ex => {
                    alert(JSON.stringify(ex));
                    completing = false;
                });
                const headres = await fetch(urlobj.url, {method: "HEAD"}).then(response => response.status);
                completing = false;
                if (headres !== 404 && !confirm(`${input.value} already exists\nDo you want to overwrite it?`))
                    return;
                document.body.removeChild(cover);
                resolve({create: fullname});
            }
            const wrapper = document.createElement("div");
            wrapper.style = "display:flex;position:static;";
            const input = document.createElement("input");
            input.style = "flex:auto;";
            if (createdefault)
                input.value = createdefault;
            else {
                input.placeholder = createplaceholder || `Create new ${create} file`;
                input.onfocus = () => {
                    input.value = create;
                    setTimeout(() => input.setSelectionRange(0, 0), 100);
                    input.onfocus = null;
                };
            }
            input.oninput = () => {
                input.value = input.value.substring(0, input.value.lastIndexOf(".")) + create;
                button.disabled = input.value === create;
            };
            input.onkeypress = event => {
                if (event.key === "Enter")
                    complete();
            };
            wrapper.appendChild(input);
            const button = document.createElement("button");
            button.innerText = createbutton || "New...";
            button.disabled = !createdefault;
            button.onclick = complete;
            wrapper.appendChild(button);
            pane.appendChild(wrapper);
        }

        if (!nocancel) {
            function cancel() {
                document.body.removeChild(cover);
                resolve({cancel: true});
            }
            cover.onclick = cancel;
            const cancelbutton = document.createElement("button");
            cancelbutton.onclick = cancel;
            cancelbutton.innerText = "Cancel";
            pane.appendChild(cancelbutton);
        }

        cover.appendChild(pane);
        document.body.appendChild(cover);
        let refreshing = false;
        refresh();

        function done(pick) {
            if (!createnowarn && create && !confirm(`${pick} already exists\nDo you want to overwrite it?`))
                return;
            document.body.removeChild(cover);
            resolve({pick});
        }
        function cd(newpath) {
            path = newpath;
            refresh();
        }
        async function refresh() {
            if (refreshing)
                return;
            refreshing = true;
            const list = await(token ?
                    fetch(`https://data-proxy.ebrains.eu/api/v1/buckets/${bucket}?prefix=${path}&delimiter=/`,
                            {headers: {authorization: `Bearer ${token}`}})
                    : fetch(`https://data-proxy.ebrains.eu/api/v1/public/buckets/${bucket}?prefix=${path}&delimiter=/`)
                    ).then(response => response.json()).catch(() => refreshing = false);
            refreshing = false;
            pathdiv.innerHTML = "";
            if (path.length > 0) {
                const root = document.createElement("button");
                root.innerText = bucket;
                root.onclick = () => cd("");
                pathdiv.appendChild(root);
                pathdiv.append("/");
                const parts = path.split("/");
                parts.pop();
                const current = parts.pop();
                let sub = "";
                for (const dir of parts) {
                    sub += dir + "/";
                    const current = sub;
                    const btn = document.createElement("button");
                    btn.innerText = dir;
                    btn.onclick = () => cd(current);
                    pathdiv.appendChild(btn);
                    pathdiv.append("/");
                }
                pathdiv.append(`${current}/`);
            } else {
                pathdiv.append(`${bucket}/`);
            }
            tbody.innerHTML = "";
            for (const item of list.objects)
                if (item.hasOwnProperty("subdir")) {
                    const tr = document.createElement("tr");
                    const tdname = document.createElement("td");
                    const btname = document.createElement("button");
                    btname.innerText = item.subdir.match(/(?:.*\/)?([^/]+)\//)[1];
                    btname.onclick = () => cd(item.subdir);
                    tdname.appendChild(btname);
                    tr.appendChild(tdname);
                    const tddir = document.createElement("td");
                    tddir.innerText = "<directory>";
                    tddir.setAttribute("colspan", "2");
                    tddir.style = "text-align:center;";
                    tr.appendChild(tddir);
                    tbody.appendChild(tr);
                }
            for (let item of list.objects)
                if (!item.hasOwnProperty("subdir") && (!extensions.length || extensions.some(ext => item.name.endsWith(ext)))) {
                    const tr = document.createElement("tr");
                    const tdname = document.createElement("td");
                    const btname = document.createElement("button");
                    btname.innerText = item.name.match(/(?:.*\/)?([^/]+)/)[1];
                    btname.onclick = () => done(item.name);
                    tdname.appendChild(btname);
                    tr.appendChild(tdname);
                    const tdsize = document.createElement("td");
                    tdsize.innerText = item.bytes;
                    tdsize.style = "text-align:right;";
                    tr.appendChild(tdsize);
                    const tddate = document.createElement("td");
                    tddate.innerText = new Date(item.last_modified + "Z").toLocaleString();
                    tddate.style = "text-align:right;";
                    tr.appendChild(tddate);
                    tbody.appendChild(tr);
                }
        }
    });
}
