function Location(first_token, last_token)
{
	this.first_line = first_token.first_line;
	this.first_column = first_token.first_column;
	this.last_line = last_token.last_line;
	this.last_column = last_token.last_column;
}

function Add(x, y, loc){this.left = x; this.right = y; this.loc = loc;}
function Sub(x, y, loc){this.left = x; this.right = y; this.loc = loc;}
function Mul(x, y, loc){this.left = x; this.right = y; this.loc = loc;}
function Div(x, y, loc){this.left = x; this.right = y; this.loc = loc;}
function Mod(x, y, loc){this.left = x; this.right = y; this.loc = loc;}
function Minus(x, loc){this.value = x; this.loc = loc;}
function And(x, y, loc){this.left = x; this.right = y; this.loc = loc;}
function Or(x, y, loc){this.left = x; this.right = y; this.loc = loc;}
function Not(x, loc){this.value = x; this.loc = loc;}
function StringValue(x, loc){this.value = x.substring(1, x.length - 1); this.loc = loc;}
function IntValue(x, loc){this.value = x; this.loc = loc;}
function FloatValue(x, loc){this.value = x; this.loc = loc;}
function BooleanValue(x, loc){this.value = x; this.loc = loc;}
function Identifier(x, loc){this.value = x; this.loc = loc;}
function EQ(x, y, loc){this.left = x; this.right = y; this.loc = loc;}
function NE(x, y, loc){this.left = x; this.right = y; this.loc = loc;}
function GT(x, y, loc){this.left = x; this.right = y; this.loc = loc;}
function LT(x, y, loc){this.left = x; this.right = y; this.loc = loc;}
function GE(x, y, loc){this.left = x; this.right = y; this.loc = loc;}
function LE(x, y, loc){this.left = x; this.right = y; this.loc = loc;}
function Append(x, y, loc){this.left = x; this.right = y; this.loc = loc;}

function Definition(x, type, loc){this.value = x; this.type = type; this.loc = loc;}

function Print(x, ln, loc){this.value = x; this.ln = ln; this.loc = loc;}
function Input(x, loc){this.value = x; this.loc = loc;}
function Assign(x, y, loc){this.left = x; this.right = y; this.loc = loc;}
function If(cond, state1, state2, loc) {this.condition = cond; this.state1 = state1; this.state2 = state2; this.loc = loc;}
function ForInc(varname, begin, end, step, state, loc) 
	{this.varname = varname; this.begin = begin; this.end = end; this.step = step; this.state = state; this.loc = loc;}
function ForDec(varname, begin, end, step, state, loc) 
	{this.varname = varname; this.begin = begin; this.end = end; this.step = step; this.state = state; this.loc = loc;}
function Loop(state, cond, loc) {this.condition = cond; this.state = state; this.loc = loc;} // 終了条件
function While(cond, state, loc) {this.condition = cond; this.state = state; this.loc = loc;}// 継続条件
function LoopBegin(cond, b, loc){this.condition = cond; this.bool = b; this.loc = loc;} // 継続条件
function LoopEnd(cond, b, loc){this.condition = cond; this.bool = b; this.loc = loc;}   // 継続条件

function CallFunction(funcname, parameter, loc){this.func = funcname, this.param = parameter, this.loc = loc;}

var vars = {};
var run_flag = false;
var stack = [];

function reset(textarea)
{
	vars = {};
	textarea.value = '';
	run_flag = false;
	stack = [];
	$(".codelines").children().removeClass("lineselect");
}

