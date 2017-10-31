"use strict";
// programmed by watayan <watayan@watayan.net>
// edit run.js, and transpile with Babel to make run1.js

var varsInt = {}, varsFloat = {}, varsString = {}, varsBoolean = {};
var stack = [];
var run_flag = false, step_flag = false;
var parse = null;
var flowchart = null;
var textarea = null;
var context = null;
var current_line = -1;
var wait_time = 0;
var flowchart_display = false;

function isFinite(v)
{
	return !isNaN(v) && v != Number.POSITIVE_INFINITY && v != Number.NEGATIVE_INFINITY;
	// return Number.isFinite(v);
}

function isSafeInteger(v)
{
	return !isNaN(v) && v == Math.round(v) && v <= 9007199254740991 && v >= -9007199254740991;
	// return Number.isSafeInteger(v);
}

function textareaAppend(v)
{
	textarea.value += v;
	textarea.scrollTop = textarea.scrollHeight;
}

class Location
{
	constructor(first_token, last_token)
	{
		this._first_line = first_token.first_line;
		this._last_line = last_token.last_line;
	}
	get first_line(){return this._first_line;}
	get last_line() {return this._last_line;}
}

class RuntimeError
{
	constructor(line, message)
	{
		this._line = line;
		this._message = message;
		setRunflag(false);
	}
	get line() {return this._line;}
	get message() {return this._message;}
}

class Value
{
	constructor(v, loc)
	{
		this._value = v;
		this._loc = loc;
	}
	get value() {return this._value;}
	get loc() {return this._loc;}
	get first_line() {return this._loc.first_line;}
	getValue()
	{
		return this;
	}
}

class NullValue extends Value
{
	constructor(loc)
	{
		super(0, loc);
	}
}

class ArrayValue extends Value
{
	constructor(v, loc)
	{
		super(v, loc);
	}
}

class IntValue extends Value
{
	constructor(v, loc)
	{
		 super(v, loc);
		 if(!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表せない値です");
	}
}
class FloatValue extends Value
{
	constructor(v, loc)
	{
		super(v, loc);
		if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
	}
}
class StringValue extends Value {}
class BooleanValue extends Value {}

class UNDEFINED extends Value
{
	constructor(v, loc)
	{
		super(v, loc);
	}
	get varname()
	{
		throw new RuntimeError(this.first_line, "未完成のプログラムです");
	}
	getValue()
	{
		throw new RuntimeError(this.first_line, "未完成のプログラムです");
	}
}

class Add extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
	}
	getValue()
	{
		let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
		if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の足し算はできません");
		if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型の足し算はできません");
		if(v1 instanceof StringValue || v2 instanceof StringValue)
		{
			if(v1 instanceof NullValue) return v2;
			else if(v2 instanceof NullValue) return v1;
			else return new StringValue(v1.value + v2.value, this.loc);
		}
		let v = v1.value + v2.value;
		if(v1 instanceof FloatValue || v2 instanceof FloatValue)
		{
			if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
			return new FloatValue(v, this.loc);
		}
		else
		{
			if(!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
			return new IntValue(v, this.loc);
		}
	}
}

class Sub extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
	}
	getValue()
	{
		let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
		if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の引き算はできません");
		if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型の引き算はできません");
		if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の引き算はできません");
		let v = v1.value - v2.value;
		if(v1 instanceof FloatValue || v2 instanceof FloatValue)
		{
			if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
			return new FloatValue(v, this.loc);
		}
		else
		{
			if(!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
			return new IntValue(v, this.loc);
		}
	}
}

class Mul extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
	}
	getValue()
	{
		let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
		if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のかけ算はできません");
		if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型のかけ算はできません");
		if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のかけ算はできません");
		let v = v1.value * v2.value;
		if(v1 instanceof FloatValue || v2 instanceof FloatValue)
		{
			if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
			return new FloatValue(v, this.loc);
		}
		else
		{
			if(!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
			return new IntValue(v, this.loc);
		}
	}
}

class Div extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
	}
	getValue()
	{
		let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
		if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のわり算はできません");
		if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型のわり算はできません");
		if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のわり算はできません");
		if(v2.value == 0 || v2 instanceof NullValue) throw new RuntimeError(this.first_line, "0でわり算をしました");
		if((v1 instanceof IntValue || v1 instanceof NullValue) && v2 instanceof IntValue)
		{
			let v = (v1.value - v1.value % v2.value) / v2.value
			if(!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
			return new IntValue(v, this.loc);
		}
		else
		{
			let v = v1.value / v2.value;
			if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
			return new FloatValue(v, this.loc);
		}
	}
}

class Div2 extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
	}
	getValue()
	{
		let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
		if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のわり算はできません");
		if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型のわり算はできません");
		if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のわり算はできません");
		if(v2.value == 0 || v2 instanceof NullValue) throw new RuntimeError(this.first_line, "0でわり算をしました");
		if((v1 instanceof IntValue || v1 instanceof NullValue) && v2 instanceof IntValue)
		{
			let v = (v1.value - v1.value % v2.value) / v2.value
			if(!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
			return new IntValue(v, this.loc);
		}
		else
		{
			if(setting.div_mode == 0)
			{
				let v = v1.value / v2.value;
				if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
				return new FloatValue(v, this.loc);
			}
			else
			{
				let v = Math.floor(v1.value / v2.value);
				if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
				return new IntValue(v, this.loc);
			}
		}
	}
}


class Mod extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
	}
	getValue()
	{
		let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
		if((v1 instanceof IntValue || v1 instanceof NullValue) && (v2 instanceof IntValue || v2 instanceof NullValue))
		{
			if(v2.value == 0) throw new RuntimeError(this.first_line, "0でわり算をしました");
			let v = v1.value % v2.value;
			if(!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
			return new IntValue(v, this.loc);
		}
		else
			throw new RuntimeError(this.first_line, "余りを出す計算は整数でしかできません");
	}
}

