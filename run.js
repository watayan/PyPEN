"use strict";

var debug_mode = false; // デバッグモード

const typeOfValue=
{
	typeInt:1,
	typeFloat:2,
	typeString:3,
	typeBoolean:4,
	typeArray:5,
	typeDictionary:6
};

const nameOfType=['','整数','実数','文字列','真偽','配列','辞書'];

var code = null;		// コードを積む（関数・手続き単位で）
var varTables = [];		// 変数テーブルを積む
var myFuncs = {};		// プログラム中で定義される関数・手続き
var run_flag = false, step_flag = false, editable_flag = true;
var flowchart = null;
var textarea = null;
var context = null;
var current_line = -1;
var wait_time = 0;
var flowchart_display = false;
var converting = false;
var dirty = null;
var timeouts = [];
var selected_quiz = -1, selected_quiz_case = -1, selected_quiz_input = 0, selected_quiz_output = 0;
var output_str = '';
var test_limit_time = 0;
var fontsize = 16;
var python_lib = {};
var editor = null;

/**
 * parsed...すべての親クラス
 */
class parsedCode
{
	/**
	 * @constructor
	 * @param {Array<Statement>} statementlist 
	 */
	constructor(statementlist){this.stack = [{statementlist:statementlist, index: 0}]}
	makePython(){
		python_lib = {}	// クリアする
		var code = ''
		var libs = '';
		for(var i = 0; i < this.stack[0].statementlist.length; i++) // 関数・手続き宣言を先に
		{
			var state = this.stack[0].statementlist[i];
			if(state && state instanceof DefineFunction) code += state.makePython(0) + "\n\n";
		}
		for(var i = 0; i < this.stack[0].statementlist.length; i++)	// メインルーチン
		{
			var state = this.stack[0].statementlist[i];
			if(state && !(state instanceof DefineFunction)) code += state.makePython(0);
		}
		for(var lib in python_lib) libs += "import " + lib + "\n";
		return libs + code;
	}
}

/** parsedMainRoutineクラス
 * @extends parsedCode
 */
class parsedMainRoutine extends parsedCode
{
	/**
	 * @constructor
	 * @param {Array<Statement>} statementlist 
	 */
	constructor(statementlist){super(statementlist);}
}

/** parsedFunctionクラス
 * @extends parsedCode
 */
class parsedFunction extends parsedCode
{
	/**
	 * @constructor
	 * @param {Array<Statement>} statementlist 
	 */
	constructor(statementlist){
		super(statementlist);
	}
}

/**
 * 変数テーブルのクラス
 */
class varTable
{
	/**
	 * @constructor
	 */
	constructor()
	{
		this.vars = {};
	}
	/**
	 * 
	 * @param {Array<string>} oldvars 
	 * @returns {Array} 持っている変数名をoldvarsに追加してソートしたもの
	 */
	varnames(oldvars)
	{
		var names = oldvars.concat();
		for(var name in this.vars)
			if(names.indexOf(name) < 0) names.push(name);
		return names.sort();
	}
}

/**
 * varnameという名前の変数を持つ変数テーブルを返す
 * @param {string} varname 
 * @returns {varTable} varnameを持つvarTable
 */
function findVarTable(varname)
{
	return varname in varTables[0].vars ? varTables[0] : null;
}

/**
 * コードをフローチャートに反映させる
 */
function codeChange()
{
	if(converting || !flowchart_display) return;
	var code = editor.getDoc().getValue() + "\n";
	textareaClear();
	try{
		myFuncs = {};
		var dncl_code = python_to_dncl(code);
		var parse = dncl.parse(dncl_code);
		var flag = false; // 関数・手続き定義がないか調べる
		for(var i = 0; i < parse.length; i++)
			if(parse[i] instanceof DefineFunction) flag = true;
		if(flag)
		{
			textareaAppend("関数定義のあるプログラムのフローチャートはまだ実装していません。\n");
			return;
		}
		converting = true;
		flowchart.code2flowchart(parse);
		converting = false;
	}
	catch(e)
	{
		highlightLine(-1);
		textareaClear();
		if(e.line && e.line > 0) textareaAppend("***構文エラー***\n" + e.line + "行目\n");
		textareaAppend(e.message);
		if(debug_mode) textareaAppend(e.stack);
		converting = false;
	}
}

/************************************************************************************ユーティリティ関数 */

/**
 * 有限な値であるか
 * @param {number} v 
 * @returns {boolean} vが有限な値であるか
 */
function isFinite(v)
{
	return Number.isFinite(v);
	// return !isNaN(v) && v != Number.POSITIVE_INFINITY && v != Number.NEGATIVE_INFINITY;
}

/**
 * 整数で表せる値であるか
 * @param {number} v
 * @returns {boolean} vが整数で表せる値であるか 
 */
function isSafeInteger(v)
{
	return Number.isSafeInteger(v);
}

/**
 * 整数であるか
 * @param {number} v
 * @returns {boolean} vが整数であるか
 */
function isInteger(v)
{
	return Number.isInteger(v);
}

/**
 * 単純型であるか
 * @param {Value} v
 * @returns {boolean} vが単純型であるか
 */
function isPrimitive(v)
{
	if(v instanceof IntValue || v instanceof FloatValue || v instanceof StringValue || v instanceof BooleanValue || v instanceof NullValue) return true;
	else return false;
}

/**
 * クラス名を返す
 * @param {Object} obj
 * @return {string} クラス名 
 */
function constructor_name(obj)
{
	if(obj) return obj.constructor.name;
	else return null;
}

/**
 * 全角英数を半角にする
 * @param {string} s 
 * @returns {string}
 * @throws {RuntimeError}
 */
function toHalf(s, loc)
{
	s = s.toString();
	if(setting.zenkaku_mode == 1 && /[Ａ-Ｚａ-ｚ０-９．−]/.exec(s))
		throw new RuntimeError(loc.first_line, "数値や変数名を全角文字で入力してはいけません");
	return s.replace(/[Ａ-Ｚａ-ｚ０-９．−]/g, function(s) {
		return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);}
	);
}

/**
 * プログラムコードに改変が加えられたことを示すフラグの操作
 * @param {boolean} b 
 */
