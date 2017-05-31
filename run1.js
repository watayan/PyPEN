"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var varsInt = {},
    varsFloat = {},
    varsString = {},
    varsBoolean = {};
var run_flag = false;
var stack = [];
var textarea = null;

var Location = function () {
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

var RuntimeError = function () {
	function RuntimeError(line, message) {
		_classCallCheck(this, RuntimeError);

		this._line = line;
		this._message = message;
		run_flag = false;
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

var Value = function () {
	function Value(v, loc) {
		_classCallCheck(this, Value);

		this._value = v;
		this._loc = loc;
	}

	_createClass(Value, [{
		key: "getValue",
		value: function getValue() {
			return this;
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

var IntValue = function (_Value) {
	_inherits(IntValue, _Value);

	function IntValue(v, loc) {
		_classCallCheck(this, IntValue);

		var _this = _possibleConstructorReturn(this, (IntValue.__proto__ || Object.getPrototypeOf(IntValue)).call(this, v, loc));

		if (!isSafeInteger(v)) throw new RuntimeError(_this.first_line, "整数で表せない数です");
		return _this;
	}

	return IntValue;
}(Value);

var FloatValue = function (_Value2) {
	_inherits(FloatValue, _Value2);

	function FloatValue(v, loc) {
		_classCallCheck(this, FloatValue);

		var _this2 = _possibleConstructorReturn(this, (FloatValue.__proto__ || Object.getPrototypeOf(FloatValue)).call(this, v, loc));

		if (!isFinite(v)) throw new RuntimeError(_this2.first_line, "オーバーフローしました");
		return _this2;
	}

	return FloatValue;
}(Value);

var StringValue = function (_Value3) {
	_inherits(StringValue, _Value3);

	function StringValue() {
		_classCallCheck(this, StringValue);

		return _possibleConstructorReturn(this, (StringValue.__proto__ || Object.getPrototypeOf(StringValue)).apply(this, arguments));
	}

	return StringValue;
}(Value);

var BooleanValue = function (_Value4) {
	_inherits(BooleanValue, _Value4);

	function BooleanValue() {
		_classCallCheck(this, BooleanValue);

		return _possibleConstructorReturn(this, (BooleanValue.__proto__ || Object.getPrototypeOf(BooleanValue)).apply(this, arguments));
	}

	return BooleanValue;
}(Value);

var Add = function (_Value5) {
	_inherits(Add, _Value5);

	function Add(x, y, loc) {
		_classCallCheck(this, Add);

		return _possibleConstructorReturn(this, (Add.__proto__ || Object.getPrototypeOf(Add)).call(this, [x, y], loc));
	}

	_createClass(Add, [{
		key: "getValue",
		value: function getValue() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(first_line, "真偽型の足し算はできません");
			var v = v1.value + v2.value;
			if (v1 instanceof StringValue || v2 instanceof StringValue) return new StringValue(v, this.loc);
			if (v1 instanceof IntValue && v2 instanceof IntValue) {
				if (!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
				return new IntValue(v, this.loc);
			} else {
				if (!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
				return new FloatValue(v, this.loc);
			}
		}
	}]);

	return Add;
}(Value);

var Sub = function (_Value6) {
	_inherits(Sub, _Value6);

	function Sub(x, y, loc) {
		_classCallCheck(this, Sub);

		return _possibleConstructorReturn(this, (Sub.__proto__ || Object.getPrototypeOf(Sub)).call(this, [x, y], loc));
	}

	_createClass(Sub, [{
		key: "getValue",
		value: function getValue() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型の引き算はできません");
			var v = v1.value - v2.value;
			if (v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の引き算はできません");
			if (v1 instanceof IntValue && v2 instanceof IntValue) {
				if (!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
				return new IntValue(v, this.loc);
			} else {
				if (!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
				return new FloatValue(v, this.loc);
			}
		}
	}]);

	return Sub;
}(Value);

var Mul = function (_Value7) {
	_inherits(Mul, _Value7);

	function Mul(x, y, loc) {
		_classCallCheck(this, Mul);

		return _possibleConstructorReturn(this, (Mul.__proto__ || Object.getPrototypeOf(Mul)).call(this, [x, y], loc));
	}

	_createClass(Mul, [{
		key: "getValue",
		value: function getValue() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型のかけ算はできません");
			if (v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のかけ算はできません");
			var v = v1.value * v2.value;
			if (v1 instanceof IntValue && v2 instanceof IntValue) {
				if (!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
				return new IntValue(v, this.loc);
			} else {
				if (!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
				return new FloatValue(v, this.loc);
			}
		}
	}]);

	return Mul;
}(Value);

var Div = function (_Value8) {
	_inherits(Div, _Value8);

	function Div(x, y, loc) {
		_classCallCheck(this, Div);

		return _possibleConstructorReturn(this, (Div.__proto__ || Object.getPrototypeOf(Div)).call(this, [x, y], loc));
	}

	_createClass(Div, [{
		key: "getValue",
		value: function getValue() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型のわり算はできません");
			if (v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のわり算はできません");
			if (v2.value == 0) throw new RuntimeError(this.first_line, "0でわり算をしました");
			if (v1 instanceof IntValue && v2 instanceof IntValue) {
				var v = (v1.value - v1.value % v2.value) / v2.value;
				if (!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
				return new IntValue(v, this.loc);
			} else {
				var _v = v1.value / v2.value;
				if (!isFinite(_v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
				return new FloatValue(_v, this.loc);
			}
		}
	}]);

	return Div;
}(Value);

var Mod = function (_Value9) {
	_inherits(Mod, _Value9);

	function Mod(x, y, loc) {
		_classCallCheck(this, Mod);

		return _possibleConstructorReturn(this, (Mod.__proto__ || Object.getPrototypeOf(Mod)).call(this, [x, y], loc));
	}

	_createClass(Mod, [{
		key: "getValue",
		value: function getValue() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof IntValue && v2 instanceof IntValue) {
				if (v2.value == 0) throw new RuntimeError(this.first_line, "0でわり算をしました");
				var v = v1.value % v2.value;
				if (!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
				return new IntValue(v, this.loc);
			} else throw new RuntimeError(this.first_line, "余りを出す計算は整数でしかできません");
		}
	}]);

	return Mod;
}(Value);

var Minus = function (_Value10) {
	_inherits(Minus, _Value10);

	function Minus(x, loc) {
		_classCallCheck(this, Minus);

		return _possibleConstructorReturn(this, (Minus.__proto__ || Object.getPrototypeOf(Minus)).call(this, x, loc));
	}

	_createClass(Minus, [{
		key: "getValue",
		value: function getValue() {
			var v1 = this.value.getValue();
			if (v1 instanceof IntValue || v1 instanceof FloatValue) {
				var v = -v1.value;
				if (v instanceof IntValue && !isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
				if (v instanceof FloatValue && !isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
				return v1 instanceof IntValue ? new IntValue(v, this.loc) : new FloatValue(v, this.loc);
			} else throw new RuntimeError(this.first_line, "マイナスは数値にしかつけられません");
		}
	}]);

	return Minus;
}(Value);

var And = function (_Value11) {
	_inherits(And, _Value11);

	function And(x, y, loc) {
		_classCallCheck(this, And);

		return _possibleConstructorReturn(this, (And.__proto__ || Object.getPrototypeOf(And)).call(this, [x, y], loc));
	}

	_createClass(And, [{
		key: "getValue",
		value: function getValue() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof BooleanValue && v2 instanceof BooleanValue) return new BooleanValue(v1.value && v2.value, this.loc);else throw new RuntimeError(this.first_line, "「かつ」は真偽値にしか使えません");
		}
	}]);

	return And;
}(Value);

var Or = function (_Value12) {
	_inherits(Or, _Value12);

	function Or(x, y, loc) {
		_classCallCheck(this, Or);

		return _possibleConstructorReturn(this, (Or.__proto__ || Object.getPrototypeOf(Or)).call(this, [x, y], loc));
	}

	_createClass(Or, [{
		key: "getValue",
		value: function getValue() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			if (v1 instanceof BooleanValue && v2 instanceof BooleanValue) return new BooleanValue(v1.value || v2.value, this.loc);else throw new RuntimeError(this.first_line, "「または」は真偽値にしか使えません");
		}
	}]);

	return Or;
}(Value);

var Not = function (_Value13) {
	_inherits(Not, _Value13);

	function Not(x, loc) {
		_classCallCheck(this, Not);

		return _possibleConstructorReturn(this, (Not.__proto__ || Object.getPrototypeOf(Not)).call(this, x, loc));
	}

	_createClass(Not, [{
		key: "getValue",
		value: function getValue() {
			var v1 = this.value.getValue();
			if (v1 instanceof BooleanValue) return new BooleanValue(!v1.value, this.loc);else throw new RuntimeError(this.first_line, "「でない」は真偽値にしか使えません");
		}
	}]);

	return Not;
}(Value);

var EQ = function (_Value14) {
	_inherits(EQ, _Value14);

	function EQ(x, y, loc) {
		_classCallCheck(this, EQ);

		return _possibleConstructorReturn(this, (EQ.__proto__ || Object.getPrototypeOf(EQ)).call(this, [x, y], loc));
	}

	_createClass(EQ, [{
		key: "getValue",
		value: function getValue() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			return new BooleanValue(v1.value == v2.value, this.loc);
		}
	}]);

	return EQ;
}(Value);

var NE = function (_Value15) {
	_inherits(NE, _Value15);

	function NE(x, y, loc) {
		_classCallCheck(this, NE);

		return _possibleConstructorReturn(this, (NE.__proto__ || Object.getPrototypeOf(NE)).call(this, [x, y], loc));
	}

	_createClass(NE, [{
		key: "getValue",
		value: function getValue() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			return new BooleanValue(v1.value != v2.value, this.loc);
		}
	}]);

	return NE;
}(Value);

var GT = function (_Value16) {
	_inherits(GT, _Value16);

	function GT(x, y, loc) {
		_classCallCheck(this, GT);

		return _possibleConstructorReturn(this, (GT.__proto__ || Object.getPrototypeOf(GT)).call(this, [x, y], loc));
	}

	_createClass(GT, [{
		key: "getValue",
		value: function getValue() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			return new BooleanValue(v1.value > v2.value, this.loc);
		}
	}]);

	return GT;
}(Value);

var GE = function (_Value17) {
	_inherits(GE, _Value17);

	function GE(x, y, loc) {
		_classCallCheck(this, GE);

		return _possibleConstructorReturn(this, (GE.__proto__ || Object.getPrototypeOf(GE)).call(this, [x, y], loc));
	}

	_createClass(GE, [{
		key: "getValue",
		value: function getValue() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			return new BooleanValue(v1.value >= v2.value, this.loc);
		}
	}]);

	return GE;
}(Value);

var LT = function (_Value18) {
	_inherits(LT, _Value18);

	function LT(x, y, loc) {
		_classCallCheck(this, LT);

		return _possibleConstructorReturn(this, (LT.__proto__ || Object.getPrototypeOf(LT)).call(this, [x, y], loc));
	}

	_createClass(LT, [{
		key: "getValue",
		value: function getValue() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			return new BooleanValue(v1.value < v2.value, this.loc);
		}
	}]);

	return LT;
}(Value);

var LE = function (_Value19) {
	_inherits(LE, _Value19);

	function LE(x, y, loc) {
		_classCallCheck(this, LE);

		return _possibleConstructorReturn(this, (LE.__proto__ || Object.getPrototypeOf(LE)).call(this, [x, y], loc));
	}

	_createClass(LE, [{
		key: "getValue",
		value: function getValue() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			return new BooleanValue(v1.value <= v2.value, this.loc);
		}
	}]);

	return LE;
}(Value);

var Variable = function (_Value20) {
	_inherits(Variable, _Value20);

	function Variable(x, y, loc) {
		_classCallCheck(this, Variable);

		return _possibleConstructorReturn(this, (Variable.__proto__ || Object.getPrototypeOf(Variable)).call(this, [x, y], loc));
	}

	_createClass(Variable, [{
		key: "getValue",
		value: function getValue() {
			var vn = this.varname;
			if (varsInt[vn] != undefined) return new IntValue(varsInt[vn], this.loc);else if (varsFloat[vn] != undefined) return new FloatValue(varsFloat[vn], this.loc);else if (varsString[vn] != undefined) return new StringValue(varsString[n], this.loc);else if (varsBoolean[vn] != undefined) return new BooleanValue(varsBoolean[vn], this.loc);else throw new RuntimeError(this.first_line, vn + "は宣言されていません");
		}
	}, {
		key: "varname",
		get: function get() {
			var vn = this.value[0];
			var pm = this.value[1];
			if (pm != null) {
				var ag = new Array(pm.length);
				for (var i = 0; i < pm.length; i++) {
					var v = pm[i].getValue();
					if (v instanceof IntValue) ag[i] = v.value;else if (v instanceof FloatValue) ag[i] = Math.round(v.value);else throw new RuntimeError(this.first_line, "配列の添字に" + v.value + "は使えません");
				}
				vn += '[' + ag.join(',') + ']';
			}
			return vn;
		}
	}]);

	return Variable;
}(Value);

var CallFunction = function (_Value21) {
	_inherits(CallFunction, _Value21);

	function CallFunction(funcname, parameter, loc) {
		_classCallCheck(this, CallFunction);

		return _possibleConstructorReturn(this, (CallFunction.__proto__ || Object.getPrototypeOf(CallFunction)).call(this, { funcname: funcname, parameter: parameter }, loc));
	}

	_createClass(CallFunction, [{
		key: "getValue",
		value: function getValue() {
			var func = this.value.funcname,
			    param = this.value.parameter;
			if (func == 'abs') {
				if (param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
				var par1 = param[0].getValue();
				if (par1 instanceof IntValue) return new IntValue(Math.abs(par1.value), this.loc);else if (par1 instanceof FloatValue) return new FloatValue(Math.abs(par1.value), this.loc);else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
			}
			if (func == 'random') {
				if (param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
				var par1 = param[0].getValue();
				if (par1 instanceof IntValue) return new IntValue(Math.floor(Math.random() * Math.floor(par1.value + 1)), this.loc);else throw new RuntimeError(this.first_line, func + "は整数にしか使えません");
			}
			if (func == 'ceil') {
				if (param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
				var par1 = param[0].getValue();
				if (par1 instanceof IntValue) return par1;else if (par1 instanceof FloatValue) return new IntValue(Math.ceil(par1.value), this.loc);else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
			}
			if (func == 'floor') {
				if (param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
				var par1 = param[0].getValue();
				if (par1 instanceof IntValue) return par1;else if (par1 instanceof FloatValue) return new IntValue(Math.floor(par1.value), this.loc);else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
			}
			if (func == 'round') {
				if (param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
				var par1 = param[0].getValue();
				if (par1 instanceof IntValue) return par1;else if (par1 instanceof FloatValue) return new IntValue(Math.round(par1.value), this.loc);else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
			}
			if (func == 'int') {
				if (param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
				var par1 = param[0].getValue();
				if (par1 instanceof IntValue) return par1;else if (par1 instanceof FloatValue) return new IntValue(par1.value < 0 ? Math.ceil(par1.value) : Math.floor(par1.value), this.loc);else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
			}
			if (func == 'sin') {
				if (param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
				var par1 = param[0].getValue();
				if (par1 instanceof IntValue || par1 instanceof FloatValue) return new FloatValue(Math.sin(par1.value), this.loc);else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
			}
			if (func == 'cos') {
				if (param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
				var par1 = param[0].getValue();
				if (par1 instanceof IntValue || par1 instanceof FloatValue) return new FloatValue(Math.cos(par1.value), this.loc);else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
			}
			if (func == 'tan') {
				if (param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
				var par1 = param[0].getValue();
				if (par1 instanceof IntValue || par1 instanceof FloatValue) {
					var v = Math.tan(par1.value);
					if (isFinite(v)) return new FloatValue(Math.tan(par1.value), this.loc);else throw new RuntimeError(this.first_line, "オーバーフローしました");
				} else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
			}
			if (func == 'sqrt') {
				if (param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
				var par1 = param[0].getValue();
				if (par1 instanceof IntValue || par1 instanceof FloatValue) {
					if (par1.value < 0) throw new RuntimeError(this.first_line, "負の数のルートを求めようとしました");
					return new FloatValue(Math.sqrt(par1.value), this.loc);
				} else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
			}
			if (func == 'log') {
				if (param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
				var par1 = param[0].getValue();
				if (par1 instanceof IntValue || par1 instanceof FloatValue) {
					if (par1.value <= 0) throw new RuntimeError(this.first_line, "正でない数の対数を求めようとしました");
					var _v2 = Math.log(par1.value);
					if (isFinite(_v2)) return new FloatValue(_v2, this.loc);
					throw new RuntimeError(this.first_line, "オーバーフローしました");
				} else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
			}
			if (func == 'exp') {
				if (param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
				var par1 = param[0].getValue();
				if (par1 instanceof IntValue || par1 instanceof FloatValue) {
					var _v3 = Math.exp(par1.value);
					if (isFinite(_v3)) return new FloatValue(_v3, this.loc);
					throw new RuntimeError(this.first_line, "オーバーフローしました");
				} else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
			}
			if (func == 'pow') {
				if (param.length != 2) throw new RuntimeError(this.first_line, func + "の引数は2つです");
				var par1 = param[0].getValue();
				var par2 = param[1].getValue();
				if (par1 instanceof IntValue && par2 instanceof IntValue && par2.value >= 0) {
					if (par1.value == 0 && par2.value <= 0) throw new RuntimeError(this.first_line, "0は正の数乗しかできません");
					var _v4 = Math.pow(par1.value, par2.value);
					if (isSafeInteger(_v4)) return new IntValue(_v4, this.loc);else throw new RuntimeError(this.first_line, "オーバーフローしました");
				}
				if ((par1 instanceof IntValue || par1 instanceof FloatValue) && (par2 instanceof IntValue || par2 instanceof FloatValue)) {
					if (par1.value < 0 && !Number.isInteger(par2.value)) throw new RuntimeError(this.first_line, "負の数の非整数乗はできません");
					if (par1.value == 0 && par2.value <= 0) throw new RuntimeError(this.first_line, "0は正の数乗しかできません");
					var _v5 = Math.pow(par1.value, par2.value);
					if (isFinite(_v5)) return new FloatValue(_v5, this.loc);else throw new RuntimeError(this.first_line, "オーバーフローしました");
				}
			} else throw new RuntimeError(this.first_line, func + "という関数はありません");
		}
	}]);

	return CallFunction;
}(Value);

var Append = function (_Value22) {
	_inherits(Append, _Value22);

	function Append(x, y, loc) {
		_classCallCheck(this, Append);

		return _possibleConstructorReturn(this, (Append.__proto__ || Object.getPrototypeOf(Append)).call(this, [x, y], loc));
	}

	_createClass(Append, [{
		key: "getValue",
		value: function getValue() {
			var v1 = this.value[0].getValue(),
			    v2 = this.value[1].getValue();
			var v = String(v1.value) + String(v2.value);
			return new StringValue(v, this.loc);
		}
	}]);

	return Append;
}(Value);

var Statement = function () {
	function Statement(loc) {
		_classCallCheck(this, Statement);

		this._loc = loc;
	}

	_createClass(Statement, [{
		key: "run",
		value: function run(index) {}
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

var DefinitionInt = function (_Statement) {
	_inherits(DefinitionInt, _Statement);

	function DefinitionInt(x, loc) {
		_classCallCheck(this, DefinitionInt);

		var _this23 = _possibleConstructorReturn(this, (DefinitionInt.__proto__ || Object.getPrototypeOf(DefinitionInt)).call(this, loc));

		_this23.vars = x;
		return _this23;
	}

	_createClass(DefinitionInt, [{
		key: "run",
		value: function run(index) {
			for (var i = 0; i < this.vars.length; i++) {
				var varname = this.vars[i].varname;
				var parameter = this.vars[i].parameter;
				if (varsInt[varname] != undefined || varsFloat[varname] != undefined || varsString[varname] != undefined || varsBoolean[varname] != undefined) throw new RuntimeError(this.first_line, varname + "の宣言が重複しています");
				if (!parameter) {
					varsInt[varname] = 0;
				} else {
					var parameterlist = [];
					for (var j = 0; j < parameter.length; j++) {
						var v = parameter[j].getValue();
						if (v instanceof IntValue && v.value >= 0) parameterlist.push(v.value);else if (v instanceof FloatValue && v.value >= 0) parameterlist.push(Math.round(v.value));else throw new RuntimeError(this.first_line, "配列の番号に" + v.value + "は使えません");
					}
					var args = new Array(parameter.length);
					for (var j = 0; j < parameter.length; j++) {
						args[j] = 0;
					}while (args) {
						varsInt[varname + '[' + args.join(',') + ']'] = 0;
						var k = 0;
						do {
							if (k < args.length) {
								args[k]++;
								if (args[k] > parameterlist[k]) args[k++] = 0;else k = -1;
							} else {
								k = -1;
								args = undefined;
							}
						} while (k >= 0);
					}
				}
			}
			return index + 1;
		}
	}]);

	return DefinitionInt;
}(Statement);

var DefinitionFloat = function (_Statement2) {
	_inherits(DefinitionFloat, _Statement2);

	function DefinitionFloat(x, loc) {
		_classCallCheck(this, DefinitionFloat);

		var _this24 = _possibleConstructorReturn(this, (DefinitionFloat.__proto__ || Object.getPrototypeOf(DefinitionFloat)).call(this, loc));

		_this24.vars = x;
		return _this24;
	}

	_createClass(DefinitionFloat, [{
		key: "run",
		value: function run(index) {
			for (var i = 0; i < this.vars.length; i++) {
				var varname = this.vars[i].varname;
				var parameter = this.vars[i].parameter;
				if (varsInt[varname] != undefined || varsFloat[varname] != undefined || varsString[varname] != undefined || varsBoolean[varname] != undefined) throw new RuntimeError(this.first_line, varname + "の宣言が重複しています");
				if (!parameter) {
					varsFloat[varname] = 0.0;
				} else {
					var parameterlist = [];
					for (var j = 0; j < parameter.length; j++) {
						var v = parameter[j].getValue();
						if (v instanceof IntValue && v.value >= 0) parameterlist.push(v.value);else if (v instanceof FloatValue && v.value >= 0) parameterlist.push(Math.round(v.value));else throw new RuntimeError(this.first_line, "配列の番号に" + v.value + "は使えません");
					}
					var args = new Array(parameter.length);
					for (var j = 0; j < parameter.length; j++) {
						args[j] = 0;
					}while (args) {
						varsFloat[varname + '[' + args.join(',') + ']'] = 0;
						var k = 0;
						do {
							if (k < args.length) {
								args[k]++;
								if (args[k] > parameterlist[k]) args[k++] = 0;else k = -1;
							} else {
								k = -1;
								args = undefined;
							}
						} while (k >= 0);
					}
				}
			}
			return index + 1;
		}
	}]);

	return DefinitionFloat;
}(Statement);

var DefinitionString = function (_Statement3) {
	_inherits(DefinitionString, _Statement3);

	function DefinitionString(x, loc) {
		_classCallCheck(this, DefinitionString);

		var _this25 = _possibleConstructorReturn(this, (DefinitionString.__proto__ || Object.getPrototypeOf(DefinitionString)).call(this, loc));

		_this25.vars = x;
		return _this25;
	}

	_createClass(DefinitionString, [{
		key: "run",
		value: function run(index) {
			for (var i = 0; i < this.vars.length; i++) {
				var varname = this.vars[i].varname;
				var parameter = this.vars[i].parameter;
				if (varsInt[varname] != undefined || varsFloat[varname] != undefined || varsString[varname] != undefined || varsBoolean[varname] != undefined) throw new RuntimeError(this.first_line, varname + "の宣言が重複しています");
				if (!parameter) {
					varsString[varname] = '';
				} else {
					var parameterlist = [];
					for (var j = 0; j < parameter.length; j++) {
						var v = parameter[j].getValue();
						if (v instanceof IntValue && v.value >= 0) parameterlist.push(v.value);else if (v instanceof FloatValue && v.value >= 0) parameterlist.push(Math.round(v.value));else throw new RuntimeError(this.first_line, "配列の番号に" + v.value + "は使えません");
					}
					var args = new Array(parameter.length);
					for (var j = 0; j < parameter.length; j++) {
						args[j] = 0;
					}while (args) {
						varsString[varname + '[' + args.join(',') + ']'] = '';
						var k = 0;
						do {
							if (k < args.length) {
								args[k]++;
								if (args[k] > parameterlist[k]) args[k++] = 0;else k = -1;
							} else {
								k = -1;
								args = undefined;
							}
						} while (k >= 0);
					}
				}
			}
			return index + 1;
		}
	}]);

	return DefinitionString;
}(Statement);

var DefinitionBoolean = function (_Statement4) {
	_inherits(DefinitionBoolean, _Statement4);

	function DefinitionBoolean(x, loc) {
		_classCallCheck(this, DefinitionBoolean);

		var _this26 = _possibleConstructorReturn(this, (DefinitionBoolean.__proto__ || Object.getPrototypeOf(DefinitionBoolean)).call(this, loc));

		_this26.vars = x;
		return _this26;
	}

	_createClass(DefinitionBoolean, [{
		key: "run",
		value: function run(index) {
			for (var i = 0; i < this.vars.length; i++) {
				var varname = this.vars[i].varname;
				var parameter = this.vars[i].parameter;
				if (varsInt[varname] != undefined || varsFloat[varname] != undefined || varsString[varname] != undefined || varsBoolean[varname] != undefined) throw new RuntimeError(this.first_line, varname + "の宣言が重複しています");
				if (!parameter) {
					varsBoolean[varname] = false;
				} else {
					var parameterlist = [];
					for (var j = 0; j < parameter.length; j++) {
						var v = parameter[j].getValue();
						if (v instanceof IntValue && v.value >= 0) parameterlist.push(v.value);else if (v instanceof FloatValue && v.value >= 0) parameterlist.push(Math.round(v.value));else throw new RuntimeError(this.first_line, "配列の番号に" + v.value + "は使えません");
					}
					var args = new Array(parameter.length);
					for (var j = 0; j < parameter.length; j++) {
						args[j] = 0;
					}while (args) {
						varsBoolean[varname + '[' + args.join(',') + ']'] = false;
						var k = 0;
						do {
							if (k < args.length) {
								args[k]++;
								if (args[k] > parameterlist[k]) args[k++] = 0;else k = -1;
							} else {
								k = -1;
								args = undefined;
							}
						} while (k >= 0);
					}
				}
			}
			return index + 1;
		}
	}]);

	return DefinitionBoolean;
}(Statement);

var Assign = function (_Statement5) {
	_inherits(Assign, _Statement5);

	function Assign(varname, val, loc) {
		_classCallCheck(this, Assign);

		var _this27 = _possibleConstructorReturn(this, (Assign.__proto__ || Object.getPrototypeOf(Assign)).call(this, loc));

		_this27.varname = varname;
		_this27.val = val;
		return _this27;
	}

	_createClass(Assign, [{
		key: "run",
		value: function run(index) {
			var vn = this.varname.varname;
			var vl = this.val.getValue();
			if (varsInt[vn] != undefined) {
				if (vl instanceof IntValue) varsInt[vn] = vl.value;else if (vl instanceof FloatValue) varsInt[vn] = Math.round(vl.value);else throw new RuntimeError(this.first_line, vn + "に数値以外の値を代入しようとしました");
				if (!isSafeInteger(varsInt[vn])) throw new RuntimeError(this.first_line, "オーバーフローしました");
			} else if (varsFloat[vn] != undefined) {
				if (vl instanceof IntValue || vl instanceof FloatValue) varsFloat[vn] = vl.value;else throw new RuntimeError(this.first_line, vn + "に数値以外の値を代入しようとしました");
				if (!isFinite(varsFloat[vn])) throw new RuntimeError(this.first_line, "オーバーフローしました");
			} else if (varsString[vn] != undefined) {
				if (vl instanceof StringValue) varsString[vn] = vl.value;else throw new RuntimeError(this.first_line, vn + "に文字列以外の値を代入しようとしました");
			} else if (varsBoolean[vn] != undefined) {
				if (vl instanceof BooleanValue) varsBoolean[vn] = vl.value;else throw new RuntimeError(this.first_line, vn + "に真偽以外の値を代入しようとしました");
			} else throw new RuntimeError(this.first_line, vn + "は宣言されていません");
			return index + 1;
		}
	}]);

	return Assign;
}(Statement);

var Input = function (_Statement6) {
	_inherits(Input, _Statement6);

	function Input(x, loc) {
		_classCallCheck(this, Input);

		var _this28 = _possibleConstructorReturn(this, (Input.__proto__ || Object.getPrototypeOf(Input)).call(this, loc));

		_this28.varname = x;
		return _this28;
	}

	_createClass(Input, [{
		key: "run",
		value: function run(index) {
			var varname = this.varname.varname;
			var value = void 0;
			value = prompt("入力してください");
			if (varsInt[varname] != undefined) varsInt[varname] = parseInt(value);else if (varsFloat[varname] != undefined) varsFloat[varname] = parseFloat(value);else if (varsString[varname] != undefined) varsString[varname] = value;else if (varsBoolean[varname] != undefined) varsBoolean[varname] = value == "true";else throw new RuntimeError(this.first_line, varname + "が宣言されていません");
			return index + 1;
		}
	}]);

	return Input;
}(Statement);

var Output = function (_Statement7) {
	_inherits(Output, _Statement7);

	function Output(x, ln, loc) {
		_classCallCheck(this, Output);

		var _this29 = _possibleConstructorReturn(this, (Output.__proto__ || Object.getPrototypeOf(Output)).call(this, loc));

		_this29.value = x;
		_this29.ln = ln;
		return _this29;
	}

	_createClass(Output, [{
		key: "run",
		value: function run(index) {
			textarea.value += this.value.getValue().value + (this.ln ? "\n" : "");
			return index + 1;
		}
	}]);

	return Output;
}(Statement);

var If = function (_Statement8) {
	_inherits(If, _Statement8);

	function If(condition, state1, state2, loc) {
		_classCallCheck(this, If);

		var _this30 = _possibleConstructorReturn(this, (If.__proto__ || Object.getPrototypeOf(If)).call(this, loc));

		_this30.condition = condition;
		_this30.state1 = state1;
		_this30.state2 = state2;
		return _this30;
	}

	_createClass(If, [{
		key: "run",
		value: function run(index) {
			if (this.condition.getValue() instanceof BooleanValue) {
				if (this.condition.getValue().value) stack.push({ statementlist: this.state1, index: 0 });else if (this.state2 != null) stack.push({ statementlist: this.state2, index: 0 });
			} else throw new RuntimeError(this.first_line, "もし〜の構文で条件式が使われていません");
			return index + 1;
		}
	}]);

	return If;
}(Statement);

var LoopBegin = function (_Statement9) {
	_inherits(LoopBegin, _Statement9);

	function LoopBegin(condition, continuous, loc) {
		_classCallCheck(this, LoopBegin);

		var _this31 = _possibleConstructorReturn(this, (LoopBegin.__proto__ || Object.getPrototypeOf(LoopBegin)).call(this, loc));

		_this31.condition = condition;
		_this31.continuous = continuous;
		return _this31;
	}

	_createClass(LoopBegin, [{
		key: "run",
		value: function run(index) {
			if (this.condition == null || this.condition.getValue().value == this.continuous) return index + 1;else return -1;
		}
	}]);

	return LoopBegin;
}(Statement);

var LoopEnd = function (_Statement10) {
	_inherits(LoopEnd, _Statement10);

	function LoopEnd(condition, continuous, loc) {
		_classCallCheck(this, LoopEnd);

		var _this32 = _possibleConstructorReturn(this, (LoopEnd.__proto__ || Object.getPrototypeOf(LoopEnd)).call(this, loc));

		_this32.condition = condition;
		_this32.continuous = continuous;
		return _this32;
	}

	_createClass(LoopEnd, [{
		key: "run",
		value: function run(index) {
			if (this.condition == null || this.condition.getValue().value == this.continuous) return 0;else return -1;
		}
	}]);

	return LoopEnd;
}(Statement);

var ForInc = function (_Statement11) {
	_inherits(ForInc, _Statement11);

	function ForInc(varname, begin, end, step, state, loc) {
		_classCallCheck(this, ForInc);

		var _this33 = _possibleConstructorReturn(this, (ForInc.__proto__ || Object.getPrototypeOf(ForInc)).call(this, loc));

		_this33.varname = varname;
		_this33.begin = begin;
		_this33.end = end;
		_this33.step = step;
		_this33.state = state;
		return _this33;
	}

	_createClass(ForInc, [{
		key: "run",
		value: function run(index) {
			var last_token = { first_line: this.last_line, last_line: this.last_line };
			var last_loc = new Location(last_token, last_token);
			if (varsInt[this.varname.varname] != undefined || varsFloat[this.varname.varname] != undefined) {
				var assign = new Assign(this.varname, this.begin.getValue(), this.loc);
				assign.run(0);
				var loop = [new LoopBegin(new LE(new Variable(this.varname.varname, null, this.loc), this.end, this.loc), true, this.loc)];
				for (var i = 0; i < this.state.length; i++) {
					loop.push(this.state[i]);
				}loop.push(new Assign(this.varname, new Add(new Variable(this.varname.varname, null, this.loc), this.step, last_loc), last_loc));
				loop.push(new LoopEnd(null, true, last_loc));
				stack.push({ statementlist: loop, index: 0 });
			} else throw new RuntimeError(this.first_line, this.varname + "は数値型の変数ではありません");
			return index + 1;
		}
	}]);

	return ForInc;
}(Statement);

var ForDec = function (_Statement12) {
	_inherits(ForDec, _Statement12);

	function ForDec(varname, begin, end, step, state, loc) {
		_classCallCheck(this, ForDec);

		var _this34 = _possibleConstructorReturn(this, (ForDec.__proto__ || Object.getPrototypeOf(ForDec)).call(this, loc));

		_this34.varname = varname;
		_this34.begin = begin;
		_this34.end = end;
		_this34.step = step;
		_this34.state = state;
		return _this34;
	}

	_createClass(ForDec, [{
		key: "run",
		value: function run(index) {
			var last_token = { first_line: this.last_line, last_line: this.last_line };
			var last_loc = new Location(last_token, last_token);
			if (varsInt[this.varname.varname] != undefined || varsFloat[this.varname.varname] != undefined) {
				var assign = new Assign(this.varname, this.begin.getValue(), this.loc);
				assign.run(0);
				var loop = [new LoopBegin(new GE(new Variable(this.varname.varname, null, this.loc), this.end, this.loc), true, this.loc)];
				for (var i = 0; i < this.state.length; i++) {
					loop.push(this.state[i]);
				}loop.push(new Assign(this.varname, new Sub(new Variable(this.varname.varname, null, this.loc), this.step, last_loc), last_loc));
				loop.push(new LoopEnd(null, true, last_loc));
				stack.push({ statementlist: loop, index: 0 });
			} else throw new RuntimeError(this.first_line, this.varname + "は数値型の変数ではありません");
			return index + 1;
		}
	}]);

	return ForDec;
}(Statement);

var Until = function (_Statement13) {
	_inherits(Until, _Statement13);

	function Until(state, condition, loc) {
		_classCallCheck(this, Until);

		var _this35 = _possibleConstructorReturn(this, (Until.__proto__ || Object.getPrototypeOf(Until)).call(this, loc));

		_this35.condition = condition;
		_this35.state = state;
		return _this35;
	}

	_createClass(Until, [{
		key: "run",
		value: function run(index) {
			var last_token = { first_line: this.last_line, last_line: this.last_line };
			var loop = [new LoopBegin(null, true, this.loc)];
			for (var i = 0; i < this.state.length; i++) {
				loop.push(this.state[i]);
			}loop.push(new LoopEnd(this.condition, false, new Location(last_token, last_token)));
			stack.push({ statementlist: loop, index: 0 });
			return index + 1;
		}
	}]);

	return Until;
}(Statement);

var While = function (_Statement14) {
	_inherits(While, _Statement14);

	function While(condition, state, loc) {
		_classCallCheck(this, While);

		var _this36 = _possibleConstructorReturn(this, (While.__proto__ || Object.getPrototypeOf(While)).call(this, loc));

		_this36.condition = condition;
		_this36.state = state;
		return _this36;
	}

	_createClass(While, [{
		key: "run",
		value: function run(index) {
			var last_token = { first_line: this.last_line, last_line: this.last_line };
			var loop = [new LoopBegin(this.condition, true, this.loc)];
			for (var i = 0; i < this.state.length; i++) {
				loop.push(this.state[i]);
			}loop.push(new LoopEnd(null, false, new Location(last_token, last_token)));
			stack.push({ statementlist: loop, index: 0 });
			return index + 1;
		}
	}]);

	return While;
}(Statement);

function reset(resultTextArea) {
	varsInt = {}, varsFloat = {}, varsString = {}, varsBoolean = {};
	textarea = resultTextArea;
	textarea.value = '';
	run_flag = false;
	stack = [];
	$(".codelines").children().removeClass("lineselect");
}

function run(parse, step_flag) {
	if (!run_flag) {
		reset(textarea);
		stack.push({ statementlist: parse, index: 0 });
		run_flag = true;
		//		getElementById("sourceTextarea").readOnly = true;
	}
	if (step_flag) {
		step();
		if (stack.length == 0) {
			textarea.value += "---\n";
			run_flag = false;
		}
	} else {
		do {
			step();
		} while (stack.length > 0);
		textarea.value += "---\n";
		run_flag = false;
	}
	//	_run(parse);

	function step() {
		var depth = stack.length - 1;
		var index = stack[depth].index;
		var line = -1;
		var statement = stack[depth].statementlist[index];
		//		if(!stack[depth].statementlist[index]) return;
		if (statement) {
			line = statement.first_line;
			index = statement.run(index);
		} else index++;
		if (index < 0) index = stack[depth].statementlist.length;

		$(".codelines").children().removeClass("lineselect");
		$(".codelines :nth-child(" + line + ")").addClass("lineselect");
		stack[depth].index = index;
		if (index > stack[depth].statementlist.length) stack.pop();
	}
}

function isFinite(v) {
	return !isNaN(v) && v != Number.POSITIVE_INFINITY && v != Number.NEGATIVE_INFINITY;
	// return Number.isFinite(v);
}

function isSafeInteger(v) {
	return !isNaN(v) && v <= 9007199254740991 && v >= -9007199254740991;
	// return Number.isSafeInteger(v);
}
