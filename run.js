"use strict";

var debug_mode = false; // デバッグモードかどうか

const typeOfValue=
{
	typeInt:1,
	typeFloat:2,
	typeString:3,
	typeBoolean:4,
	typeArray:5,
	typeDictionary:6
};

var graphColor = [
	'#c00000','#00c000','#0000c0','#007070','#700070','#707000'
];

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
	var v = vt.vars[vn];
	if(args && args.length > 0)
	{
		for(var i = 0; i < args.length - 1; i++)
		{
			// var arg = args[i].getValue();
			var arg = args.getElement(i).getValue();
			if(arg instanceof IntValue)
			{
				if(v instanceof ArrayValue || v instanceof StringValue)
				{
					var idx = Number(arg.getValue().value);
					var l = v.value.length;
					if(idx < 0) idx += l;
					if(idx >= 0 && idx < l) v = v.value[idx];
					// if(idx >= 0 && idx < l) v = v.value[idx];
					else throw new RuntimeError(loc.first_line, "配列の範囲を超えて代入しようとしました");
				}
				else if(v instanceof StringValue)
					throw new RuntimeError(loc.first_line, "部分文字列の部分文字列への代入はできません");
				else if(v instanceof DictionaryValue)
				{
					var key0 = arg.getValue().value;
					if(isPrimitive(arg.getValue()) && v.getValue().value.has(key0)) v = v.value.get(key0);
					else throw new RuntimeError(loc.first_line, "辞書にキー"+arg.getValue().value+"がありません");
				}
				else throw new RuntimeError(loc.first_line, "添字が使える型ではありません");
			}
			else if(arg instanceof StringValue || arg instanceof FloatValue)
			{
				var key0 = arg.getValue().value;
				if(v instanceof DictionaryValue)
				{
					if(isPrimitive(arg.getValue()) && v.getValue().value.has(key0))
						v = v.value.get(key0);
					else throw new RuntimeError(loc.first_line, "辞書にキー"+arg.getValue().value+"がありません");
				} 
				else throw new RuntimeError(loc.first_line, "文字列の添字は辞書でないと使えません");
			}
			else if(arg instanceof SliceValue)
				throw new RuntimeError(loc.first_line, "スライスの使い方が正しくありません");
			else throw new RuntimeError(loc.first_line, "添字が正しくありません");
		}
		//代入
		var arg = args.getElement(args.length - 1).getValue();
		if(arg instanceof IntValue)
		{
			var idx = Number(arg.value);
			var l = v.value.length;
			if(idx < 0) idx += l;
			if(idx < 0 || idx >= l) throw new RuntimeError(loc.first_line, "配列の範囲を超えて代入しようとしました");
			if(v instanceof ArrayValue) 
			{
				v.setElement(idx, newval);
			}
			else if(v instanceof StringValue)
			{
				if(!(newval.getValue() instanceof StringValue)) throw new RuntimeError(loc.first_line, "文字列の途中に文字列でないものを挿入しようとしました");
				var str = v.value;
				v.rtnv = str.substr(0, idx) + newval.value + str.substr(idx + 1);
			}
			else throw new RuntimeError(loc.first_line, "整数の添字は配列か文字列にしか使えません");
		}
		else if(arg instanceof StringValue)
		{
			if(v instanceof DictionaryValue) 
				v.value.set(arg.value, newval.clone().getValue());
			else throw new RuntimeError(loc.first_line, "`文字列の添字は`辞書にしか使えません");
		}
		else if(arg instanceof SliceValue)
		{
			var idx1 = Number(arg.getValue1().getValue().value);
			var idx2 = Number(arg.getValue2().getValue().value);
			if(v instanceof ArrayValue)
			{
				if(!(newval instanceof ArrayValue)) throw new RuntimeError(loc.first_line, "配列に配列でないものを挿入しようとしました");
				var l = v.length;
				if(!idx1) idx1 = 0;
				if(!idx2) idx2 = l;
				if(idx1 < 0) idx1 += l;
				if(idx2 < 0) idx2 += l;
				if(idx1 >= 0 && idx2 >= 0 && idx1 < l && idx2 < l)
				{
					var a = [];
					for(var i = 0; i < idx1; i++) a.push(v.value[i].clone());
					for(var i = 0; i < newval.getValue().length; i++) a.push(newval.getValue().value[i].clone());
					for(var i = idx2; i <  l; i++) a.push(v.value[i].clone());
					v.rtnv = a;
				}
				else throw new RuntimeError(loc.first_line, "配列の範囲外に挿入しようとしました");
			}
			else if(v instanceof StringValue)
			{
				if(!(newval.getValue() instanceof StringValue)) throw new RuntimeError(loc.first_line, "文字列の途中に文字列でないものを挿入しようとしました");
				var l = v.length;
				if(!idx1) idx1 = 0;
				if(!idx2) idx2 = l;
				if(idx1 < 0) idx1 += l;
				if(idx2 < 0) idx2 += l;
				if(idx1 >= 0 && idx2 >= 0 && idx1 < l && idx2 < l) 
				{
					var str = v.value.substr(0, idx1) + newval.getValue().value + v.value.substr(idx2);
					v.rtnv = str;
				}
			}
			else throw new RuntimeError("スライスの添字は配列か文字列でないと使えません");
		}
		else throw new RuntimeError(loc.first_line, "添字が正しくありません");
	}
	else
	{
		vt.vars[vn] = newval;
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
	if(args && args.length > 0)
	{
		for(var i = 0; i < args.length; i++)
		{
			var arg = args[i].getValue();
			// var val = v.getValue();
			var val = v;
			if(arg instanceof IntValue)
			{
				if(v instanceof ArrayValue)	// 配列のidx番目
				{
					var idx = Number(arg.value);
					var l = v.length;
					if(idx < 0) idx += l;
					if(idx >= 0 && idx < l) v = v.value[idx].getValue();
					else throw new RuntimeError(loc.first_line, "配列の範囲を超えてアクセスしました");
				}
				else if(v instanceof StringValue)	// 文字列のidx文字目
				{
					var idx = Number(arg.value);
					var l = val.length;
					if(idx < 0) idx += l;
					if(idx >= 0 && idx < l) v = new StringValue(val.value[idx], loc);
					else throw new RuntimeError(loc.first_line, "文字列の範囲を超えてアクセスしました");
				}
				else if(v instanceof DictionaryValue)
				{
					return val.getElement(arg.getValue().value);
				}
				else throw new RuntimeError(loc.first_line, "整数の添字は配列か文字列でないと使えません");
			}
			else if(arg instanceof StringValue || arg instanceof FloatValue)
			{
				if(val instanceof DictionaryValue)
				{
					if(val.value.has(arg.getValue().value))
						v = val.value.get(arg.getValue().value);
					else throw new RuntimeError(loc.first_line, "辞書にキー"+arg.getValue().value+"がありません");
				} 
				else throw new RuntimeError(loc.first_line, "整数でない添字は辞書でないと使えません");
			}
			else if(arg instanceof SliceValue)
			{
				var idx1 = Number(arg.getValue1().getValue().value);
				var idx2 = Number(arg.getValue2().getValue().value);
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
		for(var i = 0; i < this.value.length; i++) a.push(this.value[i]);
		return new ArrayValue(a, this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			this.copy_value_to_rtnv();
			code[0].stack.unshift({statementlist: this.value, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			this.state = 0;
		}
	}
	copy_value_to_rtnv()
	{
		if(this.rtnv){
			for(var i = 0; i < this.value.length; i++) this.rtnv.value[i] = this.value[i];
		}
		else
		{
			var a = [];
			for(var i = 0; i < this.value.length; i++) a.push(this.value[i]);
			this.rtnv = new ArrayValue(a, this.loc);
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
		this.value.push(a);
		this.copy_value_to_rtnv();
	}
	extend(a)
	{
		for(var i of a) this.value.push(i);
		this.copy_value_to_rtnv();
	}
	getValue()
	{
		// if(!this.rtnv)
		// {
		// 	var a = []
		// 	for(var i = 0; i < this.value.length; i++) a.push(this.value[i].getValue());
		// 	this.rtnv = new ArrayValue(a, this.loc);
		// }
		return this.rtnv;
	}
	setElement(idx, val)
	{
		this.value[idx] = val;
		// this.rtnv.value[idx] = val;
		this.copy_value_to_rtnv();
	}
	setValue(v)
	{
		this.value = v;
		this.copy_value_to_rtnv();
	}
	getElement(idx)
	{
		return this.value[idx];
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
			if(v[i] instanceof SliceValue)
			{
				var key = v[i].getValue1();
				var val = v[i].getValue2();
				if(val instanceof Variable) val = getValueByArgs(val, null, loc);
				if(isPrimitive(key)) this.value.set(key.value, val);
				else throw new RuntimeError(loc.first_line, "辞書のキーには単純型しか使えません");
			}
			else throw new RuntimeError(loc.first_line, "辞書の初期化が間違っています");
		}
		this.rtnv = null;
		this.state = 0;
	}
	clone()
	{
		var rtnv = new DictionaryValue([], this.loc);
		for(var key of this.value.keys())
		{
			var val = this.value.get(key);
			rtnv.value.set(key, val.clone());
		}
		return rtnv;
	}
	getCode()
	{
		var ag = [];
		var keys = this.value.keys();
		// keys.sort();
		for(var i = 0; i < keys.length; i++) 
			ag.push(keys[i] + ':' + this.value.get(keys[i]).getCode());
		return '{' + ag.join(',') + '}';
	}
	makePython()
	{
		var ag = [];
		var keys = this.value.keys();
		// keys.sort();
		for(var i = 0; i < keys.length; i++) 
			ag.push("'" + keys[i] + "':" + this.value.get(keys[i]).makePython());
		return '{' + ag.join(', ') + '}';
	}
	run()
	{
		if(this.state == 0)
		{
			var a = [];
			for(let key of this.value.keys())
			{
				a.push(this.value.get(key));
			}
			code[0].stack.unshift({statementlist: a, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			var a = [];
			for(let key of this.value.keys())
			{
				a.push(new SliceValue(new StringValue(key, this.loc), this.value.get(key), this.loc));
			}
			this.rtnv = new DictionaryValue(a, this.loc);
			this.state = 0;
		}
	}
	getValue()
	{
		return this.rtnv ? this.rtnv : this;
	}
	getElement(key)
	{
		if(this.value.has(key)) return this.value.get(key);
		else throw new RuntimeError(this.first_line, "キーに" + key + "がありません");	
	}
	setElement(key, val)
	{
		this.value.set(key, val);
		this.rtnv = null;
	}
	setValue(v)
	{
		this.value = v;
		this.rtnv = null;
	}
}

class IntValue extends Value
{
	constructor(v, loc)
	{
		try{
			super(BigInt(v), loc);
		}
		catch(e)
		{
			if(e instanceof RangeError) throw RuntimeError(this.first_line, "整数で表せない値が使われました");
			else throw e;
		}
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
		return new BooleanValue(this.value, this.loc);
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
			if(v1 instanceof IntValue && v2 instanceof IntValue) // 整数の自然数乗
			{
				if(v1.value == 0 && v2.value <= 0) throw new RuntimeError(this.first_line, "0は正の数乗しかできません");
				try{
					this.rtnv = v2.value >= 0 ? new IntValue(v1.value **  v2.value) : new FloatValue(Number(v1.value) ** Number(v2.value));
				}
				catch(e){
					if(e instanceof RangeError) throw new RuntimeError(this.first_line, "計算できない値です");
					else throw e;
				}
			}
			else if((v1 instanceof IntValue || v1 instanceof FloatValue) && (v2 instanceof IntValue || v2 instanceof FloatValue))
			{
				v1 = Number(v1.value);
				v2 = Number(v2.value);
				if(v1 < 0 && !Number.isSafeInteger(v2)) throw new RuntimeError(this.first_line, "負の数の非整数乗はできません");
				if(v1 == 0 && v2 <= 0) throw new RuntimeError(this.first_line, "0は正の数乗しかできません");
				try{
					let v = v1 ** v2;
					if(isFinite(v)) this.rtnv = new FloatValue(v, this.loc);
					else throw new RuntimeError(this.first_line, "オーバーフローしました");
				}
				catch(e)
				{
					if(e instanceof RangeError) throw new RuntimeError(this.first_line, "計算できない値です");
					else throw e;
				}
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
				if(v1 instanceof FloatValue || v2 instanceof FloatValue)	// 一方が実数型なら結果は実数型
				{
					let v =Number(v1.value) + Number(v2.value);
					if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
					this.rtnv = new FloatValue(v, this.loc);
				}
				else	// 整数型
				{
					try{
						this.rtnv = new IntValue(v1.value + v2.value, this.loc);
					}
					catch(e)
					{
						if(e instanceof RangeError) throw new RuntimeError(this.first_line, "計算できない値です");
						else throw e;
					}
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
			if(v1 instanceof FloatValue || v2 instanceof FloatValue)
			{
				let v = Number(v1.value) - Number(v2.value);
				if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
				this.rtnv = new FloatValue(v, this.loc);
			}
			else
			{
				try{
					this.rtnv = new IntValue(v1.value - v2.value, this.loc);
				}
				catch(e)
				{
					if(e instanceof RangeError) throw new RuntimeError(this.first_line, "計算できない値です");
					else throw e;
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
				if(v1 instanceof FloatValue || v2 instanceof FloatValue)
				{
					let v = Number(v1.value) * Number(v2.value);
					if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
					this.rtnv = new FloatValue(v, this.loc);
				}
				else
				{
					try{
						this.rtnv = new IntValue(v1.value * v2.value, this.loc);
					}
					catch(e)
					{
						if(e instanceof RangeError) throw new RuntimeError(this.first_line, "計算できない値です");
						else throw e;
					}
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
			try{
				let v = Number(v1.value) / Number(v2.value);
				if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
				this.rtnv = new FloatValue(v, this.loc);
			}
			catch(e)
			{
				if(e instanceof RangeError) throw new RuntimeError(this.first_line, "計算できない値です");
				else throw e;
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
			try{
				if(v1 instanceof IntValue && v2 instanceof IntValue){
					let r = v1.value % v2.value;
					let q = v1.value / v2.value;
					if(!SameSignBigInt(v1.value, v2.value) && r != 0) q--;
					this.rtnv = new IntValue(q, this.loc);
				}
				else{
					v1 = Number(v1.value);
					v2 = Number(v2.value);
					this.rtnv = new FloatValue(Math.floor(v1 / v2), this.loc);
				}
			}
			catch(e)
			{
				if(e instanceof RangeError) throw new RuntimeError(this.first_line, "計算できない値です");
				else throw e;
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
				if(v1 instanceof IntValue && v2 instanceof IntValue){
					let r = v1.value % v2.value;
					let q = v1.value / v2.value;
					if(!SameSignBigInt(v1.value, v2.value) && r != 0) q--;
					this.rtnv = new IntValue(v1.value - q * v2.value, this.loc);
				}
				else
				{
					v1 = Number(v1.value);
					v2 = Number(v2.value);
					this.rtnv = new FloatValue(v1 - Math.floor(v1 / v2) * v2, this.loc);
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
			if(v1 instanceof IntValue)
			{
				try{
					this.rtnv = new IntValue(-v1.value, this.loc);
				}
					catch(e)
				{
					if(e instanceof RangeError) throw new RuntimeError(this.first_line, "計算できない値です");
					else throw e;
				}
			}
			else if(v1 instanceof FloatValue)
			{
				let v = -v1.value;
				if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
				this.rtnv = new FloatValue(v, this.loc);
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
				throw new RuntimeError(this.first_line, "and は真偽値にしか使えません");
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
				throw new RuntimeError(this.first_line, "or は真偽値にしか使えません");
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
			else throw new RuntimeError(this.first_line, "not は真偽値にしか使えません");
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
				try{
					v1 = v1 instanceof BooleanValue ? (v1.value ? 1 : 0) : v1.value;
					v2 = v2 instanceof BooleanValue ? (v2.value ? 1 : 0) : v2.value;
					this.rtnv = new IntValue(v1 & v2, this.loc);
				}
				catch(e)
				{
					if(e instanceof RangeError) throw new RuntimeError(this.first_line, "計算できない値です");
					else throw e;
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
			else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) this.rtnv = new BooleanValue(v1.value | v2.value, this.loc);
			else if(v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビット和はできません");
			else
			{
				try{
					v1 = v1 instanceof BooleanValue ? (v1.value ? 1 : 0) : v1.value;
					v2 = v2 instanceof BooleanValue ? (v2.value ? 1 : 0) : v2.value;
					this.rtnv = new IntValue(v1 | v2, this.loc);
				}
				catch(e)
				{
					if(e instanceof RangeError) throw new RuntimeError(this.first_line, "計算できない値です");
					else throw e;
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
			else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) this.rtnv = new BooleanValue(v1.value ^ v2.value, this.loc);
			else if(v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数の排他的ビット和はできません");
			else
			{
				try{
					v1 = v1 instanceof BooleanValue ? (v1.value ? 1 : 0) : v1.value;
					v2 = v2 instanceof BooleanValue ? (v2.value ? 1 : 0) : v2.value;
					this.rtnv = new IntValue(v1 ^ v2, this.loc);
				}
				catch(e)
				{
					if(e instanceof RangeError) throw new RuntimeError(this.first_line, "計算できない値です");
					else throw e;
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
				try{
					this.rtnv = new IntValue(~v1.value, this.loc);
				}
				catch(e)
				{
					if(e instanceof RangeError) throw new RuntimeError(this.first_line, "計算できない値です");
					else throw e;
				}
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
				try{
					v1 = v1 instanceof BooleanValue ? (v1.value ? 1 : 0) : v1.value;
					v2 = v2 instanceof BooleanValue ? (v2.value ? 1 : 0) : v2.value;
					this.rtnv = new IntValue(v1 << v2, this.loc);
				}
				catch(e)
				{
					if(e instanceof RangeError) throw new RuntimeError(this.first_line, "計算できない値です");
					else throw e;
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
				try{
					v1 = v1 instanceof BooleanValue ? (v1.value ? 1 : 0) : v1.value;
					v2 = v2 instanceof BooleanValue ? (v2.value ? 1 : 0) : v2.value;
					this.rtnv = new IntValue(v1 >> v2, this.loc);
				}
				catch(e)
				{
					if(e instanceof RangeError) throw new RuntimeError(this.first_line, "計算できない値です");
					else throw e;
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
		return new ConvertString(this.value[0], this.loc);
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

function toBool(v)
{
	let re = /^(0+|false|偽|)$/i;
	if(v instanceof IntValue || v instanceof FloatValue) return v.value != 0;
	else if(v instanceof StringValue) return re.exec(v.value) ? false : true;
	else if(v instanceof BooleanValue) return v.value;
	else if(v instanceof ArrayValue) return v.value.length != 0;
	else if(v instanceof DictionaryValue) return v.value.size != 0;
	return false;
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
			this.rtnv = new BooleanValue(toBool(v), this.loc);
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
		code[0].stack[0].index++;
		if(this.args) code[0].stack.unshift({statementlist: this.args.value, index: 0});
		// if(this.state == 0)
		// {
		// 	if(this.args) code[0].stack.unshift({statementlist: this.args.value, index: 0});
		// 	this.state = 1;
		// }
		// else
		// {
		// 	code[0].stack[0].index++;
		// 	let vn = this.varname;		// 変数名
		// 	let vt = findVarTable(vn);	// 変数は定義されてるか
		// 	if(vt)
		// 	{
		// 		let v = vt.vars[vn];
		// 		this.rtnv = getValueByArgs(v, this.args ? this.args.value : null, this.loc);
		// 	}
		// 	else throw new RuntimeError(this.first_line, "変数に" + this.varname + "がありません");
		// 	this.state = 0;
		// }
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
		// キャッシュではなく、常に最新の値を取得
		let vn = this.varname;
		let vt = findVarTable(vn);
		if(vt)
		{
			let v = vt.vars[vn];
			return this.rtnv = getValueByArgs(v, this.args ? this.args.value : null, this.loc);
		}
		else throw new RuntimeError(this.first_line, "変数に" + this.varname + "がありません");
	}
	append(a)
	{
		if(this.args)
		{
			for(let i = 0; i < a.length; i++) this.args.value.push(a[i]);
		}
		else this.value[1] = new ArrayValue(a, this.loc);
	}
	extend(a)
	{
		if(this.args) this.args.extend(a);
		else this.value[1] = new ArrayValue(a, this.loc);
	}
}

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
			var func = this.value[0], param = this.value[1];
			if(definedFunction[func])
			{
				let fn = definedFunction[func].clone();
				fn.setCaller(this, false);
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
				for(let i of Object.keys(globalVarTable.vars)) 
					vt.vars[i] = globalVarTable.vars[i];
				for(let i = 0; i < fn.params.length; i++)
					if(param[i] instanceof ArrayValue || param[i] instanceof DictionaryValue)
						vt.vars[fn.params[i].varname] = param[i];
					else
						vt.vars[fn.params[i].varname] = param[i].getValue();
				let statementlist = cloneStatementlist(fn.statementlist);
				statementlist.push(new ReturnStatement(new NullValue(this.loc), this.loc));
				setCaller(statementlist, this);
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
		this.rtnv = v;
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

class ExitStatement extends Statement {
	constructor(loc) {
		super(loc);
	}
	clone()
	{
		return new ExitStatement(this.loc);
	}
	run() {
		if(code[0] instanceof parsedFunction)
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
		textareaAppend(vars[i] + ":" + array2code(v, true) + "\n");
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

function SameSignBigInt(a, b)
{
	return (a >= 0 && b >= 0) || (a < 0 && b < 0);
}

class Assign extends Value
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
		super(null,loc);
		if(!(variable instanceof Variable || variable instanceof UNDEFINED)) throw new RuntimeError(loc.first_line, "変数でないものに代入はできません");
		this.variable = variable;
		this.value = value;
		this.rtnv = null;
		this.operator = operator;
		this.state = 0;
	}
	clone()
	{
		let rtnv = new Assign(
			this.variable ? this.variable.clone() : this.variable,
			this.value ? this.value.clone() : this.value,
			this.operator,
			this.loc
		);
		rtnv.state = 0; // stateは必ず0でリセット
		return rtnv;
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
		else if(this.state == 1)
		{
			var vt1 = findVarTable(this.variable.varname);
			var v2  = this.value.getValue();
			if(this.operator)
			{
				if(!vt1) throw new RuntimeError(this.first_line, '変数 '+this.variable.varname+' は定義されていません');
				var v1 = getValueByArgs(vt1.vars[this.variable.varname], this.variable.args ? this.variable.args.value : null, this.loc);
				var v3 = null;
				switch(this.operator)
				{
					case '+':
						if(v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
						if(v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の足し算はまだサポートしていません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書の足し算はまだサポートしていません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) v3 = new StringValue(String(v1.value) + String(v2.value), this.loc);
						else if(v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(v1.value + v2.value, this.loc);
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) v3 = new FloatValue(Number(v1.value) + Number(v2.value), this.loc);
						break;
					case '-':
						if(v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
						if(v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の引き算はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書の引き算はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の引き算はできません");
						else if(v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(v1.value - v2.value, this.loc);
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) v3 = new FloatValue(Number(v1.value) - Number(v2.value), this.loc);
						break;
					case '*':
						if(v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
						if(v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の掛け算は出来ません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書の掛け算はできません");
						else if(v1 instanceof StringValue)
						{
							if(v2 instanceof IntValue) v3 = new StringValue(v1.value.repeat(v2.value >= 0 ? Number(v2.value) : 0), this.loc);
							else throw new RuntimeError(this.first_line, "文字列に掛けられるのは整数だけです")
						}
						else if(v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(v1.value * v2.value, this.loc);
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) v3 = new FloatValue(Number(v1.value) * Number(v2.value), this.loc);
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
							else v3 = new FloatValue(Number(v1.value) / Number(v2.value), this.loc);
						}
						break;
					case '//':
						if(v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
						if(v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の割り算はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書の割り算はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の割り算はできません");
						else if(v1 instanceof IntValue && v2 instanceof IntValue)
						{
							let q = v1.value / v2.value, r = v1.value % v2.value;
							if(!SameSignBigInt(v1.value, v2.value) && r != 0) q--;
							v3 = new IntValue(q, this.loc);
						}
						else
						{
							if(Number(v2.value) == 0) throw new RuntimeError(this.first_line, '0で割り算をしました');
							let v4 = Math.floor(Number(v1.value) / Number(v2.value));
							v3 = new FloatValue(v4, this.loc);
						}
						break;
					case '%':
						if(v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
						if(v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の割り算はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書の割り算はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の割り算はできません");
						else if(v1 instanceof IntValue && v2 instanceof IntValue)
						{
							let q = v1.value / v2.value, r = v1.value % v2.value;
							if(!SameSignBigInt(v1.value, v2.value) && r != 0) q--;
							v3 = new IntValue(r - q * v2.value, this.loc);
						}
						else
						{
							if(Number(v2.value) == 0) throw new RuntimeError(this.first_line, '0で割り算をしました');
							let v4 = Math.floor(Number(v1.value) / Number(v2.value));
							v3 = new FloatValue(Number(v1.value) - v4 * Number(v2.value), this.loc);
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
							if(v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(v1.value & v2.value, this.loc);
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
							if(v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(v1.value | v2.value, this.loc);
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
							if(v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(v1.value ^ v2.value, this.loc);
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
							if(v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(v1.value << v2.value, this.loc);
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
							if(v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(v1.value >> v2.value, this.loc);
						} 
						break;
				}
				if(!v3) throw new RuntimeError(this.first_line, '複合代入演算子の使い方が間違っています');
				setVariableByArgs(vt1,this.variable.value[0], this.variable.value[1] ? this.variable.value[1] : null, v3, this.loc);
				this.rtnv = v3;
			}
			else
			{
				if(!vt1)	// 変数が定義されていないので，ダミーを代入
				{
					vt1 = varTables[0];
					vt1.vars[this.variable.varname] = new NullValue(this.loc);
				}
				setVariableByArgs(vt1, this.variable.varname, this.variable.args ? this.variable.args : null, v2, this.loc);
				this.rtnv = v2.getValue();
			}
			this.state = 0;
			code[0].stack[0].index++;
		}
	}
	getValue()
	{
		return this.rtnv;
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
		super(null, loc);
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
							va = va.getElement(ag.value[i].getValue().value);
						}
						else if(ag.value[i].getValue() instanceof IntValue)
						{
							if(va.value[Number(ag.value[i].getValue().value)])
								va = va.value[Number(ag.value[i].getValue().value)];
							else throw new RuntimeError(this.first_line, '配列の範囲を超えたところに追加しようとしました')
						}
						else throw new RuntimeError(this.first_line, '添字に使えないデータ型です');
					}
				}
				if(va instanceof ArrayValue) va.append(vl.clone());
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
		super(null, loc);
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
		for(var key in val.value.keys())
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
			var flag = this.blocks[this.running][0] ? toBool(this.blocks[this.running][0].getValue()) : true;
			if(flag)
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
			if(!this.condition || toBool(this.condition.getValue()) == this.continuous) code[0].stack[0].index++;
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
			if(!this.condition || toBool(this.condition.getValue()) == this.continuous) code[0].stack[0].index = 0;
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
		if(this.variable instanceof UNDEFINED) throw new RuntimeError(this.loc.first_line, "未完成のプログラムです");
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
			let assign = new Assign(this.variable, this.array.rtnv.value[this.index++], null, this.loc);
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