function makeDirty(b)
{
	if(b !== dirty)
	{
		dirty = b;
		document.getElementById("dirty").style.visibility = dirty ? "visible" : "hidden";
	}
}

/**
 * 結果表示画面にテキストを追加する
 * @param {string} v 
 */
function textareaAppend(v)
{
	textarea.value += v;
	textarea.scrollTop = textarea.scrollHeight;	// 一番下までスクロールする
}

/**
 * 結果表示画面をクリアする
 */
function textareaClear()
{
	textarea.value = '';
}

/**
 * プログラムにおける位置を表す
 */
class Location
{
	/**
	 * @constructor
	 * @param {Token} first_token 
	 * @param {Token} last_token 
	 */
	constructor(first_token, last_token)
	{
		this.first_line = first_token.first_line;
		this.last_line = last_token.last_line;
	}
}

/**
 * 実行時エラー
 */
class RuntimeError
{
	/**
	 * @constructor
	 * @param {number} line 
	 * @param {string} message 
	 */
	constructor(line, message)
	{
		if(selected_quiz < 0) dump('*** 実行時エラー ***');
		this._line = line;
		this._message = message;
		setRunflag(false);
	}
	get line() {return this._line;}
	get message() {return this._message;}
}

function array2text(v, flag = false)	// flag: 文字列に''をつける
{
	if(!v) return '';
	if(v instanceof Value)
	{
		let v0 = v.getValue();
		if(v0 instanceof ArrayValue)
		{
			let v1 = [];
			for(let i = 0; i < v0.value.length; i++)
			{
				v1.push(array2text(v0.value[i], flag));
			}
			return '[' + v1.join(',') + ']';
		}
		else if(v0 instanceof DictionaryValue)
		{
			let v1 = [];
			let keys = v0.value.keys();
			for(let key of keys) 
			{
				var val = v0.value.get(key);
				if(typeof key === "string") key = "'" + key + "'";
				v1.push(key + ':' + array2text(val, flag));
			}
			return '{' + v1.join(',') + '}';
		}
		else if(v0 instanceof BooleanValue) return v0.value ? 'True' : 'False';
		else if(v0 instanceof FloatValue && isInteger(v0.value) && !v0.value.toString().match(/[Ee]/)) return v0.value + '.0';
		else if(flag && v0 instanceof StringValue) return new String("'" + v0.value + "'");
		else return new String(v0.value);
	}
	else return new String(v);
}

function array2code(v, flag = false)	// flag: 文字列に''をつける
{
	if(!v) return '';
	let v0 = v;
	if(v0 instanceof ArrayValue)
	{
		let v1 = [];
		for(let i = 0; i < v0.value.length; i++) v1.push(array2text(v0.value[i], flag));
		return '[' + v1.join(',') + ']';
	}
	else if(v0 instanceof DictionaryValue)
	{
		let v1 = [];
		let keys = v0.value.keys();
		for(let key of keys) 
		{
			var val = v0.value.get(key);
			if(typeof key === "string") key = "'" + key + "'";
			v1.push(key + ':' + array2text(val, flag));
		}
		return '{' + v1.join(',') + '}';
	}
	else if(flag && v0 instanceof StringValue) return "'" + v0.value + "'";
	else if(v0 instanceof FloatValue && isInteger(v0.value) && !v0.value.toString().match(/[Ee]/)) return v0.value + '.0';
	return v0.value;
}

function val2obj(val)
{
	if(val instanceof ArrayValue)
	{
		var rtnv = [];
		var l = val.value.length;
		for(var i = 0; i < l; i++) rtnv.push(val2obj(val.value[i]));
		return rtnv;
	}
	else if(val instanceof DictionaryValue)
	{
		var rtnv = {};
		for(var key of val.value.keys())
			rtnv[key] = val2obj(val.value.get(key).getValue());
		return rtnv;
	}
	else if(val instanceof IntValue)return Number(val.value);
	else return val.value;
}

/**
 * 
 * @param {ArrayValue} a 
 * @param {Location} loc 
 */
function array2values(a, loc)
{
	var rtnv = [];
	var array = null;
	if(a.rtnv instanceof ArrayValue)
	{
		if(a.rtnv.value[0] instanceof ArrayValue) array = a.rtnv;
		else if(a.rtnv.value instanceof Array) array = new ArrayValue([a.rtnv.value], loc);
		else throw new RuntimeError(loc.first_line, "グラフに誤った型が使われています");
	}
	else if(a.rtnv instanceof Array) array = new ArrayValue(a.rtnv, loc);
	else throw new RuntimeError(loc.first_line, "棒グラフ・線グラフには配列が必要です");

	for(var i = 0; i < array.length; i++)
	{
		var rtnv1 = [];
		for(var j = 0; j < array.value[i].length; j++)
		{
			var val = array.value[i] instanceof ArrayValue ? array.value[i].value[j] : array.value[i][j];
			if(val instanceof IntValue) rtnv1.push(Number(val.value));
			else rtnv1.push(val.value);
		}
		rtnv.push(rtnv1);
	}
	return rtnv;
}


/**
 * 
 * @param {number} l 表示する行数（-1で非表示） 
 */
function highlightLine(l)
{
	var scroll_elem = editor.getScrollerElement();
	var code_elems = scroll_elem.getElementsByClassName('CodeMirror-code');
	if(!code_elems) return;
	var code_elem = code_elems[0];

	var ln = 1;
	for(var line_elem = code_elem.firstElementChild; line_elem; line_elem = line_elem.nextElementSibling)
	{
		var number_elems = line_elem.getElementsByClassName('CodeMirror-linenumber');
		if(!number_elems) continue;
		var number_elem = number_elems[0];
		if(ln++ == l)
		{
			number_elem.style.background = 'red';
			number_elem.style.color = 'white';
		}
		else
		{
			number_elem.style.background = 'transparent';
			number_elem.style.color = '#999';
		}
	}
}

/**
 *  実行状態の初期化
 *  @param {boolean} b 出力エリアを初期化する
 */
