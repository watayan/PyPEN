"use strict";

const typeOfValue=
{
	typeInt:1,
	typeFloat:2,
	typeString:3,
	typeBoolean:4,
	typeArray:5
};

var graphColor = [
	'#c00000','#00c000','#0000c0','#007070','#700070','#707000'
];

const nameOfType=['','整数','実数','文字列','真偽','配列'];

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
			if(state && (state instanceof DefineFunction || state instanceof DefineStep)) code += state.makePython(0) + "\n\n";
		}
		for(var i = 0; i < this.stack[0].statementlist.length; i++)	// メインルーチン
		{
			var state = this.stack[0].statementlist[i];
			if(state && !(state instanceof DefineFunction || state instanceof DefineStep)) code += state.makePython(0);
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

/** parsedStepクラス
 * @extends parsedCode
 */
class parsedStep extends parsedCode
{
	/**
	 * @constructor
	 * @param {Array<Statement>} statementlist 
	 */
	constructor(statementlist){super(statementlist);}
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
			if(parse[i] instanceof DefineFunction || parse[i] instanceof DefineStep) flag = true;
		if(flag)
		{
			textareaAppend("関数定義や手続き定義のあるプログラムのフローチャートはまだ実装していません。\n");
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
		if(e.line && e.line > 0) textareaAppend(e.line + "行目構文エラーです\n");
		textareaAppend(e.message);
		converting = false;
	}
}

/************************************************************************************ユーティリティ関数 */

/**
 * 有限な値であるか
 * @param {number|string} v 
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
	// return !isNaN(v) && v == Math.floor(v) && v <= 9007199254740991 && v >= -9007199254740991;
}

/**
 * 整数であるか
 * @param {number} v
 * @returns {boolean} vが整数であるか
 */
function isInteger(v)
{
	return Number.isInteger(v);
	// return isFinite(v) && v == Math.floor(v);
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
	// var result = /^(class|function)\s+([\w\d]+)/.exec(obj.constructor.toString());
	// return result ? result[2] : null;
	if(obj) return obj.constructor.name;
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

/**
 * 値クラスの親クラス
 */
class Value
{
	/**
	 * @constructor
	 * @param {number|string|boolean} v 
	 * @param {Location} loc 
	 */
	constructor(v, loc)
	{
		this.value = v;	// value must be value(include array, hash), not Value
		this.loc = loc;
	}
	clone()
	{
		throw new RuntimeError(this.first_line, constructor_name(this) + "はcloneが作られていません");
	}
	/**
	 * @returns 生のJavaScriptにおける値
	 */
	get first_line() {return this.loc.first_line;}
	/**
	 * @returns {Value} 値がほしいときはこれを使う（Variableなど）。そうでないときはValue本体を使う。
	 */
	getValue()
	{
		return this;
	}
	/**
	 * @returns {string} PyPENの文法で表した文字列
	 */
	getCode()
	{
		return '' + this.value;
	}
	/**
	 * @returns {string} Pythonの文法で表した文字列
	 */
	makePython()
	{
		return this.getCode();
	}
	run()
	{
		code[0].stack[0].index++;
	}
}

/**
 * 型の決まってない値
 * @extends Value
 */
class NullValue extends Value
{
	/**
	 * @constructor
	 * @param {Location} loc 
	 */
	constructor(loc)
	{
		super(null, loc);
	}
	clone()
	{
		return new NullValue(this.loc);
	}
	makePython()
	{
		return '';
	}
}

/**
 * vtにあるvn[args]にnewvalをセットする
 * @param {VarTable} vt 
 * @param {String} vn 
 * @param {Array<Value>} args 
 * @param {Value} newval 
 * @param {Location} loc 
 */
function setVariableByArgs(vt,vn, args, newval, loc)
{
	if(args)
	{
		var v = vt.vars[vn];
		for(var i = 0; i < args.length - 1; i++)
		{
			var arg = args[i].getValue();
			if(arg instanceof IntValue)
			{
				if(v instanceof ArrayValue || v instanceof StringValue)
				{
					var idx = arg.getValue().value;
					var l = v.getValue().length;
					if(idx < 0) idx += l;
					if(idx >= 0 && idx < l) v = v.getValue().value[idx];
					else throw new RuntimeError(loc.first_line, "配列の範囲を超えて代入しようとしました");
				}
				else if(v instanceof StringValue)
					throw new RuntimeError(loc.first_line, "部分文字列の部分文字列への代入はできません");
				else throw new RuntimeError(loc.first_line, "整数の添字は配列か文字列でないと使えません");
			}
			else if(arg instanceof StringValue)
			{
				var key0 = arg.getValue().value;
				if(v instanceof DictionaryValue)
				{
					for(var key in v.getValue().value)
					{
						if(key == key0)
						{
							v = v.getValue().value[key0];
							key0 = null;
							break;
						}
					}
					if(key0) throw new RuntimeError(loc.first_line, "辞書にキー"+arg.getValue().value+"がありません");
				} 
				else throw new RuntimeError(loc.first_line, "文字列の添字は辞書でないと使えません");
			}
			else if(arg instanceof SliceValue)
				throw new RuntimeError(loc.first_line, "スライスの使い方が正しくありません");
			else throw new RuntimeError(loc.first_line, "添字が正しくありません");
		}
		//代入
		var arg = args[args.length - 1].getValue();
		if(arg instanceof IntValue)
		{
			var idx = arg.value;
			var l = v.getValue().value.length;
			if(idx < 0) idx += l;
			if(idx < 0 || idx >= l) throw new RuntimeError(loc.first_line, "配列の範囲を超えて代入しようとしました");
			if(v.getValue() instanceof ArrayValue) v.value[idx] = newval;
			else if(v.getValue() instanceof StringValue)
			{
				if(!(newval.getValue() instanceof StringValue)) throw new RuntimeError(loc.first_line, "文字列の途中に文字列でないものを挿入しようとしました");
				var str = v.getValue().value;
				v.getValue().value = str.substr(0, idx) + newval.value + str.substr(idx + 1);
			}
			else throw new RuntimeError(loc.first_line, "整数の添字は配列か文字列にしか使えません");
		}
		else if(arg instanceof StringValue)
		{
			if(v.getValue() instanceof DictionaryValue) v.getValue().value[arg.value] = newval.clone();
			else throw new RuntimeError(loc.first_line, "文字列の添字は辞書にしか使えません");
		}
		else if(arg instanceof SliceValue)
		{
			var idx1 = arg.getValue1().getValue().value;
			var idx2 = arg.getValue2().getValue().value;
			if(v.getValue() instanceof ArrayValue)
			{
				if(!(newval instanceof ArrayValue)) throw new RuntimeError(loc.first_line, "配列に配列でないものを挿入しようとしました");
				var l = v.getValue().length;
				if(!idx1) idx1 = 0;
				if(!idx2) idx2 = l;
				if(idx1 < 0) idx1 += l;
				if(idx2 < 0) idx2 += l;
				if(idx1 >= 0 && idx2 >= 0 && idx1 < l && idx2 < l)
				{
					var a = [];
					for(var i = 0; i < idx1; i++) a.push(v.getValue().value[i].clone());
					for(var i = 0; i < newval.getValue().length; i++) a.push(newval.getValue().value[i].clone());
					for(var i = idx2; i <  l; i++) a.push(v.getValue().value[i].clone());
					v.getValue().value = a;
				}
				else throw new RuntimeError(loc.first_line, "配列の範囲外に挿入しようとしました");
			}
			else if(v.getValue() instanceof StringValue)
			{
				if(!(newval.getValue() instanceof StringValue)) throw new RuntimeError(loc.first_line, "文字列の途中に文字列でないものを挿入しようとしました");
				var l = v.getValue().length;
				if(!idx1) idx1 = 0;
				if(!idx2) idx2 = l;
				if(idx1 < 0) idx1 += l;
				if(idx2 < 0) idx2 += l;
				if(idx1 >= 0 && idx2 >= 0 && idx1 < l && idx2 < l) 
				{
					var str = v.getValue().value.substr(0, idx1) + newval.getValue().value + v.getValue().value.substr(idx2);
					v.getValue().value = str;
				}
			}
			else throw new RuntimeError("スライスの添字は配列か文字列でないと使えません");
		}
		else throw new RuntimeError(loc.first_line, "添字が正しくありません");
	}
	else
	{
		vt.vars[vn] = newval;
		return;
	}
}

/**
 * v[args]の値を取得する
 * @param {Variable} v 
 * @param {Array<Value>} args 
 * @param {Location} loc 
 * @returns Value
 */
function getValueByArgs(v, args, loc)
{
	if(args)
	{
		for(var i = 0; i < args.length; i++)
		{
			var arg = args[i].getValue();
			var val = v.getValue();
			if(arg instanceof IntValue)
			{
				if(val instanceof ArrayValue)	// 配列のidx番目
				{
					var idx = arg.value;
					var l = val.length;
					if(idx < 0) idx += l;
					if(idx >= 0 && idx < l) v = val.value[idx];
					else throw new RuntimeError(loc.first_line, "配列の範囲を超えてアクセスしました");
				}
				else if(v instanceof StringValue)	// 文字列のidx文字目
				{
					var idx = arg.value;
					var l = val.length;
					if(idx < 0) idx += l;
					if(idx >= 0 && idx < l) v = new StringValue(val.value[idx], loc);
					else throw new RuntimeError(loc.first_line, "文字列の範囲を超えてアクセスしました");
				}
				else throw new RuntimeError(loc.first_line, "整数の添字は配列か文字列でないと使えません");
			}
			else if(arg instanceof StringValue)
			{
				if(val instanceof DictionaryValue) v = val.value[arg.getValue().value];
				else throw new RuntimeError(loc.first_line, "文字列の添字は辞書でないと使えません");
			}
			else if(arg instanceof SliceValue)
			{
				var idx1 = arg.getValue1().getValue().value;
				var idx2 = arg.getValue2().getValue().value;
				if(val instanceof ArrayValue)	// 配列のスライス
				{
					var l = val.length;
					if(!idx1) idx1 = 0;
					if(!idx2) idx2 = l;
					if(idx1 < 0) idx1 += l;
					if(idx2 < 0) idx2 += l;
					if(idx1 >= 0 && idx2 >= 0 && idx1 <= l && idx2 <= l)
					{
						var a = [];
						for(var j = idx1; j < idx2; j++) a.push(val.value[j].clone());
						v = new ArrayValue(a, loc);
					}
					else throw new RuntimeError(loc.first_line, "配列の範囲を超えて読み出そうとしました");
				}
				else if(val instanceof StringValue)	// 文字列のスライス
				{
					var l = val.length;
					if(!idx1) idx1 = 0;
					if(!idx2) idx2 = l;
					if(idx1 < 0) idx1 += l;
					if(idx2 < 0) idx2 += l;
					if(idx1 >= 0 && idx2 >= 0 && idx1 <= l && idx2 <= l) v = new StringValue(val.value.substr(idx1, idx2 - idx1), loc);
					else throw new RuntimeError(loc.first_line, "文字列の範囲を超えて読み出そうとしました");
				}
				else throw new RuntimeError(loc.first_line, "スライスの添字は配列か文字列でないと使えません");
			}
			else throw new RuntimeError(loc.first_line, "添字が正しくありません");
		}
	}
	return v;
}

/**
 * 配列
 */
class ArrayValue extends Value
{
	/**
	 * @constructor
	 * @param {Array<Value>} v 
	 * @param {Location} loc 
	 */
	constructor(v,loc)
	{
		super(v, loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		var a = [];
		for(var i = 0; i < this.value.length; i++) a.push(this.value[i].getValue());
		return new ArrayValue(a, this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			var a = [];
			for(var i = 0; i < this.value.length; i++) 
			{
				a.push(this.value[i].getValue());
			}
			this.rtnv = new ArrayValue(a, this.loc);
			this.state = 0;
		}
	}
	getCode()
	{
		var ag = [];
		for(var i = 0; i < this.value.length; i++) ag.push(this.value[i].getCode());
		return '[' + ag.join(',') + ']';
	}
	makePython()
	{
		var ag = [];
		for(var i = 0; i < this.value.length; i++) ag.push(this.value[i].makePython());
		return '[' + ag.join(', ') + ']';
	}
	get length() {return this.value.length;}
	append(a)
	{
		for(var i of a) this.value.push(i);
	}
	getValue()
	{
		return this.rtnv ? this.rtnv : this;
	}
}

/**
 * 辞書
 */
class DictionaryValue extends Value
{
	/**
	 * @constructor
	 * @param {Array<SliceValue>} v
	 * @param {Location} loc
	 */
	constructor(v, loc)
	{
		super(new Map(), loc);
		for(var i = 0; i < v.length; i++)
		{
			if(v[i] instanceof SliceValue && v[i].getValue1().getValue() instanceof StringValue && !(v[i].getValue2().getValue() instanceof NullValue))
				this.value.set(v[i].getValue1().getValue().value, v[i].getValue2());
			else throw new RuntimeError(loc.first_line, "辞書の初期化が間違っています");
		}
		this.rtnv = this.value;
		this.state = 0;
	}
	clone()
	{
		var rtnv = new DictionaryValue([], this.loc);
		for(var key of Object.keys(this.value))
		{
			if(this.value[key])
			{
				rtnv.value[key] = isPrimitive(this.value[key]) ? this.value[key].getValue().clone() : this.value[key].getValue();
			}
			else throw new RuntimeError(this.first_line, key + "が定義されていません");
		}
		return rtnv;
	}
	getCode()
	{
		var ag = [];
		var keys = Object.keys(this.value);
		keys.sort();
		for(var i = 0; i < keys.length; i++) 
			ag.push(keys[i] + ':' + this.value[keys[i]].getCode());
		return '{' + ag.join(',') + '}';
	}
	makePython()
	{
		var ag = [];
		var keys = Object.keys(this.value);
		keys.sort();
		for(var i = 0; i < keys.length; i++) 
			ag.push("'" + keys[i] + "':" + this.value[keys[i]].makePython());
		return '{' + ag.join(', ') + '}';
	}
	run()
	{
		if(this.state == 0)
		{
			var a = [];
			for(let key of Object.keys(this.value))
			{
				a.push(this.value[key]);
			}
			code[0].stack.unshift({statementlist: a, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			var a = [];
			for(let key of Object.keys(this.value))
			{
				a.push(new SliceValue(new StringValue(key, this.loc), this.value[key], this.loc));
			}
			this.rtnv = new DictionaryValue(a, this.loc);
			this.state = 0;
		}
	}
	getValue()
	{
		return this.rtnv;
	}
}

class IntValue extends Value
{
	constructor(v, loc)
	{
		super(v, loc);
		if(!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表せない値です");
	}
	clone()
	{
		return new IntValue(this.value, this.loc);
	}
}
class FloatValue extends Value
{
	constructor(v, loc)
	{
		super(v, loc);
		if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
	}
	clone()
	{
		return new FloatValue(this.value, this.loc);
	}
	getCode()
	{
		let str = this.value.toString();
		if(str.match(/[Ee]/) != undefined)  return str;
		else if(isSafeInteger(this.value)) return this.value + '.0';
		else return this.value;
	}
}

class StringValue extends Value 
{
	constructor(v, loc)
	{
		super(v, loc);
	}
	clone()
	{
		return  new StringValue(this.value, this.loc);
	}
	getCode()
	{
		return '"' + this.value.replace(/"/g,'\\"') + '"';
	}
	get length(){return this.value.length;}
	makePython()
	{
		return '\'' + this.value.replace('\'','\\\'') + '\'';
	}
}
class BooleanValue extends Value 
{
	constructor(v, loc)
	{
		super(v ? true : false, loc);
	}
	clone()
	{
		return BooleanValue(this.value, this.loc);
	}
	getCode()
	{
		return this.value ? 'True' : 'False';
	}
	makePython()
	{
		return this.value ? "True" : "False";
	}
}

class UNDEFINED extends Value
{
	constructor(v, loc)
	{
		super(v, loc);
	}
	clone()
	{
		return new UNDEFINED(this.value, this.loc);
	}
	get varname()
	{
		return this.value;
	}
	getValue()
	{
		throw new RuntimeError(this.first_line, "未完成のプログラムです");
	}
}

/**
 * 値渡しをする
 */
class Copy extends Value
{
	constructor(v, loc)
	{
		super(v, loc);
		this.state = 0;
	}
	clone()
	{
		return new Copy(this.value, this.loc);
	}
	getCode()
	{
		return "copy(" + this.value.getCode() + ")";
	}
	makePython()
	{
		return  this.value.makePython() + ".copy()";
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: [this.value], index:0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			this.rtnv = this.value.getValue().clone();
			this.state = 0;
		}
	}
	getValue()
	{
		return this.rtnv;
	}
}
class Pow extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return  new Pow(this.value[0], this.value[1], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index:0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
			if(v1 instanceof IntValue && v2 instanceof IntValue && v2.value >= 0) // 整数の自然数乗
			{
				if(v1.value == 0 && v2.value <= 0) throw new RuntimeError(this.first_line, "0は正の数乗しかできません");
				let v = Math.pow(v1.value, v2.value);
				if(isSafeInteger(v)) this.rtnv = new IntValue(v, this.loc);
				else throw new RuntimeError(this.first_line, "整数で表せる範囲を越えました");
			}
			else if((v1 instanceof IntValue || v1 instanceof FloatValue) && (v2 instanceof IntValue || v2 instanceof FloatValue))
			{
				if(v1.value < 0 && !Number.isSafeInteger(v2.value)) throw new RuntimeError(this.first_line, "負の数の非整数乗はできません");
				if(v1.value == 0 && v2.value <= 0) throw new RuntimeError(this.first_line, "0は正の数乗しかできません");
				let v = Math.pow(v1.value, v2.value);
				if(isFinite(v)) this.rtnv = new FloatValue(v, this.loc);
				else throw new RuntimeError(this.first_line, "オーバーフローしました");
			} else throw new RuntimeError('数値でないもののべき乗はできません');
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub" || c1 == "Mul" || c1 == "Div" || c1 == "DivInt" || c1 == "Mod") brace1 = true;
		if(c2 == "Minus" || c2 == "Add" || c2 == "Sub" || c2 == "Mul" || c2 == "Div" || c2 == "DivInt" || c2 == "Mod") brace2 = true;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '**'
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub" || c1 == "Mul" || c1 == "Div" || c1 == "DivInt" || c1 == "Mod") brace1 = true;
		if(c2 == "Minus" || c2 == "Add" || c2 == "Sub" || c2 == "Mul" || c2 == "Div" || c2 == "DivInt" || c2 == "Mod") brace2 = true;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' ** '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.rtnv;
	}
}

class Add extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new Add(this.value[0], this.value[1], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
			if(v1 instanceof ArrayValue && v2 instanceof ArrayValue)
			{
				let v = []
				for(let i = 0; i < v1.length; i++) v.push(v1.value[i])
				for(let i = 0; i < v2.length; i++) v.push(v2.value[i])
				this.rtnv = new ArrayValue(v, this.loc);
			}
			else if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の足し算はできません");
			else if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型の足し算はできません");
			else if(v1 instanceof StringValue || v2 instanceof StringValue) // 一方でも文字列なら文字列結合
			{
				this.rtnv = new StringValue(v1.value + v2.value, this.loc);
			}
			else	// 数値どうし
			{
				let v = v1.value + v2.value; 
				if(v1 instanceof FloatValue || v2 instanceof FloatValue)	// 一方が実数型なら結果は実数型
				{
					if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
					this.rtnv = new FloatValue(v, this.loc);
				}
				else	// 整数型
				{
					if(!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
					this.rtnv = new IntValue(v, this.loc);
				}
			}
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus") brace1 = true;
		if(c2 == "Minus") brace2 = true;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '+'
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus") brace1 = true;
		if(c2 == "Minus") brace2 = true;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' + '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.rtnv;
	}
}

class Sub extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new Sub(this.value[0], this.value[1], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index:0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の引き算はできません");
			if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型の引き算はできません");
			if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の引き算はできません");
			let v = v1.value - v2.value;
			if(v1 instanceof FloatValue || v2 instanceof FloatValue)
			{
				if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
				this.rtnv = new FloatValue(v, this.loc);
			}
			else
			{
				if(!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
				this.rtnv = new IntValue(v, this.loc);
			}
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus") brace1 = true;
		if(c2 == "Minus") brace2 = true;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '-'
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus") brace1 = true;
		if(c2 == "Minus") brace2 = true;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' - '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.rtnv;
	}
}

class Mul extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.state = 0;
	}
	clone()
	{
		return new Mul(this.value[0], this.value[1], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
			if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型のかけ算はできません");
			else if(v1 instanceof StringValue || v2 instanceof StringValue)
			{
				let va = null, vn = null;
				if(v1 instanceof IntValue){va = v2; vn = v1;}
				else if(v2 instanceof IntValue){va = v1; vn = v2;}
				else throw new RuntimeError(this.first_line, "文字列には整数しか掛けられません");
				let v = '';
				for(let i = 0; i < vn.value; i++)
					v += va.value;
				this.rtnv = new StringValue(v, this.loc);
			}
			else if(v1 instanceof ArrayValue || v2 instanceof ArrayValue)
			{
				let va = null, vn = null;
				if(v1 instanceof IntValue){va = v2; vn = v1;}
				else if(v2 instanceof IntValue){va = v1; vn = v2;}
				else throw new RuntimeError(this.first_line, "配列には整数しか掛けられません");
				let v = []
				for(let i = 0; i < vn.value; i++)
					for(let j = 0; j < va.length; j++) v.push(va.value[j]);
				this.rtnv = new ArrayValue(v, this.loc);
			} 
			else
			{
				let v = v1.value * v2.value;
				if(v1 instanceof FloatValue || v2 instanceof FloatValue)
				{
					if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
					this.rtnv = new FloatValue(v, this.loc);
				}
				else
				{
					if(!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
					this.rtnv = new IntValue(v, this.loc);
				}
			}
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
		if(c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '*'
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
		if(c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' * '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.rtnv;
	}
}

class Div extends Value	// /
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new Div(this.value[0], this.value[1], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のわり算はできません");
			if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型のわり算はできません");
			if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のわり算はできません");
			if(v2.value == 0) throw new RuntimeError(this.first_line, "0でわり算をしました");
			let v = v1.value / v2.value;
			if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
			this.rtnv = new FloatValue(v, this.loc);
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
		if(c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '/'
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
		if(c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
			return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' / '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.rtnv;
	}
}

class DivInt extends Value // //
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new DivInt(this.value[0], this.value[1], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のわり算はできません");
			if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型のわり算はできません");
			if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のわり算はできません");
			if(v2.value == 0) throw new RuntimeError(this.first_line, "0でわり算をしました");
			let v = Math.floor(v1.value / v2.value);
			if(!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
			this.rtnv = new IntValue(v, this.loc);
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
		if(c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '//'
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
		if(c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
			return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' // '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.rtnv;
	}
}


class Mod extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new Mod(this.value[0].clone(), this.value[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
			if(v1 instanceof IntValue && v2 instanceof IntValue)
			{
				if(v2.value == 0) throw new RuntimeError(this.first_line, "0でわり算をしました");
				let v = v1.value - Math.floor(v1.value / v2.value) * v2.value;
				if(!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
				this.rtnv = new IntValue(v, this.loc);
			}
			else
				throw new RuntimeError(this.first_line, "余りを出す計算は整数でしかできません");
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
		if(c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '%'
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
		if(c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' % '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.rtnv;
	}
}

class Minus extends Value
{
	constructor(x, loc)
	{
		super([x], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new Minus(this.value[0], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.value[0].getValue();
			if(v1 instanceof IntValue || v1 instanceof FloatValue)
			{
				let v = -v1.value;
				if(v1 instanceof IntValue && !isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
				if(v1 instanceof FloatValue && !isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
				this.rtnv = v1 instanceof IntValue ? new IntValue(v, this.loc) : new FloatValue(v, this.loc);
			}
			else
				throw new RuntimeError(this.first_line, "マイナスは数値にしかつけられません");
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0];
		let c1 = constructor_name(v1);
		let brace1 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
		return '-' + (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '');
	}
	makePython()
	{
		let v1 = this.value[0];
		let c1 = constructor_name(v1);
		let brace1 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
		return '-' + (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '');
	}
	getValue()
	{
		return this.rtnv;
	}
}

class And extends Value
{
	constructor(x, y, loc)
	{
		super([x,y],loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new And(this.value[0].clone(), this.value[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index:0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.value[0].getValue();
			if(v1 instanceof BooleanValue)
			{
				if(!v1.value) this.rtnv = new BooleanValue(false, this.loc);
				else
				{
					let v2 = this.value[1].getValue();
					if(v2 instanceof BooleanValue) this.rtnv = new BooleanValue(v2.value, this.loc);
				}
			}
			else
				throw new RuntimeError(this.first_line, "「かつ」は真偽値にしか使えません");
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c2 == "And" || c2 == "Or" || c2 == "Not") brace2 = true;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ ' and '
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c2 == "And" || c2 == "Or" || c2 == "Not") brace2 = true;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' and '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.rtnv;
	}
}

class Or extends Value
{
	constructor(x, y, loc)
	{
		super([x,y],loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new Or(this.value[0].clone(), this.value[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index:0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.value[0].getValue();
			if(v1 instanceof BooleanValue)
			{
				if(v1.value) this.rtnv = new BooleanValue(true, this.loc);
				else
				{
					let v2 = this.value[1].getValue();
					if(v2 instanceof BooleanValue) this.rtnv = new BooleanValue(v2.value, this.loc);
				}
			}
			else
				throw new RuntimeError(this.first_line, "「または」は真偽値にしか使えません");
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c2 == "And" || c2 == "Or" || c2 == "Not") brace2 = true;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ ' or '
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c2 == "And" || c2 == "Or" || c2 == "Not") brace2 = true;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' or '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.rtnv;
	}
}

class Not extends Value
{
	constructor(x, loc)
	{
		super([x],loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new Not(this.value[0], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index:0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.value[0].getValue();
			if(v1 instanceof BooleanValue) this.rtnv = new BooleanValue(!v1.value, this.loc);
			else throw new RuntimeError(this.first_line, "「でない」は真偽値にしか使えません");
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0];
		let c1 = constructor_name(v1);
		let brace1 = false;
	//	if(c2 == "And" || c2 == "Or" || c2 == "Not") brace2 = true;
		return 'not ' + (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '');
	}
	makePython()
	{
		let v1 = this.value[0];
		let c1 = constructor_name(v1);
		let brace1 = false;
		if(c1 == "And" || c1 == "Or" || c1 == "Not") brace2 = true;
		return 'not ' + (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '');
	}
	getValue()
	{
		return this.rtnv;
	}
}

class BitAnd extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new BitAnd(this.value[0], this.value[1], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index:0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビット積はできません");
			else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビット積はできません");
			else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) this.rtnv = new BooleanValue(v1.value & v2.value, this.loc);
			else if(v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビット積はできません");
			else
			{
				if(v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
				if(v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
				this.rtnv = new IntValue(v1.value & v2.value, this.loc);
			}
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift") brace1 = true;
		if(c2 == "Minus" || c2 == "BitRShift" || c2 == "BitLShift") brace2 = true;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '&'
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift" || c1 == "BitNot") brace1 = true;
		if(c2 == "Minus" || c2 == "BitRShift" || c2 == "BitLShift" || c2 == "BitNot") brace2 = true;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' & '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.rtnv;
	}
}

class BitOr extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new BitOr(this.value[0], this.value[1], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index:0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビット和はできません");
			else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビット和はできません");
			else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) this.rtnv = new BooleanValue(v1.value & v2.value, this.loc);
			else if(v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビット和はできません");
			else
			{
				if(v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
				if(v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
				this.rtnv = new IntValue(v1.value | v2.value, this.loc);
			}
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift" || c1 == "BitNot") brace1 = true;
		if(c2 == "Minus" || c2 == "BitRShift" || c2 == "BitLShift" || c2 == "BitNot") brace2 = true;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '|'
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift" || c1 == "BitNot") brace1 = true;
		if(c2 == "Minus" || c2 == "BitRShift" || c2 == "BitLShift" || c2 == "BitNot") brace2 = true;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' | '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.rtnv;
	}
}

class BitXor extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new BitXor(this.value[0], this.value[1], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の排他的ビット和はできません");
			else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の排他的ビット和はできません");
			else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) this.rtnv = new BooleanValue(v1.value & v2.value, this.loc);
			else if(v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数の排他的ビット和はできません");
			else
			{
				if(v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
				if(v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
				this.rtnv = new IntValue(v1.value ^ v2.value, this.loc);
			}
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift" || c1 == "BitNot") brace1 = true;
		if(c2 == "Minus" || c2 == "BitRShift" || c2 == "BitLShift" || c2 == "BitNot") brace2 = true;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '^'
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift" || c1 == "BitNot") brace1 = true;
		if(c2 == "Minus" || c2 == "BitRShift" || c2 == "BitLShift" || c2 == "BitNot") brace2 = true;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' ^ '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.rtnv;
	}
}

class BitNot extends Value
{
	constructor(x, loc)
	{
		super([x], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new BitNot(this.value[0], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.value[0].getValue()
			if(v1 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビット反転はできません");
			else if(v1 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビット反転はできません");
			else if(v1 instanceof BooleanValue) this.rtnv = new BooleanValue(!v1.value, this.loc);
			else if(v1 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビット反転はできません");
			else
			{
				this.rtnv = new IntValue(~v1.value, this.loc);
			}
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0];
		let c1 = constructor_name(v1);
		let brace1 = false;
		if(c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift") brace1 = true;
		return '~' + (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '');
	}
	makePython()
	{
		let v1 = this.value[0];
		let c1 = constructor_name(v1);
		let brace1 = false;
		if(c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift") brace1 = true;
		return '~' + (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '');
	}
	getValue()
	{
		return this.rtnv;
	}
}

class BitLShift extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new BitLShift(this.value[0], this.value[1], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビットシフトはできません");
			else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビットシフトはできません");
			else if(v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビットシフトはできません");
			else
			{
				if(v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
				if(v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
				this.rtnv = new IntValue(v1.value << v2.value, this.loc);
			}
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "BitNot") brace1 = true;
		if(c2 == "Minus" || c2 == "BitNot") brace2 = true;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '<<'
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "BitNot") brace1 = true;
		if(c2 == "Minus" || c2 == "BitNot") brace2 = true;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' << '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.rtnv;
	}
}

class BitRShift extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new BitRShift(this.value[0], this.value[1], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].state[0].index++;
			let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビットシフトはできません");
			else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビットシフトはできません");
			else if(v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビットシフトはできません");
			else
			{
				if(v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
				if(v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
				this.rtnv = new IntValue(v1.value >> v2.value, this.loc);
			}
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "BitNot") brace1 = true;
		if(c2 == "Minus" || c2 == "BitNot") brace2 = true;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '>>'
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "BitNot") brace1 = true;
		if(c2 == "Minus" || c2 == "BitNot") brace2 = true;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' >> '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.rtnv;
	}
}


/**
 * @returns boolean
 * @param {ArrayValue} v1 
 * @param {ArrayValue} v2 
 */
function ArrayCompare(v1, v2)
{
	var rtnv = true;
	if(v1 instanceof ArrayValue && v2 instanceof ArrayValue)
	{
		if(v1.length != v2.length) return false;
		for(let i = 0; i < v1.length; i++) rtnv = rtnv && ArrayCompare(v1.getValue().value[i], v2.getValue().value[i]);
	}
	else rtnv = rtnv && typeof v1 == typeof v2 && v1.value == v2.value;
	return rtnv;
}

class Compare extends Value
{
	constructor(x,y,z,loc)
	{
		super([x,y,z],loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new Compare(this.value[0], this.value[1], this.value[2], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: [this.value[0]], index: 0});
			this.state = 1;
		}
		else if(this.state == 1)
		{
			if(this.value[0] instanceof Compare && !this.value[0].getValue().value)
			{
				code[0].stack[0].index++;
				this.state = 0;
				this.rtnv = new BooleanValue(false, this.loc);
			}
			else
			{
				code[0].stack.unshift({statementlist:[this.value[2]], index: 0});
				this.state = 2;
			}
		}
		else
		{
			code[0].stack[0].index++;
			this.state = 0;
			var v1, v2 = this.value[2].getValue();
			if(this.value[0] instanceof Compare) v1 = this.value[0].value[2].getValue();
			else v1 = this.value[0].getValue();
			switch(this.value[1])
			{
			case '==':
			case '=':
				if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) this.rtnv = new BooleanValue(ArrayCompare(v1, v2), this.loc);
				else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
				else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
				else this.rtnv = new BooleanValue(v1.value == v2.value, this.loc);
				break;
			case '!=':
				if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) this.rtnv = new BooleanValue(!ArrayCompare(v1, v2), this.loc);
				else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
				else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
				else this.rtnv = new BooleanValue(v1.value != v2.value, this.loc);
				break;
			case '>':
				if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません")
				else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
				else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
				this.rtnv = new BooleanValue(v1.value > v2.value, this.loc);
				break;
			case '<':
				if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません")
				else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
				else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
				this.rtnv = new BooleanValue(v1.value < v2.value, this.loc);
				break;
			case '>=':
				if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません")
				else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
				else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
				this.rtnv = new BooleanValue(v1.value >= v2.value, this.loc);
				break;
			case '<=':
				if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません")
				else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
				else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
				this.rtnv = new BooleanValue(v1.value <= v2.value, this.loc);
				break;
			case 'の中に':
				var flag = false;
				if(v1 instanceof ArrayValue)
					for(let i = 0; i < v1.value.length; i++) flag |= ArrayCompare(v1.value[i], v2);
				else throw new RuntimeError(this.first_line, "\"の中に\"の前には配列が必要です");
				this.rtnv = new BooleanValue(flag, this.loc);
				break;
			case 'in':
				var flag = false;
				if(v2 instanceof ArrayValue)
					for(let i = 0; i < v2.value.length; i++) flag |= ArrayCompare(v2.value[i], v1);
				else throw new RuntimeError(this.first_line, "\"in\"の後には配列が必要です");
				this.rtnv = new BooleanValue(flag, this.loc);
				break;
			case 'not in':
				var flag = false;
				if(v2 instanceof ArrayValue)
					for(let i = 0; i < v2.value.length; i++) flag |= ArrayCompare(v2.value[i], v1);
				else throw new RuntimeError(this.first_line, "\"not in\"の後には配列が必要です");
				this.rtnv = new BooleanValue(!flag, this.loc);
			}
		}
	}
	getCode()
	{
		let v1 = this.value[0], v2 = this.value[2];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+  this.value[1]
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.value[0], v2 = this.value[2];
		let brace1 = false, brace2 = false;
		var op = this.value[1];
		switch(this.value[1])
		{
		case 'not in':
			op = ' not in '; 
			break;
		case 'in':
			op = ' in '; 
			break;
		case 'の中に':
			op = ' in '; 
			var tmp = v1; v1 = v2; v2 = tmp;
			break;
		case '=':
			op = ' == ';
			break;
		default:
			op = ' ' + op + ' ';
		}
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+  op
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.rtnv;
	}
}

class EQ extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new EQ(this.value[0], this.value[1], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) this.rtnv = new BooleanValue(ArrayCompare(v1, v2), this.loc);
			else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
			else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
			else this.rtnv = new BooleanValue(v1.value == v2.value, this.loc);
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '=='
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' == '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.rtnv;
	}
}

class NE extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new NE(this.value[0].clone(), this.value[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) this.rtnv = new BooleanValue(!ArrayCompare(v1, v2), this.loc);
			else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
			else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
			else this.rtnv = new BooleanValue(v1.value != v2.value, this.loc);
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '!='
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' != '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.rtnv;
	}
}

class GT extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.rtnv = null;
		this.state  = 0;
	}
	clone()
	{
		return new GT(this.value[0], this.value[1], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません")
			else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
			else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
			this.rtnv = new BooleanValue(v1.value > v2.value, this.loc);
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '>'
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' > '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.rtnv;
	}
}

class GE extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new GE(this.value[0], this.value[1], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません")
			else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
			else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
			this.rtnv = new BooleanValue(v1.value >= v2.value, this.loc);
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '>='
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' >= '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.rtnv;
	}
}

class LT extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new LT(this.value[0], this.value[1], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません")
			else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
			else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
			this.rtnv = new BooleanValue(v1.value < v2.value, this.loc);
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '<'
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' < '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.rtnv;
	}
}

class LE extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new LE(this.value[0], this.value[1], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません")
			else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
			else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
			this.rtnv = new BooleanValue(v1.value <= v2.value, this.loc);
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '<='
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' <= '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.rtnv;
	}
}

class IN extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new IN(this.value[0], this.value[1], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
			var flag = false;
			if(v1 instanceof ArrayValue)
				for(let i = 0; i < v1.value.length; i++) flag |= ArrayCompare(v1.value[i], v2);
			else throw new RuntimeError(this.first_line, "\"の中に\"の前には配列が必要です");
			this.rtnv = new BooleanValue(flag, this.loc);
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ 'の中に'
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()	// 逆順になることに注意
	{
		let v1 = this.value[0], v2 = this.value[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v2.makePython() + (brace1 ? ')' : '')
			+ ' in '
			+ (brace2 ? '(' : '') + v1.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.rtnv;
	}
}

class NumberOf extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new NumberOf(this.value[0], this.value[1], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let vt = new varTable();
			let statementlist = [];
			let globalvarTable = varTables[varTables.length - 1];
			for(let v of Object.keys(globalvarTable.vars)) vt.vars[v] = globalvarTable.vars[v].getValue().clone();
			for(let v of Object.keys(varTables[0].vars)) vt.vars[v] = varTables[0].vars[v].getValue().clone();
			// 空リストを'!'という変数に代入する。カウンタは'!!'
			let var1 = new Variable('!', null, this.loc);
			let var2 = new Variable('!!', null, this.loc);
			statementlist.push(new Assign(var1, new ArrayValue([], this.loc), null, this.loc));
			statementlist.push(new ForInc(var2, new IntValue(1, this.loc),this.value[0].getValue(), new IntValue(1, this.loc),
				[this.value[1], new Append(var1, this.value[1], this.loc)], this.loc));
			// statementlist.push(new runBeforeGetValue([var1], this.loc));
			statementlist.push(var1);
			statementlist.push(new ReturnStatement(var1, this.loc));
	
			setCaller(statementlist, this);
			code.unshift(new parsedFunction(statementlist));
			varTables.unshift(vt);
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '個の'
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.value[0], v2 = this.value[1];
		let brace1 = false, brace2 = false;
		return '[' + (brace1 ? '(' : '') + v2.makePython() + (brace1 ? ')' : '')
			+ ' for _ in range('
			+ (brace2 ? '(' : '') + v1.makePython() + (brace2 ? ')' : '')
			+ ')]';
	}
	getValue()
	{
		return this.rtnv;
	}
	setValue(v)
	{
		this.rtnv = v.clone();
	}
}


class ConvertInt extends Value
{
	constructor(x, loc)
	{
		super([x], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new ConvertInt(this.value[0], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v = this.value[0].getValue();
			let r = Number.NaN;
			if(v instanceof IntValue) r = v.value;
			else if(v instanceof FloatValue) r = Math.floor(v.value);
			else if(v instanceof StringValue) r = Math.floor(Number(v.value));
			else if(v instanceof BooleanValue) r = v.value ? 1 : 0;
			if(isSafeInteger(r)) this.rtnv = new IntValue(r, this.loc);
			else throw new RuntimeError(this.loc.first_line, '整数に直せません');
			this.state = 0;
		}
	}
	getCode()
	{
		return '整数(' + this.value[0].getCode() + ')';
	}
	makePython()
	{
		return 'int(' + this.value[0].makePython() + ')';
	}
	getValue()
	{
		return this.rtnv;
	}
}

class ConvertFloat extends Value
{
	constructor(x, loc)
	{ 
		super([x], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new ConvertFloat(this.value[0], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v = this.value[0].getValue();
			let r = Number.NaN;
			if(v instanceof IntValue || v instanceof FloatValue) r = v.value;
			else if(v instanceof StringValue) r = Number(v.value);
			else if(v instanceof BooleanValue) r = v.value ? 1 : 0;
			if(isFinite(r)) this.rtnv = new FloatValue(r, this.loc);
			else throw new RuntimeError(this.loc.first_line, '実数に直せません');
			this.state = 0;
		}
	}
	getCode()
	{
		return '実数(' + this.value[0].getCode() + ')';
	}
	makePython()
	{
		return 'float(' + this.value[0].makePython() + ')';
	}
	getValue()
	{
		return this.rtnv;
	}
}

class ConvertString extends Value
{
	constructor(x, loc)
	{
		super([x], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return ConvertString(this.value[0], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v = this.value[0].getValue();
			let r = '';
			if(v instanceof IntValue || v instanceof FloatValue) r = String(v.value);
			else if(v instanceof StringValue) r = v.value
			else if(v instanceof BooleanValue) r = v.value ? 'True' : 'False';
			this.rtnv = new StringValue(r, this.loc);
			this.state = 0;
		}
	}
	getCode()
	{
		return '文字列(' + this.value[0].getCode() + ')';
	}
	makePython()
	{
		return 'str(' + this.value[0].makePython() + ')';
	}
	getValue()
	{
		return this.rtnv;
	}
}

class ConvertBool extends Value
{
	constructor(x, loc)
	{
		super([x], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new ConvertBool(this.value[0], this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v = this.value[0].getValue();
			let r = '';
			let re = /^(0+|false|偽|)$/i;
			if(v instanceof IntValue || v instanceof FloatValue) r = v.value != 0;
			else if(v instanceof StringValue) r = re.exec(v.value) ? false : true;
			else if(v instanceof BooleanValue) r = v.value;
			this.rtnv = new BooleanValue(r, this.loc);
			this.state = 0;
		}
	}
	getCode()
	{
		return '真偽(' + this.value[0].getCode() + ')';
	}
	makePython()
	{
		return 'bool(' + this.value[0].makePython() + ')';
	}
	getValue()
	{
		return this.rtnv;
	}
}

class Variable extends Value
{
	/**
	 * 
	 * @param {string} x 
	 * @param {ArrayValue} y 
	 * @param {Location} loc 
	 */
	constructor(x, y, loc)
	{
		super([x,y],loc); 
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		return new Variable(this.value[0], this.value[1] ? this.value[1] : null, this.loc);
	}
	get varname(){return this.value[0];}
	get args(){return this.value[1];}
	run()
	{
		if(this.state == 0)
		{
			if(this.args) code[0].stack.unshift({statementlist: this.args.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let vn = this.varname;		// 変数名
			let vt = findVarTable(vn);	// 変数は定義されてるか
			if(vt)
			{
				let v = vt.vars[vn];
				this.rtnv = getValueByArgs(v, this.args ? this.args.value : null, this.loc);
			}
			else throw new RuntimeError(this.first_line, "変数" + this.varname + "が定義されていません");
			this.state = 0;
		}
	}
	getCode()
	{
		let vn = this.value[0];
		let pm = this.value[1];
		if(pm != null)
		{
			let ag = new Array(pm.length);
			for(let i = 0; i < pm.length; i++)
			{
				ag[i] = pm.value[i].getCode();
			}
			vn += '['+ag.join(',')+']';
		}
		return vn;
	}
	makePython()
	{
		let vn = this.value[0];
		let pm = this.value[1];
		if(pm != null)
		{
			let ag = new Array(pm.length);
			for(let i = 0; i < pm.length; i++)
			{
				ag[i] = '[' + pm.value[i].makePython() + ']';
			}
			vn += ag.join('');
		}
		return vn;
	}
	getValue()
	{
		return this.rtnv;
	}
	append(a)
	{
		if(this.args) this.args.append(a);
		else this.value[1] = new ArrayValue(a, this.loc);
	}
}


/**
 * 定義済み関数クラス
 */
class DefinedFunction
{
	/**
	 * @constructor
	 * @param {number} argc 引数の個数
	 * @param {function} func 実際の関数
	 * @param {string} module Pythonで必要となるモジュール。nullならナニもいらない
	 * @param {function} convert this.argcを受け取ってPythonコードの文字列を返す関数。nullならthis.funcName(this.argc)的なことをする。
	 */
	constructor(argc, func, module, convert) { 
		this.argc = argc; this.func = func; this.module = module; this.convert = convert;
		this.caller = null;
		this.loc = null;
	}
	/**
	 * 関数の値を返す
	 * @param {Array<Value>} parameters 
	 * @param {Location} loc 
	 * @returns {any}
	 */
	run()
	{
		if((this.argc instanceof Array && this.argc[0] <= this.parameters.length && this.argc[1] >= this.parameters.length)
			|| this.parameters.length == this.argc)
			{
				code[0].stack[0].index++;
				this.caller.setValue(this.func(this.parameters, this.loc));
				code.shift();
			}
		else throw new RuntimeError(this.loc.first_line, "引数の個数が違います");
	}
	clone()
	{
		return new DefinedFunction(this.argc, this.func, this.module, this.convert);
	}
	setCaller(caller)
	{
		this.caller = caller;
	}
	setParameter(params)
	{
		this.parameters = params;
	}
	setLocation(loc)
	{
		this.loc = loc;
	}
}

/**
 * 定義済み関数一覧
 */
var definedFunction = {
	"keys": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof DictionaryValue)
		{
			var args = [];
			var keys = Object.keys(par1.value);
			keys.sort();
			for(let i = 0; i < keys.length; i++) args.push(new StringValue(keys[i], loc));
			return new ArrayValue(args, this.loc);
		}
		else throw new RuntimeError(loc.first_line, 'keysは辞書にしか使えません');
	}, null, null),
	"abs": new DefinedFunction(1, function (param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue) return new IntValue(Math.abs(par1.value), loc);
		else if(par1 instanceof FloatValue) return new FloatValue(Math.abs(par1.value), loc);
		else throw new RuntimeError(loc.first_line, "absは数値にしか使えません");
	}, null, null),
	"random": new DefinedFunction([0,1], function(param, loc){
		if(param.length == 0) return new FloatValue(Math.random(), this.loc);
		else{
			var par1 = param[0].getValue();
			if(par1 instanceof IntValue) return new IntValue(Math.floor(Math.random() * Math.floor(par1.value + 1)), this.loc);
			else throw new RuntimeError(loc.first_line, "randomは整数にしか使えません");
		} 
	}, "random", function(argc){
		if(argc[0])	return "random.randint(0," + argc[0] + ")";
		else return "random.random()";
	}),
	"ceil": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue) return par1;
		else if(par1 instanceof FloatValue) return new IntValue(Math.ceil(par1.value), this.loc);
		else throw new RuntimeError(loc.first_line, "ceilは数値にしか使えません");
	}, "math", null),
	"floor": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue) return par1;
		else if(par1 instanceof FloatValue) return new IntValue(Math.floor(par1.value), this.loc);
		else throw new RuntimeError(loc.first_line, "floorは数値にしか使えません");
	}, "math", null),
	"round": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue) return par1;
		else if(par1 instanceof FloatValue) return new IntValue(Math.round(par1.value), this.loc);
		else throw new RuntimeError(loc.first_line, "roundは数値にしか使えません");
	}, null, null),
	"sin": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
			return new FloatValue(Math.sin(par1.value), this.loc);
		else throw new RuntimeError(loc.first_line, "sinは数値にしか使えません");
	}, "math", null),
	"cos": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
			return new FloatValue(Math.cos(par1.value), this.loc);
		else throw new RuntimeError(loc.first_line, "cosは数値にしか使えません");
	}, "math", null),
	"tan": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			let v = Math.tan(par1.value);
			if(isFinite(v)) return new FloatValue(v, this.loc);
			else throw new RuntimeError(loc.first_line, "オーバーフローしました");
		}
		else throw new RuntimeError(loc.first_line, "tanは数値にしか使えません");
	}, "math", null),
	"asin": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			if(par1.value > 1.0 || par1.value < -1.0)
				throw new RuntimeError(loc.first_line, "asinの定義域外の値が使われました");
			else
				return new FloatValue(Math.asin(par1.value), this.loc);
		}
		else throw new RuntimeError(loc.first_line, "asinは数値にしか使えません");
	}, "math", null),
	"acos": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			if(par1.value > 1.0 || par1.value < -1.0)
				throw new RuntimeError(loc.first_line, "acosの定義域外の値が使われました");
			else
				return new FloatValue(Math.acos(par1.value), this.loc);
		}
		else throw new RuntimeError(loc.first_line, "acosは数値にしか使えません");
	}, "math", null),
	"atan": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
			return new FloatValue(Math.atan(par1.value), this.loc);
		else throw new RuntimeError(loc.first_line, "atanは数値にしか使えません");
	}, "math", null),
	"atan2": new DefinedFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if((par1 instanceof IntValue || par1 instanceof FloatValue) && 
			(par2 instanceof IntValue || par2 instanceof FloatValue))
			return new FloatValue(Math.atan2(par1.value, par2.value), this.loc);
		else throw new RuntimeError(loc.first_line, "atan2は数値にしか使えません");
	}, "math", null),
	"sqrt": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			if(par1.value < 0) throw new RuntimeError(loc.first_line, "負の数のルートを求めようとしました");
			return new FloatValue(Math.sqrt(par1.value), this.loc);
		}
		else throw new RuntimeError(this.first_line, "sqrtは数値にしか使えません");
	}, "math", null),
	"log": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			if(par1.value <= 0) throw new RuntimeError(loc.first_line, "正でない数の対数を求めようとしました");
			let v = Math.log(par1.value);
			if(isFinite(v)) return new FloatValue(v, this.loc);
			throw new RuntimeError(this.first_line, "オーバーフローしました");
		}
		else throw new RuntimeError(loc.first_line, "logは数値にしか使えません");
	}, "math", null),
	"exp": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			let v = Math.exp(par1.value);
			if(isFinite(v)) return new FloatValue(v, this.loc);
			throw new RuntimeError(loc.first_line, "オーバーフローしました");
		}
		else throw new RuntimeError(loc.first_line, "expは数値にしか使えません");
	}, "math", null),
	"pow": new DefinedFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par1 instanceof IntValue && par2 instanceof IntValue && par2.value >= 0)
		{
			if(par1.value == 0 && par2.value <= 0) throw new RuntimeError(loc.first_line, "0は正の数乗しかできません");
			let v = Math.pow(par1.value, par2.value);
			if(isSafeInteger(v)) return new IntValue(v, this.loc);
			else throw new RuntimeError(loc.first_line, "整数で表せる範囲を越えました");
		}
		else if((par1 instanceof IntValue || par1 instanceof FloatValue) &&
			(par2 instanceof IntValue || par2 instanceof FloatValue))
		{
			if(par1.value < 0 && !Number.isInteger(par2.value)) throw new RuntimeError(loc.first_line, "負の数の非整数乗はできません");
			if(par1.value == 0 && par2.value <= 0) throw new RuntimeError(loc.first_line, "0は正の数乗しかできません");
			let v = Math.pow(par1.value, par2.value);
			if(isFinite(v)) return new FloatValue(v, this.loc);
			else throw new RuntimeError(loc.first_line, "オーバーフローしました");
		}
		else throw new RuntimeError(loc.first_line, "powerは数値にしか使えません");
	}, null, null),
	"length": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof StringValue) return new IntValue(par1.value.length, this.loc);
		else if(par1 instanceof ArrayValue) return new IntValue(par1.length, this.loc);
		else throw new RuntimeError(loc.first_line, "lengthは文字列と配列にしか使えません");
	}, null, function(argc){
		return "len(" + argc[0] + ")";
	}),
	"substring": new DefinedFunction([2,3], function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		var par3 = param.length == 3 ? param[2].getValue() : null;
		if(par1 instanceof StringValue &&
			par2 instanceof IntValue &&
			(par3 == null || par3 instanceof IntValue))
		{
			var v;
			if(par3 == null) v = par1.value.substr(par2.value);
			else v = par1.value.substr(par2.value, par3.value);
			return new StringValue(v, this.loc);
		}
		else throw new RuntimeError(loc.first_line, "substringの引数の型が違います");
	}, null, function(argc){
		var code = argc[0] + '[' + argc[1] + ':';
		if(argc[2]) code += argc[1] + '+' + argc[2];
		return code + ']';
	}),
	"append": new DefinedFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par2 instanceof StringValue && par2 instanceof StringValue)
		{
			return new StringValue(par1.value + par2.value, this.loc);
		}
		else throw new RuntimeError(loc.first_line, "appendの引数の型が違います");
	}, null, function(argc){
		return argc[0] + '+' + argc[1];
	}),
	"split": new DefinedFunction([1,2], function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param.length == 2 ? param[1].getValue() : null;
		if(par1 instanceof StringValue && (par2 instanceof StringValue || par2 == null))
		{
			var v1 = par1.value;
			var v = par2 ? v1.split(par2.value) : v1.split("");
			var vr = [];
			for(var i = 0; i < v.length; i++) vr.push(new StringValue(v[i], this.loc));
			return new ArrayValue(vr, this.loc);
		}
		else throw new RuntimeError(loc.first_line, "splitの引数の型が違います");
	}, null, function(argc){
		if(argc.length == 2) return argc[0] + '.split(' + argc[1] + ')';
		else return 'list(' + argc[0] + ')';
	}),
	"extract": new DefinedFunction(3, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		var par3 = param[2].getValue();
		if(par1 instanceof StringValue && par2 instanceof StringValue && par3 instanceof IntValue)
		{
			var v1 = par1.value;
			var v2 = par2.value;
			var v3 = par3.value;
			var v = v1.split(v2);
			if(v3 >= 0 && v3 < v.length) return new StringValue(v[v3], this.loc);
			else throw new RuntimeError(loc.first_line, "番号の値が不正です");
		}
		else throw new RuntimeError(loc.first_line, "extractの引数の型が違います");
	}, null, function(argc){
		return argc[0] + '.split(' + argc[1] + ')[' + argc[2] + ']';
	}),
	"insert": new DefinedFunction(3, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		var par3 = param[2].getValue();
		if(par1 instanceof StringValue && par2 instanceof IntValue && par3 instanceof StringValue)
		{
			var v1 = par1.value;
			var v2 = par2.value;
			var v3 = par3.value;
			if(v2 < 0 || v2 > v1.length) throw new RuntimeError(loc.first_line, "位置の値が不正です");
			var s1 = v1.substr(0, v2);
			var s2 = v1.substr(v2);
			return new StringValue(s1 + v3 + s2, this.loc);
		}
		else throw new RuntimeError(loc.first_line, "insertの引数の型が違います");
	}, null, function(argc){
		return argc[0] + '[:' + argc[1] + ']+' + argc[2] + '+' + argc[0] + '[' + argc[1] + ':]';  
	}),
	"replace": new DefinedFunction(4, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		var par3 = param[2].getValue();
		var par4 = param[3].getValue();
		if(par1 instanceof StringValue && par2 instanceof IntValue && par3 instanceof IntValue && par4 instanceof StringValue)
		{
			var v1 = par1.value;
			var v2 = par2.value;
			var v3 = par3.value;
			var v4 = par4.value;

			if(v2 < 0 || v2 > v1.length) throw new RuntimeError(loc.first_line, "位置の値が不正です");
			if(v3 < 0 || v2 + v3 > v1.length)throw new RuntimeError(loc.first_line, "長さの値が不正です");
			var s1 = v1.substr(0, v2);
			var s2 = v1.substr(v2 + v3);
			return new StringValue(s1 + v4 + s2, this.loc);
		}
		else throw new RuntimeError(loc.first_line, "replaceの引数の型が違います");
	}, null, function (argc){
		return argc[0] + '[:' + argc[1] + ']+' + argc[3] + '+' + argc[0] + '[' + argc[1] + '+' + argc[2] + ':]';  
	}),
	"isfile": new DefinedFunction(1, function(param, loc){
		var par = param[0].getValue();
		if(par instanceof StringValue) return new BooleanValue(storage.getItem(par.value) != null, loc);
		else throw new RuntimeError(loc.first_line, "ファイル名は文字列でなくてはいけません");
	}, null, null),
	"openr": new DefinedFunction(1, function(param, loc){
		var par = param[0].getValue();
		if(par instanceof StringValue) return new IntValue(filesystem.openr(par.value), loc);
		else throw new RuntimeError(loc.first_line, "ファイル名は文字列でなくてはいけません");
	}, null, function(argc){
		return "open(" + argc[0] + ",'r')";
	}),
	"openw": new DefinedFunction(1, function(param, loc){
		var par = param[0].getValue();
		if(par instanceof StringValue) return new IntValue(filesystem.openw(par.value), loc);
		else throw new RuntimeError(loc.first_line, "ファイル名は文字列でなくてはいけません");
	}, null, function(argc){
		return "open(" + argc[0] + ",'w')";
	}),
	"opena": new DefinedFunction(1, function(param, loc){
		var par = param[0].getValue();
		if(par instanceof StringValue) return new IntValue(filesystem.opena(par.value), loc);
		else throw new RuntimeError(loc.first_line, "ファイル名は文字列でなくてはいけません");
	}, null, function(argc){
		return "open(" + argc[0] + ",'a')";
	}),
	"getline": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue)
		{
			var rtnv = filesystem.read_line(par1.value);
			if(rtnv == null) throw new RuntimeError(loc.first_line, "ファイル番号が不正です");
			return new StringValue(rtnv, loc);
		}
		else throw new RuntimeError(loc.first_line, "ファイル番号が必要です");
	}, null, function(argc){
		return argc[0] + ".readline()";
	}),
	"getchar": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue)
		{
			var rtnv = filesystem.read_ch(par1.value);
			if(rtnv == null) throw new RuntimeError(loc.first_line, "ファイル番号が不正です");
			return new StringValue(rtnv, loc);
		}
		else throw new RuntimeError(loc.first_line, "ファイル番号が必要です");
	}, null, function(argc){
		return argc[0] + ".read(1)";
	}),
	"pop": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof ArrayValue)
		{
			if(par1.value.length > 0)
				return par1.value.pop();
			else throw new RuntimeError(loc.first_line, "空の配列にpopを適用しようとしました");
		}
		else throw new RuntimeError(loc.first_line, "popは配列にしか使えません");
	}, null, function(argc){
		return argc[0] + '.pop()';
	}),
	"shift": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof ArrayValue)
		{
			if(par1.value.length > 0)
				return par1.value.shift();
			else throw new RuntimeError(loc.first_line, "空の配列にshiftを適用しようとしました");
		}
		else throw new RuntimeError(loc.first_line, "shiftは配列にしか使えません");
	}, null, function(argc){
		return argc[0] + '.pop(0)';
	}),
};

