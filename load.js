"use strict";

var scripts = [
    "./js/jquery.min.js",
    "./js/jquery.contextMenu.min.js",
    "./js/jquery.ui.position.min.js",
    "./js/plotly-latest.min.js",
    "./js/codemirror.js",
    "./js/codemirror_pypen.js",
    "./js/zlib.min.js",
    './dncl.min.js',
    './setting.js',
    "./pypen.js",
    "./quiz.js",
    "./base64.js",
    "./value.js",
    "./statement.js",
    "./defined_function.js",
    "./fileio.js",
    "./flowchart.js",
    "./graphics.js",
];

function load_js(js)
{
    return new Promise(resolve =>{
        var script = document.createElement('script');
        script.defer = 1;
        script.src = js;
        script.type = "text/javascript";
        script.addEventListener('load', () => resolve('ok'));
        document.body.appendChild(script);    
    });
}

/**
 * 本来ならファイルの有無を確認してから読み込みたいが，CORS制限のためfileスキームでは不可能。
 * 仕方ないのでエラーハンドリングで代用する。
 * 開発者ツールにはエラー表示が残るが，我慢する。
 */
function load_js_witherror(js)
{
    return new Promise(resolve =>{
        var script = document.createElement('script');
        script.defer = 1;
        script.src = js;
        script.type = "text/javascript";
        script.addEventListener('load', () => {
            resolve('ok')
        });
        script.addEventListener('error', () => {
            document.body.removeChild(script);
            resolve('error')
        });
        document.body.appendChild(script);
    });
}

var answer_load = false, sample_load = false;

(async () => {
    for(var i = 0; i < scripts.length; i++)
    {
        await load_js(scripts[i]);
    }
    var result = await load_js_witherror('./answer.js');
    answer_load = (result === 'ok');
    result = await load_js_witherror('./sample.js');
    sample_load = (result === 'ok');
    await load_js('./run.min.js');
    if(setting.more_function == 1)
    {
        await load_js('./more_function.js');
    }
    var input_status = document.getElementById('input_status');
    input_status.style.visibility = 'hidden';
    input_status.innerText = '入力待ち';
})();