function reset(b = true)
{
	varTables = [new varTable()];
	myFuncs = {};
	current_line = -1;
	if(b){
		textareaClear();
		highlightLine(-1);
		var canvas = document.getElementById('canvas');
		canvas.style.display = 'none';
		document.getElementById('input_status').style.visibility = 'hidden';
		context = null;
		Plotly.purge(document.getElementById('graph'));
	}
	setRunflag(false);
	code = null;
	var input_area = document.getElementById('input_area');
	input_area.readOnly = true;
	input_area.value = '';
	wait_time = 0;
	timeouts = [];
	selected_quiz_input = selected_quiz_output = 0;
	output_str = '';
	filesystem.all_close();
	filesystem.clear();
	storage_list_update();
}

/**
 *  実行中フラグの設定
 * @param {boolean} b 
 */
function setRunflag(b)
{
	run_flag = b;

	document.getElementById("sourceTextarea").readOnly = b;
	editor.options.readOnly = b;
	if(b) editor.getWrapperElement().classList.add("readonly");
	else  editor.getWrapperElement().classList.remove("readonly");
	document.getElementById("runButton").innerHTML = b & !step_flag ? "中断" : "実行";
	document.getElementById("dumpButton").disabled = !step_flag;
	setEditableflag(!b);
}

/**
 *  編集可能フラグの設定
 * @param {boolean} b 
 */
function setEditableflag(b)
{
	editable_flag = b;
	document.getElementById("drawButton").disabled = !b;
	document.getElementById("pythonButton").disabled = !b;
	document.getElementById("urlButton").disabled = !b;
}

function run(clear = true)
{
	if(code == null)
	{
		try
		{
			reset(clear);
			var pypen_source = editor.getDoc().getValue();
			var dncl_source = python_to_dncl(pypen_source);
			code = [new parsedMainRoutine(dncl.parse(dncl_source))];
		}
		catch(e)
		{
			if(selected_quiz < 0)
			{
				textareaAppend("***構文エラー***\n");
				if(e.line) textareaAppend(e.line + "行目");
				textareaAppend(e.message + "\n");
				if(debug_mode) textareaAppend(e.stack);
				reset(false);
				return;
			}
			else throw e;
		}
	}
	setRunflag(true);
	step();
}

// busy wait !!
function wait(ms)
{
	let t1 = Date.now();
	while(Date.now() - t1 < ms)
		;
}

function step()
{
	if(selected_quiz < 0)
	{
		// 次の行まで進める
		var l = current_line;
		do{
			next_line();
		}while(run_flag && l == current_line);
		if(!code) return;
		if(code[0] && code[0].stack.length > 0)
		{
			if(run_flag && !step_flag)
			{
				if(wait_time > 0) 
				{
					wait(wait_time);
					wait_time = 0;
				}
				setZeroTimeout(step, 0);
			}
		}
		else
		{
			textareaAppend("---\n");
			reset(false);
		}
	}
	else
	{
		do{
			next_line();
			if(Date.now() > test_limit_time) throw new RuntimeError(-1, '時間がかかりすぎです。');
		}while(run_flag && code[0] && code[0].stack.length > 0);
	}
}

function next_line()
{
	var index = code[0].stack[0].index;
	var statement = code[0].stack[0].statementlist[index];
	if(statement)
	{
		try{
			// console.log("run line 0" , statement);
			statement.run();
			// console.log("run line 1" , statement);
		}
		catch(e)
		{
			if(selected_quiz < 0)
			{
				if(e.line) textareaAppend(e.line + "行目:");
				if(e instanceof RuntimeError) textareaAppend(e.message + "\n");
				else if(e instanceof RangeError) textareaAppend("計算できない値があります。\n" + e.message + "\n");
				else textareaAppend("（おそらくPyPENのバグなので，コードを添えて開発者に連絡してください）\n" + e.message + "\n");
				if(debug_mode) textareaAppend(e.stack);
				reset(false);
			}
			else throw e;
		}
	}
	else code[0].stack[0].index++;
	if(!code || !code[0]) return;
	// 不要になったコードをstackから捨てる
	index = code[0].stack[0] ? code[0].stack[0].index : -1;
	while(index < 0 || index >= code[0].stack[0].statementlist.length)
	{
		code[0].stack.shift();
		while(code[0] && code[0].stack.length < 1) code.shift();
		if(code.length < 1) break;
		index = (code[0] && code[0].stack[0]) ? code[0].stack[0].index : -1;
	}
	if(selected_quiz < 0)
	{
		// 次の行をハイライト表示する
		if(code[0] && code[0].stack[0])
		{
			index = code[0].stack[0].index;
			statement = code[0].stack[0].statementlist[index];
			if(statement && (statement instanceof Statement))
			{
				if(statement.loc) highlightLine(current_line = statement.first_line);
				if(statement instanceof PauseStatement) 
				{
					document.getElementById("runButton").innerHTML = "実行";
					step_flag = true;
				}
			}
		}
		else highlightLine(++current_line);
	}
}

function editButton(add_code)
{
	if(document.getElementById("sourceTextarea").readOnly) 
	{
		window.alert("プログラム実行・中断中はプログラムを編集できません");
		return;
	}
	var pos = editor.getDoc().getCursor();
	var code = editor.getDoc().getValue();
	var lines = code.split(/\r|\n|\r\n/);
	var code1 = lines[pos.line].slice(0, pos.ch);
	var code2 = lines[pos.line].slice(pos.ch, code.length);
	var re1 = /^[｜| 　]*$/;
	var add_codes = add_code.split("\n");
	var tab = "";
	var array = re1.exec(code1);
	if(array) tab = array[0];
	if(code2)
	{
		alert("カーソルの右側に文字や空白があるときに\n入力支援ボタンを押してはいけません");
		editor.focus();
		return;
	}
	editor.replaceSelection(add_codes.join('\n' + tab));
	editor.setCursor({"line": pos.line, "ch": pos.ch, "scroll": false});
	editor.focus();
}

