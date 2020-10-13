"use strict";

// programmed by watayan <watayan@watayan.net>
// edit run.js, and transpile with Babel to make run1.js

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var typeOfValue = {
	typeInt: 1,
	typeFloat: 2,
	typeString: 3,
	typeBoolean: 4,
	typeArray: 5
};

var graphColor = ['#c00000', '#00c000', '#0000c0', '#007070', '#700070', '#707000'
//	[127,0,0],[0,127,0],[0,0,127],[0,64,64],[64,0,64],[64,64,0]
];

var nameOfType = ['', '整数', '実数', '文字列', '真偽', '配列'];

var code = null; // コードを積む（関数・手続き単位で）
var varTables = []; // 変数テーブルを積む
var myFuncs = {}; // プログラム中で定義される関数・手続き
var returnValues = []; // 関数からの返り値を積む
var run_flag = false,
    step_flag = false,
    editable_flag = true;
var flowchart = null;
var textarea = null;
var context = null;
var current_line = -1;
var wait_time = 0;
var flowchart_display = false;
var converting = false;
var dirty = null;
var timeouts = [];
var selected_quiz = -1,
    selected_quiz_case = -1,
    selected_quiz_input = 0,
    selected_quiz_output = 0;
var output_str = '';
var test_limit_time = 0;
var fontsize = 16;
var python_lib = {};

function finish() {
	if (selected_quiz < 0) textareaAppend("---\n");
	highlightLine(-1);
	setRunflag(false);
	wait_time = 0;
	code = null;
}

/** parsedCodeクラス */

var parsedCode = function () {
	/**
  * @constructor
  * @param {Array<Statement>} statementlist 
  */
	function parsedCode(statementlist) {
		_classCallCheck(this, parsedCode);

		this.stack = [{ statementlist: statementlist, index: 0 }];
	}

	_createClass(parsedCode, [{
		key: 'makePython',
		value: function makePython() {
			python_lib = {};
			var code = '';
			var libs = '';
			for (var i = 0; i < this.stack[0].statementlist.length; i++) // 関数・手続き宣言を先に
			{
				var state = this.stack[0].statementlist[i];
				if (state && (state instanceof DefineFunction || state instanceof DefineStep)) code += state.makePython(0);
			}
			for (var i = 0; i < this.stack[0].statementlist.length; i++) {
				var state = this.stack[0].statementlist[i];
				if (state && !(state instanceof DefineFunction || state instanceof DefineStep)) code += state.makePython(0);
			}
			for (var lib in python_lib) {
				libs += "import " + lib + "\n";
			}return libs + code;
		}
	}]);

	return parsedCode;
}();

/** parsedMainRoutineクラス
 * @extends parsedCode
 */


var parsedMainRoutine = function (_parsedCode) {
	_inherits(parsedMainRoutine, _parsedCode);

	/**
  * @constructor
  * @param {Array<Statement>} statementlist 
  */
	function parsedMainRoutine(statementlist) {
		_classCallCheck(this, parsedMainRoutine);

		return _possibleConstructorReturn(this, (parsedMainRoutine.__proto__ || Object.getPrototypeOf(parsedMainRoutine)).call(this, statementlist));
	}
	/**
  * プログラムの実行が終了したときの処理
  */


	return parsedMainRoutine;
}(parsedCode);

/** parsedFunctionクラス
 * @extends parsedCode
 */


var parsedFunction = function (_parsedCode2) {
	_inherits(parsedFunction, _parsedCode2);

	/**
  * @constructor
  * @param {Array<Statement>} statementlist 
  */
	function parsedFunction(statementlist) {
		_classCallCheck(this, parsedFunction);

		return _possibleConstructorReturn(this, (parsedFunction.__proto__ || Object.getPrototypeOf(parsedFunction)).call(this, statementlist));
		//		this.caller = null;
	}

	return parsedFunction;
}(parsedCode);

/** parsedStepクラス
 * @extends parsedCode
 */


var parsedStep = function (_parsedCode3) {
	_inherits(parsedStep, _parsedCode3);

	/**
  * @constructor
  * @param {Array<Statement>} statementlist 
  */
	function parsedStep(statementlist) {
		_classCallCheck(this, parsedStep);

		return _possibleConstructorReturn(this, (parsedStep.__proto__ || Object.getPrototypeOf(parsedStep)).call(this, statementlist));
	}

	return parsedStep;
}(parsedCode);

/**
 * 変数テーブルのクラス
 */


var varTable = function () {
	/**
  * @constructor
  */
	function varTable() {
		_classCallCheck(this, varTable);

		this.vars = {};
	}
	/**
  * 変数名が変数テーブルにあるか(関数 findVarTableからしか呼んではならない)
  * @param {string} varname 
  * @returns {varTable} 自分がvarnameを持てば自分自身を返す
  */


	_createClass(varTable, [{
		key: 'findVarTable',
		value: function findVarTable(varname) {
			if (this.vars[varname]) return this;else return null;
		}
		/**
   * 
   * @param {Array<string>} oldvars 
   */

	}, {
		key: 'varnames',
		value: function varnames(oldvars) {
			var names = oldvars;
			for (var name in this.vars) {
				if (names.indexOf(name) < 0) names.push(name);
			}return names.sort();
		}
	}]);

	return varTable;
}();

/**
 * varnameを持つ変数テーブルを返す
 * @param {string} varname 
 * @returns {varTable} varnameを持つvarTable
 */


function findVarTable(varname) {
	var t = varTables[0].findVarTable(varname);
	if (t) return t;
	var n = varTables.length - 1;
	if (n > 0) return varTables[n].findVarTable(varname);
	return null;
}

/**
 * コードをフローチャートに反映させる
 */
function codeChange() {
	if (converting || !flowchart_display) return;
	var code = document.getElementById("sourceTextarea").value + "\n";
	textarea.value = "";
	try {
		myFuncs = {};
		var dncl_code = python_to_dncl(code);
		var parse = dncl.parse(dncl_code);
		var flag = false; // 関数・手続き定義がないか調べる
		for (var i = 0; i < parse.length; i++) {
			if (parse[i] instanceof DefineFunction || parse[i] instanceof DefineStep) flag = true;
		}if (flag) {
			textarea.value = "関数定義や手続き定義のあるプログラムのフローチャートはまだ実装していません。\n";
			return;
		}
		converting = true;
		flowchart.code2flowchart(parse);
		converting = false;
	} catch (e) {
		//		console.log(e);
		highlightLine(-1);
		textareaClear();
		if (e.line) textareaAppend(e.line + "行目");
		textareaAppend('\u69CB\u6587\u30A8\u30E9\u30FC\u3067\u3059\n' + e.message + '\n');
		converting = false;
	}
}

/************************************************************************************ユーティリティ関数 */

/**
 * 有限な値であるか
 * @param {number|string} v 
 * @returns {boolean} vが有限な値であるか
 */
function isFinite(v) {
	return !isNaN(v) && v != Number.POSITIVE_INFINITY && v != Number.NEGATIVE_INFINITY;
	// return Number.isFinite(v);
}

/**
 * 整数で表せる値であるか
 * @param {number|string} v
 * @returns {boolean} vが整数で表せる値であるか 
 */
function isSafeInteger(v) {
	return !isNaN(v) && v == Math.floor(v) && v <= 9007199254740991 && v >= -9007199254740991;
	// return Number.isSafeInteger(v);
}

/**
 * 整数であるか
 * @param {number|string} v 
 * @returns {boolean} vが整数であるか
 */
function isInteger(v) {
	return isFinite(v) && v == Math.floor(v);
	// return Number.isInteger(v);
}

/**
 * クラス名を返す
 * @param {Object} obj
 * @return {string} クラス名 
 */
function constructor_name(obj) {
	var result = /^(class|function)\s+([\w\d]+)/.exec(obj.constructor.toString());
	return result ? result[2] : null;
	// return obj.constructor.name;
}

/**
 * 全角英数を半角にする
 * @param {string} s 
 * @returns {string}
 * @throws {RuntimeError}
 */
function toHalf(s, loc) {
	s = s.toString();
	if (setting.zenkaku_mode == 1 && /[Ａ-Ｚａ-ｚ０-９．−]/.exec(s)) throw new RuntimeError(loc.first_line, "数値や変数名を全角文字で入力してはいけません");
	return s.replace(/[Ａ-Ｚａ-ｚ０-９．−]/g, function (s) {
		return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
	});
}

/**
 * プログラムコードに改変が加えられたことを示すフラグの操作
 * @param {boolean} b 
 */
function makeDirty(b) {
	if (b !== dirty) {
		dirty = b;
		document.getElementById("dirty").style.visibility = dirty ? "visible" : "hidden";
	}
}

/**
 * 結果表示画面にテキストを追加する
 * @param {string} v 
 */
function textareaAppend(v) {
	textarea.value += v;
	textarea.scrollTop = textarea.scrollHeight;
}

/**
 * 結果表示画面をクリアする
 */
function textareaClear() {
	textarea.value = '';
}

/**
 * プログラムにおける位置を表す
 */

var Location = function () {
	/**
  * @constructor
  * @param {Token} first_token 
  * @param {Token} last_token 
  */
	function Location(first_token, last_token) {
		_classCallCheck(this, Location);

		this._first_line = first_token.first_line;
		this._last_line = last_token.last_line;
	}

	_createClass(Location, [{
		key: 'first_line',
		get: function get() {
			return this._first_line;
		}
	}, {
		key: 'last_line',
		get: function get() {
			return this._last_line;
		}
	}]);

	return Location;
}();

/**
 * 実行時エラー
 */


var RuntimeError = function () {
	/**
  * @constructor
  * @param {number} line 
  * @param {string} message 
  */
	function RuntimeError(line, message) {
		_classCallCheck(this, RuntimeError);

		this._line = line;
		this._message = message;
		setRunflag(false);
	}

	_createClass(RuntimeError, [{
		key: 'line',
		get: function get() {
			return this._line;
		}
	}, {
		key: 'message',
		get: function get() {
			return this._message;
		}
	}]);

	return RuntimeError;
}();

/**
 * 値クラスの親クラス
 */


var Value = function () {
	/**
  * @constructor
  * @param {number|string|boolean} v 
  * @param {Location} loc 
  */
	function Value(v, loc) {
		_classCallCheck(this, Value);

		this.rtnv = this._value = v;
		this._loc = loc;
		//		this.rtnv = null;
	}

	_createClass(Value, [{
		key: 'clone',
		value: function clone() {
			throw new RuntimeError(this.first_line, constructor_name(this) + "はcloneが作られていません");
		}
		/**
   * @returns 生のJavaScriptにおける値
   */

	}, {
		key: 'getValue',

		/**
   * @returns {Value} 値
   */
		value: function getValue() {
			return this;
		}
		/**
   * @returns {string} DNCLの文法で表した文字列
   */

	}, {
		key: 'getCode',
		value: function getCode() {
			return '' + this._value;
		}
		/**
   * @returns {string} Pythonの文法で表した文字列
   */

	}, {
		key: 'makePython',
		value: function makePython() {
			return this.getCode();
		}
	}, {
		key: 'run',
		value: function run() {
			//		this.rtnv = this;
			code[0].stack[0].index++;
		}
	}, {
		key: 'value',
		get: function get() {
			return this._value;
		}
	}, {
		key: 'loc',
		get: function get() {
			return this._loc;
		}
	}, {
		key: 'first_line',
		get: function get() {
			return this._loc.first_line;
		}
	}]);

	return Value;
}();

/**
 * 型の決まってない値
 * @extends Value
 */


var NullValue = function (_Value) {
	_inherits(NullValue, _Value);

	/**
  * @constructor
  * @param {Location} loc 
  */
	function NullValue(loc) {
		_classCallCheck(this, NullValue);

		return _possibleConstructorReturn(this, (NullValue.__proto__ || Object.getPrototypeOf(NullValue)).call(this, 0, loc));
	}

	_createClass(NullValue, [{
		key: 'clone',
		value: function clone() {
			return new NullValue(this.loc);
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this;
		}
	}]);

	return NullValue;
}(Value);

/**
 * 値の配列
 */


var ArrayValue = function (_Value2) {
	_inherits(ArrayValue, _Value2);

	/**
  * @constructor
  * @param {Array} v 
  * @param {Location} loc 
  */
	function ArrayValue(v, loc) {
		_classCallCheck(this, ArrayValue);

		var _this5 = _possibleConstructorReturn(this, (ArrayValue.__proto__ || Object.getPrototypeOf(ArrayValue)).call(this, v, loc));

		_this5.aarray = {};
		return _this5;
	}

	_createClass(ArrayValue, [{
		key: 'clone',
		value: function clone() {
			var rtnv = [];
			var keys = Object.keys(this.aarray);
			for (var i = 0; i < this.value.length; i++) {
				rtnv.push(this.value[i].getValue().clone());
			}var newvalue = new ArrayValue(rtnv, this.loc);
			for (var i = 0; i < keys.length; i++) {
				newvalue.aarray[keys[i]] = this.aarray[keys[i]].getValue().clone();
			}return newvalue;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var ag = [];
			for (var i = 0; i < this.value.length; i++) {
				ag.push(this.value[i].getCode());
			}return '[' + ag.join(',') + ']';
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var ag = [];
			for (var i = 0; i < this.value.length; i++) {
				ag.push(this.value[i].makePython());
			}return '[' + ag.join(',') + ']';
		}
	}, {
		key: 'nthValue',
		value: function nthValue(idx) {
			if (idx < 0) idx += this._value.length;
			if (idx >= 0 && idx < this._value.length) return this._value[idx];else throw new RuntimeError(this.first_line, "配列の範囲外にアクセスしようとしました");
		}
	}, {
		key: 'setValueToArray',
		value: function setValueToArray(args, va) {
			var l = args ? args.value.length : 1;
			var v = this;
			for (var i = 0; i < l - 1; i++) {
				if (args.value[i].getValue() instanceof StringValue) {
					if (v.aarray[args.value[i].getValue().value]) v = v.aarray[args.value[i].getValue().value];else v = v.aarray[args.value[i].getValue().value] = new ArrayValue([], this.loc);
				} else {
					if (v.nthValue(args.value[i].getValue().value)) v = v.nthValue(args.value[i].getValue().value);else v = v._value[args.value[i].getValue().value] = new ArrayValue([], this.loc);
				}
			}
			if (args.value[l - 1].getValue() instanceof StringValue) v.aarray[args.value[l - 1].getValue().value] = va.clone();else v._value[args.value[l - 1].getValue().value] = va.clone();
		}
	}, {
		key: 'getValueFromArray',
		value: function getValueFromArray(args, loc) {
			var l = args ? args.value.length : 0;
			var v = this;
			for (var i = 0; i < l; i++) {
				if (v instanceof ArrayValue) {
					if (args.value[i].getValue() instanceof StringValue) v = v.aarray[args.value[i].getValue().value];else if (args.value[i].getValue() instanceof IntValue) v = v.nthValue(args.value[i].getValue().value);else throw new RuntimeError(loc.first_line, "配列の添字は整数か文字列です");
				} else if (v instanceof StringValue) {
					if (args.value[i].getValue() instanceof IntValue) v = v.nthValue(args.value[i].getValue().value);else throw new RuntimeError(loc.first_line, "文字列の添字は整数です");
				} else v = null;
			}
			return v ? v : new NullValue(loc);
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this;
		}
	}, {
		key: 'length',
		get: function get() {
			return this._value.length;
		}
	}]);

	return ArrayValue;
}(Value);

/**
 * JavaScriptのArrayからArrayValueを作る
 * @param {*} size 
 * @param {*} args 
 * @param {Location} loc 
 * @param {typeOfValue} type 
 */


function makeArray(size, args, loc, type) {
	var depth = size.value.length;
	if (args.length == depth) {
		switch (type) {
			case typeOfValue.typeInt:
				return new IntValue(0, loc);
			case typeOfValue.typeFloat:
				return new FloatValue(0.0, loc);
			case typeOfValue.typeString:
				return new StringValue('', loc);
			case typeOfValue.typeBoolean:
				return new BooleanValue(true, loc);
		}
	} else {
		var v = [];
		if (!args) args = [];
		for (var i = 0; i < size.value[args.length].value; i++) {
			args.push(i);
			v.push(makeArray(size, args, loc, type));
			args.pop();
		}
		return new ArrayValue(v, loc);
	}
}

var IntValue = function (_Value3) {
	_inherits(IntValue, _Value3);

	function IntValue(v, loc) {
		_classCallCheck(this, IntValue);

		var _this6 = _possibleConstructorReturn(this, (IntValue.__proto__ || Object.getPrototypeOf(IntValue)).call(this, v, loc));

		if (!isSafeInteger(v)) throw new RuntimeError(_this6.first_line, "整数で表せない値です");
		return _this6;
	}

	_createClass(IntValue, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new IntValue(this.value, this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this;
		}
	}]);

	return IntValue;
}(Value);

var FloatValue = function (_Value4) {
	_inherits(FloatValue, _Value4);

	function FloatValue(v, loc) {
		_classCallCheck(this, FloatValue);

		var _this7 = _possibleConstructorReturn(this, (FloatValue.__proto__ || Object.getPrototypeOf(FloatValue)).call(this, v, loc));

		if (!isFinite(v)) throw new RuntimeError(_this7.first_line, "オーバーフローしました");
		return _this7;
	}

	_createClass(FloatValue, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new FloatValue(this.value, this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var str = this.value.toString();
			if (str.match(/[Ee]/) != undefined) return str;else if (isInteger(this.value)) return this.value + '.0';else return this.value;
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this;
		}
	}]);

	return FloatValue;
}(Value);

var StringValue = function (_Value5) {
	_inherits(StringValue, _Value5);

	function StringValue(v, loc) {
		_classCallCheck(this, StringValue);

		return _possibleConstructorReturn(this, (StringValue.__proto__ || Object.getPrototypeOf(StringValue)).call(this, v, loc));
	}

	_createClass(StringValue, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new StringValue(this.value, this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			if (this.value.match(/[「」]/)) return '"' + this.value + '"';else return '「' + this.value + '」';
		}
	}, {
		key: 'nthValue',
		value: function nthValue(idx) {
			if (idx < 0) idx += this.value.length;
			if (idx >= 0 && idx < this.value.length) return new StringValue(this.value[idx], this.loc);else throw new RuntimeError(this.first_line, '文字列の範囲を超えて文字を読もうとしました');
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			return '\'' + this.value.replace('\'', '\\\'') + '\'';
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this;
		}
	}]);

	return StringValue;
}(Value);

var BooleanValue = function (_Value6) {
	_inherits(BooleanValue, _Value6);

	function BooleanValue(v, loc) {
		_classCallCheck(this, BooleanValue);

		return _possibleConstructorReturn(this, (BooleanValue.__proto__ || Object.getPrototypeOf(BooleanValue)).call(this, v, loc));
	}

	_createClass(BooleanValue, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new BooleanValue(this.value, this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			return this.value ? 'True' : 'False';
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			return this.value ? "True" : "False";
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this;
		}
	}]);

	return BooleanValue;
}(Value);

var UNDEFINED = function (_Value7) {
	_inherits(UNDEFINED, _Value7);

	function UNDEFINED(v, loc) {
		_classCallCheck(this, UNDEFINED);

		return _possibleConstructorReturn(this, (UNDEFINED.__proto__ || Object.getPrototypeOf(UNDEFINED)).call(this, v, loc));
	}

	_createClass(UNDEFINED, [{
		key: 'clone',
		value: function clone() {
			return new UNDEFINED(this.value, this.loc);
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			throw new RuntimeError(this.first_line, "未完成のプログラムです");
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			return this.value;
		}
	}, {
		key: 'varname',
		get: function get() {
			return this.value;
		}
	}]);

	return UNDEFINED;
}(Value);

