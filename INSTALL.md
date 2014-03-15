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
npm test
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
===

以下為中文版安裝手續
------------------------------------

Winsdows環境安裝:

1. 首先安裝nodejs Windows版,可在此下載:http://nodejs.org/download/

2. 安裝完nodejs後,在<所有程式>裡的<Node.js>裡面選取<Node.js command prompt>,啟動可執行nodejs指令的控制台.

3. 在可執行nodejs指令的控制台中,前往存放twangry的資料夾下.
   (方法: 在控制台中鍵入cd twangry/ ,如此一來便可進入到twangry的資料夾中.)

4. 在twangry資料夾下鍵入
```
   npm install
```
   如此一來系統會找到twangry資料夾下的package.json檔案,並依照此檔案裡面所設置的去做安裝.
   關於package.json檔案裡面詳細的參數設定,請參考:http://wiki.commonjs.org/wiki/Packages/1.1

5. 接著在twangry資料夾下鍵入
```
   npm test
```
   爾後系統會依照config/default.yaml檔案的設置參數,去編譯出index.json與category.json檔案.
   
6. 接著鍵入
```
   npm start
```
   然後到瀏覽器裡面輸入http://localhost:8080後,就可以看到政誌在本地電腦上運作了.
   
   
客製化自己的時間軸
-------------------
- 首先使用此googlesheet作為想抽換的時間軸.
(https://docs.google.com/spreadsheet/pub?key=0AuwTztKH2tKidERkVm5nLWVsWEdrd0liTjBmeTZ1LXc&gid=0)

- 接著打開config/default.yaml將index與category的source改成以下的網址:
   - index的改成:
     https://spreadsheets.google.com/feeds/list/0AuwTztKH2tKidERkVm5nLWVsWEdrd0liTjBmeTZ1LXc/od6/public/values?alt=json
   - category的改成:
     https://spreadsheets.google.com/feeds/list/0AuwTztKH2tKidERkVm5nLWVsWEdrd0liTjBmeTZ1LXc/od7/public/values?alt=json
   
- 接著鍵入
```
  npm test
```
  重新產生編譯後的index.json與category.json檔案.

- 接著鍵入
```
   npm start
```
   即可
   
   
