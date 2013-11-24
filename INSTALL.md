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
Edit config/default.yaml, setup google sheet path and port.
- You can leave default setting to use event listsing from fact.g0v.tw. Or you can build your own timeline in google document.
- [Example google sheet](https://docs.google.com/spreadsheet/pub?key=0AuwTztKH2tKidERkVm5nLWVsWEdrd0liTjBmeTZ1LXc&gid=0)
  - to turn this sheet into json, follow steps below
  - json of 1st sheet in a document
    - replace https://spreadsheets.google.com/feeds/list/{{your-google-sheet-key}}/od6/public/values?alt=json
    - to https://spreadsheets.google.com/feeds/list/0AuwTztKH2tKidERkVm5nLWVsWEdrd0liTjBmeTZ1LXc/od6/public/values?alt=json
  - json of 2nd sheet in a document:
    - change "od6" to "od7" of first json url

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
Then you can visit your site at http://localhost:8080/

6. Use reverse proxy
--------------------
If you need example, may read config/nginx.conf


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

