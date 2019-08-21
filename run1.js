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

var code = null; // コードを積む（関数・手続き単位で）
var varTables = []; // 変数テーブルを積む
var myFuncs = {}; // プログラム中で定義される関数・手続き
var returnValues = []; // 関数からの返り値を積む
var run_flag = false,
    step_flag = false;
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

/** parsedCodeクラス */

var parsedCode =
/**
 * @constructor
 * @param {Array<Statement>} statementlist 
 */
function parsedCode(statementlist) {
	_classCallCheck(this, parsedCode);

	this.stack = [{ statementlist: statementlist, index: 0 }];
};

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


	_createClass(parsedMainRoutine, [{
		key: "finish",
		value: function finish() {
			if (selected_quiz < 0) textareaAppend("---\n");
			highlightLine(-1);
			setRunflag(false);
			wait_time = 0;
			code = null;
		}
	}]);

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
		key: "findVarTable",
		value: function findVarTable(varname) {
			if (this.vars[varname]) return this;else return null;
		}
		/**
   * 
   * @param {Array<string>} oldvars 
   */

	}, {
		key: "varnames",
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
		console.log(e);
		textarea.value = "\u69CB\u6587\u30A8\u30E9\u30FC\u3067\u3059\n" + e.message + "\n";
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
		key: "first_line",
		get: function get() {
			return this._first_line;
		}
	}, {
		key: "last_line",
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
		key: "line",
		get: function get() {
			return this._line;
		}
	}, {
		key: "message",
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

		this._value = v;
		this._loc = loc;
		this.rtnv = v;
	}
	/**
  * @returns 生のJavaScriptにおける値
  */


	_createClass(Value, [{
		key: "getValue",

		/**
   * @returns {Value} 値
   */
		value: function getValue() {
			return this.rtnv;
		}
		/**
   * @returns {string} DNCLの文法で表した文字列
   */

	}, {
		key: "getCode",
		value: function getCode() {
			return '' + this._value;
		}
	}, {
		key: "run",
		value: function run() {
			//		this.rtnv = this;
			code[0].stack[0].index++;
		}
	}, {
		key: "value",
		get: function get() {
			return this._value;
		}
	}, {
		key: "loc",
		get: function get() {
			return this._loc;
		}
	}, {
		key: "first_line",
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
		key: "getValue",
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

		return _possibleConstructorReturn(this, (ArrayValue.__proto__ || Object.getPrototypeOf(ArrayValue)).call(this, v, loc));
	}

	_createClass(ArrayValue, [{
		key: "getCode",
		value: function getCode() {
			var ag = [];
			for (var i = 0; i < this.value.length; i++) {
				ag.push(this.value[i].getCode());
			}return '[' + ag.join(',') + ']';
		}
	}, {
		key: "nthValue",
		value: function nthValue(idx) {
			return this._value[idx];
		}
	}, {
		key: "setValueToArray",
		value: function setValueToArray(args, va) {
			var l = args ? args.value.length : 0;
			var v = this;
			for (var i = 0; i < l - 1; i++) {
				if (v.nthValue(args.value[i].getValue().value)) v = v.nthValue(args.value[i].getValue().value);else v = v._value[args.value[i].getValue().value] = new ArrayValue([], this.loc);
			}
			v._value[args.value[l - 1].getValue().value] = va;
		}
	}, {
		key: "getValueFromArray",
		value: function getValueFromArray(args, loc) {
			var l = args ? args.value.length : 0;
			var v = this;
			for (var i = 0; i < l; i++) {
				//			args.value[i].run();
				v = v.nthValue(args.value[i].getValue().value);
			}
			return v;
		}
		/**
   * 同じ値を持つArrayValueを作る
   * @returns {ArrayValue}
   */

	}, {
		key: "clone",
		value: function clone() {
			var rtnv = [];
			for (var i = 0; i < this.length; i++) {
				rtnv.push(this.value[i].clone());
			}return new ArrayValue(rtnv, this.loc);
		}
	}, {
		key: "getValue",
		value: function getValue() {
			return this;
		}
	}, {
		key: "length",
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
		var _v = [];
		if (!args) args = [];
		for (var i = 0; i < size.value[args.length].value + (setting.array_origin == 0 ? 1 : 0); i++) {
			args.push(i);
			_v.push(makeArray(size, args, loc, type));
			args.pop();
		}
		return new ArrayValue(_v, loc);
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
		key: "clone",
		value: function clone() {
			return new IntValue(this.value, this.loc);
		}
	}, {
		key: "getValue",
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
		key: "getCode",
		value: function getCode() {
			if (isInteger(this.value)) return this.value + '.0';else return this.value;
		}
	}, {
		key: "clone",
		value: function clone() {
			return new FloatValue(this.value, this.loc);
		}
	}, {
		key: "getValue",
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
		key: "getCode",
		value: function getCode() {
			if (this.value.match(/[「」]/)) return '"' + this.value + '"';else return '「' + this.value + '」';
		}
	}, {
		key: "clone",
		value: function clone() {
			return new StringValue(this.value, this.loc);
		}
	}, {
		key: "getValue",
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
		key: "getCode",
		value: function getCode() {
			return this.value ? 'true' : 'false';
		}
	}, {
		key: "clone",
		value: function clone() {
			return new BooleanValue(this.value, this.loc);
		}
	}, {
		key: "getValue",
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
		key: "getValue",
		value: function getValue() {
			throw new RuntimeError(this.first_line, "未完成のプログラムです");
		}
	}, {
		key: "getCode",
		value: function getCode() {
			return this.value;
		}
	}, {
		key: "varname",
		get: function get() {
			return this.value;
		}
	}]);

	return UNDEFINED;
}(Value);

var Add = function (_Value8) {
	_inherits(Add, _Value8);

	function Add(x, y, loc) {
		_classCallCheck(this, Add);

		return _possibleConstructorReturn(this, (Add.__proto__ || Object.getPrototypeOf(Add)).call(this, [x, y], loc));
	}

	_createClass(Add, [{
		key: "run",
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
					var _v2 = v1.value + v2.value;
					if (v1 instanceof FloatValue || v2 instanceof FloatValue) {
						if (!isFinite(_v2)) throw new RuntimeError(this.first_line, "オーバーフローしました");
						this.rtnv = new FloatValue(_v2, this.loc);
					} else {
						if (!isSafeInteger(_v2)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
						this.rtnv = new IntValue(_v2, this.loc);
					}
				}
			code[0].stack[0].index++;
		}
	}, {
		key: "getCode",
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
	}]);

	return Add;
}(Value);

var Sub = function (_Value9) {
	_inherits(Sub, _Value9);

	function Sub(x, y, loc) {
		_classCallCheck(this, Sub);

		return _possibleConstructorReturn(this, (Sub.__proto__ || Object.getPrototypeOf(Sub)).call(this, [x, y], loc));
	}

	_createClass(Sub, [{
		key: "run",
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
		key: "getCode",
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
	}]);

	return Sub;
}(Value);

var Mul = function (_Value10) {
	_inherits(Mul, _Value10);

	function Mul(x, y, loc) {
		_classCallCheck(this, Mul);

		return _possibleConstructorReturn(this, (Mul.__proto__ || Object.getPrototypeOf(Mul)).call(this, [x, y], loc));
	}

	_createClass(Mul, [{
		key: "run",
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
		key: "getCode",
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
	}]);

	return Mul;
}(Value);

