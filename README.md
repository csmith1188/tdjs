Welcome to the tdjs README! I'm one of the developers here to tell you more about certain aspects of tdjs.

RUNNING THE SERVER:
  In order for the server to run you need several packages, acorn, acorn-walk, blockly, connect-sqlite3, ejs, express, express-session, jsonwebtoken, and socket.io

  I suggest that for you to have an easier time installing the packages you install the Node Package Manager (npm)
  Once you have npm installed locate the app.js file and while focused on the app.js file run the command <npm i> (use what's inside the inequality signs) and all the required packages will be installed
  Then after all the needed packages are installed you can use the command <node app.js> to launch the server, the server will run on your computer's ip address on port 3000

  After the server is running you can go to localhost:3000 (on YOUR computer) or <computer's ip address>:3000 to test tdjs (you can run the command <ipconfig> in a terminal to obtain your IP address)

MODULE DETAILS:
  There are several modules used from the packages to run the server an here's more information on them

  vm: vm is a module used by the server to generate a sandbox environment to prevent users from accessing other parts of the server that are critical to functionality, without vm the user could shut down the server,
  for more information read here: https://nodejs.org/api/vm.html

  blockly: blockly is a module used so users can use block code to program the tower's targeting rather than having to use normal code,
  for more information read here: https://developers.google.com/blockly

  acorn: acorn is a module used to parse the user's code when given to user to prevent malicious code,
  for more information read here: https://www.npmjs.com/package/acorn

  acorn-walk: acorn-walk is a module that works with acorn to give more possibilities to on how acorn can interact with the parsed code,
  for more information read here: https://www.npmjs.com/package/acorn-walk

CREDITS:
  This project would not have been possible without the help from the following developers:
    matth26676,
    benja26584,
    csmith1188

  Feel free to use this project for other creations, however I ask that you give credit to all the developers here
