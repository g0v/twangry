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
Set environment variable for nodejs running
```
export NODE_ENV=production
```

create or copy conf/<node_env>.json
```
vim conf/production.json
```

config base dir
```
  "base": "/home/nodejs/node/twangry",
  "parser": "zhdateparser",
```

4. prepublish
-------------------------------------
```
./prepublish
```
