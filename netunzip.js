async function netunzip(locator) {
    const urlfunc = typeof locator === "function" ? locator : () => locator;
    const eodc = await fetch(await urlfunc(), {headers: {range: "bytes=-22"}}).then(response => response.arrayBuffer()).then(buffer => new DataView(buffer));
    if (eodc.getUint32(0, true) !== 0x06054b50)
        throw "0x06054b50, EODC header signature not found, file may not be a .zip or contains a comment field.";
    const entries = new Map();
    //console.log("Files",eodc.getUint16(10,true));
    const dirsize = eodc.getUint32(12, true);
    const diroffset = eodc.getUint32(16, true);
    //console.log(dirsize, diroffset);
    const dirbuf = await fetch(await urlfunc(), {headers: {range: `bytes=${diroffset}-${diroffset + dirsize - 1}`}}).then(response => response.arrayBuffer());
    let pos = 0;
    const tdec = new TextDecoder();
    while (pos < dirbuf.byteLength) {
        const view = new DataView(dirbuf, pos);
        pos += 46;
        if (view.getUint32(0, true) !== 0x02014b50)
            throw "0x02014b50, directory entry signature not found, file may be damaged.";
        const timecode = view.getUint16(12, true);
        const hour = timecode >> 11;
        const minute = (timecode >> 5) & 63;
        const second = (timecode & 31) * 2;
        const datecode = view.getUint16(14, true);
        const year = (datecode >> 9) + 1980;
        const month = (datecode >> 5) & 15;
        const day = datecode & 31;
        const entry = {
            vermade: view.getUint16(4, true),
            verext: view.getUint16(6, true),
            gpflags: view.getUint16(8, true),
            method: view.getUint16(10, true),
            timestamp: new Date(year, month, day, hour, minute, second),
            crc: view.getUint32(16, true),
            compsize: view.getUint32(20, true),
            uncompsize: view.getUint32(24, true),
            namelength: view.getUint16(28, true),
            extralength: view.getUint16(30, true),
            commentlength: view.getUint16(32, true),
            diskno: view.getUint16(34, true),
            intattrs: view.getUint16(36, true),
            extattrs: view.getUint32(38, true),
            offset: view.getUint32(42, true)
        };
        entry.name = tdec.decode(new Uint8Array(dirbuf, pos, entry.namelength));
        pos += entry.namelength;
        entry.extra = new Uint8Array(dirbuf, pos, entry.extralength);
        pos += entry.extralength;
        entry.comment = tdec.decode(new Uint8Array(dirbuf, pos, entry.commentlength));
        pos += entry.commentlength;
        entries.set(entry.name, entry);
    }
    return {
        entries,
        async get(entry, raw) {
            const m = entry.method;
            if (!raw && m !== 0 && m !== 8)
                throw `Unsupported compression method ${m}.`;
            const localhead = new DataView(await fetch(await urlfunc(), {headers: {range: `bytes=${entry.offset}-${entry.offset + 30 - 1}`}}).then(response => response.arrayBuffer()));
            if (localhead.getUint32(0, true) !== 0x04034b50)
                throw "0x04034b50, local file signature not found, file may be damaged.";
            const method = localhead.getUint16(8, true);
            if (!raw && method !== 0 && m !== 8)
                throw `Unsupported compression method ${m}. Sus.`;
            const compsize = localhead.getUint32(18, true);
            const uncompsize = localhead.getUint32(22, true);
            const namelength = localhead.getUint16(26, true);
            const extralength = localhead.getUint16(28, true);
            const dataoffset = entry.offset + 30 + namelength + extralength;
            const rawdata = new Uint8Array(await fetch(await urlfunc(), {headers: {range: `bytes=${dataoffset}-${dataoffset + compsize - 1}`}}).then(response => response.arrayBuffer()));
            return raw || m === 0 ? rawdata : inflate(rawdata, 0, uncompsize);
        }
    };
}