function setCaller(statementlist, caller)
{
	for(let i = 0; i < statementlist.length; i++)
	{
		if(statementlist[i].statementlist) setCaller(statementlist[i].statementlist, caller);
		if(statementlist[i].state) setCaller(statementlist[i].state, caller);
		if(statementlist[i].blocks)
		{
			for(var j = 0; j < statementlist[i].blocks.length; j++)
				setCaller(statementlist[i].blocks[j][1], caller);
		}
		if(statementlist[i] instanceof ReturnStatement) statementlist[i].setCaller(caller, true);
	}
}

function cloneStatementlist(statementlist)
{
	var rtnv = [];
	for(let i = 0; i < statementlist.length; i++) if(statementlist[i]) rtnv.push(statementlist[i].clone());
	return rtnv;
}

/**
 * 関数呼び出し
 */
class CallFunction extends Value
{
	/**
	 * @constructor
	 * @param {string} funcname 
	 * @param {Array<Value>} parameter 
	 * @param {Location} loc 
	 */
	constructor(funcname, parameter, loc)
	{
		super([funcname, parameter], loc);
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		var parm = [];
		for(var i = 0; i < this.value[1].length; i++) parm.push(this.value[1][i]);
		var rtnv = new CallFunction(this.value[0], parm, this.loc);
		rtnv.rtnv = this.rtnv;
		return rtnv;
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value[1], index: 0});
			this.state = 1;
		}
		else if(this.state == 1)
		{
			code[0].stack[0].index++;
			const func = this.value[0], param = this.value[1];
			if(definedFunction[func])
			{
				let fn = definedFunction[func].clone();
				fn.setCaller(this);
				fn.setParameter(param);
				fn.setLocation(this.loc);
				let statementlist = [fn];
				code.unshift(new parsedFunction(statementlist));
			}
			else if(myFuncs[func])
			{
				let fn = myFuncs[func];
				let vt = new varTable();
				let globalVarTable = varTables[varTables.length - 1];
				for(let i of Object.keys(globalVarTable.vars)) vt.vars[i] = globalVarTable.vars[i].getValue();
				for(let i = 0; i < fn.params.length; i++) vt.vars[fn.params[i].varname] = param[i].getValue();
				let statementlist = cloneStatementlist(fn.statementlist);
				setCaller(statementlist, this);
				statementlist.push(new notReturnedFunction(fn.loc));
				let pf = new parsedFunction(statementlist);
				code.unshift(pf);
				varTables.unshift(vt);
			}
			else
				throw new RuntimeError(this.first_line, '関数 '+func+' は定義されていません');
			this.state = 0;
		}
	}
	setValue(v)
	{
		this.rtnv = v.clone();
	}
	getValue()
	{
		return this.rtnv;
	}
	getCode()
	{
		let func = this.value[0], param = this.value[1];
		let ag = [];
		for(let i = 0; i < param.length; i++)
			ag.push(param[i].getCode());
		return func + '(' + ag.join(',') + ')';
	}
	makePython()
	{
		let func = this.value[0], param = this.value[1];
		let deffunc = null;
		if(definedFunction[func]) deffunc = definedFunction[func];
		else if(myFuncs[func]) deffunc = myFuncs[func];
		let ag = [];
		for(let i = 0; i < param.length; i++)
			ag.push(param[i].makePython());
		if(deffunc)
		{
			var prefix = '';
			if(deffunc.module)
			{
				prefix= deffunc.module + ".";
				python_lib[deffunc.module] = 1;
			}
			if(deffunc.convert) return deffunc.convert(ag);
			else return prefix + func + '(' + ag.join(', ') + ')';
		}
		else 
			return func + '(' + ag.join(', ') + ')';
	}
}

