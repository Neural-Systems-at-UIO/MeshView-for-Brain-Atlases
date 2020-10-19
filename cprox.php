<?php
$ch = curl_init("https://object.cscs.ch/v1/AUTH_".preg_replace('/[^\w\/\-\.]/', '', $_SERVER['QUERY_STRING']));
curl_exec($ch);
curl_close($ch);
