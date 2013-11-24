1. Prepare Environment
-------------------
 - nodejs - tested on >= 0.10.x
 - npm - texted on 1.2.x

2. Clone Project
----------------
> git clone https://github.com/jimyhuang/twangry.git

3. Install thirty partys
------------------------
> npm install .

4. Run web server
-----------------
Add your web root directory to public/ . Read example at config/nginx.conf.

Start your web server.
> /etc/init.d/nginx start

5. Run node
-----------------
> cd 

> node prepublish

If you get error 

```
[Error: 140735215821584:error:0607907F:digital envelope routines:EVP_PKEY_get1_RSA:expecting an rsa key:../deps/openssl/openssl/crypto/evp/p_lib.c:288:]
```

The reason for the error is your node version is out of date.  Use nvm to update your node to `0.10.x` version.

> node app.js

For Windows
=============

1. Prepare Environment
-------------------
> install nodejs for windows, http://nodejs.org/download/

2. Clone Project
----------------
> install github for windows, http://windows.github.com/.

> git clone https://github.com/jimyhuang/twangry.git

3. Install thirty partys
------------------------
> launch Node.js command prompt

> npm install

4. Run node
-----------------
> node app.js

> run http://localhost:8080/