class Connect extends Value
{
	constructor(x,y,loc)
	{
		super([x,y],loc);
		this.state = 0;
	}
	clone()
	{
		var rtnv = new Connect(this.value[0].clone(), this.value[1].clone(), this.loc);
		rtnv.rtnv = this.rtnv;
		return rtnv;
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = array2text(this.value[0].getValue());
			let v2 = array2text(this.value[1].getValue());
			let v = v1 + v2;
			this.rtnv = new StringValue(v, this.loc);
			this.state = 0;
		}
	}
	getCode()
	{
		return this.value[0].getCode() + "と" + this.value[1].getCode();
	}
	makePython()
	{
		var re=/^str\(/;
		var p1 = this.value[0].makePython();
		var p2 = this.value[1].makePython();
		if(!re.exec(p1) && !(this.value[0] instanceof StringValue)) p1 = "str(" + p1 + ")";
		if(!re.exec(p2) && !(this.value[1] instanceof StringValue)) p2 = "str(" + p2 + ")";
		return  p1 + " + " + p2;
	}
	getValue()
	{
		return this.rtnv;
	}
}

class SliceValue extends Value
{
	constructor(x,y,loc)
	{
		super([x,y],loc);
		this.state = 0;
	}
	clone()
	{
		var rtnv = new SliceValue(this.value[0].clone(), this.value[1].clone(), this.loc);
		rtnv.rtnv = this.rtnv;
		return rtnv;
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			this.state = 0;
		}
	}
	getCode()
	{
		return this.value[0].getCode() + ":" + this.value[1].getCode();
	}
	makePython()
	{
		var p1 = this.value[0].makePython();
		var p2 = this.value[1].makePython();
		return  p1 + ":" + p2;
	}
	getValue()
	{
		return this;
	}
	getValue1()
	{
		return this.value[0];
	}
	getValue2()
	{
		return this.value[1];
	}
}

/**
 * 定義済み手続きクラス
 */
class DefinedStep
{
	/**
	 * @constructor
	 * @param {number} argc 引数の個数
	 * @param {function} step 実際の関数
	 * @param {string} module Pythonで必要となるモジュール。nullならナニもいらない
	 * @param {function} convert this.argcを受け取ってPythonコードの文字列を返す関数。nullならthis.funcName(this.argc)的なことをする。
	 */
	constructor(argc, step, module, convert) { 
		this.argc = argc; this.step = step; this.module = module; this.convert = convert;
		this.loc = null;
	}
	/**
	 * 関数の値を返す
	 * @param {Array<Value>} parameters 
	 * @param {Location} loc 
	 * @returns {any}
	 */
	run()
	{
		if((this.argc instanceof Array && this.argc[0] <= this.parameters.length && this.argc[1] >= this.parameters.length)
			|| this.parameters.length == this.argc)
			{
				code[0].stack[0].index++;
				this.step(this.parameters, this.loc);
				code.shift();
			}
		else throw new RuntimeError(this.loc.first_line, "引数の個数が違います");
	}
	clone()
	{
		return new DefinedStep(this.argc, this.step, this.module, this.convert);
	}
	setParameter(params)
	{
		this.parameters = params;
	}
	setLocation(loc)
	{
		this.loc = loc;
	}
}

/**
 * 定義済み関数一覧
 */
var definedStep = {
	"putline": new DefinedStep(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par1 instanceof IntValue && par2 instanceof StringValue)
		{
			var str = array2text(par2);
			var rtnv = filesystem.write_str(par1.value, str, true);
			if(!rtnv) throw new RuntimeError(this.first_line, "呼び出しが不正です");
		}
		else throw new RuntimeError(this.first_line, "呼び出しが不正です");
	}, null, function(argc){
		var str = argc[1].makePython();
		if(!(argc[1] instanceof StringValue))
			str = 'str(' + str + ')';
		return argc[0].makePython() + '.write(' + str + " + '\n')";
	}),
	"putstr": new DefinedStep(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par1 instanceof IntValue && par2 instanceof StringValue)
		{
			var str = array2text(par2);
			var rtnv = filesystem.write_str(par1.value, str, true);
			if(!rtnv) throw new RuntimeError(this.first_line, "呼び出しが不正です");
		}
		else throw new RuntimeError(this.first_line, "呼び出しが不正です");
	}, null, function(argc){
		var str = argc[1].makePython();
		if(!(argc[1] instanceof StringValue))
			str = 'str(' + str + ')';
		return argc[0].makePython() + '.write(' + str + " + '\n')";
	}),
	"close": new DefinedStep(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue)
		{
			var rtnv = filesystem.close(par1.value, true);
			if(!rtnv) throw new RuntimeError(this.first_line, "呼び出しが不正です");
		}
		else throw new RuntimeError(this.first_line, "呼び出しが不正です");
	}, null, function(argc){
		return argc[0].makePython() + '.close()\n';
	}),
	"push": new DefinedStep(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par1 instanceof ArrayValue && par2 instanceof Value)
		{
			par1.value.push(par2);
		}
		else throw new RuntimeError(loc.first_line, 'pushは配列にしか使えません');
	}, null, function(argc){
		return argc[0].makePython() + '.append(' + argc[1].makePython() + ')\n';
	}),
	"unshift": new DefinedStep(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par1 instanceof ArrayValue && par2 instanceof Value)
		{
			par1.value.unshift(par2);
		}
		else throw new RuntimeError(loc.first_line, 'pushは配列にしか使えません');
	}, null, function(argc){
		return argc[0].makePython() + '.insert(0, ' + argc[1].makePython() + ')\n';
	}),
};

/**
 * 命令クラス
 */
class Statement
{
	/**
	 * @constructor
	 * @param {Location} loc 
	 */
	constructor(loc)
	{
		this._loc = loc;
		this.state = 0;
	}
	get first_line() {return this._loc.first_line;}
	get last_line() {return this._loc.last_line;}
	get loc(){return this._loc;}
	run(){throw new RuntimeError(this.first_line, "これを呼んではいけない");}
	/**
	 * 
	 * @param {number} indent 
	 */
	makePython(indent)
	{
		return Parts.makeIndent(indent);
	}
	clone()
	{
		throw new RuntimeError(this.first_line, constructor_name(this) + "はcloneが作られていません");
	}
}

/**
 * 手続き定義クラス
 */
class DefineStep extends Statement {
	/**
	 * @constructor
	 * @param {string} funcName 
	 * @param {Array<Value>} params 
	 * @param {Array<Statement>} statementlist 
	 * @param {Location} loc 
	 */
	constructor(funcName, params, statementlist, loc) {
		super(loc);
		if (definedFunction[funcName]) throw new RuntimeError(this.first_line, '手続き '+funcName+' と同名の標準関数が存在します');
		if (definedStep[funcName]) throw new RuntimeError(this.first_line, '手続き '+funcName+' と同名の標準手続きが存在します');
		if (myFuncs[funcName]) throw new RuntimeError(this.first_line, '手続き '+funcName+' と同名の関数、または手続きが既に定義されています');
		this.params = params;
		this.statementlist = statementlist;
		this.funcName = funcName;
		myFuncs[funcName] = this;
	}
	run()
	{
		code[0].stack[0].index++;
	}
	makePython(indent)
	{
		var code = "def " + this.funcName + '(';
		for(var i = 0; i < this.params.length; i++)
		{
			if(i > 0) code += ', ';
			code += this.params[i].varname;
		}
		code += '):\n';
		var codes = 0;
		for(var i = 0; i < this.statementlist.length; i++)
			if(this.statementlist[i])
			{
				codes = 1;
				code += this.statementlist[i].makePython(1);
			}
		if(codes == 0) code += Parts.makeIndent(1) + "pass\n";
		return code;
	}
}

/**
 * 手続き呼び出しが終わった後の処理
 */
class afterCallStep
{
	run()
	{
		varTables.shift();
		code.shift();
	}
}

/**
 * 手続き呼び出し
 */
class CallStep extends Statement {
	constructor(funcName, args, loc) {
		super(loc);
		this.funcName = funcName;
		this.args = args;
	}
	clone()
	{
		return new CallStep(this.funcName, this.args.clone(), this.loc);
	}  
	run() {
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			const fn = this.funcName
			const args = this.args;
			if(definedStep[fn])
			{
				let step = definedStep[fn].clone();
				step.setParameter(args);
				step.setLocation(this.loc);
				let statementlist = [step];
				code.unshift(new parsedStep(statementlist));
			}
			else if(myFuncs[fn])
			{
				let vt = new varTable();
				let globalVarTable = varTables[varTables.length - 1];
				for(let i of Object.keys(globalVarTable.vars))
					vt.vars[i] = globalVarTable.vars[i].getValue();
				for(let i = 0; i < myFuncs[fn].params.length; i++)
					vt.vars[myFuncs[fn].params[i].varname] = args[i].getValue();
				let statementlist = myFuncs[fn].statementlist.concat();
				// TODO 呼ばれる保証がない
				statementlist.push(new afterCallStep());
				code.unshift(new parsedStep(statementlist));
				varTables.unshift(vt);
			}
			else
				throw new RuntimeError(this.first_line, '手続き '+fn+' は定義されていません');
			this.state = 0;
		}
	}
	makePython(indent)
	{
		var code = Parts.makeIndent(indent);
		code += this.funcName + '(';
		for(var i = 0; i < this.args.length; i++)
		{
			if(i > 0) code += ', ';
			code += this.args[i].makePython(0);
		}
		return code + ')\n';
	}  
}

class ExitStatement extends Statement {
	constructor(loc) {
		super(loc);
	}
	clone()
	{
		return new ExitStatement(this.loc);
	}
	run() {
		if(code[0] instanceof parsedStep)
		{
			code.shift();
			varTables.shift();
		}
		else throw new RuntimeError(this.first_line, "手続きの中ではありません");
	}
	makePython(indent)
	{
		var code = Parts.makeIndent(indent);
		code += "break\n";
		return code;
	}
}

class DefineFunction extends Statement {
	constructor(funcName, params, statementlist, loc) {
		super(loc);
		if (definedFunction[funcName]) throw new RuntimeError(this.first_line, '関数 '+funcName+' と同名の標準関数が存在します');
		if (myFuncs[funcName]) throw new RuntimeError(this.first_line, '関数 '+funcName+' と同名の関数、または手続きが既に定義されています');
		this.params = params;
		this.funcName = funcName;
		myFuncs[funcName] = this;
		this.statementlist = statementlist;
	}
	clone()
	{
		throw new RuntimeError(this.first_line, 'これはクローンされるべきでない');
	}
	run() {
		code[0].stack[0].index++;
	}
	makePython(indent)
	{
		var code = "def ";
		code += this.funcName + '(';
		for(var i = 0; i < this.params.length; i++)
		{
			if(i > 0) code += ', ';
			code += this.params[i].makePython();
		}
		code += '):\n';
		var codes = 0;
		for(var i = 0; i < this.statementlist.length; i++)
			if(this.statementlist[i])
			{
				codes = 1;
				code += this.statementlist[i].makePython(1);
			}
		if(codes == 0) code += Parts.makeIndent(1) + "pass\n";
		return code;
	}
}

/**
 * 関数から値を返す
 */
class ReturnStatement extends Statement {
	constructor(value, loc) {
		super(loc);
		this.value = value.clone();
		this.caller = null;
		this.flag = false;
		this.state = 0;
	}
	clone()
	{
		let rtnv = new ReturnStatement(this.value.clone(), this.loc);
		rtnv.caller  = this.caller;
		rtnv.flag  = this.flag;
		return rtnv;
	}
	setCaller(caller, flag)
	{
		this.caller = caller;
		this.flag = flag;
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: [this.value], index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			if(code[0] instanceof parsedFunction)
			{
				this.caller.setValue(this.value.getValue());
				code.shift();
				if(this.flag) varTables.shift();
			}
			else throw new RuntimeError(this.first_line, "関数の中ではありません");
			this.state = 0;
		}
	}
	makePython(indent)
	{
		var code = Parts.makeIndent(indent);
		code += "return";
		if(this.value) code += ' ' + this.value.makePython();
		return code + "\n";
	}
}

class notReturnedFunction extends Statement {
	constructor(loc){super(loc);}
	clone()
	{
		return new notReturnedFunction(this.loc);
	}
	run()
	{
		throw new RuntimeError(this.last_line, "関数が値を返さずに終了しました");
	}
	makePython()
	{
		return '';
	}
}

/**
 * 
 */
