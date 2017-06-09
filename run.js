"use strict";
// programmed by watayan <watayan@watayan.net>
// use Babel to transpile

var varsInt = {}, varsFloat = {}, varsString = {}, varsBoolean = {};
var stack = [];
var run_flag = false, step_flag = false;
var parse = null;
var textarea = null;

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
	constructor(loc)
	{
		super(null, loc);
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
		if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型の足し算はできません");
		let v = v1.value + v2.value;
		if(v1 instanceof StringValue || v2 instanceof StringValue) return new StringValue(v, this.loc);
		if(v1 instanceof IntValue && v2 instanceof IntValue)
		{
			if(!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
			return new IntValue(v, this.loc);
		}
		else
		{
			if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
			return new FloatValue(v, this.loc);
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
		if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型の引き算はできません");
		let v = v1.value - v2.value;
		if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の引き算はできません");
		if(v1 instanceof IntValue && v2 instanceof IntValue)
		{
			if(!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
			return new IntValue(v, this.loc);
		}
		else
		{
			if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
			return new FloatValue(v, this.loc);
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
		if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型のかけ算はできません");
		if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のかけ算はできません");
		let v = v1.value * v2.value;
		if(v1 instanceof IntValue && v2 instanceof IntValue)
		{
			if(!isSafeInteger(v)) throw new RuntimeError(this.first_line, "整数で表される範囲を越えました");
			return new IntValue(v, this.loc);
		}
		else
		{
			if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
			return new FloatValue(v, this.loc);
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
		if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型のわり算はできません");
		if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のわり算はできません");
		if(v2.value == 0) throw new RuntimeError(this.first_line, "0でわり算をしました");
		if(v1 instanceof IntValue && v2 instanceof IntValue)
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

class Mod extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
	}
	getValue()
	{
		let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
		if(v1 instanceof IntValue && v2 instanceof IntValue)
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
		let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
		if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) return new BooleanValue(v1.value && v2.value, this.loc);
		else throw new RuntimeError(this.first_line, "「かつ」は真偽値にしか使えません");
	}
}

class Or extends Value
{
	constructor(x, y, loc){super([x,y],loc);}
	getValue()
	{
		let v1 = this.value[0].getValue(), v2 = this.value[1].getValue();
		if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) return new BooleanValue(v1.value || v2.value, this.loc);
		else throw new RuntimeError(this.first_line, "「または」は真偽値にしか使えません");
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
				else if(v instanceof FloatValue) ag[i] = Math.round(v.value);
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
		else if(varsString[vn] != undefined) return new StringValue(varsString[n], this.loc);
		else if(varsBoolean[vn] != undefined) return new BooleanValue(varsBoolean[vn], this.loc);
		else throw new RuntimeError(this.first_line, "変数" + vn + "は宣言されていません");
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
			if(par1 instanceof IntValue) return new IntValue(Math.abs(par1.value), this.loc);
			else if(par1 instanceof FloatValue) return new FloatValue(Math.abs(par1.value), this.loc);
			else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
		}
		if(func == 'random')
		{
			if(param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
			var par1 = param[0].getValue();
			if(par1 instanceof IntValue) return new IntValue(Math.floor(Math.random() * Math.floor(par1.value + 1)), this.loc);
			else throw new RuntimeError(this.first_line, func + "は整数にしか使えません");
		}
		if(func == 'ceil')
		{
			if(param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
			var par1 = param[0].getValue();
			if(par1 instanceof IntValue) return par1;
			else if(par1 instanceof FloatValue) return new IntValue(Math.ceil(par1.value), this.loc);
			else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
		}
		if(func == 'floor')
		{
			if(param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
			var par1 = param[0].getValue();
			if(par1 instanceof IntValue) return par1;
			else if(par1 instanceof FloatValue) return new IntValue(Math.floor(par1.value), this.loc);
			else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
		}
		if(func == 'round')
		{
			if(param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
			var par1 = param[0].getValue();
			if(par1 instanceof IntValue) return par1;
			else if(par1 instanceof FloatValue) return new IntValue(Math.round(par1.value), this.loc);
			else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
		}
		if(func == 'int')
		{
			if(param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
			var par1 = param[0].getValue();
			if(par1 instanceof IntValue) return par1;
			else if(par1 instanceof FloatValue)	return new IntValue(par1.value < 0 ? Math.ceil(par1.value) : Math.floor(par1.value), this.loc);
			else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
		}
		if(func == 'sin')
		{
			if(param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
			var par1 = param[0].getValue();
			if(par1 instanceof IntValue || par1 instanceof FloatValue) return new FloatValue(Math.sin(par1.value), this.loc);
			else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
		}
		if(func == 'cos')
		{
			if(param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
			var par1 = param[0].getValue();
			if(par1 instanceof IntValue || par1 instanceof FloatValue) return new FloatValue(Math.cos(par1.value), this.loc);
			else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
		}
		if(func == 'tan')
		{
			if(param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
			var par1 = param[0].getValue();
			if(par1 instanceof IntValue || par1 instanceof FloatValue) 
			{
				let v = Math.tan(par1.value);
				if(isFinite(v)) return new FloatValue(Math.tan(par1.value), this.loc);
				else throw new RuntimeError(this.first_line, "オーバーフローしました");
			}
			else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
		}
		if(func == 'sqrt')
		{
			if(param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
			var par1 = param[0].getValue();
			if(par1 instanceof IntValue || par1 instanceof FloatValue)
			{
				if(par1.value < 0) throw new RuntimeError(this.first_line, "負の数のルートを求めようとしました");
			 	return new FloatValue(Math.sqrt(par1.value), this.loc);
			}
			else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
		}
		if(func == 'log')
		{
			if(param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
			var par1 = param[0].getValue();
			if(par1 instanceof IntValue || par1 instanceof FloatValue)
			{
				if(par1.value <= 0) throw new RuntimeError(this.first_line, "正でない数の対数を求めようとしました");
				let v = Math.log(par1.value);
				if(isFinite(v)) return new FloatValue(v, this.loc);
				throw new RuntimeError(this.first_line, "オーバーフローしました");			
			}
			else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
		}
		if(func == 'exp')
		{
			if(param.length != 1) throw new RuntimeError(this.first_line, func + "の引数は1つです");
			var par1 = param[0].getValue();
			if(par1 instanceof IntValue || par1 instanceof FloatValue)
			{
				let v = Math.exp(par1.value);
				if(isFinite(v)) return new FloatValue(v, this.loc);
				throw new RuntimeError(this.first_line, "オーバーフローしました");			
			}
			else throw new RuntimeError(this.first_line, func + "は数値にしか使えません");
		}
		if(func == 'pow')
		{
			if(param.length != 2) throw new RuntimeError(this.first_line, func + "の引数は2つです");
			var par1 = param[0].getValue();
			var par2 = param[1].getValue();
			if(par1 instanceof IntValue && par2 instanceof IntValue && par2.value >= 0)
			{
				if(par1.value == 0 && par2.value <= 0) throw new RuntimeError(this.first_line, "0は正の数乗しかできません");
				let v = Math.pow(par1.value, par2.value);
				if(isSafeInteger(v)) return new IntValue(v, this.loc);
				else throw new RuntimeError(this.first_line, "オーバーフローしました");
			}
			if((par1 instanceof IntValue || par1 instanceof FloatValue) && (par2 instanceof IntValue || par2 instanceof FloatValue))
			{
				if(par1.value < 0 && !Number.isInteger(par2.value)) throw new RuntimeError(this.first_line, "負の数の非整数乗はできません");
				if(par1.value == 0 && par2.value <= 0) throw new RuntimeError(this.first_line, "0は正の数乗しかできません");
				let v = Math.pow(par1.value, par2.value);
				if(isFinite(v)) return new FloatValue(v, this.loc);
				else throw new RuntimeError(this.first_line, "オーバーフローしました");
			}
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
				for(var j = 0; j < parameter.length; j++) args[j] = 0;
				while(args)
				{
					varsInt[varname + '[' + args.join(',') + ']'] = 0;
					let k = 0;
					do {
						if(k < args.length)
						{
							args[k]++;
							if(args[k] > parameterlist[k]) args[k++] = 0;
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
				for(var j = 0; j < parameter.length; j++) args[j] = 0;
				while(args)
				{
					varsFloat[varname + '[' + args.join(',') + ']'] = 0;
					let k = 0;
					do {
						if(k < args.length)
						{
							args[k]++;
							if(args[k] > parameterlist[k]) args[k++] = 0;
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
				for(var j = 0; j < parameter.length; j++) args[j] = 0;
				while(args)
				{
					varsString[varname + '[' + args.join(',') + ']'] = '';
					let k = 0;
					do {
						if(k < args.length)
						{
							args[k]++;
							if(args[k] > parameterlist[k]) args[k++] = 0;
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
				for(var j = 0; j < parameter.length; j++) args[j] = 0;
				while(args)
				{
					varsBoolean[varname + '[' + args.join(',') + ']'] = false;
					let k = 0;
					do {
						if(k < args.length)
						{
							args[k]++;
							if(args[k] > parameterlist[k]) args[k++] = 0;
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
		let vn = this.varname.varname;
		let vl = this.val.getValue();
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
		else throw new RuntimeError(this.first_line, vn + "は宣言されていません");
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
			else throw new RuntimeError(this.first_line, vn + "は宣言されていません");
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
		textarea.value += this.value.getValue().value + (this.ln ? "\n" : "");
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

function highlightLine(l)
{
	$(".codelines").children().removeClass("lineselect");
	if(l > 0) $(".codelines :nth-child("+l+")").addClass("lineselect");
}

function reset()
{
	varsInt = {}, varsFloat = {}, varsString = {}, varsBoolean = {};
	textarea.value = '';
	setRunflag(false);
	parse = null;
	stack = [];
	highlightLine(-1);
}

function setRunflag(b)
{
	run_flag = b;
	document.getElementById("sourceTextarea").readOnly = b;
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
			setRunflag(true);
		}
		catch(e)
		{
			textarea.value += "構文エラーです\n" + e.message + "\n";
			setRunflag(false);
			parse = null;
			return;
		}
	}
	if(step_flag)
	{
		step();
		if(stack.length == 0)
		{
			textarea.value += "---\n";
			highlightLine(-1);
			setRunflag(false);
			parse = null;
		}
	}
	else {
		do{
			step();
		}while(stack.length > 0 && run_flag);
		if(stack.length == 0)
		{
			textarea.value += "---\n";
			highlightLine(-1);
			setRunflag(false);
			parse = null;
		}
	}

	function step()
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
				textarea.value += "実行時エラーです\n" + 
				e.line + "行目:" + e.message+"\n";
				setRunflag(false);
				parse = null;
			}
		}
		else index++;
		if(index < 0) index = stack[depth].statementlist.length;
		
		stack[depth].index = index;
		if(index > stack[depth].statementlist.length) stack.pop();
		// ハイライト行は次の実行行
		depth = stack.length - 1;
		if(depth < 0) return;
		index = stack[depth].index;
		var statement = stack[depth].statementlist[index];
		if(statement)
		{
			var line = statement.first_line;
			highlightLine(line);
		}
	}
}

function openInputWindow()
{
	var $input = $("#input");
	var $input_overlay = $("#input-overlay");
	$input_overlay.fadeIn();
	$input.fadeIn();
	$input.html("<p>入力してください</p><input type=\"text\" id=\"inputarea\">");
	var inputarea = document.getElementById("inputarea");
	if(inputarea.addEventListener) inputarea.addEventListener("keydown", keydown);
	else if(inputarea.attachEvent) inputarea.attachEvent("onkeydown", keydown);
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
	var evt = e || window.event;
	if(evt.keyCode == 13) 
	{
		setRunflag(true);
		setTimeout(run(), 100);
	}
}


function editButton(add_cord)
{
	var sourceTextArea = document.getElementById("sourceTextarea");
	var pos = sourceTextArea.selectionStart;
	var cord = sourceTextArea.value;
	var cord1 = cord.slice(0, pos);
	var cord2 = cord.slice(pos, cord.length);
	var re1 = /[｜| 　]*$/;
	var re2 = /[｜| 　\n]/;
	var add_cords = add_cord.split("\n");
	var tab = "";
	var array = re1.exec(cord1);
	if(array != null) tab = array[0];
//	console.log("["+cord[pos]+"]");
	if((cord[pos] && cord[pos] != "\n") || (pos > 0 && !re2.exec(cord[pos - 1])))
	{
		alert("この位置で入力支援ボタンを押してはいけません");
		sourceTextArea.focus();
		return;
	}
	for(var c in add_cords) if(c > 0) add_cords[c] = tab + add_cords[c];
	sourceTextArea.value = cord1 + add_cords.join("\n") + cord2;
	sourceTextArea.selectionStart = sourceTextArea.selectionEnd = sourceTextArea.value.length - cord2.length;
	sourceTextArea.focus();
}

function keyUp(e)
{
	var evt = e || window.event;
	var sourceTextArea = document.getElementById("sourceTextarea");
	var pos = sourceTextArea.selectionStart;
	var cord = sourceTextArea.value;
	var cord1 = cord.slice(0, pos);
	var cord2 = cord.slice(pos, cord.length);
	var re1 = /《[^》《]*$/;
	var re2 = /^[^》《]*》/;
	var re3 = /\n?([｜|]*)([^｜|\n]*?)\n$/;
	var re4 = /(ならば|なければ|(の間|繰り返し|繰返し|(増|減)やし(ながら|つつ))[，,、])$/;
	var re5 = /^\n/;
	var tab = "";
	switch(evt.keyCode)
	{
	case 39:	// ->
		if(pos > 0 && cord[pos - 1] == "《")
		{
			var match = re2.exec(cord2);
			if(match != null)
			{
				sourceTextArea.setSelectionRange(pos - 1, pos + match[0].length + 1);
				return false;
			}
		}
		break;
	case 37:	// <-
		if(cord[pos] == "》")
		{
			var match = re1.exec(cord1);
			if(match != null)
			{
				sourceTextArea.setSelectionRange(pos - match[0].length, pos + 1);
				return false;
			}
		}
		break;
	case 13:	// \n
		if(!re5.exec(cord2)) return true;
		var match = re3.exec(cord1);
		if(match)
		{
			 tab = match[1] ;
			 if(re4.exec(match[2])) tab = "｜" + tab;
		}
		sourceTextArea.value = cord1 + tab + cord2;
		pos = cord1.length + tab.length;
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
	var cord = sourceTextArea.value;
	var cord1 = cord.slice(0, pos);
	var cord2 = cord.slice(pos, cord.length);
	var re1 = /《[^》《]*$/;
	var re2 = /^[^》《]*》/;
	var match1 = re1.exec(cord1);
	var match2 = re2.exec(cord2);
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

var sample=[
"「整数と実数の違い」を表示する\n"+
"11.0/2*2を表示する\n"+
"11/2*2を表示する"
,
"整数 a,b\n"+
"b←random(8)+1\n"+
"「1から9の数字を当ててください」を表示する\n"+
"繰り返し，\n"+
"｜aを入力する\n"+
"｜aを表示する\n"+
"｜もしa>bならば\n"+
"｜｜「大きい」を表示する\n"+
"｜を実行し，そうでなければ\n"+
"｜｜もしa<bならば\n"+
"｜｜｜「小さい」を表示する\n"+
"｜｜を実行する\n"+
"｜を実行する\n"+
"を，a=bになるまで実行する\n"+
"「あたり」を表示する"
,
"整数 a,b,c[5]\n"+
"「サイコロを60回振って出た目の回数を数えるシミュレーション」を表示する\n"+
"aを1から60まで1ずつ増やしながら，\n"+
"｜b←random(5)\n"+
"｜c[b]←c[b]+1\n"+
"を繰り返す\n"+
"bを0から5まで1ずつ増やしながら，\n"+
"｜c[b]を表示する\n"+
"を繰り返す"
,
"整数 a,b\n"+
"a←1\n"+
"bを1から100まで1ずつ増やしながら，\n"+
"｜a←a*b\n"+
"｜bと「!=」とaを表示する\n"+
"を繰り返す"
];

onload = function(){
	var sourceTextArea = document.getElementById("sourceTextarea");
	var resultTextArea = document.getElementById("resultTextarea");
	var parseButton   = document.getElementById("parseButton");
	var newButton     = document.getElementById("newButton");
	var runButton     = document.getElementById("runButton");
	var resetButton   = document.getElementById("resetButton");
	var stepButton    = document.getElementById("stepButton");
	var loadButton    = document.getElementById("loadButton");
	var file_prefix   = document.getElementById("file_prefix");
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
		step_flag = false;
		run();
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
	if(sourceTextArea.addEventListener) sourceTextArea.addEventListener("keyup", keyUp);
	else if(sourceTextArea.attachEvent) sourceTextArea.attachEvent("onkeyup", keyUp);
}
