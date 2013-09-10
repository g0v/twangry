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
> node tools/prepublish
> node app.js

For Windows
1. Prepare Environment
-------------------
> install nodejs for windows, http://nodejs.org/download/

2. Clone Project
----------------
> install github for windows, http://windows.github.com/
> git clone https://github.com/jimyhuang/twangry.git

3. Install thirty partys
------------------------
> launch Node.js command prompt
> run "npm install"

4. Run web server
-----------------
> install a apeche server on windows, for example, XAMPP
> Add web root directory \twangry\public. Take XAMPP for example, need to change "DocumentRoot" in httpd.conf
> Start your web server.

5. Run node
-----------------
> node app.js
> run http://localhost:8080/