function dump(message = null)
{
	if(!message) message = "*** 変数確認 ***";
	textareaAppend(message + "\n");
	var vars = varTables[0].varnames([]);
	if(varTables.length > 1) vars = varTables[varTables.length - 1].varnames(vars);
	for(var i = 0; i < vars.length; i++)
	{
		if(vars[i][0] == '!') continue;
		let vartable = findVarTable(vars[i]);
		let v = vartable.vars[vars[i]];
		textareaAppend(vars[i] + ":" + array2code(v) + "\n");
	}
}

class DumpStatement extends Statement
{
	constructor(loc){super(loc);}
	clone()
	{
		return new DumpStatement(this.loc);
	}
	run()
	{
		dump();
		code[0].stack[0].index++;
	}
	makePython()
	{
		return '';
	}
}

/**
 * ArrayValueを文字列表現にする
 * @param {ArrayValue} args 
 * @returns {string}
 */
function argsString(args)
{
	if(args instanceof ArrayValue)
	{
		let a = [];
		for(let i = 0; i < args.value.length; i++) a.push(args.value[i].getValue().value);
		return '[' + a.join(',') + ']';
	}
	return '';
}

class Assign extends Statement
{
	/**
	 * @constructor
	 * @param {Variable} variable 
	 * @param {Value} value 
	 * @param {String} operator
	 * @param {Location} loc
	 */
	constructor(variable,value, operator, loc)
	{
		super(loc);
		if(!(variable instanceof Variable || variable instanceof UNDEFINED)) throw new RuntimeError(loc.first_line, "変数でないものに代入はできません");
		this.variable = variable;
		this.value = value;
		this.operator = operator;
		this.state = 0;
	}
	clone()
	{
		return new Assign(this.variable, this.value,this.operator, this.loc);
	}
	run()
	{
		if(this.variable instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");
		if(this.state == 0)
		{
			let a=[];
			if(this.operator) a.push(this.variable);
			else if(this.variable.args) a = a.concat(this.variable.args.value);
			a.push(this.value);
			code[0].stack.unshift({statementlist: a, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let vn = this.variable.varname;
			let ag = this.variable.args;
			let vl = this.value.getValue();
			let vt = findVarTable(vn);
			if(vt) // 変数が定義されている
			{
				let va = vt.vars[vn];
				if(this.operator)
				{
					va = getValueByArgs(va, ag ? ag.value : null, this.loc);
					let v1 = va.getValue(), v2 = vl, v3 = null;
					switch(this.operator)
					{
					case '+':
						if(v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
						if(v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の足し算はまだサポートしていません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書の足し算はまだサポートしていません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) v3 = new StringValue(String(v1.value) + String(v2.value), this.loc);
						else if(v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(v1.value + v2.value, this.loc);
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) v3 = new FloatValue(v1.value + v2.value, this.loc);
						break;
					case '-':
						if(v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
						if(v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の引き算はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書の引き算はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の引き算はできません");
						else if(v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(v1.value - v2.value, this.loc);
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) v3 = new FloatValue(v1.value - v2.value, this.loc);
						break;
					case '*':
						if(v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
						if(v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の掛け算は出来ません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書の掛け算はできません");
						else if(v1 instanceof StringValue)
						{
							if(v2 instanceof IntValue) v3 = new StringValue(v1.value.repeat(v2.value >= 0 ? v2.value : 0), this.loc);
							else throw new RuntimeError(this.first_line, "文字列に掛けられるのは整数だけです")
						}
						else if(v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(v1.value * v2.value, this.loc);
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) v3 = new FloatValue(v1.value * v2.value, this.loc);
						break;
					case '/':
						if(v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
						if(v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の割り算はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書の割り算はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の割り算はできません");
						else
						{
							if(v2.value == 0) throw new RuntimeError(this.first_line, '0で割り算をしました');
							else v3 = new FloatValue(v1.value / v2.value, this.loc);
						}
						break;
					case '//':
						if(v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
						if(v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の割り算はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書の割り算はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の割り算はできません");
						else
						{
							if(v2.value == 0) throw new RuntimeError(this.first_line, '0で割り算をしました');
							let v4 = Math.floor(v1.value / v2.value);
							if(v1 instanceof IntValue && v2 instanceof IntValue ) v3 = new IntValue(v4, this.loc);
							else v3 = new FloatValue(v4, this.loc);
						}
						break;
					case '%':
						if(v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
						if(v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の割り算はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書の割り算はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の割り算はできません");
						else
						{
							if(v2.value == 0) throw new RuntimeError(this.first_line, '0で割り算をしました');
							let v4 = v1.value - Math.floor(v1.value / v2.value) * v2.value;
							if(v1 instanceof IntValue && v2 instanceof IntValue ) v3 = new IntValue(v4, this.loc);
							else v3 = new FloatValue(v4, this.loc);
						}
						break;
					case '&':
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビット積はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書のビット積はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビット積はできません");
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビット積はできません");
						else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) v3 = new BooleanValue(v1.value && v2.value, this.loc);
						else
						{
							if(v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
							if(v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
							v3 = new IntValue(v1.value & v2.value, this.loc);
						} 
						break;
					case '|':
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビット和はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書のビット和はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビット和はできません");
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビット和はできません");
						else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) v3 = new BooleanValue(v1.value && v2.value, this.loc);
						else
						{
							if(v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
							if(v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
							v3 = new IntValue(v1.value | v2.value, this.loc);
						} 
						break;
					case '^':
						if(v1 instanceof ArrayValue && v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の排他的論理和はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書の排他的論理和はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の排他的論理和はできません");
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数の排他的論理和はできません");
						else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) v3 = new BooleanValue(v1.value && v2.value, this.loc);
						else
						{
							if(v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
							if(v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
							v3 = new IntValue(v1.value ^ v2.value, this.loc);
						} 
						break;
					case '<<':
						if(v1 instanceof ArrayValue && v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビットシフトはできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書のビットシフトはできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビットシフトはできません");
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビットシフトはできません");
						else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) v3 = new BooleanValue(v1.value && v2.value, this.loc);
						else
						{
							if(v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
							if(v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
							v3 = new IntValue(v1.value << v2.value, this.loc);
						} 
						break;
					case '>>':
						if(v1 instanceof ArrayValue && v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビットシフトはできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書のビットシフトはできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビットシフトはできません");
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビットシフトはできません");
						else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) v3 = new BooleanValue(v1.value && v2.value, this.loc);
						else
						{
							if(v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
							if(v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
							v3 = new IntValue(v1.value >> v2.value, this.loc);
						} 
						break;
					}
					if(!v3) throw new RuntimeError(this.first_line, '複合代入演算子の使い方が間違っています');
					setVariableByArgs(vt,vn, ag ? ag.value : null, v3, this.loc);
				}
				else setVariableByArgs(vt, vn, ag ? ag.value : null, vl, this.loc);
			}
			else // 変数が定義されていない
			{
				if(this.operator) throw new RuntimeError(this.first_line, '宣言されていない変数に複合代入演算子が使われました');
				vt = varTables[0];
				vt.vars[vn] = new NullValue(this.loc);
				setVariableByArgs(vt, vn, ag ? ag.value : null, vl, this.loc);
			}
			this.state = 0;
		}
	}
	makePython(indent)
	{
		var code = Parts.makeIndent(indent);
		code += this.variable.makePython() + " ";
		if(this.operator) code += this.operator;
		code += "= " + this.value.makePython() + "\n";
		return code;
	}
}

class Append extends Statement
{
	/**
	 * @constructor
	 * @param {Variable} variable 
	 * @param {Value} value 
	 * @param {Location} loc 
	 */
	constructor(variable,value,loc)
	{
		super(loc);
		if(!(variable instanceof Variable || variable instanceof UNDEFINED))throw new RuntimeError(loc.first_line, "追加されるものは変数でなくてはいけません");
		this.variable = variable;
		this.value = value;
		this.state = 0;
	}
	clone()
	{
		return new Append(this.variable.clone(), this.value.clone(), this.loc);
	}
	run()
	{
		if(this.variable instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: [this.variable, this.value], index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let vn = this.variable.varname;
			let ag = this.variable.args;
			let vl = this.value.getValue();
			let vt = findVarTable(vn);
			if(vt) // 変数が定義されている
			{
				let va = vt.vars[vn];
				if(ag && ag.value.length > 0) // 配列の添字がある
				{
					for(let i = 0; i < ag.value.length; i++) 
					{
						if(ag.value[i].getValue() instanceof StringValue)
						{
							va = va.value[ag.value[i].getValue().value];
						}
						else if(ag.value[i].getValue() instanceof IntValue)
						{
							if(va.value[ag.value[i].getValue().value])
								va = va.value[ag.value[i].getValue().value];
							else throw new RuntimeError(this.first_line, '配列の範囲を超えたところに追加しようとしました')
						}
						else throw new RuntimeError(this.first_line, '添字に使えないデータ型です');
					}
				}
				if(va instanceof ArrayValue) va.value.push(vl.clone());
				else throw new RuntimeError(this.first_line, '配列でない変数に追加はできません');
			}
			else // 変数が定義されていない
				throw new RuntimeError(this.first_line, '存在しない配列に追加はできません');
			this.state = 0;
		}
	}
	makePython(indent)
	{
		var code = Parts.makeIndent(indent);
		code += this.variable.makePython() + ".append(" + this.value.makePython() + ")\n";
		return code;
	}
}

class Extend extends Statement
{
	/**
	 * @constructor
	 * @param {Variable} variable 
	 * @param {Value} value 
	 * @param {Location} loc 
	 */
	constructor(variable,value,loc)
	{
		super(loc);
		if(!(variable instanceof Variable || variable instanceof UNDEFINED))throw new RuntimeError(loc.first_line, "連結されるものは変数でなくてはいけません");
		this.variable = variable;
		this.value = value;
		this.state = 0;
	}
	clone()
	{
		return new Extend(this.variable.clone(), this.value.clone(), this.loc);
	}
	run()
	{
		if(this.variable instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: [this.variable, this.value], index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let vn = this.variable.varname;
			let ag = this.variable.args;
			let vl = this.value.getValue();
			let vt = findVarTable(vn);
			if(vt) // 変数が定義されている
			{
				let va = vt.vars[vn];
				if(ag && ag.value.length > 0) // 配列の添字がある
				{
					for(let i = 0; i < ag.value.length; i++) 
					{
						ag.value[i].run();
						if(ag.value[i] instanceof StringValue)
						{
							va = va.value[ag.value[i].getValue().value];					}
						else if(ag.value[i] instanceof IntValue)
						{
							if(va.value[ag.value[i].getValue().value])
								va = va.value[ag.value[i].getValue().value];
							else throw new RuntimeError(this.first_line, '配列の範囲を超えたところに連結しようとしました')
						}
						else throw new RuntimeError(this.first_line, "添字に使えないデータ型です");
					}
				}
				if(va instanceof ArrayValue)
				{
					if(vl instanceof ArrayValue)
					{
						var l = vl.value.length;
						for(var i = 0; i < l; i++) va.value.push(vl.value[i].clone());
					}
					else throw new RuntimeError(this.first_line, '配列でない値を連結することはできません');
				} 
				else throw new RuntimeError(this.first_line, '配列でない変数に連結はできません');
			}
			else // 変数が定義されていない
				throw new RuntimeError(this.first_line, '存在しない配列に連結はできません');
			this.state = 0;
		}
	}
	makePython(indent)
	{
		var code = Parts.makeIndent(indent);
		code += this.variable.makePython() + ".extend(" + this.value.makePython() + ")\n";
		return code;
	}
}

class Input extends Statement
{
	constructor(x, type,loc)
	{
		super(loc);
		if(!(x instanceof Variable || x instanceof UNDEFINED))throw new RuntimeError(loc.first_line, "入力されるものは変数でなくてはいけません");
		this.varname = x;
		this.type = type;
		this.state = 0;
	}
	clone()
	{
		return new Input(this.varname.clone(), this.type, this.loc);
	}
	run()
	{
		if(selected_quiz < 0)	// 通常時
		{
			code[0].stack[0].index++;
			if(this.varname instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");
			var list = [new InputBegin(this.loc), new InputEnd(this.varname, this.type, this.loc)];
			code[0].stack.unshift({statementlist: list, index: 0});
		}
		else	// 自動採点時
		{
			if(this.state == 0)
			{
				if(this.varname.args) code[0].stack.unshift({statementlist: this.varname.args, index: 0});
				this.state = 1;
			}
			else
			{
				code[0].stack[0].index++;
				if(selected_quiz_input < Quizzes[selected_quiz].inputs(selected_quiz_case).length)
				{
					if(this.varname instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");
					let va = new Variable(this.varname.varname, this.varname.args, this.loc);
					let vl = Quizzes[selected_quiz].inputs(selected_quiz_case)[selected_quiz_input++];
					// va.run();
					let assign = null;
					let re = /^(0+|false|偽|)$/i;
					if(this.type == typeOfValue.typeInt)assign = new Assign(this.varname, new IntValue(Number(toHalf(vl, this.loc)), this.loc),null, this.loc);
					else if(this.type == typeOfValue.typeFloat)assign = new Assign(this.varname, new FloatValue(Number(toHalf(vl, this.loc)), this.loc), null, this.loc);
					else if(this.type == typeOfValue.typeString) assign = new Assign(this.varname, new StringValue(vl + '', this.loc), null, this.loc);
					else if(this.type == typeOfValue.typeBoolean) assign = new Assign(this.varname, new BooleanValue(!re.exec(vl), this.loc), null, this.loc);
					code[0].stack.unshift({statementlist: [assign], index: 0});
				}
				else throw new RuntimeError(this.first_line, '必要以上の入力を求めています。');
				this.state = 0;
			}
		}
	}
	makePython(indent)
	{
		var code = Parts.makeIndent(indent);
		code += this.varname.makePython() + " = ";
		switch(this.type)
		{
			case typeOfValue.typeInt: code += "int(input())\n"; break;
			case typeOfValue.typeFloat: code += "float(input())\n"; break;
			case typeOfValue.typeString: code += "input()\n"; break;
			case typeOfValue.typeBoolean: code += "bool(input())\n"; break;
		} 
		return code;
	}
}

function openInputWindow()
{
	setRunflag(false);
	setEditableflag(false);
	var input_area = document.getElementById("input_area");
	input_area.value = '';
	input_area.readOnly = false;
	input_area.focus();
	document.getElementById("input_status").style.visibility = 'visible';
	document.getElementById("sourceTextarea").readOnly = true;
	editor.options.readOnly = true;
	editor.getWrapperElement().classList.add("readonly");
}

function closeInputWindow()
{
	var val = document.getElementById("input_area").value;
	document.getElementById("input_area").readOnly = true;
	document.getElementById("input_status").style.visibility = 'hidden';
	return val;
}

function keydownInput(e)
{
	var evt = e || window.event
	if(evt.keyCode == 13)
	{
		setRunflag(true);
		step();
	}
	else if(evt.keyCode == 27)
	{
		closeInputWindow();
		code.shift();
	}
}

class InputBegin extends Statement
{
	/**
	 * @constructor
	 * @param {Location} loc 
	 */
	constructor(loc)
	{
		super(loc);
	}
	clone()
	{
		return new InputBegin(this.loc);
	}
	run()
	{
		openInputWindow();
		code[0].stack[0].index++;
	}
}

class InputEnd extends Statement
{
	/**
	 * @constructor
	 * @param {Variable} x
	 * @param {typeOfValue} type 
	 * @param {Location} loc 
	 */
	constructor(x, type, loc)
	{
		super(loc);
		this.varname = x;
		this.type = type;
		this.state = 0;
	}
	clone()
	{
		return new InputEnd(this.varname.clone(), this.type, this.loc);
	}
	run()
	{
		if(this.varname instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");
		if(this.state == 0)
		{
			if(this.varname.args) code[0].stack.unshift({statementlist:this.varname.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			try{
				let vl = closeInputWindow();
				// va.run();
				let assign = null;
				let re = /^(0+|false|偽|)$/i;
				if(this.type == typeOfValue.typeInt)assign = new Assign(this.varname, new IntValue(Number(toHalf(vl, this.loc)), this.loc), null, this.loc);
				else if(this.type == typeOfValue.typeFloat)assign = new Assign(this.varname, new FloatValue(Number(toHalf(vl, this.loc)), this.loc), null, this.loc);
				else if(this.type == typeOfValue.typeString) assign = new Assign(this.varname, new StringValue(vl + '', this.loc), null, this.loc);
				else if(this.type == typeOfValue.typeBoolean) assign = new Assign(this.varname, new BooleanValue(!re.exec(vl), this.loc), null, this.loc);
				code[0].stack.unshift({statementlist: [assign], index: 0});
			}
			catch(e)
			{
				closeInputWindow();
				throw e;
			}
			this.state = 0;
		}
	}
}

class Newline extends Statement
{
	constructor(loc){super(loc);}
	clone()
	{
		return new Newline(this.loc);
	}
	run()
	{
		code[0].stack[0].index++;
		if(selected_quiz < 0)
		{
			textareaAppend("\n");
		}
		else
		{
			output_str += "\n";
		}
	}
	makePython(indent)
	{
		return Parts.makeIndent(indent) + "print()\n";
	}
}

class Output extends Statement
{
	/**
	 * 
	 * @param {Array<Value>} x 
	 * @param {boolean} ln 
	 * @param {Location} loc 
	 */
	constructor(x, ln, loc)
	{
		super(loc);
		this.value = x;
		this.ln = ln;
		this.state = 0;
	}
	clone()
	{
		var val = [];
		for(var i = 0; i < this.value.length; i++) val.push(this.value[i].clone());
		return new Output(val, this.ln, this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let s = '';
			for(var i = 0; i < this.value.length; i++)
			{
				let v = this.value[i];
				s += (i > 0 ? ' ' : '') + array2text(v);
			}
			if(this.ln)	s += '\n';
			if(selected_quiz < 0) textareaAppend(s);
			else output_str += s;
			this.state = 0;
		}
	}
	makePython(indent)
	{
		var code = Parts.makeIndent(indent);
		code += "print(";
		for(var i = 0; i < this.value.length; i++)
			code += (i > 0 ? ', ' : '') + this.value[i].makePython();
		if(!this.ln) code += ",end=''";
		return code + ")\n";
	}
}

function array2text(v)
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
				v1.push(array2text(v0.value[i]));
			}
			return '[' + v1.join(',') + ']';
		}
		else if(v0 instanceof DictionaryValue)
		{
			let v1 = [];
			let keys = Object.keys(v0.value);
			keys.sort();
			for(let i = 0; i < keys.length; i++) 
			{
				v1.push(keys[i] + ':' + array2text(v0.value[keys[i]]));
			}
			return '{' + v1.join(',') + '}';
		}
		else if(v0 instanceof BooleanValue) return v0.value ? 'True' : 'False';
		else if(v0 instanceof FloatValue && isInteger(v0.value) && !v0.value.toString().match(/[Ee]/)) return v0.value + '.0';
		else return new String(v0.value);
	}
	else return new String(v);
}

function array2code(v)
{
	if(!v) return '';
	let v0 = v;
	if(v0 instanceof ArrayValue)
	{
		let v1 = [];
		for(let i = 0; i < v0.value.length; i++) v1.push(array2text(v0.value[i]));
		return '[' + v1.join(',') + ']';
	}
	else if(v0 instanceof DictionaryValue)
	{
		let v1 = [];
		let keys = Object.keys(v0.value);
		keys.sort();
		for(let i = 0; i < keys.length; i++) v1.push(keys[i] + ':' + array2text(v0.value[keys[i]]));
		return '{' + v1.join(',') + '}';
	}
	else if(v0 instanceof StringValue) return '"' + v0.value + '"';
	else if(v0 instanceof FloatValue && isInteger(v0.value) && !v0.value.toString().match(/[Ee]/)) return v0.value + '.0';
	return v0.value;
}

class GraphicStatement extends Statement
{
	constructor(command, args, loc)
	{
		super(loc);
		this.command = command;
		this.args = args;
		this.state = 0;
	}
	clone()
	{
		var args = [];
		for(var i = 0; i < this.args.length; i++) args.push(this.args[i].clone());
		return new GraphicStatement(this.command, args, this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			if(this.args) code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			if(this.command == 'gOpenWindow')
			{
				var canvas = document.getElementById('canvas');
				context = canvas.getContext('2d');
				canvas.setAttribute("width", this.args[0].getValue().value + "px");
				canvas.setAttribute("height", this.args[1].getValue().value + "px");
				canvas.style.display="block";
			}
			else if(this.command == 'gCloseWindow')
			{
				var canvas = document.getElementById('canvas');
				canvas.style.display = "none";
				context = null;
			}
			else if(this.command == 'gClearWindow')
			{
				var canvas = document.getElementById('canvas');
				context.clearRect(0,0,canvas.width, canvas.height)
			}
			else if(this.command == 'gSetLineColor')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let r = this.args[0].getValue().value, g = this.args[1].getValue().value, b = this.args[2].getValue().value;
				context.strokeStyle = "rgb(" + r + "," + g + "," + b + ")";
			}
			else if(this.command == 'gSetFillColor')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let r = this.args[0].getValue().value, g = this.args[1].getValue().value, b = this.args[2].getValue().value;
				context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
			}
			else if(this.command == 'gSetTextColor')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let r = this.args[0].getValue().value, g = this.args[1].getValue().value, b = this.args[2].getValue().value;
				context.textStyle = "rgb(" + r + "," + g + "," + b + ")";
			}
			else if(this.command == 'gSetLineWidth')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				context.lineWidth = this.args[0].getValue().value;
			}
			else if(this.command == 'gSetFontSize')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				context.font = this.args[0].getValue().value + "px 'sans-serif'";
			}
			else if(this.command == 'gDrawText')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				var temp = context.fillStyle;
				context.fillStyle = context.textStyle;
				context.fillText(this.args[0].getValue().value, this.args[1].getValue().value, this.args[2].getValue().value);
				context.fillStyle = temp;
			}
			else if(this.command == 'gDrawLine')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let x1 = this.args[0].getValue().value, y1 = this.args[1].getValue().value,
					x2 = this.args[2].getValue().value, y2 = this.args[3].getValue().value;
				context.beginPath();
				context.moveTo(x1, y1);
				context.lineTo(x2, y2);
				context.stroke();
			}
			else if(this.command == 'gDrawPoint')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let x1 = this.args[0].getValue().value, y1 = this.args[1].getValue().value;
				context.beginPath();
				context.arc(x1, y1, 1, 0, Math.PI * 2, false);
				context.stroke();
			}
			else if(this.command == 'gDrawBox')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let x1 = this.args[0].getValue().value, y1 = this.args[1].getValue().value,
					width = this.args[2].getValue().value, height = this.args[3].getValue().value;
				context.beginPath();
				context.strokeRect(x1, y1, width, height);
				context.stroke();
			}
			else if(this.command == 'gFillBox')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let x1 = this.args[0].getValue().value, y1 = this.args[1].getValue().value,
					width = this.args[2].getValue().value, height = this.args[3].getValue().value;
				context.fillRect(x1, y1, width, height);
				context.beginPath();
				context.strokeRect(x1, y1, width, height);
				context.stroke();
			}
			else if(this.command == 'gDrawCircle')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let x1 = this.args[0].getValue().value, y1 = this.args[1].getValue().value, r = this.args[2].getValue().value;
				context.beginPath();
				context.arc(x1, y1, r, 0, Math.PI * 2, false);
				context.stroke();
			}
			else if(this.command == 'gFillCircle')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let x1 = this.args[0].getValue().value, y1 = this.args[1].getValue().value, r = this.args[2].getValue().value;
				for(var i = 0; i < 2; i++)
				{
					context.beginPath();
					context.arc(x1, y1, r, 0, Math.PI * 2, false);
					if(i == 0) context.fill();
					else context.stroke();
				}
			}
			else if(this.command == 'gDrawOval')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let x1 = this.args[0].getValue().value, y1 = this.args[1].getValue().value, w = this.args[2].getValue().value, h = this.args[3].getValue().value;
				context.beginPath();
				context.ellipse(x1 + w / 2, y1 + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
				context.stroke();
			}
			else if(this.command == 'gFillOval')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let x1 = this.args[0].getValue().value, y1 = this.args[1].getValue().value, w = this.args[2].getValue().value, h = this.args[3].getValue().value;
				for(var i = 0; i < 2; i++)
				{
					context.beginPath();
					context.ellipse(x1 + w / 2, y1 + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
					if(i == 0) context.fill();
					else context.stroke();
				}
			}
			else if(this.command == 'gDrawArc')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let x1 = this.args[0].getValue().value, y1 = this.args[1].getValue().value, w = this.args[2].getValue().value, h = this.args[3].getValue().value,
					theta1 = this.args[4].getValue().value, theta2 = this.args[5].getValue().value, style = this.args[6].getValue().value;
				context.beginPath();
				context.ellipse(x1 + w / 2, y1 + h / 2, w / 2, h / 2, 0, -theta1 * Math.PI / 180, -theta2 * Math.PI / 180, true);
				switch(style)
				{
					case 2: // 半径
						context.lineTo(x1 + w / 2, y1 + h / 2);
						// fall through
					case 1: // 弦
						context.closePath();
				}
				context.stroke();
			}
			else if(this.command == 'gFillArc')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let x1 = this.args[0].getValue().value, y1 = this.args[1].getValue().value, w = this.args[2].getValue().value, h = this.args[3].getValue().value,
					theta1 = this.args[4].getValue().value, theta2 = this.args[5].getValue().value, style = this.args[6].getValue().value;
				for(var i = 0; i < 2; i++)
				{
					context.beginPath();
					context.ellipse(x1 + w / 2, y1 + h / 2, w / 2, h / 2, 0, -theta1 * Math.PI / 180, -theta2 * Math.PI / 180, true);
					switch(style)
					{
						case 2: // 半径
							context.lineTo(x1 + w / 2, y1 + h / 2);
							// fall through
						case 1: // 弦
							context.closePath();
					}
					if(i == 0) context.fill();
					else context.stroke();
				}
			}
			else if(this.command == 'gBarplot')
			{
				if(context == null)
				{
					var canvas = document.getElementById('canvas');
					var w = this.args[0].getValue().value, h = this.args[1].getValue().value;
					context = canvas.getContext('2d');
					canvas.setAttribute("width", w + "px");
					canvas.setAttribute("height", h + "px");
					canvas.style.display="block";
				}
				// 値の取得
				var values = array2values(this.args[2], this.loc);
				var max = 0, min = 0, maxn = 0;
				for(var i = 0; i < values.length; i++)
				{
					var l = values[i].length;
					if(l > maxn) maxn = l;
					for(var j = 0; j < l; j++)
					{
						var v1 = values[i][j];
						if(v1 > max) max = v1;
						if(v1 < min) min = v1;
					}
				}
				if(max == 0) max = 1;
				// 軸の描画
				var x0 = w * 0.05, y0 = h * 0.95;
				y0 *= max / (max - min);
				w *= 0.9; h *= 0.9;
				context.beginPath();
				context.moveTo(x0, y0 - h * max / (max - min));
				context.lineTo(x0, y0 - h * min / (max - min));
				context.moveTo(x0, y0);
				context.lineTo(x0 + w, y0);
				context.stroke();
				if(values.length > 0)
				{
					var w0 = w / maxn / values.length;
					for(var i = 0; i < values.length; i++)
					{
						context.fillStyle = graphColor[i % 6];
						context.beginPath();
						for(var j = 0; j < values[i].length; j++)
						{
							var x = x0 + w0 * j + w0 / 2, y = y0 - (values[i][j] / (max - min)) * h;
							if(values[i][j] >= 0)
								context.fillRect(x0 + w0 * j * values.length + w0 * 0.8 * i + w0 * 0.1, y0 - h * (values[i][j] / (max - min)),w0 * 0.8, h * (values[i][j] / (max - min)));
							else
								context.fillRect(x0 + w0 * j * values.length + w0 * 0.8 * i + w0 * 0.1, y0, w0 * 0.8, h * (-values[i][j] / (max - min)));
						}
						context.stroke();
					}
				}
			}
			else if(this.command == 'gLineplot')
			{
				if(context == null)
				{
					var canvas = document.getElementById('canvas');
					var w = this.args[0].getValue().value, h = this.args[1].getValue().value;
					context = canvas.getContext('2d');
					canvas.setAttribute("width", w + "px");
					canvas.setAttribute("height", h + "px");
					canvas.style.display="block";	
				}
				// 値の取得
				var values = array2values(this.args[2], this.loc);
				var max = 0, min = 0, maxn = 0;
				for(var i = 0; i < values.length; i++)
				{
					var l = values[i].length;
					if(l > maxn) maxn = l;
					for(var j = 0; j < l; j++)
					{
						var v1 = values[i][j];
						if(v1 > max) max = v1;
						if(v1 < min) min = v1;
					}
				}
				if(max == 0) max = 1;
				// 軸の描画
				var x0 = w * 0.05, y0 = h * 0.95;
				y0 *= max / (max - min);
				w *= 0.9; h *= 0.9;
				context.beginPath();
				context.moveTo(x0, y0 - h * max / (max - min));
				context.lineTo(x0, y0 - h * min / (max - min));
				context.moveTo(x0, y0);
				context.lineTo(x0 + w, y0);
				context.stroke();
				if(values.length > 0)
				{
					var w0 = w / maxn;
					for(var i = 0; i < values.length; i++)
					{
						context.strokeStyle = graphColor[i % 6];
						context.beginPath();
						for(var j = 0; j < values[i].length; j++)
						{
							var x = x0 + w0 * j + w0 / 2, y = y0 - (values[i][j] / (max - min)) * h;
							if(j == 0) context.moveTo(x, y);
							else context.lineTo(x, y);
						}
						context.stroke();
					}
				}
			}
			else if(this.command == 'gDrawGraph')
			{
				drawGraph(this.args[0].getValue(), this.args[1].getValue(), this.loc);
			}
			else if(this.command == 'gClearGraph')
			{
				clearGraph();
			}
			else
			{
				throw new RuntimeError(this.first_line, "未実装のコマンド" + this.command + "が使われました");
			}
			this.state = 0;
		}
	}
	makePython(indent)
	{
		throw new RuntimeError(this.first_line, "グラフィック命令はPythonに変換できません");
	}
}

function clearGraph()
{
	Plotly.purge(document.getElementById("graph"));
}

// グラフ描画を行う
// graph{
//  title: 文字列
//  x:{
// 	  title: 文字列
//    min: 実数
//    max: 実数
//  }
//  y:{
// 	  title:
//    min:
//    max:
//  }
// }
// dataは{
//   x: 値の配列（省略時は0〜len(y)-1）
//   y: 値の配列（省略不可）
//   type: 'bar' or 'line' or 'scatter'
//   color: 
//   size: 整数（省略時は1）
// }の配列
function drawGraph(layout, data, loc)
{
	var div = document.getElementById('graph');
	var graph_data = [], graph_layout = {};
	if(layout instanceof DictionaryValue)
	{
		for(var key in layout.value)
		{
			var val = layout.value[key].getValue();
			if(val instanceof ArrayValue)
			{
				graph_layout[key] = {};
				for(var key1 in val.value)
					graph_layout[key][key1] = val2obj(val.value[key1].getValue());
			}
			else graph_layout[key] = val2obj(val);
		}
	}
	else if(layout) throw new RuntimeError(loc.first_line, "レイアウト情報が辞書になっていません");
	if(data instanceof ArrayValue)
	{
		var dl = data.value.length;
		for(var i = 0; i < dl; i++)
		{
			var d = data.value[i].getValue();
			if(d instanceof DictionaryValue)
			{
				var va = {};
				for(var key in d.value)
				{
					var val = d.value[key].getValue();
					va[key] = val2obj(val);
				}
				graph_data.push(va);
	
			}
			else throw new RuntimeError(loc.first_line, "データの" + i + "番目の要素が辞書になっていません");
		}
	}else throw new RuntimeError(loc.first_line, 'データが配列になっていません');
	Plotly.newPlot(div, graph_data, graph_layout);
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
		for(var key in val.value)
			rtnv[key] = val2obj(val.value[key].getValue());
		return rtnv;
	}
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
			rtnv1.push(array.value[i] instanceof ArrayValue ? array.value[i].value[j].value : array.value[i][j].value);
		rtnv.push(rtnv1);
	}
	return rtnv;
}



class If extends Statement
{
	/**
	 * 
	 * @param {Array} blocks
	 * @param {Location} loc 
	 */
	constructor(blocks, loc)
	{
		super(loc);
		this.blocks = blocks;
		this.running = -1;
	}
	clone()
	{
		var newblock = [];
		for(var i = 0; i < this.blocks.length; i++)
		{
			var newblock1 = [];
			for(var j = 0; j < this.blocks[i][1].length; j++) if(this.blocks[i][1][j]) newblock1.push(this.blocks[i][1][j].clone());
			newblock.push([this.blocks[i][0] ? this.blocks[i][0].clone() : null, newblock1]);
		}
		return new If(newblock,this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			this.running = 0;
			this.state = 1;
		}
		else if(this.state == 1)
		{
			if(this.running < this.blocks.length)
			{
				if(this.blocks[this.running][0]) code[0].stack.unshift({statementlist: [this.blocks[this.running][0]], index: 0});
				this.state = 2;
			}
			else
			{
				this.state = 0;
				code[0].stack[0].index++;
			}
		}
		else if(this.state == 2)
		{
			var flag = this.blocks[this.running][0] ? this.blocks[this.running][0].getValue() : new BooleanValue(true, this.loc);
			if(flag instanceof BooleanValue)
			{
				if(flag.value)
				{
					code[0].stack[0].index++;
					this.state = 0;
					code[0].stack.unshift({statementlist: this.blocks[this.running][1], index: 0});
				}
				else
				{
					this.running++;
					this.state = 1;
				}
			}
			else throw new RuntimeError(this.first_line, "条件式が使われるべき場所なのに，条件式が使われていません");
		}
	}
	makePython(indent)
	{
		var code = '';
		for(var i = 0; i < this.blocks.length; i++)
		{
			if(i == 0) code += Parts.makeIndent(indent) + "if " + this.blocks[i][0].makePython(0) + ":\n";
			else if(this.blocks[i][0]) code += Parts.makeIndent(indent) + "elif " + this.blocks[i][0].makePython(0) + ":\n";
			else code += Parts.makeIndent(indent) + "else:\n";
			if(this.blocks[i][1] && this.blocks[i][1].length > 0)
			{
				for(var j = 0; j < this.blocks[i][1].length; j++)
					code += this.blocks[i][1][j].makePython(indent + 1);
			}	
			else code += Parts.makeIndent(indent + 1) + "pass\n";
		}
		return code;
	}
}

class LoopBegin extends Statement
{
	/**
	 * @constructor
	 * @param {Value} condition nullなら判定しない
	 * @param {boolean} continuous condition==continuousなら継続
	 * @param {Location} loc 
	 */
	constructor(condition, continuous, loc)
	{
		super(loc);
		this.condition = condition;
		this.continuous = continuous;
		this.state = 0;
	}
	clone()
	{
		return new LoopBegin(this.condition ? this.condition.clone() : null, this.continuous, this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			if(this.condition) code[0].stack.unshift({statementlist: [this.condition], index: 0});
			this.state = 1;
		}
		else
		{
			if(!this.condition || this.condition.getValue().value == this.continuous) code[0].stack[0].index++;
			else code[0].stack[0].index = -1;
			this.state = 0;
		}
	}
}

class LoopEnd extends Statement
{
	/**
	 * @constructor
	 * @param {Value} condition nullなら判定しない
	 * @param {boolean} continuous condition==continuousなら継続
	 * @param {Location} loc 
	 */
	constructor(condition, continuous, loc)
	{
		super(loc);
		this.condition = condition;
		this.continuous = continuous;
		this.state = 0;
	}
	clone()
	{
		return new LoopEnd(this.condition ? this.condition.clone() : null, this.continuous, this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			if(this.condition) code[0].stack.unshift({statementlist: [this.condition], index: 0});
			this.state = 1;
		}
		else
		{
			if(!this.condition || this.condition.getValue.value == this.continuous) code[0].stack[0].index = 0;
			else code[0].stack[0].index = -1;
			this.state = 0;
		}
	}
}

class ForIn extends Statement
{
	constructor(array, variable, statementlist, loc)
	{
		super(loc);
		if(!(variable instanceof Variable || variable instanceof UNDEFINED)) throw new RuntimeError(loc.first_line, "繰り返しのカウンタは変数でなくてはいけません");
		this.array = array;
		this.variable = variable;
		this.statementlist = statementlist;
	}
	clone()
	{
		var state = [];
		for(var i = 0; i < this.statementlist.length; i++) if(this.statementlist[i]) state.push(this.statementlist[i].clone());
		return new ForIn(this.array.clone(), this.variable.clone(), state, this.loc);
	}
	makePython(indent)
	{
		var code = Parts.makeIndent(indent);
		var pa = this.array.makePython(), pv = this.variable.makePython();
		code += "for " + pv + " in " + pa + ":\n";
		var codes = 0;
		for(var i = 0; i < this.statementlist.length; i++)
			if(this.statementlist[i])
			{
				codes = 1;
				code += this.statementlist[i].makePython(indent + 1);
			}
		if(codes == 0) code += Parts.makeIndent(indent + 1) + "pass\n";
		return code;
	}
	run()
	{
		if(this.varname instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: [this.array], index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let variable = new Variable(this.variable.varname, this.variable.args, this.loc);
			let loop = [new ForIn_step(this, variable, this.array, this.loc), new LoopBegin(new BooleanValue(true, this.loc), true, this.loc)];
			for(let i = 0; i < this.statementlist.length; i++)if(this.statementlist[i])loop.push(this.statementlist[i].clone());
			loop.push(new LoopEnd(null, true, this.loc));
			code[0].stack.unshift({statementlist: loop, index: 0});
			this.state = 0;
		}
	}
}

class ForIn_step extends Statement
{
	constructor(forin, variable, array, loc)
	{
		super(loc);
		this.forin = forin;
		this.variable = variable;
		this.array = array;
		this.index = 0;
	}
	clone()
	{
		return new ForIn_step(this.forin.clone(), this.variable.clone(), this.array.clone(), this.loc);
	}
	run()
	{
		code[0].stack[0].index++;
		if(this.index < this.array.rtnv.length)
		{
			let assign = new Assign(this.variable, this.array.rtnv.rtnv.value[this.index++], null, this.loc);
			code[0].stack.unshift({statementlist: [assign], index: 0});
		}
		else
		{
			code[0].stack[0].statementlist[1] = new LoopBegin(new BooleanValue(false, true, this.loc),true, this.loc);
		}
	}
}

/**
 * forループ（加算）
 */
class ForInc extends Statement
{
	/**
	 * @constructor
	 * @param {Variable} varname 
	 * @param {Value} begin 
	 * @param {Value} end 
	 * @param {Value} step 
	 * @param {Array<Statement>} statementlist 
	 * @param {Location} loc 
	 */
	constructor(varname, begin, end, step, statementlist,loc)
	{
		super(loc);
		if(!(varname instanceof Variable || varname instanceof UNDEFINED)) throw new RuntimeError(loc.first_line, "繰り返しのカウンタは変数でなくてはいけません");
		this.varname = varname;
		this.begin = begin;
		this.end = end;
		this.step = step;
		this.statementlist = statementlist;
		this.state = 0;
	}
	clone()
	{
		var state = [];
		for(var i = 0; i < this.statementlist.length; i++) if(this.statementlist[i]) state.push(this.statementlist[i].clone());
		return new ForInc(this.varname.clone(), this.begin.clone(), this.end.clone(), this.step.clone(), state, this.loc);
	}
	makePython(indent)
	{
		var code = Parts.makeIndent(indent);
		var pv = this.varname.makePython(), pb = this.begin.makePython(), pe = this.end.makePython(), ps = this.step.makePython();
		code += "for " + pv + " in range(" + pb + ", " + pe + "+1, " + ps + "):\n";
		var codes = 0;
		for(var i = 0; i < this.statementlist.length; i++)
			if(this.statementlist[i])
			{
				codes = 1;
				code += this.statementlist[i].makePython(indent + 1);
			}
		if(codes == 0) code += Parts.makeIndent(indent + 1) + "pass\n";
		return code;
	}
	run()
	{
		if(this.varname instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: [new Assign(this.varname, this.begin, null, this.loc)], index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			if(this.begin.getValue() instanceof IntValue || this.begin.getValue() instanceof FloatValue)
			{
				let variable = new Variable(this.varname.varname, this.varname.args,this.loc);
				let condition = new LE(variable, this.end, this.loc);	// IncとDecの違うところ
				let loop = [variable, condition, new LoopBegin(condition, true, this.loc)];
				for(let i = 0; i < this.statementlist.length; i++)if(this.statementlist[i]) loop.push(this.statementlist[i].clone());
				loop.push(this.step);
				loop.push(new Assign(variable, this.step, '+', this.loc));	// IncとDecの違うところ
				loop.push(new LoopEnd(null, true, this.loc));
				code[0].stack.unshift({statementlist: loop, index: 0});
			}
			else throw new RuntimeError(this.first_line, '初期値は数値型である必要があります');
			this.state = 0;
		}
	}
}

class ForDec extends Statement
{
	constructor(varname, begin, end, step, statementlist,loc)
	{
		super(loc);
		if(!(varname instanceof Variable || varname instanceof Variable)) throw new RuntimeError(loc.first_line, "繰り返しのカウンタは変数でなくてはいけません");
		this.varname = varname;
		this.begin = begin;
		this.end = end;
		this.step = step;
		this.statementlist = statementlist;
		this.state = 0;
	}
	clone()
	{
		var state = [];
		for(var i = 0; i < this.statementlist.length; i++) if(this.statementlist[i])state.push(this.statementlist[i].clone());
		return new ForDec(this.varname.clone(), this.begin.clone(), this.end.clone(), this.step.clone(), state, this.loc);
	}
	makePython(indent)
	{
		var code = Parts.makeIndent(indent);
		var pv = this.varname.makePython(), pb = this.begin.makePython(), pe = this.end.makePython(), ps = this.step.makePython();
		code += "for " + pv + " in range(" + pb + ", " + pe + "-1, -" + ps + "):\n";
		var codes = 0;
		for(var i = 0; i < this.statementlist.length; i++)
			if(this.statementlist[i])
			{
				codes = 1;
				code += this.statementlist[i].makePython(indent + 1);
			}
		if(codes == 0) code += Parts.makeIndent(indent + 1) + "pass\n";
		return code;
	}
	run()
	{
		if(this.varname instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: [new Assign(this.varname, this.begin, null, this.loc)], index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			if(this.begin.getValue() instanceof IntValue || this.begin.getValue() instanceof FloatValue)
			{
				let variable = new Variable(this.varname.varname, this.varname.args,this.loc);
				let condition = new GE(variable, this.end, this.loc);	// IncとDecの違うところ
				let loop = [variable, condition, new LoopBegin(condition, true, this.loc)];
				for(let i = 0; i < this.statementlist.length; i++) if(this.statementlist[i])loop.push(this.statementlist[i].clone());
				loop.push(this.step);
				loop.push(new Assign(variable, this.step, '-', this.loc));	// IncとDecの違うところ
				loop.push(new LoopEnd(null, true, this.loc));
				code[0].stack.unshift({statementlist: loop, index: 0});
			}
			else throw new RuntimeError(this.first_line, '初期値は数値型である必要があります');
			this.state = 0;
		}
	}
}

class While extends Statement
{
	constructor(condition, statementlist, loc)
	{
		super(loc);
		this.condition = condition;
		this.statementlist = statementlist;
		this.status = 0;
	}
	clone()
	{
		var state = [];
		for(var i = 0; i < this.statementlist.length; i++) if(this.statementlist[i]) state.push(this.statementlist[i].clone());
		return new While(this.condition.clone(), state, this.loc);
	}
	makePython(indent)
	{
		var code = Parts.makeIndent(indent);
		code += "while " + this.condition.makePython() + ":\n";
		var codes = 0;
		for(var i = 0; i < this.statementlist.length; i++)
			if(this.statementlist[i])
			{
				codes = 1;
				code += this.statementlist[i].makePython(indent + 1);
			}
		if(codes == 0) code += Parts.makeIndent(indent + 1) + "pass\n";
		return code;
	}
	run()
	{
		if(this.status == 0)
		{
			code[0].stack.unshift({statementlist: [this.condition], index: 0});
			this.status = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let loop = [new LoopBegin(this.condition, true, this.loc)];
			for(var i = 0; i < this.statementlist.length; i++) if(this.statementlist[i]) loop.push(this.statementlist[i].clone());
			loop.push(new LoopEnd(null, false, this.loc));
			code[0].stack.unshift({statementlist: loop, index: 0});
			this.status = 0;
		}
	}
}

class SleepStatement extends Statement
{
	constructor(sec, loc)
	{
		super(loc)
		this.sec = new IntValue(sec.value, loc); // milli seconds
	}
	clone()
	{
		return new SleepStatement(this.sec.clone(), this.loc);
	}
	run()
	{
		wait_time = this.sec.value;
		code[0].stack[0].index++;
	}
	makePython(indent)
	{
		var code = Parts.makeIndent(indent);
		python_lib["time"] = 1;
		return code + "time.sleep(" + this.sec.makePython() + " / 1000)\n";
	}
}

class NopStatement extends Statement
{
	constructor(loc) {super(loc);}
	clone()	{return new NopStatement(this.loc);}
	run(){ code[0].stack[0].index++;}
	makePython(indent){
		return Parts.makeIndent(indent) + "pass\n";
	}
}

class PauseStatement extends Statement
{
	constructor(loc) {super(loc);}
	clone(){return new PauseStatement(this.loc);}
	run(){code[0].stack[0].index++; }
	makePython(indent){
		return '';
	}
}


class BreakStatement extends Statement
{
	constructor(loc){super(loc);}
	clone()
	{
		return new BreakStatement(this.loc);
	}
	run()
	{
		while(true)
		{
			var block = code[0].stack.shift();
			if(!block) throw new RuntimeError(this.first_line, '繰り返しの中ではありません。');
			for(var i = 0; i < block.statementlist.length; i++)
				if(block.statementlist[i] instanceof LoopBegin) return;
		}
	}
	makePython(indent)
	{
		return Parts.makeIndent(indent) + "break\n";
	}
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
				if(e.line) textareaAppend(e.line + "行目");
				textareaAppend("構文エラーです\n" + e.message + "\n");
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
			statement.run();
		}
		catch(e)
		{
			if(selected_quiz < 0)
			{
				if(e instanceof RuntimeError) textareaAppend("\n" + e.line + "行目:" + e.message + "\n");
				else textareaAppend("実行時エラーです（おそらくPyPENのバグなので，開発者に連絡してください）\n" + e + "\n");
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
				if(statement instanceof PauseStatement) step_flag = true;
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


/**************************************** flowchart **********************************/

var dragging = false;
var mouseX, mouseY;

class point
{
	constructor(){this._x = this._y = 0;}
	get x(){return this._x;} set x(v){this._x = v;}
	get y(){return this._y;} set y(v){this._y = v;}
	clone(){var p = new point(); p.x = this.x; p.y = this.y; return p;}
}

function mouseDown(e)
{
	var rect = document.getElementById("flowchart").getBoundingClientRect();
	var x = e.clientX - rect.left;
	var y = e.clientY - rect.top;
	var parts = flowchart.findParts(x, y);
	if(parts == null) return;
	dragging = true;
	mouseX = x; mouseY = y;
}

function mouseUp(e)
{
	dragging = false;
}

function mouseMove(e)
{
	if(dragging)
	{
		var rect = document.getElementById("flowchart").getBoundingClientRect();
		var x = e.clientX - rect.left;
		var y = e.clientY - rect.top;
		flowchart.moveOrigin(x - mouseX, y - mouseY);
		mouseX = x; mouseY = y;
		flowchart.paint();
	}
}

function doubleclick_Flowchart(evt)
{
	if(!editable_flag) {
		alert("プログラム実行・中断中はプログラムを編集できません");
		return;
	}
	dragging = false;
	var rect = evt.target.getBoundingClientRect();
	var x = evt.clientX - rect.left;
	var y = evt.clientY - rect.top;
	var parts = flowchart.findParts(x, y);
	if(parts == null || parts instanceof Parts_Terminal
		|| parts instanceof Parts_Bar || parts instanceof Parts_Null) return;
	parts.editMe();
}

function variableChange(e)
{
	flowchart.flowchart2code();
	makeDirty(true);
}

function contextMenu_Flowchart(trigger, event)
{
	dragging = false;
	var x = event.offsetX, y = event.offsetY;
	var parts = flowchart.findParts(x, y);
	if(parts == null || parts instanceof Parts_Terminal || parts instanceof Parts_Null) return false;
	if(parts instanceof Parts_Bar)
		return {
			selectableSubMenu: true,
			events:{
				show: function(){parts.highlight();},
				hide: function(){flowchart.paint(); flowchart.flowchart2code();}
			},
			callback: function(k, e){callbackPartsBar(parts, k);},
			items: {
				input: {name: "入力", icon: "input"},
				output: {name: "出力", icon: "output"},
				substitute: {name: "代入", icon: "assign"},
				if:{name:"分岐", icon: "if"},
				loop:{name:"ループ", icon: "loop",
					items:{
						loop1: {name:"〜の間"},
						loopinc:{name:"増やしながら"},
						loopdec:{name:"減らしながら"},
						loopfor:{name:"配列の要素について"}
					}
				},
				array:{name:"配列操作",
					items:{
						append: {name:"追加"},
						extend: {name:"連結"}
					}
				},
				misc:{name:"各種命令"}
//				separator2:"-----",
//				paste:{name:"ペースト"}
			}
		};
	return {
		callback: function(k,e){callbackParts(parts, k);},
		events:{
			show: function(){parts.highlight();},
			hide: function(){flowchart.paint(); flowchart.flowchart2code();}
		},
		items: {
			edit:{ name:"編集"},
			delete: { name:"削除"}
//			cut:{name:"カット"}
		}
	};
}

function callbackPartsBar(bar, key)
{
	if(document.getElementById("sourceTextarea").readOnly) 
	{
		window.alert("プログラム実行・中断中はプログラムを編集できません");
		return;
	}
	bar.highlight();
	if(key == "input") Parts_Input.appendMe(bar);
	else if(key == "output") Parts_Output.appendMe(bar);
	else if(key == "substitute") Parts_Substitute.appendMe(bar);
	else if(key == "append") Parts_Append.appendMe(bar);
	else if(key == "extend") Parts_Extend.appendMe(bar);
	else if(key == "if") Parts_If.appendMe(bar);
	else if(key == "loop1") Parts_LoopBegin1.appendMe(bar);
	else if(key == "loopinc") Parts_LoopBeginInc.appendMe(bar);
	else if(key == "loopdec") Parts_LoopBeginDec.appendMe(bar);
	else if(key == "loopfor") Parts_LoopBeginFor.appendMe(bar);
	else if(key == "misc") Parts_Misc.appendMe(bar);
	else return;
	makeDirty(true);
}

function callbackParts(parts, key)
{
	if(document.getElementById("sourceTextarea").readOnly)
	{
		window.alert("プログラム実行・中断中はプログラムを編集できません");
		return;
	}
	if(parts instanceof Parts_Terminal) return false;
	if(key == "edit"){parts.editMe();}
	else if(key == "delete"){parts.deleteMe(); makeDirty(true);}
	else if(key == "cut"){parts.cutMe(); makeDirty(true);}
}

var FlowchartSetting = {
    size: 6,
    fontsize: 12,
};

function changeSize(v)
{
	if(v > 0) FlowchartSetting.size++;
	else if(v < 0)
	{
		if(FlowchartSetting.size > 3) FlowchartSetting.size--;
	}
	else FlowchartSetting.size = 6;
	flowchart.paint();
}


function variable2code(ty, id)
{
	var code = document.getElementById(id).value.trim();
	if(code != "") return ty + ' ' + code + "\n";
	return '';
}


class Flowchart
{
    constructor()
    {
		this._canvas = document.getElementById("flowchart");
		this._context = this._canvas.getContext('2d');
        this.makeEmpty();
    }
	get x0(){return this._x0;}
	get y0(){return this._y0;}
	get canvas(){return this._canvas;}
	get context(){return this._context;}
	setOrigin(x, y) {this._x0 = x; this._y0 = y;}
	moveOrigin(x, y){this._x0 += x; this._y0 += y;}
    makeEmpty()
    {
		this.setOrigin(this.canvas.width / 2, FlowchartSetting.size);
        this.top = new Parts_Terminal();
        var bar = new Parts_Bar();
        var end = new Parts_Terminal();
        this.top.next = bar;
        bar.next = end;
        this.top.setValue("はじめ");
        end.setValue("おわり");
    }
    code2flowchart(parse)
    {
		flowchart.makeEmpty();
		Flowchart.appendParts(this.top.next, parse);
		flowchart.paint();
	}
	static appendParts(parts, statementlist)
	{
		for(var i = 0; i < statementlist.length; i++)
		{
			var p = statementlist[i];
			if(!p) continue;
			var statement = constructor_name(p);
			if(statement == "Assign")
			{
				var p1 = new Parts_Substitute();
				var b1 = new Parts_Bar();
				var c = constructor_name(p.value);
				var brace = false;
				// if(c == 'Compare'){brace = true;}
				p1.setValue(p.variable.getCode(), (brace ? '(' : '') + p.value.getCode() + (brace ? ')' : ''), p.operator);
				parts.next = p1;
				parts = p1.next = b1;
			}
			else if(statement == "Append")
			{
				var p1 = new Parts_Append();
				var b1 = new Parts_Bar();
				p1.setValue(p.variable.getCode(), p.value.getCode());
				parts.next = p1;
				parts = p1.next = b1;
			}
			else if(statement == "Extend")
			{
				var p1 = new Parts_Extend();
				var b1 = new Parts_Bar();
				p1.setValue(p.variable.getCode(), p.value.getCode());
				parts.next = p1;
				parts = p1.next = b1;
			}
			else if(statement == "Input")
			{
				var p1 = new Parts_Input();
				var b1 = new Parts_Bar();
				p1.setValue(p.varname.getCode(), p.type);
				parts.next = p1;
				parts = p1.next = b1;
			}
			else if(statement == "Output")
			{
				var p1 = new Parts_Output();
				var b1 = new Parts_Bar();
				var v0 = []
				for(var j = 0; j < p.value.length; j++) v0.push(p.value[j].getCode());
				p1.setValue(v0.join(','), p.ln);
				parts.next = p1;
				parts = p1.next = b1;
			}
			else if(statement == "Newline")
			{
				var p1 = new Parts_Output();
				var b1 = new Parts_Bar();
				p1.setValue('改行', true);
				parts.next = p1;
				parts = p1.next = b1;
			}
			else if(statement == "If")
			{
				var p1 = new Parts_If();
				var b1 = new Parts_Bar(), b2 = new Parts_Bar(), b3 = new Parts_Bar();
				var n1 = new Parts_Null(), n2 = new Parts_Null(), n3 = new Parts_Null();
				p1.setValue(p.blocks[0][0].getCode());
				parts.next = p1;
				p1.next = n1; n1.next = b1;
				p1.left = b2; b2._prev = p1; b2.next = n2;
				p1.right = b3; b3._prev = p1; b3.next = n3;
				if(p.blocks[0][1]) Flowchart.appendParts(b2, p.blocks[0][1]);
				if(p.blocks.length > 1)
				{
					if(p.blocks.length == 2 && !p.blocks[1][0])
					{
						if(p.blocks[1][1]) Flowchart.appendParts(b3, p.blocks[1][1]);
					}
					else throw new RuntimeError(-1, "「そうでなくもし」はフローチャートで表せません。");
				}
				parts = b1;
			}
			else if(statement == "ForInc")
			{
				var p1 = new Parts_LoopBeginInc(), p2 = new Parts_LoopEnd();
				var b1 = new Parts_Bar(), b2 = new Parts_Bar();
				p1.setValue(p.varname.getCode(), p.begin.getCode(), p.end.getCode(), p.step.getCode());
				parts.next = p1; 
				p1.next = b1; b1.next = p2; p2.next = b2;
				p1._end = p2; p2._begin = p1;
				Flowchart.appendParts(b1, p.statementlist);
				parts = b2;
			}
			else if(statement == "ForDec")
			{
				var p1 = new Parts_LoopBeginDec(), p2 = new Parts_LoopEnd();
				var b1 = new Parts_Bar(), b2 = new Parts_Bar();
				p1.setValue(p.varname.getCode(), p.begin.getCode(), p.end.getCode(), p.step.getCode());
				parts.next = p1; 
				p1.next = b1; b1.next = p2; p2.next = b2;
				p1._end = p2; p2._begin = p1;
				Flowchart.appendParts(b1, p.statementlist);
				parts = b2;
			}
			else if(statement == "ForIn")
			{
				var p1 = new Parts_LoopBeginFor(), p2 = new Parts_LoopEnd();
				var b1 = new Parts_Bar(), b2 = new Parts_Bar();
				p1.setValue(p.array.getCode(), p.variable.getCode());
				parts.next = p1; 
				p1.next = b1; b1.next = p2; p2.next = b2;
				p1._end = p2; p2._begin = p1;
				Flowchart.appendParts(b1, p.statementlist);
				parts = b2;
			}
			else if(statement == "While")
			{
				var p1 = new Parts_LoopBegin1(), p2 = new Parts_LoopEnd();
				var b1 = new Parts_Bar(), b2 = new Parts_Bar();
				p1.setValue(p.condition.getCode());
				parts.next = p1; 
				p1.next = b1; b1.next = p2; p2.next = b2;
				p1._end = p2; p2._begin = p1;
				Flowchart.appendParts(b1, p.statementlist);
				parts = b2;
			}
			else if(statement == "FileIOStatement")
			{
				var p1 = new Parts_Misc();
				var b1 = new Parts_Bar();
				p1.setValue(p.command, p.args);
				parts.next = p1;
				parts = p1.next = b1;
			}
			else if(statement == "GraphicStatement")
			{
				var p1 = new Parts_Misc();
				var b1 = new Parts_Bar();
				p1.setValue(p.command, p.args);
				parts.next = p1;
				parts = p1.next = b1;
			}
			else if(statement == "SleepStatement")
			{
				var p1 = new Parts_Misc();
				var b1 = new Parts_Bar();
				p1.setValue("sleep", [p.sec]);
				parts.next = p1;
				parts = p1.next = b1;
			}
			else if(statement == "BreakStatement")
			{
				var p1 = new Parts_Misc();
				var b1 = new Parts_Bar();
				p1.setValue("break", []);
				parts.next = p1;
				parts = p1.next = b1;
			}
			else if(statement == "DumpStatement")
			{
				var p1 = new Parts_Misc();
				var b1 = new Parts_Bar();
				p1.setValue("dump",[]);
				parts.next = p1;
				parts = p1.next = b1;
			}
			else if(statement == "NopStatement")
			{
				var p1 = new Parts_Misc();
				var b1 = new Parts_Bar();
				p1.setValue("NopStatement",[]);
				parts.next = p1;
				parts = p1.next = b1;
			}
			else if(statement == "PauseStatement")
			{
				var p1 = new Parts_Misc();
				var b1 = new Parts_Bar();
				p1.setValue("PauseStatement",[]);
				parts.next = p1;
				parts = p1.next = b1;
			}
		}
	}

	flowchart2code()
    {
		if(!flowchart_display) return;
		var newcode = this.top.appendCode('', 0);
		editor.getDoc().setValue(newcode);
		editor.focus();
    }
    paint()
    {
        if(!flowchart_display) return;

		var canvas_width = this.canvas.width;
		var canvas_height = this.canvas.height;
		var p0 = new point(), p1 = new point(), p2 = new point();
		this.context.clearRect(0, 0, canvas_width, canvas_height);
        FlowchartSetting.fontsize = FlowchartSetting.size * 2;
        this.context.font = FlowchartSetting.fontsize + "px 'sans-serif'";
        this.context.strokeStyle = "rgb(0,0,0)";
        this.context.fillStyle = "rgb(0,0,0)";
        this.context.lineWidth = "1px";
        this.top.calcSize(p0, p1, p2);	// p1が左上，p2が右下
        this.top.paint({x:this.x0, y:this.y0});
    }

	findParts(x, y)
	{
		return this.top.findParts(x, y);
	}

}

class Parts
{
    constructor()
    {
        this._text = "";
        this._next = this._prev = null;
        this._textwidth = this._textheight = this._width = this._height = 0;
		this._hspace = this._hspace2 = 0;
    }
    get x1(){return this._x1;} set x1(x){this._x1 = x;} // paintで計算する
    get y1(){return this._y1;} set y1(y){this._y1 = y;}
    get x2(){return this._x2;} set x2(x){this._x2 = x;}
    get y2(){return this._y2;} set y2(y){this._y2 = y;}
    get text(){return this._text;}
    get next(){return this._next;}
	set next(p){
		p._next = this.next;
		p._prev = this;
		if(this.next != null) this.next._prev = p;
		this._next = p;
	}
    get prev(){return this._prev;}
	get end(){return this;}						// ブロックの終わりのパーツ
    get width(){return this._width;}          // calcSizeで計算する
    get height(){return this._height;}         // calcSizeで計算する
    get textWidth(){return this._textwidth;}      // calcSizeで計算する
    get textHeight(){return this._textheight;}     // calcSizeで計算する
	get hspace(){return this._hspace;}
	get hspace2(){return this._hspace2;}

	get isBlockEnd(){return false;}

	inside(x, y)
	{
		return this.x1 <= x && x <= this.x2 && this.y1 <= y && y <= this.y2;
	}
	findParts(x, y)
	{
		var p = this;
		while(p != null && ! (p instanceof Parts_Null))
		{
			if(p.inside(x, y)) return p;
			if(p instanceof Parts_If)
			{
				var p1 = p.left.findParts(x, y);
				if(p1) return p1;
				p1 = p.right.findParts(x, y);
				if(p1) return p1;
				p = p.end.next;
			}
			else p = p.next;
		}
		if(p != null && p.next != null) return p.next.findParts(x,y);
		return null;
	}

    paint(position)
    {
        if(this.next != null) return this.next.paint(position);
		return this;
    }
    calcTextsize()
    {
        if(this.text != null && this.text != "")
        {
			var size = FlowchartSetting.size;
            var metrics = flowchart.context.measureText(this.text);
			this._hspace = 0;
            this._textwidth = metrics.width;
			if(this._textwidth < size * 4)
			{
				this._hspace = (size * 4 - this._textwidth) / 2;
				this._textwidth = size * 4;
			}
            this._textheight = FlowchartSetting.fontsize;
        }
    }
    calcSize(p0, p1, p2)
    {
		if(this.next == null || this.isBlockEnd) return this;
		return this.next.calcSize(p0,p1,p2);
    }
	static appendMe(bar)
	{

	}
    appendCode(code, indent)
	{
		if(this.next != null) return this.next.appendCode(code, indent);
		return code;
	}
    static makeIndent(indent_level)
    {
        var s = "";
        for(var i = 0; i < indent_level; i++) s += "    ";
        return s;
    }
	editMe()
	{

	}
	deleteMe()
	{
		this.prev._next = this.end.next.next;
		this.end.next.next._prev = this.prev;
		this.end._next = null;
		this._next = null;
	}
	cutMe()
	{

	}

	paint_highlight()
	{
		flowchart.context.strokeStyle = "rgb(255,0,0)";
		flowchart.context.fillStyle = "rgb(255,0,0)";
		flowchart.context.clearRect(this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1);
		this.paint(null);
		flowchart.context.strokeStyle = "rgb(0,0,0)";
		flowchart.context.fillStyle = "rgb(0,0,0)";
	}
	paint_unhighlight()
	{
		flowchart.context.clearRect(this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1);
		this.paint(null);
	}

	highlight()
	{
		this.paint_highlight();
	}
	unhighlight()
	{
		this.paint_unhighlight();
	}
}

class Parts_Null extends Parts
{
	get isBlockEnd(){ return true;}
}

class Parts_Bar extends Parts
{
    calcSize(p0,p1,p2)
    {
        this._width = 0;
        this._height = FlowchartSetting.size * 3;
		p0.y += this._height;
		if(p0.y > p2.y) p2.y = p0.y;
		return this.next.calcSize(p0,p1,p2);
    }
	inside(x, y)
	{
		var near = 4;
		return this.x1 - near <= x && x <= this.x2 + near && this.y1 <= y && y <= this.y2;
	}
    paint(position)
    {
		if(position != null)
		{
			this.x1 = this.x2 = position.x;
			this.y1 = position.y;
			this.y2 = this.y1 + this.height;
		}
        flowchart.context.beginPath();
        flowchart.context.moveTo(this.x1, this.y1);
        flowchart.context.lineTo(this.x2, this.y2);
        flowchart.context.stroke();
		if(position != null)
		{
			position.x = this.x2; position.y = this.y2;
			return this.next.paint(position);
		}
		return this;
    }
}

class Parts_Terminal extends Parts
{
    calcSize(p0,p1,p2)
    {
        this.calcTextsize();    // textWidth, textHeightの計算
        this._height = this._textheight + FlowchartSetting.size * 2;
        this._width = this._textwidth + this._height;
		var x1 = p0.x - this.width / 2;
		var x2 = p0.x + this.width / 2;
		var y2 = p0.y + this.height;
		if(x1 < p1.x) p1.x = x1;
		if(x2 > p2.x) p2.x = x2;
		if(y2 > p2.y) p2.y = y2;
		p0.y = y2;
		if(this.next == null) return this;
		return this.next.calcSize(p0,p1,p2);
    }
	setValue(v)
	{
		this._text = v;
	}
    paint(position)
    {
		var size = FlowchartSetting.size;
		if(position != null)
		{
			this.x1 = position.x - this.textWidth / 2 - this.height / 2;
			this.x2 = position.x + this.textWidth / 2 + this.height / 2;
			this.y1 = position.y;
			this.y2 = position.y + this.height;
		}
        flowchart.context.beginPath();    // 上
        flowchart.context.moveTo(this.x1 + this.height / 2, this.y1);
        flowchart.context.lineTo(this.x2 - this.height / 2, this.y1);
        flowchart.context.stroke();
        flowchart.context.beginPath();    // 右
        flowchart.context.arc(this.x2 - this.height / 2, this.y1 + this.height / 2,
            this.height / 2, Math.PI / 2, - Math.PI / 2, true);
        flowchart.context.stroke();
        flowchart.context.beginPath();    // 下
        flowchart.context.moveTo(this.x1 + this.height / 2, this.y2);
        flowchart.context.lineTo(this.x2 - this.height / 2, this.y2);
        flowchart.context.stroke();
        flowchart.context.beginPath();    // 左
        flowchart.context.arc(this.x1 + this.height / 2, this.y1 + this.height / 2,
            this.height / 2, 3 * Math.PI / 2, Math.PI / 2, true);
        flowchart.context.stroke();
        flowchart.context.fillText(this.text, this.x1 + this.height / 2, this.y2 - FlowchartSetting.size);
		if(position != null)
		{
			position.y += this.height;
			if(this.end.next != null) return this.end.next.paint(position);
			return this.end;
		}
		return this;
    }
}

class Parts_Output extends Parts
{
	constructor()
	{
		super();
		this.setValue("《値》", true);
	}
	get newline(){return this._newline;}
	setValue(v, nl)
	{
		this._text = v;
		this._newline = nl;
	}
	calcSize(p0,p1,p2)
    {
        this.calcTextsize();    // textWidth, textHeightの計算
		var size = FlowchartSetting.size;
        this._height = this._textheight + size * 2;
        this._width = this._textwidth + size * 2 + this._height / 2;
		var x1 = p0.x - this.width / 2;
		var x2 = p0.x + this.width / 2;
		var y2 = p0.y + this.height;
		if(x1 < p1.x) p1.x = x1;
		if(x2 > p2.x) p2.x = x2;
		if(y2 > p2.y) p2.y = y2;
		p0.y = y2;
		return this.next.calcSize(p0,p1,p2);
    }
    paint(position)
	{
		var size = FlowchartSetting.size;
		if(position != null)
		{
			this.x1 = position.x - this.width / 2;
			this.x2 = position.x + this.width / 2;
			this.y1 = position.y;
			this.y2 = this.y1 + this.height;
		}
		flowchart.context.beginPath();
		flowchart.context.moveTo(this.x2 - this.height / 2, this.y1);
		flowchart.context.lineTo(this.x1 + size * 2, this.y1);
		flowchart.context.lineTo(this.x1, (this.y1 + this.y2) / 2);
		flowchart.context.lineTo(this.x1 + size * 2, this.y2);
		flowchart.context.lineTo(this.x2 - this.height / 2, this.y2);
		flowchart.context.stroke();
		flowchart.context.beginPath();
		flowchart.context.arc(this.x2 - this.height / 2, (this.y1 + this.y2) / 2, this.height / 2,
			Math.PI / 2, -Math.PI /2, true);
		flowchart.context.stroke();

		flowchart.context.fillText(this.text, this.x1 + size * 2 + this.hspace, this.y2 - size);

		if(!this.newline && this.text != '改行')	// 改行なしマーク
		{
			var x = this.x2 - this.height / 2;
			var y = this.y1 + size;
			flowchart.context.beginPath();
			flowchart.context.moveTo(x + size, y);
			flowchart.context.lineTo(x + size, y + this.textHeight);
			flowchart.context.lineTo(x , y + this.textHeight);
			flowchart.context.stroke();
			flowchart.context.beginPath();
			flowchart.context.moveTo(x + size / 2, y + this.textHeight - size / 4);
			flowchart.context.lineTo(x , y + this.textHeight);
			flowchart.context.lineTo(x + size / 2, y + this.textHeight + size / 4);
			flowchart.context.stroke();
			x += this.height / 4; y += this.textHeight / 2;
			flowchart.context.beginPath(); flowchart.context.moveTo(x - size / 2, y - size / 2); flowchart.context.lineTo(x + size / 2, y + size / 2); flowchart.context.stroke();
			flowchart.context.beginPath(); flowchart.context.moveTo(x + size / 2, y - size / 2); flowchart.context.lineTo(x - size / 2, y + size / 2); flowchart.context.stroke();
		}
		if(position != null)
		{
			position.y = this.y2;
			if(this.end.next != null) return this.end.next.paint(position);
			return this.end;
		}
		return this;
	}
	static appendMe(bar)
	{
		var parts = new Parts_Output();
		bar.next = parts;
		parts.next = new Parts_Bar();
		return parts.next;
	}
	appendCode(code, indent)
	{
		code += Parts.makeIndent(indent);
		if(this.text == '改行') code += '改行する\n';
		else code += (this.newline ? "" : "改行なしで") + "表示する(" + this.text +")\n";
		if(this.next != null) return this.next.appendCode(code, indent);
		return code;
	}
	editMe()
	{
		var subtitle = ["値", "改行"];
		var values = [ this.text , this.newline];
		openModalWindowforOutput("出力の編集", subtitle, values, this);
	}
	edited(values)
	{
		if(values != null)
		{
			this.setValue(values[0], values[1]);
		}
		flowchart.paint();
		flowchart.flowchart2code();
	}
}

class Parts_Input extends Parts
{
	constructor()
	{
		super();
		this.setValue("《変数》", 0);
	}
	setValue(v, type)
	{
		this._var = v;
		this.type = type;
		this._text = v + "を入力"
		if(this.type > 0)this._text +="（" + nameOfType[this.type] + "）";
	}
	get var(){return this._var;}
	calcSize(p0,p1,p2)
    {
        this.calcTextsize();    // textWidth, textHeightの計算
		var size = FlowchartSetting.size;
        this._height = this._textheight + size * 2;
        this._width = this._textwidth + size * 4;
		var x1 = p0.x - this.width / 2;
		var x2 = p0.x + this.width / 2;
		var y2 = p0.y + this.height;
		if(x1 < p1.x) p1.x = x1;
		if(x2 > p2.x) p2.x = x2;
		if(y2 > p2.y) p2.y = y2;
		p0.y = y2;
		if(this.next == null || this.isBlockEnd) return this;
		return this.next.calcSize(p0,p1,p2);
    }
    paint(position)
	{
		var size = FlowchartSetting.size;
		if(position != null)
		{
			this.x1 = position.x - this.width / 2;
			this.x2 = position.x + this.width / 2;
			this.y1 = position.y;
			this.y2 = this.y1 + this.height;
		}
		flowchart.context.beginPath();
		flowchart.context.moveTo(this.x1, this.y1 + size);
		flowchart.context.lineTo(this.x2, this.y1 - size);
		flowchart.context.lineTo(this.x2, this.y2);
		flowchart.context.lineTo(this.x1, this.y2);
		flowchart.context.lineTo(this.x1, this.y1 + size);
		flowchart.context.stroke();
		flowchart.context.fillText(this.text, this.x1 + size * 2, this.y2 - size);
		if(position != null)
		{
			position.y = this.y2;
			if(this.end.next != null) return this.end.next.paint(position);
			return this.end;
		}
		return this;
	}
	static appendMe(bar)
	{
		var parts = new Parts_Input();
		bar.next = parts;
		parts.next = new Parts_Bar();
		return parts.next;
	}
	appendCode(code, indent)
	{
		code += Parts.makeIndent(indent);
		code += this.var;
		if(this.type > 0) code += "に" + nameOfType[this.type]; 
		code += "を入力する\n";
		if(this.next != null) return this.next.appendCode(code, indent);
		return code;
	}
	editMe()
	{
		var subtitle = ["変数","型"];
		var values = [ this.var, this.type ];
		openModalWindowforInput("入力の編集", subtitle, values, this);
	}
	edited(values)
	{
		if(values != null)
		{
			this.setValue(values[0], values[1]);
		}
		flowchart.paint();
		flowchart.flowchart2code();
	}
}

class Parts_Substitute extends Parts
{
	constructor()
	{
		super();
		this.setValue("《変数》","《値》",null);
	}
	setValue(variable,value,operator)
	{
		this._var = variable;
		this._val = value;
		this._operator = operator

		this._text = this._var + (this._operator ? this._operator : '') + "=" + this._val;
	}
	get var(){return this._var;}
	get val(){return this._val;}
	get operator(){return this._operator;}
	calcSize(p0,p1,p2)
    {
        this.calcTextsize();    // textWidth, textHeightの計算
		var size = FlowchartSetting.size;
        this._height = this._textheight + size * 2;
        this._width = this._textwidth + size * 4;
		var x1 = p0.x - this.width / 2;
		var x2 = p0.x + this.width / 2;
		var y2 = p0.y + this.height;
		if(x1 < p1.x) p1.x = x1;
		if(x2 > p2.x) p2.x = x2;
		if(y2 > p2.y) p2.y = y2;
		p0.y = y2;
		if(this.next == null || this.isBlockEnd) return this;
		return this.next.calcSize(p0,p1,p2);
    }
    paint(position)
	{
		var size = FlowchartSetting.size;
		if(position != null)
		{
			this.x1 = position.x - this.width / 2;
			this.x2 = position.x + this.width / 2;
			this.y1 = position.y;
			this.y2 = this.y1 + this.height;
		}
		flowchart.context.beginPath();
		flowchart.context.moveTo(this.x1, this.y1);
		flowchart.context.lineTo(this.x2, this.y1);
		flowchart.context.lineTo(this.x2, this.y2);
		flowchart.context.lineTo(this.x1, this.y2);
		flowchart.context.lineTo(this.x1, this.y1);
		flowchart.context.stroke();
		flowchart.context.fillText(this.text, this.x1 + size * 2, this.y2 - size);

		if(position != null)
		{
			position.y = this.y2;
			if(this.end.next != null) return this.end.next.paint(position);
			return this.end;
		}
		return this;
	}
	static appendMe(bar)
	{
		var parts = new Parts_Substitute();
		bar.next = parts;
		parts.next = new Parts_Bar();
		return parts.next;
	}
	appendCode(code, indent)
	{
		code += Parts.makeIndent(indent);
		code += this.var + (this.operator ? this.operator : "") + "=" + this.val + "\n";
		if(this.next != null) return this.next.appendCode(code, indent);
		return code;
	}
	editMe()
	{
		var subtitle = ["変数", "値", "演算"];
		var values = [ this.var , this.val, this.operator];
		openModalWindowforSubstitute("代入の編集", subtitle, values, this);
	}
	edited(values)
	{
		if(values != null)
		{
			if(values[2] == "（なし）") values[2] = null;
			this.setValue(values[0], values[1], values[2]);
		}
		flowchart.paint();
		flowchart.flowchart2code();
	}
}

class Parts_Append extends Parts
{
	constructor()
	{
		super();
		this.setValue("《変数》","《値》");
	}
	setValue(variable,value)
	{
		this._var = variable;
		this._val = value;

		this._text = this._var + "に" + this._val + "を追加";
	}
	get var(){return this._var;}
	get val(){return this._val;}
	calcSize(p0,p1,p2)
    {
        this.calcTextsize();    // textWidth, textHeightの計算
		var size = FlowchartSetting.size;
        this._height = this._textheight + size * 2;
        this._width = this._textwidth + size * 4;
		var x1 = p0.x - this.width / 2;
		var x2 = p0.x + this.width / 2;
		var y2 = p0.y + this.height;
		if(x1 < p1.x) p1.x = x1;
		if(x2 > p2.x) p2.x = x2;
		if(y2 > p2.y) p2.y = y2;
		p0.y = y2;
		if(this.next == null || this.isBlockEnd) return this;
		return this.next.calcSize(p0,p1,p2);
    }
    paint(position)
	{
		var size = FlowchartSetting.size;
		if(position != null)
		{
			this.x1 = position.x - this.width / 2;
			this.x2 = position.x + this.width / 2;
			this.y1 = position.y;
			this.y2 = this.y1 + this.height;
		}
		flowchart.context.beginPath();
		flowchart.context.moveTo(this.x1, this.y1);
		flowchart.context.lineTo(this.x2, this.y1);
		flowchart.context.lineTo(this.x2, this.y2);
		flowchart.context.lineTo(this.x1, this.y2);
		flowchart.context.lineTo(this.x1, this.y1);
		flowchart.context.stroke();
		flowchart.context.fillText(this.text, this.x1 + size * 2, this.y2 - size);

		if(position != null)
		{
			position.y = this.y2;
			if(this.end.next != null) return this.end.next.paint(position);
			return this.end;
		}
		return this;
	}
	static appendMe(bar)
	{
		var parts = new Parts_Append();
		bar.next = parts;
		parts.next = new Parts_Bar();
		return parts.next;
	}
	appendCode(code, indent)
	{
		code += Parts.makeIndent(indent);
		code += this.var + "に" + this.val + "を追加する\n";
		if(this.next != null) return this.next.appendCode(code, indent);
		return code;
	}
	editMe()
	{
		var subtitle = ["変数", "値"];
		var values = [ this.var , this.val];
		openModalWindow("追加の編集", subtitle, values, this);
	}
	edited(values)
	{
		if(values != null)
		{
			this.setValue(values[0], values[1]);
		}
		flowchart.paint();
		flowchart.flowchart2code();
	}
}

class Parts_Extend extends Parts
{
	constructor()
	{
		super();
		this.setValue("《変数》","《値》");
	}
	setValue(variable,value)
	{
		this._var = variable;
		this._val = value;

		this._text = this._var + "に" + this._val + "を連結";
	}
	get var(){return this._var;}
	get val(){return this._val;}
	calcSize(p0,p1,p2)
    {
        this.calcTextsize();    // textWidth, textHeightの計算
		var size = FlowchartSetting.size;
        this._height = this._textheight + size * 2;
        this._width = this._textwidth + size * 4;
		var x1 = p0.x - this.width / 2;
		var x2 = p0.x + this.width / 2;
		var y2 = p0.y + this.height;
		if(x1 < p1.x) p1.x = x1;
		if(x2 > p2.x) p2.x = x2;
		if(y2 > p2.y) p2.y = y2;
		p0.y = y2;
		if(this.next == null || this.isBlockEnd) return this;
		return this.next.calcSize(p0,p1,p2);
    }
    paint(position)
	{
		var size = FlowchartSetting.size;
		if(position != null)
		{
			this.x1 = position.x - this.width / 2;
			this.x2 = position.x + this.width / 2;
			this.y1 = position.y;
			this.y2 = this.y1 + this.height;
		}
		flowchart.context.beginPath();
		flowchart.context.moveTo(this.x1, this.y1);
		flowchart.context.lineTo(this.x2, this.y1);
		flowchart.context.lineTo(this.x2, this.y2);
		flowchart.context.lineTo(this.x1, this.y2);
		flowchart.context.lineTo(this.x1, this.y1);
		flowchart.context.stroke();
		flowchart.context.fillText(this.text, this.x1 + size * 2, this.y2 - size);

		if(position != null)
		{
			position.y = this.y2;
			if(this.end.next != null) return this.end.next.paint(position);
			return this.end;
		}
		return this;
	}
	static appendMe(bar)
	{
		var parts = new Parts_Append();
		bar.next = parts;
		parts.next = new Parts_Bar();
		return parts.next;
	}
	appendCode(code, indent)
	{
		code += Parts.makeIndent(indent);
		code += this.var + "に" + this.val + "を連結する\n";
		if(this.next != null) return this.next.appendCode(code, indent);
		return code;
	}
	editMe()
	{
		var subtitle = ["変数", "値"];
		var values = [ this.var , this.val];
		openModalWindow("追加の編集", subtitle, values, this);
	}
	edited(values)
	{
		if(values != null)
		{
			this.setValue(values[0], values[1]);
		}
		flowchart.paint();
		flowchart.flowchart2code();
	}
}

class Parts_If extends Parts
{
	constructor()
	{
		super();
		this.setValue("《条件》");
		this.left = this.right = null;
		this.left_bar_expand = this.right_bar_expand = 0;
	}
	setValue(cond)
	{
		this._cond = cond;
		this._text = this._cond;
	}
	get condition(){return this._cond;}
	get end(){return this.next;}

	calcTextsize()
    {
        if(this.text != null && this.text != "")
        {
			var size = FlowchartSetting.size;
            var metrics = flowchart.context.measureText(this.text);
			this._hspace = 0;
            this._textwidth = metrics.width;
			if(this._textwidth < size * 6)
			{
				this._hspace = (size * 6 - this._textwidth) / 2;
				this._textwidth = size * 6;
			}
            this._textheight = FlowchartSetting.fontsize;
        }
    }

	calcSize(p0,p1,p2)
    {
        this.calcTextsize();    // textWidth, textHeightの計算
		var size = FlowchartSetting.size;
//		if(this._textwidth < size * 6) this._textwidth = size * 6;
//		if(this._textheight < size * 2) this._textheight = size * 2;
		this.v_margin = size * 2;
		this.h_margin = this.textWidth * this.textHeight / this.v_margin / 4;
        this._height = this.textHeight + this.v_margin * 2;
        this._width = this.textWidth + this.h_margin * 2;
		var x1 = p0.x - this.width / 2;
		var x2 = p0.x + this.width / 2;
		// 左枝
		var pl = new point(); pl.x = x1; pl.y = p0.y;
		var pl1 = pl.clone(), pl2 = pl.clone();
		this.left.calcSize(pl, pl1, pl2);
		this.left_bar_expand = (pl2.x - pl.x); // - this.width / 2;
		if(this.left_bar_expand < size) this.left_bar_expand = size;
		pl1.x -= this.left_bar_expand;
		pl2.x -= this.left_bar_expand;
		if(pl1.x < p1.x) p1.x = pl1.x;
		if(pl1.y > p1.y) p1.y = pl1.y;
		if(pl2.y > p1.y) p1.y = pl2.y;

		// 右枝
		var pr = new point(); pr.x = x2; pr.y = p0.y;
		var pr1 = pr.clone(), pr2 = pr.clone();
		this.right.calcSize(pr, pr1, pr2);
		this.right_bar_expand = (pr.x - pr1.x); // - this.width / 2;
		if(this.right_bar_expand < size) this.right_bar_expand = size;
		pr1.x += this.right_bar_expand;
		pr2.x += this.right_bar_expand;
		if(pr2.x > p2.x) p2.x = pr2.x;
		if(pr1.y > p2.y) p2.y = pr1.y;
		if(pr2.y > p2.y) p2.y = pr2.y;
		// 左枝と右枝がぶつかっていたら，右枝をちょっと伸ばす
		if(pr1.x < pl2.x + size)
		{
			this.right_bar_expand += pl2.x - pr1.x + size;
			p2.x += pl2.x - pr1.x + size;
		}
		return this.end.next.calcSize(p0,p1,p2);
    }
    paint(position)
	{
		var size = FlowchartSetting.size;
		if(position != null)
		{
			this.x1 = position.x - this.width / 2;
			this.x2 = position.x + this.width / 2;
			this.y1 = position.y;
			this.y2 = this.y1 + this.height;
		}
		var x0 = (this.x1 + this.x2) / 2, y0 = (this.y1 + this.y2) / 2;
		flowchart.context.beginPath();
		flowchart.context.moveTo(x0, this.y1);
		flowchart.context.lineTo(this.x1, y0);
		flowchart.context.lineTo(x0, this.y2);
		flowchart.context.lineTo(this.x2, y0);
		flowchart.context.lineTo(x0, this.y1);
		flowchart.context.stroke();
		flowchart.context.fillText(this.text, x0 - this.textWidth / 2 + this.hspace,
			y0 + this.textHeight / 2);

		if(position != null)
		{
			// 左側
			flowchart.context.beginPath();
			flowchart.context.moveTo(this.x1, y0);
			flowchart.context.lineTo(this.x1 - this.left_bar_expand, y0);
			flowchart.context.stroke();
			flowchart.context.fillText('Y', this.x1 - size * 1, y0 - size);
			var left_parts = this.left.paint({x:this.x1 - this.left_bar_expand, y:y0}).prev;
			// 右側
			flowchart.context.beginPath();
			flowchart.context.moveTo(this.x2, y0);
			flowchart.context.lineTo(this.x2 + this.right_bar_expand, y0);
			flowchart.context.stroke();
			flowchart.context.fillText('N', this.x2 + size * 0, y0 - size);
			var right_parts = this.right.paint({x:this.x2 + this.right_bar_expand, y:y0}).prev;
			// 線の下の部分
			var y; 
			if(left_parts.y2 > right_parts.y2)
			{
				y = left_parts.y2;
				flowchart.context.beginPath();
				flowchart.context.moveTo(this.x2 + this.right_bar_expand, right_parts.y2);
				flowchart.context.lineTo(this.x2 + this.right_bar_expand, y);
				flowchart.context.stroke();
				right_parts.y2 = y;
			}
			else
			{
				y = right_parts.y2;
				flowchart.context.beginPath();
				flowchart.context.moveTo(this.x1 - this.left_bar_expand, left_parts.y2);
				flowchart.context.lineTo(this.x1 - this.left_bar_expand, y);
				flowchart.context.stroke();
				left_parts.y2 = y;
			}
			flowchart.context.beginPath();
			flowchart.context.moveTo(this.x1 - this.left_bar_expand, y);
			flowchart.context.lineTo(this.x2 + this.right_bar_expand, y);
			flowchart.context.stroke();
			position.y = y;
			if(this.end.next != null) return this.end.next.paint(position);
//			return this.end;
		}
		return this.end.next;
	}
	static appendMe(bar)
	{
		var parts = new Parts_If();
		bar.next = parts;
		parts.next = new Parts_Null();
		parts.next.next = new Parts_Bar();
		parts.left = new Parts_Bar();
		parts.left._prev = parts;
		parts.left.next = new Parts_Null();
		parts.right = new Parts_Bar();
		parts.right._prev = parts;
		parts.right.next = new Parts_Null();

		return parts.end.next.next;
	}
	appendCode(code, indent)
	{
		code += Parts.makeIndent(indent);
		code += "もし" + this.condition + "ならば：\n";
		if(this.left.next instanceof Parts_Null) code += Parts.makeIndent(indent + 1) + "\n";
		else code += this.left.appendCode('', indent + 1);
		if(!(this.right.next instanceof Parts_Null))
		{
			code += Parts.makeIndent(indent) + "そうでなければ：\n"
			code += this.right.appendCode('', indent + 1);
		}

		if(this.end.next != null) return this.end.next.appendCode(code, indent);
		return code;
	}
	editMe()
	{
		var subtitle = ["条件"];
		var values = [ this.condition ];
		openModalWindow("分岐の編集", subtitle, values, this);
	}
	edited(values)
	{
		if(values != null)
		{
			this.setValue(values[0]);
		}
		flowchart.paint();
		flowchart.flowchart2code();
	}
}

class Parts_LoopBegin extends Parts
{
	get hasText(){return false;}
	get end(){return this._end;}
	calcTextsize()
    {
        if(this.hasText)
        {
			var size = FlowchartSetting.size;
			this._textwidth = size * 6;
			this._hspace = this._hspace2 = 0;
			var tw = flowchart.context.measureText(this.text).width;
			if(tw > this._textwidth) this._textwidth = tw;
			if(tw < this._textwidth) this._hspace = (this._textwidth - tw) / 2;
			if(this.text2)
			{
				var tw2 = flowchart.context.measureText(this.text2).width;
				if(tw2 > this._textwidth) this._textwidth = tw2;
				if(tw < this._textwidth) this._hspace = (this._textwidth - tw) / 2;
				if(tw2 < this._textwidth) this._hspace2 = (this._textwidth - tw2) / 2;
			}
            this._textheight = FlowchartSetting.fontsize;
        }
		else
		{
			this.end.calcTextsize();
			this._textwidth = this.end.textWidth;
			this._textheight = this.end.textHeight;
		}
    }
	calcSize(p0,p1,p2)
    {
        this.calcTextsize();    // textWidth, textHeightの計算
		var size = FlowchartSetting.size;

        this._height = this.textHeight * (this.hasText && this.text2 ? 2 : 1) + size * 2;
        this._width = this.textWidth + size * 2;
		var x1 = p0.x - this.width / 2;
		var x2 = p0.x + this.width / 2;
		var y2 = p0.y + this.height;
		if(x1 < p1.x) p1.x = x1;
		if(x2 > p2.x) p2.x = x2;
		if(y2 > p2.y) p2.y = y2;
		p0.y = y2;
		var n = this.next;
		while(n != this.end) n = n.calcSize(p0, p1, p2);
//		this.next.calcSize(p0,p1,p2);
		return this.end.next.calcSize(p0,p1,p2);
    }
	paint(position)
	{
		var size = FlowchartSetting.size;
		if(position != null)
		{
			this.x1 = position.x - this.width / 2;
			this.x2 = position.x + this.width / 2;
			this.y1 = position.y;
			this.y2 = this.y1 + this.height;
		}
		flowchart.context.beginPath();
		flowchart.context.moveTo(this.x1 + size, this.y1);
		flowchart.context.lineTo(this.x2 - size, this.y1);
		flowchart.context.lineTo(this.x2, this.y1 + size);
		flowchart.context.lineTo(this.x2, this.y2);
		flowchart.context.lineTo(this.x1, this.y2);
		flowchart.context.lineTo(this.x1, this.y1 + size);
		flowchart.context.lineTo(this.x1 + size, this.y1);
		flowchart.context.stroke();
		if(this.hasText)
		{
			flowchart.context.fillText(this.text, this.x1 + size + this.hspace, this.y1 + size + this.textHeight);
			if(this.text2)
				flowchart.context.fillText(this.text2, this.x1 + size + this.hspace2, this.y1 + size + this.textHeight * 2);
		}

		if(position != null)
		{
			position.y = this.y2;
			this.next.paint(position);
			return this.end.next.paint(position);;
		}
		return this;
	}
	deleteMe()
	{
		this.prev._next = this.end.next.next;
		this.end.next.next._prev = this.prev;
		this.end._next = null;
		this._next = null;
	}
	highlight()
	{
		this.paint_highlight();
		this.end.paint_highlight();
	}
	unhighlight()
	{
		this.paint_unhighlight();
		this.end.paint_unhighlight();
	}


}

class Parts_LoopBegin1 extends Parts_LoopBegin
{
	get hasText(){return true;}
	constructor()
	{
		super();
		this.setValue("《条件》");
	}
	setValue(cond)
	{
		this._cond = cond;
		this._text = this._cond;
	}
	get condition(){return this._cond;}
	get text2(){return "の間";}

	static appendMe(bar)
	{
		var parts = new Parts_LoopBegin1();
		bar.next = parts;
		parts.next = new Parts_Bar();
		parts.next.next = new Parts_LoopEnd();
		parts.next.next.next = new Parts_Bar();
		parts._end = parts.next.next;
		parts.next.next._begin = parts;

		return parts.end;
	}

	appendCode(code, indent)
	{
		code += Parts.makeIndent(indent);
		code += this.condition + "の間：\n";
		var code_inner = this.next.appendCode('', indent + 1);
		if(code_inner == '') code += Parts.makeIndent(indent + 1) + "\n";
		else code += code_inner;

		if(this.end.next != null) return this.end.next.appendCode(code, indent);
		return code;
	}

	editMe()
	{
		var subtitle = ["条件（〜の間）"];
		var values = [ this.condition ];
		openModalWindow("繰り返しの編集", subtitle, values, this);
	}
	edited(values)
	{
		if(values != null)
		{
			this.setValue(values[0]);
		}
		flowchart.paint();
		flowchart.flowchart2code();
	}
}

class Parts_LoopBeginFor extends Parts_LoopBegin
{
	get hasText(){return true;}
	constructor()
	{
		super();
		this.setValue("《配列》","《変数》");
	}
	setValue(array, variable)
	{
		this.array = array;
		this.variable = variable;
		this._text = this.variable + ':' + this.array;
	}
	get text2(){return null;}
	static appendMe(bar)
	{
		var parts = new Parts_LoopBeginFor();
		bar.next = parts;
		parts.next = new Parts_Bar();
		parts.next.next = new Parts_LoopEnd();
		parts.next.next.next = new Parts_Bar();
		parts._end = parts.next.next;
		parts.next.next._begin = parts;

		return parts.end;
	}

	appendCode(code, indent)
	{
		code += Parts.makeIndent(indent);
		code += this.array +"の要素" + this.variable + "について繰り返す：\n";
		var code_inner = this.next.appendCode('', indent + 1);
		if(code_inner == '') code += Parts.makeIndent(indent + 1) + "\n";
		else code += code_inner;

		if(this.end.next != null) return this.end.next.appendCode(code, indent);
		return code;
	}

	editMe()
	{
		var subtitle = ["配列","変数"];
		var values = [ this.array, this.variable];
		openModalWindow("繰り返しの編集", subtitle, values, this);
	}
	edited(values)
	{
		if(values != null)
		{
			this.setValue(values[0], values[1]);
		}
		flowchart.paint();
		flowchart.flowchart2code();
	}
}


class Parts_LoopBeginInc extends Parts_LoopBegin
{
	get hasText(){return true;}
	constructor()
	{
		super();
		this.setValue("《変数》","《値》","《値》","《値》");
	}
	setValue(variable, start, goal, step)
	{
		this._var = variable;
		this._start = start;
		this._goal = goal;
		this._step = step;
		this._text = this.var + ':' + this.start + "→" + this.goal;
	}
	get var(){return this._var;}
	get start(){return this._start;}
	get goal(){return this._goal;}
	get step(){return this._step;}
	get text2(){return this.step + "ずつ増";}

	static appendMe(bar)
	{
		var parts = new Parts_LoopBeginInc();
		bar.next = parts;
		parts.next = new Parts_Bar();
		parts.next.next = new Parts_LoopEnd();
		parts.next.next.next = new Parts_Bar();
		parts._end = parts.next.next;
		parts.next.next._begin = parts;

		return parts.end;
	}

	appendCode(code, indent)
	{
		code += Parts.makeIndent(indent);
		code += this.var +"を" + this.start + "から" + this.goal + "まで" + this.step + "ずつ増やしながら：\n";
		var code_inner = this.next.appendCode('', indent + 1);
		if(code_inner == '') code += Parts.makeIndent(indent + 1) + "\n";
		else code += code_inner;

		if(this.end.next != null) return this.end.next.appendCode(code, indent);
		return code;
	}

	editMe()
	{
		var subtitle = ["変数","〜から","〜まで","増加分"];
		var values = [ this.var, this.start, this.goal, this.step ];
		openModalWindow("繰り返しの編集", subtitle, values, this);
	}
	edited(values)
	{
		if(values != null)
		{
			this.setValue(values[0], values[1], values[2], values[3]);
		}
		flowchart.paint();
		flowchart.flowchart2code();
	}
}

class Parts_LoopBeginDec extends Parts_LoopBegin
{
	get hasText(){return true;}
	constructor()
	{
		super();
		this.setValue("《変数》","《値》","《値》","《値》");
	}
	setValue(variable, start, goal, step)
	{
		this._var = variable;
		this._start = start;
		this._goal = goal;
		this._step = step;
		this._text = this.var + ':' + this.start + "→" + this.goal;
	}
	get var(){return this._var;}
	get start(){return this._start;}
	get goal(){return this._goal;}
	get step(){return this._step;}
	get text2(){return this.step + "ずつ減";}

	static appendMe(bar)
	{
		var parts = new Parts_LoopBeginDec();
		bar.next = parts;
		parts.next = new Parts_Bar();
		parts.next.next = new Parts_LoopEnd();
		parts.next.next.next = new Parts_Bar();
		parts._end = parts.next.next;
		parts.next.next._begin = parts;

		return parts.end;
	}

	appendCode(code, indent)
	{
		code += Parts.makeIndent(indent);
		code += this.var +"を" + this.start + "から" + this.goal + "まで" + this.step + "ずつ減らしながら：\n";
		var code_inner = this.next.appendCode('', indent + 1);
		if(code_inner == '') code += Parts.makeIndent(indent + 1) + "\n";
		else code += code_inner;

		if(this.end.next != null) return this.end.next.appendCode(code, indent);
		return code;
	}

	editMe()
	{
		var subtitle = ["変数","〜から","〜まで","減少分"];
		var values = [ this.var, this.start, this.goal, this.step ];
		openModalWindow("繰り返しの編集", subtitle, values, this);
	}
	edited(values)
	{
		if(values != null)
		{
			this.setValue(values[0], values[1], values[2], values[3]);
		}
		flowchart.paint();
		flowchart.flowchart2code();
	}
}


class Parts_LoopEnd extends Parts
{
	get hasText(){return false;}
	get begin(){return this._begin;}
	get isBlockEnd(){return true;}
	editMe()
	{
		this.begin.editMe();
	}
	calcTextsize()
    {
        if(this.hasText)
        {
			var size = FlowchartSetting.size;
			this._textwidth = size * 6;
			this._hspace = this._hspace2 = 0;
			var tw = flowchart.context.measureText(this.text).width;
			if(tw > this._textwidth) this._textwidth = tw;
			var tw2 = flowchart.context.measureText(this.text2).width;
			if(tw2 > this._textwidth) this._textwidth = tw2;
			if(tw < this._textwidth) this._hspace = (this._textwidth - tw) / 2;
			if(tw2 < this._textwidth) this._hspace2 = (this._textwidth - tw2) / 2;
            this._textheight = FlowchartSetting.fontsize;
            this._textheight = FlowchartSetting.fontsize;
        }
		else
		{
			this._textwidth = this.begin.textWidth;
			this._textheight = this.begin.textHeight;
		}
    }
	calcSize(p0,p1,p2)
    {
        this.calcTextsize();    // textWidth, textHeightの計算
		var size = FlowchartSetting.size;

		this._height = this.textHeight * (this.hasText ? 2 : 1) + size * 2;
        this._width = this.textWidth + size * 2;
		var x1 = p0.x - this.width / 2;
		var x2 = p0.x + this.width / 2;
		var y2 = p0.y + this.height;
		if(x1 < p1.x) p1.x = x1;
		if(x2 > p2.x) p2.x = x2;
		if(y2 > p2.y) p2.y = y2;
		p0.y = y2;
		return this; // isBlockEnd is true.
    }
	paint(position)
	{
		var size = FlowchartSetting.size;
		if(position != null)
		{
			this.x1 = position.x - this.width / 2;
			this.x2 = position.x + this.width / 2;
			this.y1 = position.y;
			this.y2 = this.y1 + this.height;
		}
		flowchart.context.beginPath();
		flowchart.context.moveTo(this.x1, this.y1);
		flowchart.context.lineTo(this.x2, this.y1);
		flowchart.context.lineTo(this.x2, this.y2 - size);
		flowchart.context.lineTo(this.x2 - size, this.y2);
		flowchart.context.lineTo(this.x1 + size, this.y2);
		flowchart.context.lineTo(this.x1, this.y2 - size);
		flowchart.context.lineTo(this.x1, this.y1);
		flowchart.context.stroke();
		if(this.hasText)
		{
			flowchart.context.fillText(this.text, this.x1 + size + this.hspace, this.y1 + size + this.textHeight);
			flowchart.context.fillText(this.text2, this.x1 + size + this.hspace2, this.y1 + size + this.textHeight * 2);
		}

		if(position != null)
		{
			position.y = this.y2;
		}
		return this;
	}
	appendCode(code, indent)
	{
		return code;
	}
	editMe()
	{
//		this.highlight();
		this.begin.editMe();
	}
	deleteMe()
	{
		this.begin.deleteMe();
	}
	cutMe()
	{
		this.begin.cutMe();
	}
	highlight()
	{
		this.paint_highlight();
		this.begin.paint_highlight();
	}
	unhighlight()
	{
		this.paint_unhighlight();
		this.begin.paint_unhighlight();
	}
}


var misc_menu_ja =[
	//表示            識別子            プログラム上の表現            [引数の意味]
	["《各種処理》"  , "none"           , "《各種処理》"              ,[]],
	["何もしない"	,	"NopStatement"	,"何もしない"					,[]],
	["描画領域開く"  , "gOpenWindow"    , "描画領域開く(	,	)"       ,["幅","高さ"]],
	["描画領域閉じる", "gCloseWindow"   , "描画領域閉じる()"           ,[]],
	["描画領域全消去", "gClearWindow"   , "描画領域全消去()"           ,[]],
	["線色設定"     , "gSetLineColor"  , "線色設定(	,	,	)"         ,["赤","青","緑"]],
	["塗色設定"     , "gSetFillColor"  , "塗色設定(	,	,	)"         ,["赤","青","緑"]],
	["文字色設定"     , "gSetTextColor"  , "文字色設定(	,	,	)"         ,["赤","青","緑"]],
	["線太さ設定"   , "gSetLineWidth"   , "線太さ設定(	)"            ,["太さ"]],
	["文字サイズ設定", "gSetFontSize"   , "文字サイズ設定(	)"         ,["サイズ"]],
	["文字描画"     , "gDrawText"      , "文字描画(	,	,	)"        ,["文字列","x","y"]],
	["点描画"       , "gDrawPoint"      , "点描画(	,	,	,	)"        ,["x","y"]],
	["線描画"       , "gDrawLine"      , "線描画(	,	,	,	)"        ,["x1","y1","x2","y2"]],
	["矩形描画"     , "gDrawBox"       , "矩形描画(	,	,	,	)"      ,["x","y","幅","高さ"]],
	["矩形塗描画"   , "gFillBox"       , "矩形塗描画(	,	,	,	)"    ,["x","y","幅","高さ"]],
	["円描画"      , "gDrawCircle"     , "円描画(	,	,	)"          ,["x","y","半径"]],
	["円塗描画"     , "gFillCircle"    , "円塗描画(	,	,	)"        ,["x","y","半径"]],
	["楕円描画"      , "gDrawCircle"     , "楕円描画(	,	,	,	)"          ,["x","y","幅","高さ"]],
	["楕円塗描画"      , "gFillCircle"     , "楕円塗描画(	,	,	,	)"          ,["x","y","幅","高さ"]],
	["弧描画"      , "gDrawArc"     , "弧描画(	,	,	,	,	,	,	)"          ,["x","y","幅","高さ","開始角","終了角","閉じ方"]],
	["弧塗描画"      , "gFillArc"     , "弧塗描画(	,	,	,	,	,	,	)"          ,["x","y","幅","高さ","開始角","終了角","閉じ方"]],
	["棒グラフ描画" , "gBarplot"		,"棒グラフ描画(	,	,	)"		,["幅","高さ","配列"]],
	["線グラフ描画" , "gLineplot"		,"線グラフ描画(	,	,	)"		,["幅","高さ","配列"]],
	["グラフ描画"	, "gDrawGraph"		,"グラフ描画(	,	)"			,["レイアウト情報","値の配列"]],
	["グラフ消去"	, "gClearGraph"		,"グラフ消去()"					,[]],
	["putline"		, "putline"			,"putline(	,	)"				,["ファイル番号","文字列"]],
	["putstr"		, "putstr"			,"putstr(	,	)"				,["ファイル番号","文字列"]],
	["close"		, "close"			,"close(	)"					,["ファイル番号"]],
	["待つ"       , "sleep"           , "	ミリ秒待つ"                 ,["ミリ秒数"]],
	["繰り返しを抜ける","break"			,"繰り返しを抜ける",[]],
	["変数を確認する", "dump"			,"変数を確認する",[]],
	["一時停止する", "PauseStatement", "一時停止する",[]]
],
misc_menu_en = [
	//表示            識別子            プログラム上の表現            [引数の意味]
	["《各種処理》"  , "none"           , "《各種処理》"              ,[]],
	["何もしない"	,	"NopStatement"	,"何もしない"					,[]],
	["gOpenWindow"  , "gOpenWindow"    , "gOpenWindow(	,	)"       ,["幅","高さ"]],
	["gCloseWindow", "gCloseWindow"   , "gCloseWindow()"           ,[]],
	["gClearWindow", "gClearWindow"   , "gClearWindow()"           ,[]],
	["gSetLineColor"     , "gSetLineColor"  , "gSetLineColor(	,	,	)"         ,["赤","青","緑"]],
	["gSetFillColor"     , "gSetFillColor"  , "gSetFillColor(	,	,	)"         ,["赤","青","緑"]],
	["gSetTextColor"     , "gSetTextColor"  , "gSetTextColor(	,	,	)"         ,["赤","青","緑"]],
	["gSetLineWidth"   , "gSetLineWidth"   , "gSetLineWidth(	)"            ,["太さ"]],
	["gSetFontSize", "gSetFontSize"   , "gSetFontSize(	)"         ,["サイズ"]],
	["gDrawText"     , "gDrawText"      , "gDrawText(	,	,	)"        ,["文字列","x","y"]],
	["gDrawPoint"       , "gDrawPoint"      , "gDrawPoint(	,	,	,	)"        ,["x","y"]],
	["gDrawLine"       , "gDrawLine"      , "gDrawLine(	,	,	,	)"        ,["x1","y1","x2","y2"]],
	["gDrawBox"     , "gDrawBox"       , "gDrawBox(	,	,	,	)"      ,["x","y","幅","高さ"]],
	["gFillBox"   , "gFillBox"       , "gFillBox(	,	,	,	)"    ,["x","y","幅","高さ"]],
	["gDrawCircle"      , "gDrawCircle"   , "gDrawCicle(	,	,	)"          ,["x","y","半径"]],
	["gFillCircle"     , "gFillCircle"    , "gFillCircle(	,	,	)"        ,["x","y","半径"]],
	["gDrawOval"      , "gDrawCircle"     , "gDrawOval(	,	,	,	)"          ,["x","y","幅","高さ"]],
	["gFillOval"      , "gFillCircle"     , "gFillOval(	,	,	,	)"          ,["x","y","幅","高さ"]],
	["gDrawArc"      , "gDrawArc"     , "gDrawArc(	,	,	,	,	,	,	)"          ,["x","y","幅","高さ","開始角","終了角","閉じ方"]],
	["gFillArc"      , "gFillArc"     , "gFillArc(	,	,	,	,	,	,	)"          ,["x","y","幅","高さ","開始角","終了角","閉じ方"]],
	["gBarplot" , "gBarplot"		,"gBarplot(	,	,	)"		,["幅","高さ","値"]],
	["gLineplot" , "gLineplot"		,"gLineplot(	,	,	)"		,["幅","高さ","値"]],
	["gDrawGraph"	, "gDrawGraph"		,"gDrawGraph(	,	)"			,["レイアウト情報","値の配列"]],
	["gClearGraph"	, "gClearGraph"		,"gClearGraph()",				,[]],
	["putline"		, "putline"			,"putline(	,	)"				,["ファイル番号","文字列"]],
	["putstr"		, "putstr"			,"putstr(	,	)"				,["ファイル番号","文字列"]],
	["close"		, "close"			,"close(	)"					,["ファイル番号"]],
	["待つ"       , "sleep"           , "	ミリ秒待つ"                 ,["ミリ秒数"]],
	["繰り返しを抜ける","break"			,"繰り返しを抜ける",[]],
	["変数を確認する", "dump"			,"変数を確認する",[]],
	["一時停止する", "PauseStatement", "一時停止する",[]]
];

var misc_menu = setting.graphic_command == 0 ? misc_menu_ja : misc_menu_en;

class Parts_Misc extends Parts
{
	constructor()
	{
		super();
		this.setValue("none", []);
	}
	setValue(identifier, values)
	{
		this._identifier = identifier;
		this._values = [];
		for(var i = 0; i < values.length; i++) this._values.push(values[i].getCode());
		for(var i = 0; i < misc_menu.length; i++)
		{
			if(this._identifier != misc_menu[i][1]) continue;
			this._command = misc_menu[i][0];
			var code = misc_menu[i][2];
			for(var j = 0; j < this.values.length; j++)
				code = code.replace("\t",this.values[j]);
			this._text = code;
			break;
		}
	}

	setValuebyText(identifier, values)
	{
		this._identifier = identifier;
		this._values = [];
		for(var i = 0; i < values.length; i++) this._values.push(values[i]);
		for(var i = 0; i < misc_menu.length; i++)
		{
			if(this._identifier != misc_menu[i][1]) continue;
			this._command = misc_menu[i][0];
			var code = misc_menu[i][2];
			for(var j = 0; j < this.values.length; j++)
				code = code.replace("\t",this.values[j]);
			this._text = code;
			break;
		}
	}

	get identifier(){return this._identifier;}
	get values(){return this._values;}

	calcSize(p0,p1,p2)
    {
        this.calcTextsize();    // textWidth, textHeightの計算
		var size = FlowchartSetting.size;
        this._height = this._textheight + size * 2;
        this._width = this._textwidth + size * 4;
		var x1 = p0.x - this.width / 2;
		var x2 = p0.x + this.width / 2;
		var y2 = p0.y + this.height;
		if(x1 < p1.x) p1.x = x1;
		if(x2 > p2.x) p2.x = x2;
		if(y2 > p2.y) p2.y = y2;
		p0.y = y2;
		if(this.next == null || this.isBlockEnd) return this;
		return this.next.calcSize(p0,p1,p2);
    }
    paint(position)
	{
		var size = FlowchartSetting.size;
		if(position != null)
		{
			this.x1 = position.x - this.width / 2;
			this.x2 = position.x + this.width / 2;
			this.y1 = position.y;
			this.y2 = this.y1 + this.height;
		}
		flowchart.context.beginPath();
		flowchart.context.moveTo(this.x1, this.y1);
		flowchart.context.lineTo(this.x2, this.y1);
		flowchart.context.lineTo(this.x2, this.y2);
		flowchart.context.lineTo(this.x1, this.y2);
		flowchart.context.lineTo(this.x1, this.y1);
		flowchart.context.stroke();
		flowchart.context.fillText(this.text, this.x1 + size * 2, this.y2 - size);

		if(position != null)
		{
			position.y = this.y2;
			if(this.end.next != null) return this.end.next.paint(position);
			return this.end;
		}
		return this;
	}
	static appendMe(bar)
	{
		var parts = new Parts_Misc();
		bar.next = parts;
		parts.next = new Parts_Bar();
		return parts.next;
	}
	appendCode(code, indent)
	{
		code += Parts.makeIndent(indent);
		code += this.text + "\n";
		if(this.next != null) return this.next.appendCode(code, indent);
		return code;
	}
	editMe()
	{
		openModalWindowforMisc(this);
	}
	edited(identifier, values)
	{
		if(values != null)
		{
			this.setValuebyText(identifier, values);
		}
		flowchart.paint();
		flowchart.flowchart2code();
	}

}

/* 編集ダイアログ */

var modal_title,modal_subtitle,modal_values,modal_parts;

function openModalWindow(title, subtitle, values, parts)
{
	var html = "<p>" + title + "</p>";
	modal_subtitle = subtitle;
	modal_values = values;
	modal_parts = parts;
	html += "<table>";
	for(var i = 0; i < modal_subtitle.length; i++)
		html += "<tr><td>" + subtitle[i] + "</td><td><input type=\"text\" " +
			"id=\"inputarea" + i + "\" value=\"" + values[i].replace(/\"/g,"&quot;") + "\" " +
			"onfocus=\"select();\" "+
			"onkeydown=\"keydownModal(event);\" spellcheck=\"false\"></td></tr>";
	html += "</table>";
	html += "<button type=\"button\" onclick=\"closeModalWindow(true);\">OK</button>";
	html += "<button type=\"button\" onclick=\"closeModalWindow(false);\">キャンセル</button>";
	modal_parts.highlight();
	$("#input").html(html);
	$("#input").height(100 + subtitle.length * 30);
	$("#input-overlay").fadeIn();
	$("#input").fadeIn();
	$("#inputarea0").focus();
}

function openModalWindowforSubstitute(title, subtitle, values, parts)
{
	var operator= values[2] ? values[2] : "（なし）";
	var operators = ["（なし）", '+','-','*','/','//','%','&','|','<<','>>'];
	var html = "<p>" + title + "</p>";
	modal_subtitle = subtitle;
	modal_values = values;
	modal_parts = parts;
	html += "<table>";
	html += "<tr><td>" + subtitle[0] + "</td><td><input type=\"text\" " +
		"id=\"inputarea0\" value=\"" + values[0].replace(/\"/g,"&quot;") + "\" " +
		"onfocus=\"select();\" "+
		"onkeydown=\"keydownModal(event);\" spellcheck=\"false\"></td></tr>";
	html += "<tr><td>" + subtitle[1] + "</td><td><input type=\"text\" " +
		"id=\"inputarea1\" value=\"" + values[1].replace(/\"/g,"&quot;") + "\" " +
		"onfocus=\"select();\" "+
		"onkeydown=\"keydownModal(event);\" spellcheck=\"false\"></td></tr>";

	html += "<tr><td>" + subtitle[2] + "</td><td><select id=\"inputarea2\">";
	for(var i = 0; i <= operators.length; i++)
		html += "<option value=\"" + operators[i] + "\"" +(operator == operators[i] ? "selected=\"selected\"" : "" ) +">" + operators[i] + "</option>";
	html += "</td></tr>";
	html += "</table>";
	html += "<button type=\"button\" onclick=\"closeModalWindow(true);\">OK</button>";
	html += "<button type=\"button\" onclick=\"closeModalWindow(false);\">キャンセル</button>";
	modal_parts.highlight();
	$("#input").html(html);
	$("#input").height(100 + subtitle.length * 40);
	$("#input-overlay").fadeIn();
	$("#input").fadeIn();
	$("#inputarea0").focus();
}

function openModalWindowforInput(title, subtitle, values, parts)
{
	var html = "<p>" + title + "</p>";
	modal_subtitle = subtitle;
	modal_values = values;
	modal_parts = parts;
	html += "<table>";
	html += "<tr><td>" + subtitle[0] + "</td><td><input type=\"text\" " +
		"id=\"inputarea0\" value=\"" + values[0].replace(/\"/g,"&quot;") + "\" " +
		"onfocus=\"select();\" "+
		"onkeydown=\"keydownModal(event);\" spellcheck=\"false\"></td></tr>";
	html += "<tr><td>" + subtitle[1] + "</td><td><select id=\"inputarea1\">";
	for(var i = typeOfValue.typeInt; i <= typeOfValue.typeBoolean; i++)
		html += "<option value=\"" + i + "\"" +(i == values[1] ? "selected=\"selected\"" : "" ) +">" + nameOfType[i] + "</option>";
	html += "</td></tr>";
	html += "</table>";
	html += "<button type=\"button\" onclick=\"closeModalWindow(true);\">OK</button>";
	html += "<button type=\"button\" onclick=\"closeModalWindow(false);\">キャンセル</button>";
	modal_parts.highlight();
	$("#input").html(html);
	$("#input").height(100 + subtitle.length * 40);
	$("#input-overlay").fadeIn();
	$("#input").fadeIn();
	$("#inputarea0").focus();
}


function openModalWindowforOutput(title, subtitle, values, parts)
{
	var html = "<p>" + title + "</p>";
	modal_subtitle = subtitle;
	modal_values = values;
	modal_parts = parts;
	html += "<table>";
	html += "<tr><td>" + subtitle[0] + "</td><td><input type=\"text\" " +
		"id=\"inputarea0\" value=\"" + values[0].replace(/\"/g,"&quot;") + "\" " +
		"onfocus=\"select();\" "+
		"onkeydown=\"keydownModal(event);\" spellcheck=\"false\"></td></tr>";
	html += "<tr><td></td><td><input type=\"checkbox\" " +
		"id=\"inputarea1\"" + (values[1] ? " checked=\"checked\"" : "") + ">改行する</td></tr>";
	html += "</table>";
	html += "<button type=\"button\" onclick=\"closeModalWindow(true);\">OK</button>";
	html += "<button type=\"button\" onclick=\"closeModalWindow(false);\">キャンセル</button>";
	modal_parts.highlight();
	$("#input").html(html);
	$("#input").height(100 + subtitle.length * 40);
	$("#input-overlay").fadeIn();
	$("#input").fadeIn();
	$("#inputarea0").focus();
}


function closeModalWindow(ok)
{
	if(ok)
	{
		for(var i = 0; i < modal_subtitle.length; i++)
		{
			var $j = $("#inputarea" + i);
			if($j.prop("type") == "checkbox") modal_values[i] = $j.prop("checked");
			else modal_values[i] = $j.val();
		}
	}
	$("#input").hide();
	$("#input-overlay").hide();
	modal_parts.unhighlight();
	if(ok) makeDirty(true);
	modal_parts.edited(ok ? modal_values : null); // parts must have function 'edited'
}

function keydownModal(e)
{
	var evt = e || window.event;
	if(evt.keyCode == 27) // ESC
		closeModalWindow(false);
	else if(evt.keyCode == 13) // Enter
	{
		evt.preventDefault();
		closeModalWindow(true);
	}
}

var misc_identifier;

function openModalWindowforMisc(parts)
{
	var html = "<p>各種処理の編集</p>";
	modal_parts = parts;
	modal_values = [];
	for(var i = 0; i < parts.values.length; i++) modal_values.push(parts.values[i]);
	html += "<select id=\"misccommands\" onchange=\"onmiscchanged();\">";
	for(var i = 0; i < misc_menu.length; i++)
		html += "<option value=\"" + misc_menu[i][1] + "\""
			+(misc_menu[i][1] == parts.identifier ? " selected" : "" )+">" 
			+ misc_menu[i][0] + "</option>";
	html += "</select>";
	html += "<table id=\"miscvalues\">";
	html += "</table>";
	html += "<button type=\"button\" onclick=\"closeModalWindowforMisc(true);\">OK</button>";
	html += "<button type=\"button\" onclick=\"closeModalWindowforMisc(false);\">キャンセル</button>";
	modal_parts.highlight();
	$("#input").html(html);
	$("#input-overlay").fadeIn();
	$("#input").fadeIn();
	setIdentifierforMisc(parts.identifier);
//	$("#inputarea0").focus();
}

function onmiscchanged()
{
	var index = document.getElementById("misccommands").selectedIndex;
	setIdentifierforMisc(misc_menu[index][1]);
}

function setIdentifierforMisc(identifier)
{
	misc_identifier = identifier;
	// 今のinputareaの値をmodal_valuesに退避する
	for(var i = 0; i < modal_values.length; i++)
	{
		var elem = document.getElementById("inputarea" + i);
		if(elem) modal_values[i] = elem.value;
		if(/《.*》/.test(modal_values[i])) modal_values[i] = null;
	}
	
	var table = document.getElementById("miscvalues");
	// tableの子をすべて消す
	while(table.firstChild) table.removeChild(table.firstChild);
	for(var i = 0; i < misc_menu.length; i++)
	{
		if(identifier != misc_menu[i][1])continue;
		var tmp_values = [];
		for(var j = 0; j < misc_menu[i][3].length; j++)
		{
			var v = "《" + misc_menu[i][3][j] + "》";
			if(modal_values.length > j && modal_values[j] != null) v = modal_values[j]
			else if(modal_parts.values.length > j && modal_parts.values[j] != null) v = modal_parts.values[j];
			tmp_values.push(v);
			var tr = document.createElement("tr");
			var td = document.createElement("td");
			td.innerHTML = misc_menu[i][3][j];
			tr.appendChild(td);
			td = document.createElement("td");
			var input = document.createElement("input");
			input.setAttribute("id", "inputarea" + j);
			input.setAttribute("value", v);
			input.setAttribute("onfocus", "select();");
			input.setAttribute("onkeydown", "keydownModalforMisc(event);")
			input.setAttribute("spellcheck", "false");
			td.appendChild(input);
			tr.appendChild(td);
			table.appendChild(tr);
		}
		modal_values = tmp_values;
	}
	$("#input").height(120 + modal_values.length * 35);
}

function closeModalWindowforMisc(ok)
{
	if(ok)
	{
		for(var i = 0; i < modal_values.length; i++)
		{
			modal_values[i] = document.getElementById("inputarea" + i).value;
		}
	}
	$("#input").hide();
	$("#input-overlay").hide();
	modal_parts.unhighlight();
	modal_parts.edited(misc_identifier, ok ? modal_values : null); // parts must have function 'edited'
}

function keydownModalforMisc(e)
{
	var evt = e || window.event;
	if(evt.keyCode == 27) // ESC
		closeModalWindowforMisc(false);
	else if(evt.keyCode == 13) // Enter
		closeModalWindowforMisc(true);
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
		if(e.line && e.line > 0) textareaAppend(e.line + "行目構文エラーです\n");
		textareaAppend(e.message);
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

document.getElementById("storage_download").onclick = function(ev)
{
	var element = document.getElementById("storage_download");
	var list = document.getElementById("storage_list");
	var n = list.options.selectedIndex;
	if(n >= 0 && n < storage.length)
	{
		var filename = list.options[n].value;
		var str = storage.getItem(filename);
		var blob = new Blob([str], {type:"text/plain"});
		if(window.navigator.msSaveBlob)
		{
			window.navigator.msSaveBlob(blob, filename);
		}
		else
		{
			window.URL = window.URL || window.webkitURL;
			element.setAttribute("href", window.URL.createObjectURL(blob));
			element.setAttribute("download", filename);
		}
	}
	else
	{
		element.removeAttribute("href");
	}
};


document.getElementById("storage_upload1").onclick = function(ev){
	document.getElementById("storage_upload").click();
	return false;
}

document.getElementById("storage_upload").addEventListener("change", function(ev){
	var file = ev.target.files;
	var reader = new FileReader();
	reader.readAsText(file[0], "UTF-8");
	reader.onload = function(ev)
	{
		var data = reader.result;
		try{
			storage.setItem(file[0].name,data);
			storage_list_update();
		}
		catch(e)
		{
			window.alert("ストレージに保存できませんでした");
		}
	}
});

document.getElementById("storage_remove").onclick = function(ev)
{
	var list = document.getElementById("storage_list");
	var n = list.options.selectedIndex;
	if(n >= 0)
	{
		var key = list.options[n].value;
		storage.removeItem(key);
		storage_list_update();	
	}
};

document.getElementById("storage_clear").onclick = function(ev)
{
	if(window.confirm("ストレージを空にしていいですか？"))
	{
		storage.clear();
		storage_list_update();	
	}
};

function storage_list_update()
{
	var list = document.getElementById("storage_list");
	while(list.options.length) list.options.remove(0);
	var n = storage.length;
	if(n > 0)
	{
		for(var i = 0; i < n; i++)
		{
			var option = document.createElement("option");
			option.text = option.value = storage.key(i);
			list.appendChild(option);
		}
	}
	else
	{
		var option = document.createElement("option");
		option.text = "--空--";
		// option.attributes.add("disabled");
		list.appendChild(option);
	}
}

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
flowchartButton.click();
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
