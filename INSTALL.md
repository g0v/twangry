1. Prepare Environment
-------------------
 - nodejs - tested on >= 0.10.x
 - npm - texted on 1.2.x

2. Clone Project and Install
----------------
```
git clone https://github.com/g0v/twangry.git
cd twangry/
npm install
```
3. Config
---------
Edit config/default.yaml, setup google doc path and port.
You can leave default setting to use event listsing from fact.g0v.tw.
Or you can build your own timeline in google document.
Default port at 8080, please make sure not other service running 8080.

4. Build index.json and category.json
-------------------------------------
Execute script to build json base on config/default.yaml
```
node prepublish
```

5. start node
-------------
```
npm start
```

Installation for Windows
=============

1. Prepare Environment
install nodejs for windows, http://nodejs.org/download/

2. Follow steps from 2-5 up.


FAQ
===
1. Error like this
```
[Error: 140735215821584:error:0607907F:digital envelope routines:EVP_PKEY_get1_RSA:expecting an rsa key:../deps/openssl/openssl/crypto/evp/p_lib.c:288:]
```
update node to 0.10.x