function keyDown(e)
{
	var evt = e || window.event;
	var sourceTextArea = document.getElementById("sourceTextarea");
	var pos1 = sourceTextArea.selectionStart;
	var pos2 = sourceTextArea.selectionEnd;
	var code = sourceTextArea.value;
	var code1 = code.slice(0, pos1);
	var code2 = code.slice(pos1, pos2);
	var code3 = code.slice(pos2, code.length);
	var re1 = /^(    |　　|  　| 　 |　  )/;
	var re2 = /(    |　　|  　| 　 |　  )$/;
	var tab = '    ';
	switch(evt.keyCode)
	{
	case 9:	// tab
		if(evt.shiftKey) // shift + tab
		{
			if(re2.exec(code1)) code1 = code1.replace(re2,'');
			else if(pos1 == pos2)
			{
				if(re1.exec(code3)) code3 = code3.replace(re1,'');
			}
			else
			{
				code2 = code2.replace(/([\n])(    |　　|  　| 　 |　  )/g,'$1').replace(/^(    |　　|  　| 　 |　  )/,'');
			}
			sourceTextArea.value = code1 + code2 + code3;
			sourceTextArea.setSelectionRange(code1.length, code1.length + code2.length);
		}
		else	// tab
		{
			if(pos1 < pos2)	code2 = code2.replace(/\n([^$])/g,'\n    $1');
			sourceTextArea.value = code1 + tab + code2 + code3;
			var pos3 = code1.length + tab.length, pos4 = pos3;
			if(pos1 < pos2)
			{
				pos4 = pos3 + code2.length;
				pos3 -= tab.length;
			}
			sourceTextArea.setSelectionRange(pos3, pos4);
		}
		evt.preventDefault();
		return false;
	case 8: // backspace
		if(re2.exec(code1)) code1 = code1.replace(re2, '');
		else code1 = code1.slice(0,-1);
		sourceTextArea.value = code1 + code3;
		sourceTextArea.setSelectionRange(code1.length, code1.length);
		evt.preventDefault();
		return false;
	default:
		break;
	}
	return true;
}

function keyUp(e)
{
	var evt = e || window.event;
	switch(evt.keyCode)
	{
	case 37: case 38: case 39: case 40:	// left: 37 right: 39
		var pos = editor.getDoc().getCursor();
		var lines = editor.getDoc().getValue().split(/\r|\n|\r\n/);
		// if(evt.keyCode == 37) pos.ch++;
		// if(evt.keyCode == 39) pos.ch--;
		var line1 = lines[pos.line].slice(0, pos.ch);
		var line2 = lines[pos.line].slice(pos.ch);
		var re1 = /《[^》《]*$/;
		var re2 = /^[^》《]*》/;
		var match1 = re1.exec(line1);
		var match2 = re2.exec(line2);
		if(match1 && match2)
		{
			var start = pos.ch - match1[0].length;
			var end = pos.ch + match2[0].length;
			editor.getDoc().setSelection({'line':pos.line, 'ch':end}, {'line':pos.line, 'ch': start});
		}
	}
}

function mouseClick(evt)
{
	var pos = editor.coordsChar({'left':evt.x, 'top':evt.y});
	var lines = editor.getValue().split(/\r|\n|\r\n/);
	var line1 = lines[pos.line].slice(0, pos.ch);
	var line2 = lines[pos.line].slice(pos.ch - 1);
	var re1 = /《[^》《]*$/;
	var re2 = /^[^》《]*》/;
	var match1 = re1.exec(line1);
	var match2 = re2.exec(line2);
	if(match1 && match2)
	{
		var start = pos.ch - match1[0].length;
		var end = pos.ch + match2[0].length - 1;
		editor.getDoc().setSelection({'line':pos.line, 'ch':end}, {'line':pos.line, 'ch': start});
	}
}

function sampleButton(num)
{
	if(dirty && !window.confirm("プログラムをサンプルプログラムに変更していいですか？")) return;
	editor.getDoc().setValue(sample[num]);
	reset(true);
	if(flowchart) codeChange();
	editor.refresh();
	editor.focus();
	makeDirty(false);
}


function insertCode(add_code)
{
	if(document.getElementById("sourceTextarea").readOnly) 
	{
		window.alert("プログラム実行・中断中はプログラムを編集できません");
		return;
	}
	var pos = editor.getDoc().getCursor();
	editor.getDoc().replaceSelection(add_code);
	editor.getDoc().setCursor({"line": pos.line, "ch": pos.ch})
	editor.focus();
}

function registerEvent(elem, ev, func)
{
	if(elem.addEventListener) elem.addEventListener(ev, func);
	else if(elem.attachEvent) elem.attachEvent('on' + ev, func);
}


function cmBackspace(cm)
{
	var pos = cm.getCursor();
	var code = cm.getValue();
	var lines = code.split(/\r|\n|\r\n/);
	var code1 = lines[pos.line].slice(0, pos.ch);
	// var code2 = lines[pos.line].slice(pos.ch);
	if( /^\s+$/.exec(code1)) cm.execCommand("indentLess");
	else cm.execCommand("delCharBefore");
}

function cmCtrlRight(cm)
{
	var pos = cm.getCursor();
	var code = cm.getValue();
	var lines = code.split(/\r|\n|\r\n/);
	var selected = cm.getSelection();
	var ch = pos.ch;
	if(selected) ch += selected.length;
	var code2 = lines[pos.line].slice(ch);
	var find = /《[^《]*》/.exec(code2);
	if(find) 
	{
		var ch1 = ch + find.index;
		var ch2 = ch1 +  find[0].length;
		cm.setSelection({"line": pos.line, "ch": ch2}, {"line": pos.line, "ch": ch1});
	}
	else cm.execCommand("goLineEnd");
}

function cmCtrlLeft(cm)
{
	var pos = cm.getCursor();
	var code = cm.getValue();
	var lines = code.split(/\r|\n|\r\n/);
	var code1 = lines[pos.line].slice(0, pos.ch);
	var re1 = new RegExp('《[^《]*》','g');
	var find = re1.exec(code1);
	if(find) 
	{
		do{
			var ch1 = find.index;
			var ch2 = ch1 +  find[0].length;
			find = re1.exec(code1);
		}while(re1.lastIndex > 0);
		cm.setSelection({"line": pos.line, "ch": ch2}, {"line": pos.line, "ch": ch1});
	}
	else if(/^\s*$/.exec(code1)) cm.execCommand("goLineStart");
	else cm.execCommand("goLineStartSmart");
}

onload = function()
{
	var code = getParam('code');
	if(code)
	{
		editor.getDoc().setValue(code);
		codeChange();
		highlightLine(-1);
		editor.getDoc().setCursor({"line":0, "ch": 0});
		makeDirty(false);
	}
	editor.refresh();
	editor.focus();
	storage_list_update();
}


