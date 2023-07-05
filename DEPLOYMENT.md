# MeshView standalone and collaboratory app deployment guide
## OKD
### Image
MeshView collaboratory variant uses PHP for IAM code-token exchange. Suggested image is `PHP`, the version that is in use in the actual deployment is https://github.com/sclorg/s2i-php-container/blob/master/7.1 (not available any more, 7.3 is the oldest one still supported at the time of writing)
### HTTPS
Both IAM and the Collaboratory environment mandate securing the route. Actual deployment uses the default "Edge" flavour.
### OIDC configuration
Configuration details are taken from environment variables. With the exception of `ebrains_secret_mv` variable they are not considered sensitive, but one may find it simpler to put all of them into secure storage for the sake of uniformity.  
* `ebrains_id_mv=<client-id>`
* `ebrains_secret_mv=<client-secret>`
* `ebrains_redirect_mv=<actual-host>/token.php`
* `ebrains_auth=https://iam.ebrains.eu/auth/realms/hbp/protocol/openid-connect/auth`
* `ebrains_token=https://iam.ebrains.eu/auth/realms/hbp/protocol/openid-connect/token`

### Collab app registration
MeshView collaboratory app launches with `collab.php`.
(MeshView standalone launches with `index.html`, which then can be omitted - provided for completeness, not involved in registration)
## Docker
Image is in the `meshview` project, https://docker-registry.ebrains.eu/harbor/projects/97  
It still requires securing the route, which falls outside the scope of this document.  
Environment variables and app registration are same as above.