<!DOCTYPE html>
<html>
    <head>
        <title>Redirecting to IAM...</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script>
            let state={};
            for(let setting of location.search.substring(1).split("&")){
                let [key,value]=setting.split("=");
                state[key]=value;
            }
            location.href="<?php echo getenv("ebrains_auth");?>?response_type=code&login=true&client_id=<?php echo getenv("ebrains_id_mv");?>&redirect_uri=<?php echo getenv("ebrains_redirect_mv");?>&scope=profile+email+team+roles&state="+encodeURIComponent(JSON.stringify(state));
        </script>
    </head>
    <body>
        Redirecting to IAM...
    </body>
</html>