function getParam(name)
{
	var getparam = window.location.search;
	if(getparam)
	{
		var params = getparam.slice(1).split('&');
		for(var param of params)
		{
			var p = param.split('=');
			if(p[0] == name){
				return B64decode(p[1]);
			} 
		}
	}
	return null;
}


function auto_marking(i)
{
	reset(true);
	setRunflag(true);
	setEditableflag(false);
	// document.getElementById('runButton').disabled = true;
	// document.getElementById('stepButton').disabled = true;
	// document.getElementById('resetButton').disabled = true;
	// document.getElementById('urlButton').disabled = true;
	textareaClear();
	textareaAppend('*** 採点開始 ***\n');
	selected_quiz = i;
	let all_clear = true;
	for(let j = 0; j < Quizzes[i].cases(); j++)
	{
		let clear = true;
		textareaAppend('ケース' + (j + 1) + '...');
		try{
			selected_quiz_case = j;
			test_limit_time = Date.now() + Quizzes[selected_quiz].timeout();
			run(false);
			if(selected_quiz_input != Quizzes[selected_quiz].inputs(selected_quiz_case).length) throw new RuntimeError(-1, '入力の回数がおかしいです。');
			else if(output_str.trim() != Quizzes[selected_quiz].output(selected_quiz_case).toString().trim()) throw new RuntimeError(-1, '結果が違います。');
			textareaAppend('成功\n');
		}
		catch(e)
		{
			textareaAppend('失敗\n');
			textareaAppend(e.message+"\n");
			clear = false;
		}
		all_clear &= clear;
		reset(false);
		// code = null;
	}
	if(all_clear)textareaAppend('*** 合格 ***\n');
	else textareaAppend('--- 不合格 ---\n');
	selected_quiz = -1;
	document.getElementById('runButton').disabled = false;
	document.getElementById('stepButton').disabled = false;
	document.getElementById('stepdumpButton').disabled = false;
	document.getElementById('resetButton').disabled = false;
	document.getElementById('urlButton').disabled = false;
	setRunflag(false);
}

function font_size(updown)
{
	if(updown != 0)
	{
		if(fontsize + updown < 14 || fontsize + updown > 30) return;
		fontsize += updown;
	}
	else fontsize = 16;
	var elem = document.getElementById('CMSourceTextArea');
	elem.style.fontSize = fontsize + 'px';
	elem = document.getElementsByClassName('CodeMirror-cursor')[0];
	elem.style.fontSize = fontsize + 'px';
	editor.refresh();
	elem = textarea;
	elem.style.fontSize = fontsize + 'px';
	editor.focus();
}

function makePython()
{
	if(run_flag) return;
	//textareaClear();
	code = null;
	myFuncs = {};
	python_lib = {};
	try{
		// var code = document.getElementById("sourceTextarea").value + "\n";
		var code = editor.getDoc().getValue();
		var dncl_code = python_to_dncl(code);
		var main_routine = new parsedMainRoutine(dncl.parse(dncl_code));
		var python_code = main_routine.makePython();
		textareaClear();
		textareaAppend(python_code);
	}
	catch(e)
	{
		highlightLine(-1);
		textareaClear();
		if(e.line && e.line > 0) textareaAppend("***構文エラー***\n" + e.line + "行目\n");
		textareaAppend(e.message);
		if(debug_mode) textareaAppend(e.stack);
	}
}

function code_dump()
{
	let str = '';
	for(let i = 0; i < code.length; i++)
	{
		str += 'code['+i+']\n';
		for(let j = 0; j < code[i].stack.length; j++)
		{
			let statement = [];
			for(let k = 0; k < code[i].stack[j].statementlist.length; k++) 
				if(code[i].stack[j].statementlist[k]) statement.push(constructor_name(code[i].stack[j].statementlist[k]) + '(' + code[i].stack[j].statementlist[k].state + ')');
			str += ' stack['+j+'][' + code[i].stack[j].index + ']' + statement.join(' ') + '\n';
		}
	}
	console.log(str);
}

var sourceTextArea = document.getElementById("sourceTextarea");
var resultTextArea = document.getElementById("resultTextarea");
var newButton     = document.getElementById("newButton");
var runButton     = document.getElementById("runButton");
var flowchartButton = document.getElementById("flowchartButton");
var resetButton   = document.getElementById("resetButton");
var stepButton    = document.getElementById("stepButton");
var stepdumpButton= document.getElementById("stepdumpButton");
var dumpButton    = document.getElementById("dumpButton");
var loadButton    = document.getElementById("loadButton");
var file_prefix   = document.getElementById("file_prefix");
var flowchart_canvas = document.getElementById("flowchart");
// var resultArea = document.getElementById("resultArea");
editor =  CodeMirror.fromTextArea(sourceTextArea,{
	mode: {name :"pypen",
	},
	lineNumbers: true,
	lineWrapping: true,
	indentUnit: 4,
	indentWithTabs: false,
	extraKeys:{
		"Tab": "indentMore",
		"Shift-Tab": "indentLess",
		"Backspace": cmBackspace,
		"Ctrl-Left": cmCtrlLeft,
		"Ctrl-Right": cmCtrlRight,
	},
});
editor.setSize(500,300);
editor.on("change", function()
{
	editor.save();
	makeDirty(true);
});
resultTextArea.style.width = document.getElementById('input_area').clientWidth + 'px';
new ResizeObserver(function(){
	var w = editor.getWrapperElement().width;
	var h = resultTextArea.offsetHeight - 4;
	editor.setSize(w, h);
	editor.refresh();
}).observe(resultTextArea);
editor.getWrapperElement().id = "CMSourceTextArea";
editor.getWrapperElement().addEventListener("mousedown", mouseClick);
editor.getWrapperElement().addEventListener("keyup", keyUp);

sourceTextArea.onchange = function(){
	makeDirty(true);
};
makeDirty(false);
textarea = resultTextArea;
runButton.onclick = function(){
	if(run_flag && !step_flag)
	{
		setRunflag(false);
		document.getElementById("sourceTextarea").readOnly = true;
		editor.options.readOnly = true;
		editor.getWrapperElement().classList.add("readonly");
		dumpButton.disabled = false;
	}
	else
	{
		step_flag = false;
		dumpButton.disabled = true;
		run();
	}
};
stepButton.onclick = function()
{
	step_flag = true;
	run();
}