function run(parse, textarea, step_flag)
{
	if(!run_flag) 
	{
		reset(textarea);
		stack.push({statementlist: parse, index: 0});
		run_flag = true;
//		getElementById("sourceTextarea").readOnly = true;
	}
	if(step_flag)
	{
		step();
		if(stack.length == 0)
		{
			textarea.value += "---\n";
			run_flag = false;
		}
	}
	else {
		do{
			step();
		}while(stack.length > 0);
		textarea.value += "---\n";
		run_flag = false;
	}
//	_run(parse);

	function step()
	{
		var depth = stack.length - 1;
		var index = stack[depth].index;
		var line = -1;
//		if(!stack[depth].statementlist[index]) return;
		if(stack[depth].statementlist[index]) 
		{
			line = stack[depth].statementlist[index].loc.first_line;
			var type = stack[depth].statementlist[index].constructor.name;
			if(type == 'Definition') index = definition(stack[depth].statementlist,index);
			else if(type == 'Assign') index = assign(stack[depth].statementlist,index);
			else if(type == 'Input') index = input(stack[depth].statementlist,index);
			else if(type == 'Print') index = output(stack[depth].statementlist,index);
			else if(type == 'If') index = ifnode(stack[depth].statementlist,index);
			else if(type == 'ForInc') index = forincnode(stack[depth].statementlist,index);
			else if(type == 'ForDec') index = fordecnode(stack[depth].statementlist,index);
			else if(type == 'Loop') index = loopuntil(stack[depth].statementlist,index);
			else if(type == 'While') index = whileloop(stack[depth].statementlist,index);
			else if(type == 'LoopBegin'){
				if(stack[depth].statementlist[index].condition == null ||
					getValue(stack[depth].statementlist[index].condition).value == stack[depth].statementlist[index].bool) index++;
				else index = stack[depth].statementlist.length;
			}
			else if(type == 'LoopEnd'){
				if(stack[depth].statementlist[index].condition == null ||
					getValue(stack[depth].statementlist[index].condition).value == stack[depth].statementlist[index].bool) index = 0;
				else{
					index = stack[depth].statementlist.length;
				} 
			}
		}
		else index++;
		
		$(".codelines").children().removeClass("lineselect");
		$(".codelines :nth-child("+line+")").addClass("lineselect");
		stack[depth].index = index;
		if(index > stack[depth].statementlist.length) stack.pop();
	}

	function definition(statementlist, index)
	{
		var type = statementlist[index].type;
		var val  = 0;
		if(type == STRINGTYPE) val = '';
		else if(type == BOOLEANTYPE) val = false;
		for(var i = 0; i < statementlist[index].value.length; i++)
		{
			var varname = statementlist[index].value[i];
			if(vars[varname] != undefined) throw new runtimeError(statementlist[index], varname + 'の宣言が重複しています');
			vars[varname] = {value: val, type: type};
		}
		return index + 1;
	}
	
	function assign(statementlist, index)
	{
		var varname = statementlist[index].left;
		var value = getValue(statementlist[index].right);
		if(vars[varname] == undefined) throw new runtimeError(statementlist[index], varname + 'が宣言されていません');
		var type1 = vars[varname].type, type2 = value.type;
		if(type1 == INTTYPE && type2 == FLOATTYPE) vars[varname].value = Math.floor(value.value);
		else vars[varname].value = value.value;
		return index + 1;
	}
	
	function input(statementlist, index)
	{
		var varname = statementlist[index].value;
		if(vars[varname] == undefined) throw new runtimeError(statementlist[index], varname + 'が宣言されていません');
		var type = vars[varname].type;

		var value;
			value = prompt("入力してください");
		if(type == INTTYPE) vars[varname].value = parseInt(value);
		else if(type == FLOATTYPE) vars[varname].value = parseFloat(value);
		else if(type == STRINGTYPE) vars[varname].value = value;
		else vars[varname].value = (value == "true");
		return index + 1;
	}

	function output(statementlist, index)
	{
		var value = String(getValue(statementlist[index].value).value);
		if(statementlist[index].ln) value += "\n";
		textarea.value += value;
		return index + 1;
//		if(o.ln) textarea.value += "\n";
	}

	function ifnode(statementlist, index)
	{
		var condition = getValue(statementlist[index].condition), 
			state1 = statementlist[index].state1, state2 = statementlist[index].state2;
		if(condition.type == BOOLEANTYPE)
		{
//			if(condition.value) _run(state1);
//			else if(state2 != null) _run(state2);
			if(condition.value) stack.push({statementlist: state1, index: 0});
			else if(state2 != null) stack.push({statementlist:state2, index: 0});
		}
		else throw new runtimeError(statementlist[index], "もし〜の構文で条件式が使われていません");
		return index + 1;
	}
	
	function forincnode(statementlist, index)
	{
		var varname = statementlist[index].varname, 
			begin = statementlist[index].begin, 
			end = statementlist[index].end, 
			step = statementlist[index].step, 
			state = statementlist[index].state,
			loc = statementlist[index].loc;
		var token = {first_line: loc.last_line, first_column: loc.last_column,
					 last_line: loc.last_line, last_column: loc.last_column};
		var last_loc = new Location(token, token);
		if(vars[varname] == undefined) throw new runtimeError(statementlist[index], varname + "が宣言されていません");
		assign([{left: varname, right: begin, loc: loc}],0);
		var loop = [new LoopBegin(new LE(new Identifier(varname, loc), end, loc), true, loc)];
		for(var i = 0; i < state.length; i++) loop.push(state[i]);
		loop.push(new Assign(varname, new Add(new Identifier(varname), step, last_loc), last_loc));
		loop.push(new LoopEnd(null, true, last_loc));
		stack.push({statementlist: loop, index: 0});
		return index + 1;
	}

	function fordecnode(statementlist, index)
	{
		var varname = statementlist[index].varname, 
			begin = statementlist[index].begin, 
			end = statementlist[index].end, 
			step = statementlist[index].step, 
			state = statementlist[index].state,
			loc = statementlist[index].loc;
			var token = {first_line: loc.last_line, first_column: loc.last_column,
						 last_line: loc.last_line, last_column: loc.last_column};
			var last_loc = new Location(token, token);
		if(vars[varname] == undefined) throw new runtimeError(statementlist[index], varname + "が宣言されていません");
		assign([{left: varname, right: begin, loc: loc}],0);
		var loop = [new LoopBegin(new GE(new Identifier(varname, loc), end, loc), true, loc)];
		for(var i = 0; i < state.length; i++) loop.push(state[i]);
		loop.push(new Assign(varname, new Sub(new Identifier(varname), step, last_loc), last_loc));
		loop.push(new LoopEnd(null, true, last_loc));
		stack.push({statementlist: loop, index: 0});
		return index + 1;
	}

	function loopuntil(statementlist, index)
	{
		var condition = statementlist[index].condition, state = statementlist[index].state;
		var loc = statementlist[index].loc;
		var token = {first_line: loc.last_line, first_column: loc.last_column,
					 last_line: loc.last_line, last_column: loc.last_column};
		var last_loc = new Location(token, token);
		var loop = [new LoopBegin(null, true, loc)];
		for(var i = 0; i < state.length; i++) loop.push(state[i]);
		loop.push(new LoopEnd(condition, false, last_loc));
		stack.push({statementlist: loop, index: 0});
		return index + 1;
	}
	
	function whileloop(statementlist, index)
	{
		var condition = statementlist[index].condition, state = statementlist[index].state;
		var loc = statementlist[index].loc;
		var token = {first_line: loc.last_line, first_column: loc.last_column,
					 last_line: loc.last_line, last_column: loc.last_column};
		var last_loc = new Location(token, token);
		var loop = [new LoopBegin(condition, true, loc)];
		for(var i = 0; i < state.length; i++) loop.push(state[i]);
		loop.push(new LoopEnd(null, true, last_loc));
		stack.push({statementlist: loop, index: 0});
		return index + 1;
	}

	function getValue(o)
	{
		var type = o.constructor.name;
		if(type == 'Identifier')
		{
			var value = o.value;
			if(vars[value] == undefined) throw new runtimeError(o, value + 'が宣言されていません');
			return {value: vars[value].value, type: vars[value].type};
		}
		else if(type == 'IntValue'){return {value: o.value, type: INTTYPE};}
		else if(type == 'FloatValue'){return {value: o.value, type: FLOATTYPE};}
		else if(type == 'StringValue'){return {value: o.value, type: STRINGTYPE};}
		else if(type == 'BooleanValue'){return {value: o.value, type: BOOLEANTYPE};}
		else if(type == 'Minus')
		{
			var value = getValue(o.value);
			if(value.type == INTTYPE || value.type == FLOATTYPE) return {value: -value.value, type: value.type};
			else throw new runtimeError(o, "数値以外の値にマイナスをつけることはできません");
		}
		else if(type == 'Add')
		{
			var left = getValue(o.left), right = getValue(o.right);
			var type1 = left.type, type2 = right.type;
			if(type1 == BOOLEANTYPE || type2 == BOOLEANTYPE) throw new runtimeError(o, "真偽値の足し算はできません");
			var type = type1 == type2 ? type1 :
					   type1 == STRINGTYPE || type2 == STRINGTYPE ? STRINGTYPE :
					   type1 == FLOATTYPE || type2 == FLOATTYPE ? FLOATTYPE : INTTYPE;
			var rtnv = left.value + right.value;
			if((type == INTTYPE && !Number.isSafeInteger(rtnv)) || (type == FLOATTYPE && !Number.isFinite(rtnv)))
				throw new runtimeError(o, "オーバーフローしました");
			return {value: rtnv, type: type};
		}
		else if(type == 'Mul')
		{
			var left = getValue(o.left), right = getValue(o.right);
			var type1 = left.type, type2 = right.type;
			if(type1 == BOOLEANTYPE || type2 == BOOLEANTYPE) throw new runtimeError(o, "真偽値の掛け算はできません");
			if(type1 == STRINGTYPE || type2 == STRINGTYPE) throw new runtimeError(o, "文字列の掛け算はできません");
			var type = type1 == type2 ? type1 :
					   type1 == FLOATTYPE || type2 == FLOATTYPE ? FLOATTYPE : INTTYPE;
			var rtnv = left.value * right.value;
			if((type == INTTYPE && !Number.isSafeInteger(rtnv)) || (type == FLOATTYPE && !Number.isFinite(rtnv)))
				throw new runtimeError(o, "オーバーフローしました");
			return {value: rtnv, type: type};
		}
		else if(type == 'Sub')
		{
			var left = getValue(o.left), right = getValue(o.right);
			var type1 = left.type, type2 = right.type;
			if(type1 == BOOLEANTYPE || type2 == BOOLEANTYPE) throw new runtimeError(o, "真偽値の引き算はできません");
			if(type1 == STRINGTYPE || type2 == STRINGTYPE) throw new runtimeError(o, "文字列の引き算はできません");
			var type = type1 == type2 ? type1 :
					   type1 == FLOATTYPE || type2 == FLOATTYPE ? FLOATTYPE : INTTYPE;
			var rtnv = left.value - right.value;
			if((type == INTTYPE && !Number.isSafeInteger(rtnv)) || (type == FLOATTYPE && !Number.isFinite(rtnv)))
				throw new runtimeError(o, "オーバーフローしました");
			return {value: rtnv, type: type};
		 }
		 else if(type == 'Div')
		{
			var left = getValue(o.left), right = getValue(o.right);
			var type1 = left.type, type2 = right.type;
			if(type1 == BOOLEANTYPE || type2 == BOOLEANTYPE) throw new runtimeError(o, "真偽値の割り算はできません");
			if(type1 == STRINGTYPE || type2 == STRINGTYPE) throw new runtimeError(o, "文字列の割り算はできません");
			var type = type1 == type2 ? type1 :
					   type1 == FLOATTYPE || type2 == FLOATTYPE ? FLOATTYPE : INTTYPE;
			if(right.value == 0) throw new runtimeError(o, "0で割り算しました");
			if(type != INTTYPE)
			{
				var rtnv = left.value / right.value;
				if(!Number.isFinite(rtnv)) throw new runtimeError(o, "オーバーフローしました");
				return {value: rtnv, type: type};
			}
			else
			{
				var rtnv = Math.floor(left.value / right.value);
				if(!Number.isSafeInteger(rtnv)) throw new runtimeError(o, "オーバーフローしました");
				return {value: rtnv, type: type};
			}
		}
		else if(type == 'Mod')
		{
			var left = getValue(o.left), right = getValue(o.right);
			var type1 = left.type, type2 = right.type;
			if(type1 == INTTYPE && type2 == INTTYPE)
			{
				if(right.value == 0) throw new runtimeError(o, "0で割り算しました");
				return {value: left.value % right.value, type: INTTYPE};
			}
			else throw new runtimeError(o, "余りの計算は整数どうしでしかできません");
		}
		else if(type == 'EQ')
		{
			var left = getValue(o.left), right = getValue(o.right);
			return {value: left.value == right.value, type:BOOLEANTYPE};
		}
		else if(type == 'NE')
		{
			var left = getValue(o.left), right = getValue(o.right);
			return {value: left.value != right.value, type:BOOLEANTYPE};
		}
		else if(type == 'GT')
		{
			var left = getValue(o.left), right = getValue(o.right);
			return {value:left.value > right.value, type:BOOLEANTYPE};
		}
		else if(type == 'LT')
		{
			var left = getValue(o.left), right = getValue(o.right);
			return {value:left.value < right.value, type:BOOLEANTYPE};
		}
		else if(type == 'GE')
		{
			var left = getValue(o.left), right = getValue(o.right);
			return {value:left.value >= right.value, type:BOOLEANTYPE};
		}
		else if(type == 'LE')
		{
			var left = getValue(o.left), right = getValue(o.right);
			return {value:left.value <= right.value, type:BOOLEANTYPE};
		}
		else if(type == 'And')
		{
			var left = getValue(o.left), right = getValue(o.right);
			if(left.type == BOOLEANTYPE && right.type == BOOLEANTYPE)
				return {value: left.value && right.value, type: BOOLEANTYPE};
			else throw new runtimeError(o, "「かつ」は真偽にしか使えません");
		}
		else if(type == 'Or')
		{
			var left = getValue(o.left), right = getValue(o.right);
			if(left.type == BOOLEANTYPE && right.type == BOOLEANTYPE)
				return {value: left.value || right.value, type: BOOLEANTYPE};
			else throw new runtimeError(o, "「または」は真偽にしか使えません");
		}
		else if(type == 'Not')
		{
			var value = getValue(o.value);
			if(value.type == BOOLEANTYPE)
				return {value: !value.value, type: BOOLEANTYPE};
			else throw new runtimeError(o, "「でない」は真偽にしか使えません");
		}
		else if(type == 'Append')
		{
			var left = getValue(o.left), right = getValue(o.right);
			if(left.type != STRINGTYPE) left.value = left.value.toString();
			if(right.type != STRINGTYPE) right.value = right.value.toString();
			return {value: left.value + right.value, type: STRINGTYPE};
		}
		else if(type == 'CallFunction')
		{
			var func = o.func;
			var param = o.param;
			if(func == 'abs')
			{
				if(param.length != 1) throw new runtimeError(o, func + "の引数は1つです");
				var par1 = getValue(param[0]);
				return {value: Math.abs(par1.value), type: par1.type};
			}
			if(func == 'random')
			{
				if(param.length != 1) throw new runtimeError(o, func + "の引数は1つです");
				var par1 = getValue(param[0]);
				return {value: Math.floor(Math.random() * Math.floor(par1.value + 1)), type: INTTYPE};
			}
			if(func == 'ceil')
			{
				if(param.length != 1) throw new runtimeError(o, func + "の引数は1つです");
				var par1 = getValue(param[0]);
				return {value: Math.ceil(par1.value), type: INTTYPE};
			}
			if(func == 'floor')
			{
				if(param.length != 1) throw new runtimeError(o, func + "の引数は1つです");
				var par1 = getValue(param[0]);
				return {value: Math.floor(par1.value), type: INTTYPE};
			}
			if(func == 'round')
			{
				if(param.length != 1) throw new runtimeError(o, func + "の引数は1つです");
				var par1 = getValue(param[0]);
				return {value: Math.round(par1.value), type: INTTYPE};
			}
			if(func == 'int')
			{
				if(param.length != 1) throw new runtimeError(o, func + "の引数は1つです");
				var par1 = getValue(param[0]);
				return {value: par1.value >= 0 ? Math.ceil(par1.value) : Math.floor(par1.value), type: INTTYPE};
			}
			if(func == 'sin')
			{
				if(param.length != 1) throw new runtimeError(o, func + "の引数は1つです");
				var par1 = getValue(param[0]);
				return {value: Math.sin(par1.value), type: FLOATTYPE};
			}
			if(func == 'cos')
			{
				if(param.length != 1) throw new runtimeError(o, func + "の引数は1つです");
				var par1 = getValue(param[0]);
				return {value: Math.cos(par1.value), type: FLOATTYPE};
			}
			if(func == 'tan')
			{
				if(param.length != 1) throw new runtimeError(o, func + "の引数は1つです");
				var par1 = getValue(param[0]);
				return {value: Math.tan(par1.value), type: FLOATTYPE};
			}
			if(func == 'sqrt')
			{
				if(param.length != 1) throw new runtimeError(o, func + "の引数は1つです");
				var par1 = getValue(param[0]);
				return {value: Math.sqrt(par1.value), type: FLOATTYPE};
			}
			if(func == 'log')
			{
				if(param.length != 1) throw new runtimeError(o, func + "の引数は1つです");
				var par1 = getValue(param[0]);
				return {value: Math.log(par1.value), type: FLOATTYPE};
			}
			if(func == 'exp')
			{
				if(param.length != 1) throw new runtimeError(o, func + "の引数は1つです");
				var par1 = getValue(param[0]);
				return {value: Math.exp(par1.value), type: FLOATTYPE};
			}
			if(func == 'pow')
			{
				if(param.length != 2) throw new runtimeError(o, func + "の引数は2つです");
				var par1 = getValue(param[0]);
				var par2 = getValue(param[1]);
				var type = par1.type == INTTYPE && par2.type == INTTYPE ? INTTYPE : FLOATTYPE;
				var rtnv = Math.pow(par1.value, par2.value);
				if(type == INTTYPE && !Number.isSafeInteger(rtnv)) throw new runtimeError(o, "オーバーフローしました");
				if(!Number.isFinite(rtnv)) throw new runtimeError(o, "オーバーフローしました");
				if(par1.value < 0 && !Number.isInteger(par2)) throw new runtimeError(o, "負の数の非整数乗はできません");
				return {value: rtnv, type: type};
			}
			else throw new runtimeError(o, func + "という関数はありません");
		}
	}

	function runtimeError(o, mes)
	{
		this.loc = o.loc;
		this.message = mes;
	}
}
