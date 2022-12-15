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
        <script src="dppick.js"></script>
        <script src="netunzip.js"></script>
        <script src="inflater.js"></script>
        <script>
            const state=<?php echo json_encode($json);?>;
            const td=new TextDecoder();
            async function startup(){
                const pre=document.getElementsByTagName("pre")[0];
                pre.innerText="";
                const choice=await dppick({
                    bucket:state["clb-collab-id"],
                    token:state.token,
                    title:"Select Nutil result file",
                    extensions:[".zip"],
                    nocancel:true
                });
                let phase=0;
                let msg=`Opening ${choice.pick} `;
                const spinner=setInterval(()=>{
                    pre.innerText=msg+("-\\|/".charAt(phase++));
                    phase&=3;
                },20);
                const zipdir=await netunzip(
                    async()=>fetch(
                        `https://data-proxy.ebrains.eu/api/v1/buckets/${state["clb-collab-id"]}/${choice.pick}?redirect=false`,
                        {headers: {Authorization: `Bearer ${state.token}`}})
                    .then(response => response.json()).then(json => json.url)).catch(ex=>{
                        clearInterval(spinner);
                        alert(ex);
                        startup();
                    });
                if(!zipdir)return;
                let json,label;
                for(const [_, entry] of zipdir.entries){
                    if(entry.name.endsWith("combined.json")){
                        msg+="\nCombined JSON found ";
                        json=JSON.parse(td.decode(await zipdir.get(entry)));
                    }
                    if(entry.name.endsWith("nutil.nut")){
                        msg+="\nNutil configuration found ";
                        label=td.decode(await zipdir.get(entry)).match(/label_file = (.*)/m)[1];
                    }
                }
                label={
                    "Allen Mouse Brain 2015":"ABA_Mouse_CCFv3_2015_25um",
                    "Allen Mouse Brain 2017":"ABA_Mouse_CCFv3_2017_25um",
                    "WHS Atlas Rat v2":"WHS_SD_Rat_v2_39um",
                    "WHS Atlas Rat v3":"WHS_SD_Rat_v3_39um",
                    "WHS Atlas Rat v4":"WHS_SD_Rat_v4_39um"
                }[label];
                if(label && json){
                    msg+="\nStarting MeshView ";
                    atlasroot=atlasorg=label;
                    document.body.innerHTML=await fetch("body.html").then(response=>response.text());
                    collab={filename:choice.pick,json};
                    clearInterval(spinner);
                    startmv();
                }else{
                    clearInterval(spinner);
                    alert(choice.pick+" does not contain MeshView point cloud.");
                    startup();
                }
            }
        </script>
    </head>
    <body onload="startup()">
        <pre></pre>
    </body>
</html>