var Div = function (_Value11) {
	_inherits(Div, _Value11);

	function Div(x, y, loc) {
		_classCallCheck(this, Div);

		return _possibleConstructorReturn(this, (Div.__proto__ || Object.getPrototypeOf(Div)).call(this, [x, y], loc));
	}

	_createClass(Div, [{
		key: "run",
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のわり算はできません");
			if (v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型のわり算はできません");
			if (v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のわり算はできません");
			if (v2.value == 0 || v2 instanceof NullValue) throw new RuntimeError(this.first_line, "0でわり算をしました");
			if ((v1 instanceof IntValue || v1 instanceof NullValue) && v2 instanceof IntValue) {
				if (setting.div_mode == 0) // 商の整数部分
					{
						var _v3 = (v1.value - v1.value % v2.value) / v2.value;
						if (!isSafeInteger(_v3)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
						this.rtnv = new IntValue(_v3, this.loc);
					} else // 商
					{
						var _v4 = v1.value / v2.value;
						if (!isFinite(_v4)) throw new RuntimeError(this.first_line, "オーバーフローしました");
						this.rtnv = new FloatValue(_v4, this.loc);
					}
			} else {
				var _v5 = v1.value / v2.value;
				if (!isFinite(_v5)) throw new RuntimeError(this.first_line, "オーバーフローしました");
				this.rtnv = new FloatValue(_v5, this.loc);
			}
			code[0].stack[0].index++;
		}
	}, {
		key: "getCode",
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
	}]);

	return Div;
}(Value // /
);

var Div2 = function (_Value12) {
	_inherits(Div2, _Value12);

	function Div2(x, y, loc) {
		_classCallCheck(this, Div2);

		return _possibleConstructorReturn(this, (Div2.__proto__ || Object.getPrototypeOf(Div2)).call(this, [x, y], loc));
	}

	_createClass(Div2, [{
		key: "run",
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のわり算はできません");
			if (v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型のわり算はできません");
			if (v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のわり算はできません");
			if (v2.value == 0 || v2 instanceof NullValue) throw new RuntimeError(this.first_line, "0でわり算をしました");
			if ((v1 instanceof IntValue || v1 instanceof NullValue) && v2 instanceof IntValue) {
				var _v6 = (v1.value - v1.value % v2.value) / v2.value;
				if (!isSafeInteger(_v6)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
				this.rtnv = new IntValue(_v6, this.loc);
			} else {
				var _v7 = v1.value / v2.value;
				if (!isFinite(_v7)) throw new RuntimeError(this.first_line, "オーバーフローしました");
				this.rtnv = new FloatValue(_v7, this.loc);
			}
			code[0].stack[0].index++;
		}
	}, {
		key: "getCode",
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			if (c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
			if (c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' ÷ ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}]);

	return Div2;
}(Value // ÷ 整数どうしなら必ず商の整数部分を返す
);

var Mod = function (_Value13) {
	_inherits(Mod, _Value13);

	function Mod(x, y, loc) {
		_classCallCheck(this, Mod);

		return _possibleConstructorReturn(this, (Mod.__proto__ || Object.getPrototypeOf(Mod)).call(this, [x, y], loc));
	}

	_createClass(Mod, [{
		key: "run",
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if ((v1 instanceof IntValue || v1 instanceof NullValue) && (v2 instanceof IntValue || v2 instanceof NullValue)) {
				if (v2.value == 0) throw new RuntimeError(this.first_line, "0でわり算をしました");
				var _v8 = v1.value % v2.value;
				if (!isSafeInteger(_v8)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
				this.rtnv = new IntValue(_v8, this.loc);
				code[0].stack[0].index++;
			} else throw new RuntimeError(this.first_line, "余りを出す計算は整数でしかできません");
		}
	}, {
		key: "getCode",
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
	}]);

	return Mod;
}(Value);

var Minus = function (_Value14) {
	_inherits(Minus, _Value14);

	function Minus(x, loc) {
		_classCallCheck(this, Minus);

		return _possibleConstructorReturn(this, (Minus.__proto__ || Object.getPrototypeOf(Minus)).call(this, x, loc));
	}

	_createClass(Minus, [{
		key: "run",
		value: function run() {
			var v1 = this.value.getValue();
			if (v1 instanceof NullValue) this.rtnv = v1;else if (v1 instanceof IntValue || v1 instanceof FloatValue) {
				var _v9 = -v1.value;
				if (_v9 instanceof IntValue && !isSafeInteger(_v9)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
				if (_v9 instanceof FloatValue && !isFinite(_v9)) throw new RuntimeError(this.first_line, "オーバーフローしました");
				this.rtnv = v1 instanceof IntValue ? new IntValue(_v9, this.loc) : new FloatValue(_v9, this.loc);
			} else throw new RuntimeError(this.first_line, "マイナスは数値にしかつけられません");
			code[0].stack[0].index++;
		}
	}, {
		key: "getCode",
		value: function getCode() {
			var v1 = this.value;
			var c1 = constructor_name(v1);
			var brace1 = false;
			if (c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
			return '-' + (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '');
		}
	}]);

	return Minus;
}(Value);

var And = function (_Value15) {
	_inherits(And, _Value15);

	function And(x, y, loc) {
		_classCallCheck(this, And);

		return _possibleConstructorReturn(this, (And.__proto__ || Object.getPrototypeOf(And)).call(this, [x, y], loc));
	}

	_createClass(And, [{
		key: "run",
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
		key: "getCode",
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
	}]);

	return And;
}(Value);

var Or = function (_Value16) {
	_inherits(Or, _Value16);

	function Or(x, y, loc) {
		_classCallCheck(this, Or);

		return _possibleConstructorReturn(this, (Or.__proto__ || Object.getPrototypeOf(Or)).call(this, [x, y], loc));
	}

	_createClass(Or, [{
		key: "run",
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
		key: "getCode",
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
	}]);

	return Or;
}(Value);

var Not = function (_Value17) {
	_inherits(Not, _Value17);

	function Not(x, loc) {
		_classCallCheck(this, Not);

		return _possibleConstructorReturn(this, (Not.__proto__ || Object.getPrototypeOf(Not)).call(this, x, loc));
	}

	_createClass(Not, [{
		key: "run",
		value: function run() {
			var v1 = this.value.getValue();
			if (v1 instanceof BooleanValue) this.rtnv = new BooleanValue(!v1.value, this.loc);else throw new RuntimeError(this.first_line, "「でない」は真偽値にしか使えません");
			code[0].stack[0].index++;
		}
	}, {
		key: "getCode",
		value: function getCode() {
			var v1 = this.value;
			var c1 = constructor_name(v1);
			var brace1 = false;
			if (c2 == "And" || c2 == "Or" || c2 == "Not") brace2 = true;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' でない';
		}
	}]);

	return Not;
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
	} else rtnv = rtnv && (typeof v1 === "undefined" ? "undefined" : _typeof(v1)) == (typeof v2 === "undefined" ? "undefined" : _typeof(v2)) && v1.value == v2.value;
	return rtnv;
}

var EQ = function (_Value18) {
	_inherits(EQ, _Value18);

	function EQ(x, y, loc) {
		_classCallCheck(this, EQ);

		return _possibleConstructorReturn(this, (EQ.__proto__ || Object.getPrototypeOf(EQ)).call(this, [x, y], loc));
	}

	_createClass(EQ, [{
		key: "run",
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) this.rtnv = new BooleanValue(ArrayCompare(v1, v2), this.loc);else this.rtnv = new BooleanValue(v1.value == v2.value, this.loc);
			code[0].stack[0].index++;
		}
	}, {
		key: "getCode",
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' = ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}]);

	return EQ;
}(Value);

var NE = function (_Value19) {
	_inherits(NE, _Value19);

	function NE(x, y, loc) {
		_classCallCheck(this, NE);

		return _possibleConstructorReturn(this, (NE.__proto__ || Object.getPrototypeOf(NE)).call(this, [x, y], loc));
	}

	_createClass(NE, [{
		key: "run",
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません");
			this.rtnv = new BooleanValue(v1.value != v2.value, this.loc);
			code[0].stack[0].index++;
		}
	}, {
		key: "getCode",
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' != ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}]);

	return NE;
}(Value);

var GT = function (_Value20) {
	_inherits(GT, _Value20);

	function GT(x, y, loc) {
		_classCallCheck(this, GT);

		return _possibleConstructorReturn(this, (GT.__proto__ || Object.getPrototypeOf(GT)).call(this, [x, y], loc));
	}

	_createClass(GT, [{
		key: "run",
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません");
			this.rtnv = new BooleanValue(v1.value > v2.value, this.loc);
			code[0].stack[0].index++;
		}
	}, {
		key: "getCode",
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' > ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}]);

	return GT;
}(Value);

var GE = function (_Value21) {
	_inherits(GE, _Value21);

	function GE(x, y, loc) {
		_classCallCheck(this, GE);

		return _possibleConstructorReturn(this, (GE.__proto__ || Object.getPrototypeOf(GE)).call(this, [x, y], loc));
	}

	_createClass(GE, [{
		key: "run",
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません");
			this.rtnv = new BooleanValue(v1.value >= v2.value, this.loc);
			code[0].stack[0].index++;
		}
	}, {
		key: "getCode",
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' >= ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}]);

	return GE;
}(Value);

var LT = function (_Value22) {
	_inherits(LT, _Value22);

	function LT(x, y, loc) {
		_classCallCheck(this, LT);

		return _possibleConstructorReturn(this, (LT.__proto__ || Object.getPrototypeOf(LT)).call(this, [x, y], loc));
	}

	_createClass(LT, [{
		key: "run",
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません");
			this.rtnv = new BooleanValue(v1.value < v2.value, this.loc);
			code[0].stack[0].index++;
		}
	}, {
		key: "getCode",
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' < ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}]);

	return LT;
}(Value);

var LE = function (_Value23) {
	_inherits(LE, _Value23);

	function LE(x, y, loc) {
		_classCallCheck(this, LE);

		return _possibleConstructorReturn(this, (LE.__proto__ || Object.getPrototypeOf(LE)).call(this, [x, y], loc));
	}

	_createClass(LE, [{
		key: "run",
		value: function run() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません");
			this.rtnv = new BooleanValue(v1.value <= v2.value, this.loc);
			code[0].stack[0].index++;
		}
	}, {
		key: "getCode",
		value: function getCode() {
			var v1 = this.value[0],
			    v2 = this.value[1];
			var c1 = constructor_name(v1),
			    c2 = constructor_name(v2);
			var brace1 = false,
			    brace2 = false;
			return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '') + ' <= ' + (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '');
		}
	}]);

	return LE;
}(Value);

var Variable = function (_Value24) {
	_inherits(Variable, _Value24);

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
		key: "run",
		value: function run() {
			var vn = this.value[0];
			var vt = findVarTable(vn); // 変数は定義されてるか
			if (vt) {
				//			this.rtnv = vt.vars[vn];
				var _v10 = vt.vars[vn];
				if (_v10 instanceof IntValue) this.rtnv = new IntValue(_v10.value, this.loc);else if (_v10 instanceof FloatValue) this.rtnv = new FloatValue(_v10.value, this.loc);else if (_v10 instanceof StringValue) this.rtnv = new StringValue(_v10.value, this.loc);else if (_v10 instanceof BooleanValue) this.rtnv = new BooleanValue(_v10.value, this.loc);else if (_v10 instanceof ArrayValue) this.rtnv = _v10.getValueFromArray(this.args, this.loc);else throw new RuntimeError(this.first_line, "Unknown Error");
			} else {
				if (setting.var_declaration == 0) throw new RuntimeError(this.first_line, "変数" + vn + "は宣言されていません");else this.rtnv = new NullValue(this.loc);
			}
			code[0].stack[0].index++;
		}
	}, {
		key: "getCode",
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
		key: "varname",
		get: function get() {
			return this.value[0];
		}
	}, {
		key: "args",
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
  */
	function DefinedFunction(argc, func) {
		_classCallCheck(this, DefinedFunction);

		this.argc = argc;this.func = func;
	}
	/**
  * 関数の値を返す
  * @param {Array<Value>} parameters 
  * @param {Location} loc 
  * @returns {any}
  */


	_createClass(DefinedFunction, [{
		key: "exec",
		value: function exec(parameters, loc) {
			if (this.argc instanceof Array && this.argc[0] <= parameters.length && this.argc[1] >= parameters.length || parameters.length == this.argc) return this.func(parameters, loc);
			throw new RuntimeError(loc.first_line, "引数の個数が違います");
		}
	}]);

	return DefinedFunction;
}();

/**
 * 定義済み関数一覧
 */


var definedFunction = {
	"abs": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue) return new IntValue(Math.abs(par1.value), loc);else if (par1 instanceof FloatValue) return new FloatValue(Math.abs(par1.value), loc);else throw new RuntimeError(loc.first_line, func + "は数値にしか使えません");
	}),
	"random": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue) return new IntValue(Math.floor(Math.random() * Math.floor(par1.value + 1)), this.loc);else throw new RuntimeError(this.first_line, func + "は整数にしか使えません");
	}),
	"ceil": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue) return par1;else if (par1 instanceof FloatValue) return new IntValue(Math.ceil(par1.value), this.loc);else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
	}),
	"floor": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue) return par1;else if (par1 instanceof FloatValue) return new IntValue(Math.floor(par1.value), this.loc);else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
	}),
	"round": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue) return par1;else if (par1 instanceof FloatValue) return new IntValue(Math.round(par1.value), this.loc);else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
	}),
	"sin": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue) return new FloatValue(Math.sin(par1.value), this.loc);else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
	}),
	"cos": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue) return new FloatValue(Math.cos(par1.value), this.loc);else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
	}),
	"tan": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue) {
			var _v11 = Math.tan(par1.value);
			if (isFinite(_v11)) return new FloatValue(_v11, this.loc);else throw new RuntimeError(this.first_line, "オーバーフローしました");
		} else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
	}),
	"sqrt": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue) {
			if (par1.value < 0) throw new RuntimeError(this.first_line, "負の数のルートを求めようとしました");
			return new FloatValue(Math.sqrt(par1.value), this.loc);
		} else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
	}),
	"log": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue) {
			if (par1.value <= 0) throw new RuntimeError(this.first_line, "正でない数の対数を求めようとしました");
			var _v12 = Math.log(par1.value);
			if (isFinite(_v12)) return new FloatValue(_v12, this.loc);
			throw new RuntimeError(this.first_line, "オーバーフローしました");
		} else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
	}),
	"exp": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue) {
			var _v13 = Math.exp(par1.value);
			if (isFinite(_v13)) return new FloatValue(_v13, this.loc);
			throw new RuntimeError(this.first_line, "オーバーフローしました");
		} else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
	}),
	"pow": new DefinedFunction(2, function (param, loc) {
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if ((par1 instanceof NullValue || par1 instanceof IntValue) && (par2 instanceof NullValue || par2 instanceof IntValue) && par2.value >= 0) {
			if (par1.value == 0 && par2.value <= 0) throw new RuntimeError(this.first_line, "0は正の数乗しかできません");
			var _v14 = Math.pow(par1.value, par2.value);
			if (isSafeInteger(_v14)) return new IntValue(_v14, this.loc);else throw new RuntimeError(this.first_line, "オーバーフローしました");
		}
		if ((par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue) && (par2 instanceof NullValue || par2 instanceof IntValue || par2 instanceof FloatValue)) {
			if (par1.value < 0 && !Number.isInteger(par2.value)) throw new RuntimeError(this.first_line, "負の数の非整数乗はできません");
			if (par1.value == 0 && par2.value <= 0) throw new RuntimeError(this.first_line, "0は正の数乗しかできません");
			var _v15 = Math.pow(par1.value, par2.value);
			if (isFinite(_v15)) return new FloatValue(_v15, this.loc);else throw new RuntimeError(this.first_line, "オーバーフローしました");
		}
	}),
	"length": new DefinedFunction(1, function (param, loc) {
		var par1 = param[0].getValue();
		if (par1 instanceof NullValue) return new IntValue(0, this.loc);else if (par1 instanceof StringValue) return new IntValue(par1.value.length(), this.loc);else if (par1 instanceof ArrayValue) return new IntValue(par1.length, this.loc);else throw new RuntimeError(this.first_line, func + "は文字列と配列にしか使えません");
	}),
	"substring": new DefinedFunction([2, 3], function (param, loc) {
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		var par3 = param.length == 3 ? param[2].getValue() : null;
		if ((par1 instanceof NullValue || par1 instanceof StringValue) && (par2 instanceof NullValue || par2 instanceof IntValue) && (par3 == null || par1 instanceof NullValue || par3 instanceof IntValue)) {
			var v;
			if (par3 == null) v = par1.value.substr(par2.value);else v = par1.value.substr(par2.value, par3.value);
			return new StringValue(v, this.loc);
		} else throw new RuntimeError(this.first_line, func + "の引数の型が違います");
	}),
	"append": new DefinedFunction(2, function (param, loc) {
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if (par1 instanceof NullValue) return par2;else if (par2 instanceof NullValue) return par1;else if (par2 instanceof StringValue && par2 instanceof StringValue) {
			return new StringValue(par1.value + par2.value, this.loc);
		} else throw new RuntimeError(this.first_line, func + "の引数の型が違います");
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
			if (v3 >= 0 && v3 < v.length) return new StringValue(v[v3], this.loc);else throw new RuntimeError(this.first_line, "番号の値が不正です");
		} else throw new RuntimeError(this.first_line, func + "の引数の型が違います");
	}),
	"insert": new DefinedFunction(3, function (param, loc) {
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		var par3 = param[2].getValue();
		if ((par1 instanceof NullValue || par1 instanceof StringValue) && (par2 instanceof NullValue || par2 instanceof IntValue) && (par3 instanceof NullValue || par3 instanceof StringValue)) {
			var v1 = par1 instanceof NullValue ? '' : par1.value;
			var v2 = par2.value;
			var v3 = par3 instanceof NullValue ? '' : par3.value;
			if (v2 < 0 || v2 > v1.length) throw new RuntimeError(this.first_line, "位置の値が不正です");
			var s1 = v1.substr(0, v2);
			var s2 = v1.substr(v2);
			return new StringValue(s1 + v3 + s2, this.loc);
		} else throw new RuntimeError(this.first_line, func + "の引数の型が違います");
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

			if (v2 < 0 || v2 > v1.length) throw new RuntimeError(this.first_line, "位置の値が不正です");
			if (v3 < 0 || v2 + v3 > v1.length) throw new RuntimeError(this.first_line, "長さの値が不正です");
			var s1 = v1.substr(0, v2);
			var s2 = v1.substr(v2 + v3);
			return new StringValue(s1 + v4 + s2, this.loc);
		} else throw new RuntimeError(this.first_line, func + "の引数の型が違います");
	})
};

