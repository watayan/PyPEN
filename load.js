"use strict";

var scripts = [
    "./js/jquery.min.js",
    "./js/jquery.exresize-latest.js",
    "./js/bcralnit.js",
    "./js/jquery.contextMenu.min.js",
    "./js/jquery.ui.position.min.js",
    "./js/plotly-latest.min.js",
    "./js/zlib.min.js",
    "./setting.js",
    "./dncl.js",
    "./pypen.js",
    "./sample.js",
    "./quiz.js",
    "./answer.js",
];

function load_js(js)
{
    return new Promise(resolve =>{
        var script = document.createElement('script');
        script.defer = 1;
        script.src = js;
        script.type = "text/javascript";
        script.addEventListener('load', resolve);
        document.body.appendChild(script);    
    });
}

(async () => {
    for(var i = 0; i < scripts.length; i++)
    {
        await load_js(scripts[i]);
    }
    load_js("./run1.js");
    var input_status = document.getElementById('input_status');
    input_status.style.visibility = 'hidden';
    input_status.innerText = '入力待ち';
})();