var Pow = function (_Value8) {
	_inherits(Pow, _Value8);

	function Pow(x, y, loc) {
		_classCallCheck(this, Pow);

		return _possibleConstructorReturn(this, (Pow.__proto__ || Object.getPrototypeOf(Pow)).call(this, [x, y], loc));
	}

	_createClass(Pow, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new Pow(this.value[0], this.value[1], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if ((v1 instanceof NullValue || v1 instanceof IntValue) && (v2 instanceof NullValue || v2 instanceof IntValue) && v2.value >= 0) {
				if (v1.value == 0 && v2.value <= 0) throw new RuntimeError(this.first_line, "0は正の数乗しかできません");
				var v = Math.pow(v1.value, v2.value);
				if (isSafeInteger(v)) this.rtnv = new IntValue(v, this.loc);else throw new RuntimeError(this.first_line, "整数で表せる範囲を越えました");
			} else if ((v1 instanceof NullValue || v1 instanceof IntValue || v1 instanceof FloatValue) && (v2 instanceof NullValue || v2 instanceof IntValue || v2 instanceof FloatValue)) {
				if (v1.value < 0 && !Number.isInteger(v2.value)) throw new RuntimeError(this.first_line, "負の数の非整数乗はできません");
				if (v1.value == 0 && v2.value <= 0) throw new RuntimeError(this.first_line, "0は正の数乗しかできません");
				var _v = Math.pow(v1.value, v2.value);
				if (isFinite(_v)) this.rtnv = new FloatValue(_v, this.loc);else throw new RuntimeError(this.first_line, "オーバーフローしました");
			} else throw new RuntimeError('数値でないもののべき乗はできません');
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus" || c1 == "Add" || c1 == "Sub" || c1 == "Mul" || c1 == "Div" || c1 == "DivInt" || c1 == "Mod") brace1 = true;
			if (c2 == "Minus" || c2 == "Add" || c2 == "Sub" || c2 == "Mul" || c2 == "Div" || c2 == "DivInt" || c2 == "Mod") brace2 = true;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' ** ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus" || c1 == "Add" || c1 == "Sub" || c1 == "Mul" || c1 == "Div" || c1 == "DivInt" || c1 == "Mod") brace1 = true;
			if (c2 == "Minus" || c2 == "Add" || c2 == "Sub" || c2 == "Mul" || c2 == "Div" || c2 == "DivInt" || c2 == "Mod") brace2 = true;
			return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '') + ' ** ' + (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '');
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return Pow;
}(Value);

var Add = function (_Value9) {
	_inherits(Add, _Value9);

	function Add(x, y, loc) {
		_classCallCheck(this, Add);

		return _possibleConstructorReturn(this, (Add.__proto__ || Object.getPrototypeOf(Add)).call(this, [x, y], loc));
	}

	_createClass(Add, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new Add(this.value[0], this.value[1], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の足し算はできません");
			if (v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型の足し算はできません");
			if (v1 instanceof StringValue || v2 instanceof StringValue) // 一方でも文字列なら文字列結合
				{
					if (v1 instanceof NullValue) this.rtnv = v2;else if (v2 instanceof NullValue) this.rtnv = v1;else this.rtnv = new StringValue(v1.value + v2.value, this.loc);
				} else // 数値どうし
				{
					var v = v1.value + v2.value;
					if (v1 instanceof FloatValue || v2 instanceof FloatValue) {
						if (!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
						this.rtnv = new FloatValue(v, this.loc);
					} else {
						if (!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
						this.rtnv = new IntValue(v, this.loc);
					}
				}
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus") brace1 = true;
			if (c2 == "Minus") brace2 = true;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' + ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus") brace1 = true;
			if (c2 == "Minus") brace2 = true;
			return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '') + ' + ' + (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '');
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return Add;
}(Value);

var Sub = function (_Value10) {
	_inherits(Sub, _Value10);

	function Sub(x, y, loc) {
		_classCallCheck(this, Sub);

		return _possibleConstructorReturn(this, (Sub.__proto__ || Object.getPrototypeOf(Sub)).call(this, [x, y], loc));
	}

	_createClass(Sub, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new Sub(this.value[0], this.value[1], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の引き算はできません");
			if (v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型の引き算はできません");
			if (v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の引き算はできません");
			var v = v1.value - v2.value;
			if (v1 instanceof FloatValue || v2 instanceof FloatValue) {
				if (!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
				this.rtnv = new FloatValue(v, this.loc);
			} else {
				if (!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
				this.rtnv = new IntValue(v, this.loc);
			}
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus") brace1 = true;
			if (c2 == "Minus") brace2 = true;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' - ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus") brace1 = true;
			if (c2 == "Minus") brace2 = true;
			return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '') + ' - ' + (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '');
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return Sub;
}(Value);

var Mul = function (_Value11) {
	_inherits(Mul, _Value11);

	function Mul(x, y, loc) {
		_classCallCheck(this, Mul);

		return _possibleConstructorReturn(this, (Mul.__proto__ || Object.getPrototypeOf(Mul)).call(this, [x, y], loc));
	}

	_createClass(Mul, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new Mul(this.value[0], this.value[1], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のかけ算はできません");
			if (v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型のかけ算はできません");
			if (v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のかけ算はできません");
			var v = v1.value * v2.value;
			if (v1 instanceof FloatValue || v2 instanceof FloatValue) {
				if (!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
				this.rtnv = new FloatValue(v, this.loc);
			} else {
				if (!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
				this.rtnv = new IntValue(v, this.loc);
			}
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
			if (c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' * ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
			if (c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
			return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '') + ' * ' + (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '');
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return Mul;
}(Value);

var Div = function (_Value12) {
	_inherits(Div, _Value12);

	function Div(x, y, loc) {
		_classCallCheck(this, Div);

		return _possibleConstructorReturn(this, (Div.__proto__ || Object.getPrototypeOf(Div)).call(this, [x, y], loc));
	}

	_createClass(Div, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new Div(this.value[0], this.value[1], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のわり算はできません");
			if (v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型のわり算はできません");
			if (v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のわり算はできません");
			if (v2.value == 0 || v2 instanceof NullValue) throw new RuntimeError(this.first_line, "0でわり算をしました");
			var v = v1.value / v2.value;
			if (!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
			this.rtnv = new FloatValue(v, this.loc);
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
			if (c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' / ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
			if (c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
			return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '') + ' / ' + (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '');
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return Div;
}(Value // /
);

var DivInt = function (_Value13) {
	_inherits(DivInt, _Value13);

	function DivInt(x, y, loc) {
		_classCallCheck(this, DivInt);

		return _possibleConstructorReturn(this, (DivInt.__proto__ || Object.getPrototypeOf(DivInt)).call(this, [x, y], loc));
	}

	_createClass(DivInt, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new DivInt(this.value[0], this.value[1], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のわり算はできません");
			if (v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型のわり算はできません");
			if (v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のわり算はできません");
			if (v2.value == 0 || v2 instanceof NullValue) throw new RuntimeError(this.first_line, "0でわり算をしました");
			var v = Math.floor(v1.value / v2.value);
			if (!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
			this.rtnv = new IntValue(v, this.loc);
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
			if (c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' // ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
			if (c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
			return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '') + ' // ' + (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '');
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return DivInt;
}(Value // //
);

var Mod = function (_Value14) {
	_inherits(Mod, _Value14);

	function Mod(x, y, loc) {
		_classCallCheck(this, Mod);

		return _possibleConstructorReturn(this, (Mod.__proto__ || Object.getPrototypeOf(Mod)).call(this, [x, y], loc));
	}

	_createClass(Mod, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new Mod(this.value[0], this.value[1], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if ((v1 instanceof IntValue || v1 instanceof NullValue) && (v2 instanceof IntValue || v2 instanceof NullValue)) {
				if (v2.value == 0) throw new RuntimeError(this.first_line, "0でわり算をしました");
				var v = v1.value - Math.floor(v1.value / v2.value) * v2.value;
				if (!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
				this.rtnv = new IntValue(v, this.loc);
				code[0].stack[0].index++;
			} else throw new RuntimeError(this.first_line, "余りを出す計算は整数でしかできません");
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
			if (c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' % ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
			if (c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
			return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '') + '%' + (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '');
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return Mod;
}(Value);

var Minus = function (_Value15) {
	_inherits(Minus, _Value15);

	function Minus(x, loc) {
		_classCallCheck(this, Minus);

		return _possibleConstructorReturn(this, (Minus.__proto__ || Object.getPrototypeOf(Minus)).call(this, [x], loc));
	}

	_createClass(Minus, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new Minus(this.value[0], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = this.value[0].getValue();
			if (v1 instanceof NullValue) this.rtnv = v1;else if (v1 instanceof IntValue || v1 instanceof FloatValue) {
				var v = -v1.value;
				if (v1 instanceof IntValue && !isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
				if (v1 instanceof FloatValue && !isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
				this.rtnv = v1 instanceof IntValue ? new IntValue(v, this.loc) : new FloatValue(v, this.loc);
			} else throw new RuntimeError(this.first_line, "マイナスは数値にしかつけられません");
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var v1 = this.value[0];
			var c1 = constructor_name(v1);
			var brace1 = false;
			if (c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
			return '-' + (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '');
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var v1 = this.value[0];
			var c1 = constructor_name(v1);
			var brace1 = false;
			if (c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
			return '-' + (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '');
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return Minus;
}(Value);

var And = function (_Value16) {
	_inherits(And, _Value16);

	function And(x, y, loc) {
		_classCallCheck(this, And);

		return _possibleConstructorReturn(this, (And.__proto__ || Object.getPrototypeOf(And)).call(this, [x, y], loc));
	}

	_createClass(And, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new And(this.value[0], this.value[1], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = this.value[0].getValue();
			if (v1 instanceof BooleanValue) {
				if (!v1.value) this.rtnv = new BooleanValue(false, this.loc);else {
					var v2 = this.value[1].getValue();
					if (v2 instanceof BooleanValue) this.rtnv = new BooleanValue(v2.value, this.loc);
				}
				code[0].stack[0].index++;
			} else throw new RuntimeError(this.first_line, "「かつ」は真偽値にしか使えません");
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c2 == "And" || c2 == "Or" || c2 == "Not") brace2 = true;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' かつ ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c2 == "And" || c2 == "Or" || c2 == "Not") brace2 = true;
			return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '') + ' and ' + (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '');
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return And;
}(Value);

var Or = function (_Value17) {
	_inherits(Or, _Value17);

	function Or(x, y, loc) {
		_classCallCheck(this, Or);

		return _possibleConstructorReturn(this, (Or.__proto__ || Object.getPrototypeOf(Or)).call(this, [x, y], loc));
	}

	_createClass(Or, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new Or(this.value[0], this.value[1], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = this.value[0].getValue();
			if (v1 instanceof BooleanValue) {
				if (v1.value) this.rtnv = new BooleanValue(true, this.loc);else {
					var v2 = this.value[1].getValue();
					if (v2 instanceof BooleanValue) this.rtnv = new BooleanValue(v2.value, this.loc);
				}
				code[0].stack[0].index++;
			} else throw new RuntimeError(this.first_line, "「または」は真偽値にしか使えません");
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c2 == "And" || c2 == "Or" || c2 == "Not") brace2 = true;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' または ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c2 == "And" || c2 == "Or" || c2 == "Not") brace2 = true;
			return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '') + ' or ' + (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '');
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return Or;
}(Value);

var Not = function (_Value18) {
	_inherits(Not, _Value18);

	function Not(x, loc) {
		_classCallCheck(this, Not);

		return _possibleConstructorReturn(this, (Not.__proto__ || Object.getPrototypeOf(Not)).call(this, [x], loc));
	}

	_createClass(Not, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new Not(this.value[0], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = this.value[0].getValue();
			if (v1 instanceof BooleanValue) this.rtnv = new BooleanValue(!v1.value, this.loc);else throw new RuntimeError(this.first_line, "「でない」は真偽値にしか使えません");
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var v1 = this.value[0];
			var c1 = constructor_name(v1);
			var brace1 = false;
			//	if(c2 == "And" || c2 == "Or" || c2 == "Not") brace2 = true;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' でない';
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var v1 = this.value[0];
			var c1 = constructor_name(v1);
			var brace1 = false;
			if (c1 == "And" || c1 == "Or" || c1 == "Not") brace2 = true;
			return 'not ' + (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '');
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return Not;
}(Value);

var BitAnd = function (_Value19) {
	_inherits(BitAnd, _Value19);

	function BitAnd(x, y, loc) {
		_classCallCheck(this, BitAnd);

		return _possibleConstructorReturn(this, (BitAnd.__proto__ || Object.getPrototypeOf(BitAnd)).call(this, [x, y], loc));
	}

	_createClass(BitAnd, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new BitAnd(this.value[0], this.value[1], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビット積はできません");else if (v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビット積はできません");else if (v1 instanceof BooleanValue && v2 instanceof BooleanValue) this.rtnv = new BooleanValue(v1.value & v2.value, this.loc);else if (v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビット積はできません");else {
				if (v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
				if (v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
				this.rtnv = new IntValue(v1.value & v2.value, this.loc);
			}
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift") brace1 = true;
			if (c2 == "Minus" || c2 == "BitRShift" || c2 == "BitLShift") brace2 = true;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' & ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift" || c1 == "BitNot") brace1 = true;
			if (c2 == "Minus" || c2 == "BitRShift" || c2 == "BitLShift" || c2 == "BitNot") brace2 = true;
			return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '') + ' & ' + (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '');
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return BitAnd;
}(Value);

var BitOr = function (_Value20) {
	_inherits(BitOr, _Value20);

	function BitOr(x, y, loc) {
		_classCallCheck(this, BitOr);

		return _possibleConstructorReturn(this, (BitOr.__proto__ || Object.getPrototypeOf(BitOr)).call(this, [x, y], loc));
	}

	_createClass(BitOr, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new BitOr(this.value[0], this.value[1], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビット和はできません");else if (v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビット和はできません");else if (v1 instanceof BooleanValue && v2 instanceof BooleanValue) this.rtnv = new BooleanValue(v1.value & v2.value, this.loc);else if (v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビット和はできません");else {
				if (v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
				if (v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
				this.rtnv = new IntValue(v1.value | v2.value, this.loc);
			}
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift" || c1 == "BitNot") brace1 = true;
			if (c2 == "Minus" || c2 == "BitRShift" || c2 == "BitLShift" || c2 == "BitNot") brace2 = true;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' | ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift" || c1 == "BitNot") brace1 = true;
			if (c2 == "Minus" || c2 == "BitRShift" || c2 == "BitLShift" || c2 == "BitNot") brace2 = true;
			return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '') + ' | ' + (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '');
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return BitOr;
}(Value);

var BitXor = function (_Value21) {
	_inherits(BitXor, _Value21);

	function BitXor(x, y, loc) {
		_classCallCheck(this, BitXor);

		return _possibleConstructorReturn(this, (BitXor.__proto__ || Object.getPrototypeOf(BitXor)).call(this, [x, y], loc));
	}

	_createClass(BitXor, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new BitXor(this.value[0], this.value[1], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の排他的ビット和はできません");else if (v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の排他的ビット和はできません");else if (v1 instanceof BooleanValue && v2 instanceof BooleanValue) this.rtnv = new BooleanValue(v1.value & v2.value, this.loc);else if (v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数の排他的ビット和はできません");else {
				if (v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
				if (v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
				this.rtnv = new IntValue(v1.value ^ v2.value, this.loc);
			}
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift" || c1 == "BitNot") brace1 = true;
			if (c2 == "Minus" || c2 == "BitRShift" || c2 == "BitLShift" || c2 == "BitNot") brace2 = true;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' ^ ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift" || c1 == "BitNot") brace1 = true;
			if (c2 == "Minus" || c2 == "BitRShift" || c2 == "BitLShift" || c2 == "BitNot") brace2 = true;
			return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '') + ' ^ ' + (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '');
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return BitXor;
}(Value);

var BitNot = function (_Value22) {
	_inherits(BitNot, _Value22);

	function BitNot(x, loc) {
		_classCallCheck(this, BitNot);

		return _possibleConstructorReturn(this, (BitNot.__proto__ || Object.getPrototypeOf(BitNot)).call(this, [x], loc));
	}

	_createClass(BitNot, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new BitNot(this.value[0], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = this.value[0].getValue();
			if (v1 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビット反転はできません");else if (v1 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビット反転はできません");else if (v1 instanceof BooleanValue) this.rtnv = new BooleanValue(!v1.value, this.loc);else if (v1 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビット反転はできません");else {
				this.rtnv = new IntValue(~v1.value, this.loc);
			}
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var v1 = this.value[0];
			var c1 = constructor_name(v1);
			var brace1 = false;
			if (c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift") brace1 = true;
			return '~' + (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '');
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var v1 = this.value[0];
			var c1 = constructor_name(v1);
			var brace1 = false;
			if (c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift") brace1 = true;
			return '~' + (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '');
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return BitNot;
}(Value);

var BitLShift = function (_Value23) {
	_inherits(BitLShift, _Value23);

	function BitLShift(x, y, loc) {
		_classCallCheck(this, BitLShift);

		return _possibleConstructorReturn(this, (BitLShift.__proto__ || Object.getPrototypeOf(BitLShift)).call(this, [x, y], loc));
	}

	_createClass(BitLShift, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new BitLShift(this.value[0], this.value[1], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビットシフトはできません");else if (v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビットシフトはできません");else if (v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビットシフトはできません");else {
				if (v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
				if (v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
				this.rtnv = new IntValue(v1.value << v2.value, this.loc);
			}
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus" || c1 == "BitNot") brace1 = true;
			if (c2 == "Minus" || c2 == "BitNot") brace2 = true;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' << ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus" || c1 == "BitNot") brace1 = true;
			if (c2 == "Minus" || c2 == "BitNot") brace2 = true;
			return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '') + ' << ' + (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '');
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return BitLShift;
}(Value);

var BitRShift = function (_Value24) {
	_inherits(BitRShift, _Value24);

	function BitRShift(x, y, loc) {
		_classCallCheck(this, BitRShift);

		return _possibleConstructorReturn(this, (BitRShift.__proto__ || Object.getPrototypeOf(BitRShift)).call(this, [x, y], loc));
	}

	_createClass(BitRShift, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new BitRShift(this.value[0], this.value[1], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビットシフトはできません");else if (v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビットシフトはできません");else if (v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビットシフトはできません");else {
				if (v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
				if (v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
				this.rtnv = new IntValue(v1.value >> v2.value, this.loc);
			}
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus" || c1 == "BitNot") brace1 = true;
			if (c2 == "Minus" || c2 == "BitNot") brace2 = true;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' >> ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus" || c1 == "BitNot") brace1 = true;
			if (c2 == "Minus" || c2 == "BitNot") brace2 = true;
			return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '') + ' >> ' + (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '');
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return BitRShift;
}(Value);

/**
 * @returns boolean
 * @param {ArrayValue} v1 
 * @param {ArrayValue} v2 
 */


function ArrayCompare(v1, v2) {
	var rtnv = true;
	if (v1 instanceof ArrayValue && v2 instanceof ArrayValue) {
		if (v1.length != v2.length) return false;
		for (var i = 0; i < v1.length; i++) {
			rtnv = rtnv && ArrayCompare(v1.nthValue(i), v2.nthValue(i));
		}
	} else rtnv = rtnv && (typeof v1 === 'undefined' ? 'undefined' : _typeof(v1)) == (typeof v2 === 'undefined' ? 'undefined' : _typeof(v2)) && v1.value == v2.value;
	return rtnv;
}

var EQ = function (_Value25) {
	_inherits(EQ, _Value25);

	function EQ(x, y, loc) {
		_classCallCheck(this, EQ);

		return _possibleConstructorReturn(this, (EQ.__proto__ || Object.getPrototypeOf(EQ)).call(this, [x, y], loc));
	}

	_createClass(EQ, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new EQ(this.value[0], this.value[1], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) this.rtnv = new BooleanValue(ArrayCompare(v1, v2), this.loc);else this.rtnv = new BooleanValue(v1.value == v2.value, this.loc);
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' = ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '') + ' == ' + (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '');
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return EQ;
}(Value);

var NE = function (_Value26) {
	_inherits(NE, _Value26);

	function NE(x, y, loc) {
		_classCallCheck(this, NE);

		return _possibleConstructorReturn(this, (NE.__proto__ || Object.getPrototypeOf(NE)).call(this, [x, y], loc));
	}

	_createClass(NE, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new NE(this.value[0], this.value[1], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) this.rtnv = new BooleanValue(!ArrayCompare(v1, v2), this.loc);else this.rtnv = new BooleanValue(v1.value != v2.value, this.loc);
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' != ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '') + ' != ' + (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '');
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return NE;
}(Value);

var GT = function (_Value27) {
	_inherits(GT, _Value27);

	function GT(x, y, loc) {
		_classCallCheck(this, GT);

		return _possibleConstructorReturn(this, (GT.__proto__ || Object.getPrototypeOf(GT)).call(this, [x, y], loc));
	}

	_createClass(GT, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new GT(this.value[0], this.value[1], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません");
			this.rtnv = new BooleanValue(v1.value > v2.value, this.loc);
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' > ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '') + ' > ' + (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '');
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return GT;
}(Value);

var GE = function (_Value28) {
	_inherits(GE, _Value28);

	function GE(x, y, loc) {
		_classCallCheck(this, GE);

		return _possibleConstructorReturn(this, (GE.__proto__ || Object.getPrototypeOf(GE)).call(this, [x, y], loc));
	}

	_createClass(GE, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new GE(this.value[0], this.value[1], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません");
			this.rtnv = new BooleanValue(v1.value >= v2.value, this.loc);
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' >= ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '') + ' >= ' + (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '');
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return GE;
}(Value);

var LT = function (_Value29) {
	_inherits(LT, _Value29);

	function LT(x, y, loc) {
		_classCallCheck(this, LT);

		return _possibleConstructorReturn(this, (LT.__proto__ || Object.getPrototypeOf(LT)).call(this, [x, y], loc));
	}

	_createClass(LT, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new LT(this.value[0], this.value[1], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません");
			this.rtnv = new BooleanValue(v1.value < v2.value, this.loc);
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' < ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '') + ' < ' + (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '');
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return LT;
}(Value);

var LE = function (_Value30) {
	_inherits(LE, _Value30);

	function LE(x, y, loc) {
		_classCallCheck(this, LE);

		return _possibleConstructorReturn(this, (LE.__proto__ || Object.getPrototypeOf(LE)).call(this, [x, y], loc));
	}

	_createClass(LE, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new LE(this.value[0], this.value[1], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません");
			this.rtnv = new BooleanValue(v1.value <= v2.value, this.loc);
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' <= ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '') + ' <= ' + (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '');
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return LE;
}(Value);

var ConvertInt = function (_Value31) {
	_inherits(ConvertInt, _Value31);

	function ConvertInt(x, loc) {
		_classCallCheck(this, ConvertInt);

		return _possibleConstructorReturn(this, (ConvertInt.__proto__ || Object.getPrototypeOf(ConvertInt)).call(this, [x], loc));
	}

	_createClass(ConvertInt, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new ConvertInt(this.value[0], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v = this.value[0].getValue();
			var r = Number.NaN;
			if (v instanceof IntValue) r = v.value;else if (v instanceof FloatValue) r = Math.floor(v.value);else if (v instanceof StringValue) r = Math.floor(Number(v.value));else if (v instanceof BooleanValue) r = v.value ? 1 : 0;
			if (isSafeInteger(r)) this.rtnv = new IntValue(r, this.loc);else throw new RuntimeError(this.loc.first_line, '整数に直せません');
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			return '整数(' + this.value[0].getCode() + ')';
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			return 'int(' + this.value[0].makePython() + ')';
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return ConvertInt;
}(Value);

var ConvertFloat = function (_Value32) {
	_inherits(ConvertFloat, _Value32);

	function ConvertFloat(x, loc) {
		_classCallCheck(this, ConvertFloat);

		return _possibleConstructorReturn(this, (ConvertFloat.__proto__ || Object.getPrototypeOf(ConvertFloat)).call(this, [x], loc));
	}

	_createClass(ConvertFloat, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new ConvertFloat(this.value[0], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v = this.value[0].getValue();
			var r = Number.NaN;
			if (v instanceof IntValue || v instanceof FloatValue) r = v.value;else if (v instanceof StringValue) r = Number(v.value);else if (v instanceof BooleanValue) r = v.value ? 1 : 0;
			if (isFinite(r)) this.rtnv = new FloatValue(r, this.loc);else throw new RuntimeError(this.loc.first_line, '実数に直せません');
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			return '実数(' + this.value[0].getCode() + ')';
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			return 'float(' + this.value[0].makePython() + ')';
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return ConvertFloat;
}(Value);

var ConvertString = function (_Value33) {
	_inherits(ConvertString, _Value33);

	function ConvertString(x, loc) {
		_classCallCheck(this, ConvertString);

		return _possibleConstructorReturn(this, (ConvertString.__proto__ || Object.getPrototypeOf(ConvertString)).call(this, [x], loc));
	}

	_createClass(ConvertString, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new ConvertString(this.value[0], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v = this.value[0].getValue();
			var r = '';
			if (v instanceof IntValue || v instanceof FloatValue) r = String(v.value);else if (v instanceof StringValue) r = v.value;else if (v instanceof BooleanValue) r = v.value ? 'True' : 'False';
			this.rtnv = new StringValue(r, this.loc);
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			return '文字列(' + this.value[0].getCode() + ')';
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			return 'str(' + this.value[0].makePython() + ')';
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return ConvertString;
}(Value);

var ConvertBool = function (_Value34) {
	_inherits(ConvertBool, _Value34);

	function ConvertBool(x, loc) {
		_classCallCheck(this, ConvertBool);

		return _possibleConstructorReturn(this, (ConvertBool.__proto__ || Object.getPrototypeOf(ConvertBool)).call(this, [x], loc));
	}

	_createClass(ConvertBool, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new ConvertBool(this.value[0], this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v = this.value[0].getValue();
			var r = '';
			var re = /^(0+|false|偽|)$/i;
			if (v instanceof IntValue || v instanceof FloatValue) r = v.value != 0;else if (v instanceof StringValue) r = re.exec(v.value) ? false : true;else if (v instanceof BooleanValue) r = v.value;
			this.rtnv = new BooleanValue(r, this.loc);
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			return '真偽(' + this.value[0].getCode() + ')';
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			return 'bool(' + this.value[0].makePython() + ')';
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return ConvertBool;
}(Value);

var Variable = function (_Value35) {
	_inherits(Variable, _Value35);

	/**
  * 
  * @param {string} x 
  * @param {ArrayValue} y 
  * @param {Location} loc 
  */
	function Variable(x, y, loc) {
		_classCallCheck(this, Variable);

		return _possibleConstructorReturn(this, (Variable.__proto__ || Object.getPrototypeOf(Variable)).call(this, [x, y], loc));
	}

	_createClass(Variable, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new Variable(this.value[0], this.value[1] ? this.value[1] : null, this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var vn = this.value[0];
			var vt = findVarTable(vn); // 変数は定義されてるか
			if (vt) {
				//			this.rtnv = vt.vars[vn];
				var v = vt.vars[vn];
				if (v instanceof IntValue) this.rtnv = new IntValue(v.value, this.loc);else if (v instanceof FloatValue) this.rtnv = new FloatValue(v.value, this.loc);else if (v instanceof StringValue) {
					if (this.args && this.args.length > 0) this.rtnv = v.nthValue(this.args.nthValue(0).getValue().value);else this.rtnv = new StringValue(v.value, this.loc);
				} else if (v instanceof BooleanValue) this.rtnv = new BooleanValue(v.value, this.loc);else if (v instanceof ArrayValue) this.rtnv = v.getValueFromArray(this.args, this.loc);else throw new RuntimeError(this.first_line, "Unknown Error");
			} else {
				this.rtnv = new NullValue(this.loc);
			}
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var vn = this.value[0];
			var pm = this.value[1];
			if (pm != null) {
				var ag = new Array(pm.length);
				for (var i = 0; i < pm.length; i++) {
					ag[i] = pm.value[i].getCode();
				}
				vn += '[' + ag.join(',') + ']';
			}
			return vn;
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var vn = this.value[0];
			var pm = this.value[1];
			if (pm != null) {
				var ag = new Array(pm.length);
				for (var i = 0; i < pm.length; i++) {
					ag[i] = '[' + pm.value[i].makePython() + ']';
				}
				vn += ag.join('');
			}
			return vn;
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}, {
		key: 'varname',
		get: function get() {
			return this.value[0];
		}
	}, {
		key: 'args',
		get: function get() {
			return this.value[1];
		}
	}]);

	return Variable;
}(Value);

/**
 * 定義済み関数クラス
 */


var DefinedFunction = function () {
	/**
  * @constructor
  * @param {number} argc 引数の個数
  * @param {function} func 実際の関数
  * @param {string} module Pythonで必要となるモジュール。nullならナニもいらない
  * @param {function} convert this.argcを受け取ってPythonコードの文字列を返す関数。nullならthis.funcName(this.argc)的なことをする。
  */
	function DefinedFunction(argc, func, module, convert) {
		_classCallCheck(this, DefinedFunction);

		this.argc = argc;this.func = func;this.module = module;this.convert = convert;
		this.caller = null;
		this.loc = null;
	}
	/**
  * 関数の値を返す
  * @param {Array<Value>} parameters 
  * @param {Location} loc 
  * @returns {any}
  */


	_createClass(DefinedFunction, [{
		key: 'run',
		value: function run() {
			if (this.argc instanceof Array && this.argc[0] <= this.parameters.length && this.argc[1] >= this.parameters.length || this.parameters.length == this.argc) {
				code[0].stack[0].index++;
				this.caller.setValue(this.func(this.parameters, this.loc));
				code.shift();
			} else throw new RuntimeError(this.loc.first_line, "引数の個数が違います");
		}
	}, {
		key: 'clone',
		value: function clone() {
			return new DefinedFunction(this.argc, this.func, this.module, this.convert);
		}
	}, {
		key: 'setCaller',
		value: function setCaller(caller) {
			this.caller = caller;
		}
	}, {
		key: 'setParameter',
		value: function setParameter(params) {
			this.parameters = params;
		}
	}, {
		key: 'setLocation',
		value: function setLocation(loc) {
			this.loc = loc;
		}
	}]);

	return DefinedFunction;
}();

/**
 * 定義済み関数一覧
 */


var definedFunction = {
	"keys": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof ArrayValue) {
			var args = [];
			var keys = Object.keys(par1.aarray);
			for (var i = 0; i < keys.length; i++) {
				args.push(new StringValue(keys[i], loc));
			}return new ArrayValue(args, this.loc);
		} else throw new RuntimeError(loc.first_line, 'keysは配列にしか使えません');
	}, null, null),
	"abs": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue) return new IntValue(Math.abs(par1.value), loc);else if (par1 instanceof FloatValue) return new FloatValue(Math.abs(par1.value), loc);else throw new RuntimeError(loc.first_line, "absは数値にしか使えません");
	}, null, null),
	"random": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue) return new IntValue(Math.floor(Math.random() * Math.floor(par1.value + 1)), this.loc);else throw new RuntimeError(loc.first_line, "randomは整数にしか使えません");
	}, "random", function (argc) {
		return "random.randint(0," + argc[0] + ")";
	}),
	"ceil": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue) return par1;else if (par1 instanceof FloatValue) return new IntValue(Math.ceil(par1.value), this.loc);else throw new RuntimeError(loc.first_line, "ceilは数値にしか使えません");
	}, "math", null),
	"floor": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue) return par1;else if (par1 instanceof FloatValue) return new IntValue(Math.floor(par1.value), this.loc);else throw new RuntimeError(loc.first_line, "floorは数値にしか使えません");
	}, "math", null),
	"round": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue) return par1;else if (par1 instanceof FloatValue) return new IntValue(Math.round(par1.value), this.loc);else throw new RuntimeError(loc.first_line, "roundは数値にしか使えません");
	}, null, null),
	"sin": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue) return new FloatValue(Math.sin(par1.value), this.loc);else throw new RuntimeError(loc.first_line, "sinは数値にしか使えません");
	}, "math", null),
	"cos": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue) return new FloatValue(Math.cos(par1.value), this.loc);else throw new RuntimeError(loc.first_line, "cosは数値にしか使えません");
	}, "math", null),
	"tan": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue) {
			var v = Math.tan(par1.value);
			if (isFinite(v)) return new FloatValue(v, this.loc);else throw new RuntimeError(loc.first_line, "オーバーフローしました");
		} else throw new RuntimeError(loc.first_line, "tanは数値にしか使えません");
	}, "math", null),
	"asin": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue) {
			if (par1.value > 1.0 || par1.value < -1.0) throw new RuntimeError(loc.first_line, "asinの定義域外の値が使われました");else return new FloatValue(Math.asin(par1.value), this.loc);
		} else throw new RuntimeError(loc.first_line, "asinは数値にしか使えません");
	}, "math", null),
	"acos": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue) {
			if (par1.value > 1.0 || par1.value < -1.0) throw new RuntimeError(loc.first_line, "acosの定義域外の値が使われました");else return new FloatValue(Math.acos(par1.value), this.loc);
		} else throw new RuntimeError(loc.first_line, "acosは数値にしか使えません");
	}, "math", null),
	"atan": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue) return new FloatValue(Math.atan(par1.value), this.loc);else throw new RuntimeError(loc.first_line, "atanは数値にしか使えません");
	}, "math", null),
	"atan2": new DefinedFunction(2, function (param, loc) {
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if ((par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue) && (par2 instanceof NullValue || par2 instanceof IntValue || par2 instanceof FloatValue)) return new FloatValue(Math.atan2(par1.value, par2.value), this.loc);else throw new RuntimeError(loc.first_line, "atan2は数値にしか使えません");
	}, "math", null),
	"sqrt": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue) {
			if (par1.value < 0) throw new RuntimeError(loc.first_line, "負の数のルートを求めようとしました");
			return new FloatValue(Math.sqrt(par1.value), this.loc);
		} else throw new RuntimeError(this.first_line, "sqrtは数値にしか使えません");
	}, "math", null),
	"log": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue) {
			if (par1.value <= 0) throw new RuntimeError(loc.first_line, "正でない数の対数を求めようとしました");
			var v = Math.log(par1.value);
			if (isFinite(v)) return new FloatValue(v, this.loc);
			throw new RuntimeError(this.first_line, "オーバーフローしました");
		} else throw new RuntimeError(loc.first_line, "logは数値にしか使えません");
	}, "math", null),
	"exp": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue) {
			var v = Math.exp(par1.value);
			if (isFinite(v)) return new FloatValue(v, this.loc);
			throw new RuntimeError(loc.first_line, "オーバーフローしました");
		} else throw new RuntimeError(loc.first_line, "expは数値にしか使えません");
	}, "math", null),
	"pow": new DefinedFunction(2, function (param, loc) {
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if ((par1 instanceof NullValue || par1 instanceof IntValue) && (par2 instanceof NullValue || par2 instanceof IntValue) && par2.value >= 0) {
			if (par1.value == 0 && par2.value <= 0) throw new RuntimeError(loc.first_line, "0は正の数乗しかできません");
			var v = Math.pow(par1.value, par2.value);
			if (isSafeInteger(v)) return new IntValue(v, this.loc);else throw new RuntimeError(loc.first_line, "整数で表せる範囲を越えました");
		} else if ((par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue) && (par2 instanceof NullValue || par2 instanceof IntValue || par2 instanceof FloatValue)) {
			if (par1.value < 0 && !Number.isInteger(par2.value)) throw new RuntimeError(loc.first_line, "負の数の非整数乗はできません");
			if (par1.value == 0 && par2.value <= 0) throw new RuntimeError(loc.first_line, "0は正の数乗しかできません");
			var _v2 = Math.pow(par1.value, par2.value);
			if (isFinite(_v2)) return new FloatValue(_v2, this.loc);else throw new RuntimeError(loc.first_line, "オーバーフローしました");
		} else throw new RuntimeError(loc.first_line, "powerは数値にしか使えません");
	}, null, null),
	"length": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue) return new IntValue(0, this.loc);else if (par1 instanceof StringValue) return new IntValue(par1.value.length, this.loc);else if (par1 instanceof ArrayValue) return new IntValue(par1.length, this.loc);else throw new RuntimeError(loc.first_line, "lengthは文字列と配列にしか使えません");
	}, null, function (argc) {
		return "len(" + argc[0] + ")";
	}),
	"substring": new DefinedFunction([2, 3], function (param, loc) {
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		var par3 = param.length == 3 ? param[2].getValue() : null;
		if ((par1 instanceof NullValue || par1 instanceof StringValue) && (par2 instanceof NullValue || par2 instanceof IntValue) && (par3 == null || par1 instanceof NullValue || par3 instanceof IntValue)) {
			var v;
			if (par3 == null) v = par1.value.substr(par2.value);else v = par1.value.substr(par2.value, par3.value);
			return new StringValue(v, this.loc);
		} else throw new RuntimeError(loc.first_line, "substringの引数の型が違います");
	}, null, function (argc) {
		var code = argc[0] + '[' + argc[1] + ':';
		if (argc[2]) code += argc[1] + '+' + argc[2];
		return code + ']';
	}),
	"append": new DefinedFunction(2, function (param, loc) {
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if (par1 instanceof NullValue) return par2;else if (par2 instanceof NullValue) return par1;else if (par2 instanceof StringValue && par2 instanceof StringValue) {
			return new StringValue(par1.value + par2.value, this.loc);
		} else throw new RuntimeError(loc.first_line, "appendの引数の型が違います");
	}, null, function (argc) {
		return argc[0] + '+' + argc[1];
	}),
	"split": new DefinedFunction(2, function (param, loc) {
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if ((par1 instanceof NullValue || par1 instanceof StringValue) && (par2 instanceof NullValue || par2 instanceof StringValue)) {
			var v1 = par1 instanceof NullValue ? '' : par1.value;
			var v2 = par2 instanceof NullValue ? '' : par2.value;
			var v = v1.split(v2);
			var vr = [];
			for (var i = 0; i < v.length; i++) {
				vr.push(new StringValue(v[i], this.loc));
			}return new ArrayValue(vr, this.loc);
		} else throw new RuntimeError(loc.first_line, "splitの引数の型が違います");
	}, null, function (argc) {
		return argc[0] + '.split(' + argc[1] + ')';
	}),
	"extract": new DefinedFunction(3, function (param, loc) {
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		var par3 = param[2].getValue();
		if ((par1 instanceof NullValue || par1 instanceof StringValue) && (par2 instanceof NullValue || par2 instanceof StringValue) && (par3 instanceof NullValue || par3 instanceof IntValue)) {
			var v1 = par1 instanceof NullValue ? '' : par1.value;
			var v2 = par2 instanceof NullValue ? '' : par2.value;
			var v3 = par3.value;
			var v = v1.split(v2);
			if (v3 >= 0 && v3 < v.length) return new StringValue(v[v3], this.loc);else throw new RuntimeError(loc.first_line, "番号の値が不正です");
		} else throw new RuntimeError(loc.first_line, "extractの引数の型が違います");
	}, null, function (argc) {
		return argc[0] + '.split(' + argc[1] + ')[' + argc[2] + ']';
	}),
	"insert": new DefinedFunction(3, function (param, loc) {
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		var par3 = param[2].getValue();
		if ((par1 instanceof NullValue || par1 instanceof StringValue) && (par2 instanceof NullValue || par2 instanceof IntValue) && (par3 instanceof NullValue || par3 instanceof StringValue)) {
			var v1 = par1 instanceof NullValue ? '' : par1.value;
			var v2 = par2.value;
			var v3 = par3 instanceof NullValue ? '' : par3.value;
			if (v2 < 0 || v2 > v1.length) throw new RuntimeError(loc.first_line, "位置の値が不正です");
			var s1 = v1.substr(0, v2);
			var s2 = v1.substr(v2);
			return new StringValue(s1 + v3 + s2, this.loc);
		} else throw new RuntimeError(loc.first_line, "insertの引数の型が違います");
	}, null, function (argc) {
		return argc[0] + '[:' + argc[1] + ']+' + argc[2] + '+' + argc[0] + '[' + argc[1] + ':]';
	}),
	"replace": new DefinedFunction(4, function (param, loc) {
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		var par3 = param[2].getValue();
		var par4 = param[3].getValue();
		if ((par1 instanceof NullValue || par1 instanceof StringValue) && (par2 instanceof NullValue || par2 instanceof IntValue) && (par3 instanceof NullValue || par3 instanceof IntValue) && (par4 instanceof NullValue || par4 instanceof StringValue)) {
			var v1 = par1 instanceof NullValue ? '' : par1.value;
			var v2 = par2.value;
			var v3 = par3.value;
			var v4 = par4 instanceof NullValue ? '' : par4.value;

			if (v2 < 0 || v2 > v1.length) throw new RuntimeError(loc.first_line, "位置の値が不正です");
			if (v3 < 0 || v2 + v3 > v1.length) throw new RuntimeError(loc.first_line, "長さの値が不正です");
			var s1 = v1.substr(0, v2);
			var s2 = v1.substr(v2 + v3);
			return new StringValue(s1 + v4 + s2, this.loc);
		} else throw new RuntimeError(loc.first_line, "replaceの引数の型が違います");
	}, null, function (argc) {
		return argc[0] + '[:' + argc[1] + ']+' + argc[3] + '+' + argc[0] + '[' + argc[1] + '+' + argc[2] + ':]';
	})
};

function setCaller(statementlist, caller) {
	for (var i = 0; i < statementlist.length; i++) {
		if (statementlist[i].statementlist) setCaller(statementlist[i].statementlist, caller);
		if (statementlist[i].state) setCaller(statementlist[i].state, caller);
		if (statementlist[i].state1) setCaller(statementlist[i].state1, caller);
		if (statementlist[i].state2) setCaller(statementlist[i].state2, caller);
		if (statementlist[i] instanceof ReturnStatement) statementlist[i].setCaller(caller, true);
	}
}

/**
 * 関数呼び出し
 */

var CallFunction = function (_Value36) {
	_inherits(CallFunction, _Value36);

	/**
  * @constructor
  * @param {string} funcname 
  * @param {Array<string>} parameter 
  * @param {Location} loc 
  */
	function CallFunction(funcname, parameter, loc) {
		_classCallCheck(this, CallFunction);

		var _this39 = _possibleConstructorReturn(this, (CallFunction.__proto__ || Object.getPrototypeOf(CallFunction)).call(this, { funcname: funcname, parameter: parameter }, loc));

		_this39.rtnv = null;
		//		this.rtnv = new StringValue("関数が終了していません", loc);
		return _this39;
	}

	_createClass(CallFunction, [{
		key: 'clone',
		value: function clone() {
			//		var rtnv = new CallFunction(this.value[0], this.value[1], this.loc);
			var rtnv = this.rtnv.clone();
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var func = this.value.funcname,
			    param = this.value.parameter;
			if (definedFunction[func]) {
				var index = code[0].stack[0].index;
				//			returnValues.push(definedFunction[func].exec(param, this.loc));
				var fn = definedFunction[func].clone();
				fn.setCaller(this);
				fn.setParameter(param);
				fn.setLocation(this.loc);
				var statementlist = [new runBeforeGetValue(param), fn];
				code.unshift(new parsedFunction(statementlist));
				code[1].stack[0].index = index + 1;
			} else if (myFuncs[func]) {
				var _index = code[0].stack[0].index;
				var _fn = myFuncs[func];
				var vt = new varTable();
				for (var i = 0; i < _fn.params.length; i++) {
					vt.vars[_fn.params[i].varname] = param[i].getValue().clone();
				}
				var _statementlist = [new runBeforeGetValue(param)];
				for (var _i = 0; _i < _fn.statementlist.length; _i++) {
					_statementlist.push(_fn.statementlist[_i].clone());
				}setCaller(_statementlist, this);
				//			let statementlist = fn.statementlist.concat();
				_statementlist.push(new notReturnedFunction(_fn.loc));
				var pf = new parsedFunction(_statementlist);
				code.unshift(pf);
				varTables.unshift(vt);
				code[1].stack[0].index = _index + 1;
			} else throw new RuntimeError(this.first_line, '関数 ' + func + ' は定義されていません');
		}
	}, {
		key: 'setValue',
		value: function setValue(v) {
			this.rtnv = v.clone();
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			//		return returnValues.pop();
			return this.rtnv;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			var func = this.value.funcname,
			    param = this.value.parameter;
			var ag = [];
			for (var i = 0; i < param.length; i++) {
				ag.push(param[i].getCode());
			}return func + '(' + ag.join(',') + ')';
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var func = this.value.funcname,
			    param = this.value.parameter;
			var deffunc = null;
			if (definedFunction[func]) deffunc = definedFunction[func];else if (myFuncs[func]) deffunc = myFuncs[func];
			var ag = [];
			for (var i = 0; i < param.length; i++) {
				ag.push(param[i].makePython());
			}if (deffunc) {
				var prefix = '';
				if (deffunc.module) {
					prefix = deffunc.module + ".";
					python_lib[deffunc.module] = 1;
				}
				if (deffunc.convert) return deffunc.convert(ag);else return prefix + func + '(' + ag.join(',') + ')';
			} else return func + '(' + ag.join(',') + ')';
		}
	}]);

	return CallFunction;
}(Value);

var Connect = function (_Value37) {
	_inherits(Connect, _Value37);

	function Connect(x, y, loc) {
		_classCallCheck(this, Connect);

		return _possibleConstructorReturn(this, (Connect.__proto__ || Object.getPrototypeOf(Connect)).call(this, [x, y], loc));
	}

	_createClass(Connect, [{
		key: 'clone',
		value: function clone() {
			var rtnv = new Connect(this.value[0].clone(), this.value[1].clone(), this.loc);
			rtnv.rtnv = this.rtnv;
			return rtnv;
		}
	}, {
		key: 'run',
		value: function run() {
			var v1 = void 0,
			    v2 = void 0;
			if (this.value[0].getValue() instanceof NullValue) v1 = '';else v1 = array2text(this.value[0].getValue());
			if (this.value[1].getValue() instanceof NullValue) v2 = '';else v2 = array2text(this.value[1].getValue());
			var v = v1 + v2;
			this.rtnv = new StringValue(v, this.loc);
			code[0].stack[0].index++;
		}
	}, {
		key: 'getCode',
		value: function getCode() {
			return this.value[0].getCode() + " と " + this.value[1].getCode();
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			var re = /^str\(/;
			var p1 = this.value[0].makePython();
			var p2 = this.value[1].makePython();
			if (!re.exec(p1)) p1 = "str(" + p1 + ")";
			if (!re.exec(p2)) p2 = "str(" + p2 + ")";
			return p1 + "+" + p2;
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			return this.rtnv;
		}
	}]);

	return Connect;
}(Value);

/**
 * 命令クラス
 */


var Statement = function () {
	/**
  * @constructor
  * @param {Location} loc 
  */
	function Statement(loc) {
		_classCallCheck(this, Statement);

		this._loc = loc;
	}

	_createClass(Statement, [{
		key: 'run',
		value: function run() {
			code[0].stack[0].index++;
		}
		/**
   * 
   * @param {number} indent 
   */

	}, {
		key: 'makePython',
		value: function makePython(indent) {
			return Parts.makeIndent(indent);
		}
	}, {
		key: 'clone',
		value: function clone() {
			throw new RuntimeError(this.first_line, constructor_name(this) + "はcloneが作られていません");
		}
	}, {
		key: 'first_line',
		get: function get() {
			return this._loc.first_line;
		}
	}, {
		key: 'last_line',
		get: function get() {
			return this._loc.last_line;
		}
	}, {
		key: 'loc',
		get: function get() {
			return this._loc;
		}
	}]);

	return Statement;
}();

/**
 * 手続き定義クラス
 */


var DefineStep = function (_Statement) {
	_inherits(DefineStep, _Statement);

	/**
  * @constructor
  * @param {string} funcName 
  * @param {Array<Value>} params 
  * @param {Array<Statement>} statementlist 
  * @param {Location} loc 
  */
	function DefineStep(funcName, params, statementlist, loc) {
		_classCallCheck(this, DefineStep);

		var _this41 = _possibleConstructorReturn(this, (DefineStep.__proto__ || Object.getPrototypeOf(DefineStep)).call(this, loc));

		if (definedFunction[funcName]) throw new RuntimeError(_this41.first_line, '手続き ' + funcName + ' と同名の標準関数が存在します');
		if (myFuncs[funcName]) throw new RuntimeError(_this41.first_line, '手続き ' + funcName + ' と同名の関数、または手続きが既に定義されています');
		_this41.params = params;
		_this41.statementlist = statementlist;
		_this41.funcName = funcName;
		myFuncs[funcName] = _this41;
		return _this41;
	}

	_createClass(DefineStep, [{
		key: 'makePython',
		value: function makePython(indent) {
			var code = "def " + this.funcName + '(';
			for (var i = 0; i < this.params.length; i++) {
				if (i > 0) code += ',';
				code += this.params[i].varname;
			}
			code += '):\n';
			var codes = 0;
			for (var i = 0; i < this.statementlist.length; i++) {
				if (this.statementlist[i]) {
					codes = 1;
					code += this.statementlist[i].makePython(1);
				}
			}if (codes == 0) code += Parts.makeIndent(1) + "None\n";
			return code;
		}
	}]);

	return DefineStep;
}(Statement);

/**
 * 手続き呼び出しが終わった後の処理
 */


var afterCallStep = function () {
	function afterCallStep() {
		_classCallCheck(this, afterCallStep);
	}

	_createClass(afterCallStep, [{
		key: 'run',
		value: function run() {
			varTables.shift();
			code.shift();
		}
	}]);

	return afterCallStep;
}();

/**
 * 手続き呼び出し
 */


var CallStep = function (_Statement2) {
	_inherits(CallStep, _Statement2);

	function CallStep(funcName, args, loc) {
		_classCallCheck(this, CallStep);

		var _this42 = _possibleConstructorReturn(this, (CallStep.__proto__ || Object.getPrototypeOf(CallStep)).call(this, loc));

		_this42.funcName = funcName;
		_this42.args = args;
		return _this42;
	}

	_createClass(CallStep, [{
		key: 'clone',
		value: function clone() {
			return new CallStep(this.funcName, this.args.clone(), this.loc);
		}
	}, {
		key: 'run',
		value: function run() {
			code[0].stack[0].index++;
			var fn = this.funcName;
			var args = this.args;
			if (myFuncs[fn]) {
				var vt = new varTable();
				for (var i = 0; i < myFuncs[fn].params.length; i++) {
					vt.vars[myFuncs[fn].params[i].varname] = args[i].getValue().clone();
				}var statementlist = myFuncs[fn].statementlist.concat();
				// TODO 呼ばれる保証がない
				statementlist.push(new afterCallStep());
				code.unshift(new parsedStep(statementlist));
				varTables.unshift(vt);
			} else throw new RuntimeError(this.first_line, '手続き ' + fn + ' は定義されていません');
		}
	}, {
		key: 'makePython',
		value: function makePython(indent) {
			var code = Parts.makeIndent(indent);
			code += this.funcName + '(';
			for (var i = 0; i < this.args.length; i++) {
				if (i > 0) code += ',';
				code += this.args[i].varname;
			}
			return code + ')\n';
		}
	}]);

	return CallStep;
}(Statement);

var ExitStatement = function (_Statement3) {
	_inherits(ExitStatement, _Statement3);

	function ExitStatement(loc) {
		_classCallCheck(this, ExitStatement);

		return _possibleConstructorReturn(this, (ExitStatement.__proto__ || Object.getPrototypeOf(ExitStatement)).call(this, loc));
	}

	_createClass(ExitStatement, [{
		key: 'clone',
		value: function clone() {
			return new ExitStatement(this.loc);
		}
	}, {
		key: 'run',
		value: function run() {
			if (code[0] instanceof parsedStep) {
				//			code[0].stack[0].index = -1;
				code.shift();
				varTables.shift();
			} else throw new RuntimeError(this.first_line, "手続きの中ではありません");
		}
	}, {
		key: 'makePython',
		value: function makePython(indent) {
			var code = Parts.makeIndent(indent);
			code += "break\n";
			return code;
		}
	}]);

	return ExitStatement;
}(Statement);

var DefineFunction = function (_Statement4) {
	_inherits(DefineFunction, _Statement4);

	function DefineFunction(funcName, params, statementlist, loc) {
		_classCallCheck(this, DefineFunction);

		var _this44 = _possibleConstructorReturn(this, (DefineFunction.__proto__ || Object.getPrototypeOf(DefineFunction)).call(this, loc));

		if (definedFunction[funcName]) throw new RuntimeError(_this44.first_line, '関数 ' + funcName + ' と同名の標準関数が存在します');
		if (myFuncs[funcName]) throw new RuntimeError(_this44.first_line, '関数 ' + funcName + ' と同名の関数、または手続きが既に定義されています');
		_this44.params = params;
		_this44.funcName = funcName;
		myFuncs[funcName] = _this44;
		_this44.statementlist = statementlist;
		return _this44;
	}

	_createClass(DefineFunction, [{
		key: 'run',
		value: function run() {
			_get(DefineFunction.prototype.__proto__ || Object.getPrototypeOf(DefineFunction.prototype), 'run', this).call(this);
		}
	}, {
		key: 'makePython',
		value: function makePython(indent) {
			var code = "def ";
			code += this.funcName + '(';
			for (var i = 0; i < this.params.length; i++) {
				if (i > 0) code += ',';
				code += this.params[i].makePython();
			}
			code += '):\n';
			var codes = 0;
			for (var i = 0; i < this.statementlist.length; i++) {
				if (this.statementlist[i]) {
					codes = 1;
					code += this.statementlist[i].makePython(1);
				}
			}if (codes == 0) code += Parts.makeIndent(1) + "None\n";
			return code;
		}
	}]);

	return DefineFunction;
}(Statement);

/**
 * 関数から値を返す
 */


var ReturnStatement = function (_Statement5) {
	_inherits(ReturnStatement, _Statement5);

	function ReturnStatement(value, loc) {
		_classCallCheck(this, ReturnStatement);

		var _this45 = _possibleConstructorReturn(this, (ReturnStatement.__proto__ || Object.getPrototypeOf(ReturnStatement)).call(this, loc));

		_this45.value = value;
		_this45.caller = null;
		_this45.flag = false;
		return _this45;
	}

	_createClass(ReturnStatement, [{
		key: 'clone',
		value: function clone() {
			return new ReturnStatement(this.value, this.loc);
		}
	}, {
		key: 'setCaller',
		value: function setCaller(caller, flag) {
			this.caller = caller;
			this.flag = flag;
		}
	}, {
		key: 'run',
		value: function run() {
			if (code[0] instanceof parsedFunction) {
				//			this.value.getValue().run();
				//			returnValues.push(this.value.getValue());
				this.caller.setValue(this.value.getValue());
				code.shift();
				if (this.flag) varTables.shift();
				//			super.run();
			} else throw new RuntimeError(this.first_line, "関数の中ではありません");
		}
	}, {
		key: 'makePython',
		value: function makePython(indent) {
			var code = Parts.makeIndent(indent);
			code += "return";
			if (this.value) code += ' ' + this.value.makePython();
			return code + "\n";
		}
	}]);

	return ReturnStatement;
}(Statement);

var notReturnedFunction = function (_Statement6) {
	_inherits(notReturnedFunction, _Statement6);

	function notReturnedFunction(loc) {
		_classCallCheck(this, notReturnedFunction);

		return _possibleConstructorReturn(this, (notReturnedFunction.__proto__ || Object.getPrototypeOf(notReturnedFunction)).call(this, loc));
	}

	_createClass(notReturnedFunction, [{
		key: 'clone',
		value: function clone() {
			return new notReturnedFunction(this.loc);
		}
	}, {
		key: 'run',
		value: function run() {
			throw new RuntimeError(this.last_line, "関数が値を返さずに終了しました");
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			return '';
		}
	}]);

	return notReturnedFunction;
}(Statement);

var DumpStatement = function (_Statement7) {
	_inherits(DumpStatement, _Statement7);

	function DumpStatement(loc) {
		_classCallCheck(this, DumpStatement);

		return _possibleConstructorReturn(this, (DumpStatement.__proto__ || Object.getPrototypeOf(DumpStatement)).call(this, loc));
	}

	_createClass(DumpStatement, [{
		key: 'clone',
		value: function clone() {
			return new DumpStatement(this.loc);
		}
	}, {
		key: 'run',
		value: function run() {
			textareaAppend("*** 変数確認 ***\n");
			var vars = varTables[0].varnames([]);
			if (varTables.length > 1) vars = varTables[varTables.length - 1].varnames(vars);
			for (var i = 0; i < vars.length; i++) {
				var vartable = findVarTable(vars[i]);
				var v = vartable.vars[vars[i]];
				textareaAppend(vars[i] + ":" + array2code(v) + "\n");
			}
			_get(DumpStatement.prototype.__proto__ || Object.getPrototypeOf(DumpStatement.prototype), 'run', this).call(this);
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			return '';
		}
	}]);

	return DumpStatement;
}(Statement);

/**
 * ValueのArrayをcode[0].stackに積む
 * @param {Array<Value>|ArrayValue} args 
 * @param {Array} queue
 */


function valuelist2stack(args, queue) {
	if (args instanceof Array) {
		for (var i = 0; i < args.length; i++) {
			var v = args[i];
			if (v instanceof ArrayValue) valuelist2stack(v.value, queue);else if (v instanceof Variable && v.args) valuelist2stack(v.args, queue);else if (v && !(v instanceof Variable) && v.value instanceof Array) valuelist2stack(v.value, queue);else if (v instanceof CallFunction) {
				valuelist2stack(v.value.parameter, queue);
				//				valuelist2stack(v, queue);
			}
			queue.push(v);
		}
	} else if (args instanceof ArrayValue) {
		for (var _i2 = 0; _i2 < args.length; _i2++) {
			var _v3 = args.nthValue(_i2);
			if (_v3 instanceof ArrayValue) valuelist2stack(_v3.value, queue);else if (_v3 instanceof Variable && _v3.args) valuelist2stack(_v3.args, queue);else if (_v3 && !(_v3 instanceof Variable) && _v3.value instanceof Array) valuelist2stack(_v3.value, queue);else if (_v3 instanceof CallFunction) {
				valuelist2stack(_v3.value.parameter, queue);
				//				valuelist2stack(v, queue);
			}
			queue.push(_v3);
		}
	} else queue.push(args);
}

var runBeforeGetValue = function (_Statement8) {
	_inherits(runBeforeGetValue, _Statement8);

	/**
  * @constructor
  * @param {Array<Value>} args 
  * @param {Location} loc 
  */
	function runBeforeGetValue(args, loc) {
		_classCallCheck(this, runBeforeGetValue);

		var _this48 = _possibleConstructorReturn(this, (runBeforeGetValue.__proto__ || Object.getPrototypeOf(runBeforeGetValue)).call(this, loc));

		_this48.args = args;
		return _this48;
	}

	_createClass(runBeforeGetValue, [{
		key: 'clone',
		value: function clone() {
			//		var args = [];
			//		for(var i = 0; i < this.args.length; i++) args.push(this.args[i].clone());
			return new runBeforeGetValue(this.args, this.loc);
		}
	}, {
		key: 'run',
		value: function run() {
			_get(runBeforeGetValue.prototype.__proto__ || Object.getPrototypeOf(runBeforeGetValue.prototype), 'run', this).call(this);
			var queue = [];
			valuelist2stack(this.args, queue);
			code[0].stack.unshift({ statementlist: queue, index: 0 });
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			return '';
		}
	}]);

	return runBeforeGetValue;
}(Statement);

var runArgsBeforeGetValue = function (_Statement9) {
	_inherits(runArgsBeforeGetValue, _Statement9);

	/**
  * @constructor
  * @param {Array<Value>} args 
  * @param {Location} loc 
  */
	function runArgsBeforeGetValue(args, loc) {
		_classCallCheck(this, runArgsBeforeGetValue);

		var _this49 = _possibleConstructorReturn(this, (runArgsBeforeGetValue.__proto__ || Object.getPrototypeOf(runArgsBeforeGetValue)).call(this, loc));

		_this49.args = args;
		return _this49;
	}

	_createClass(runArgsBeforeGetValue, [{
		key: 'clone',
		value: function clone() {
			var args = [];
			for (var i = 0; i < this.args.length; i++) {
				args.push(this.args[i].clone());
			}return new runArgsBeforeGetValue(this.args, this.loc);
		}
	}, {
		key: 'run',
		value: function run() {
			_get(runArgsBeforeGetValue.prototype.__proto__ || Object.getPrototypeOf(runArgsBeforeGetValue.prototype), 'run', this).call(this);
			var queue = [];
			for (var i = 0; i < this.args.length; i++) {
				if (this.args[i].parameter) valuelist2stack(this.args[i].parameter, queue);
				if (this.args[i].args) valuelist2stack(this.args[i].args, queue);
			}
			code[0].stack.unshift({ statementlist: queue, index: 0 });
		}
	}, {
		key: 'makePython',
		value: function makePython() {
			return '';
		}
	}]);

	return runArgsBeforeGetValue;
}(Statement);

/**
 * 変数定義クラスの親クラス
 */


var DefinitionStatement = function (_Statement10) {
	_inherits(DefinitionStatement, _Statement10);

	function DefinitionStatement(loc) {
		_classCallCheck(this, DefinitionStatement);

		return _possibleConstructorReturn(this, (DefinitionStatement.__proto__ || Object.getPrototypeOf(DefinitionStatement)).call(this, loc));
	}

	_createClass(DefinitionStatement, [{
		key: 'getCode',
		value: function getCode() {
			var ag = [];
			for (var i = 0; i < this.vars.length; i++) {
				var vn = this.vars[i].varname;
				var pm = this.vars[i].parameter;
				if (pm) {
					var pl = [];
					for (var j = 0; j < pm.length; j++) {
						pl.push(pm.nthValue(j).getCode());
					}vn += '[' + pl.join(',') + ']';
				}
				ag.push(vn);
			}
			return ag.join(',');
		}
	}, {
		key: 'makePython',
		value: function makePython(indent) {
			return ''; // TODO どうしよう…
		}
	}]);

	return DefinitionStatement;
}(Statement);

var DefinitionInt = function (_DefinitionStatement) {
	_inherits(DefinitionInt, _DefinitionStatement);

	function DefinitionInt(x, loc) {
		_classCallCheck(this, DefinitionInt);

		var _this51 = _possibleConstructorReturn(this, (DefinitionInt.__proto__ || Object.getPrototypeOf(DefinitionInt)).call(this, loc));

		_this51.vars = x;
		return _this51;
	}

	_createClass(DefinitionInt, [{
		key: 'run',
		value: function run() {
			_get(DefinitionInt.prototype.__proto__ || Object.getPrototypeOf(DefinitionInt.prototype), 'run', this).call(this);
			for (var i = 0; i < this.vars.length; i++) {
				if (this.vars[i] instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");

				var varname = this.vars[i].varname;
				var parameter = this.vars[i].parameter;
				var v = varTables[0].findVarTable(varname);
				if (v) throw new RuntimeError(this.first_line, varname + "の宣言が重複しています");
				if (!parameter) varTables[0].vars[varname] = new IntValue(0, this.loc);else varTables[0].vars[varname] = makeArray(parameter, [], this.loc, typeOfValue.typeInt);
			}
		}
	}]);

	return DefinitionInt;
}(DefinitionStatement);

var DefinitionFloat = function (_DefinitionStatement2) {
	_inherits(DefinitionFloat, _DefinitionStatement2);

	function DefinitionFloat(x, loc) {
		_classCallCheck(this, DefinitionFloat);

		var _this52 = _possibleConstructorReturn(this, (DefinitionFloat.__proto__ || Object.getPrototypeOf(DefinitionFloat)).call(this, loc));

		_this52.vars = x;
		return _this52;
	}

	_createClass(DefinitionFloat, [{
		key: 'run',
		value: function run() {
			_get(DefinitionFloat.prototype.__proto__ || Object.getPrototypeOf(DefinitionFloat.prototype), 'run', this).call(this);
			for (var i = 0; i < this.vars.length; i++) {
				if (this.vars[i] instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");

				var varname = this.vars[i].varname;
				var parameter = this.vars[i].parameter;
				var v = varTables[0].findVarTable(varname);
				if (v) throw new RuntimeError(this.first_line, varname + "の宣言が重複しています");
				if (!parameter) varTables[0].vars[varname] = new FloatValue(0.0, this.loc);else varTables[0].vars[varname] = makeArray(parameter, [], this.loc, typeOfValue.typeFloat);
			}
		}
	}]);

	return DefinitionFloat;
}(DefinitionStatement);

var DefinitionString = function (_DefinitionStatement3) {
	_inherits(DefinitionString, _DefinitionStatement3);

	function DefinitionString(x, loc) {
		_classCallCheck(this, DefinitionString);

		var _this53 = _possibleConstructorReturn(this, (DefinitionString.__proto__ || Object.getPrototypeOf(DefinitionString)).call(this, loc));

		_this53.vars = x;
		return _this53;
	}

	_createClass(DefinitionString, [{
		key: 'run',
		value: function run() {
			_get(DefinitionString.prototype.__proto__ || Object.getPrototypeOf(DefinitionString.prototype), 'run', this).call(this);
			for (var i = 0; i < this.vars.length; i++) {
				if (this.vars[i] instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");

				var varname = this.vars[i].varname;
				var parameter = this.vars[i].parameter;
				var v = varTables[0].findVarTable(varname);
				if (v) throw new RuntimeError(this.first_line, varname + "の宣言が重複しています");
				if (!parameter) varTables[0].vars[varname] = new StringValue('', this.loc);else varTables[0].vars[varname] = makeArray(parameter, [], this.loc, typeOfValue.typeString);
			}
		}
	}]);

	return DefinitionString;
}(DefinitionStatement);

var DefinitionBoolean = function (_DefinitionStatement4) {
	_inherits(DefinitionBoolean, _DefinitionStatement4);

	function DefinitionBoolean(x, loc) {
		_classCallCheck(this, DefinitionBoolean);

		var _this54 = _possibleConstructorReturn(this, (DefinitionBoolean.__proto__ || Object.getPrototypeOf(DefinitionBoolean)).call(this, loc));

		_this54.vars = x;
		return _this54;
	}

	_createClass(DefinitionBoolean, [{
		key: 'run',
		value: function run() {
			_get(DefinitionBoolean.prototype.__proto__ || Object.getPrototypeOf(DefinitionBoolean.prototype), 'run', this).call(this);
			for (var i = 0; i < this.vars.length; i++) {
				for (var i = 0; i < this.vars.length; i++) {
					if (this.vars[i] instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");

					var varname = this.vars[i].varname;
					var parameter = this.vars[i].parameter;
					var v = varTables[0].findVarTable(varname);
					if (v) throw new RuntimeError(this.first_line, varname + "の宣言が重複しています");
					if (!parameter) varTables[0].vars[varname] = new BooleanValue(true, this.loc);else varTables[0].vars[varname] = makeArray(parameter, [], this.loc, typeOfValue.typeBoolean);
				}
			}
		}
	}]);

	return DefinitionBoolean;
}(DefinitionStatement);

/**
 * ArrayValueを文字列表現にする
 * @param {ArrayValue} args 
 * @returns {string}
 */


function argsString(args) {
	if (args instanceof ArrayValue) {
		var a = [];
		for (var i = 0; i < args.value.length; i++) {
			a.push(args.value[i].getValue().value);
		}return '[' + a.join(',') + ']';
	}
	return '';
}

var Assign = function (_Statement11) {
	_inherits(Assign, _Statement11);

	/**
  * @constructor
  * @param {Variable} variable 
  * @param {Value} value 
  * @param {String} operator
  * @param {Location} loc
  */
	function Assign(variable, value, operator, loc) {
		_classCallCheck(this, Assign);

		var _this55 = _possibleConstructorReturn(this, (Assign.__proto__ || Object.getPrototypeOf(Assign)).call(this, loc));

		if (!(variable instanceof Variable || variable instanceof UNDEFINED)) throw new RuntimeError(loc.first_line, "変数でないものに代入はできません");
		_this55.variable = variable;
		_this55.value = value;
		_this55.operator = operator;
		return _this55;
	}

	_createClass(Assign, [{
		key: 'clone',
		value: function clone() {
			return new Assign(this.variable, this.value, this.operator, this.loc);
		}
	}, {
		key: 'run',
		value: function run() {
			if (this.variable instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");

			var index = code[0].stack[0].index; // 内部でrun()を呼び出すところがあるので，super.run()を呼んではいけない
			var vn = this.variable.varname;
			var ag = this.variable.args;
			var vl = this.value.getValue();
			var vt = findVarTable(vn);
			if (vt) // 変数が定義されている
				{
					var va = vt.vars[vn];
					if (ag && ag.value.length > 0) // 配列の添字がある
						{
							if (!(va instanceof ArrayValue)) vt.vars[vn] = va = new ArrayValue([], this.loc); // vaが配列でないときは新たに配列にする
							for (var i = 0; i < ag.value.length; i++) {
								if (va.nthValue(ag.value[i].getValue().value)) va = va.nthValue(ag.value[i].getValue().value);else {
									// 配列を延長する
									if (i < ag.value.length - 1) va = new ArrayValue([], this.loc);else va = new NullValue(this.loc);
								}
							}
						}
					if (this.operator) {
						var v1 = va.getValue(),
						    v2 = vl,
						    v3 = null;
						switch (this.operator) {
							case '+':
								if (v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
								if (v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
								if (v1 instanceof ArrayValue && v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の足し算はまだサポートしていません");else if (v1 instanceof StringValue || v2 instanceof StringValue) v3 = new StringValue(String(v1.value) + String(v2.value), this.loc);else if (v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(v1.value + v2.value, this.loc);else if (v1 instanceof FloatValue || v2 instanceof FloatValue) v3 = new FloatValue(v1.value + v2.value, this.loc);
								break;
							case '-':
								if (v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
								if (v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
								if (v1 instanceof ArrayValue && v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の引き算はできません");else if (v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の引き算はできません");else if (v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(v1.value - v2.value, this.loc);else if (v1 instanceof FloatValue || v2 instanceof FloatValue) v3 = new FloatValue(v1.value - v2.value, this.loc);
								break;
							case '*':
								if (v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
								if (v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
								if (v1 instanceof ArrayValue && v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の掛け算は出来ません");else if (v1 instanceof StringValue) {
									if (v2 instanceof IntValue) v3 = new StringValue(v1.value.repeat(v2.value >= 0 ? v2.value : 0), this.loc);else throw new RuntimeError(this.first_line, "文字列に掛けられるのは整数だけです");
								} else if (v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(v1.value * v2.value, this.loc);else if (v1 instanceof FloatValue || v2 instanceof FloatValue) v3 = new FloatValue(v1.value * v2.value, this.loc);
								break;
							case '/':
								if (v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
								if (v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
								if (v1 instanceof ArrayValue && v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の割り算はできません");else if (v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の割り算はできません");else {
									if (v2.value == 0) throw new RuntimeError(this.first_line, '0で割り算をしました');else v3 = new FloatValue(v1.value / v2.value, this.loc);
								}
								break;
							case '//':
								if (v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
								if (v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
								if (v1 instanceof ArrayValue && v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の割り算はできません");else if (v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の割り算はできません");else {
									if (v2.value == 0) throw new RuntimeError(this.first_line, '0で割り算をしました');
									var v4 = v1.value - Math.floor(v1.value / v2.value) * v2.value;
									if (v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(v4, this.loc);else v3 = new FloatValue(v4, this.loc);
								}
								break;
							case '%':
								if (v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
								if (v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
								if (v1 instanceof ArrayValue && v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の割り算はできません");else if (v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の割り算はできません");else {
									if (v2.value == 0) throw new RuntimeError(this.first_line, '0で割り算をしました');
									var _v4 = v1.value - Math.floor(v1.value / v2.value) * v2.value;
									if (v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(_v4, this.loc);else v3 = new FloatValue(_v4, this.loc);
								}
								break;
							case '&':
								if (v1 instanceof ArrayValue && v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビット積はできません");else if (v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビット積はできません");else if (v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビット積はできません");else if (v1 instanceof BooleanValue && v2 instanceof BooleanValue) v3 = new BooleanValue(v1.value && v2.value, this.loc);else {
									if (v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
									if (v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
									v3 = new IntValue(v1.value & v2.value, this.loc);
								}
								break;
							case '|':
								if (v1 instanceof ArrayValue && v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビット和はできません");else if (v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビット和はできません");else if (v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビット和はできません");else if (v1 instanceof BooleanValue && v2 instanceof BooleanValue) v3 = new BooleanValue(v1.value && v2.value, this.loc);else {}
								break;
							case '^':
								if (v1 instanceof ArrayValue && v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の排他的論理和はできません");else if (v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の排他的論理和はできません");else if (v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数の排他的論理和はできません");else if (v1 instanceof BooleanValue && v2 instanceof BooleanValue) v3 = new BooleanValue(v1.value && v2.value, this.loc);else {
									if (v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
									if (v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
									v3 = new IntValue(v1.value ^ v2.value, this.loc);
								}
								break;
							case '<<':
								if (v1 instanceof ArrayValue && v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビットシフトはできません");else if (v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビットシフトはできません");else if (v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビットシフトはできません");else if (v1 instanceof BooleanValue && v2 instanceof BooleanValue) v3 = new BooleanValue(v1.value && v2.value, this.loc);else {
									if (v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
									if (v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
									v3 = new IntValue(v1.value << v2.value, this.loc);
								}
								break;
							case '>>':
								if (v1 instanceof ArrayValue && v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビットシフトはできません");else if (v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビットシフトはできません");else if (v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビットシフトはできません");else if (v1 instanceof BooleanValue && v2 instanceof BooleanValue) v3 = new BooleanValue(v1.value && v2.value, this.loc);else {
									if (v1 instanceof BooleanValue) v1 = new IntValue(v1.value ? 1 : 0, this.loc);
									if (v2 instanceof BooleanValue) v2 = new IntValue(v2.value ? 1 : 0, this.loc);
									v3 = new IntValue(v1.value >> v2.value, this.loc);
								}
								break;
						}
						if (!v3) throw new RuntimeError(this.first_line, '代入演算子の使い方が間違っています');
						if (ag) vt.vars[vn].setValueToArray(ag, v3);else vt.vars[vn] = v3;
					} else if (vl.getValue() instanceof IntValue) {
						if (ag) vt.vars[vn].setValueToArray(ag, new IntValue(vl.value, this.loc));else vt.vars[vn] = new IntValue(vl.value, this.loc);
					} else if (vl.getValue() instanceof FloatValue) {
						if (ag) vt.vars[vn].setValueToArray(ag, new FloatValue(vl.value, this.loc));else vt.vars[vn] = new FloatValue(vl.value, this.loc);
					} else if (vl.getValue() instanceof StringValue) {
						if (ag) vt.vars[vn].setValueToArray(ag, new StringValue(vl.value, this.loc));else vt.vars[vn] = new StringValue(vl.value, this.loc);
					} else if (vl.getValue() instanceof BooleanValue) {
						if (ag) vt.vars[vn].setValueToArray(ag, new BooleanValue(vl.value, this.loc));else vt.vars[vn] = new BooleanValue(vl.value, this.loc);
					} else if (vl.getValue() instanceof ArrayValue) {
						if (ag) vt.vars[vn].setValueToArray(ag, vl.getValue());else vt.vars[vn] = vl.getValue().clone();
					} else if (vl.getValue() instanceof NullValue) {
						if (ag) vt.vars[vn].setValueToArray(ag, new NullValue(this.loc));else vt.vars[vn] = new NullValue(vl.value, this.loc);
					}
				} else // 変数が定義されていない
				{
					if (this.operator) {
						throw new RuntimeError(this.first_line, '宣言されていない変数に代入演算子が使われました');
					}
					vt = varTables[0];
					if (ag) {
						vt.vars[vn] = new ArrayValue([], this.loc);
						if (vl.getValue() instanceof IntValue) vt.vars[vn].setValueToArray(ag, new IntValue(vl.value, this.loc));else if (vl.getValue() instanceof FloatValue) vt.vars[vn].setValueToArray(ag, new FloatValue(vl.value, this.loc));else if (vl.getValue() instanceof StringValue) vt.vars[vn].setValueToArray(ag, new StringValue(vl.value, this.loc));else if (vl.getValue() instanceof BooleanValue) vt.vars[vn].setValueToArray(ag, new BooleanValue(vl.value, this.loc));else if (vl.getValue() instanceof ArrayValue) vt.vars[vn].setValueToArray(ag, vl.getValue());
					} else {
						if (vl.getValue() instanceof IntValue) vt.vars[vn] = new IntValue(vl.value, this.loc);else if (vl.getValue() instanceof FloatValue) vt.vars[vn] = new FloatValue(vl.value, this.loc);else if (vl.getValue() instanceof StringValue) vt.vars[vn] = new StringValue(vl.value, this.loc);else if (vl.getValue() instanceof BooleanValue) vt.vars[vn] = new BooleanValue(vl.value, this.loc);else if (vl.getValue() instanceof ArrayValue) vt.vars[vn] = vl.getValue().clone();
					}
				}
			code[0].stack[0].index = index + 1;
		}
	}, {
		key: 'makePython',
		value: function makePython(indent) {
			var code = Parts.makeIndent(indent);
			code += this.variable.makePython() + " ";
			if (this.operator) code += this.operator;
			code += "= " + this.value.makePython() + "\n";
			return code;
		}
	}]);

	return Assign;
}(Statement);

var Append = function (_Statement12) {
	_inherits(Append, _Statement12);

	/**
  * @constructor
  * @param {Variable} variable 
  * @param {Value} value 
  * @param {Location} loc 
  */
	function Append(variable, value, loc) {
		_classCallCheck(this, Append);

		var _this56 = _possibleConstructorReturn(this, (Append.__proto__ || Object.getPrototypeOf(Append)).call(this, loc));

		if (!(variable instanceof Variable || variable instanceof UNDEFINED)) throw new RuntimeError(loc.first_line, "追加されるものは変数でなくてはいけません");
		_this56.variable = variable;
		_this56.value = value;
		return _this56;
	}

	_createClass(Append, [{
		key: 'clone',
		value: function clone() {
			return new Append(this.variable, this.value, this.loc);
		}
	}, {
		key: 'run',
		value: function run() {
			if (this.variable instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");

			var index = code[0].stack[0].index; // 内部でrun()を呼び出すところがあるので，super.run()を呼んではいけない
			var vn = this.variable.varname;
			var ag = this.variable.args;
			var vl = this.value.getValue();
			var vt = findVarTable(vn);
			if (vt) // 変数が定義されている
				{
					var va = vt.vars[vn];
					if (ag && ag.value.length > 0) // 配列の添字がある
						{
							if (!(va instanceof ArrayValue)) vt.vars[vn] = va = new ArrayValue([], this.loc); // vaが配列でないときは新たに配列にする
							for (var i = 0; i < ag.value.length; i++) {
								if (ag.value[i] instanceof StringValue) {
									va = va.aarray[ag.value[i].getValue().value];
								} else {
									if (va.nthValue(ag.value[i].getValue().value)) va = va.nthValue(ag.value[i].getValue().value);else throw new RuntimeError(this.first_line, '配列の範囲を超えたところに追加しようとしました');
								}
							}
						}
					if (va instanceof ArrayValue) va.value.push(vl.clone());else throw new RuntimeError(this.first_line, '配列でない変数に追加はできません');
				} else // 変数が定義されていない
				throw new RuntimeError(this.first_line, '存在しない配列に追加はできません');
			code[0].stack[0].index = index + 1;
		}
	}, {
		key: 'makePython',
		value: function makePython(indent) {
			var code = Parts.makeIndent(indent);
			code += this.variable.makePython() + ".append(" + this.value.makePython() + ")\n";
			return code;
		}
	}]);

	return Append;
}(Statement);

var Extend = function (_Statement13) {
	_inherits(Extend, _Statement13);

	/**
  * @constructor
  * @param {Variable} variable 
  * @param {Value} value 
  * @param {Location} loc 
  */
	function Extend(variable, value, loc) {
		_classCallCheck(this, Extend);

		var _this57 = _possibleConstructorReturn(this, (Extend.__proto__ || Object.getPrototypeOf(Extend)).call(this, loc));

		if (!(variable instanceof Variable || variable instanceof UNDEFINED)) throw new RuntimeError(loc.first_line, "連結されるものは変数でなくてはいけません");
		_this57.variable = variable;
		_this57.value = value;
		return _this57;
	}

	_createClass(Extend, [{
		key: 'clone',
		value: function clone() {
			return new Extend(this.variable, this.value, this.loc);
		}
	}, {
		key: 'run',
		value: function run() {
			if (this.variable instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");

			var index = code[0].stack[0].index; // 内部でrun()を呼び出すところがあるので，super.run()を呼んではいけない
			var vn = this.variable.varname;
			var ag = this.variable.args;
			var vl = this.value.getValue();
			var vt = findVarTable(vn);
			if (vt) // 変数が定義されている
				{
					var va = vt.vars[vn];
					if (ag && ag.value.length > 0) // 配列の添字がある
						{
							if (!(va instanceof ArrayValue)) vt.vars[vn] = va = new ArrayValue([], this.loc); // vaが配列でないときは新たに配列にする
							for (var _i3 = 0; _i3 < ag.value.length; _i3++) {
								if (ag.value[_i3] instanceof StringValue) {
									va = va.aarray[ag.value[_i3].getValue().value];
								} else {
									if (va.nthValue(ag.value[_i3].getValue().value)) va = va.nthValue(ag.value[_i3].getValue().value);else throw new RuntimeError(this.first_line, '配列の範囲を超えたところに連結しようとしました');
								}
							}
						}
					if (va instanceof ArrayValue) {
						if (vl instanceof ArrayValue) {
							var l = vl.value.length;
							for (var i = 0; i < l; i++) {
								va.value.push(vl.value[i].clone());
							}
						} else throw new RuntimeError(this.first_line, '配列でない値を連結することはできません');
					} else throw new RuntimeError(this.first_line, '配列でない変数に連結はできません');
				} else // 変数が定義されていない
				throw new RuntimeError(this.first_line, '存在しない配列に連結はできません');
			code[0].stack[0].index = index + 1;
		}
	}, {
		key: 'makePython',
		value: function makePython(indent) {
			var code = Parts.makeIndent(indent);
			code += this.variable.makePython() + ".extend(" + this.value.makePython() + ")\n";
			return code;
		}
	}]);

	return Extend;
}(Statement);

var Input = function (_Statement14) {
	_inherits(Input, _Statement14);

	function Input(x, type, loc) {
		_classCallCheck(this, Input);

		var _this58 = _possibleConstructorReturn(this, (Input.__proto__ || Object.getPrototypeOf(Input)).call(this, loc));

		if (!(x instanceof Variable || x instanceof UNDEFINED)) throw new RuntimeError(loc.first_line, "入力されるものは変数でなくてはいけません");
		_this58.varname = x;
		_this58.type = type;
		return _this58;
	}

	_createClass(Input, [{
		key: 'clone',
		value: function clone() {
			new Input(this.varname, this.type, this.loc);
		}
	}, {
		key: 'run',
		value: function run() {
			if (selected_quiz < 0) // 通常時
				{
					if (this.varname instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");
					var list = [new InputBegin(this.loc), new InputEnd(this.varname, this.type, this.loc)];
					code.unshift(new parsedCode(list));
				} else // 自動採点時
				{
					if (selected_quiz_input < Quizzes[selected_quiz].inputs(selected_quiz_case).length) {
						var index = code[0].stack[0].index;
						if (this.varname instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");
						var va = new Variable(this.varname.varname, this.varname.args, this.loc);
						var vl = Quizzes[selected_quiz].inputs(selected_quiz_case)[selected_quiz_input++];
						va.run();
						var assign = null;
						var re = /^(0+|false|偽|)$/i;
						if (this.type == typeOfValue.typeInt) assign = new Assign(va, new IntValue(Number(toHalf(vl, this.loc)), this.loc), null, this.loc);else if (this.type == typeOfValue.typeFloat) assign = new Assign(va, new FloatValue(Number(toHalf(vl, this.loc)), null, this.loc), this.loc);else if (this.type == typeOfValue.typeString) assign = new Assign(va, new StringValue(vl + '', this.loc), null, this.loc);else if (this.type == typeOfValue.typeBoolean) assign = new Assign(va, new BooleanValue(!re.exec(vl), this.loc), null, this.loc);assign.run();
						code[0].stack[0].index = index + 1;
					} else throw new RuntimeError(this.first_line, '必要以上の入力を求めています。');
				}
		}
	}, {
		key: 'makePython',
		value: function makePython(indent) {
			var code = Parts.makeIndent(indent);
			code += this.varname.makePython() + " = ";
			switch (this.type) {
				case typeOfValue.typeInt:
					code += "int(input())\n";break;
				case typeOfValue.typeFloat:
					code += "float(input())\n";break;
				case typeOfValue.typeString:
					code += "input()\n";break;
				case typeOfValue.typeBoolean:
					code += "bool(input())\n";break;
			}
			return code;
		}
	}]);

	return Input;
}(Statement);

var InputBegin = function (_Statement15) {
	_inherits(InputBegin, _Statement15);

	/**
  * @constructor
  * @param {Location} loc 
  */
	function InputBegin(loc) {
		_classCallCheck(this, InputBegin);

		return _possibleConstructorReturn(this, (InputBegin.__proto__ || Object.getPrototypeOf(InputBegin)).call(this, loc));
	}

	_createClass(InputBegin, [{
		key: 'clone',
		value: function clone() {
			return new InputBegin(this.loc);
		}
	}, {
		key: 'run',
		value: function run() {
			openInputWindow();
			_get(InputBegin.prototype.__proto__ || Object.getPrototypeOf(InputBegin.prototype), 'run', this).call(this);
		}
	}]);

	return InputBegin;
}(Statement);

var InputEnd = function (_Statement16) {
	_inherits(InputEnd, _Statement16);

	/**
  * @constructor
  * @param {Variable} x
  * @param {typeOfValue} type 
  * @param {Location} loc 
  */
	function InputEnd(x, type, loc) {
		_classCallCheck(this, InputEnd);

		var _this60 = _possibleConstructorReturn(this, (InputEnd.__proto__ || Object.getPrototypeOf(InputEnd)).call(this, loc));

		_this60.varname = x;
		_this60.type = type;
		return _this60;
	}

	_createClass(InputEnd, [{
		key: 'clone',
		value: function clone() {
			return new InputEnd(this.varname, this.type, this.loc);
		}
	}, {
		key: 'run',
		value: function run() {
			if (this.varname instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");
			try {
				var va = new Variable(this.varname.varname, this.varname.args, this.loc);
				var vl = closeInputWindow();
				va.run();
				var assign = null;
				var re = /^(0+|false|偽|)$/i;
				code.shift();
				var index = code[0].stack[0].index;
				if (this.type == typeOfValue.typeInt) assign = new Assign(va, new IntValue(Number(toHalf(vl, this.loc)), this.loc), null, this.loc);else if (this.type == typeOfValue.typeFloat) assign = new Assign(va, new FloatValue(Number(toHalf(vl, this.loc)), this.loc), null, this.loc);else if (this.type == typeOfValue.typeString) assign = new Assign(va, new StringValue(vl + '', this.loc), null, this.loc);else if (this.type == typeOfValue.typeBoolean) assign = new Assign(va, new BooleanValue(!re.exec(vl), this.loc), null, this.loc);
				assign.run();
				code[0].stack[0].index = index + 1;
			} catch (e) {
				closeInputWindow();
				code.shift();
				throw e;
			}
		}
	}]);

	return InputEnd;
}(Statement);

var Newline = function (_Statement17) {
	_inherits(Newline, _Statement17);

	function Newline(loc) {
		_classCallCheck(this, Newline);

		return _possibleConstructorReturn(this, (Newline.__proto__ || Object.getPrototypeOf(Newline)).call(this, loc));
	}

	_createClass(Newline, [{
		key: 'clone',
		value: function clone() {
			return new Newline(this.loc);
		}
	}, {
		key: 'run',
		value: function run() {
			if (selected_quiz < 0) {
				textareaAppend("\n");
			} else {
				output_str += "\n";
			}
			_get(Newline.prototype.__proto__ || Object.getPrototypeOf(Newline.prototype), 'run', this).call(this);
		}
	}, {
		key: 'makePython',
		value: function makePython(indent) {
			return Parts.makeIndent(indent) + "print()\n";
		}
	}]);

	return Newline;
}(Statement);

var Output = function (_Statement18) {
	_inherits(Output, _Statement18);

	/**
  * 
  * @param {Value} x 
  * @param {boolean} ln 
  * @param {Location} loc 
  */
	function Output(x, ln, loc) {
		_classCallCheck(this, Output);

		var _this62 = _possibleConstructorReturn(this, (Output.__proto__ || Object.getPrototypeOf(Output)).call(this, loc));

		_this62.value = x;
		_this62.ln = ln;
		return _this62;
	}

	_createClass(Output, [{
		key: 'clone',
		value: function clone() {
			return new Output(this.value.clone(), this.ln, this.loc);
		}
	}, {
		key: 'run',
		value: function run() {
			var index = code[0].stack[0].index;
			//this.value.run();
			var v = this.value.getValue();
			if (selected_quiz < 0) {
				textareaAppend(array2text(v) + (this.ln ? "\n" : ""));
			} else {
				output_str += array2text(v) + (this.ln ? "\n" : "");
			}
			code[0].stack[0].index = index + 1;
		}
	}, {
		key: 'makePython',
		value: function makePython(indent) {
			var code = Parts.makeIndent(indent);
			code += "print(";
			code += this.value.makePython();
			if (!this.ln) code += ",end=''";
			return code + ")\n";
		}
	}]);

	return Output;
}(Statement);

function array2text(v) {
	if (v instanceof NullValue || !v) return '';
	if (v instanceof Value) {
		var v0 = v.getValue();
		if (v0 instanceof ArrayValue) {
			var v1 = [];
			var keys = Object.keys(v0.aarray);
			keys.sort();
			for (var i = 0; i < v0.value.length; i++) {
				v1.push(array2text(v0.nthValue(i)));
			}for (var _i4 = 0; _i4 < keys.length; _i4++) {
				v1.push(keys[_i4] + ':' + array2text(v0.aarray[keys[_i4]]));
			}return '[' + v1.join(',') + ']';
		} else if (v0 instanceof FloatValue && isInteger(v0.value) && !v0.value.toString().match(/[Ee]/)) return v0.value + '.0';else return v0.value;
	} else return new String(v);
}

function array2code(v) {
	if (v instanceof NullValue || !v) return '';
	var v0 = v.getValue();
	if (v0 instanceof ArrayValue) {
		var v1 = [];
		var keys = Object.keys(v0.aarray);
		for (var i = 0; i < v0.value.length; i++) {
			v1.push(array2text(v0.nthValue(i)));
		}for (var _i5 = 0; _i5 < keys.length; _i5++) {
			v1.push(keys[_i5] + ':' + array2text(v0.aarray[keys[_i5]]));
		}return '[' + v1.join(',') + ']';
	} else if (v0 instanceof StringValue) return "「" + v0.value + "」";else if (v0 instanceof FloatValue && isInteger(v0.value) && !v0.value.toString().match(/[Ee]/)) return v0.value + '.0';
	return v0.value;
}

var GraphicStatement = function (_Statement19) {
	_inherits(GraphicStatement, _Statement19);

	function GraphicStatement(command, args, loc) {
		_classCallCheck(this, GraphicStatement);

		var _this63 = _possibleConstructorReturn(this, (GraphicStatement.__proto__ || Object.getPrototypeOf(GraphicStatement)).call(this, loc));

		_this63.command = command;
		_this63.args = args;
		return _this63;
	}

	_createClass(GraphicStatement, [{
		key: 'clone',
		value: function clone() {
			var args = [];
			for (var i = 0; i < this.args.length; i++) {
				args.push(this.args[i]);
			}return new GraphicStatement(this.command, args, this.loc);
		}
	}, {
		key: 'run',
		value: function run() {
			_get(GraphicStatement.prototype.__proto__ || Object.getPrototypeOf(GraphicStatement.prototype), 'run', this).call(this);
			if (this.command == 'gOpenWindow') {
				var canvas = document.getElementById('canvas');
				context = canvas.getContext('2d');
				canvas.setAttribute("width", this.args[0].getValue().value + "px");
				canvas.setAttribute("height", this.args[1].getValue().value + "px");
				canvas.style.display = "block";
			} else if (this.command == 'gCloseWindow') {
				var canvas = document.getElementById('canvas');
				canvas.style.display = "none";
				context = null;
			} else if (this.command == 'gClearWindow') {
				var canvas = document.getElementById('canvas');
				context.clearRect(0, 0, canvas.width, canvas.height);
			} else if (this.command == 'gSetLineColor') {
				if (context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				var r = this.args[0].getValue().value,
				    g = this.args[1].getValue().value,
				    b = this.args[2].getValue().value;
				context.strokeStyle = "rgb(" + r + "," + g + "," + b + ")";
			} else if (this.command == 'gSetFillColor') {
				if (context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				var _r = this.args[0].getValue().value,
				    _g = this.args[1].getValue().value,
				    _b = this.args[2].getValue().value;
				context.fillStyle = "rgb(" + _r + "," + _g + "," + _b + ")";
			} else if (this.command == 'gSetTextColor') {
				if (context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				var _r2 = this.args[0].getValue().value,
				    _g2 = this.args[1].getValue().value,
				    _b2 = this.args[2].getValue().value;
				context.textStyle = "rgb(" + _r2 + "," + _g2 + "," + _b2 + ")";
			} else if (this.command == 'gSetLineWidth') {
				if (context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				context.lineWidth = this.args[0].getValue().value;
			} else if (this.command == 'gSetFontSize') {
				if (context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				context.font = this.args[0].getValue().value + "px 'sans-serif'";
			} else if (this.command == 'gDrawText') {
				if (context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				var temp = context.fillStyle;
				context.fillStyle = context.textStyle;
				context.fillText(this.args[0].getValue().value, this.args[1].getValue().value, this.args[2].getValue().value);
				context.fillStyle = temp;
			} else if (this.command == 'gDrawLine') {
				if (context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				var x1 = this.args[0].getValue().value,
				    y1 = this.args[1].getValue().value,
				    x2 = this.args[2].getValue().value,
				    y2 = this.args[3].getValue().value;
				context.beginPath();
				context.moveTo(x1, y1);
				context.lineTo(x2, y2);
				context.stroke();
			} else if (this.command == 'gDrawPoint') {
				if (context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				var _x = this.args[0].getValue().value,
				    _y = this.args[1].getValue().value;
				context.beginPath();
				context.arc(_x, _y, 1, 0, Math.PI * 2, false);
				context.stroke();
			} else if (this.command == 'gDrawBox') {
				if (context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				var _x2 = this.args[0].getValue().value,
				    _y2 = this.args[1].getValue().value,
				    width = this.args[2].getValue().value,
				    height = this.args[3].getValue().value;
				context.beginPath();
				context.strokeRect(_x2, _y2, width, height);
				context.stroke();
			} else if (this.command == 'gFillBox') {
				if (context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				var _x3 = this.args[0].getValue().value,
				    _y3 = this.args[1].getValue().value,
				    _width = this.args[2].getValue().value,
				    _height = this.args[3].getValue().value;
				context.fillRect(_x3, _y3, _width, _height);
				context.beginPath();
				context.strokeRect(_x3, _y3, _width, _height);
				context.stroke();
			} else if (this.command == 'gDrawCircle') {
				if (context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				var _x4 = this.args[0].getValue().value,
				    _y4 = this.args[1].getValue().value,
				    _r3 = this.args[2].getValue().value;
				context.beginPath();
				context.arc(_x4, _y4, _r3, 0, Math.PI * 2, false);
				context.stroke();
			} else if (this.command == 'gFillCircle') {
				if (context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				var _x5 = this.args[0].getValue().value,
				    _y5 = this.args[1].getValue().value,
				    _r4 = this.args[2].getValue().value;
				for (var i = 0; i < 2; i++) {
					context.beginPath();
					context.arc(_x5, _y5, _r4, 0, Math.PI * 2, false);
					if (i == 0) context.fill();else context.stroke();
				}
			} else if (this.command == 'gDrawOval') {
				if (context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				var _x6 = this.args[0].getValue().value,
				    _y6 = this.args[1].getValue().value,
				    _w = this.args[2].getValue().value,
				    _h = this.args[3].getValue().value;
				context.beginPath();
				context.ellipse(_x6 + _w / 2, _y6 + _h / 2, _w / 2, _h / 2, 0, 0, Math.PI * 2);
				context.stroke();
			} else if (this.command == 'gFillOval') {
				if (context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				var _x7 = this.args[0].getValue().value,
				    _y7 = this.args[1].getValue().value,
				    _w2 = this.args[2].getValue().value,
				    _h2 = this.args[3].getValue().value;
				for (var i = 0; i < 2; i++) {
					context.beginPath();
					context.ellipse(_x7 + _w2 / 2, _y7 + _h2 / 2, _w2 / 2, _h2 / 2, 0, 0, Math.PI * 2);
					if (i == 0) context.fill();else context.stroke();
				}
			} else if (this.command == 'gDrawArc') {
				if (context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				var _x8 = this.args[0].getValue().value,
				    _y8 = this.args[1].getValue().value,
				    _w3 = this.args[2].getValue().value,
				    _h3 = this.args[3].getValue().value,
				    theta1 = this.args[4].getValue().value,
				    theta2 = this.args[5].getValue().value,
				    style = this.args[6].getValue().value;
				context.beginPath();
				context.ellipse(_x8 + _w3 / 2, _y8 + _h3 / 2, _w3 / 2, _h3 / 2, 0, -theta1 * Math.PI / 180, -theta2 * Math.PI / 180, true);
				switch (style) {
					case 2:
						// 半径
						context.lineTo(_x8 + _w3 / 2, _y8 + _h3 / 2);
					// fall through
					case 1:
						// 弦
						context.closePath();
				}
				context.stroke();
			} else if (this.command == 'gFillArc') {
				if (context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				var _x9 = this.args[0].getValue().value,
				    _y9 = this.args[1].getValue().value,
				    _w4 = this.args[2].getValue().value,
				    _h4 = this.args[3].getValue().value,
				    _theta = this.args[4].getValue().value,
				    _theta2 = this.args[5].getValue().value,
				    _style = this.args[6].getValue().value;
				for (var i = 0; i < 2; i++) {
					context.beginPath();
					context.ellipse(_x9 + _w4 / 2, _y9 + _h4 / 2, _w4 / 2, _h4 / 2, 0, -_theta * Math.PI / 180, -_theta2 * Math.PI / 180, true);
					switch (_style) {
						case 2:
							// 半径
							context.lineTo(_x9 + _w4 / 2, _y9 + _h4 / 2);
						// fall through
						case 1:
							// 弦
							context.closePath();
					}
					if (i == 0) context.fill();else context.stroke();
				}
			} else if (this.command == 'gBarplot') {
				if (context == null) {
					var canvas = document.getElementById('canvas');
					var w = this.args[0].getValue().value,
					    h = this.args[1].getValue().value;
					context = canvas.getContext('2d');
					canvas.setAttribute("width", w + "px");
					canvas.setAttribute("height", h + "px");
					canvas.style.display = "block";
				}
				// 値の取得
				var values = Array2ArrayOfArray(this.args[2].getValue());
				var array = [];
				var n = values.length,
				    v,
				    max = 0,
				    min = 0,
				    maxn = 0;
				for (var i = 0; i < n; i++) {
					v = values instanceof ArrayValue ? values.nthValue(i).rtnv : values[i].rtnv;
					array.push([]);
					if (v.length > maxn) maxn = v.length;
					for (var j = 0; j < v.length; j++) {
						var v1 = v instanceof ArrayValue ? v.nthValue(j).rtnv : v[j].rtnv;
						if (v1 instanceof Value) v1 = v1.value;
						array[i].push(v1);
						if (v1 > max) max = v1;
						if (v1 < min) min = v1;
					}
				}
				if (max == 0) max = 1;
				// 軸の描画
				var x0 = w * 0.05,
				    y0 = h * 0.95;
				y0 *= max / (max - min);
				w *= 0.9;h *= 0.9;
				context.beginPath();
				context.moveTo(x0, y0 - h * max / (max - min));
				context.lineTo(x0, y0 - h * min / (max - min));
				context.moveTo(x0, y0);
				context.lineTo(x0 + w, y0);
				context.stroke();
				if (n > 0) {
					var w0 = w / maxn / array.length;
					for (var i = 0; i < n; i++) {
						context.fillStyle = graphColor[i % 6];
						context.beginPath();
						for (var j = 0; j < array[i].length; j++) {
							var x = x0 + w0 * j + w0 / 2,
							    y = y0 - array[i][j] / (max - min) * h;
							if (array[i][j] >= 0) context.fillRect(x0 + w0 * j * array.length + w0 * 0.8 * i + w0 * 0.1, y0 - h * (array[i][j] / (max - min)), w0 * 0.8, h * (array[i][j] / (max - min)));else context.fillRect(x0 + w0 * j * array.length + w0 * 0.8 * i + w0 * 0.1, y0, w0 * 0.8, h * (-array[i][j] / (max - min)));
						}
						context.stroke();
					}
				}
			} else if (this.command == 'gLineplot') {
				if (context == null) {
					var canvas = document.getElementById('canvas');
					var w = this.args[0].getValue().value,
					    h = this.args[1].getValue().value;
					context = canvas.getContext('2d');
					canvas.setAttribute("width", w + "px");
					canvas.setAttribute("height", h + "px");
					canvas.style.display = "block";
				}
				// 値の取得
				var values = Array2ArrayOfArray(this.args[2].getValue());
				var array = [];
				var n = values.length,
				    v,
				    max = 0,
				    min = 0,
				    maxn = 0;
				for (var i = 0; i < n; i++) {
					v = values instanceof ArrayValue ? values.nthValue(i).rtnv : values[i].rtnv;
					array.push([]);
					if (v.length > maxn) maxn = v.length;
					for (var j = 0; j < v.length; j++) {
						var v1 = v instanceof ArrayValue ? v.nthValue(j).rtnv : v[j].rtnv;
						if (v1 instanceof Value) v1 = v1.value;
						array[i].push(v1);
						if (v1 > max) max = v1;
						if (v1 < min) min = v1;
					}
				}
				if (max == 0) max = 1;
				// 軸の描画
				var x0 = w * 0.05,
				    y0 = h * 0.95;
				y0 *= max / (max - min);
				w *= 0.9;h *= 0.9;
				context.beginPath();
				context.moveTo(x0, y0 - h * max / (max - min));
				context.lineTo(x0, y0 - h * min / (max - min));
				context.moveTo(x0, y0);
				context.lineTo(x0 + w, y0);
				context.stroke();
				if (n > 0) {
					var w0 = w / maxn;
					for (var i = 0; i < n; i++) {
						context.strokeStyle = graphColor[i % 6];
						context.beginPath();
						for (var j = 0; j < array[i].length; j++) {
							var x = x0 + w0 * j + w0 / 2,
							    y = y0 - array[i][j] / (max - min) * h;
							if (j == 0) context.moveTo(x, y);else context.lineTo(x, y);
						}
						context.stroke();
					}
				}
			} else if (this.command == 'gDrawGraph') {
				drawGraph(this.args[0].getValue(), this.args[1].getValue(), this.loc);
			} else if (this.command == 'gClearGraph') {
				clearGraph();
			} else {
				throw new RuntimeError(this.first_line, "未実装のコマンド" + this.command + "が使われました");
			}
		}
	}, {
		key: 'makePython',
		value: function makePython(indent) {
			throw new RuntimeError(this.first_line, "グラフィック命令はPythonに変換できません");
		}
	}]);

	return GraphicStatement;
}(Statement);

function clearGraph() {
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
function drawGraph(layout, data, loc) {
	var div = document.getElementById('graph');
	var graph_data = [],
	    graph_layout = {};
	if (layout instanceof ArrayValue) {
		for (var key in layout.aarray) {
			var val = layout.aarray[key].getValue();
			if (val instanceof ArrayValue) {
				graph_layout[key] = {};
				for (var key1 in val.aarray) {
					graph_layout[key][key1] = val2obj(val.aarray[key1].getValue());
				}
			} else graph_layout[key] = val2obj(val);
		}
	} else if (layout) throw new RuntimeError(loc.first_line, "レイアウト情報が配列になっていません");
	if (data instanceof ArrayValue) {
		var dl = data.value.length;
		for (var i = 0; i < dl; i++) {
			var d = data.value[i].getValue();
			if (d instanceof ArrayValue) {
				var va = {};
				for (var key in d.aarray) {
					var val = d.aarray[key].getValue();
					va[key] = val2obj(val);
				}
				graph_data.push(va);
			} else throw new RuntimeError(loc.first_line, "データの" + i + "番目の要素が配列になっていません");
		}
	} else throw new RuntimeError(loc.first_line, 'データが配列になっていません');
	Plotly.newPlot(div, graph_data, graph_layout);
}

function val2obj(val) {
	if (val instanceof ArrayValue) {
		if (val.length > 0) {
			var rtnv = [];
			var l = val.value.length;
			for (var i = 0; i < l; i++) {
				rtnv.push(val2obj(val.value[i]));
			}return rtnv;
		} else {
			var rtnv = {};
			for (var key in val.aarray) {
				rtnv[key] = val2obj(val.aarray[key].getValue());
			}return rtnv;
		}
	} else return val.value;
}

/**
 * 
 * @param {Value} a 
 * @param {Location} loc
 */
function Array2ArrayOfArray(a, loc) {
	if (a instanceof ArrayValue) {
		if (a.nthValue(0) instanceof ArrayValue) return a;else return new ArrayValue([a], loc);
	} else throw new RuntimeError(loc.first_line, "配列でないものが使われました");
}

var If = function (_Statement20) {
	_inherits(If, _Statement20);

	/**
  * 
  * @param {Value} condition 
  * @param {Array<Statement>} state1 
  * @param {Array<Statement>} state2 
  * @param {Location} loc 
  */
	function If(condition, state1, state2, loc) {
		_classCallCheck(this, If);

		var _this64 = _possibleConstructorReturn(this, (If.__proto__ || Object.getPrototypeOf(If)).call(this, loc));

		_this64.condition = condition;
		_this64.state1 = state1;
		_this64.state2 = state2;
		return _this64;
	}

	_createClass(If, [{
		key: 'clone',
		value: function clone() {
			var state1 = [],
			    state2 = [];
			if (this.state1) for (var i = 0; i < this.state1.length; i++) {
				state1.push(this.state1[i].clone());
			}if (this.state2) for (var i = 0; i < this.state2.length; i++) {
				state2.push(this.state2[i].clone());
			}return new If(this.condition, state1, state2, this.loc);
		}
	}, {
		key: 'run',
		value: function run() {
			_get(If.prototype.__proto__ || Object.getPrototypeOf(If.prototype), 'run', this).call(this);
			if (this.condition.getValue() instanceof BooleanValue) {
				if (this.condition.getValue().value) code[0].stack.unshift({ statementlist: this.state1, index: 0 });else if (this.state2 != null) code[0].stack.unshift({ statementlist: this.state2, index: 0 });
			} else throw new RuntimeError(this.first_line, "もし〜の構文で条件式が使われていません");
		}
	}, {
		key: 'makePython',
		value: function makePython(indent) {
			var code = Parts.makeIndent(indent);
			code += "if " + this.condition.makePython() + ":\n";
			var codes = 0;
			if (this.state1) {
				for (var i = 0; i < this.state1.length; i++) {
					if (this.state1[i]) {
						code += this.state1[i].makePython(indent + 1);
						codes = 1;
					}
				}
			}
			if (codes == 0) code += Parts.makeIndent(indent + 1) + "None\n";
			if (this.state2) {
				codes = 0;
				var code2 = '';
				for (var i = 0; i < this.state2.length; i++) {
					if (this.state2[i]) {
						code2 += this.state2[i].makePython(indent + 1);
						codes = 1;
					}
				}if (codes > 0) code += Parts.makeIndent(indent) + "else:\n" + code2;
			}
			return code;
		}
	}]);

	return If;
}(Statement);

var LoopBegin = function (_Statement21) {
	_inherits(LoopBegin, _Statement21);

	/**
  * @constructor
  * @param {Value} condition nullなら判定しない
  * @param {boolean} continuous condition==continuousなら継続
  * @param {Location} loc 
  */
	function LoopBegin(condition, continuous, loc) {
		_classCallCheck(this, LoopBegin);

		var _this65 = _possibleConstructorReturn(this, (LoopBegin.__proto__ || Object.getPrototypeOf(LoopBegin)).call(this, loc));

		_this65.condition = condition;
		_this65.continuous = continuous;
		return _this65;
	}

	_createClass(LoopBegin, [{
		key: 'clone',
		value: function clone() {
			return new LoopBegin(this.condifion.clone(), this.condition, this.loc);
		}
	}, {
		key: 'run',
		value: function run() {
			if (this.condition == null || this.condition.getValue().value == this.continuous) _get(LoopBegin.prototype.__proto__ || Object.getPrototypeOf(LoopBegin.prototype), 'run', this).call(this);else code[0].stack[0].index = -1;
		}
	}]);

	return LoopBegin;
}(Statement);

var LoopEnd = function (_Statement22) {
	_inherits(LoopEnd, _Statement22);

	/**
  * @constructor
  * @param {Value} condition nullなら判定しない
  * @param {boolean} continuous condition==continuousなら継続
  * @param {Location} loc 
  */
	function LoopEnd(condition, continuous, loc) {
		_classCallCheck(this, LoopEnd);

		var _this66 = _possibleConstructorReturn(this, (LoopEnd.__proto__ || Object.getPrototypeOf(LoopEnd)).call(this, loc));

		_this66.condition = condition;
		_this66.continuous = continuous;
		return _this66;
	}

	_createClass(LoopEnd, [{
		key: 'clone',
		value: function clone() {
			return new LoopEnd(this.condition.clone(), this.continuous, this.loc);
		}
	}, {
		key: 'run',
		value: function run() {
			if (this.condition == null || this.condition.getValue().value == this.continuous) code[0].stack[0].index = 0;else code[0].stack[0].index = -1;
		}
	}]);

	return LoopEnd;
}(Statement);

/**
 * forループ（加算）
 */


var ForInc = function (_Statement23) {
	_inherits(ForInc, _Statement23);

	/**
  * @constructor
  * @param {Variable} varname 
  * @param {Value} begin 
  * @param {Value} end 
  * @param {Value} step 
  * @param {Array<Statement>} statementlist 
  * @param {Location} loc 
  */
	function ForInc(varname, begin, end, step, statementlist, loc) {
		_classCallCheck(this, ForInc);

		var _this67 = _possibleConstructorReturn(this, (ForInc.__proto__ || Object.getPrototypeOf(ForInc)).call(this, loc));

		if (!(varname instanceof Variable || varname instanceof UNDEFINED)) throw new RuntimeError(loc.first_line, "繰り返しのカウンタは変数でなくてはいけません");
		_this67.varname = varname;
		_this67.begin = begin;
		_this67.end = end;
		_this67.step = step;
		_this67.statementlist = statementlist;
		return _this67;
	}

	_createClass(ForInc, [{
		key: 'clone',
		value: function clone() {
			var state = [];
			for (var i = 0; i < this.statementlist.length; i++) {
				state.push(this.statementlist[i].clone());
			}return new ForInc(this.varname.clone(), this.begin.clone(), this.end.clone(), this.step.clone(), state, this.loc);
		}
	}, {
		key: 'makePython',
		value: function makePython(indent) {
			var code = Parts.makeIndent(indent);
			var pv = this.varname.makePython(),
			    pb = this.begin.makePython(),
			    pe = this.end.makePython(),
			    ps = this.step.makePython();
			code += "for " + pv + " in range(" + pb + "," + pe + "+1," + ps + "):\n";
			var codes = 0;
			for (var i = 0; i < this.statementlist.length; i++) {
				if (this.statementlist[i]) {
					codes = 1;
					code += this.statementlist[i].makePython(indent + 1);
				}
			}if (codes == 0) code += Parts.makeIndent(indent + 1) + "None\n";
			return code;
		}
	}, {
		key: 'run',
		value: function run() {
			var index = code[0].stack[0].index;
			if (this.varname instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");
			var last_token = { first_line: this.last_line, last_line: this.last_line };
			var last_loc = new Location(last_token, last_token);
			var varTable = findVarTable(this.varname.varname);
			if (!varTable) {
				varTable = varTables[0];
				if (this.begin.getValue() instanceof IntValue) varTable.vars[this.varname.varname] = new IntValue(0, this.loc);else if (this.begin.getValue() instanceof FloatValue) varTable.vars[this.varname.varname] = new FloatValue(0, this.loc);else varTable = null;
			}
			if (varTable) {
				// ループ前の初期化
				var assign = new Assign(this.varname, this.begin.getValue(), null, this.loc);
				assign.run();
				// ループ先頭
				var loop = [];
				loop.push(new runBeforeGetValue([this.varname.args], this.loc));
				var variable = new Variable(this.varname.varname, this.varname.args, this.loc);
				loop.push(new runBeforeGetValue([variable, this.end], this.loc));
				var condition = new LE(variable, this.end, this.loc); // IncとDecの違うところ
				loop.push(new runBeforeGetValue([condition], this.loc));
				loop.push(new LoopBegin(condition, true, this.loc));
				for (var i = 0; i < this.statementlist.length; i++) {
					loop.push(this.statementlist[i]);
				} // ループ終端
				loop.push(new runBeforeGetValue([this.step, this.varname.args], this.loc));
				var new_counter = new Add(variable, this.step, this.loc); // IncとDecの違うところ
				loop.push(new runBeforeGetValue([variable, new_counter], this.loc));
				loop.push(new Assign(this.varname, new_counter, null, this.loc));
				loop.push(new LoopEnd(null, true, last_loc));
				code[0].stack.unshift({ statementlist: loop, index: 0 });
				code[0].stack[1].index = index + 1;
			} else throw new RuntimeError(this.first_line, this.varname.varname + "は数値型の変数ではありません");
		}
	}]);

	return ForInc;
}(Statement);

var ForDec = function (_Statement24) {
	_inherits(ForDec, _Statement24);

	function ForDec(varname, begin, end, step, statementlist, loc) {
		_classCallCheck(this, ForDec);

		var _this68 = _possibleConstructorReturn(this, (ForDec.__proto__ || Object.getPrototypeOf(ForDec)).call(this, loc));

		if (!(varname instanceof Variable || varname instanceof Variable)) throw new RuntimeError(loc.first_line, "繰り返しのカウンタは変数でなくてはいけません");
		_this68.varname = varname;
		_this68.begin = begin;
		_this68.end = end;
		_this68.step = step;
		_this68.statementlist = statementlist;
		return _this68;
	}

	_createClass(ForDec, [{
		key: 'clone',
		value: function clone() {
			var state = [];
			for (var i = 0; i < this.statementlist.length; i++) {
				state.push(this.statementlist[i].clone());
			}return new ForInc(this.varname.clone(), this.begin.clone(), this.end.clone(), this.step.clone(), state, this.loc);
		}
	}, {
		key: 'makePython',
		value: function makePython(indent) {
			var code = Parts.makeIndent(indent);
			var pv = this.varname.makePython(),
			    pb = this.begin.makePython(),
			    pe = this.end.makePython(),
			    ps = this.step.makePython();
			code += "for " + pv + " in range(" + pb + "," + pe + "-1,-" + ps + "):\n";
			var codes = 0;
			for (var i = 0; i < this.statementlist.length; i++) {
				if (this.statementlist[i]) {
					codes = 1;
					code += this.statementlist[i].makePython(indent + 1);
				}
			}if (codes == 0) code += Parts.makeIndent(indent + 1) + "None\n";
			return code;
		}
	}, {
		key: 'run',
		value: function run() {
			if (this.varname instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");
			var last_token = { first_line: this.last_line, last_line: this.last_line };
			var last_loc = new Location(last_token, last_token);
			var varTable = findVarTable(this.varname.varname);
			if (!varTable) {
				varTable = varTables[0];
				if (this.begin.getValue() instanceof IntValue) varTable.vars[this.varname.varname] = new IntValue(0, this.loc);else if (this.begin.getValue() instanceof FloatValue) varTable.vars[this.varname.varname] = new FloatValue(0, this.loc);else varTable = null;
			}
			if (varTable) {
				// ループ前の初期化
				var assign = new Assign(this.varname, this.begin.getValue(), null, this.loc);
				assign.run();
				// ループ先頭
				var loop = [];
				loop.push(new runBeforeGetValue([this.varname.args], this.loc));
				var variable = new Variable(this.varname.varname, this.varname.args, this.loc);
				loop.push(new runBeforeGetValue([variable, this.end], this.loc));
				var condition = new GE(variable, this.end, this.loc);
				loop.push(new runBeforeGetValue([condition], this.loc));
				loop.push(new LoopBegin(condition, true, this.loc));
				for (var i = 0; i < this.statementlist.length; i++) {
					loop.push(this.statementlist[i]);
				} // ループ終端
				loop.push(new runBeforeGetValue([this.step, this.varname.args], last_loc));
				var new_counter = new Sub(variable, this.step, last_loc);
				loop.push(new runBeforeGetValue([variable, new_counter], last_loc));
				loop.push(new Assign(this.varname, new_counter, null, last_loc));
				loop.push(new LoopEnd(null, true, last_loc));
				code[0].stack.unshift({ statementlist: loop, index: 0 });
			} else throw new RuntimeError(this.first_line, this.varname.varname + "は数値型の変数ではありません");
			_get(ForDec.prototype.__proto__ || Object.getPrototypeOf(ForDec.prototype), 'run', this).call(this);
		}
	}]);

	return ForDec;
}(Statement);

var While = function (_Statement25) {
	_inherits(While, _Statement25);

	function While(condition, statementlist, loc) {
		_classCallCheck(this, While);

		var _this69 = _possibleConstructorReturn(this, (While.__proto__ || Object.getPrototypeOf(While)).call(this, loc));

		_this69.condition = condition;
		_this69.statementlist = statementlist;
		return _this69;
	}

	_createClass(While, [{
		key: 'clone',
		value: function clone() {
			var state = [];
			for (var i = 0; i < this.statementlist.length; i++) {
				state.push(this.statementlist[i].clone());
			}return new While(this.condition.clone(), state, this.loc);
		}
	}, {
		key: 'makePython',
		value: function makePython(indent) {
			var code = Parts.makeIndent(indent);
			code += "while " + this.condition.makePython() + ":\n";
			var codes = 0;
			for (var i = 0; i < this.statementlist.length; i++) {
				if (this.statementlist[i]) {
					codes = 1;
					code += this.statementlist[i].makePython(indent + 1);
				}
			}if (codes == 0) code += Parts.makeIndent(indent + 1) + "None\n";
			return code;
		}
	}, {
		key: 'run',
		value: function run() {
			_get(While.prototype.__proto__ || Object.getPrototypeOf(While.prototype), 'run', this).call(this);
			var last_token = { first_line: this.last_line, last_line: this.last_line };
			var loop = [new runBeforeGetValue([this.condition], this.loc), new LoopBegin(this.condition, true, this.loc)];
			for (var i = 0; i < this.statementlist.length; i++) {
				loop.push(this.statementlist[i]);
			}loop.push(new LoopEnd(null, false, new Location(last_token, last_token)));
			code[0].stack.unshift({ statementlist: loop, index: 0 });
		}
	}]);

	return While;
}(Statement);

var SleepStatement = function (_Statement26) {
	_inherits(SleepStatement, _Statement26);

	function SleepStatement(sec, loc) {
		_classCallCheck(this, SleepStatement);

		var _this70 = _possibleConstructorReturn(this, (SleepStatement.__proto__ || Object.getPrototypeOf(SleepStatement)).call(this, loc));

		_this70.sec = new IntValue(sec.value, loc); // milli seconds
		return _this70;
	}

	_createClass(SleepStatement, [{
		key: 'clone',
		value: function clone() {
			return new SleepStatement(this.sec, this.loc);
		}
	}, {
		key: 'run',
		value: function run() {
			wait_time = this.sec.value;
			_get(SleepStatement.prototype.__proto__ || Object.getPrototypeOf(SleepStatement.prototype), 'run', this).call(this);
		}
	}, {
		key: 'makePython',
		value: function makePython(indent) {
			var code = Parts.makeIndent(indent);
			python_lib["time"] = 1;
			return code + "time.sleep(" + this.sec.makePython() + "/1000)\n";
		}
	}]);

	return SleepStatement;
}(Statement);

var NopStatement = function (_Statement27) {
	_inherits(NopStatement, _Statement27);

	function NopStatement(loc) {
		_classCallCheck(this, NopStatement);

		return _possibleConstructorReturn(this, (NopStatement.__proto__ || Object.getPrototypeOf(NopStatement)).call(this, loc));
	}

	_createClass(NopStatement, [{
		key: 'clone',
		value: function clone() {
			return new NopStatement(this.loc);
		}
	}, {
		key: 'run',
		value: function run() {
			_get(NopStatement.prototype.__proto__ || Object.getPrototypeOf(NopStatement.prototype), 'run', this).call(this);
		}
	}, {
		key: 'makePython',
		value: function makePython(indent) {
			return Parts.makeIndent(indent) + "None\n";
		}
	}]);

	return NopStatement;
}(Statement);

var BreakStatement = function (_Statement28) {
	_inherits(BreakStatement, _Statement28);

	function BreakStatement(loc) {
		_classCallCheck(this, BreakStatement);

		return _possibleConstructorReturn(this, (BreakStatement.__proto__ || Object.getPrototypeOf(BreakStatement)).call(this, loc));
	}

	_createClass(BreakStatement, [{
		key: 'clone',
		value: function clone() {
			return new BreakStatement(this.loc);
		}
	}, {
		key: 'run',
		value: function run() {
			while (true) {
				var block = code[0].stack.shift();
				if (!block) throw new RuntimeError(this.first_line, '繰り返しの中ではありません。');
				for (var i = 0; i < block.statementlist.length; i++) {
					if (block.statementlist[i] instanceof LoopBegin) return;
				}
			}
		}
	}, {
		key: 'makePython',
		value: function makePython(indent) {
			return Parts.makeIndent(indent) + "break\n";
		}
	}]);

	return BreakStatement;
}(Statement);

function highlightLine(l) {
	var elem = document.getElementById('bcralnit_sourceTextarea0').firstElementChild;
	var child = elem.firstElementChild;
	var line = 1;
	//	$("#sourceTextarea").focus();
	while (child) {
		if (child.tagName == 'SPAN') {
			if (line++ == l) {
				child.style.background = 'red';
				child.style.color = 'white';
			} else {
				child.style.background = 'transparent';
				child.style.color = 'black';
			}
		}
		child = child.nextElementSibling;
	}
}

function reset() {
	varTables = [new varTable()];
	myFuncs = {};
	current_line = -1;
	if (selected_quiz < 0) textareaClear();
	setRunflag(false);
	code = null;
	highlightLine(-1);
	returnValues = [];
	var canvas = document.getElementById('canvas');
	canvas.style.display = 'none';
	var input_area = document.getElementById('input_area');
	input_area.readOnly = true;
	input_area.value = '';
	document.getElementById('input_status').style.visibility = 'hidden';
	context = null;
	wait_time = 0;
	timeouts = [];
	selected_quiz_input = selected_quiz_output = 0;
	output_str = '';
	Plotly.purge(document.getElementById('graph'));
}

function setRunflag(b) {
	run_flag = b;
	document.getElementById("sourceTextarea").readOnly = b;
	document.getElementById("runButton").innerHTML = b & !step_flag ? "中断" : "実行";
	setEditableflag(!b);
}

function setEditableflag(b) {
	editable_flag = b;
	document.getElementById("drawButton").disabled = !b;
	document.getElementById("pythonButton").disabled = !b;
	document.getElementById("urlButton").disabled = !b;
}

function run() {
	if (code == null) {
		try {
			reset();
			var python_source = document.getElementById("sourceTextarea").value + "\n";
			var dncl_source = python_to_dncl(python_source);
			//textareaAppend(dncl_source);	// for debug
			code = [new parsedMainRoutine(dncl.parse(dncl_source))];
		} catch (e) {
			if (selected_quiz < 0) {
				if (e.line) textareaAppend(e.line + "行目");
				textareaAppend("構文エラーです\n" + e.message + "\n");
				setRunflag(false);
				code = null;
				return;
			} else throw e;
		}
	}
	setRunflag(true);
	step();
}

// busy wait !!
function wait(ms) {
	var t1 = Date.now();
	while (Date.now() - t1 < ms) {}
}

function step() {
	if (selected_quiz < 0) {
		// 次の行まで進める
		var l = current_line;
		do {
			next_line();
		} while (run_flag && l == current_line);
		if (!code) return;
		if (code[0] && code[0].stack.length > 0) {
			if (run_flag && !step_flag) {
				if (wait_time > 0) {
					wait(wait_time);
					wait_time = 0;
				}
				setZeroTimeout(step, 0);
			}
		} else finish();
	} else {
		do {
			next_line();
			if (Date.now() > test_limit_time) throw new RuntimeError(-1, '時間がかかりすぎです。');
		} while (run_flag && code[0] && code[0].stack.length > 0);
	}
}

function next_line() {
	var index = code[0].stack[0].index;
	var statement = code[0].stack[0].statementlist[index];
	if (statement) {
		try {
			statement.run();
		} catch (e) {
			if (selected_quiz < 0) {
				if (e instanceof RuntimeError) textareaAppend("実行時エラーです\n" + e.line + "行目:" + e.message + "\n");else textareaAppend("実行時エラーです\n" + e + "\n");
				setRunflag(false);
				code = null;
			} else throw e;
		}
	} else code[0].stack[0].index++;
	if (!code || !code[0]) return;
	// 不要になったコードをstackから捨てる
	index = code[0].stack[0] ? code[0].stack[0].index : -1;
	while (index < 0 || index >= code[0].stack[0].statementlist.length) {
		code[0].stack.shift();
		if (code[0].stack.length < 1) code.shift();
		if (code.length < 1) break;
		index = code[0] && code[0].stack[0] ? code[0].stack[0].index : -1;
	}
	if (selected_quiz < 0) {
		// 次の行をハイライト表示する
		if (code[0] && code[0].stack[0]) {
			index = code[0].stack[0].index;
			statement = code[0].stack[0].statementlist[index];
			if (statement && statement instanceof Statement) {
				if (statement.loc) highlightLine(current_line = statement.first_line);
			}
		} else highlightLine(++current_line);
	}
}

function openInputWindow() {
	setRunflag(false);
	setEditableflag(false);
	var input_area = document.getElementById("input_area");
	input_area.value = '';
	input_area.readOnly = false;
	input_area.focus();
	document.getElementById("input_status").style.visibility = 'visible';
	document.getElementById("sourceTextarea").readOnly = true;
}

function closeInputWindow() {
	var val = document.getElementById("input_area").value;
	document.getElementById("input_area").readOnly = true;
	document.getElementById("input_status").style.visibility = 'hidden';
	return val;
}

function keydownInput(e) {
	var evt = e || window.event;
	if (evt.keyCode == 13) {
		setRunflag(true);
		step();
		//setTimeout(, 100);
	} else if (evt.keyCode == 27) {
		closeInputWindow();
		code.shift();
	}
}

function editButton(add_code) {
	var sourceTextArea = document.getElementById("sourceTextarea");
	var pos = sourceTextArea.selectionStart;
	var code = sourceTextArea.value;
	var code1 = code.slice(0, pos);
	var code2 = code.slice(pos, code.length);
	var re1 = /[｜| 　]*$/;
	var re2 = /[｜| 　\n]/;
	var add_codes = add_code.split("\n");
	var tab = "";
	var array = re1.exec(code1);
	if (array != null) tab = array[0];
	console.log("[" + pos + ":" + code[pos] + "]");
	if (code[pos] && code[pos] != "\n" || pos > 0 && !re2.exec(code[pos - 1])) {
		alert("この位置で入力支援ボタンを押してはいけません");
		sourceTextArea.focus();
		return;
	}
	for (var c in add_codes) {
		if (c > 0) add_codes[c] = tab + add_codes[c];
	}sourceTextArea.value = code1 + add_codes.join("\n") + code2;
	sourceTextArea.selectionStart = sourceTextArea.selectionEnd = sourceTextArea.value.length - code2.length;
	sourceTextArea.focus();
}

function keyDown(e) {
	var evt = e || window.event;
	var sourceTextArea = document.getElementById("sourceTextarea");
	var pos = sourceTextArea.selectionStart;
	var code = sourceTextArea.value;
	var code1 = code.slice(0, pos);
	var code2 = code.slice(pos, code.length);
	var re5 = /[ 　]$/;
	var tab = '    ';
	var count;
	switch (evt.keyCode) {
		case 9:
			// tab
			evt.preventDefault();
			sourceTextArea.value = code1 + tab + code2;
			pos = code1.length + tab.length;
			sourceTextArea.setSelectionRange(pos, pos);
			return false;
		case 8:
			// backspace
			count = 4;
			while (re5.exec(code1) && count > 0) {
				count -= code1.slice(-1) == ' ' ? 1 : 2;
				code1 = code1.slice(0, -1);
			}
			if (count == 0) {
				evt.preventDefault();
				sourceTextArea.value = code1 + code2;
				pos = code1.length;
				sourceTextArea.setSelectionRange(pos, pos);
				return false;
			}
			return true;
		default:
			//		console.log(window.event.keyCode);
			break;
	}
	return true;
}

function keyUp(e) {
	var evt = e || window.event;
	var sourceTextArea = document.getElementById("sourceTextarea");
	var pos = sourceTextArea.selectionStart;
	var code = sourceTextArea.value;
	var code1 = code.slice(0, pos);
	var code2 = code.slice(pos, code.length);
	var re1 = /《[^》《]*$/;
	var re2 = /^[^》《]*》/;
	var re3 = /\n?([　 ]*)([^　 \n]+.*)\n$/;
	var re4 = /[：:]$/;
	var re4a = /^(関数|手続き).*\(.*\)$/;
	var tab = "";
	var count;
	switch (evt.keyCode) {
		case 37:case 38:case 39:case 40:
			if (pos > 0) {
				var match1 = re1.exec(code1);
				var match2 = re2.exec(code2);
				if (match1 != null && match2 != null) {
					sourceTextArea.setSelectionRange(pos - match1[0].length, pos + match2[0].length);
					return false;
				}
			}
			break;
		case 13:
			// \n
			//		if(!re5.exec(code2)) return true;
			var match = re3.exec(code1);
			if (match) {
				tab = match[1];
				if (re4.exec(match[2]) || re4a.exec(match[2])) tab = "    " + tab;
			}
			sourceTextArea.value = code1 + tab + code2;
			pos = code1.length + tab.length;
			sourceTextArea.setSelectionRange(pos, pos);
			return false;
		default:
			//		console.log(window.event.keyCode);
			break;
	}
	return true;
}

function mouseClick() {
	var sourceTextArea = document.getElementById("sourceTextarea");
	var pos = sourceTextArea.selectionStart;
	var code = sourceTextArea.value;
	var code1 = code.slice(0, pos);
	var code2 = code.slice(pos, code.length);
	var re1 = /《[^》《]*$/;
	var re2 = /^[^》《]*》/;
	var match1 = re1.exec(code1);
	var match2 = re2.exec(code2);
	if (match1 != null && match2 != null) {
		var start = pos - match1[0].length;
		var end = pos + match2[0].length;
		sourceTextArea.setSelectionRange(start, end);
	}
}

function sampleButton(num) {
	var sourceTextArea = document.getElementById("sourceTextarea");
	if (dirty && !window.confirm("プログラムをサンプルプログラムに変更していいですか？")) return;
	sourceTextArea.value = sample[num];
	reset();
	if (flowchart) codeChange();
	$('#sourceTextarea').focus();
	makeDirty(false);
}

function insertCode(add_code) {
	if (document.getElementById("sourceTextarea").readOnly) {
		window.alert("プログラム実行・中断中はプログラムを編集できません");
		return;
	}
	var sourceTextArea = document.getElementById("sourceTextarea");
	var pos1 = sourceTextArea.selectionStart;
	var pos2 = sourceTextArea.selectionEnd;
	var code = sourceTextArea.value;
	var code1 = code.slice(0, pos1);
	var code2 = code.slice(pos2, code.length);
	sourceTextArea.value = code1 + add_code + code2;
}

function registerEvent(elem, ev, func) {
	if (elem.addEventListener) elem.addEventListener(ev, func);else if (elem.attachEvent) elem.attachEvent('on' + ev, func);
}

/**************************************** flowchart **********************************/

var dragging = false;
var mouseX, mouseY;

var point = function () {
	function point() {
		_classCallCheck(this, point);

		this._x = this._y = 0;
	}

	_createClass(point, [{
		key: 'clone',
		value: function clone() {
			var p = new point();p.x = this.x;p.y = this.y;return p;
		}
	}, {
		key: 'x',
		get: function get() {
			return this._x;
		},
		set: function set(v) {
			this._x = v;
		}
	}, {
		key: 'y',
		get: function get() {
			return this._y;
		},
		set: function set(v) {
			this._y = v;
		}
	}]);

	return point;
}();

function mouseDown(e) {
	var rect = document.getElementById("flowchart").getBoundingClientRect();
	var x = e.clientX - rect.left;
	var y = e.clientY - rect.top;
	var parts = flowchart.findParts(x, y);
	if (parts == null) return;
	dragging = true;
	mouseX = x;mouseY = y;
}

function mouseUp(e) {
	dragging = false;
}

function mouseMove(e) {
	if (dragging) {
		var rect = document.getElementById("flowchart").getBoundingClientRect();
		var x = e.clientX - rect.left;
		var y = e.clientY - rect.top;
		flowchart.moveOrigin(x - mouseX, y - mouseY);
		mouseX = x;mouseY = y;
		flowchart.paint();
	}
}

function doubleclick_Flowchart(evt) {
	if (!editable_flag) {
		alert("プログラム実行・中断中はプログラムを編集できません");
		return;
	}
	dragging = false;
	var rect = evt.target.getBoundingClientRect();
	var x = evt.clientX - rect.left;
	var y = evt.clientY - rect.top;
	var parts = flowchart.findParts(x, y);
	if (parts == null || parts instanceof Parts_Terminal || parts instanceof Parts_Bar || parts instanceof Parts_Null) return;
	parts.editMe();
}

function variableChange(e) {
	flowchart.flowchart2code();
	makeDirty(true);
}

function contextMenu_Flowchart(trigger, event) {
	dragging = false;
	var x = event.offsetX,
	    y = event.offsetY;
	var parts = flowchart.findParts(x, y);
	if (parts == null || parts instanceof Parts_Terminal || parts instanceof Parts_Null) return false;
	if (parts instanceof Parts_Bar) return {
		selectableSubMenu: true,
		events: {
			show: function show() {
				parts.highlight();
			},
			hide: function hide() {
				flowchart.paint();flowchart.flowchart2code();
			}
		},
		callback: function callback(k, e) {
			callbackPartsBar(parts, k);
		},
		items: {
			input: { name: "入力", icon: "input" },
			output: { name: "出力", icon: "output" },
			substitute: { name: "代入", icon: "assign" },
			if: { name: "分岐", icon: "if" },
			loop: { name: "ループ", icon: "loop",
				items: {
					loop1: { name: "〜の間" },
					loopinc: { name: "増やしながら" },
					loopdec: { name: "減らしながら" }
				}
			},
			array: { name: "配列操作",
				items: {
					append: { name: "追加" },
					extend: { name: "連結" }
				}
			},
			misc: { name: "各種命令"
				//				separator2:"-----",
				//				paste:{name:"ペースト"}
			} }
	};
	return {
		callback: function callback(k, e) {
			callbackParts(parts, k);
		},
		events: {
			show: function show() {
				parts.highlight();
			},
			hide: function hide() {
				flowchart.paint();flowchart.flowchart2code();
			}
		},
		items: {
			edit: { name: "編集" },
			delete: { name: "削除"
				//			cut:{name:"カット"}
			} }
	};
}

function callbackPartsBar(bar, key) {
	if (document.getElementById("sourceTextarea").readOnly) {
		window.alert("プログラム実行・中断中はプログラムを編集できません");
		return;
	}
	bar.highlight();
	if (key == "input") Parts_Input.appendMe(bar);else if (key == "output") Parts_Output.appendMe(bar);else if (key == "substitute") Parts_Substitute.appendMe(bar);else if (key == "append") Parts_Append.appendMe(bar);else if (key == "extend") Parts_Extend.appendMe(bar);else if (key == "if") Parts_If.appendMe(bar);else if (key == "loop1") Parts_LoopBegin1.appendMe(bar);else if (key == "loopinc") Parts_LoopBeginInc.appendMe(bar);else if (key == "loopdec") Parts_LoopBeginDec.appendMe(bar);else if (key == "misc") Parts_Misc.appendMe(bar);else return;
	makeDirty(true);
}

function callbackParts(parts, key) {
	if (document.getElementById("sourceTextarea").readOnly) {
		window.alert("プログラム実行・中断中はプログラムを編集できません");
		return;
	}
	if (parts instanceof Parts_Terminal) return false;
	if (key == "edit") {
		parts.editMe();
	} else if (key == "delete") {
		parts.deleteMe();makeDirty(true);
	} else if (key == "cut") {
		parts.cutMe();makeDirty(true);
	}
}

var FlowchartSetting = {
	size: 6,
	fontsize: 12
};

function changeSize(v) {
	if (v > 0) FlowchartSetting.size++;else if (v < 0) {
		if (FlowchartSetting.size > 3) FlowchartSetting.size--;
	} else FlowchartSetting.size = 6;
	flowchart.paint();
}

function variable2code(ty, id) {
	var code = document.getElementById(id).value.trim();
	if (code != "") return ty + ' ' + code + "\n";
	return '';
}

var Flowchart = function () {
	function Flowchart() {
		_classCallCheck(this, Flowchart);

		this._canvas = document.getElementById("flowchart");
		this._context = this._canvas.getContext('2d');
		this.makeEmpty();
	}

	_createClass(Flowchart, [{
		key: 'setOrigin',
		value: function setOrigin(x, y) {
			this._x0 = x;this._y0 = y;
		}
	}, {
		key: 'moveOrigin',
		value: function moveOrigin(x, y) {
			this._x0 += x;this._y0 += y;
		}
	}, {
		key: 'makeEmpty',
		value: function makeEmpty() {
			this.setOrigin(this.canvas.width / 2, FlowchartSetting.size);
			this.top = new Parts_Terminal();
			var bar = new Parts_Bar();
			var end = new Parts_Terminal();
			this.top.next = bar;
			bar.next = end;
			this.top.setValue("はじめ");
			end.setValue("おわり");
		}
	}, {
		key: 'code2flowchart',
		value: function code2flowchart(parse) {
			flowchart.makeEmpty();
			Flowchart.appendParts(this.top.next, parse);
			flowchart.paint();
		}
	}, {
		key: 'flowchart2code',
		value: function flowchart2code() {
			if (!flowchart_display) return;
			var code = '';
			code += this.top.appendCode('', 0);
			document.getElementById("sourceTextarea").value = code;
			$('#sourceTextarea').focus();
		}
	}, {
		key: 'paint',
		value: function paint() {
			if (!flowchart_display) return;

			var canvas_width = this.canvas.width;
			var canvas_height = this.canvas.height;
			var p0 = new point(),
			    p1 = new point(),
			    p2 = new point();
			this.context.clearRect(0, 0, canvas_width, canvas_height);
			FlowchartSetting.fontsize = FlowchartSetting.size * 2;
			this.context.font = FlowchartSetting.fontsize + "px 'sans-serif'";
			this.context.strokeStyle = "rgb(0,0,0)";
			this.context.fillStyle = "rgb(0,0,0)";
			this.context.lineWidth = "1px";
			this.top.calcSize(p0, p1, p2); // p1が左上，p2が右下
			this.top.paint({ x: this.x0, y: this.y0 });
		}
	}, {
		key: 'findParts',
		value: function findParts(x, y) {
			return this.top.findParts(x, y);
		}
	}, {
		key: 'x0',
		get: function get() {
			return this._x0;
		}
	}, {
		key: 'y0',
		get: function get() {
			return this._y0;
		}
	}, {
		key: 'canvas',
		get: function get() {
			return this._canvas;
		}
	}, {
		key: 'context',
		get: function get() {
			return this._context;
		}
	}], [{
		key: 'appendParts',
		value: function appendParts(parts, statementlist) {
			for (var i = 0; i < statementlist.length; i++) {
				var p = statementlist[i];
				if (!p) continue;
				var statement = constructor_name(p);
				if (statement == "Assign") {
					var p1 = new Parts_Substitute();
					var b1 = new Parts_Bar();
					p1.setValue(p.variable.getCode(), p.value.getCode(), p.operator);
					parts.next = p1;
					parts = p1.next = b1;
				} else if (statement == "Append") {
					var p1 = new Parts_Append();
					var b1 = new Parts_Bar();
					p1.setValue(p.variable.getCode(), p.value.getCode());
					parts.next = p1;
					parts = p1.next = b1;
				} else if (statement == "Extend") {
					var p1 = new Parts_Extend();
					var b1 = new Parts_Bar();
					p1.setValue(p.variable.getCode(), p.value.getCode());
					parts.next = p1;
					parts = p1.next = b1;
				} else if (statement == "Input") {
					var p1 = new Parts_Input();
					var b1 = new Parts_Bar();
					p1.setValue(p.varname.getCode(), p.type);
					parts.next = p1;
					parts = p1.next = b1;
				} else if (statement == "Output") {
					var p1 = new Parts_Output();
					var b1 = new Parts_Bar();
					p1.setValue(p.value.getCode(), p.ln);
					parts.next = p1;
					parts = p1.next = b1;
				} else if (statement == "Newline") {
					var p1 = new Parts_Output();
					var b1 = new Parts_Bar();
					p1.setValue('改行', true);
					parts.next = p1;
					parts = p1.next = b1;
				} else if (statement == "If") {
					var p1 = new Parts_If();
					var b1 = new Parts_Bar(),
					    b2 = new Parts_Bar(),
					    b3 = new Parts_Bar();
					var n1 = new Parts_Null(),
					    n2 = new Parts_Null(),
					    n3 = new Parts_Null();
					p1.setValue(p.condition.getCode());
					parts.next = p1;
					p1.next = n1;n1.next = b1;
					p1.left = b2;b2._prev = p1;b2.next = n2;
					p1.right = b3;b3._prev = p1;b3.next = n3;
					if (p.state1) Flowchart.appendParts(b2, p.state1);
					if (p.state2) Flowchart.appendParts(b3, p.state2);
					parts = b1;
				} else if (statement == "ForInc") {
					var p1 = new Parts_LoopBeginInc(),
					    p2 = new Parts_LoopEnd();
					var b1 = new Parts_Bar(),
					    b2 = new Parts_Bar();
					p1.setValue(p.varname.getCode(), p.begin.getCode(), p.end.getCode(), p.step.getCode());
					parts.next = p1;
					p1.next = b1;b1.next = p2;p2.next = b2;
					p1._end = p2;p2._begin = p1;
					Flowchart.appendParts(b1, p.statementlist);
					parts = b2;
				} else if (statement == "ForDec") {
					var p1 = new Parts_LoopBeginDec(),
					    p2 = new Parts_LoopEnd();
					var b1 = new Parts_Bar(),
					    b2 = new Parts_Bar();
					p1.setValue(p.varname.getCode(), p.begin.getCode(), p.end.getCode(), p.step.getCode());
					parts.next = p1;
					p1.next = b1;b1.next = p2;p2.next = b2;
					p1._end = p2;p2._begin = p1;
					Flowchart.appendParts(b1, p.statementlist);
					parts = b2;
				} else if (statement == "While") {
					var p1 = new Parts_LoopBegin1(),
					    p2 = new Parts_LoopEnd();
					var b1 = new Parts_Bar(),
					    b2 = new Parts_Bar();
					p1.setValue(p.condition.getCode());
					parts.next = p1;
					p1.next = b1;b1.next = p2;p2.next = b2;
					p1._end = p2;p2._begin = p1;
					Flowchart.appendParts(b1, p.statementlist);
					parts = b2;
				} else if (statement == "GraphicStatement") {
					var p1 = new Parts_Misc();
					var b1 = new Parts_Bar();
					p1.setValue(p.command, p.args);
					parts.next = p1;
					parts = p1.next = b1;
				} else if (statement == "SleepStatement") {
					var p1 = new Parts_Misc();
					var b1 = new Parts_Bar();
					p1.setValue("sleep", [p.sec]);
					parts.next = p1;
					parts = p1.next = b1;
				} else if (statement == "BreakStatement") {
					var p1 = new Parts_Misc();
					var b1 = new Parts_Bar();
					p1.setValue("break", []);
					parts.next = p1;
					parts = p1.next = b1;
				} else if (statement == "DumpStatement") {
					var p1 = new Parts_Misc();
					var b1 = new Parts_Bar();
					p1.setValue("dump", []);
					parts.next = p1;
					parts = p1.next = b1;
				} else if (statement == "NopStatement") {
					var p1 = new Parts_Misc();
					var b1 = new Parts_Bar();
					p1.setValue("NopStatement", []);
					parts.next = p1;
					parts = p1.next = b1;
				}
			}
		}
	}]);

	return Flowchart;
}();

var Parts = function () {
	function Parts() {
		_classCallCheck(this, Parts);

		this._text = "";
		this._next = this._prev = null;
		this._textwidth = this._textheight = this._width = this._height = 0;
		this._hspace = this._hspace2 = 0;
	}

	_createClass(Parts, [{
		key: 'inside',
		value: function inside(x, y) {
			return this.x1 <= x && x <= this.x2 && this.y1 <= y && y <= this.y2;
		}
	}, {
		key: 'findParts',
		value: function findParts(x, y) {
			var p = this;
			while (p != null && !(p instanceof Parts_Null)) {
				if (p.inside(x, y)) return p;
				if (p instanceof Parts_If) {
					var p1 = p.left.findParts(x, y);
					if (p1) return p1;
					p1 = p.right.findParts(x, y);
					if (p1) return p1;
					p = p.end.next;
				} else p = p.next;
			}
			if (p != null && p.next != null) return p.next.findParts(x, y);
			return null;
		}
	}, {
		key: 'paint',
		value: function paint(position) {
			if (this.next != null) return this.next.paint(position);
			return this;
		}
	}, {
		key: 'calcTextsize',
		value: function calcTextsize() {
			if (this.text != null && this.text != "") {
				var size = FlowchartSetting.size;
				var metrics = flowchart.context.measureText(this.text);
				this._hspace = 0;
				this._textwidth = metrics.width;
				if (this._textwidth < size * 4) {
					this._hspace = (size * 4 - this._textwidth) / 2;
					this._textwidth = size * 4;
				}
				this._textheight = FlowchartSetting.fontsize;
			}
		}
	}, {
		key: 'calcSize',
		value: function calcSize(p0, p1, p2) {
			if (this.next == null || this.isBlockEnd) return this;
			return this.next.calcSize(p0, p1, p2);
		}
	}, {
		key: 'appendCode',
		value: function appendCode(code, indent) {
			if (this.next != null) return this.next.appendCode(code, indent);
			return code;
		}
	}, {
		key: 'editMe',
		value: function editMe() {}
	}, {
		key: 'deleteMe',
		value: function deleteMe() {
			this.prev._next = this.end.next.next;
			this.end.next.next._prev = this.prev;
			this.end._next = null;
			this._next = null;
		}
	}, {
		key: 'cutMe',
		value: function cutMe() {}
	}, {
		key: 'paint_highlight',
		value: function paint_highlight() {
			flowchart.context.strokeStyle = "rgb(255,0,0)";
			flowchart.context.fillStyle = "rgb(255,0,0)";
			flowchart.context.clearRect(this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1);
			this.paint(null);
			flowchart.context.strokeStyle = "rgb(0,0,0)";
			flowchart.context.fillStyle = "rgb(0,0,0)";
		}
	}, {
		key: 'paint_unhighlight',
		value: function paint_unhighlight() {
			flowchart.context.clearRect(this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1);
			this.paint(null);
		}
	}, {
		key: 'highlight',
		value: function highlight() {
			this.paint_highlight();
		}
	}, {
		key: 'unhighlight',
		value: function unhighlight() {
			this.paint_unhighlight();
		}
	}, {
		key: 'x1',
		get: function get() {
			return this._x1;
		},
		set: function set(x) {
			this._x1 = x;
		} // paintで計算する

	}, {
		key: 'y1',
		get: function get() {
			return this._y1;
		},
		set: function set(y) {
			this._y1 = y;
		}
	}, {
		key: 'x2',
		get: function get() {
			return this._x2;
		},
		set: function set(x) {
			this._x2 = x;
		}
	}, {
		key: 'y2',
		get: function get() {
			return this._y2;
		},
		set: function set(y) {
			this._y2 = y;
		}
	}, {
		key: 'text',
		get: function get() {
			return this._text;
		}
	}, {
		key: 'next',
		get: function get() {
			return this._next;
		},
		set: function set(p) {
			p._next = this.next;
			p._prev = this;
			if (this.next != null) this.next._prev = p;
			this._next = p;
		}
	}, {
		key: 'prev',
		get: function get() {
			return this._prev;
		}
	}, {
		key: 'end',
		get: function get() {
			return this;
		} // ブロックの終わりのパーツ

	}, {
		key: 'width',
		get: function get() {
			return this._width;
		} // calcSizeで計算する

	}, {
		key: 'height',
		get: function get() {
			return this._height;
		} // calcSizeで計算する

	}, {
		key: 'textWidth',
		get: function get() {
			return this._textwidth;
		} // calcSizeで計算する

	}, {
		key: 'textHeight',
		get: function get() {
			return this._textheight;
		} // calcSizeで計算する

	}, {
		key: 'hspace',
		get: function get() {
			return this._hspace;
		}
	}, {
		key: 'hspace2',
		get: function get() {
			return this._hspace2;
		}
	}, {
		key: 'isBlockEnd',
		get: function get() {
			return false;
		}
	}], [{
		key: 'appendMe',
		value: function appendMe(bar) {}
	}, {
		key: 'makeIndent',
		value: function makeIndent(indent_level) {
			var s = "";
			for (var i = 0; i < indent_level; i++) {
				s += "    ";
			}return s;
		}
	}]);

	return Parts;
}();

var Parts_Null = function (_Parts) {
	_inherits(Parts_Null, _Parts);

	function Parts_Null() {
		_classCallCheck(this, Parts_Null);

		return _possibleConstructorReturn(this, (Parts_Null.__proto__ || Object.getPrototypeOf(Parts_Null)).apply(this, arguments));
	}

	_createClass(Parts_Null, [{
		key: 'isBlockEnd',
		get: function get() {
			return true;
		}
	}]);

	return Parts_Null;
}(Parts);

var Parts_Bar = function (_Parts2) {
	_inherits(Parts_Bar, _Parts2);

	function Parts_Bar() {
		_classCallCheck(this, Parts_Bar);

		return _possibleConstructorReturn(this, (Parts_Bar.__proto__ || Object.getPrototypeOf(Parts_Bar)).apply(this, arguments));
	}

	_createClass(Parts_Bar, [{
		key: 'calcSize',
		value: function calcSize(p0, p1, p2) {
			this._width = 0;
			this._height = FlowchartSetting.size * 3;
			p0.y += this._height;
			if (p0.y > p2.y) p2.y = p0.y;
			return this.next.calcSize(p0, p1, p2);
		}
	}, {
		key: 'inside',
		value: function inside(x, y) {
			var near = 4;
			return this.x1 - near <= x && x <= this.x2 + near && this.y1 <= y && y <= this.y2;
		}
	}, {
		key: 'paint',
		value: function paint(position) {
			if (position != null) {
				this.x1 = this.x2 = position.x;
				this.y1 = position.y;
				this.y2 = this.y1 + this.height;
			}
			flowchart.context.beginPath();
			flowchart.context.moveTo(this.x1, this.y1);
			flowchart.context.lineTo(this.x2, this.y2);
			flowchart.context.stroke();
			if (position != null) {
				position.x = this.x2;position.y = this.y2;
				return this.next.paint(position);
			}
			return this;
		}
	}]);

	return Parts_Bar;
}(Parts);

var Parts_Terminal = function (_Parts3) {
	_inherits(Parts_Terminal, _Parts3);

	function Parts_Terminal() {
		_classCallCheck(this, Parts_Terminal);

		return _possibleConstructorReturn(this, (Parts_Terminal.__proto__ || Object.getPrototypeOf(Parts_Terminal)).apply(this, arguments));
	}

	_createClass(Parts_Terminal, [{
		key: 'calcSize',
		value: function calcSize(p0, p1, p2) {
			this.calcTextsize(); // textWidth, textHeightの計算
			this._height = this._textheight + FlowchartSetting.size * 2;
			this._width = this._textwidth + this._height;
			var x1 = p0.x - this.width / 2;
			var x2 = p0.x + this.width / 2;
			var y2 = p0.y + this.height;
			if (x1 < p1.x) p1.x = x1;
			if (x2 > p2.x) p2.x = x2;
			if (y2 > p2.y) p2.y = y2;
			p0.y = y2;
			if (this.next == null) return this;
			return this.next.calcSize(p0, p1, p2);
		}
	}, {
		key: 'setValue',
		value: function setValue(v) {
			this._text = v;
		}
	}, {
		key: 'paint',
		value: function paint(position) {
			var size = FlowchartSetting.size;
			if (position != null) {
				this.x1 = position.x - this.textWidth / 2 - this.height / 2;
				this.x2 = position.x + this.textWidth / 2 + this.height / 2;
				this.y1 = position.y;
				this.y2 = position.y + this.height;
			}
			flowchart.context.beginPath(); // 上
			flowchart.context.moveTo(this.x1 + this.height / 2, this.y1);
			flowchart.context.lineTo(this.x2 - this.height / 2, this.y1);
			flowchart.context.stroke();
			flowchart.context.beginPath(); // 右
			flowchart.context.arc(this.x2 - this.height / 2, this.y1 + this.height / 2, this.height / 2, Math.PI / 2, -Math.PI / 2, true);
			flowchart.context.stroke();
			flowchart.context.beginPath(); // 下
			flowchart.context.moveTo(this.x1 + this.height / 2, this.y2);
			flowchart.context.lineTo(this.x2 - this.height / 2, this.y2);
			flowchart.context.stroke();
			flowchart.context.beginPath(); // 左
			flowchart.context.arc(this.x1 + this.height / 2, this.y1 + this.height / 2, this.height / 2, 3 * Math.PI / 2, Math.PI / 2, true);
			flowchart.context.stroke();
			flowchart.context.fillText(this.text, this.x1 + this.height / 2, this.y2 - FlowchartSetting.size);
			if (position != null) {
				position.y += this.height;
				if (this.end.next != null) return this.end.next.paint(position);
				return this.end;
			}
			return this;
		}
	}]);

	return Parts_Terminal;
}(Parts);

var Parts_Output = function (_Parts4) {
	_inherits(Parts_Output, _Parts4);

	function Parts_Output() {
		_classCallCheck(this, Parts_Output);

		var _this76 = _possibleConstructorReturn(this, (Parts_Output.__proto__ || Object.getPrototypeOf(Parts_Output)).call(this));

		_this76.setValue("《値》", true);
		return _this76;
	}

	_createClass(Parts_Output, [{
		key: 'setValue',
		value: function setValue(v, nl) {
			this._text = v;
			this._newline = nl;
		}
	}, {
		key: 'calcSize',
		value: function calcSize(p0, p1, p2) {
			this.calcTextsize(); // textWidth, textHeightの計算
			var size = FlowchartSetting.size;
			this._height = this._textheight + size * 2;
			this._width = this._textwidth + size * 2 + this._height / 2;
			var x1 = p0.x - this.width / 2;
			var x2 = p0.x + this.width / 2;
			var y2 = p0.y + this.height;
			if (x1 < p1.x) p1.x = x1;
			if (x2 > p2.x) p2.x = x2;
			if (y2 > p2.y) p2.y = y2;
			p0.y = y2;
			return this.next.calcSize(p0, p1, p2);
		}
	}, {
		key: 'paint',
		value: function paint(position) {
			var size = FlowchartSetting.size;
			if (position != null) {
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
			flowchart.context.arc(this.x2 - this.height / 2, (this.y1 + this.y2) / 2, this.height / 2, Math.PI / 2, -Math.PI / 2, true);
			flowchart.context.stroke();

			flowchart.context.fillText(this.text, this.x1 + size * 2 + this.hspace, this.y2 - size);

			if (!this.newline && this.text != '改行') // 改行なしマーク
				{
					var x = this.x2 - this.height / 2;
					var y = this.y1 + size;
					flowchart.context.beginPath();
					flowchart.context.moveTo(x + size, y);
					flowchart.context.lineTo(x + size, y + this.textHeight);
					flowchart.context.lineTo(x, y + this.textHeight);
					flowchart.context.stroke();
					flowchart.context.beginPath();
					flowchart.context.moveTo(x + size / 2, y + this.textHeight - size / 4);
					flowchart.context.lineTo(x, y + this.textHeight);
					flowchart.context.lineTo(x + size / 2, y + this.textHeight + size / 4);
					flowchart.context.stroke();
					x += this.height / 4;y += this.textHeight / 2;
					flowchart.context.beginPath();flowchart.context.moveTo(x - size / 2, y - size / 2);flowchart.context.lineTo(x + size / 2, y + size / 2);flowchart.context.stroke();
					flowchart.context.beginPath();flowchart.context.moveTo(x + size / 2, y - size / 2);flowchart.context.lineTo(x - size / 2, y + size / 2);flowchart.context.stroke();
				}
			if (position != null) {
				position.y = this.y2;
				if (this.end.next != null) return this.end.next.paint(position);
				return this.end;
			}
			return this;
		}
	}, {
		key: 'appendCode',
		value: function appendCode(code, indent) {
			code += Parts.makeIndent(indent);
			if (this.text == '改行') code += '改行する\n';else code += this.text + "を" + (this.newline ? "" : "改行なしで") + "表示する\n";
			if (this.next != null) return this.next.appendCode(code, indent);
			return code;
		}
	}, {
		key: 'editMe',
		value: function editMe() {
			var subtitle = ["値", "改行"];
			var values = [this.text, this.newline];
			openModalWindowforOutput("出力の編集", subtitle, values, this);
		}
	}, {
		key: 'edited',
		value: function edited(values) {
			if (values != null) {
				this.setValue(values[0], values[1]);
			}
			flowchart.paint();
			flowchart.flowchart2code();
		}
	}, {
		key: 'newline',
		get: function get() {
			return this._newline;
		}
	}], [{
		key: 'appendMe',
		value: function appendMe(bar) {
			var parts = new Parts_Output();
			bar.next = parts;
			parts.next = new Parts_Bar();
			return parts.next;
		}
	}]);

	return Parts_Output;
}(Parts);

var Parts_Input = function (_Parts5) {
	_inherits(Parts_Input, _Parts5);

	function Parts_Input() {
		_classCallCheck(this, Parts_Input);

		var _this77 = _possibleConstructorReturn(this, (Parts_Input.__proto__ || Object.getPrototypeOf(Parts_Input)).call(this));

		_this77.setValue("《変数》", 0);
		return _this77;
	}

	_createClass(Parts_Input, [{
		key: 'setValue',
		value: function setValue(v, type) {
			this._var = v;
			this.type = type;
			this._text = v + "を入力";
			if (this.type > 0) this._text += "（" + nameOfType[this.type] + "）";
		}
	}, {
		key: 'calcSize',
		value: function calcSize(p0, p1, p2) {
			this.calcTextsize(); // textWidth, textHeightの計算
			var size = FlowchartSetting.size;
			this._height = this._textheight + size * 2;
			this._width = this._textwidth + size * 4;
			var x1 = p0.x - this.width / 2;
			var x2 = p0.x + this.width / 2;
			var y2 = p0.y + this.height;
			if (x1 < p1.x) p1.x = x1;
			if (x2 > p2.x) p2.x = x2;
			if (y2 > p2.y) p2.y = y2;
			p0.y = y2;
			if (this.next == null || this.isBlockEnd) return this;
			return this.next.calcSize(p0, p1, p2);
		}
	}, {
		key: 'paint',
		value: function paint(position) {
			var size = FlowchartSetting.size;
			if (position != null) {
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
			if (position != null) {
				position.y = this.y2;
				if (this.end.next != null) return this.end.next.paint(position);
				return this.end;
			}
			return this;
		}
	}, {
		key: 'appendCode',
		value: function appendCode(code, indent) {
			code += Parts.makeIndent(indent);
			code += this.var;
			if (this.type > 0) code += "に" + nameOfType[this.type];
			code += "を入力する\n";
			if (this.next != null) return this.next.appendCode(code, indent);
			return code;
		}
	}, {
		key: 'editMe',
		value: function editMe() {
			var subtitle = ["変数", "型"];
			var values = [this.var, this.type];
			openModalWindowforInput("入力の編集", subtitle, values, this);
		}
	}, {
		key: 'edited',
		value: function edited(values) {
			if (values != null) {
				this.setValue(values[0], values[1]);
			}
			flowchart.paint();
			flowchart.flowchart2code();
		}
	}, {
		key: 'var',
		get: function get() {
			return this._var;
		}
	}], [{
		key: 'appendMe',
		value: function appendMe(bar) {
			var parts = new Parts_Input();
			bar.next = parts;
			parts.next = new Parts_Bar();
			return parts.next;
		}
	}]);

	return Parts_Input;
}(Parts);

var Parts_Substitute = function (_Parts6) {
	_inherits(Parts_Substitute, _Parts6);

	function Parts_Substitute() {
		_classCallCheck(this, Parts_Substitute);

		var _this78 = _possibleConstructorReturn(this, (Parts_Substitute.__proto__ || Object.getPrototypeOf(Parts_Substitute)).call(this));

		_this78.setValue("《変数》", "《値》", null);
		return _this78;
	}

	_createClass(Parts_Substitute, [{
		key: 'setValue',
		value: function setValue(variable, value, operator) {
			this._var = variable;
			this._val = value;
			this._operator = operator;

			this._text = this._var + (this._operator ? this._operator : '') + "←" + this._val;
		}
	}, {
		key: 'calcSize',
		value: function calcSize(p0, p1, p2) {
			this.calcTextsize(); // textWidth, textHeightの計算
			var size = FlowchartSetting.size;
			this._height = this._textheight + size * 2;
			this._width = this._textwidth + size * 4;
			var x1 = p0.x - this.width / 2;
			var x2 = p0.x + this.width / 2;
			var y2 = p0.y + this.height;
			if (x1 < p1.x) p1.x = x1;
			if (x2 > p2.x) p2.x = x2;
			if (y2 > p2.y) p2.y = y2;
			p0.y = y2;
			if (this.next == null || this.isBlockEnd) return this;
			return this.next.calcSize(p0, p1, p2);
		}
	}, {
		key: 'paint',
		value: function paint(position) {
			var size = FlowchartSetting.size;
			if (position != null) {
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

			if (position != null) {
				position.y = this.y2;
				if (this.end.next != null) return this.end.next.paint(position);
				return this.end;
			}
			return this;
		}
	}, {
		key: 'appendCode',
		value: function appendCode(code, indent) {
			code += Parts.makeIndent(indent);
			code += this.var + (this.operator ? this.operator : "") + "←" + this.val + "\n";
			if (this.next != null) return this.next.appendCode(code, indent);
			return code;
		}
	}, {
		key: 'editMe',
		value: function editMe() {
			var subtitle = ["変数", "値", "演算"];
			var values = [this.var, this.val, this.operator];
			openModalWindowforSubstitute("代入の編集", subtitle, values, this);
		}
	}, {
		key: 'edited',
		value: function edited(values) {
			if (values != null) {
				if (values[2] == "（なし）") values[2] = null;
				this.setValue(values[0], values[1], values[2]);
			}
			flowchart.paint();
			flowchart.flowchart2code();
		}
	}, {
		key: 'var',
		get: function get() {
			return this._var;
		}
	}, {
		key: 'val',
		get: function get() {
			return this._val;
		}
	}, {
		key: 'operator',
		get: function get() {
			return this._operator;
		}
	}], [{
		key: 'appendMe',
		value: function appendMe(bar) {
			var parts = new Parts_Substitute();
			bar.next = parts;
			parts.next = new Parts_Bar();
			return parts.next;
		}
	}]);

	return Parts_Substitute;
}(Parts);

var Parts_Append = function (_Parts7) {
	_inherits(Parts_Append, _Parts7);

	function Parts_Append() {
		_classCallCheck(this, Parts_Append);

		var _this79 = _possibleConstructorReturn(this, (Parts_Append.__proto__ || Object.getPrototypeOf(Parts_Append)).call(this));

		_this79.setValue("《変数》", "《値》");
		return _this79;
	}

	_createClass(Parts_Append, [{
		key: 'setValue',
		value: function setValue(variable, value) {
			this._var = variable;
			this._val = value;

			this._text = this._var + "に" + this._val + "を追加";
		}
	}, {
		key: 'calcSize',
		value: function calcSize(p0, p1, p2) {
			this.calcTextsize(); // textWidth, textHeightの計算
			var size = FlowchartSetting.size;
			this._height = this._textheight + size * 2;
			this._width = this._textwidth + size * 4;
			var x1 = p0.x - this.width / 2;
			var x2 = p0.x + this.width / 2;
			var y2 = p0.y + this.height;
			if (x1 < p1.x) p1.x = x1;
			if (x2 > p2.x) p2.x = x2;
			if (y2 > p2.y) p2.y = y2;
			p0.y = y2;
			if (this.next == null || this.isBlockEnd) return this;
			return this.next.calcSize(p0, p1, p2);
		}
	}, {
		key: 'paint',
		value: function paint(position) {
			var size = FlowchartSetting.size;
			if (position != null) {
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

			if (position != null) {
				position.y = this.y2;
				if (this.end.next != null) return this.end.next.paint(position);
				return this.end;
			}
			return this;
		}
	}, {
		key: 'appendCode',
		value: function appendCode(code, indent) {
			code += Parts.makeIndent(indent);
			code += this.var + "に" + this.val + "を追加する\n";
			if (this.next != null) return this.next.appendCode(code, indent);
			return code;
		}
	}, {
		key: 'editMe',
		value: function editMe() {
			var subtitle = ["変数", "値"];
			var values = [this.var, this.val];
			openModalWindow("追加の編集", subtitle, values, this);
		}
	}, {
		key: 'edited',
		value: function edited(values) {
			if (values != null) {
				this.setValue(values[0], values[1]);
			}
			flowchart.paint();
			flowchart.flowchart2code();
		}
	}, {
		key: 'var',
		get: function get() {
			return this._var;
		}
	}, {
		key: 'val',
		get: function get() {
			return this._val;
		}
	}], [{
		key: 'appendMe',
		value: function appendMe(bar) {
			var parts = new Parts_Append();
			bar.next = parts;
			parts.next = new Parts_Bar();
			return parts.next;
		}
	}]);

	return Parts_Append;
}(Parts);

var Parts_Extend = function (_Parts8) {
	_inherits(Parts_Extend, _Parts8);

	function Parts_Extend() {
		_classCallCheck(this, Parts_Extend);

		var _this80 = _possibleConstructorReturn(this, (Parts_Extend.__proto__ || Object.getPrototypeOf(Parts_Extend)).call(this));

		_this80.setValue("《変数》", "《値》");
		return _this80;
	}

	_createClass(Parts_Extend, [{
		key: 'setValue',
		value: function setValue(variable, value) {
			this._var = variable;
			this._val = value;

			this._text = this._var + "に" + this._val + "を連結";
		}
	}, {
		key: 'calcSize',
		value: function calcSize(p0, p1, p2) {
			this.calcTextsize(); // textWidth, textHeightの計算
			var size = FlowchartSetting.size;
			this._height = this._textheight + size * 2;
			this._width = this._textwidth + size * 4;
			var x1 = p0.x - this.width / 2;
			var x2 = p0.x + this.width / 2;
			var y2 = p0.y + this.height;
			if (x1 < p1.x) p1.x = x1;
			if (x2 > p2.x) p2.x = x2;
			if (y2 > p2.y) p2.y = y2;
			p0.y = y2;
			if (this.next == null || this.isBlockEnd) return this;
			return this.next.calcSize(p0, p1, p2);
		}
	}, {
		key: 'paint',
		value: function paint(position) {
			var size = FlowchartSetting.size;
			if (position != null) {
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

			if (position != null) {
				position.y = this.y2;
				if (this.end.next != null) return this.end.next.paint(position);
				return this.end;
			}
			return this;
		}
	}, {
		key: 'appendCode',
		value: function appendCode(code, indent) {
			code += Parts.makeIndent(indent);
			code += this.var + "に" + this.val + "を連結する\n";
			if (this.next != null) return this.next.appendCode(code, indent);
			return code;
		}
	}, {
		key: 'editMe',
		value: function editMe() {
			var subtitle = ["変数", "値"];
			var values = [this.var, this.val];
			openModalWindow("追加の編集", subtitle, values, this);
		}
	}, {
		key: 'edited',
		value: function edited(values) {
			if (values != null) {
				this.setValue(values[0], values[1]);
			}
			flowchart.paint();
			flowchart.flowchart2code();
		}
	}, {
		key: 'var',
		get: function get() {
			return this._var;
		}
	}, {
		key: 'val',
		get: function get() {
			return this._val;
		}
	}], [{
		key: 'appendMe',
		value: function appendMe(bar) {
			var parts = new Parts_Append();
			bar.next = parts;
			parts.next = new Parts_Bar();
			return parts.next;
		}
	}]);

	return Parts_Extend;
}(Parts);

var Parts_If = function (_Parts9) {
	_inherits(Parts_If, _Parts9);

	function Parts_If() {
		_classCallCheck(this, Parts_If);

		var _this81 = _possibleConstructorReturn(this, (Parts_If.__proto__ || Object.getPrototypeOf(Parts_If)).call(this));

		_this81.setValue("《条件》");
		_this81.left = _this81.right = null;
		_this81.left_bar_expand = _this81.right_bar_expand = 0;
		return _this81;
	}

	_createClass(Parts_If, [{
		key: 'setValue',
		value: function setValue(cond) {
			this._cond = cond;
			this._text = this._cond;
		}
	}, {
		key: 'calcTextsize',
		value: function calcTextsize() {
			if (this.text != null && this.text != "") {
				var size = FlowchartSetting.size;
				var metrics = flowchart.context.measureText(this.text);
				this._hspace = 0;
				this._textwidth = metrics.width;
				if (this._textwidth < size * 6) {
					this._hspace = (size * 6 - this._textwidth) / 2;
					this._textwidth = size * 6;
				}
				this._textheight = FlowchartSetting.fontsize;
			}
		}
	}, {
		key: 'calcSize',
		value: function calcSize(p0, p1, p2) {
			this.calcTextsize(); // textWidth, textHeightの計算
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
			var pl = new point();pl.x = x1;pl.y = p0.y;
			var pl1 = pl.clone(),
			    pl2 = pl.clone();
			this.left.calcSize(pl, pl1, pl2);
			this.left_bar_expand = pl2.x - pl.x; // - this.width / 2;
			if (this.left_bar_expand < size) this.left_bar_expand = size;
			pl1.x -= this.left_bar_expand;
			pl2.x -= this.left_bar_expand;
			if (pl1.x < p1.x) p1.x = pl1.x;
			if (pl1.y > p1.y) p1.y = pl1.y;
			if (pl2.y > p1.y) p1.y = pl2.y;

			// 右枝
			var pr = new point();pr.x = x2;pr.y = p0.y;
			var pr1 = pr.clone(),
			    pr2 = pr.clone();
			this.right.calcSize(pr, pr1, pr2);
			this.right_bar_expand = pr.x - pr1.x; // - this.width / 2;
			if (this.right_bar_expand < size) this.right_bar_expand = size;
			pr1.x += this.right_bar_expand;
			pr2.x += this.right_bar_expand;
			if (pr2.x > p2.x) p2.x = pr2.x;
			if (pr1.y > p2.y) p2.y = pr1.y;
			if (pr2.y > p2.y) p2.y = pr2.y;
			// 左枝と右枝がぶつかっていたら，右枝をちょっと伸ばす
			if (pr1.x < pl2.x + size) {
				this.right_bar_expand += pl2.x - pr1.x + size;
				p2.x += pl2.x - pr1.x + size;
			}
			return this.end.next.calcSize(p0, p1, p2);
		}
	}, {
		key: 'paint',
		value: function paint(position) {
			var size = FlowchartSetting.size;
			if (position != null) {
				this.x1 = position.x - this.width / 2;
				this.x2 = position.x + this.width / 2;
				this.y1 = position.y;
				this.y2 = this.y1 + this.height;
			}
			var x0 = (this.x1 + this.x2) / 2,
			    y0 = (this.y1 + this.y2) / 2;
			flowchart.context.beginPath();
			flowchart.context.moveTo(x0, this.y1);
			flowchart.context.lineTo(this.x1, y0);
			flowchart.context.lineTo(x0, this.y2);
			flowchart.context.lineTo(this.x2, y0);
			flowchart.context.lineTo(x0, this.y1);
			flowchart.context.stroke();
			flowchart.context.fillText(this.text, x0 - this.textWidth / 2 + this.hspace, y0 + this.textHeight / 2);

			if (position != null) {
				// 左側
				flowchart.context.beginPath();
				flowchart.context.moveTo(this.x1, y0);
				flowchart.context.lineTo(this.x1 - this.left_bar_expand, y0);
				flowchart.context.stroke();
				flowchart.context.fillText('Y', this.x1 - size * 1, y0 - size);
				var left_parts = this.left.paint({ x: this.x1 - this.left_bar_expand, y: y0 }).prev;
				// 右側
				flowchart.context.beginPath();
				flowchart.context.moveTo(this.x2, y0);
				flowchart.context.lineTo(this.x2 + this.right_bar_expand, y0);
				flowchart.context.stroke();
				flowchart.context.fillText('N', this.x2 + size * 0, y0 - size);
				var right_parts = this.right.paint({ x: this.x2 + this.right_bar_expand, y: y0 }).prev;
				// 線の下の部分
				var y;
				if (left_parts.y2 > right_parts.y2) {
					y = left_parts.y2;
					flowchart.context.beginPath();
					flowchart.context.moveTo(this.x2 + this.right_bar_expand, right_parts.y2);
					flowchart.context.lineTo(this.x2 + this.right_bar_expand, y);
					flowchart.context.stroke();
					right_parts.y2 = y;
				} else {
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
				if (this.end.next != null) return this.end.next.paint(position);
				//			return this.end;
			}
			return this.end.next;
		}
	}, {
		key: 'appendCode',
		value: function appendCode(code, indent) {
			code += Parts.makeIndent(indent);
			code += "もし" + this.condition + "ならば：\n";
			if (this.left.next instanceof Parts_Null) code += Parts.makeIndent(indent + 1) + "\n";else code += this.left.appendCode('', indent + 1);
			if (!(this.right.next instanceof Parts_Null)) {
				code += Parts.makeIndent(indent) + "そうでなければ：\n";
				code += this.right.appendCode('', indent + 1);
			}

			if (this.end.next != null) return this.end.next.appendCode(code, indent);
			return code;
		}
	}, {
		key: 'editMe',
		value: function editMe() {
			var subtitle = ["条件"];
			var values = [this.condition];
			openModalWindow("分岐の編集", subtitle, values, this);
		}
	}, {
		key: 'edited',
		value: function edited(values) {
			if (values != null) {
				this.setValue(values[0]);
			}
			flowchart.paint();
			flowchart.flowchart2code();
		}
	}, {
		key: 'condition',
		get: function get() {
			return this._cond;
		}
	}, {
		key: 'end',
		get: function get() {
			return this.next;
		}
	}], [{
		key: 'appendMe',
		value: function appendMe(bar) {
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
	}]);

	return Parts_If;
}(Parts);

var Parts_LoopBegin = function (_Parts10) {
	_inherits(Parts_LoopBegin, _Parts10);

	function Parts_LoopBegin() {
		_classCallCheck(this, Parts_LoopBegin);

		return _possibleConstructorReturn(this, (Parts_LoopBegin.__proto__ || Object.getPrototypeOf(Parts_LoopBegin)).apply(this, arguments));
	}

	_createClass(Parts_LoopBegin, [{
		key: 'calcTextsize',
		value: function calcTextsize() {
			if (this.hasText) {
				var size = FlowchartSetting.size;
				this._textwidth = size * 6;
				this._hspace = this._hspace2 = 0;
				var tw = flowchart.context.measureText(this.text).width;
				if (tw > this._textwidth) this._textwidth = tw;
				var tw2 = flowchart.context.measureText(this.text2).width;
				if (tw2 > this._textwidth) this._textwidth = tw2;
				if (tw < this._textwidth) this._hspace = (this._textwidth - tw) / 2;
				if (tw2 < this._textwidth) this._hspace2 = (this._textwidth - tw2) / 2;
				this._textheight = FlowchartSetting.fontsize;
			} else {
				this.end.calcTextsize();
				this._textwidth = this.end.textWidth;
				this._textheight = this.end.textHeight;
			}
		}
	}, {
		key: 'calcSize',
		value: function calcSize(p0, p1, p2) {
			this.calcTextsize(); // textWidth, textHeightの計算
			var size = FlowchartSetting.size;

			this._height = this.textHeight * (this.hasText ? 2 : 1) + size * 2;
			this._width = this.textWidth + size * 2;
			var x1 = p0.x - this.width / 2;
			var x2 = p0.x + this.width / 2;
			var y2 = p0.y + this.height;
			if (x1 < p1.x) p1.x = x1;
			if (x2 > p2.x) p2.x = x2;
			if (y2 > p2.y) p2.y = y2;
			p0.y = y2;
			var n = this.next;
			while (n != this.end) {
				n = n.calcSize(p0, p1, p2);
			} //		this.next.calcSize(p0,p1,p2);
			return this.end.next.calcSize(p0, p1, p2);
		}
	}, {
		key: 'paint',
		value: function paint(position) {
			var size = FlowchartSetting.size;
			if (position != null) {
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
			if (this.hasText) {
				flowchart.context.fillText(this.text, this.x1 + size + this.hspace, this.y1 + size + this.textHeight);
				flowchart.context.fillText(this.text2, this.x1 + size + this.hspace2, this.y1 + size + this.textHeight * 2);
			}

			if (position != null) {
				position.y = this.y2;
				this.next.paint(position);
				return this.end.next.paint(position);;
			}
			return this;
		}
	}, {
		key: 'deleteMe',
		value: function deleteMe() {
			this.prev._next = this.end.next.next;
			this.end.next.next._prev = this.prev;
			this.end._next = null;
			this._next = null;
		}
	}, {
		key: 'highlight',
		value: function highlight() {
			this.paint_highlight();
			this.end.paint_highlight();
		}
	}, {
		key: 'unhighlight',
		value: function unhighlight() {
			this.paint_unhighlight();
			this.end.paint_unhighlight();
		}
	}, {
		key: 'hasText',
		get: function get() {
			return false;
		}
	}, {
		key: 'end',
		get: function get() {
			return this._end;
		}
	}]);

	return Parts_LoopBegin;
}(Parts);

var Parts_LoopBegin1 = function (_Parts_LoopBegin) {
	_inherits(Parts_LoopBegin1, _Parts_LoopBegin);

	_createClass(Parts_LoopBegin1, [{
		key: 'hasText',
		get: function get() {
			return true;
		}
	}]);

	function Parts_LoopBegin1() {
		_classCallCheck(this, Parts_LoopBegin1);

		var _this83 = _possibleConstructorReturn(this, (Parts_LoopBegin1.__proto__ || Object.getPrototypeOf(Parts_LoopBegin1)).call(this));

		_this83.setValue("《条件》");
		return _this83;
	}

	_createClass(Parts_LoopBegin1, [{
		key: 'setValue',
		value: function setValue(cond) {
			this._cond = cond;
			this._text = this._cond;
		}
	}, {
		key: 'appendCode',
		value: function appendCode(code, indent) {
			code += Parts.makeIndent(indent);
			code += this.condition + " の間繰り返す：\n";
			var code_inner = this.next.appendCode('', indent + 1);
			if (code_inner == '') code += Parts.makeIndent(indent + 1) + "\n";else code += code_inner;

			if (this.end.next != null) return this.end.next.appendCode(code, indent);
			return code;
		}
	}, {
		key: 'editMe',
		value: function editMe() {
			var subtitle = ["条件（〜の間）"];
			var values = [this.condition];
			openModalWindow("繰り返しの編集", subtitle, values, this);
		}
	}, {
		key: 'edited',
		value: function edited(values) {
			if (values != null) {
				this.setValue(values[0]);
			}
			flowchart.paint();
			flowchart.flowchart2code();
		}
	}, {
		key: 'condition',
		get: function get() {
			return this._cond;
		}
	}, {
		key: 'text2',
		get: function get() {
			return "の間";
		}
	}], [{
		key: 'appendMe',
		value: function appendMe(bar) {
			var parts = new Parts_LoopBegin1();
			bar.next = parts;
			parts.next = new Parts_Bar();
			parts.next.next = new Parts_LoopEnd();
			parts.next.next.next = new Parts_Bar();
			parts._end = parts.next.next;
			parts.next.next._begin = parts;

			return parts.end;
		}
	}]);

	return Parts_LoopBegin1;
}(Parts_LoopBegin);

var Parts_LoopBeginInc = function (_Parts_LoopBegin2) {
	_inherits(Parts_LoopBeginInc, _Parts_LoopBegin2);

	_createClass(Parts_LoopBeginInc, [{
		key: 'hasText',
		get: function get() {
			return true;
		}
	}]);

	function Parts_LoopBeginInc() {
		_classCallCheck(this, Parts_LoopBeginInc);

		var _this84 = _possibleConstructorReturn(this, (Parts_LoopBeginInc.__proto__ || Object.getPrototypeOf(Parts_LoopBeginInc)).call(this));

		_this84.setValue("《変数》", "《値》", "《値》", "《値》");
		return _this84;
	}

	_createClass(Parts_LoopBeginInc, [{
		key: 'setValue',
		value: function setValue(variable, start, goal, step) {
			this._var = variable;
			this._start = start;
			this._goal = goal;
			this._step = step;
			this._text = this.var + ':' + this.start + "→" + this.goal;
		}
	}, {
		key: 'appendCode',
		value: function appendCode(code, indent) {
			code += Parts.makeIndent(indent);
			code += this.var + "を" + this.start + "から" + this.goal + "まで" + this.step + "ずつ増やしながら繰り返す：\n";
			var code_inner = this.next.appendCode('', indent + 1);
			if (code_inner == '') code += Parts.makeIndent(indent + 1) + "\n";else code += code_inner;

			if (this.end.next != null) return this.end.next.appendCode(code, indent);
			return code;
		}
	}, {
		key: 'editMe',
		value: function editMe() {
			var subtitle = ["変数", "〜から", "〜まで", "増加分"];
			var values = [this.var, this.start, this.goal, this.step];
			openModalWindow("繰り返しの編集", subtitle, values, this);
		}
	}, {
		key: 'edited',
		value: function edited(values) {
			if (values != null) {
				this.setValue(values[0], values[1], values[2], values[3]);
			}
			flowchart.paint();
			flowchart.flowchart2code();
		}
	}, {
		key: 'var',
		get: function get() {
			return this._var;
		}
	}, {
		key: 'start',
		get: function get() {
			return this._start;
		}
	}, {
		key: 'goal',
		get: function get() {
			return this._goal;
		}
	}, {
		key: 'step',
		get: function get() {
			return this._step;
		}
	}, {
		key: 'text2',
		get: function get() {
			return this.step + "ずつ増";
		}
	}], [{
		key: 'appendMe',
		value: function appendMe(bar) {
			var parts = new Parts_LoopBeginInc();
			bar.next = parts;
			parts.next = new Parts_Bar();
			parts.next.next = new Parts_LoopEnd();
			parts.next.next.next = new Parts_Bar();
			parts._end = parts.next.next;
			parts.next.next._begin = parts;

			return parts.end;
		}
	}]);

	return Parts_LoopBeginInc;
}(Parts_LoopBegin);

var Parts_LoopBeginDec = function (_Parts_LoopBegin3) {
	_inherits(Parts_LoopBeginDec, _Parts_LoopBegin3);

	_createClass(Parts_LoopBeginDec, [{
		key: 'hasText',
		get: function get() {
			return true;
		}
	}]);

	function Parts_LoopBeginDec() {
		_classCallCheck(this, Parts_LoopBeginDec);

		var _this85 = _possibleConstructorReturn(this, (Parts_LoopBeginDec.__proto__ || Object.getPrototypeOf(Parts_LoopBeginDec)).call(this));

		_this85.setValue("《変数》", "《値》", "《値》", "《値》");
		return _this85;
	}

	_createClass(Parts_LoopBeginDec, [{
		key: 'setValue',
		value: function setValue(variable, start, goal, step) {
			this._var = variable;
			this._start = start;
			this._goal = goal;
			this._step = step;
			this._text = this.var + ':' + this.start + "→" + this.goal;
		}
	}, {
		key: 'appendCode',
		value: function appendCode(code, indent) {
			code += Parts.makeIndent(indent);
			code += this.var + "を" + this.start + "から" + this.goal + "まで" + this.step + "ずつ減らしながら繰り返す：\n";
			var code_inner = this.next.appendCode('', indent + 1);
			if (code_inner == '') code += Parts.makeIndent(indent + 1) + "\n";else code += code_inner;

			if (this.end.next != null) return this.end.next.appendCode(code, indent);
			return code;
		}
	}, {
		key: 'editMe',
		value: function editMe() {
			var subtitle = ["変数", "〜から", "〜まで", "減少分"];
			var values = [this.var, this.start, this.goal, this.step];
			openModalWindow("繰り返しの編集", subtitle, values, this);
		}
	}, {
		key: 'edited',
		value: function edited(values) {
			if (values != null) {
				this.setValue(values[0], values[1], values[2], values[3]);
			}
			flowchart.paint();
			flowchart.flowchart2code();
		}
	}, {
		key: 'var',
		get: function get() {
			return this._var;
		}
	}, {
		key: 'start',
		get: function get() {
			return this._start;
		}
	}, {
		key: 'goal',
		get: function get() {
			return this._goal;
		}
	}, {
		key: 'step',
		get: function get() {
			return this._step;
		}
	}, {
		key: 'text2',
		get: function get() {
			return this.step + "ずつ減";
		}
	}], [{
		key: 'appendMe',
		value: function appendMe(bar) {
			var parts = new Parts_LoopBeginDec();
			bar.next = parts;
			parts.next = new Parts_Bar();
			parts.next.next = new Parts_LoopEnd();
			parts.next.next.next = new Parts_Bar();
			parts._end = parts.next.next;
			parts.next.next._begin = parts;

			return parts.end;
		}
	}]);

	return Parts_LoopBeginDec;
}(Parts_LoopBegin);

var Parts_LoopEnd = function (_Parts11) {
	_inherits(Parts_LoopEnd, _Parts11);

	function Parts_LoopEnd() {
		_classCallCheck(this, Parts_LoopEnd);

		return _possibleConstructorReturn(this, (Parts_LoopEnd.__proto__ || Object.getPrototypeOf(Parts_LoopEnd)).apply(this, arguments));
	}

	_createClass(Parts_LoopEnd, [{
		key: 'editMe',
		value: function editMe() {
			this.begin.editMe();
		}
	}, {
		key: 'calcTextsize',
		value: function calcTextsize() {
			if (this.hasText) {
				var size = FlowchartSetting.size;
				this._textwidth = size * 6;
				this._hspace = this._hspace2 = 0;
				var tw = flowchart.context.measureText(this.text).width;
				if (tw > this._textwidth) this._textwidth = tw;
				var tw2 = flowchart.context.measureText(this.text2).width;
				if (tw2 > this._textwidth) this._textwidth = tw2;
				if (tw < this._textwidth) this._hspace = (this._textwidth - tw) / 2;
				if (tw2 < this._textwidth) this._hspace2 = (this._textwidth - tw2) / 2;
				this._textheight = FlowchartSetting.fontsize;
				this._textheight = FlowchartSetting.fontsize;
			} else {
				this._textwidth = this.begin.textWidth;
				this._textheight = this.begin.textHeight;
			}
		}
	}, {
		key: 'calcSize',
		value: function calcSize(p0, p1, p2) {
			this.calcTextsize(); // textWidth, textHeightの計算
			var size = FlowchartSetting.size;

			this._height = this.textHeight * (this.hasText ? 2 : 1) + size * 2;
			this._width = this.textWidth + size * 2;
			var x1 = p0.x - this.width / 2;
			var x2 = p0.x + this.width / 2;
			var y2 = p0.y + this.height;
			if (x1 < p1.x) p1.x = x1;
			if (x2 > p2.x) p2.x = x2;
			if (y2 > p2.y) p2.y = y2;
			p0.y = y2;
			return this; // isBlockEnd is true.
		}
	}, {
		key: 'paint',
		value: function paint(position) {
			var size = FlowchartSetting.size;
			if (position != null) {
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
			if (this.hasText) {
				flowchart.context.fillText(this.text, this.x1 + size + this.hspace, this.y1 + size + this.textHeight);
				flowchart.context.fillText(this.text2, this.x1 + size + this.hspace2, this.y1 + size + this.textHeight * 2);
			}

			if (position != null) {
				position.y = this.y2;
			}
			return this;
		}
	}, {
		key: 'appendCode',
		value: function appendCode(code, indent) {
			return code;
		}
	}, {
		key: 'editMe',
		value: function editMe() {
			//		this.highlight();
			this.begin.editMe();
		}
	}, {
		key: 'deleteMe',
		value: function deleteMe() {
			this.begin.deleteMe();
		}
	}, {
		key: 'cutMe',
		value: function cutMe() {
			this.begin.cutMe();
		}
	}, {
		key: 'highlight',
		value: function highlight() {
			this.paint_highlight();
			this.begin.paint_highlight();
		}
	}, {
		key: 'unhighlight',
		value: function unhighlight() {
			this.paint_unhighlight();
			this.begin.paint_unhighlight();
		}
	}, {
		key: 'hasText',
		get: function get() {
			return false;
		}
	}, {
		key: 'begin',
		get: function get() {
			return this._begin;
		}
	}, {
		key: 'isBlockEnd',
		get: function get() {
			return true;
		}
	}]);

	return Parts_LoopEnd;
}(Parts);

var misc_menu_ja = [
//表示            識別子            プログラム上の表現            [引数の意味]
["《各種処理》", "none", "《各種処理》", []], ["何もしない", "NopStatement", "何もしない", []], ["描画領域開く", "gOpenWindow", "描画領域開く(	,	)", ["幅", "高さ"]], ["描画領域閉じる", "gCloseWindow", "描画領域閉じる()", []], ["描画領域全消去", "gClearWindow", "描画領域全消去()", []], ["線色設定", "gSetLineColor", "線色設定(	,	,	)", ["赤", "青", "緑"]], ["塗色設定", "gSetFillColor", "塗色設定(	,	,	)", ["赤", "青", "緑"]], ["文字色設定", "gSetTextColor", "文字色設定(	,	,	)", ["赤", "青", "緑"]], ["線太さ設定", "gSetLineWidth", "線太さ設定(	)", ["太さ"]], ["文字サイズ設定", "gSetFontSize", "文字サイズ設定(	)", ["サイズ"]], ["文字描画", "gDrawText", "文字描画(	,	,	)", ["文字列", "x", "y"]], ["点描画", "gDrawPoint", "点描画(	,	,	,	)", ["x", "y"]], ["線描画", "gDrawLine", "線描画(	,	,	,	)", ["x1", "y1", "x2", "y2"]], ["矩形描画", "gDrawBox", "矩形描画(	,	,	,	)", ["x", "y", "幅", "高さ"]], ["矩形塗描画", "gFillBox", "矩形塗描画(	,	,	,	)", ["x", "y", "幅", "高さ"]], ["円描画", "gDrawCircle", "円描画(	,	,	)", ["x", "y", "半径"]], ["円塗描画", "gFillCircle", "円塗描画(	,	,	)", ["x", "y", "半径"]], ["楕円描画", "gDrawCircle", "楕円描画(	,	,	,	)", ["x", "y", "幅", "高さ"]], ["楕円塗描画", "gFillCircle", "楕円塗描画(	,	,	,	)", ["x", "y", "幅", "高さ"]], ["弧描画", "gDrawArc", "弧描画(	,	,	,	,	,	,	)", ["x", "y", "幅", "高さ", "開始角", "終了角", "閉じ方"]], ["弧塗描画", "gFillArc", "弧塗描画(	,	,	,	,	,	,	)", ["x", "y", "幅", "高さ", "開始角", "終了角", "閉じ方"]], ["棒グラフ描画", "gBarplot", "棒グラフ描画(	,	,	)", ["幅", "高さ", "配列"]], ["線グラフ描画", "gLineplot", "線グラフ描画(	,	,	)", ["幅", "高さ", "配列"]], ["グラフ描画", "gDrawGraph", "グラフ描画(	,	)", ["レイアウト情報", "値の配列"]], ["グラフ消去", "gClearGraph", "グラフ消去()", []], ["待つ", "sleep", "	ミリ秒待つ", ["ミリ秒数"]], ["繰り返しを抜ける", "break", "繰り返しを抜ける", []], ["変数を確認する", "dump", "変数を確認する", []]],
    misc_menu_en = [
//表示            識別子            プログラム上の表現            [引数の意味]
["《各種処理》", "none", "《各種処理》", []], ["何もしない", "NopStatement", "何もしない", []], ["gOpenWindow", "gOpenWindow", "gOpenWindow(	,	)", ["幅", "高さ"]], ["gCloseWindow", "gCloseWindow", "gCloseWindow()", []], ["gClearWindow", "gClearWindow", "gClearWindow()", []], ["gSetLineColor", "gSetLineColor", "gSetLineColor(	,	,	)", ["赤", "青", "緑"]], ["gSetFillColor", "gSetFillColor", "gSetFillColor(	,	,	)", ["赤", "青", "緑"]], ["gSetTextColor", "gSetTextColor", "gSetTextColor(	,	,	)", ["赤", "青", "緑"]], ["gSetLineWidth", "gSetLineWidth", "gSetLineWidth(	)", ["太さ"]], ["gSetFontSize", "gSetFontSize", "gSetFontSize(	)", ["サイズ"]], ["gDrawText", "gDrawText", "gDrawText(	,	,	)", ["文字列", "x", "y"]], ["gDrawPoint", "gDrawPoint", "gDrawPoint(	,	,	,	)", ["x", "y"]], ["gDrawLine", "gDrawLine", "gDrawLine(	,	,	,	)", ["x1", "y1", "x2", "y2"]], ["gDrawBox", "gDrawBox", "gDrawBox(	,	,	,	)", ["x", "y", "幅", "高さ"]], ["gFillBox", "gFillBox", "gFillBox(	,	,	,	)", ["x", "y", "幅", "高さ"]], ["gDrawCircle", "gDrawCircle", "gDrawCicle(	,	,	)", ["x", "y", "半径"]], ["gFillCircle", "gFillCircle", "gFillCircle(	,	,	)", ["x", "y", "半径"]], ["gDrawOval", "gDrawCircle", "gDrawOval(	,	,	,	)", ["x", "y", "幅", "高さ"]], ["gFillOval", "gFillCircle", "gFillOval(	,	,	,	)", ["x", "y", "幅", "高さ"]], ["gDrawArc", "gDrawArc", "gDrawArc(	,	,	,	,	,	,	)", ["x", "y", "幅", "高さ", "開始角", "終了角", "閉じ方"]], ["gFillArc", "gFillArc", "gFillArc(	,	,	,	,	,	,	)", ["x", "y", "幅", "高さ", "開始角", "終了角", "閉じ方"]], ["gBarplot", "gBarplot", "gBarplot(	,	,	)", ["幅", "高さ", "値"]], ["gLineplot", "gLineplot", "gLineplot(	,	,	)", ["幅", "高さ", "値"]], ["gDrawGraph", "gDrawGraph", "gDrawGraph(	,	)", ["レイアウト情報", "値の配列"]], ["gClearGraph", "gClearGraph", "gClearGraph()",, []], ["待つ", "sleep", "	ミリ秒待つ", ["ミリ秒数"]], ["繰り返しを抜ける", "break", "繰り返しを抜ける", []], ["変数を確認する", "dump", "変数を確認する", []]];

var misc_menu = setting.graphic_command == 0 ? misc_menu_ja : misc_menu_en;

var Parts_Misc = function (_Parts12) {
	_inherits(Parts_Misc, _Parts12);

	function Parts_Misc() {
		_classCallCheck(this, Parts_Misc);

		var _this87 = _possibleConstructorReturn(this, (Parts_Misc.__proto__ || Object.getPrototypeOf(Parts_Misc)).call(this));

		_this87.setValue("none", []);
		return _this87;
	}

	_createClass(Parts_Misc, [{
		key: 'setValue',
		value: function setValue(identifier, values) {
			this._identifier = identifier;
			this._values = [];
			for (var i = 0; i < values.length; i++) {
				this._values.push(values[i].getCode());
			}for (var i = 0; i < misc_menu.length; i++) {
				if (this._identifier != misc_menu[i][1]) continue;
				this._command = misc_menu[i][0];
				var code = misc_menu[i][2];
				for (var j = 0; j < this.values.length; j++) {
					code = code.replace("\t", this.values[j]);
				}this._text = code;
				break;
			}
		}
	}, {
		key: 'setValuebyText',
		value: function setValuebyText(identifier, values) {
			this._identifier = identifier;
			this._values = [];
			for (var i = 0; i < values.length; i++) {
				this._values.push(values[i]);
			}for (var i = 0; i < misc_menu.length; i++) {
				if (this._identifier != misc_menu[i][1]) continue;
				this._command = misc_menu[i][0];
				var code = misc_menu[i][2];
				for (var j = 0; j < this.values.length; j++) {
					code = code.replace("\t", this.values[j]);
				}this._text = code;
				break;
			}
		}
	}, {
		key: 'calcSize',
		value: function calcSize(p0, p1, p2) {
			this.calcTextsize(); // textWidth, textHeightの計算
			var size = FlowchartSetting.size;
			this._height = this._textheight + size * 2;
			this._width = this._textwidth + size * 4;
			var x1 = p0.x - this.width / 2;
			var x2 = p0.x + this.width / 2;
			var y2 = p0.y + this.height;
			if (x1 < p1.x) p1.x = x1;
			if (x2 > p2.x) p2.x = x2;
			if (y2 > p2.y) p2.y = y2;
			p0.y = y2;
			if (this.next == null || this.isBlockEnd) return this;
			return this.next.calcSize(p0, p1, p2);
		}
	}, {
		key: 'paint',
		value: function paint(position) {
			var size = FlowchartSetting.size;
			if (position != null) {
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

			if (position != null) {
				position.y = this.y2;
				if (this.end.next != null) return this.end.next.paint(position);
				return this.end;
			}
			return this;
		}
	}, {
		key: 'appendCode',
		value: function appendCode(code, indent) {
			code += Parts.makeIndent(indent);
			code += this.text + "\n";
			if (this.next != null) return this.next.appendCode(code, indent);
			return code;
		}
	}, {
		key: 'editMe',
		value: function editMe() {
			openModalWindowforMisc(this);
		}
	}, {
		key: 'edited',
		value: function edited(identifier, values) {
			if (values != null) {
				this.setValuebyText(identifier, values);
			}
			flowchart.paint();
			flowchart.flowchart2code();
		}
	}, {
		key: 'identifier',
		get: function get() {
			return this._identifier;
		}
	}, {
		key: 'values',
		get: function get() {
			return this._values;
		}
	}], [{
		key: 'appendMe',
		value: function appendMe(bar) {
			var parts = new Parts_Misc();
			bar.next = parts;
			parts.next = new Parts_Bar();
			return parts.next;
		}
	}]);

	return Parts_Misc;
}(Parts);

/* 編集ダイアログ */

var modal_title, modal_subtitle, modal_values, modal_parts;

function openModalWindow(title, subtitle, values, parts) {
	var html = "<p>" + title + "</p>";
	modal_subtitle = subtitle;
	modal_values = values;
	modal_parts = parts;
	html += "<table>";
	for (var i = 0; i < modal_subtitle.length; i++) {
		html += "<tr><td>" + subtitle[i] + "</td><td><input type=\"text\" " + "id=\"inputarea" + i + "\" value=\"" + values[i] + "\" " + "onfocus=\"select();\" " + "onkeydown=\"keydownModal(event);\" spellcheck=\"false\"></td></tr>";
	}html += "</table>";
	html += "<button type=\"button\" onclick=\"closeModalWindow(true);\">OK</button>";
	html += "<button type=\"button\" onclick=\"closeModalWindow(false);\">キャンセル</button>";
	modal_parts.highlight();
	$("#input").html(html);
	$("#input").height(100 + subtitle.length * 30);
	$("#input-overlay").fadeIn();
	$("#input").fadeIn();
	$("#inputarea0").focus();
}

function openModalWindowforSubstitute(title, subtitle, values, parts) {
	var operator = values[2] ? values[2] : "（なし）";
	var operators = ["（なし）", '+', '-', '*', '/', '//', '%', '&', '|', '<<', '>>'];
	var html = "<p>" + title + "</p>";
	modal_subtitle = subtitle;
	modal_values = values;
	modal_parts = parts;
	html += "<table>";
	html += "<tr><td>" + subtitle[0] + "</td><td><input type=\"text\" " + "id=\"inputarea0\" value=\"" + values[0] + "\" " + "onfocus=\"select();\" " + "onkeydown=\"keydownModal(event);\" spellcheck=\"false\"></td></tr>";
	html += "<tr><td>" + subtitle[1] + "</td><td><input type=\"text\" " + "id=\"inputarea1\" value=\"" + values[1] + "\" " + "onfocus=\"select();\" " + "onkeydown=\"keydownModal(event);\" spellcheck=\"false\"></td></tr>";

	html += "<tr><td>" + subtitle[2] + "</td><td><select id=\"inputarea2\">";
	for (var i = 0; i <= operators.length; i++) {
		html += "<option value=\"" + operators[i] + "\"" + (operator == operators[i] ? "selected=\"selected\"" : "") + ">" + operators[i] + "</option>";
	}html += "</td></tr>";
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

function openModalWindowforInput(title, subtitle, values, parts) {
	var html = "<p>" + title + "</p>";
	modal_subtitle = subtitle;
	modal_values = values;
	modal_parts = parts;
	html += "<table>";
	html += "<tr><td>" + subtitle[0] + "</td><td><input type=\"text\" " + "id=\"inputarea0\" value=\"" + values[0] + "\" " + "onfocus=\"select();\" " + "onkeydown=\"keydownModal(event);\" spellcheck=\"false\"></td></tr>";
	html += "<tr><td>" + subtitle[1] + "</td><td><select id=\"inputarea1\">";
	for (var i = typeOfValue.typeInt; i <= typeOfValue.typeBoolean; i++) {
		html += "<option value=\"" + i + "\"" + (i == values[1] ? "selected=\"selected\"" : "") + ">" + nameOfType[i] + "</option>";
	}html += "</td></tr>";
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

function openModalWindowforOutput(title, subtitle, values, parts) {
	var html = "<p>" + title + "</p>";
	modal_subtitle = subtitle;
	modal_values = values;
	modal_parts = parts;
	html += "<table>";
	html += "<tr><td>" + subtitle[0] + "</td><td><input type=\"text\" " + "id=\"inputarea0\" value=\"" + values[0] + "\" " + "onfocus=\"select();\" " + "onkeydown=\"keydownModal(event);\" spellcheck=\"false\"></td></tr>";
	html += "<tr><td></td><td><input type=\"checkbox\" " + "id=\"inputarea1\"" + (values[1] ? " checked=\"checked\"" : "") + ">改行する</td></tr>";
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

function closeModalWindow(ok) {
	if (ok) {
		for (var i = 0; i < modal_subtitle.length; i++) {
			var $j = $("#inputarea" + i);
			if ($j.prop("type") == "checkbox") modal_values[i] = $j.prop("checked");else modal_values[i] = $j.val();
		}
	}
	$("#input").hide();
	$("#input-overlay").hide();
	modal_parts.unhighlight();
	if (ok) makeDirty(true);
	modal_parts.edited(ok ? modal_values : null); // parts must have function 'edited'
}

function keydownModal(e) {
	var evt = e || window.event;
	if (evt.keyCode == 27) // ESC
		closeModalWindow(false);else if (evt.keyCode == 13) // Enter
		closeModalWindow(true);
}

var misc_identifier;

function openModalWindowforMisc(parts) {
	var html = "<p>各種処理の編集</p>";
	modal_parts = parts;
	modal_values = [];
	for (var i = 0; i < parts.values.length; i++) {
		modal_values.push(parts.values[i]);
	}html += "<select id=\"misccommands\" onchange=\"onmiscchanged();\">";
	for (var i = 0; i < misc_menu.length; i++) {
		html += "<option value=\"" + misc_menu[i][1] + "\"" + (misc_menu[i][1] == parts.identifier ? " selected" : "") + ">" + misc_menu[i][0] + "</option>";
	}html += "</select>";
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

function onmiscchanged() {
	var index = document.getElementById("misccommands").selectedIndex;
	setIdentifierforMisc(misc_menu[index][1]);
}

function setIdentifierforMisc(identifier) {
	misc_identifier = identifier;
	// 今のinputareaの値をmodal_valuesに退避する
	for (var i = 0; i < modal_values.length; i++) {
		var elem = document.getElementById("inputarea" + i);
		if (elem) modal_values[i] = elem.value;
		if (/《.*》/.test(modal_values[i])) modal_values[i] = null;
	}

	var table = document.getElementById("miscvalues");
	// tableの子をすべて消す
	while (table.firstChild) {
		table.removeChild(table.firstChild);
	}for (var i = 0; i < misc_menu.length; i++) {
		if (identifier != misc_menu[i][1]) continue;
		var tmp_values = [];
		for (var j = 0; j < misc_menu[i][3].length; j++) {
			var v = "《" + misc_menu[i][3][j] + "》";
			if (modal_values.length > j && modal_values[j] != null) v = modal_values[j];else if (modal_parts.values.length > j && modal_parts.values[j] != null) v = modal_parts.values[j];
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
			input.setAttribute("onkeydown", "keydownModalforMisc(event);");
			input.setAttribute("spellcheck", "false");
			td.appendChild(input);
			tr.appendChild(td);
			table.appendChild(tr);
		}
		modal_values = tmp_values;
	}
	$("#input").height(120 + modal_values.length * 35);
}

function closeModalWindowforMisc(ok) {
	if (ok) {
		for (var i = 0; i < modal_values.length; i++) {
			modal_values[i] = document.getElementById("inputarea" + i).value;
		}
	}
	$("#input").hide();
	$("#input-overlay").hide();
	modal_parts.unhighlight();
	modal_parts.edited(misc_identifier, ok ? modal_values : null); // parts must have function 'edited'
}

function keydownModalforMisc(e) {
	var evt = e || window.event;
	if (evt.keyCode == 27) // ESC
		closeModalWindowforMisc(false);else if (evt.keyCode == 13) // Enter
		closeModalWindowforMisc(true);
}

onload = function onload() {
	var sourceTextArea = document.getElementById("sourceTextarea");
	var resultTextArea = document.getElementById("resultTextarea");
	var newButton = document.getElementById("newButton");
	var runButton = document.getElementById("runButton");
	var flowchartButton = document.getElementById("flowchartButton");
	var resetButton = document.getElementById("resetButton");
	var stepButton = document.getElementById("stepButton");
	var loadButton = document.getElementById("loadButton");
	var file_prefix = document.getElementById("file_prefix");
	var flowchart_canvas = document.getElementById("flowchart");
	// var resultArea = document.getElementById("resultArea");
	$("#sourceTextarea").bcralnit();
	sourceTextArea.onchange = function () {
		makeDirty(true);
	};
	makeDirty(false);
	textarea = resultTextArea;
	runButton.onclick = function () {
		if (run_flag && !step_flag) {
			setRunflag(false);
			document.getElementById("sourceTextarea").readOnly = true;
		} else {
			step_flag = false;
			run();
		}
	};
	stepButton.onclick = function () {
		step_flag = true;
		run();
	};
	newButton.onclick = function () {
		if (dirty && !window.confirm("プログラムを削除していいですか？")) return;
		sourceTextArea.value = "";
		code = null;
		reset();
		if (flowchart) {
			flowchart.makeEmpty();
			flowchart.paint();
		}
		$('#sourceTextarea').focus();
		makeDirty(false);
	};
	resetButton.onclick = function () {
		reset();
	};
	loadButton.addEventListener("change", function (ev) {
		var file = ev.target.files;
		var reader = new FileReader();
		reader.readAsText(file[0], "UTF-8");
		reader.onload = function (ev) {
			sourceTextArea.value = reader.result;
			reset();
			if (flowchart) codeChange();
		};
	}, false);
	downloadLink.onclick = function () {
		var now = new Date();
		var filename = file_prefix.value.trim();
		if (filename.length < 1) filename = now.getFullYear() + ('0' + (now.getMonth() + 1)).slice(-2) + ('0' + now.getDate()).slice(-2) + '_' + ('0' + now.getHours()).slice(-2) + ('0' + now.getMinutes()).slice(-2) + ('0' + now.getSeconds()).slice(-2);
		filename += '.PyPEN';
		var blob = new Blob([sourceTextArea.value], { type: "text/plain" });
		if (window.navigator.msSaveBlob) {
			window.navigator.msSaveBlob(blob, filename);
		} else {
			window.URL = window.URL || window.webkitURL;
			downloadLink.setAttribute("href", window.URL.createObjectURL(blob));
			downloadLink.setAttribute("download", filename);
		}
		makeDirty(false);
	};
	flowchartButton.onchange = function () {
		flowchart_display = this.checked;
		var flowchart_area = document.getElementById("Flowchart_area");
		var drawButton = document.getElementById("drawButton");
		if (flowchart_display) {
			flowchart_area.style.display = "block";
			drawButton.style.display = "inline";
			flowchart = new Flowchart();
			codeChange();
			//			flowchart.paint();
		} else {
			flowchart_area.style.display = "none";
			drawButton.style.display = "none";
			flowchart = null;
		}
	};
	flowchartButton.click();
	sourceTextArea.ondrop = function (e) {
		var filelist = e.dataTransfer.files;
		if (!filelist) return;
		for (var i = 0; i < filelist.length; i++) {
			if (!/\.PyPEN$/i.exec(filelist[i].name)) continue;
			if (window.FileReader) {
				try {
					var reader = new FileReader();
					var text = reader.readAsText(filelist[i]);
					reader.onload = function (event) {
						sourceTextArea.value = event.target.result;
						codeChange();
					};
					break;
				} catch (e) {}
			}
		}
		return false;
	};
	registerEvent(sourceTextArea, "keyup", keyUp);
	registerEvent(sourceTextArea, "keydown", keyDown);
	registerEvent(flowchart_canvas, "mousedown", mouseDown);
	registerEvent(flowchart_canvas, "mouseup", mouseUp);
	registerEvent(flowchart_canvas, "mousemove", mouseMove);
	registerEvent(flowchart_canvas, "dblclick", doubleclick_Flowchart);

	$.contextMenu({
		selector: "#sourceTextarea",
		items: {
			//				copyAll: {name: "プログラムをコピー", callback(k,e){document.getElementById("sourceTextarea").select(); document.execCommand('copy');}},
			zenkaku: { name: "入力補助",
				items: {
					かつ: { name: "かつ", callback: function callback(k, e) {
							insertCode("《値》 かつ 《値》");
						}
					},
					または: { name: "または", callback: function callback(k, e) {
							insertCode("《値》 または 《値》");
						} },
					でない: { name: "でない", callback: function callback(k, e) {
							insertCode("《値》 でない");
						} },
					と: { name: "と", callback: function callback(k, e) {
							insertCode("《値》と《値》");
						} },
					カッコ: { name: "「」", callback: function callback(k, e) {
							insertCode("「《値》」");
						} }
				}
			},
			convert: { name: "変換",
				items: {
					int: { name: "整数", callback: function callback(k, e) {
							insertCode("整数(《値》)");
						} },
					float: { name: "実数", callback: function callback(k, e) {
							insertCode("実数(《値》)");
						} },
					string: { name: "文字列", callback: function callback(k, e) {
							insertCode("文字列(《値》)");
						} },
					bool: { name: "真偽", callback: function callback(k, e) {
							insertCode("真偽(《値》)");
						} }
				}
			},
			math: { name: "数学関数",
				items: {
					abs: { name: "abs 絶対値", callback: function callback(k, e) {
							insertCode("abs(《値》)");
						} },
					random: { name: "random 乱数", callback: function callback(k, e) {
							insertCode("random(《整数》)");
						} },
					ceil: { name: "ceil 切り上げ", callback: function callback(k, e) {
							insertCode("ceil(《実数》)");
						} },
					floor: { name: "floor 切り捨て", callback: function callback(k, e) {
							insertCode("floor(《実数》)");
						} },
					round: { name: "round 四捨五入", callback: function callback(k, e) {
							insertCode("round(《実数》)");
						} },
					sin: { name: "sin サイン", callback: function callback(k, e) {
							insertCode("sin(《実数》)");
						} },
					cos: { name: "cos コサイン", callback: function callback(k, e) {
							insertCode("cos(《実数》)");
						} },
					tan: { name: "tan タンジェント", callback: function callback(k, e) {
							insertCode("tan(《実数》)");
						} },
					sqrt: { name: "sqrt ルート", callback: function callback(k, e) {
							insertCode("sqrt(《実数》)");
						} },
					log: { name: "log 自然対数", callback: function callback(k, e) {
							insertCode("log(《実数》)");
						} },
					exp: { name: "exp 指数関数", callback: function callback(k, e) {
							insertCode("exp(《実数》)");
						} },
					pow: { name: "pow 累乗", callback: function callback(k, e) {
							insertCode("pow(《実数》,《実数》)");
						} }
				}
			},
			str: { name: "文字列関数",
				items: {
					length: { name: "length 長さ", callback: function callback(k, e) {
							insertCode("length(《文字列》)");
						} },
					append: { name: "append 文字列結合", callback: function callback(k, e) {
							insertCode("append(《文字列》,《文字列》)");
						} },
					substring1: { name: "substring 部分文字列（最後まで）", callback: function callback(k, e) {
							insertCode("substring(《文字列》,《開始位置》)");
						} },
					substring2: { name: "substring 部分文字列（長さ指定）", callback: function callback(k, e) {
							insertCode("substring(《文字列》,《開始位置》,《長さ》)");
						} },
					split: { name: "split 文字列分割", callback: function callback(k, e) {
							insertCode("split(《文字列》,《区切文字列》)");
						} },
					extract: { name: "extract 文字列分割（番号指定）", callback: function callback(k, e) {
							insertCode("extract(《文字列》,《区切文字列》,《番号》)");
						} },
					insert: { name: "insert 挿入", callback: function callback(k, e) {
							insertCode("insert(《文字列》,《位置》,《文字列》)");
						} },
					replace: { name: "replace 置換", callback: function callback(k, e) {
							insertCode("replace(《文字列》,《位置》,《長さ》,《文字列》)");
						} }
				}
			},
			graphic1: { name: "グラフィック命令（日本語）",
				items: {
					gOpenWindow: { name: "描画領域開く", callback: function callback(k, e) {
							insertCode("描画領域開く(《幅》,《高さ》)");
						} },
					gCloseWindow: { name: "描画領域閉じる", callback: function callback(k, e) {
							insertCode("描画領域閉じる()");
						} },
					gClearWindow: { name: "描画領域全消去", callback: function callback(k, e) {
							insertCode("描画領域全消去()");
						} },
					gSetLineColor: { name: "線色設定", callback: function callback(k, e) {
							insertCode("線色設定(《赤》,《緑》,《青》)");
						} },
					gSetFillColor: { name: "塗色設定", callback: function callback(k, e) {
							insertCode("塗色設定(《赤》,《緑》,《青》)");
						} },
					gSetTextColor: { name: "文字色設定", callback: function callback(k, e) {
							insertCode("文字色設定(《赤》,《緑》,《青》)");
						} },
					gSetLineWidth: { name: "線太さ設定", callback: function callback(k, e) {
							insertCode("線太さ設定(《太さ》)");
						} },
					gSetFontSize: { name: "文字サイズ設定", callback: function callback(k, e) {
							insertCode("文字サイズ設定(《サイズ》)");
						} },
					gDrawText: { name: "文字描画", callback: function callback(k, e) {
							insertCode("文字描画(《文字列》,《x》,《y》)");
						} },
					gDrawPoint: { name: "点描画", callback: function callback(k, e) {
							insertCode("点描画(《x》,《y》)");
						} },
					gDrawLine: { name: "線描画", callback: function callback(k, e) {
							insertCode("線描画(《x1》,《y1》,《x2》,《y2》)");
						} },
					gDrawBox: { name: "矩形描画", callback: function callback(k, e) {
							insertCode("矩形描画(《x》,《y》,《幅》,《高さ》)");
						} },
					gFillBox: { name: "矩形塗描画", callback: function callback(k, e) {
							insertCode("矩形塗描画(《x》,《y》,《幅》,《高さ》)");
						} },
					gDrawCircle: { name: "円描画", callback: function callback(k, e) {
							insertCode("円描画(《x》,《y》,《半径》)");
						} },
					gFillCircle: { name: "円塗描画", callback: function callback(k, e) {
							insertCode("円塗描画(《x》,《y》,《半径》)");
						} },
					gDrawOval: { name: "楕円描画", callback: function callback(k, e) {
							insertCode("楕円描画(《x》,《y》,《幅》,《高さ》)");
						} },
					gFillOval: { name: "楕円塗描画", callback: function callback(k, e) {
							insertCode("楕円塗描画(《x》,《y》,《幅》,《高さ》)");
						} },
					gDrawArc: { name: "弧描画", callback: function callback(k, e) {
							insertCode("弧描画(《x》,《y》,《幅》,《高さ》,《開始角》,《終了角》,《閉じ方》)");
						} },
					gFillArc: { name: "弧塗描画", callback: function callback(k, e) {
							insertCode("弧塗描画(《x》,《y》,《幅》,《高さ》,《開始角》,《終了角》,《閉じ方》)");
						} },
					gBarplot: { name: "棒グラフ描画", callback: function callback(k, e) {
							insertCode("棒グラフ描画(《幅》,《高さ》,《値》)");
						} },
					gLineplot: { name: "線グラフ描画", callback: function callback(k, e) {
							insertCode("線グラフ描画(《幅》,《高さ》,《値》)");
						} },
					gDrawGraph: { name: "グラフ描画", callback: function callback(k, e) {
							insertCode("グラフ描画(《レイアウト情報》,《値の配列》)");
						} },
					gClearGraph: { name: "グラフ消去", callback: function callback(k, e) {
							insertCode("グラフ消去()");
						} }
				}
			},
			graphic2: { name: "グラフィック命令（英語）",
				items: {
					gOpenWindow: { name: "gOpenWindow", callback: function callback(k, e) {
							insertCode("gOpenWindow(《幅》,《高さ》)");
						} },
					gCloseWindow: { name: "gCloseWindow", callback: function callback(k, e) {
							insertCode("gCloseWindow()");
						} },
					gClearWindow: { name: "gClearWindow", callback: function callback(k, e) {
							insertCode("gClearWindow()");
						} },
					gSetLineColor: { name: "gSetLineColor", callback: function callback(k, e) {
							insertCode("gSetLineColor(《赤》,《緑》,《青》)");
						} },
					gSetFillColor: { name: "gSetFillColor", callback: function callback(k, e) {
							insertCode("gSetFillColor(《赤》,《緑》,《青》)");
						} },
					gSetTextColor: { name: "gSetTextColor", callback: function callback(k, e) {
							insertCode("gSetTextColor(《赤》,《緑》,《青》)");
						} },
					gSetLineWidth: { name: "gSetLineWidth", callback: function callback(k, e) {
							insertCode("gSetLineWidth(《太さ》)");
						} },
					gSetFontSize: { name: "gSetFontSize", callback: function callback(k, e) {
							insertCode("gSetFontSize(《サイズ》)");
						} },
					gDrawText: { name: "gDrawText", callback: function callback(k, e) {
							insertCode("gDraeText(《文字列》,《x》,《y》)");
						} },
					gDrawPoint: { name: "gDrawPoint", callback: function callback(k, e) {
							insertCode("gDrawPoint(《x》,《y》)");
						} },
					gDrawLine: { name: "gDrawLine", callback: function callback(k, e) {
							insertCode("gDrawLine(《x1》,《y1》,《x2》,《y2》)");
						} },
					gDrawBox: { name: "gDrawBox", callback: function callback(k, e) {
							insertCode("gDrawBox(《x》,《y》,《幅》,《高さ》)");
						} },
					gFillBox: { name: "gFillBox", callback: function callback(k, e) {
							insertCode("gFillBox(《x》,《y》,《幅》,《高さ》)");
						} },
					gDrawCircle: { name: "gDrawCircle", callback: function callback(k, e) {
							insertCode("gDrawCircle(《x》,《y》,《半径》)");
						} },
					gFillCircle: { name: "gFillCircle", callback: function callback(k, e) {
							insertCode("gFillCircle(《x》,《y》,《半径》)");
						} },
					gDrawOval: { name: "gDrawOval", callback: function callback(k, e) {
							insertCode("gDrawOval(《x》,《y》,《幅》,《高さ》)");
						} },
					gFillOval: { name: "gFillOval", callback: function callback(k, e) {
							insertCode("gFillOval(《x》,《y》,《幅》,《高さ》)");
						} },
					gDrawArc: { name: "gDrawArc", callback: function callback(k, e) {
							insertCode("gDrawArc(《x》,《y》,《幅》,《高さ》,《開始角》,《終了角》,《閉じ方》)");
						} },
					gFillArc: { name: "gFillArc", callback: function callback(k, e) {
							insertCode("gFillArc(《x》,《y》,《幅》,《高さ》,《開始角》,《終了角》,《閉じ方》)");
						} },
					gBarplot: { name: "gBarplot", callback: function callback(k, e) {
							insertCode("gBarplot(《幅》,《高さ》,《値》)");
						} },
					gLineplot: { name: "gLineplot", callback: function callback(k, e) {
							insertCode("gLineplot(《幅》,《高さ》,《値》)");
						} },
					gDrawGraph: { name: "gDrawGraph", callback: function callback(k, e) {
							insertCode("gDrawGraph(《レイアウト情報》,《値の配列》)");
						} },
					gClearGraph: { name: "gClearGraph", callback: function callback(k, e) {
							insertCode("gClearGraph()");
						} }
				}
			},
			misc: { name: "各種命令",
				items: {
					nop: { name: "何もしない", callback: function callback(k, e) {
							insertCode("何もしない");
						} },
					sleep: { name: "待つ", callback: function callback(k, e) {
							insertCode("《ミリ秒数》ミリ秒待つ");
						} },
					//						break:{name:"繰り返しを抜ける", callback: function(k,e){insertCode("繰り返しを抜ける");}},
					dump: { name: "変数を確認する", callback: function callback(k, e) {
							insertCode("変数を確認する");
						} }
				}
			}
		}
	});
	$.contextMenu({
		selector: "#flowchart",
		build: contextMenu_Flowchart
	});
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

	if (window.addEventListener) window.addEventListener("message", handleMessage, true);else if (window.attachEvent) window.attachEvent("onmessage", handleMessage);

	// Add the one thing we want added to the window object.
	window.setZeroTimeout = setZeroTimeout;

	$(window).bind("beforeunload", function () {
		if (dirty) return "プログラムが消去されます";
	});

	reset();

	var sample_area = document.getElementById('SampleButtons');

	var _loop = function _loop(i) {
		var button = document.createElement('button');
		button.innerText = 'サンプル' + (i + 1);
		button.setAttribute('type', 'button');
		button.setAttribute('class', 'sampleButton');
		button.onclick = function () {
			sampleButton(i);
		};
		if (i > 0 && i % 8 == 0) sample_area.appendChild(document.createElement('br'));
		sample_area.appendChild(button);
	};

	for (var i = 0; i < sample.length; i++) {
		_loop(i);
	}
	if (setting.quiz_mode == 1 && Quizzes.length > 0) {
		var quiz_select = document.getElementById('quiz_select');
		quiz_select.onchange = function () {
			var i = quiz_select.selectedIndex;
			if (i > 0) document.getElementById('quiz_question').innerHTML = Quizzes[i - 1].question();else document.getElementById('quiz_question').innerHTML = '';
		};
		var option = document.createElement('option');
		option.val = 0;
		option.appendChild(document.createTextNode('問題選択'));
		quiz_select.appendChild(option);

		for (var i = 0; i < Quizzes.length; i++) {
			option = document.createElement('option');
			option.val = i + 1;
			option.appendChild(document.createTextNode('Q' + (i + 1) + ':' + Quizzes[i].title()));
			quiz_select.appendChild(option);
		}
		document.getElementById('quiz_marking').onclick = function () {
			var i = quiz_select.selectedIndex;
			if (i > 0) auto_marking(i - 1);else textarea.value = '問題が選択されていないので採点できません。';
		};
	} else {
		document.getElementById('Quiz_area').style.display = 'none';
	}
	document.getElementById('urlButton').onclick = function () {
		var code = sourceTextArea.value.trim();
		if (code == '') return;
		code = B64encode(code);
		if (code) {
			textareaClear();
			highlightLine(-1);
			textareaAppend(window.location.origin + window.location.pathname + '?code=' + code);
		}
	};
	var code = getParam('code');
	if (code) {
		sourceTextArea.value = code;
		codeChange();
	}
};

var base64str = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=";

function B64encode(string) {
	var textencoder = new TextEncoder();
	var deflate = new Zlib.Deflate(textencoder.encode(string));
	var origin = deflate.compress();
	if (origin.length > 1500) {
		textareaAppend('*** プログラムが大きすぎて変換できません ***');
		return null;
	}
	var convert = new Array(Math.floor((origin.length + 2) / 3) * 4);
	for (var i = 0; i < origin.length; i += 3) {
		var v1,
		    v2,
		    v3 = 64,
		    v4 = 64;
		v1 = origin[i] >>> 2;
		v2 = 0x30 & origin[i] << 4;
		if (i + 1 < origin.length) {
			v2 |= 0x0f & origin[i + 1] >>> 4;
			v3 = 0x3C & origin[i + 1] << 2;
			if (i + 2 < origin.length) {
				v3 |= 0x03 & origin[i + 2] >>> 6;
				v4 = 0x3f & origin[i + 2];
			}
		}
		var j = i / 3 * 4;
		convert[j++] = base64str[v1];
		convert[j++] = base64str[v2];
		convert[j++] = base64str[v3];
		convert[j] = base64str[v4];
	}
	return convert.join('').replace(/=+$/, '');
}

function B64decode(string) {
	var convert = new Array();
	try {
		for (var i = 0; i < string.length; i += 4) {
			var c1 = base64str.indexOf(string[i]),
			    c2 = base64str.indexOf(string[i + 1]),
			    c3,
			    c4;
			convert.push(c1 << 2 | c2 >> 4);
			if (i + 2 < string.length) {
				c3 = base64str.indexOf(string[i + 2]);
				convert.push((c2 & 0x0f) << 4 | c3 >>> 2);
				if (i + 3 < string.length) {
					c4 = base64str.indexOf(string[i + 3]);
					convert.push((c3 & 0x03) << 6 | c4);
				}
			}
		}
		var inflate = new Zlib.Inflate(convert);
		var textdecoder = new TextDecoder();
		return textdecoder.decode(inflate.decompress());
	} catch (e) {
		return '';
	}
}

function getParam(name) {
	var getparam = window.location.search;
	if (getparam) {
		var params = getparam.slice(1).split('&');
		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = params[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var param = _step.value;

				var p = param.split('=');
				if (p[0] == name) {
					return B64decode(p[1]);
				}
			}
		} catch (err) {
			_didIteratorError = true;
			_iteratorError = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion && _iterator.return) {
					_iterator.return();
				}
			} finally {
				if (_didIteratorError) {
					throw _iteratorError;
				}
			}
		}
	}
	return null;
}

function auto_marking(i) {
	setRunflag(true);
	document.getElementById('runButton').disabled = true;
	document.getElementById('stepButton').disabled = true;
	document.getElementById('resetButton').disabled = true;
	document.getElementById('urlButton').disabled = true;
	highlightLine(-1);
	textareaClear();
	textareaAppend('*** 採点開始 ***\n');
	selected_quiz = i;
	var all_clear = true;
	for (var j = 0; j < Quizzes[i].cases(); j++) {
		var clear = true;
		textareaAppend('ケース' + (j + 1) + '...');
		try {
			selected_quiz_case = j;
			test_limit_time = Date.now() + Quizzes[selected_quiz].timeout();
			run();
			if (selected_quiz_input != Quizzes[selected_quiz].inputs(selected_quiz_case).length) throw new RuntimeError(-1, '入力の回数がおかしいです。');else if (output_str.trim() != Quizzes[selected_quiz].output(selected_quiz_case).toString().trim()) throw new RuntimeError(-1, '結果が違います。');
			textareaAppend('成功\n');
		} catch (e) {
			textareaAppend('失敗\n');
			textareaAppend(e.message + "\n");
			clear = false;
		}
		all_clear &= clear;
		code = null;
	}
	if (all_clear) textareaAppend('*** 合格 ***\n');else textareaAppend('--- 不合格 ---\n');
	selected_quiz = -1;
	document.getElementById('runButton').disabled = false;
	document.getElementById('stepButton').disabled = false;
	document.getElementById('resetButton').disabled = false;
	document.getElementById('urlButton').disabled = false;
	setRunflag(false);
}

function font_size(updown) {
	if (updown != 0) {
		if (fontsize + updown < 14 || fontsize + updown > 30) return;
		fontsize += updown;
	} else fontsize = 16;
	var elem = document.getElementById('sourceTextarea');
	elem.style.backgroundSize = '2em 2em'; //(fontsize * 4) + 'px '+ (fontsize * 4) + 'px';
	elem.style.fontSize = fontsize + 'px';
	elem.style.lineHeight = '1.2';
	elem = document.getElementById('resultTextarea');
	elem.style.fontSize = fontsize + 'px';
	elem.style.lineHeight = '1.2';
	elem = document.getElementsByClassName('bcr_number')[0];
	elem.style.fontSize = fontsize + 'px';
	elem.style.lineHeight = '1.2';
	$('#sourceTextarea').focus();
}

function makePython() {
	if (run_flag) return;
	//textareaClear();
	code = null;
	myFuncs = {};
	python_lib = {};
	try {
		var code = document.getElementById("sourceTextarea").value + "\n";
		var dncl_code = python_to_dncl(code);
		var main_routine = new parsedMainRoutine(dncl.parse(dncl_code));
		var python_code = main_routine.makePython();
		var subwindow = window.open("./subwindow.html", "subwindow", "left=600,top=100,width=700,height=500,directories=no,location=no,scrollbars=yes");
		setTimeout(function () {
			// loadするのを1秒待ってみる
			subwindow.postMessage(python_code, '*');
		}, 1000);
	} catch (e) {
		highlightLine(-1);
		textareaClear();
		if (e.line) textareaAppend(e.line + "行目");
		textareaAppend("構文エラーです\n" + e.message);
	}
}
