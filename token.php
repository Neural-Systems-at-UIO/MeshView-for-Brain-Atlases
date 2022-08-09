<?php
ob_start();

$token_params = http_build_query(array(
    "grant_type" => "authorization_code",
    "code" => filter_input(INPUT_GET, "code"),
    "redirect_uri" => getenv("ebrains_redirect_mv"),
    "client_id" => getenv("ebrains_id_mv"),
    "client_secret" => getenv("ebrains_secret_mv")
        ));
$token_ch = curl_init(getenv("ebrains_token"));
curl_setopt_array($token_ch, array(
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $token_params
));
$token_res = curl_exec($token_ch);
curl_close($token_ch);
$token_obj = json_decode($token_res, true);
$token = $token_obj["access_token"];

$json= json_decode(urldecode(filter_input(INPUT_GET, "state")), true);
$json["token"]=$token;
?>
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <title></title>
        <link href="style.css" rel="stylesheet">
        <script src="mesh.js"></script>
        <script src="points.js"></script>
        <script src="shaders.js"></script>
        <script src="matrix.js"></script>
        <script src="main.js"></script>
        <script src="unzip.js"></script>
        <script src="inflater.js"></script>
        <script>
            let bucket=<?php
            $ch = curl_init(getenv("ebrains_bucket") . $json["clb-collab-id"] . "?delimiter=/");
            curl_setopt_array($ch, array(
                CURLOPT_HTTPHEADER => array(
                    "Accept: application/json",
                    "Authorization: Bearer " . $token
                )
            ));
            $res = curl_exec($ch);
            curl_close($ch);
            ?>;
            let state=<?php echo json_encode($json);?>;
            function startup(){
                let tbody=document.getElementById("bucket-content");
                for(let item of bucket.objects)
                    if(item.name && item.name.endsWith(".zip"))
                        tbody.innerHTML+="<tr><td><a href=\"#\" onclick=\"pick('"+item.name+"')\">"+item.name+"</a></td><td>"+item.bytes+"</td><td>"+item.last_modified+"</td></tr>";
            }
            async function pick(filename){
                let json,label;
                
                let download=await fetch("bucket.php?"+encodeURIComponent(JSON.stringify({
                    collab:state["clb-collab-id"],
                    token:state.token,
                    filename
                }))).then(response=>response.json());
                let zipfile=await fetch(download.url).then(response=>response.arrayBuffer());
                
                const ziplen = zipfile.byteLength;
                console.log(ziplen);
                const dec=new TextDecoder();
                unzip(zipfile,(name,csize,ucsize,deflated)=>{
                    if(name.endsWith("combined.json"))
                        json=JSON.parse(dec.decode(inflate(deflated)));
                    else if(name.endsWith("nutil.nut"))
                        label=dec.decode(inflate(deflated)).match(/label_file = (.*)/m)[1];
                });

                label={
                    "Allen Mouse Brain 2015":"ABA_Mouse_CCFv3_2015_25um",
                    "Allen Mouse Brain 2017":"ABA_Mouse_CCFv3_2017_25um",
                    "WHS Atlas Rat v2":"WHS_SD_Rat_v2_39um",
                    "WHS Atlas Rat v3":"WHS_SD_Rat_v3_39um",
                    "WHS Atlas Rat v4":"WHS_SD_Rat_v4_39um"
                }[label];
                if(label && json){
                    atlasroot=label;
                    document.body.innerHTML=await fetch("body.html").then(response=>response.text());
                    collab={filename,json};
                    startmv();
                }else{
                    alert("Please select a Nutil result file.");
                }
            }
        </script>
    </head>
    <body onload="startup()">
        <table>
            <thead>
                <tr><th>Filename</th><th>Size</th><th>Modified</th></tr>
            </thead>
            <tbody id="bucket-content"></tbody>
        </table>
    </body>
</html>