stepdumpButton.onclick = function()
{
	step_flag = true;
	run();
	if(run_flag) dump();
}
newButton.onclick = function(){
	if(dirty && !window.confirm("プログラムを削除していいですか？")) return;
	editor.getDoc().setValue('');
	code = null;
	reset(true);
	if(flowchart)
	{
		flowchart.makeEmpty();
		flowchart.paint();
	}
	editor.focus();
	makeDirty(false);
}
resetButton.onclick = function(){
	reset(true);
};
dumpButton.onclick = function(){
	dump();
};	

document.getElementById("loadButton1").onclick = function(ev){
	loadButton.click();
	return false;
};

loadButton.addEventListener("change", function(ev)
{
	var file = ev.target.files;
	var reader = new FileReader();
	reader.readAsText(file[0], "UTF-8");
	reader.onload = function(ev)
	{
		editor.setValue(reader.result);
		reset(true);
		if(flowchart) codeChange();
	}
}
,false);

downloadLink.onclick = function()
{
	var filename = file_prefix.value.trim();
	if(filename.length < 1)
	{
		alert("ファイル名を入力しないと保存できません");
		return false;
	}
	filename +=	'.PyPEN';
	var blob = new Blob([editor.getDoc().getValue()], {type:"text/plain"});
	if(window.navigator.msSaveBlob)
	{
		window.navigator.msSaveBlob(blob, filename);
	}
	else
	{
		window.URL = window.URL || window.webkitURL;
		downloadLink.setAttribute("href", window.URL.createObjectURL(blob));
		downloadLink.setAttribute("download", filename);
	}
	makeDirty(false);
};
flowchartButton.onchange = function(){
	flowchart_display = this.checked;
	var flowchart_area = document.getElementById("Flowchart_area");
	var drawButton = document.getElementById("drawButton");
	if(flowchart_display)
	{
		flowchart_area.style.display = "block";
		drawButton.style.display = "inline";
		flowchart = new Flowchart();
		codeChange();
//			flowchart.paint();
	}
	else
	{
		flowchart_area.style.display = "none";
		drawButton.style.display = "none";
		flowchart = null;
	}
}
if(setting.flowchart_mode) flowchartButton.click();
editor.getWrapperElement().ondrop = function(e)
{
	var filelist = e.dataTransfer.files;
	if(!filelist) return;
	for(var i = 0; i < filelist.length; i++)
	{
		if(!/\.PyPEN$/i.exec(filelist[i].name)) continue;
		if(window.FileReader)
		{
			try{
				var reader = new FileReader();
				reader.readAsText(filelist[i]);
				reader.onload = function(event)
				{
					editor.getDoc().setValue(event.target.result);
					codeChange();
				}
				break;
			}
			catch(e){}
		}
	}
	return false;
}
registerEvent(flowchart_canvas, "mousedown", mouseDown);
registerEvent(flowchart_canvas, "mouseup", mouseUp);
registerEvent(flowchart_canvas, "mousemove", mouseMove);
registerEvent(flowchart_canvas, "dblclick", doubleclick_Flowchart);

