all: dncl.js run1.js

dncl.js: dncl.jison
	nodejs `which jison` dncl.jison
run1.js: run.js
	nodejs /home/watayan/node_modules/babel-cli/bin/babel.js run.js -o run1.js