class Minus extends Value
{
	constructor(x, loc)
	{
		super(x, loc);
	}
	getValue()
	{
		let v1 = this.value.getValue();
		if(v1 instanceof NullValue) return v1;
		if(v1 instanceof IntValue || v1 instanceof FloatValue)
		{
			let v = -v1.value;
			if(v instanceof IntValue && !isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
			if(v instanceof FloatValue && !isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
			return v1 instanceof IntValue ? new IntValue(v, this.loc) : new FloatValue(v, this.loc);
		}
		else
			throw new RuntimeError(this.first_line, "マイナスは数値にしかつけられません");
	}
}

class And extends Value
{
	constructor(x, y, loc){super([x,y],loc);}
	getValue()
	{
		let v1 = this.value[0].getValue();
		if(v1 instanceof BooleanValue)
		{
			if(!v1.value) return new BooleanValue(false, this.loc);
			let v2 = this.value[1].getValue();
			if(v2 instanceof BooleanValue) return new BooleanValue(v2.value, this.loc);
		}
		throw new RuntimeError(this.first_line, "「かつ」は真偽値にしか使えません");
	}
}

class Or extends Value
{
	constructor(x, y, loc){super([x,y],loc);}
	getValue()
	{
		let v1 = this.value[0].getValue();
		if(v1 instanceof BooleanValue)
		{
			if(v1.value) return new BooleanValue(true, this.loc);
			let v2 = this.value[1].getValue();
			if(v2 instanceof BooleanValue) return new BooleanValue(v2.value, this.loc);
		}
		throw new RuntimeError(this.first_line, "「または」は真偽値にしか使えません");
	}
}
class Not extends Value
{
	constructor(x, loc){super(x,loc);}
	getValue()
	{
		let v1 = this.value.getValue();
		if(v1 instanceof BooleanValue) return new BooleanValue(!v1.value, this.loc);
		else throw new RuntimeError(this.first_line, "「でない」は真偽値にしか使えません");
	}
}

class EQ extends Value
{
	constructor(x, y, loc){super([x,y], loc);}
	getValue()
	{
		let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
		return new BooleanValue(v1.value == v2.value, this.loc);
	}
}

class NE extends Value
{
	constructor(x, y, loc){super([x,y], loc);}
	getValue()
	{
		let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
		return new BooleanValue(v1.value != v2.value, this.loc);
	}
}

class GT extends Value
{
	constructor(x, y, loc){super([x,y], loc);}
	getValue()
	{
		let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
		return new BooleanValue(v1.value > v2.value, this.loc);
	}
}

class GE extends Value
{
	constructor(x, y, loc){super([x,y], loc);}
	getValue()
	{
		let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
		return new BooleanValue(v1.value >= v2.value, this.loc);
	}
}

class LT extends Value
{
	constructor(x, y, loc){super([x,y], loc);}
	getValue()
	{
		let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
		return new BooleanValue(v1.value < v2.value, this.loc);
	}
}

class LE extends Value
{
	constructor(x, y, loc){super([x,y], loc);}
	getValue()
	{
		let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
		return new BooleanValue(v1.value <= v2.value, this.loc);
	}
}

class Variable extends Value
{
	constructor(x, y, loc){super([x,y],loc);}
	get varname()
	{
		let vn = this.value[0];
		let pm = this.value[1];
		if(pm != null)
		{
			let ag = new Array(pm.length);
			for(let i = 0; i < pm.length; i++)
			{
				let v = pm[i].getValue();
				if(v instanceof IntValue) ag[i] = v.value;
				else if(v instanceof FloatValue) ag[i] = Math.floor(v.value);
				else throw new RuntimeError(this.first_line, "配列の添字に" + v.value + "は使えません");
			}
			vn += '['+ag.join(',')+']';
		}
		return vn;
	}
	getValue()
	{
		let vn = this.varname;
		if(varsInt[vn] != undefined) return new IntValue(varsInt[vn], this.loc);
		else if(varsFloat[vn] != undefined) return new FloatValue(varsFloat[vn], this.loc);
		else if(varsString[vn] != undefined) return new StringValue(varsString[vn], this.loc);
		else if(varsBoolean[vn] != undefined) return new BooleanValue(varsBoolean[vn], this.loc);
		else if(setting.var_declaration == 0) throw new RuntimeError(this.first_line, "変数" + vn + "は宣言されていません");
		else return new NullValue(this.loc);
	}
}

class CallFunction extends Value
{
	constructor(funcname, parameter, loc){super({funcname: funcname, parameter:parameter}, loc);}
	getValue()
	{
		let func = this.value.funcname, param = this.value.parameter;
		if(func == 'abs')
		{
			if(param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
			var par1 = param[0].getValue();
			if(par1 instanceof NullValue || par1 instanceof IntValue) return new IntValue(Math.abs(par1.value), this.loc);
			else if(par1 instanceof FloatValue) return new FloatValue(Math.abs(par1.value), this.loc);
			else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
		}
		else if(func == 'random')
		{
			if(param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
			var par1 = param[0].getValue();
			if(par1 instanceof NullValue || par1 instanceof IntValue) return new IntValue(Math.floor(Math.random() * Math.floor(par1.value + 1)), this.loc);
			else throw new RuntimeError(this.first_line, func + "は整数にしか使えません");
		}
		else if(func == 'ceil')
		{
			if(param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
			var par1 = param[0].getValue();
			if(par1 instanceof NullValue || par1 instanceof IntValue) return par1;
			else if(par1 instanceof FloatValue) return new IntValue(Math.ceil(par1.value), this.loc);
			else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
		}
		else if(func == 'floor')
		{
			if(param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
			var par1 = param[0].getValue();
			if(par1 instanceof NullValue || par1 instanceof IntValue) return par1;
			else if(par1 instanceof FloatValue) return new IntValue(Math.floor(par1.value), this.loc);
			else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
		}
		else if(func == 'round')
		{
			if(param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
			var par1 = param[0].getValue();
			if(par1 instanceof NullValue || par1 instanceof IntValue) return par1;
			else if(par1 instanceof FloatValue) return new IntValue(Math.round(par1.value), this.loc);
			else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
		}
		else if(func == 'sin')
		{
			if(param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
			var par1 = param[0].getValue();
			if(par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue)
				return new FloatValue(Math.sin(par1.value), this.loc);
			else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
		}
		else if(func == 'cos')
		{
			if(param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
			var par1 = param[0].getValue();
			if(par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue)
				return new FloatValue(Math.cos(par1.value), this.loc);
			else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
		}
		else if(func == 'tan')
		{
			if(param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
			var par1 = param[0].getValue();
			if(par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue)
			{
				let v = Math.tan(par1.value);
				if(isFinite(v)) return new FloatValue(Math.tan(par1.value), this.loc);
				else throw new RuntimeError(this.first_line, "オーバーフローしました");
			}
			else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
		}
		else if(func == 'sqrt')
		{
			if(param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
			var par1 = param[0].getValue();
			if(par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue)
			{
				if(par1.value < 0) throw new RuntimeError(this.first_line, "負の数のルートを求めようとしました");
			 	return new FloatValue(Math.sqrt(par1.value), this.loc);
			}
			else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
		}
		else if(func == 'log')
		{
			if(param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
			var par1 = param[0].getValue();
			if(par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue)
			{
				if(par1.value <= 0) throw new RuntimeError(this.first_line, "正でない数の対数を求めようとしました");
				let v = Math.log(par1.value);
				if(isFinite(v)) return new FloatValue(v, this.loc);
				throw new RuntimeError(this.first_line, "オーバーフローしました");
			}
			else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
		}
		else if(func == 'exp')
		{
			if(param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
			var par1 = param[0].getValue();
			if(par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue)
			{
				let v = Math.exp(par1.value);
				if(isFinite(v)) return new FloatValue(v, this.loc);
				throw new RuntimeError(this.first_line, "オーバーフローしました");
			}
			else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
		}
		else if(func == 'pow')
		{
			if(param.length != 2) throw new RuntimeError(this.first_line, func + "の引数は2つです");
			var par1 = param[0].getValue();
			var par2 = param[1].getValue();
			if((par1 instanceof NullValue || par1 instanceof IntValue) && (par2 instanceof NullValue || par2 instanceof IntValue) && par2.value >= 0)
			{
				if(par1.value == 0 && par2.value <= 0) throw new RuntimeError(this.first_line, "0は正の数乗しかできません");
				let v = Math.pow(par1.value, par2.value);
				if(isSafeInteger(v)) return new IntValue(v, this.loc);
				else throw new RuntimeError(this.first_line, "オーバーフローしました");
			}
			if((par1 instanceof NullValue || par1 instanceof IntValue || par1 instanceof FloatValue) &&
				(par2 instanceof NullValue || par2 instanceof IntValue || par2 instanceof FloatValue))
			{
				if(par1.value < 0 && !Number.isInteger(par2.value)) throw new RuntimeError(this.first_line, "負の数の非整数乗はできません");
				if(par1.value == 0 && par2.value <= 0) throw new RuntimeError(this.first_line, "0は正の数乗しかできません");
				let v = Math.pow(par1.value, par2.value);
				if(isFinite(v)) return new FloatValue(v, this.loc);
				else throw new RuntimeError(this.first_line, "オーバーフローしました");
			}
		}
		else if(func == 'length')
		{
			if(param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
			var par1 = param[0].getValue();
			if(par1 instanceof NullValue) return new IntValue(0, this.loc);
			else if(par1 instanceof StringValue) return new IntValue(par1.value.length(), this.loc);
			else throw new RuntimeError(this.first_line, func + "は文字列にしか使えません");
		}
		else if(func == 'substring')
		{
			if(param.length != 2 && param.length != 3) throw new RuntimeError(this.first_line, func + "の引数は2つか3つです");
			var par1 = param[0].getValue();
			var par2 = param[1].getValue();
			var par3 = param.length == 3 ? param[2].getValue() : null;
			if((par1 instanceof NullValue || par1 instanceof StringValue) &&
				(par2 instanceof NullValue || par2 instanceof IntValue) &&
				(par3 == null || par1 instanceof NullValue || par3 instanceof IntValue))
			{
				var v;
				if(par3 == null) v = par1.value.substr(par2.value);
				else v = par1.value.substr(par2.value, par3.value);
				return new StringValue(v, this.loc);
			}
			else throw new RuntimeError(this.first_line, func + "の引数の型が違います");
		}
		else if(func == 'append')
		{
			if(param.length != 2) throw new RuntimeError(this.first_line, func + "の引数は2つです");
			var par1 = param[0].getValue();
			var par2 = param[1].getValue();
			if(par1 instanceof NullValue) return v2;
			else if(par2 instanceof NullValue) return v1;
			else if(par2 instanceof StringValue && par2 instanceof StringValue)
			{
				return new StringValue(par1.value + par2.value, this.loc);
			}
			else throw new RuntimeError(this.first_line, func + "の引数の型が違います");
		}
		else if(func == 'extract')
		{
			if(param.length != 3) throw new RuntimeError(this.first_line, func + "の引数は3つです");
			var par1 = param[0].getValue();
			var par2 = param[1].getValue();
			var par3 = param[2].getValue();
			if((par1 instanceof NullValue || par1 instanceof StringValue) &&
				(par2 instanceof NullValue || par2 instanceof StringValue) &&
				(par3 instanceof NullValue || par3 instanceof IntValue))
			{
				var v1 = par1 instanceof NullValue ? '' : par1.value;
				var v2 = par2 instanceof NullValue ? '' : par2.value;
				var v3 = par3.value;
				var v = v1.split(v2);
				if(v3 >= 0 && v3 < v.length) return new StringValue(v[v3], this.loc);
				else throw new RuntimeError(this.first_line, "番号の値が不正です");
			}
			else throw new RuntimeError(this.first_line, func + "の引数の型が違います");
		}
		else if(func == 'insert')
		{
			if(param.length != 3) throw new RuntimeError(this.first_line, func + "の引数は3つです");
			var par1 = param[0].getValue();
			var par2 = param[1].getValue();
			var par3 = param[2].getValue();
			if((par1 instanceof NullValue || par1 instanceof StringValue) &&
				(par2 instanceof NullValue || par2 instanceof IntValue) &&
				(par3 instanceof NullValue || par3 instanceof StringValue))
			{
				var v1 = par1 instanceof NullValue ? '' : par1.value;
				var v2 = par2.value;
				var v3 = par3 instanceof NullValue ? '' : par3.value;
				if(v2 < 0 || v2 > v1.length) throw new RuntimeError(this.first_line, "位置の値が不正です");
				var s1 = v1.substr(0, v2);
				var s2 = v1.substr(v2);
				return new StringValue(s1 + v3 + s2, this.loc);
			}
			else throw new RuntimeError(this.first_line, func + "の引数の型が違います");
		}
		else if(func == 'replace')
		{
			if(param.length != 4) throw new RuntimeError(this.first_line, func + "の引数は4つです");
			var par1 = param[0].getValue();
			var par2 = param[1].getValue();
			var par3 = param[2].getValue();
			var par4 = param[3].getValue();
			if((par1 instanceof NullValue || par1 instanceof StringValue) &&
				(par2 instanceof NullValue || par2 instanceof IntValue) &&
				(par3 instanceof NullValue || par3 instanceof IntValue) &&
				(par4 instanceof NullValue || par4 instanceof StringValue))
			{
				var v1 = par1 instanceof NullValue ? '' : par1.value;
				var v2 = par2.value;
				var v3 = par3.value;
				var v4 = par4 instanceof NullValue ? '' : par4.value;

				if(v2 < 0 || v2 > v1.length) throw new RuntimeError(this.first_line, "位置の値が不正です");
				if(v3 < 0 || v2 + v3 > v1.length)throw new RuntimeError(this.first_line, "長さの値が不正です");
				var s1 = v1.substr(0, v2);
				var s2 = v1.substr(v2 + v3);
				return new StringValue(s1 + v4 + s2, this.loc);
			}
			else throw new RuntimeError(this.first_line, func + "の引数の型が違います");
		}

		else throw new RuntimeError(this.first_line, func + "という関数はありません");
	}
}

class Append extends Value
{
	constructor(x,y,loc){super([x,y],loc);}
	getValue()
	{
		let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
		if(this.value[0].getValue() instanceof NullValue) v1 = '';
		if(this.value[1].getValue() instanceof NullValue) v2 = '';
		let v = String(v1.value) + String(v2.value);
		return new StringValue(v, this.loc);
	}
}

class Statement
{
	constructor(loc)
	{
		this._loc = loc;
	}
	get first_line() {return this._loc.first_line;}
	get last_line() {return this._loc.last_line;}
	get loc(){return this._loc;}
	run(index){}
}

class DefinitionInt extends Statement
{
	constructor(x, loc)
	{
		super(loc);
		this.vars = x;
	}
	run(index)
	{
		for(var i = 0; i < this.vars.length; i++)
		{
			let varname = this.vars[i].varname;
			let parameter = this.vars[i].parameter;
			if(varsInt[varname] != undefined || varsFloat[varname] != undefined
			|| varsString[varname] != undefined || varsBoolean[varname] != undefined)
			 	throw new RuntimeError(this.first_line, varname + "の宣言が重複しています");
			if(!parameter)
			{
				varsInt[varname] = 0;
			}
			else
			{
				let parameterlist = [];
				for(var j = 0; j < parameter.length; j++)
				{
					let v = parameter[j].getValue();
					if(v instanceof IntValue && v.value >= 0) parameterlist.push(v.value);
					else if(v instanceof FloatValue && v.value >= 0) parameterlist.push(Math.round(v.value));
					else throw new RuntimeError(this.first_line, "配列の番号に" + v.value + "は使えません");
				}
				let args = new Array(parameter.length);
				for(var j = 0; j < parameter.length; j++) args[j] = (setting.array_origin != 2 ? 0 : 1);
				while(args)
				{
					varsInt[varname + '[' + args.join(',') + ']'] = 0;
					let k = 0;
					do {
						if(k < args.length)
						{
							args[k]++;
							if((setting.array_origin != 1 && args[k] > parameterlist[k])
								|| (setting.array_origin == 1 && args[k] >= parameterlist[k]))
								args[k++] = (setting.array_origin != 2 ? 0 : 1);
							else k = -1;
						}
						else
						{
							k = -1;
							args = undefined;
						}
					} while (k >= 0);
				}
			}
		}
		return index + 1;
	}
}
class DefinitionFloat extends Statement
{
	constructor(x, loc)
	{
		super(loc);
		this.vars = x;
	}
	run(index)
	{
		for(var i = 0; i < this.vars.length; i++)
		{
			let varname = this.vars[i].varname;
			let parameter = this.vars[i].parameter;
			if(varsInt[varname] != undefined || varsFloat[varname] != undefined
			|| varsString[varname] != undefined || varsBoolean[varname] != undefined)
			 	throw new RuntimeError(this.first_line, varname + "の宣言が重複しています");
			if(!parameter)
			{
				varsFloat[varname] = 0.0;
			}
			else
			{
				let parameterlist = [];
				for(var j = 0; j < parameter.length; j++)
				{
					let v = parameter[j].getValue();
					if(v instanceof IntValue && v.value >= 0) parameterlist.push(v.value);
					else if(v instanceof FloatValue && v.value >= 0) parameterlist.push(Math.round(v.value));
					else throw new RuntimeError(this.first_line, "配列の番号に" + v.value + "は使えません");
				}
				let args = new Array(parameter.length);
				for(var j = 0; j < parameter.length; j++) args[j] = (setting.array_origin != 2 ? 0 : 1);
				while(args)
				{
					varsFloat[varname + '[' + args.join(',') + ']'] = 0;
					let k = 0;
					do {
						if(k < args.length)
						{
							args[k]++;
							if((setting.array_origin != 1 && args[k] > parameterlist[k])
								|| (setting.array_origin == 1 && args[k] >= parameterlist[k]))
								args[k++] = (setting.array_origin != 2 ? 0 : 1);
							else k = -1;
						}
						else
						{
							k = -1;
							args = undefined;
						}
					} while (k >= 0);
				}
			}
		}
		return index + 1;
	}
}
class DefinitionString extends Statement
{
	constructor(x, loc)
	{
		super(loc);
		this.vars = x;
	}
	run(index)
	{
		for(var i = 0; i < this.vars.length; i++)
		{
			let varname = this.vars[i].varname;
			let parameter = this.vars[i].parameter;
			if(varsInt[varname] != undefined || varsFloat[varname] != undefined
			|| varsString[varname] != undefined || varsBoolean[varname] != undefined)
			 	throw new RuntimeError(this.first_line, varname + "の宣言が重複しています");
			if(!parameter)
			{
				varsString[varname] = '';
			}
			else
			{
				let parameterlist = [];
				for(var j = 0; j < parameter.length; j++)
				{
					let v = parameter[j].getValue();
					if(v instanceof IntValue && v.value >= 0) parameterlist.push(v.value);
					else if(v instanceof FloatValue && v.value >= 0) parameterlist.push(Math.round(v.value));
					else throw new RuntimeError(this.first_line, "配列の番号に" + v.value + "は使えません");
				}
				let args = new Array(parameter.length);
				for(var j = 0; j < parameter.length; j++) args[j] = (setting.array_origin != 2 ? 0 : 1);
				while(args)
				{
					varsString[varname + '[' + args.join(',') + ']'] = '';
					let k = 0;
					do {
						if(k < args.length)
						{
							args[k]++;
							if((setting.array_origin != 1 && args[k] > parameterlist[k])
								|| (setting.array_origin == 1 && args[k] >= parameterlist[k]))
								args[k++] = (setting.array_origin != 2 ? 0 : 1);
							else k = -1;
						}
						else
						{
							k = -1;
							args = undefined;
						}
					} while (k >= 0);
				}
			}
		}
		return index + 1;
	}
}
class DefinitionBoolean extends Statement
{
	constructor(x, loc)
	{
		super(loc);
		this.vars = x;
	}
	run(index)
	{
		for(var i = 0; i < this.vars.length; i++)
		{
			let varname = this.vars[i].varname;
			let parameter = this.vars[i].parameter;
			if(varsInt[varname] != undefined || varsFloat[varname] != undefined
			|| varsString[varname] != undefined || varsBoolean[varname] != undefined)
			 	throw new RuntimeError(this.first_line, varname + "の宣言が重複しています");
			if(!parameter)
			{
				varsBoolean[varname] = false;
			}
			else
			{
				let parameterlist = [];
				for(var j = 0; j < parameter.length; j++)
				{
					let v = parameter[j].getValue();
					if(v instanceof IntValue && v.value >= 0) parameterlist.push(v.value);
					else if(v instanceof FloatValue && v.value >= 0) parameterlist.push(Math.round(v.value));
					else throw new RuntimeError(this.first_line, "配列の番号に" + v.value + "は使えません");
				}
				let args = new Array(parameter.length);
				for(var j = 0; j < parameter.length; j++) args[j] = (setting.array_origin != 2 ? 0 : 1);
				while(args)
				{
					varsBoolean[varname + '[' + args.join(',') + ']'] = false;
					let k = 0;
					do {
						if(k < args.length)
						{
							args[k]++;
							if((setting.array_origin != 1 && args[k] > parameterlist[k])
								|| (setting.array_origin == 1 && args[k] >= parameterlist[k]))
								args[k++] = (setting.array_origin != 2 ? 0 : 1);
							else k = -1;
						}
						else
						{
							k = -1;
							args = undefined;
						}
					} while (k >= 0);
				}
			}
		}
		return index + 1;
	}
}

class Assign extends Statement
{
	constructor(varname,val,loc)
	{
		super(loc);
		this.varname = varname;
		this.val = val;
	}
	run(index)
	{
		let vl = this.val.getValue();
		if(vl instanceof ArrayValue)
		{
			var len = vl.value.length;
			var ag = this.varname.value[1];
			for(var i = 0; i < len; i++)
			{
				var ag1 = this.varname.value[1] instanceof Array ? this.varname.value[1].concat() : [];
				ag1.push(new IntValue(i, this.loc));
				var variable = new Variable(this.varname.value[0], ag1, this.loc);
				var command = new Assign(variable,vl.value[i], this.loc);
				command.run(index);
			}
		}
		else
		{
			let vn = this.varname.varname;
			if(varsInt[vn] != undefined)
			{
				if(vl instanceof IntValue) varsInt[vn] = vl.value;
				else if(vl instanceof FloatValue) varsInt[vn] = Math.round(vl.value);
				else throw new RuntimeError(this.first_line, vn + "に数値以外の値を代入しようとしました");
				if(!isSafeInteger(varsInt[vn])) throw new RuntimeError(this.first_line, "オーバーフローしました");
			}
			else if(varsFloat[vn] != undefined)
			{
				if(vl instanceof IntValue || vl instanceof FloatValue) varsFloat[vn] = vl.value;
				else throw new RuntimeError(this.first_line, vn + "に数値以外の値を代入しようとしました");
				if(!isFinite(varsFloat[vn])) throw new RuntimeError(this.first_line, "オーバーフローしました");
			}
			else if(varsString[vn] != undefined)
			{
				if(vl instanceof StringValue) varsString[vn] = vl.value;
				else throw new RuntimeError(this.first_line, vn + "に文字列以外の値を代入しようとしました");
			}
			else if(varsBoolean[vn] != undefined)
			{
				if(vl instanceof BooleanValue) varsBoolean[vn] = vl.value;
				else throw new RuntimeError(this.first_line, vn + "に真偽以外の値を代入しようとしました");
			}
			else if(setting.var_declaration == 0) throw new RuntimeError(this.first_line, vn + "は宣言されていません");
			else // 新しい変数を宣言する
			{
				if(vl instanceof NullValue || vl instanceof IntValue) varsInt[vn] = vl.value;
				else if(vl instanceof FloatValue) varsFloat[vn] = vl.value;
				else if(vl instanceof StringValue) varsString[vn] = vl.value;
				else if(vl instanceof BooleanValue) varsBoolean[vn] = vl.value;
			}
		}
		return index + 1;
	}
}

class Input extends Statement
{
	constructor(x, loc)
	{
		super(loc);
		this.varname = x;
	}
	run(index)
	{
		var list = [new InputBegin(this.loc), new InputEnd(this.varname, this.loc)];
		stack.push({statementlist: list, index: 0});
		return index + 1;
	}
}

class InputBegin extends Statement
{
	constructor(loc)
	{
		super(loc);
	}
	run(index)
	{
		openInputWindow();
		return index + 1;
	}
}

class InputEnd extends Statement
{
	constructor(x, loc)
	{
		super(loc);
		this.varname = x;
	}
	run(index)
	{
		try{
			let vn = this.varname.varname;
			let vl = closeInputWindow();
			if(varsInt[vn] != undefined)
			{
				varsInt[vn] = Number(vl);
				if(!isSafeInteger(varsInt[vn])) throw new RuntimeError(this.first_line, "整数で表せない値が入力されました");
			}
			else if(varsFloat[vn] != undefined)
			{
				varsFloat[vn] = Number(vl);
				if(!isFinite(varsFloat[vn])) throw new RuntimeError(this.first_line, "実数で表せない値が入力されました");
			}
			else if(varsString[vn] != undefined)
			{
				varsString[vn] = String(vl);
			}
			else if(varsBoolean[vn] != undefined)
			{
				varsBoolean[vn] = vl;
				if(vl !== true && vl !== false) throw new RuntimeError(this.first_line, "真偽以外の値が入力されました");
			}
			else if(setting.var_declaration == 0) throw new RuntimeError(this.first_line, vn + "は宣言されていません");
			else
			{
				varsString[vn] = String(vl); // とりあえず文字列
			}
		}
		catch(e)
		{
			closeInputWindow();
			throw e;
		}

		return index + 1;
	}
}

class Output extends Statement
{
	constructor(x, ln, loc)
	{
		super(loc);
		this.value = x;
		this.ln = ln;
	}
	run(index)
	{
		let v = this.value.getValue().value;
		if(this.value.getValue() instanceof NullValue) v = '';
		textareaAppend(v + (this.ln ? "\n" : ""));
		return index + 1;
	}
}

class GraphicStatement extends Statement
{
	constructor(command, args, loc)
	{
		super(loc);
		this.command = command;
		this.args = args;
	}
	run(index)
	{
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
			context.fillText(this.args[0].getValue().value, this.args[1].getValue().value, this.args[2].getValue().value);
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
			context.arc(x1, y1, r, 0, Math.PI * 2, false);
			context.fill();
		}
		else
		{
			throw new RuntimeError(this.first_line, "未実装のコマンド" + this.command + "が使われました");
		}
		return index + 1;
	}
}


class If extends Statement
{
	constructor(condition, state1, state2, loc)
	{
		super(loc);
		this.condition = condition;
		this.state1 = state1;
		this.state2 = state2;
	}
	run(index)
	{
		if(this.condition.getValue() instanceof BooleanValue)
		{
			if(this.condition.getValue().value) stack.push({statementlist: this.state1, index: 0});
			else if(this.state2 != null) stack.push({statementlist: this.state2, index: 0});
		}
		else throw new RuntimeError(this.first_line, "もし〜の構文で条件式が使われていません");
		return index + 1;
	}
}
class LoopBegin extends Statement
{
	constructor(condition, continuous, loc)
	{
		super(loc);
		this.condition = condition;
		this.continuous = continuous;
	}
	run(index)
	{
		if(this.condition == null || this.condition.getValue().value == this.continuous) return index + 1;
		else return -1;
	}
}

class LoopEnd extends Statement
{
	constructor(condition, continuous, loc)
	{
		super(loc);
		this.condition = condition;
		this.continuous = continuous;
	}
	run(index)
	{
		if(this.condition == null || this.condition.getValue().value == this.continuous) return 0;
		else return -1;
	}
}

class ForInc extends Statement
{
	constructor(varname, begin, end, step, state,loc)
	{
		super(loc);
		this.varname = varname;
		this.begin = begin;
		this.end = end;
		this.step = step;
		this.state = state;
	}
	run(index)
	{
		let last_token = {first_line: this.last_line, last_line: this.last_line};
		let last_loc = new Location(last_token, last_token);
		if(setting.var_declaration != 0 &&
			varsInt[this.varname.varname] == undefined && varsFloat[this.varname.varname] == undefined &&
			varsString[this.varname.varname] == undefined && varsFloat[this.varname.varname] == undefined)
		{
				if(this.begin.getValue() instanceof IntValue) varsInt[this.varname.varname] = 0;
				else if(this.begin.getValue() instanceof FloatValue) varsFloat[this.varname.varname] = 0;
		}
		if(varsInt[this.varname.varname] != undefined || varsFloat[this.varname.varname] != undefined)
		{
			let assign = new Assign(this.varname, this.begin.getValue(), this.loc);
			assign.run(0);
			let loop = [new LoopBegin(new LE(new Variable(this.varname.varname, null, this.loc), this.end, this.loc), true, this.loc)];
			for(let i = 0; i < this.state.length; i++)loop.push(this.state[i]);
			loop.push(new Assign(this.varname, new Add(new Variable(this.varname.varname, null, this.loc), this.step, last_loc), last_loc));
			loop.push(new LoopEnd(null, true, last_loc));
			stack.push({statementlist: loop, index: 0});
		}
		else throw new RuntimeError(this.first_line, this.varname.varname + "は数値型の変数ではありません");
		return index + 1;
	}
}

class ForDec extends Statement
{
	constructor(varname, begin, end, step, state,loc)
	{
		super(loc);
		this.varname = varname;
		this.begin = begin;
		this.end = end;
		this.step = step;
		this.state = state;
	}
	run(index)
	{
		let last_token = {first_line: this.last_line, last_line: this.last_line};
		let last_loc = new Location(last_token, last_token);
		if(setting.var_declaration != 0 &&
			varsInt[this.varname.varname] == undefined && varsFloat[this.varname.varname] == undefined &&
			varsString[this.varname.varname] == undefined && varsFloat[this.varname.varname] == undefined)
		{
				if(this.begin.getValue() instanceof IntValue) varsInt[this.varname.varname] = 0;
				else if(this.begin.getValue() instanceof FloatValue) varsFloat[this.varname.varname] = 0;
		}
		if(varsInt[this.varname.varname] != undefined || varsFloat[this.varname.varname] != undefined)
		{
			let assign = new Assign(this.varname, this.begin.getValue(), this.loc);
			assign.run(0);
			let loop = [new LoopBegin(new GE(new Variable(this.varname.varname, null, this.loc), this.end, this.loc), true, this.loc)];
			for(let i = 0; i < this.state.length; i++)loop.push(this.state[i]);
			loop.push(new Assign(this.varname, new Sub(new Variable(this.varname.varname, null, this.loc), this.step, last_loc), last_loc));
			loop.push(new LoopEnd(null, true, last_loc));
			stack.push({statementlist: loop, index: 0});
		}
		else throw new RuntimeError(this.first_line, this.varname.varname + "は数値型の変数ではありません");
		return index + 1;
	}
}

class Until extends Statement
{
	constructor(state, condition, loc)
	{
		super(loc);
		this.condition = condition;
		this.state = state;
	}
	run(index)
	{
		let last_token = {first_line: this.last_line, last_line: this.last_line};
		let loop = [new LoopBegin(null, true, this.loc)];
		for(var i = 0; i < this.state.length; i++) loop.push(this.state[i]);
		loop.push(new LoopEnd(this.condition, false, new Location(last_token, last_token)));
		stack.push({statementlist: loop, index: 0});
		return index + 1;
	}
}

class While extends Statement
{
	constructor(condition, state, loc)
	{
		super(loc);
		this.condition = condition;
		this.state = state;
	}
	run(index)
	{
		let last_token = {first_line: this.last_line, last_line: this.last_line};
		let loop = [new LoopBegin(this.condition, true, this.loc)];
		for(var i = 0; i < this.state.length; i++) loop.push(this.state[i]);
		loop.push(new LoopEnd(null, false, new Location(last_token, last_token)));
		stack.push({statementlist: loop, index: 0});
		return index + 1;
	}
}

class SleepStatement extends Statement
{
	constructor(sec, loc)
	{
		super(loc)
		this.sec = sec.value * 1000; // milli seconds
	}
	run(index)
	{
		wait_time = this.sec;
		return index + 1;
	}
}



function highlightLine(l)
{
	$(".codelines").children().removeClass("lineselect");
	if(l > 0) $(".codelines :nth-child("+l+")").addClass("lineselect");
}

function reset()
{
	varsInt = {}, varsFloat = {}, varsString = {}, varsBoolean = {};
	current_line = -1;
	textarea.value = '';
	setRunflag(false);
	parse = null;
	stack = [];
	highlightLine(-1);
	var canvas = document.getElementById('canvas');
	canvas.style.display = 'none';
	context = null;
	wait_time = 0;
}

function setRunflag(b)
{
	run_flag = b;
	document.getElementById("sourceTextarea").readOnly = b;
	document.getElementById("runButton").innerHTML = b & !step_flag ? "中断" : "実行";
}

function run()
{
	if(parse == null)
	{
		try
		{
			reset();
			var source = document.getElementById("sourceTextarea").value+"\n";
			parse = dncl.parse(source);
			stack.push({statementlist: parse, index: 0});
		}
		catch(e)
		{
			textareaAppend("構文エラーです\n" + e.message + "\n");
			setRunflag(false);
			parse = null;
			return;
		}
	}
	setRunflag(true);
	step();

	function finish()
	{
		textareaAppend("---\n");
		highlightLine(-1);
		setRunflag(false);
		wait_time = 0;
		parse = null;
	}

	function step()
	{
		var l = current_line;
		do{
			next_line();
		}while(run_flag && l == current_line)
		if(stack.length > 0)
		{
			if(run_flag && !step_flag)
				if(wait_time != 0) setTimeout(step, wait_time);
				else setZeroTimeout(step);
		}
		else finish();
		wait_time = 0;
	}

	function next_line()
	{
		var depth = stack.length - 1;
		var index = stack[depth].index;
		var statement = stack[depth].statementlist[index];
		if(statement) {
			try{
				index = statement.run(index);
			}
			catch(e)
			{
				textareaAppend("実行時エラーです\n" +
				e.line + "行目:" + e.message+"\n");
				setRunflag(false);
				parse = null;
			}
		}
		else index++;
//		if(index < 0) index = stack[depth].statementlist.length;

		stack[depth].index = index;
		if(index < 0 || index > stack[depth].statementlist.length) stack.pop();
		// ハイライト行は次の実行行
		depth = stack.length - 1;
		if(depth >= 0)
		{
			index = stack[depth].index;
			var statement = stack[depth].statementlist[index];
			if(statement)
			{
				current_line = statement.first_line;
				highlightLine(current_line);
			}
		}
		else
		{
			highlightLine(++current_line);
		}
	}
}

function openInputWindow()
{
	var $input = $("#input");
	var $input_overlay = $("#input-overlay");
	$input_overlay.fadeIn();
	$input.fadeIn();
	$input.html("<p>入力してください</p>"+
	"<input type=\"text\" id=\"inputarea\" onkeydown=\"keydown();\">");
//	var inputarea = document.getElementById("inputarea");
//	if(inputarea.addEventListener) inputarea.addEventListener("keydown", keydown);
//	else if(inputarea.attachEvent) inputarea.attachEvent("onkeydown", keydown);
	$("#inputarea").focus();
	setRunflag(false);
}

function closeInputWindow()
{
	var val = $("#input input").val();
	$("#input").hide();
	$("#input-overlay").hide();
	return val;
}

function keydown(e)
{
	var evt = e || window.event
	if(evt.keyCode == 13)
	{
		setRunflag(true);
		setTimeout(run(), 100);
	}
	else if(evt.keyCode == 27)
	{
		closeInputWindow();
	}
}


function editButton(add_code)
{
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
	if(array != null) tab = array[0];
//	console.log("["+code[pos]+"]");
	if((code[pos] && code[pos] != "\n") || (pos > 0 && !re2.exec(code[pos - 1])))
	{
		alert("この位置で入力支援ボタンを押してはいけません");
		sourceTextArea.focus();
		return;
	}
	for(var c in add_codes) if(c > 0) add_codes[c] = tab + add_codes[c];
	sourceTextArea.value = code1 + add_codes.join("\n") + code2;
	sourceTextArea.selectionStart = sourceTextArea.selectionEnd = sourceTextArea.value.length - code2.length;
	sourceTextArea.focus();
}

function keyUp(e)
{
	var evt = e || window.event;
	var sourceTextArea = document.getElementById("sourceTextarea");
	var pos = sourceTextArea.selectionStart;
	var code = sourceTextArea.value;
	var code1 = code.slice(0, pos);
	var code2 = code.slice(pos, code.length);
	var re1 = /《[^》《]*$/;
	var re2 = /^[^》《]*》/;
	var re3 = /\n?([｜|]*)([^｜|\n]*?)\n$/;
	var re4 = /(ならば|なければ|(の間|繰り返し|繰返し|(増|減)やし(ながら|つつ))[，,、])$/;
	var re5 = /^\n/;
	var tab = "";
	switch(evt.keyCode)
	{
	case 37: case 38: case 39: case 40:
		if(pos > 0)
		{
			var match1 = re1.exec(code1);
			var match2 = re2.exec(code2);
			if(match1 != null && match2 != null)
			{
				sourceTextArea.setSelectionRange(pos - match1[0].length, pos + match2[0].length);
				return false;
			}
		}
	case 13:	// \n
		if(!re5.exec(code2)) return true;
		var match = re3.exec(code1);
		if(match)
		{
			 tab = match[1] ;
			 if(re4.exec(match[2])) tab = "｜" + tab;
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

function mouseClick()
{
	var sourceTextArea = document.getElementById("sourceTextarea");
	var pos = sourceTextArea.selectionStart;
	var code = sourceTextArea.value;
	var code1 = code.slice(0, pos);
	var code2 = code.slice(pos, code.length);
	var re1 = /《[^》《]*$/;
	var re2 = /^[^》《]*》/;
	var match1 = re1.exec(code1);
	var match2 = re2.exec(code2);
	if(match1 != null && match2 != null)
	{
		var start = pos - match1[0].length;
		var end = pos + match2[0].length;
		sourceTextArea.setSelectionRange(start, end);
	}
}

function sampleButton(num)
{
	var sourceTextArea = document.getElementById("sourceTextarea");
	sourceTextArea.value = sample[num];
	reset();
}


function insertCode(add_code)
{
	var sourceTextArea = document.getElementById("sourceTextarea");
	var pos1 = sourceTextArea.selectionStart;
	var pos2 = sourceTextArea.selectionEnd;
	var code = sourceTextArea.value;
	var code1 = code.slice(0, pos1);
	var code2 = code.slice(pos2, code.length);
	sourceTextArea.value = code1 + add_code + code2;
}

function registerEvent(elem, ev, func)
{
	if(elem.addEventListener) elem.addEventListener(ev, func);
	else if(elem.attachEvent) elem.attachEvent('on' + ev, func);
}

onload = function(){
	var sourceTextArea = document.getElementById("sourceTextarea");
	var resultTextArea = document.getElementById("resultTextarea");
	var parseButton   = document.getElementById("parseButton");
	var newButton     = document.getElementById("newButton");
	var runButton     = document.getElementById("runButton");
	var flowchartButton = document.getElementById("flowchartButton");
	var resetButton   = document.getElementById("resetButton");
	var stepButton    = document.getElementById("stepButton");
	var loadButton    = document.getElementById("loadButton");
	var file_prefix   = document.getElementById("file_prefix");
	var flowchart_canvas = document.getElementById("flowchart");
	$("#sourceTextarea").linedtextarea();
	textarea = resultTextArea;
	parseButton.onclick = function(){
		var source = sourceTextArea.value+"\n";
		try{
			resultTextArea.value = '';
			parse = dncl.parse(source);
			resultTextArea.value = toString(parse);
		}
		catch(e){
			resultTextArea.value += "構文エラーです\n" + e.message;
		}
		finally{
			parse = null;
		}
	};
	runButton.onclick = function(){
		if(run_flag && !step_flag)
		{
			setRunflag(false);
		}
		else
		{
			step_flag = false;
			run();
		}
	};
	stepButton.onclick = function()
	{
		step_flag = true;
		run();
	}
	newButton.onclick = function(){
		sourceTextArea.value = "";
		parse = null;
		reset();
	}
	resetButton.onclick = function(){
		reset();
	};
	loadButton.addEventListener("change", function(ev)
	{
		var file = ev.target.files;
		var reader = new FileReader();
		reader.readAsText(file[0], "UTF-8");
		reader.onload = function(ev)
		{
			sourceTextArea.value = reader.result;
			reset();
		}
	}
	,false);
	downloadLink.onclick = function()
	{
		var now = new Date();
		var filename = file_prefix.value.trim();
		if(filename.length < 1)
			filename = now.getFullYear() + ('0' + (now.getMonth() + 1)).slice(-2) +
			('0' + now.getDate()).slice(-2) + '_' + ('0' + now.getHours()).slice(-2) +
			('0' + now.getMinutes()).slice(-2) + ('0' + now.getSeconds()).slice(-2);
		filename +=	'.PEN';
		var blob = new Blob([sourceTextArea.value], {type:"text/plain"});
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
	};
	flowchartButton.onchange = function(){
		flowchart_display = this.checked;
		var flowchart_area = document.getElementById("Flowchart_area");
		if(flowchart_display)
		{
			flowchart_area.style.display = "block";
			flowchart = new Flowchart();
			// flowchart.code2flowchart();
			flowchart.paint();
		}
		else
		{
			flowchart_area.style.display = "none";
			flowchart = null;
		}
	}
	registerEvent(sourceTextArea, "keyup", keyUp);
	registerEvent(flowchart_canvas, "mousedown", mouseDown);
	registerEvent(flowchart_canvas, "mouseup", mouseUp);
	registerEvent(flowchart_canvas, "mousemove", mouseMove);
	registerEvent(flowchart_canvas, "dblclick", doubleclick_Flowchart);

	$.contextMenu(
		{
			selector: "#sourceTextarea",
			items:{
				copyAll: {name: "プログラムをコピー", callback(k,e){document.getElementById("sourceTextarea").select(); document.execCommand('copy');}},
				zenkaku: {name: "入力補助",
					items:{
						かつ:		{name:"かつ",	callback(k,e){insertCode("《値》 かつ 《値》");}},
						または:	{name:"または",	callback: function(k,e){insertCode("《値》 または 《値》");}},
						でない:	{name:"でない",	callback: function(k,e){insertCode("《値》 でない");}},
						と:		{name:"と",		callback: function(k,e){insertCode("《値》と《値》");}},
						カッコ:	{name:"「」",	callback: function(k,e){insertCode("「《値》」");}},
					}
				},
				math:{ name:"数学関数",
				 	items:{
						abs:	{name:"abs 絶対値", callback: function(k,e){insertCode("abs(《値》)");}},
						random:	{name: "random 乱数", callback: function(k,e){insertCode("random(《整数》)");}},
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
						extract:	{name: "extract 部分文字列（長さ指定）", callback: function(k,e){insertCode("extract(《文字列》,《区切文字列》,《番号》)");}},
						insert:	{name: "insert 挿入", callback: function(k,e){insertCode("insert(《文字列》,《位置》,《文字列》)");}},
						replace:	{name: "replace 置換", callback: function(k,e){insertCode("replace(《文字列》,《位置》,《長さ》,《文字列》)");}},
					}
				},
				graphic:{ name:"グラフィック命令",
					items:{
						gOpenWindow:{name:"描画領域開く", callback: function(k,e){insertCode("描画領域開く(《幅》,《高さ》)");}},
						gCloseWindow:{name:"描画領域閉じる", callback: function(k,e){insertCode("描画領域閉じる()");}},
						gClearWindow:{name:"描画領域全消去", callback: function(k,e){insertCode("描画領域全消去()");}},
						gSetLineColor:{name:"線色設定", callback: function(k,e){insertCode("線色設定(《赤》,《青》,《緑》)");}},
						gSetFillColor:{name:"塗色設定", callback: function(k,e){insertCode("塗色設定(《赤》,《青》,《緑》)");}},
						gSetLineWidth:{name:"線太さ設定", callback: function(k,e){insertCode("線太さ設定(《太さ》)");}},
						gSetFontSize:{name:"文字サイズ設定", callback: function(k,e){insertCode("文字サイズ設定(《サイズ》)");}},
						gDrawText:{name:"文字描画", callback: function(k,e){insertCode("文字描画(《文字列》,《x》,《y》)");}},
						gDrawLine:{name:"線描画", callback: function(k,e){insertCode("線描画(《x1》,《y1》,《x2》,《y2》)");}},
						gDrawBox:{name:"矩形描画", callback: function(k,e){insertCode("矩形描画(《x》,《y》,《幅》,《高さ》)");}},
						gFillBox:{name:"矩形塗描画", callback: function(k,e){insertCode("矩形塗描画(《x》,《y》,《幅》,《高さ》)");}},
						gDrawCircle:{name:"円描画", callback: function(k,e){insertCode("円描画(《x》,《y》,《半径》)");}},
						gFillCircle:{name:"円塗描画", callback: function(k,e){insertCode("円塗描画(《x》,《y》,《半径》)");}}
					}
				}
			}
		}
	);
	$.contextMenu(
		{
			selector: "#flowchart",
			build: contextMenu_Flowchart,
		}
	);
	// this code is from David Baron's Weblog
	// https://dbaron.org/log/20100309-faster-timeouts
	var timeouts = [];
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
				input: {name: "入力"},
				output: {name: "出力"},
				substitute: {name: "代入"},
				misc:{name:"各種処理"},
				if:{name:"分岐"},
				loop:{name:"ループ",
					items:{
						loop1: {name:"前条件"},
						loop2: {name:"後条件"},
						loopinc:{name:"増やしながら"},
						loopdec:{name:"減らしながら"}
					}
				},
				separator2:"-----",
				paste:{name:"ペースト"}
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
			delete: { name:"削除"},
			cut:{name:"カット"}
		}
	};
}

function callbackPartsBar(bar, key)
{
	bar.highlight();
	if(key == "input") Parts_Input.appendMe(bar);
	else if(key == "output") Parts_Output.appendMe(bar);
	else if(key == "substitute") Parts_Substitute.appendMe(bar);
	else if(key == "if") Parts_If.appendMe(bar);
}

function callbackParts(parts, key)
{
	if(parts instanceof Parts_Terminal) return false;
	if(key == "edit"){parts.editMe();}
	else if(key == "delete"){parts.deleteMe();}
	else if(key == "cut"){parts.cutMe();}
}

var FlowchartSetting = {
    size: 6,
    fontsize: 12,
};

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
		document.getElementById("variable_int").value = '';
		document.getElementById("variable_float").value = '';
		document.getElementById("variable_string").value = '';
		document.getElementById("variable_bool").value = '';
    }
    code2flowchart()
    {
        if(!flowchart_display) return;
    }
    flowchart2code()
    {
		if(!flowchart_display) return;
        var code = '';
		code += variable2code("整数", "variable_int");
		code += variable2code("実数", "variable_float");
		code += variable2code("文字列", "variable_string");
		code += variable2code("真偽", "variable_bool");
		code += this.top.appendCode('', 0);
		document.getElementById("sourceTextarea").value = code;
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
		this._hspace = 0;
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

	isBlockEnd(){return false;}

	inside(x, y)
	{
		return this.x1 <= x && x <= this.x2 && this.y1 <= y && y <= this.y2;
	}
	findParts(x, y)
	{
		var p = this;
		while(p != null && ! p.isBlockEnd())
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
		return null;
	}

    paint(position)
    {
        if(this.end.next != null) return this.end.next.paint(position);
		return this.end;
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
		if(this.next == null || this.isBlockEnd()) return;
		this.next.calcSize(p0,p1,p2);
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
        for(var i = 0; i < indent_level; i++) s += "｜";
        return s;
    }
	editMe()
	{

	}
	deleteMe()
	{
//		if(this.prev != null)
		{
			this.prev._next = this.end.next.next;
			this.end.next.next._prev = this.prev;
		}
		this.end._next = null;
		this._next = null;
	}
	cutMe()
	{

	}
	highlight()
	{
		flowchart.context.strokeStyle = "rgb(255,0,0)";
		flowchart.context.fillStyle = "rgb(255,0,0)";
		flowchart.context.clearRect(this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y2);
		this.paint(null);
		flowchart.context.strokeStyle = "rgb(0,0,0)";
		flowchart.context.fillStyle = "rgb(0,0,0)";
	}
	unhighlight()
	{
		flowchart.context.clearRect(this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y2);
		this.paint(null);
	}
}

class Parts_Null extends Parts
{
	isBlockEnd()
	{
		return true;
	}
}

class Parts_Bar extends Parts
{
    calcSize(p0,p1,p2)
    {
        this._width = 0;
        this._height = FlowchartSetting.size * 4;
		p0.y += this._height;
		if(p0.y > p2.y) p2.y = p0.y;
		if(this.next == null || this.isBlockEnd()) return;
		this.next.calcSize(p0,p1,p2);
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
		if(this.next == null || this.isBlockEnd()) return;
		this.next.calcSize(p0,p1,p2);
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
		if(this.next == null || this.isBlockEnd()) return;
		this.next.calcSize(p0,p1,p2);
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

		if(!this.newline)	// 改行なしマーク
		{
			var x = this.x2 - this.height / 2;
			var y = this.y1 + size;
			flowchart.context.beginPath();
			flowchart.context.moveTo(x + size, y);
			flowchart.context.lineTo(x + size, y + this.textHeight);
			flowchart.context.lineTo(x , y + this.textHeight);
			flowchart.context.stroke();
			flowchart.context.beginPath();
			flowchart.context.moveTo(x + size / 2, y + this.textHeight - size / 2);
			flowchart.context.lineTo(x , y + this.textHeight);
			flowchart.context.lineTo(x + size / 2, y + this.textHeight + size / 2);
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
		code += this.text + " を" + (this.newline ? "" : "改行なしで") + "表示する\n";
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
		this.setValue("《変数》");
	}
	setValue(v)
	{
		this._var = v;
		this._text = v + "を入力";
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
		if(this.next == null || this.isBlockEnd()) return;
		this.next.calcSize(p0,p1,p2);
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
		code += this.var + " を入力する\n";
		if(this.next != null) return this.next.appendCode(code, indent);
		return code;
	}
	editMe()
	{
		var subtitle = ["変数"];
		var values = [ this.var ];
		openModalWindow("入力の編集", subtitle, values, this);
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

class Parts_Substitute extends Parts
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

		this._text = this._var + "←" + this._val;
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
		if(this.next == null || this.isBlockEnd()) return;
		this.next.calcSize(p0,p1,p2);
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
		code += this.var + " ← " + this.val + "\n";
		if(this.next != null) return this.next.appendCode(code, indent);
		return code;
	}
	editMe()
	{
		var subtitle = ["変数", "値"];
		var values = [ this.var , this.val];
		openModalWindow("代入の編集", subtitle, values, this);
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
		this.left_bar_expand = pl.x - pl2.x - this.width / 2;
		if(this.left_bar_expand < size * 2) this.left_bar_expand = size * 2;
		pl1.x = pl1.x - this.left_bar_expand;
		pl2.x = pl2.x - this.left_bar_expand;
		if(pl1.x < p1.x) p1.x = pl1.x;
		if(pl2.y > p2.y) p2.y = pl2.y;
		// 右枝
		var pr = new point(); pr.x = x2; pl.y = p0.y;
		var pr1 = pr.clone(), pr2 = pr.clone();
		this.right.calcSize(pr, pr1, pr2);
		this.right_bar_expand = pr2.x - pr.x - this.width / 2;
		if(this.right_bar_expand < size * 2) this.right_bar_expand = size * 2;
		pr1.x = pr1.x + this.right_bar_expand;
		pr2.x = pr2.x + this.right_bar_expand;
		if(pr2.x > p2.x) p2.x = pr2.x;
		if(pl2.y > p2.y) p2.y = pr2.y;
		// 左枝と右枝がぶつかっていたら，ちょっと伸ばす
		var distance = pr1.x - pl2.x - size;
		if(distance < 0)
		{
			this.left_bar_expand += -distance / 2;
			this.right_bar_expand += -distance / 2;
		}
//		p0.y = this.end.y;
		this.end.next.calcSize(p0,p1,p2);
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
		// 左側
		flowchart.context.beginPath();
		flowchart.context.moveTo(this.x1, y0);
		flowchart.context.lineTo(this.x1 - this.left_bar_expand, y0);
		flowchart.context.stroke();
		var left_parts = this.left.paint({x:this.x1 - this.left_bar_expand, y:y0}).prev;
		// 右側
		flowchart.context.beginPath();
		flowchart.context.moveTo(this.x2, y0);
		flowchart.context.lineTo(this.x2 + this.right_bar_expand, y0);
		flowchart.context.stroke();
		var right_parts = this.right.paint({x:this.x2 + this.right_bar_expand, y:y0}).prev;
		var y = left_parts.y2;
		if(left_parts.y2 > right_parts.y2)
		{
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

		if(position != null)
		{
			position.y = y;
			if(this.end.next != null) return this.end.next.paint(position);
			return this.end;
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
		code += "もし " + this.condition + " ならば\n";
		if(this.left.next instanceof Parts_Null) code += Parts.makeIndent(indent + 1) + "\n";
		else code += this.left.appendCode('', indent + 1);
		if(!(this.right.next instanceof Parts_Null))
		{
			code += Parts.makeIndent(indent) + "を実行し，そうでなければ\n"
			code += this.right.appendCode('', indent + 1);
		}
		code += Parts.makeIndent(indent);
		code += "を実行する\n";

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

var modal_title,modal_subtitle,modal_values,modal_parts,modal_cancel;

function openModalWindow(title, subtitle, values, parts)
{
	var html = "<p>" + title + "</p>";
	modal_subtitle = subtitle;
	modal_values = values;
	modal_parts = parts;
	modal_cancel = false;
	html += "<table>";
	for(var i = 0; i < modal_subtitle.length; i++)
		html += "<tr><td>" + subtitle[i] + "</td><td><input type=\"text\" " +
			"id=\"inputarea" + i + "\" value=\"" + values[i] + "\" " +
			"onfocus=\"select();\" "+
			"onkeydown=\"keydownModal();\" spellcheck=\"false\"></td></tr>";
	html += "</table>";
	html += "<button type=\"button\" onclick=\"closeModalWindow();\">OK</button>";
	html += "<button type=\"button\" onclick=\"discardModalWindow();\">キャンセル</button>";
	modal_parts.highlight();
	$("#input").html(html);
	$("#input").height(100 + subtitle.length * 30);
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
	modal_cancel = false;
	html += "<table>";
	html += "<tr><td>" + subtitle[0] + "</td><td><input type=\"text\" " +
		"id=\"inputarea0\" value=\"" + values[0] + "\" " +
		"onfocus=\"select();\" "+
		"onkeydown=\"keydownModal();\" spellcheck=\"false\"></td></tr>";
	html += "<tr><td></td><td><input type=\"checkbox\" " +
		"id=\"inputarea1\"" + (values[1] ? " checked=\"checked\"" : "") + ">改行する</td></tr>";
	html += "</table>";
	html += "<button type=\"button\" onclick=\"closeModalWindow();\">OK</button>";
	html += "<button type=\"button\" onclick=\"discardModalWindow();\">キャンセル</button>";
	modal_parts.highlight();
	$("#input").html(html);
	$("#input").height(100 + subtitle.length * 30);
	$("#input-overlay").fadeIn();
	$("#input").fadeIn();
	$("#inputarea0").focus();
}

function closeModalWindow()
{
	for(var i = 0; i < modal_subtitle.length; i++)
	{
		var $j = $("#inputarea" + i);
		if($j.prop("type") == "checkbox") modal_values[i] = $j.prop("checked");
		else modal_values[i] = $j.val();
	}
	$("#input").hide();
	$("#input-overlay").hide();
	modal_parts.unhighlight();
	modal_parts.edited(modal_values); // parts must have function 'edited'
}

function discardModalWindow()
{
	$("#input").hide();
	$("#input-overlay").hide();
	modal_parts.unhighlight();
}

function keydownModal(e)
{
	var evt = e || window.event;
	if(evt.keyCode == 27) // ESC
	{
		modal_cancel = true;
		discardModalWindow();
	}
	else if(evt.keyCode == 13) // Enter
	{
		closeModalWindow();
	}
}