$.contextMenu(
	{
		selector: '#CMSourceTextArea',
		zIndex: 10,
		items:{
//				copyAll: {name: "プログラムをコピー", callback(k,e){document.getElementById("sourceTextarea").select(); document.execCommand('copy');}},
			zenkaku: {name: "入力補助",
				items:{
					の中に:	{name:"の中に",	callback: function(k,e){insertCode("《配列》の中に《値》");}},
					個の:	{name:"個の",	callback: function(k,e){insertCode("《整数》個の《値》");}},
					と: 	{name:"と",		callback: function(k,e){insertCode("《値》と《値》")}},
				}
			},
			convert:{name:"変換",
				items:{
					int:	{name:"整数", callback: function(k,e){insertCode("整数(《値》)");}},
					float:	{name:"実数", callback: function(k,e){insertCode("実数(《値》)");}},
					string:	{name:"文字列", callback: function(k,e){insertCode("文字列(《値》)");}},
					bool:	{name:"真偽", callback: function(k,e){insertCode("真偽(《値》)");}}
				}
			},
			math:{ name:"数学関数",
				items:{
					abs:	{name:"abs 絶対値", callback: function(k,e){insertCode("abs(《値》)");}},
					random1:{name: "random 乱数（整数）", callback: function(k,e){insertCode("random(《整数》)");}},
					random2:{name: "random 乱数（0〜1）", callback: function(k,e){insertCode("random()");}},
					ceil:	{name: "ceil 切り上げ", callback: function(k,e){insertCode("ceil(《実数》)");}},
					floor:	{name: "floor 切り捨て", callback: function(k,e){insertCode("floor(《実数》)");}},
					round:	{name: "round 四捨五入", callback: function(k,e){insertCode("round(《実数》)");}},
					sin:	{name: "sin サイン", callback: function(k,e){insertCode("sin(《実数》)");}},
					cos:	{name: "cos コサイン", callback: function(k,e){insertCode("cos(《実数》)");}},
					tan:	{name: "tan タンジェント", callback: function(k,e){insertCode("tan(《実数》)");}},
					sqrt:	{name: "sqrt ルート", callback: function(k,e){insertCode("sqrt(《実数》)");}},
					log:	{name: "log 自然対数", callback: function(k,e){insertCode("log(《実数》)");}},
					exp:	{name: "exp 指数関数", callback: function(k,e){insertCode("exp(《実数》)");}},
					pow:	{name: "pow 累乗", callback: function(k,e){insertCode("pow(《実数》,《実数》)");}}
				}
			},
			str:{name:"文字列関数",
				items:{
					length:	{name: "length 長さ", callback: function(k,e){insertCode("length(《文字列》)");}},
					append:	{name: "append 文字列結合", callback: function(k,e){insertCode("append(《文字列》,《文字列》)");}},
					substring1:	{name: "substring 部分文字列（最後まで）", callback: function(k,e){insertCode("substring(《文字列》,《開始位置》)");}},
					substring2:	{name: "substring 部分文字列（長さ指定）", callback: function(k,e){insertCode("substring(《文字列》,《開始位置》,《長さ》)");}},
					split:		{name: "split 文字列分割", callback: function(k,e){insertCode("split(《文字列》,《区切文字列》)");}},
					extract:	{name: "extract 文字列分割（番号指定）", callback: function(k,e){insertCode("extract(《文字列》,《区切文字列》,《番号》)");}},
					insert:	{name: "insert 挿入", callback: function(k,e){insertCode("insert(《文字列》,《位置》,《文字列》)");}},
					replace:	{name: "replace 置換", callback: function(k,e){insertCode("replace(《文字列》,《位置》,《長さ》,《文字列》)");}},
				}
			},
			fileio:{name: "File I/O",
				items:{
					openr: {name:"openr 読込用オープン", callback: function(k,e){insertCode("openr(《ファイル名》)");}},
					openw: {name:"openw 書込用オープン", callback: function(k,e){insertCode("openw(《ファイル名》)");}},
					opena: {name:"opena 追記用オープン", callback: function(k,e){insertCode("opena(《ファイル名》)");}},
					getline: {name:"getline", callback: function(k,e){insertCode("getline(《ファイル番号》)");}},
					getchar: {name:"getchar", callback: function(k,e){insertCode("getchar(《ファイル番号》)");}},
					putline: {name:"putline", callback: function(k,e){insertCode("putline(《ファイル番号》,《文字列》)");}},
					putstr:  {name:"putstr",  callback: function(k,e){insertCode("putstr(《ファイル番号》,《文字列》)");}},
				}
			},
			graphic1:{ name:"グラフィック命令（日本語）",
				items:{
					gOpenWindow:{name:"描画領域開く", callback: function(k,e){insertCode("描画領域開く(《幅》,《高さ》)");}},
					gCloseWindow:{name:"描画領域閉じる", callback: function(k,e){insertCode("描画領域閉じる()");}},
					gClearWindow:{name:"描画領域全消去", callback: function(k,e){insertCode("描画領域全消去()");}},
					gSetLineColor:{name:"線色設定", callback: function(k,e){insertCode("線色設定(《赤》,《緑》,《青》)");}},
					gSetFillColor:{name:"塗色設定", callback: function(k,e){insertCode("塗色設定(《赤》,《緑》,《青》)");}},
					gSetTextColor:{name:"文字色設定", callback: function(k,e){insertCode("文字色設定(《赤》,《緑》,《青》)");}},
					gSetLineWidth:{name:"線太さ設定", callback: function(k,e){insertCode("線太さ設定(《太さ》)");}},
					gSetFontSize:{name:"文字サイズ設定", callback: function(k,e){insertCode("文字サイズ設定(《サイズ》)");}},
					gDrawText:{name:"文字描画", callback: function(k,e){insertCode("文字描画(《文字列》,《x》,《y》)");}},
					gDrawPoint:{name:"点描画", callback: function(k,e){insertCode("点描画(《x》,《y》)");}},
					gDrawLine:{name:"線描画", callback: function(k,e){insertCode("線描画(《x1》,《y1》,《x2》,《y2》)");}},
					gDrawBox:{name:"矩形描画", callback: function(k,e){insertCode("矩形描画(《x》,《y》,《幅》,《高さ》)");}},
					gFillBox:{name:"矩形塗描画", callback: function(k,e){insertCode("矩形塗描画(《x》,《y》,《幅》,《高さ》)");}},
					gDrawCircle:{name:"円描画", callback: function(k,e){insertCode("円描画(《x》,《y》,《半径》)");}},
					gFillCircle:{name:"円塗描画", callback: function(k,e){insertCode("円塗描画(《x》,《y》,《半径》)");}},
					gDrawOval:{name:"楕円描画", callback: function(k,e){insertCode("楕円描画(《x》,《y》,《幅》,《高さ》)");}},
					gFillOval:{name:"楕円塗描画", callback: function(k,e){insertCode("楕円塗描画(《x》,《y》,《幅》,《高さ》)");}},
					gDrawArc:{name:"弧描画", callback: function(k,e){insertCode("弧描画(《x》,《y》,《幅》,《高さ》,《開始角》,《終了角》,《閉じ方》)");}},
					gFillArc:{name:"弧塗描画", callback: function(k,e){insertCode("弧塗描画(《x》,《y》,《幅》,《高さ》,《開始角》,《終了角》,《閉じ方》)");}},
					gBarplot:{name:"棒グラフ描画", callback: function(k,e){insertCode("棒グラフ描画(《幅》,《高さ》,《値》)");}},
					gLineplot:{name:"線グラフ描画", callback: function(k,e){insertCode("線グラフ描画(《幅》,《高さ》,《値》)");}},
					gDrawGraph:{name:"グラフ描画",  callback: function(k,e){insertCode("グラフ描画(《レイアウト情報》,《値の配列》)");}},
					gClearGraph:{name:"グラフ消去", callback: function(k,e){insertCode("グラフ消去()");}}
				}
			},
			graphic2:{ name:"グラフィック命令（英語）",
				items:{
					gOpenWindow:{name:"gOpenWindow", callback: function(k,e){insertCode("gOpenWindow(《幅》,《高さ》)");}},
					gCloseWindow:{name:"gCloseWindow", callback: function(k,e){insertCode("gCloseWindow()");}},
					gClearWindow:{name:"gClearWindow", callback: function(k,e){insertCode("gClearWindow()");}},
					gSetLineColor:{name:"gSetLineColor", callback: function(k,e){insertCode("gSetLineColor(《赤》,《緑》,《青》)");}},
					gSetFillColor:{name:"gSetFillColor", callback: function(k,e){insertCode("gSetFillColor(《赤》,《緑》,《青》)");}},
					gSetTextColor:{name:"gSetTextColor", callback: function(k,e){insertCode("gSetTextColor(《赤》,《緑》,《青》)");}},
					gSetLineWidth:{name:"gSetLineWidth", callback: function(k,e){insertCode("gSetLineWidth(《太さ》)");}},
					gSetFontSize:{name:"gSetFontSize", callback: function(k,e){insertCode("gSetFontSize(《サイズ》)");}},
					gDrawText:{name:"gDrawText", callback: function(k,e){insertCode("gDraeText(《文字列》,《x》,《y》)");}},
					gDrawPoint:{name:"gDrawPoint", callback: function(k,e){insertCode("gDrawPoint(《x》,《y》)");}},
					gDrawLine:{name:"gDrawLine", callback: function(k,e){insertCode("gDrawLine(《x1》,《y1》,《x2》,《y2》)");}},
					gDrawBox:{name:"gDrawBox", callback: function(k,e){insertCode("gDrawBox(《x》,《y》,《幅》,《高さ》)");}},
					gFillBox:{name:"gFillBox", callback: function(k,e){insertCode("gFillBox(《x》,《y》,《幅》,《高さ》)");}},
					gDrawCircle:{name:"gDrawCircle", callback: function(k,e){insertCode("gDrawCircle(《x》,《y》,《半径》)");}},
					gFillCircle:{name:"gFillCircle", callback: function(k,e){insertCode("gFillCircle(《x》,《y》,《半径》)");}},
					gDrawOval:{name:"gDrawOval", callback: function(k,e){insertCode("gDrawOval(《x》,《y》,《幅》,《高さ》)");}},
					gFillOval:{name:"gFillOval", callback: function(k,e){insertCode("gFillOval(《x》,《y》,《幅》,《高さ》)");}},
					gDrawArc:{name:"gDrawArc", callback: function(k,e){insertCode("gDrawArc(《x》,《y》,《幅》,《高さ》,《開始角》,《終了角》,《閉じ方》)");}},
					gFillArc:{name:"gFillArc", callback: function(k,e){insertCode("gFillArc(《x》,《y》,《幅》,《高さ》,《開始角》,《終了角》,《閉じ方》)");}},
					gBarplot:{name:"gBarplot", callback: function(k,e){insertCode("gBarplot(《幅》,《高さ》,《値》)");}},
					gLineplot:{name:"gLineplot", callback: function(k,e){insertCode("gLineplot(《幅》,《高さ》,《値》)");}},
					gDrawGraph:{name:"gDrawGraph",  callback: function(k,e){insertCode("gDrawGraph(《レイアウト情報》,《値の配列》)");}},
					gClearGraph:{name:"gClearGraph", callback: function(k,e){insertCode("gClearGraph()");}}
				}
			},
			misc:{ name: "各種命令",
				items:{
					nop:{name:"何もしない", callback: function(k,e){insertCode("何もしない");}},
					sleep:{name:"待つ", callback: function(k,e){insertCode("《ミリ秒数》ミリ秒待つ");}},
					dump:{name:"変数を確認する", callback: function(k,e){insertCode("変数を確認する");}},
					pause:{name:"一時停止する", callback: function(k,e){insertCode("一時停止する");}}
				}
			}
		}
	}
);
$.contextMenu(
	{
		selector: "#flowchart",
		build: contextMenu_Flowchart
	}
);
// this code is from David Baron's Weblog
// https://dbaron.org/log/20100309-faster-timeouts
//	var timeouts = [];
var messageName = "zero-timeout-message";

