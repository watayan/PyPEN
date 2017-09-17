all: dncl.js run1.js

dncl.js: dncl.jison
	jison dncl.jison
run1.js: run.js
	npm run build
