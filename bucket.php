<?php

$referer=$_SERVER["HTTP_REFERER"];
$validator="https://".$_SERVER["SERVER_NAME"]."/";
strpos($referer,$validator) === 0 or die("!");

$ch = curl_init("https://data-proxy.ebrains.eu/api/buckets/"
        . filter_input(INPUT_COOKIE, "clb-collab-id")
        . "/"
        . preg_replace("/[^-\w().!]/", "", filter_input(INPUT_GET, "filename")));
curl_setopt_array($ch, array(
    CURLOPT_HTTPHEADER => array(
        "Accept: application/json",
        "Authorization: " . filter_input(INPUT_COOKIE, "bucket-bearer")
    )
));
$res = curl_exec($ch);
curl_close($ch);