// Like setTimeout, but only takes a function argument.  There's
// no time argument (always zero) and no arguments (you have to
// use a closure).
function setZeroTimeout(fn) {
	timeouts.push(fn);
	window.postMessage(messageName, "*");
}

function handleMessage(event) {
	if (event.source == window && event.data == messageName) {
		event.stopPropagation();
		if (timeouts.length > 0) {
			var fn = timeouts.shift();
			fn();
		}
	}
}

if(window.addEventListener) window.addEventListener("message", handleMessage, true);
else if(window.attachEvent) window.attachEvent("onmessage", handleMessage);

// Add the one thing we want added to the window object.
window.setZeroTimeout = setZeroTimeout;

$(window).bind("beforeunload", function(){if(dirty) return "プログラムが消去されます";});

reset(true);

let sample_area = document.getElementById('SampleButtons')
if(sample_load)
{
	let sample_table = document.createElement('table');
	sample_area.appendChild(sample_table);
	let sample_table_row = null;
	for(let i = 0; i < sample.length; i++)
	{
		if(!sample_table_row)
		{
			sample_table_row = document.createElement('tr');
			sample_table.appendChild(sample_table_row);
		}
		let cell = document.createElement('td');
		let button = document.createElement('button');
		button.innerText = 'サンプル' + (i + 1);
		button.setAttribute('type', 'button');
		button.setAttribute('class', 'sampleButton');
		button.onclick = function(){sampleButton(i);};
		cell.appendChild(button);
		sample_table_row.appendChild(cell);
		if(i % 8 == 7) sample_table_row = null;
	}
}
else sample_area.style.display = 'none';

if(answer_load && setting.quiz_mode == 1 && Quizzes.length > 0)
{
let quiz_select = document.getElementById('quiz_select');
	quiz_select.onchange = function ()
	{
		let i = quiz_select.selectedIndex;
		if(i > 0) document.getElementById('quiz_question').innerHTML = Quizzes[i - 1].question();
		else document.getElementById('quiz_question').innerHTML = '';
	};
	let option = document.createElement('option');
	option.val = 0;
	option.appendChild(document.createTextNode('問題選択'));
	quiz_select.appendChild(option);

	for(let i = 0; i < Quizzes.length; i++)
	{
		option = document.createElement('option');
		option.val = i + 1;
		option.appendChild(document.createTextNode('Q' + (i + 1) + ':' + Quizzes[i].title()));
		quiz_select.appendChild(option);
	}
	document.getElementById('quiz_marking').onclick = function ()
	{
		let i = quiz_select.selectedIndex;
		if(i > 0) auto_marking(i - 1);
		else 
		{
			textareaClear();
			textareaAppend('問題が選択されていないので採点できません。'); 
		}
	}
}
else
{
	document.getElementById('Quiz_area').style.display = 'none';
}

document.getElementById('urlButton').onclick = function()
{
	var code = sourceTextArea.value.trim();
	if(code == '') return;
	code = B64encode(code);
	if(code){
		var url = window.location;
		textareaClear();
		highlightLine(-1);
		textareaAppend(url.protocol + '//' + url.hostname + url.pathname + '?code=' + code);
	} 
}
