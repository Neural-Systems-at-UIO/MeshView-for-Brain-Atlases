function unzip(arraybuffer, callback) {
    const dv = new DataView(arraybuffer);
    const dec = new TextDecoder();
    let pos = 0;
    while (uint32() === 0x04034b50) {
        /*version*/uint16();
        /*flag*/uint16();
        let method = uint16(); //!!
        /*timestamp*/uint16();
        /*datestamp*/uint16();
        /*crc*/uint32();
        let csize = uint32();
        let ucsize = uint32();
        let fnlen = uint16();
//                    console.log(fnlen);
        let eflen = uint16();
        let name = dec.decode(new Uint8Array(arraybuffer, pos, fnlen));
        console.log(name, csize, ucsize);
        pos += fnlen + eflen;
        callback(name, csize, ucsize, new Uint8Array(arraybuffer, pos));
        pos += csize;
    }
    function uint32() {
        pos += 4;
        return dv.getUint32(pos - 4, true);
    }
    function uint16() {
        pos += 2;
        return dv.getUint16(pos - 2, true);
    }
}