/**
 * 関数呼び出し
 */

var CallFunction = function (_Value25) {
	_inherits(CallFunction, _Value25);

	/**
  * @constructor
  * @param {string} funcname 
  * @param {Array<string>} parameter 
  * @param {Location} loc 
  */
	function CallFunction(funcname, parameter, loc) {
		_classCallCheck(this, CallFunction);

		return _possibleConstructorReturn(this, (CallFunction.__proto__ || Object.getPrototypeOf(CallFunction)).call(this, { funcname: funcname, parameter: parameter }, loc));
		//		this.rtnv = new StringValue("関数が終了していません", loc);
	}

	_createClass(CallFunction, [{
		key: "run",
		value: function run() {
			var func = this.value.funcname,
			    param = this.value.parameter;
			if (definedFunction[func]) {
				_get(CallFunction.prototype.__proto__ || Object.getPrototypeOf(CallFunction.prototype), "run", this).call(this);
				returnValues.push(definedFunction[func].exec(param, this.loc));
			} else if (myFuncs[func]) {
				var index = code[0].stack[0].index;
				var fn = myFuncs[func];
				var vt = new varTable();
				for (var i = 0; i < fn.params.length; i++) {
					vt.vars[fn.params[i].varname] = param[i].getValue().clone();
				}
				var statementlist = fn.statementlist.concat();
				statementlist.push(new notReturnedFunction(fn.loc));
				var pf = new parsedFunction(statementlist);
				code.unshift(pf);
				varTables.unshift(vt);
				code[1].stack[0].index = index + 1;
			} else throw new RuntimeError(this.first_line, '関数 ' + func + ' は定義されていません');
		}
	}, {
		key: "getValue",
		value: function getValue() {
			return returnValues.pop();
		}
	}, {
		key: "getCode",
		value: function getCode() {
			var func = this.value.funcname,
			    param = this.value.parameter;
			var ag = [];
			for (var i = 0; i < param.length; i++) {
				ag.push(param[i].getCode());
			}return func + '(' + ag.join(',') + ')';
		}
	}]);

	return CallFunction;
}(Value);

var Append = function (_Value26) {
	_inherits(Append, _Value26);

	function Append(x, y, loc) {
		_classCallCheck(this, Append);

		return _possibleConstructorReturn(this, (Append.__proto__ || Object.getPrototypeOf(Append)).call(this, [x, y], loc));
	}

	_createClass(Append, [{
		key: "run",
		value: function run() {
			var v1 = void 0,
			    v2 = void 0;
			if (this.value[0].getValue() instanceof NullValue) v1 = '';else if (this.value[0].getValue() instanceof ArrayValue) v1 = array2text(this.value[0].getValue());else v1 = String(this.value[0].getValue().value);
			if (this.value[1].getValue() instanceof NullValue) v2 = '';else if (this.value[1].getValue() instanceof ArrayValue) v2 = array2text(this.value[1].getValue());else v2 = String(this.value[1].getValue().value);
			var v = v1 + v2;
			this.rtnv = new StringValue(v, this.loc);
			code[0].stack[0].index++;
		}
	}, {
		key: "getCode",
		value: function getCode() {
			return this.value[0].getCode() + " と " + this.value[1].getCode();
		}
	}]);

	return Append;
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
		key: "run",
		value: function run() {
			code[0].stack[0].index++;
		}
	}, {
		key: "first_line",
		get: function get() {
			return this._loc.first_line;
		}
	}, {
		key: "last_line",
		get: function get() {
			return this._loc.last_line;
		}
	}, {
		key: "loc",
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

		var _this30 = _possibleConstructorReturn(this, (DefineStep.__proto__ || Object.getPrototypeOf(DefineStep)).call(this, loc));

		if (definedFunction[funcName]) throw new RuntimeError(_this30.first_line, '手続き ' + funcName + ' と同名の標準関数が存在します');
		if (myFuncs[funcName]) throw new RuntimeError(_this30.first_line, '手続き ' + funcName + ' と同名の関数、または手続きが既に定義されています');
		_this30.params = params;
		_this30.statementlist = statementlist;
		myFuncs[funcName] = _this30;
		return _this30;
	}

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
		key: "run",
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

		var _this31 = _possibleConstructorReturn(this, (CallStep.__proto__ || Object.getPrototypeOf(CallStep)).call(this, loc));

		_this31.funcName = funcName;
		_this31.args = args;
		return _this31;
	}

	_createClass(CallStep, [{
		key: "run",
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
		key: "run",
		value: function run() {
			if (code[0] instanceof parsedStep) {
				//			code[0].stack[0].index = -1;
				code.shift();
				varTables.shift();
			} else throw new RuntimeError(this.first_line, "手続きの中ではありません");
		}
	}]);

	return ExitStatement;
}(Statement);

var DefineFunction = function (_Statement4) {
	_inherits(DefineFunction, _Statement4);

	function DefineFunction(funcName, params, statementlist, loc) {
		_classCallCheck(this, DefineFunction);

		var _this33 = _possibleConstructorReturn(this, (DefineFunction.__proto__ || Object.getPrototypeOf(DefineFunction)).call(this, loc));

		if (definedFunction[funcName]) throw new RuntimeError(_this33.first_line, '関数 ' + funcName + ' と同名の標準関数が存在します');
		if (myFuncs[funcName]) throw new RuntimeError(_this33.first_line, '関数 ' + funcName + ' と同名の関数、または手続きが既に定義されています');
		_this33.params = params;
		myFuncs[funcName] = _this33;
		_this33.statementlist = statementlist;
		return _this33;
	}

	_createClass(DefineFunction, [{
		key: "run",
		value: function run() {
			_get(DefineFunction.prototype.__proto__ || Object.getPrototypeOf(DefineFunction.prototype), "run", this).call(this);
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

		var _this34 = _possibleConstructorReturn(this, (ReturnStatement.__proto__ || Object.getPrototypeOf(ReturnStatement)).call(this, loc));

		_this34.value = value;
		return _this34;
	}

	_createClass(ReturnStatement, [{
		key: "run",
		value: function run() {
			if (code[0] instanceof parsedFunction) {
				//			this.value.getValue().run();
				returnValues.push(this.value.getValue());
				code.shift();
				varTables.shift();
				//			super.run();
			} else throw new RuntimeError(this.first_line, "関数の中ではありません");
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
		key: "run",
		value: function run() {
			throw new RuntimeError(this.last_line, "関数が値を返さずに終了しました");
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
		key: "run",
		value: function run() {
			textareaAppend("*** 変数確認 ***\n");
			var vars = varTables[0].varnames([]);
			if (varTables.length > 1) vars = varTables[varTables.length - 1].varnames(vars);
			for (var i = 0; i < vars.length; i++) {
				var vartable = findVarTable(vars[i]);
				var _v16 = vartable.vars[vars[i]];
				textareaAppend(vars[i] + ":" + array2code(_v16) + "\n");
			}
			_get(DumpStatement.prototype.__proto__ || Object.getPrototypeOf(DumpStatement.prototype), "run", this).call(this);
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
			var _v17 = args[i];
			if (_v17 instanceof ArrayValue) valuelist2stack(_v17.value, queue);else if (_v17 instanceof Variable && _v17.args) valuelist2stack(_v17.args, queue);else if (_v17 && !(_v17 instanceof Variable) && _v17.value instanceof Array) valuelist2stack(_v17.value, queue);else if (_v17 instanceof CallFunction) valuelist2stack(_v17.value.parameter, queue);
			queue.push(_v17);
		}
	} else if (args instanceof ArrayValue) {
		for (var _i = 0; _i < args.length; _i++) {
			var _v18 = args.nthValue(_i);
			if (_v18 instanceof ArrayValue) valuelist2stack(_v18.value, queue);else if (_v18 instanceof Variable && _v18.args) valuelist2stack(_v18.args, queue);else if (_v18 && !(_v18 instanceof Variable) && _v18.value instanceof Array) valuelist2stack(_v18.value, queue);else if (_v18 instanceof CallFunction) valuelist2stack(_v18.value.parameter, queue);
			queue.push(_v18);
		}
	} else queue.push(v);
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

		var _this37 = _possibleConstructorReturn(this, (runBeforeGetValue.__proto__ || Object.getPrototypeOf(runBeforeGetValue)).call(this, loc));

		_this37.args = args;
		return _this37;
	}

	_createClass(runBeforeGetValue, [{
		key: "run",
		value: function run() {
			_get(runBeforeGetValue.prototype.__proto__ || Object.getPrototypeOf(runBeforeGetValue.prototype), "run", this).call(this);
			var queue = [];
			valuelist2stack(this.args, queue);
			code[0].stack.unshift({ statementlist: queue, index: 0 });
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

		var _this38 = _possibleConstructorReturn(this, (runArgsBeforeGetValue.__proto__ || Object.getPrototypeOf(runArgsBeforeGetValue)).call(this, loc));

		_this38.args = args;
		return _this38;
	}

	_createClass(runArgsBeforeGetValue, [{
		key: "run",
		value: function run() {
			_get(runArgsBeforeGetValue.prototype.__proto__ || Object.getPrototypeOf(runArgsBeforeGetValue.prototype), "run", this).call(this);
			var queue = [];
			for (var i = 0; i < this.args.length; i++) {
				if (this.args[i].parameter) valuelist2stack(this.args[i].parameter, queue);
				if (this.args[i].args) valuelist2stack(this.args[i].args, queue);
			}
			code[0].stack.unshift({ statementlist: queue, index: 0 });
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
		key: "getCode",
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
	}]);

	return DefinitionStatement;
}(Statement);

var DefinitionInt = function (_DefinitionStatement) {
	_inherits(DefinitionInt, _DefinitionStatement);

	function DefinitionInt(x, loc) {
		_classCallCheck(this, DefinitionInt);

		var _this40 = _possibleConstructorReturn(this, (DefinitionInt.__proto__ || Object.getPrototypeOf(DefinitionInt)).call(this, loc));

		_this40.vars = x;
		return _this40;
	}

	_createClass(DefinitionInt, [{
		key: "run",
		value: function run() {
			_get(DefinitionInt.prototype.__proto__ || Object.getPrototypeOf(DefinitionInt.prototype), "run", this).call(this);
			for (var i = 0; i < this.vars.length; i++) {
				if (this.vars[i] instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");

				var varname = this.vars[i].varname;
				var parameter = this.vars[i].parameter;
				var _v19 = varTables[0].findVarTable(varname);
				if (_v19) throw new RuntimeError(this.first_line, varname + "の宣言が重複しています");
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

		var _this41 = _possibleConstructorReturn(this, (DefinitionFloat.__proto__ || Object.getPrototypeOf(DefinitionFloat)).call(this, loc));

		_this41.vars = x;
		return _this41;
	}

	_createClass(DefinitionFloat, [{
		key: "run",
		value: function run() {
			_get(DefinitionFloat.prototype.__proto__ || Object.getPrototypeOf(DefinitionFloat.prototype), "run", this).call(this);
			for (var i = 0; i < this.vars.length; i++) {
				if (this.vars[i] instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");

				var varname = this.vars[i].varname;
				var parameter = this.vars[i].parameter;
				var _v20 = varTables[0].findVarTable(varname);
				if (_v20) throw new RuntimeError(this.first_line, varname + "の宣言が重複しています");
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

		var _this42 = _possibleConstructorReturn(this, (DefinitionString.__proto__ || Object.getPrototypeOf(DefinitionString)).call(this, loc));

		_this42.vars = x;
		return _this42;
	}

	_createClass(DefinitionString, [{
		key: "run",
		value: function run() {
			_get(DefinitionString.prototype.__proto__ || Object.getPrototypeOf(DefinitionString.prototype), "run", this).call(this);
			for (var i = 0; i < this.vars.length; i++) {
				if (this.vars[i] instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");

				var varname = this.vars[i].varname;
				var parameter = this.vars[i].parameter;
				var _v21 = varTables[0].findVarTable(varname);
				if (_v21) throw new RuntimeError(this.first_line, varname + "の宣言が重複しています");
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

		var _this43 = _possibleConstructorReturn(this, (DefinitionBoolean.__proto__ || Object.getPrototypeOf(DefinitionBoolean)).call(this, loc));

		_this43.vars = x;
		return _this43;
	}

	_createClass(DefinitionBoolean, [{
		key: "run",
		value: function run() {
			_get(DefinitionBoolean.prototype.__proto__ || Object.getPrototypeOf(DefinitionBoolean.prototype), "run", this).call(this);
			for (var i = 0; i < this.vars.length; i++) {
				for (var i = 0; i < this.vars.length; i++) {
					if (this.vars[i] instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");

					var varname = this.vars[i].varname;
					var parameter = this.vars[i].parameter;
					var _v22 = varTables[0].findVarTable(varname);
					if (_v22) throw new RuntimeError(this.first_line, varname + "の宣言が重複しています");
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
  * @param {Location} loc 
  */
	function Assign(variable, value, loc) {
		_classCallCheck(this, Assign);

		var _this44 = _possibleConstructorReturn(this, (Assign.__proto__ || Object.getPrototypeOf(Assign)).call(this, loc));

		_this44.variable = variable;
		_this44.value = value;
		return _this44;
	}

	_createClass(Assign, [{
		key: "run",
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
					if (ag) // 配列の添字がある
						for (var _i2 = 0; _i2 < ag.value.length; _i2++) {
							if (va.nthValue(ag.value[_i2].getValue().value)) va = va.nthValue(ag.value[_i2].getValue().value);else {
								if (setting.var_declaration == 0) throw new RuntimeError(this.first_line, vn + argsString(ag) + "には代入できません");
								// 配列を延長する
								if (_i2 < ag.value.length - 1) va = new ArrayValue([], this.loc);else va = new NullValue(this.loc);
							}
						}
					if (va.getValue() instanceof IntValue) {
						var _v23 = 0;
						if (vl instanceof IntValue) _v23 = vl.value;else if (vl instanceof FloatValue) _v23 = Math.floor(vl.value);else throw new RuntimeError(this.first_line, vn + argsString(this.variable.args) + "に数値以外の値を代入しようとしました");
						if (!isSafeInteger(_v23)) throw new RuntimeError(this.first_line, "オーバーフローしました");
						if (ag) vt.vars[vn].setValueToArray(ag, new IntValue(_v23, this.loc));else vt.vars[vn] = new IntValue(_v23, this.loc);
					} else if (va.getValue() instanceof FloatValue) {
						var _v24 = 0.0;
						if (vl instanceof IntValue || vl instanceof FloatValue) _v24 = vl.value + 0.0;else throw new RuntimeError(this.first_line, vn + argsString(this.variable.args) + "に数値以外の値を代入しようとしました");
						if (!isFinite(_v24)) throw new RuntimeError(this.first_line, "オーバーフローしました");
						if (ag) vt.vars[vn].setValueToArray(ag, new FloatValue(_v24, this.loc));else vt.vars[vn] = new FloatValue(_v24, this.loc);
					} else if (va.getValue() instanceof StringValue) {
						var _v25 = '';
						if (vl instanceof StringValue) _v25 = vl.value;else _v25 = text(vl.value);
						if (ag) vt.vars[vn].setValueToArray(ag, new StringValue(_v25, this.loc));else vt.vars[vn] = new StringValue(_v25, this.loc);
					} else if (va.getValue() instanceof BooleanValue) {
						var _v26 = void 0;
						if (vl instanceof BooleanValue) _v26 = vl.value;else throw new RuntimeError(this.first_line, vn + argsString(this.variable.args) + "に真偽以外の値を代入しようとしました");
						if (ag) vt.vars[vn].setValueToArray(ag, new BooleanValue(_v26, this.loc));else vt.vars[vn] = new BooleanValue(_v26, this.loc);
					} else if (va.getValue() instanceof ArrayValue) {
						if (vl.value instanceof Array) {
							var len = vl.value.length;
							for (var i = 0; i < len; i++) {
								var ag1 = this.variable.args instanceof ArrayValue ? this.variable.args.value.slice() : [];
								ag1.push(new IntValue(i + (setting.array_origin == 2 ? 1 : 0), this.loc));
								var command = new Assign(new Variable(this.variable.varname, new ArrayValue(ag1, this.loc), this.loc), vl.value[i], this.loc);
								command.run();
							}
						} else throw new RuntimeError(this.first_line, "配列" + vn + argsString(this.variable.args) + "に配列以外の値を代入しようとしました");
					} else if (va.getValue() instanceof NullValue) {
						if (ag) {
							if (vl instanceof IntValue) vt.vars[vn].setValueToArray(ag, new IntValue(vl.value, this.loc));else if (vl instanceof FloatValue) vt.vars[vn].setValueToArray(ag, new FloatValue(vl.value, this.loc));else if (vl instanceof StringValue) vt.vars[vn].setValueToArray(ag, new StringValue(vl.value, this.loc));else if (vl instanceof BooleanValue) vt.vars[vn].setValueToArray(ag, new BooleanValue(vl.value, this.loc));
						} else {
							if (vl instanceof IntValue) vt.vars[vn] = new IntValue(vl.value, this.loc);else if (vl instanceof FloatValue) vt.vars[vn] = new FloatValue(vl.value, this.loc);else if (vl instanceof StringValue) vt.vars[vn] = new StringValue(vl.value, this.loc);else if (vl instanceof BooleanValue) vt.vars[vn] = new BooleanValue(vl.value, this.loc);
						}
					}
				} else // 変数が定義されていない
				{
					if (setting.var_declaration == 0) throw new RuntimeError(this.first_line, vn + "は宣言されていません");else // 新しい変数を宣言する
						{
							vt = varTables[0];
							if (ag) {
								if (vl instanceof IntValue) vt.vars[vn].setValueToArray(ag, new IntValue(vl.value, this.loc));else if (vl instanceof FloatValue) vt.vars[vn].setValueToArray(ag, new FloatValue(vl.value, this.loc));else if (vl instanceof StringValue) vt.vars[vn].setValueToArray(ag, new StringValue(vl.value, this.loc));else if (vl instanceof BooleanValue) vt.vars[vn].setValueToArray(ag, new BooleanValue(vl.value, this.loc));
							} else {
								if (vl instanceof IntValue) vt.vars[vn] = new IntValue(vl.value, this.loc);else if (vl instanceof FloatValue) vt.vars[vn] = new FloatValue(vl.value, this.loc);else if (vl instanceof StringValue) vt.vars[vn] = new StringValue(vl.value, this.loc);else if (vl instanceof BooleanValue) vt.vars[vn] = new BooleanValue(vl.value, this.loc);
							}
						}
				}
			code[0].stack[0].index = index + 1;
		}
	}]);

	return Assign;
}(Statement);

var Input = function (_Statement12) {
	_inherits(Input, _Statement12);

	function Input(x, loc) {
		_classCallCheck(this, Input);

		var _this45 = _possibleConstructorReturn(this, (Input.__proto__ || Object.getPrototypeOf(Input)).call(this, loc));

		_this45.varname = x;
		return _this45;
	}

	_createClass(Input, [{
		key: "run",
		value: function run() {
			if (selected_quiz < 0) // 通常時
				{
					if (this.varname instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");
					var list = [new InputBegin(this.loc), new InputEnd(this.varname, this.loc)];
					code.unshift(new parsedCode(list));
				} else // 自動採点時
				{
					if (selected_quiz_input < Quizzes[selected_quiz].inputs(selected_quiz_case).length) {
						var index = code[0].stack[0].index;
						if (this.varname instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");
						var va = new Variable(this.varname.varname, this.varname.args, this.loc);
						var vl = Quizzes[selected_quiz].inputs(selected_quiz_case)[selected_quiz_input++];
						va.run();
						var v0 = va.getValue();
						var assign = null;
						var re = /真|true/i;
						if (v0 instanceof IntValue) assign = new Assign(va, new IntValue(Number(toHalf(vl, this.loc)), this.loc), this.loc);else if (v0 instanceof FloatValue) assign = new Assign(va, new FloatValue(Number(toHalf(vl, this.loc)), this.loc), this.loc);else if (v0 instanceof StringValue) assign = new Assign(va, new StringValue(vl + '', this.loc), this.loc);else if (v0 instanceof BooleanValue) assign = new Assign(va, new BooleanValue(re.exec(vl) != null, this.loc), this.loc);else if (v0 instanceof NullValue) assign = new Assign(va, new StringValue(vl + '', this.loc), this.loc);
						assign.run();
						code[0].stack[0].index = index + 1;
					} else throw new RuntimeError(this.first_line, '必要以上の入力を求めています。');
				}
		}
	}]);

	return Input;
}(Statement);

var InputBegin = function (_Statement13) {
	_inherits(InputBegin, _Statement13);

	/**
  * @constructor
  * @param {Location} loc 
  */
	function InputBegin(loc) {
		_classCallCheck(this, InputBegin);

		return _possibleConstructorReturn(this, (InputBegin.__proto__ || Object.getPrototypeOf(InputBegin)).call(this, loc));
	}

	_createClass(InputBegin, [{
		key: "run",
		value: function run() {
			openInputWindow();
			_get(InputBegin.prototype.__proto__ || Object.getPrototypeOf(InputBegin.prototype), "run", this).call(this);
		}
	}]);

	return InputBegin;
}(Statement);

var InputEnd = function (_Statement14) {
	_inherits(InputEnd, _Statement14);

	/**
  * @constructor
  * @param {Variable} x 
  * @param {Location} loc 
  */
	function InputEnd(x, loc) {
		_classCallCheck(this, InputEnd);

		var _this47 = _possibleConstructorReturn(this, (InputEnd.__proto__ || Object.getPrototypeOf(InputEnd)).call(this, loc));

		_this47.varname = x;
		return _this47;
	}

	_createClass(InputEnd, [{
		key: "run",
		value: function run() {
			if (this.varname instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");
			try {
				var va = new Variable(this.varname.varname, this.varname.args, this.loc);
				var vl = closeInputWindow();
				va.run();
				var v0 = va.getValue();
				var assign = null;
				var re = /真|true/i;
				code.shift();
				var index = code[0].stack[0].index;
				if (v0 instanceof IntValue) assign = new Assign(va, new IntValue(Number(toHalf(vl, this.loc)), this.loc), this.loc);else if (v0 instanceof FloatValue) assign = new Assign(va, new FloatValue(Number(toHalf(vl, this.loc)), this.loc), this.loc);else if (v0 instanceof StringValue) assign = new Assign(va, new StringValue(vl + '', this.loc), this.loc);else if (v0 instanceof BooleanValue) assign = new Assign(va, new BooleanValue(re.exec(vl) != null, this.loc), this.loc);else if (v0 instanceof NullValue) assign = new Assign(va, new StringValue(vl + '', this.loc), this.loc);
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

var Output = function (_Statement15) {
	_inherits(Output, _Statement15);

	/**
  * 
  * @param {Value} x 
  * @param {boolean} ln 
  * @param {Location} loc 
  */
	function Output(x, ln, loc) {
		_classCallCheck(this, Output);

		var _this48 = _possibleConstructorReturn(this, (Output.__proto__ || Object.getPrototypeOf(Output)).call(this, loc));

		_this48.value = x;
		_this48.ln = ln;
		return _this48;
	}

	_createClass(Output, [{
		key: "run",
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
	}]);

	return Output;
}(Statement);

function array2text(v) {
	if (v instanceof NullValue || !v) return '';
	var v0 = v.getValue();
	if (v0 instanceof ArrayValue) {
		var v1 = [];
		for (var i = 0; i < v0.value.length; i++) {
			v1.push(array2text(v0.nthValue(i)));
		}return '[' + v1.join(',') + ']';
	}
	return v0.value;
}

function array2code(v) {
	if (v instanceof NullValue || !v) return '';
	var v0 = v.getValue();
	if (v0 instanceof ArrayValue) {
		var v1 = [];
		for (var i = 0; i < v0.value.length; i++) {
			v1.push(array2text(v0.nthValue(i)));
		}return '[' + v1.join(',') + ']';
	} else if (v0 instanceof StringValue) return "「" + v0.value + "」";
	return v0.value;
}

var GraphicStatement = function (_Statement16) {
	_inherits(GraphicStatement, _Statement16);

	function GraphicStatement(command, args, loc) {
		_classCallCheck(this, GraphicStatement);

		var _this49 = _possibleConstructorReturn(this, (GraphicStatement.__proto__ || Object.getPrototypeOf(GraphicStatement)).call(this, loc));

		_this49.command = command;
		_this49.args = args;
		return _this49;
	}

	_createClass(GraphicStatement, [{
		key: "run",
		value: function run() {
			_get(GraphicStatement.prototype.__proto__ || Object.getPrototypeOf(GraphicStatement.prototype), "run", this).call(this);
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
			} else if (this.command == 'gSetLineWidth') {
				if (context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				context.lineWidth = this.args[0].getValue().value;
			} else if (this.command == 'gSetFontSize') {
				if (context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				context.font = this.args[0].getValue().value + "px 'sans-serif'";
			} else if (this.command == 'gDrawText') {
				if (context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				context.fillText(this.args[0].getValue().value, this.args[1].getValue().value, this.args[2].getValue().value);
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
			} else if (this.command == 'gDrawBox') {
				if (context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				var _x = this.args[0].getValue().value,
				    _y = this.args[1].getValue().value,
				    width = this.args[2].getValue().value,
				    height = this.args[3].getValue().value;
				context.beginPath();
				context.strokeRect(_x, _y, width, height);
				context.stroke();
			} else if (this.command == 'gFillBox') {
				if (context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				var _x2 = this.args[0].getValue().value,
				    _y2 = this.args[1].getValue().value,
				    _width = this.args[2].getValue().value,
				    _height = this.args[3].getValue().value;
				context.fillRect(_x2, _y2, _width, _height);
			} else if (this.command == 'gDrawCircle') {
				if (context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				var _x3 = this.args[0].getValue().value,
				    _y3 = this.args[1].getValue().value,
				    _r2 = this.args[2].getValue().value;
				context.beginPath();
				context.arc(_x3, _y3, _r2, 0, Math.PI * 2, false);
				context.stroke();
			} else if (this.command == 'gFillCircle') {
				if (context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				var _x4 = this.args[0].getValue().value,
				    _y4 = this.args[1].getValue().value,
				    _r3 = this.args[2].getValue().value;
				context.beginPath();
				context.arc(_x4, _y4, _r3, 0, Math.PI * 2, false);
				context.fill();
			} else {
				throw new RuntimeError(this.first_line, "未実装のコマンド" + this.command + "が使われました");
			}
		}
	}]);

	return GraphicStatement;
}(Statement);

var If = function (_Statement17) {
	_inherits(If, _Statement17);

	function If(condition, state1, state2, loc) {
		_classCallCheck(this, If);

		var _this50 = _possibleConstructorReturn(this, (If.__proto__ || Object.getPrototypeOf(If)).call(this, loc));

		_this50.condition = condition;
		_this50.state1 = state1;
		_this50.state2 = state2;
		return _this50;
	}

	_createClass(If, [{
		key: "run",
		value: function run() {
			_get(If.prototype.__proto__ || Object.getPrototypeOf(If.prototype), "run", this).call(this);
			if (this.condition.getValue() instanceof BooleanValue) {
				if (this.condition.getValue().value) code[0].stack.unshift({ statementlist: this.state1, index: 0 });else if (this.state2 != null) code[0].stack.unshift({ statementlist: this.state2, index: 0 });
			} else throw new RuntimeError(this.first_line, "もし〜の構文で条件式が使われていません");
		}
	}]);

	return If;
}(Statement);

var LoopBegin = function (_Statement18) {
	_inherits(LoopBegin, _Statement18);

	/**
  * @constructor
  * @param {Value} condition nullなら判定しない
  * @param {boolean} continuous condition==continuousなら継続
  * @param {Location} loc 
  */
	function LoopBegin(condition, continuous, loc) {
		_classCallCheck(this, LoopBegin);

		var _this51 = _possibleConstructorReturn(this, (LoopBegin.__proto__ || Object.getPrototypeOf(LoopBegin)).call(this, loc));

		_this51.condition = condition;
		_this51.continuous = continuous;
		return _this51;
	}

	_createClass(LoopBegin, [{
		key: "run",
		value: function run() {
			if (this.condition == null || this.condition.getValue().value == this.continuous) _get(LoopBegin.prototype.__proto__ || Object.getPrototypeOf(LoopBegin.prototype), "run", this).call(this);else code[0].stack[0].index = -1;
		}
	}]);

	return LoopBegin;
}(Statement);

var LoopEnd = function (_Statement19) {
	_inherits(LoopEnd, _Statement19);

	/**
  * @constructor
  * @param {Value} condition nullなら判定しない
  * @param {boolean} continuous condition==continuousなら継続
  * @param {Location} loc 
  */
	function LoopEnd(condition, continuous, loc) {
		_classCallCheck(this, LoopEnd);

		var _this52 = _possibleConstructorReturn(this, (LoopEnd.__proto__ || Object.getPrototypeOf(LoopEnd)).call(this, loc));

		_this52.condition = condition;
		_this52.continuous = continuous;
		return _this52;
	}

	_createClass(LoopEnd, [{
		key: "run",
		value: function run() {
			if (this.condition == null || this.condition.getValue().value == this.continuous) code[0].stack[0].index = 0;else code[0].stack[0].index = -1;
		}
	}]);

	return LoopEnd;
}(Statement);

/**
 * forループ（加算）
 */


var ForInc = function (_Statement20) {
	_inherits(ForInc, _Statement20);

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

		var _this53 = _possibleConstructorReturn(this, (ForInc.__proto__ || Object.getPrototypeOf(ForInc)).call(this, loc));

		_this53.varname = varname;
		_this53.begin = begin;
		_this53.end = end;
		_this53.step = step;
		_this53.statementlist = statementlist;
		return _this53;
	}

	_createClass(ForInc, [{
		key: "run",
		value: function run() {
			var index = code[0].stack[0].index;
			if (this.varname instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");
			var last_token = { first_line: this.last_line, last_line: this.last_line };
			var last_loc = new Location(last_token, last_token);
			var varTable = findVarTable(this.varname.varname);
			if (setting.var_declaration != 0 && !varTable) {
				var _varTable = varTables[0];
				if (this.begin.getValue() instanceof IntValue) _varTable.vars[this.varname.varname] = new IntValue(0, this.loc);else if (this.begin.getValue() instanceof FloatValue) _varTable.vars[this.varname.varname] = new IntValue(0, this.loc);else _varTable = null;
			}
			if (varTable) {
				// ループ前の初期化
				this.begin.run(); // ここ手抜き(?)
				var assign = new Assign(this.varname, this.begin.getValue(), this.loc);
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
				loop.push(new Assign(this.varname, new_counter, this.loc));
				loop.push(new LoopEnd(null, true, last_loc));
				code[0].stack.unshift({ statementlist: loop, index: 0 });
				code[0].stack[1].index = index + 1;
			} else throw new RuntimeError(this.first_line, this.varname.varname + "は数値型の変数ではありません");
		}
	}]);

	return ForInc;
}(Statement);

var ForDec = function (_Statement21) {
	_inherits(ForDec, _Statement21);

	function ForDec(varname, begin, end, step, statementlist, loc) {
		_classCallCheck(this, ForDec);

		var _this54 = _possibleConstructorReturn(this, (ForDec.__proto__ || Object.getPrototypeOf(ForDec)).call(this, loc));

		_this54.varname = varname;
		_this54.begin = begin;
		_this54.end = end;
		_this54.step = step;
		_this54.statementlist = statementlist;
		return _this54;
	}

	_createClass(ForDec, [{
		key: "run",
		value: function run() {
			if (this.varname instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");
			var last_token = { first_line: this.last_line, last_line: this.last_line };
			var last_loc = new Location(last_token, last_token);
			var varTable = findVarTable(this.varname.varname);
			if (setting.var_declaration != 0 && !varTable) {
				var _varTable2 = varTables[0];
				if (this.begin.getValue() instanceof IntValue) _varTable2.vars[this.varname.varname] = new IntValue(0, this.loc);else if (this.begin.getValue() instanceof FloatValue) _varTable2.vars[this.varname.varname] = new IntValue(0, this.loc);else _varTable2 = null;
			}
			if (varTable) {
				// ループ前の初期化
				this.begin.run();
				var assign = new Assign(this.varname, this.begin.getValue(), this.loc);
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
				loop.push(new Assign(this.varname, new_counter, last_loc));
				loop.push(new LoopEnd(null, true, last_loc));
				code[0].stack.unshift({ statementlist: loop, index: 0 });
			} else throw new RuntimeError(this.first_line, this.varname.varname + "は数値型の変数ではありません");
			_get(ForDec.prototype.__proto__ || Object.getPrototypeOf(ForDec.prototype), "run", this).call(this);
		}
	}]);

	return ForDec;
}(Statement);

var Until = function (_Statement22) {
	_inherits(Until, _Statement22);

	function Until(statementlist, condition, loc) {
		_classCallCheck(this, Until);

		var _this55 = _possibleConstructorReturn(this, (Until.__proto__ || Object.getPrototypeOf(Until)).call(this, loc));

		_this55.condition = condition;
		_this55.statementlist = statementlist;
		return _this55;
	}

	_createClass(Until, [{
		key: "run",
		value: function run() {
			_get(Until.prototype.__proto__ || Object.getPrototypeOf(Until.prototype), "run", this).call(this);
			var last_token = { first_line: this.last_line, last_line: this.last_line };
			var loop = [new LoopBegin(null, true, this.loc)];
			for (var i = 0; i < this.statementlist.length; i++) {
				loop.push(this.statementlist[i]);
			}loop.push(new runBeforeGetValue([this.condition], this.loc));
			loop.push(new LoopEnd(this.condition, false, new Location(last_token, last_token)));
			code[0].stack.unshift({ statementlist: loop, index: 0 });
		}
	}]);

	return Until;
}(Statement);

var While = function (_Statement23) {
	_inherits(While, _Statement23);

	function While(condition, statementlist, loc) {
		_classCallCheck(this, While);

		var _this56 = _possibleConstructorReturn(this, (While.__proto__ || Object.getPrototypeOf(While)).call(this, loc));

		_this56.condition = condition;
		_this56.statementlist = statementlist;
		return _this56;
	}

	_createClass(While, [{
		key: "run",
		value: function run() {
			_get(While.prototype.__proto__ || Object.getPrototypeOf(While.prototype), "run", this).call(this);
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

var SleepStatement = function (_Statement24) {
	_inherits(SleepStatement, _Statement24);

	function SleepStatement(sec, loc) {
		_classCallCheck(this, SleepStatement);

		var _this57 = _possibleConstructorReturn(this, (SleepStatement.__proto__ || Object.getPrototypeOf(SleepStatement)).call(this, loc));

		_this57.sec = new IntValue(sec.value, loc); // milli seconds
		return _this57;
	}

	_createClass(SleepStatement, [{
		key: "run",
		value: function run() {
			wait_time = this.sec.value;
			_get(SleepStatement.prototype.__proto__ || Object.getPrototypeOf(SleepStatement.prototype), "run", this).call(this);
		}
	}]);

	return SleepStatement;
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
}

function setRunflag(b) {
	run_flag = b;
	document.getElementById("sourceTextarea").readOnly = b;
	document.getElementById("runButton").innerHTML = b & !step_flag ? "中断" : "実行";
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
		if (code[0].stack.length > 0) {
			if (run_flag && !step_flag) {
				if (wait_time > 0) {
					wait(wait_time);
					wait_time = 0;
				}
				setZeroTimeout(step, 0);
			}
		} else if (code[0].finish) code[0].finish();
	} else {
		do {
			next_line();
			if (Date.now() > test_limit_time) throw new RuntimeError(-1, '時間がかかりすぎです。');
		} while (run_flag && code[0].stack.length > 0);
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
		if (code[0].stack.length < 1) break;
		index = code[0].stack[0].index;
	}
	if (selected_quiz < 0) {
		// 次の行をハイライト表示する
		if (code[0].stack[0]) {
			index = code[0].stack[0].index;
			statement = code[0].stack[0].statementlist[index];
			if (statement) {
				highlightLine(current_line = statement.first_line);
			}
		} else highlightLine(++current_line);
	}
}

function openInputWindow() {
	setRunflag(false);
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
	var re5 = /^\n/;
	var tab = "";
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
		case 13:
			// \n
			if (!re5.exec(code2)) return true;
			var match = re3.exec(code1);
			if (match) {
				tab = match[1];
				if (re4.exec(match[2]) || re4a.exec(match[2])) tab = "    " + tab;
			}
			sourceTextArea.value = code1 + tab + code2;
			pos = code1.length + tab.length;
			sourceTextArea.setSelectionRange(pos, pos);
			return false;
		// TODO backspace 
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
		key: "clone",
		value: function clone() {
			var p = new point();p.x = this.x;p.y = this.y;return p;
		}
	}, {
		key: "x",
		get: function get() {
			return this._x;
		},
		set: function set(v) {
			this._x = v;
		}
	}, {
		key: "y",
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
	if (key == "input") Parts_Input.appendMe(bar);else if (key == "output") Parts_Output.appendMe(bar);else if (key == "substitute") Parts_Substitute.appendMe(bar);else if (key == "if") Parts_If.appendMe(bar);else if (key == "loop1") Parts_LoopBegin1.appendMe(bar);else if (key == "loopinc") Parts_LoopBeginInc.appendMe(bar);else if (key == "loopdec") Parts_LoopBeginDec.appendMe(bar);else if (key == "misc") Parts_Misc.appendMe(bar);else return;
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
		key: "setOrigin",
		value: function setOrigin(x, y) {
			this._x0 = x;this._y0 = y;
		}
	}, {
		key: "moveOrigin",
		value: function moveOrigin(x, y) {
			this._x0 += x;this._y0 += y;
		}
	}, {
		key: "makeEmpty",
		value: function makeEmpty() {
			this.setOrigin(this.canvas.width / 2, FlowchartSetting.size);
			this.top = new Parts_Terminal();
			var bar = new Parts_Bar();
			var end = new Parts_Terminal();
			this.top.next = bar;
			bar.next = end;
			this.top.setValue("はじめ");
			end.setValue("おわり");
			document.getElementById("variable_int").value = '';
			document.getElementById("variable_float").value = '';
			document.getElementById("variable_string").value = '';
			document.getElementById("variable_bool").value = '';
		}
	}, {
		key: "code2flowchart",
		value: function code2flowchart(parse) {
			flowchart.makeEmpty();
			Flowchart.appendParts(this.top.next, parse);
			flowchart.paint();
		}
	}, {
		key: "flowchart2code",
		value: function flowchart2code() {
			if (!flowchart_display) return;
			var code = '';
			code += variable2code("整数", "variable_int");
			code += variable2code("実数", "variable_float");
			code += variable2code("文字列", "variable_string");
			code += variable2code("真偽", "variable_bool");
			code += this.top.appendCode('', 0);
			document.getElementById("sourceTextarea").value = code;
		}
	}, {
		key: "paint",
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
		key: "findParts",
		value: function findParts(x, y) {
			return this.top.findParts(x, y);
		}
	}, {
		key: "x0",
		get: function get() {
			return this._x0;
		}
	}, {
		key: "y0",
		get: function get() {
			return this._y0;
		}
	}, {
		key: "canvas",
		get: function get() {
			return this._canvas;
		}
	}, {
		key: "context",
		get: function get() {
			return this._context;
		}
	}], [{
		key: "appendParts",
		value: function appendParts(parts, statementlist) {
			for (var i = 0; i < statementlist.length; i++) {
				var p = statementlist[i];
				if (!p) continue;
				var statement = constructor_name(p);
				if (statement == "DefinitionInt") {
					document.getElementById("variable_int").value = p.getCode();
				} else if (statement == "DefinitionFloat") {
					document.getElementById("variable_float").value = p.getCode();
				} else if (statement == "DefinitionString") {
					document.getElementById("variable_string").value = p.getCode();
				} else if (statement == "DefinitionBoolean") {
					document.getElementById("variable_bool").value = p.getCode();
				} else if (statement == "Assign") {
					var p1 = new Parts_Substitute();
					var b1 = new Parts_Bar();
					p1.setValue(p.variable.getCode(), p.value.getCode());
					parts.next = p1;
					parts = p1.next = b1;
				} else if (statement == "Input") {
					var p1 = new Parts_Input();
					var b1 = new Parts_Bar();
					p1.setValue(p.varname.getCode());
					parts.next = p1;
					parts = p1.next = b1;
				} else if (statement == "Output") {
					var p1 = new Parts_Output();
					var b1 = new Parts_Bar();
					p1.setValue(p.value.getCode(), p.ln);
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
				} else if (statement == "DumpStatement") {
					var p1 = new Parts_Misc();
					var b1 = new Parts_Bar();
					p1.setValue("dump", []);
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
		key: "inside",
		value: function inside(x, y) {
			return this.x1 <= x && x <= this.x2 && this.y1 <= y && y <= this.y2;
		}
	}, {
		key: "findParts",
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
		key: "paint",
		value: function paint(position) {
			if (this.next != null) return this.next.paint(position);
			return this;
		}
	}, {
		key: "calcTextsize",
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
		key: "calcSize",
		value: function calcSize(p0, p1, p2) {
			if (this.next == null || this.isBlockEnd) return this;
			return this.next.calcSize(p0, p1, p2);
		}
	}, {
		key: "appendCode",
		value: function appendCode(code, indent) {
			if (this.next != null) return this.next.appendCode(code, indent);
			return code;
		}
	}, {
		key: "editMe",
		value: function editMe() {}
	}, {
		key: "deleteMe",
		value: function deleteMe() {
			this.prev._next = this.end.next.next;
			this.end.next.next._prev = this.prev;
			this.end._next = null;
			this._next = null;
		}
	}, {
		key: "cutMe",
		value: function cutMe() {}
	}, {
		key: "paint_highlight",
		value: function paint_highlight() {
			flowchart.context.strokeStyle = "rgb(255,0,0)";
			flowchart.context.fillStyle = "rgb(255,0,0)";
			flowchart.context.clearRect(this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1);
			this.paint(null);
			flowchart.context.strokeStyle = "rgb(0,0,0)";
			flowchart.context.fillStyle = "rgb(0,0,0)";
		}
	}, {
		key: "paint_unhighlight",
		value: function paint_unhighlight() {
			flowchart.context.clearRect(this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1);
			this.paint(null);
		}
	}, {
		key: "highlight",
		value: function highlight() {
			this.paint_highlight();
		}
	}, {
		key: "unhighlight",
		value: function unhighlight() {
			this.paint_unhighlight();
		}
	}, {
		key: "x1",
		get: function get() {
			return this._x1;
		},
		set: function set(x) {
			this._x1 = x;
		} // paintで計算する

	}, {
		key: "y1",
		get: function get() {
			return this._y1;
		},
		set: function set(y) {
			this._y1 = y;
		}
	}, {
		key: "x2",
		get: function get() {
			return this._x2;
		},
		set: function set(x) {
			this._x2 = x;
		}
	}, {
		key: "y2",
		get: function get() {
			return this._y2;
		},
		set: function set(y) {
			this._y2 = y;
		}
	}, {
		key: "text",
		get: function get() {
			return this._text;
		}
	}, {
		key: "next",
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
		key: "prev",
		get: function get() {
			return this._prev;
		}
	}, {
		key: "end",
		get: function get() {
			return this;
		} // ブロックの終わりのパーツ

	}, {
		key: "width",
		get: function get() {
			return this._width;
		} // calcSizeで計算する

	}, {
		key: "height",
		get: function get() {
			return this._height;
		} // calcSizeで計算する

	}, {
		key: "textWidth",
		get: function get() {
			return this._textwidth;
		} // calcSizeで計算する

	}, {
		key: "textHeight",
		get: function get() {
			return this._textheight;
		} // calcSizeで計算する

	}, {
		key: "hspace",
		get: function get() {
			return this._hspace;
		}
	}, {
		key: "hspace2",
		get: function get() {
			return this._hspace2;
		}
	}, {
		key: "isBlockEnd",
		get: function get() {
			return false;
		}
	}], [{
		key: "appendMe",
		value: function appendMe(bar) {}
	}, {
		key: "makeIndent",
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
		key: "isBlockEnd",
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
		key: "calcSize",
		value: function calcSize(p0, p1, p2) {
			this._width = 0;
			this._height = FlowchartSetting.size * 3;
			p0.y += this._height;
			if (p0.y > p2.y) p2.y = p0.y;
			return this.next.calcSize(p0, p1, p2);
		}
	}, {
		key: "inside",
		value: function inside(x, y) {
			var near = 4;
			return this.x1 - near <= x && x <= this.x2 + near && this.y1 <= y && y <= this.y2;
		}
	}, {
		key: "paint",
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
		key: "calcSize",
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
		key: "setValue",
		value: function setValue(v) {
			this._text = v;
		}
	}, {
		key: "paint",
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

		var _this61 = _possibleConstructorReturn(this, (Parts_Output.__proto__ || Object.getPrototypeOf(Parts_Output)).call(this));

		_this61.setValue("《値》", true);
		return _this61;
	}

	_createClass(Parts_Output, [{
		key: "setValue",
		value: function setValue(v, nl) {
			this._text = v;
			this._newline = nl;
		}
	}, {
		key: "calcSize",
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
		key: "paint",
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

			if (!this.newline) // 改行なしマーク
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
		key: "appendCode",
		value: function appendCode(code, indent) {
			code += Parts.makeIndent(indent);
			code += this.text + "を" + (this.newline ? "" : "改行なしで") + "表示する\n";
			if (this.next != null) return this.next.appendCode(code, indent);
			return code;
		}
	}, {
		key: "editMe",
		value: function editMe() {
			var subtitle = ["値", "改行"];
			var values = [this.text, this.newline];
			openModalWindowforOutput("出力の編集", subtitle, values, this);
		}
	}, {
		key: "edited",
		value: function edited(values) {
			if (values != null) {
				this.setValue(values[0], values[1]);
			}
			flowchart.paint();
			flowchart.flowchart2code();
		}
	}, {
		key: "newline",
		get: function get() {
			return this._newline;
		}
	}], [{
		key: "appendMe",
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

		var _this62 = _possibleConstructorReturn(this, (Parts_Input.__proto__ || Object.getPrototypeOf(Parts_Input)).call(this));

		_this62.setValue("《変数》");
		return _this62;
	}

	_createClass(Parts_Input, [{
		key: "setValue",
		value: function setValue(v) {
			this._var = v;
			this._text = v + "を入力";
		}
	}, {
		key: "calcSize",
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
		key: "paint",
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
		key: "appendCode",
		value: function appendCode(code, indent) {
			code += Parts.makeIndent(indent);
			code += this.var + "を入力する\n";
			if (this.next != null) return this.next.appendCode(code, indent);
			return code;
		}
	}, {
		key: "editMe",
		value: function editMe() {
			var subtitle = ["変数"];
			var values = [this.var];
			openModalWindow("入力の編集", subtitle, values, this);
		}
	}, {
		key: "edited",
		value: function edited(values) {
			if (values != null) {
				this.setValue(values[0]);
			}
			flowchart.paint();
			flowchart.flowchart2code();
		}
	}, {
		key: "var",
		get: function get() {
			return this._var;
		}
	}], [{
		key: "appendMe",
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

		var _this63 = _possibleConstructorReturn(this, (Parts_Substitute.__proto__ || Object.getPrototypeOf(Parts_Substitute)).call(this));

		_this63.setValue("《変数》", "《値》");
		return _this63;
	}

	_createClass(Parts_Substitute, [{
		key: "setValue",
		value: function setValue(variable, value) {
			this._var = variable;
			this._val = value;

			this._text = this._var + "←" + this._val;
		}
	}, {
		key: "calcSize",
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
		key: "paint",
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
		key: "appendCode",
		value: function appendCode(code, indent) {
			code += Parts.makeIndent(indent);
			code += this.var + "←" + this.val + "\n";
			if (this.next != null) return this.next.appendCode(code, indent);
			return code;
		}
	}, {
		key: "editMe",
		value: function editMe() {
			var subtitle = ["変数", "値"];
			var values = [this.var, this.val];
			openModalWindow("代入の編集", subtitle, values, this);
		}
	}, {
		key: "edited",
		value: function edited(values) {
			if (values != null) {
				this.setValue(values[0], values[1]);
			}
			flowchart.paint();
			flowchart.flowchart2code();
		}
	}, {
		key: "var",
		get: function get() {
			return this._var;
		}
	}, {
		key: "val",
		get: function get() {
			return this._val;
		}
	}], [{
		key: "appendMe",
		value: function appendMe(bar) {
			var parts = new Parts_Substitute();
			bar.next = parts;
			parts.next = new Parts_Bar();
			return parts.next;
		}
	}]);

	return Parts_Substitute;
}(Parts);

var Parts_If = function (_Parts7) {
	_inherits(Parts_If, _Parts7);

	function Parts_If() {
		_classCallCheck(this, Parts_If);

		var _this64 = _possibleConstructorReturn(this, (Parts_If.__proto__ || Object.getPrototypeOf(Parts_If)).call(this));

		_this64.setValue("《条件》");
		_this64.left = _this64.right = null;
		_this64.left_bar_expand = _this64.right_bar_expand = 0;
		return _this64;
	}

	_createClass(Parts_If, [{
		key: "setValue",
		value: function setValue(cond) {
			this._cond = cond;
			this._text = this._cond;
		}
	}, {
		key: "calcTextsize",
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
		key: "calcSize",
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
		key: "paint",
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
		key: "appendCode",
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
		key: "editMe",
		value: function editMe() {
			var subtitle = ["条件"];
			var values = [this.condition];
			openModalWindow("分岐の編集", subtitle, values, this);
		}
	}, {
		key: "edited",
		value: function edited(values) {
			if (values != null) {
				this.setValue(values[0]);
			}
			flowchart.paint();
			flowchart.flowchart2code();
		}
	}, {
		key: "condition",
		get: function get() {
			return this._cond;
		}
	}, {
		key: "end",
		get: function get() {
			return this.next;
		}
	}], [{
		key: "appendMe",
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

var Parts_LoopBegin = function (_Parts8) {
	_inherits(Parts_LoopBegin, _Parts8);

	function Parts_LoopBegin() {
		_classCallCheck(this, Parts_LoopBegin);

		return _possibleConstructorReturn(this, (Parts_LoopBegin.__proto__ || Object.getPrototypeOf(Parts_LoopBegin)).apply(this, arguments));
	}

	_createClass(Parts_LoopBegin, [{
		key: "calcTextsize",
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
		key: "calcSize",
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
		key: "paint",
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
		key: "deleteMe",
		value: function deleteMe() {
			this.prev._next = this.end.next.next;
			this.end.next.next._prev = this.prev;
			this.end._next = null;
			this._next = null;
		}
	}, {
		key: "highlight",
		value: function highlight() {
			this.paint_highlight();
			this.end.paint_highlight();
		}
	}, {
		key: "unhighlight",
		value: function unhighlight() {
			this.paint_unhighlight();
			this.end.paint_unhighlight();
		}
	}, {
		key: "hasText",
		get: function get() {
			return false;
		}
	}, {
		key: "end",
		get: function get() {
			return this._end;
		}
	}]);

	return Parts_LoopBegin;
}(Parts);

var Parts_LoopBegin1 = function (_Parts_LoopBegin) {
	_inherits(Parts_LoopBegin1, _Parts_LoopBegin);

	_createClass(Parts_LoopBegin1, [{
		key: "hasText",
		get: function get() {
			return true;
		}
	}]);

	function Parts_LoopBegin1() {
		_classCallCheck(this, Parts_LoopBegin1);

		var _this66 = _possibleConstructorReturn(this, (Parts_LoopBegin1.__proto__ || Object.getPrototypeOf(Parts_LoopBegin1)).call(this));

		_this66.setValue("《条件》");
		return _this66;
	}

	_createClass(Parts_LoopBegin1, [{
		key: "setValue",
		value: function setValue(cond) {
			this._cond = cond;
			this._text = this._cond;
		}
	}, {
		key: "appendCode",
		value: function appendCode(code, indent) {
			code += Parts.makeIndent(indent);
			code += this.condition + " の間繰り返す：\n";
			var code_inner = this.next.appendCode('', indent + 1);
			if (code_inner == '') code += Parts.makeIndent(indent + 1) + "\n";else code += code_inner;

			if (this.end.next != null) return this.end.next.appendCode(code, indent);
			return code;
		}
	}, {
		key: "editMe",
		value: function editMe() {
			var subtitle = ["条件（〜の間）"];
			var values = [this.condition];
			openModalWindow("繰り返しの編集", subtitle, values, this);
		}
	}, {
		key: "edited",
		value: function edited(values) {
			if (values != null) {
				this.setValue(values[0]);
			}
			flowchart.paint();
			flowchart.flowchart2code();
		}
	}, {
		key: "condition",
		get: function get() {
			return this._cond;
		}
	}, {
		key: "text2",
		get: function get() {
			return "の間";
		}
	}], [{
		key: "appendMe",
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
		key: "hasText",
		get: function get() {
			return true;
		}
	}]);

	function Parts_LoopBeginInc() {
		_classCallCheck(this, Parts_LoopBeginInc);

		var _this67 = _possibleConstructorReturn(this, (Parts_LoopBeginInc.__proto__ || Object.getPrototypeOf(Parts_LoopBeginInc)).call(this));

		_this67.setValue("《変数》", "《値》", "《値》", "《値》");
		return _this67;
	}

	_createClass(Parts_LoopBeginInc, [{
		key: "setValue",
		value: function setValue(variable, start, goal, step) {
			this._var = variable;
			this._start = start;
			this._goal = goal;
			this._step = step;
			this._text = this.var + ':' + this.start + "→" + this.goal;
		}
	}, {
		key: "appendCode",
		value: function appendCode(code, indent) {
			code += Parts.makeIndent(indent);
			code += this.var + "を" + this.start + "から" + this.goal + "まで" + this.step + "ずつ増やしながら繰り返す：\n";
			var code_inner = this.next.appendCode('', indent + 1);
			if (code_inner == '') code += Parts.makeIndent(indent + 1) + "\n";else code += code_inner;

			if (this.end.next != null) return this.end.next.appendCode(code, indent);
			return code;
		}
	}, {
		key: "editMe",
		value: function editMe() {
			var subtitle = ["変数", "〜から", "〜まで", "増加分"];
			var values = [this.var, this.start, this.goal, this.step];
			openModalWindow("繰り返しの編集", subtitle, values, this);
		}
	}, {
		key: "edited",
		value: function edited(values) {
			if (values != null) {
				this.setValue(values[0], values[1], values[2], values[3]);
			}
			flowchart.paint();
			flowchart.flowchart2code();
		}
	}, {
		key: "var",
		get: function get() {
			return this._var;
		}
	}, {
		key: "start",
		get: function get() {
			return this._start;
		}
	}, {
		key: "goal",
		get: function get() {
			return this._goal;
		}
	}, {
		key: "step",
		get: function get() {
			return this._step;
		}
	}, {
		key: "text2",
		get: function get() {
			return this.step + "ずつ増";
		}
	}], [{
		key: "appendMe",
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
		key: "hasText",
		get: function get() {
			return true;
		}
	}]);

	function Parts_LoopBeginDec() {
		_classCallCheck(this, Parts_LoopBeginDec);

		var _this68 = _possibleConstructorReturn(this, (Parts_LoopBeginDec.__proto__ || Object.getPrototypeOf(Parts_LoopBeginDec)).call(this));

		_this68.setValue("《変数》", "《値》", "《値》", "《値》");
		return _this68;
	}

	_createClass(Parts_LoopBeginDec, [{
		key: "setValue",
		value: function setValue(variable, start, goal, step) {
			this._var = variable;
			this._start = start;
			this._goal = goal;
			this._step = step;
			this._text = this.var + ':' + this.start + "→" + this.goal;
		}
	}, {
		key: "appendCode",
		value: function appendCode(code, indent) {
			code += Parts.makeIndent(indent);
			code += this.var + "を" + this.start + "から" + this.goal + "まで" + this.step + "ずつ減らしながら繰り返す：\n";
			var code_inner = this.next.appendCode('', indent + 1);
			if (code_inner == '') code += Parts.makeIndent(indent + 1) + "\n";else code += code_inner;

			if (this.end.next != null) return this.end.next.appendCode(code, indent);
			return code;
		}
	}, {
		key: "editMe",
		value: function editMe() {
			var subtitle = ["変数", "〜から", "〜まで", "減少分"];
			var values = [this.var, this.start, this.goal, this.step];
			openModalWindow("繰り返しの編集", subtitle, values, this);
		}
	}, {
		key: "edited",
		value: function edited(values) {
			if (values != null) {
				this.setValue(values[0], values[1], values[2], values[3]);
			}
			flowchart.paint();
			flowchart.flowchart2code();
		}
	}, {
		key: "var",
		get: function get() {
			return this._var;
		}
	}, {
		key: "start",
		get: function get() {
			return this._start;
		}
	}, {
		key: "goal",
		get: function get() {
			return this._goal;
		}
	}, {
		key: "step",
		get: function get() {
			return this._step;
		}
	}, {
		key: "text2",
		get: function get() {
			return this.step + "ずつ減";
		}
	}], [{
		key: "appendMe",
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

var Parts_LoopEnd = function (_Parts9) {
	_inherits(Parts_LoopEnd, _Parts9);

	function Parts_LoopEnd() {
		_classCallCheck(this, Parts_LoopEnd);

		return _possibleConstructorReturn(this, (Parts_LoopEnd.__proto__ || Object.getPrototypeOf(Parts_LoopEnd)).apply(this, arguments));
	}

	_createClass(Parts_LoopEnd, [{
		key: "editMe",
		value: function editMe() {
			this.begin.editMe();
		}
	}, {
		key: "calcTextsize",
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
		key: "calcSize",
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
		key: "paint",
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
		key: "appendCode",
		value: function appendCode(code, indent) {
			return code;
		}
	}, {
		key: "editMe",
		value: function editMe() {
			//		this.highlight();
			this.begin.editMe();
		}
	}, {
		key: "deleteMe",
		value: function deleteMe() {
			this.begin.deleteMe();
		}
	}, {
		key: "cutMe",
		value: function cutMe() {
			this.begin.cutMe();
		}
	}, {
		key: "highlight",
		value: function highlight() {
			this.paint_highlight();
			this.begin.paint_highlight();
		}
	}, {
		key: "unhighlight",
		value: function unhighlight() {
			this.paint_unhighlight();
			this.begin.paint_unhighlight();
		}
	}, {
		key: "hasText",
		get: function get() {
			return false;
		}
	}, {
		key: "begin",
		get: function get() {
			return this._begin;
		}
	}, {
		key: "isBlockEnd",
		get: function get() {
			return true;
		}
	}]);

	return Parts_LoopEnd;
}(Parts);

var misc_menu = [
//表示            識別子            プログラム上の表現            [引数の意味]
["《各種処理》", "none", "《各種処理》", []], ["描画領域開く", "gOpenWindow", "描画領域開く(	,	)", ["幅", "高さ"]], ["描画領域閉じる", "gCloseWindow", "描画領域閉じる()", []], ["描画領域全消去", "gClearWindow", "描画領域全消去()", []], ["線色設定", "gSetLineColor", "線色設定(	,	,	)", ["赤", "青", "緑"]], ["塗色設定", "gSetFillColor", "塗色設定(	,	,	)", ["赤", "青", "緑"]], ["線太さ設定", "gSetLineWidth", "線太さ設定(	)", ["太さ"]], ["文字サイズ設定", "gSetFontSize", "文字サイズ設定(	)", ["サイズ"]], ["文字描画", "gDrawText", "文字描画(	,	,	)", ["文字列", "x", "y"]], ["線描画", "gDrawLine", "線描画(	,	,	,	)", ["x1", "y1", "x2", "y2"]], ["矩形描画", "gDrawBox", "矩形描画(	,	,	,	)", ["x", "y", "幅", "高さ"]], ["矩形塗描画", "gFillBox", "矩形塗描画(	,	,	,	)", ["x", "y", "幅", "高さ"]], ["円描画", "gDrawCircle", "円描画(	,	,	)", ["x", "y", "半径"]], ["円塗描画", "gFillCircle", "円塗描画(	,	,	)", ["x", "y", "半径"]], ["待つ", "sleep", "	 ミリ秒待つ", ["ミリ秒数"]], ["変数を確認する", "dump", "変数を確認する", []]];

var Parts_Misc = function (_Parts10) {
	_inherits(Parts_Misc, _Parts10);

	function Parts_Misc() {
		_classCallCheck(this, Parts_Misc);

		var _this70 = _possibleConstructorReturn(this, (Parts_Misc.__proto__ || Object.getPrototypeOf(Parts_Misc)).call(this));

		_this70.setValue("none", []);
		return _this70;
	}

	_createClass(Parts_Misc, [{
		key: "setValue",
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
		key: "setValuebyText",
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
		key: "calcSize",
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
		key: "paint",
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
		key: "appendCode",
		value: function appendCode(code, indent) {
			code += Parts.makeIndent(indent);
			code += this.text + "\n";
			if (this.next != null) return this.next.appendCode(code, indent);
			return code;
		}
	}, {
		key: "editMe",
		value: function editMe() {
			openModalWindowforMisc(this);
		}
	}, {
		key: "edited",
		value: function edited(identifier, values) {
			if (values != null) {
				this.setValuebyText(identifier, values);
			}
			flowchart.paint();
			flowchart.flowchart2code();
		}
	}, {
		key: "identifier",
		get: function get() {
			return this._identifier;
		}
	}, {
		key: "values",
		get: function get() {
			return this._values;
		}
	}], [{
		key: "appendMe",
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
	var resultArea = document.getElementById("resultArea");
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
			if (!/\.pen$/i.exec(filelist[i].name)) continue;
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
					extract: { name: "extract 部分文字列（長さ指定）", callback: function callback(k, e) {
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
			misc: { name: "各種命令",
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
					gSetLineWidth: { name: "線太さ設定", callback: function callback(k, e) {
							insertCode("線太さ設定(《太さ》)");
						} },
					gSetFontSize: { name: "文字サイズ設定", callback: function callback(k, e) {
							insertCode("文字サイズ設定(《サイズ》)");
						} },
					gDrawText: { name: "文字描画", callback: function callback(k, e) {
							insertCode("文字描画(《文字列》,《x》,《y》)");
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
					sleep: { name: "待つ", callback: function callback(k, e) {
							insertCode("《ミリ秒数》 ミリ秒待つ");
						} },
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
};

function auto_marking(i) {
	setRunflag(true);
	document.getElementById('runButton').disabled = true;
	document.getElementById('stepButton').disabled = true;
	document.getElementById('resetButton').disabled = true;
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
	setRunflag(false);
}

function font_size(updown) {
	if (fontsize + updown < 12 || fontsize + updown > 30) return;
	fontsize += updown;
	var elem = document.getElementById('sourceTextarea');
	elem.style.fontSize = fontsize + 'px';
	elem.style.lineHeight = fontsize + 2 + 'px';
	elem = document.getElementById('resultTextarea');
	elem.style.fontSize = fontsize + 'px';
	elem.style.lineHeight = fontsize + 2 + 'px';
	elem = document.getElementsByClassName('bcr_number')[0];
	elem.style.fontSize = fontsize + 'px';
	elem.style.lineHeight = fontsize + 2 + 'px';
}
