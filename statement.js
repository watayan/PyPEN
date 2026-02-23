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
		if(!(this._loc instanceof Location)) throw new Error("StatementのlocがLocationではありません" + constructor_name(this));
	}
	get first_line() {return this._loc.first_line;}
	get last_line() {return this._loc.last_line;}
	get loc(){return this._loc;}
	getLoc(){return this._loc;}
	run(){throw new RuntimeError(this.first_line, "これを呼んではいけない");}
	/**
	 * 
	 * @param {number} indent 
	 */
	argsPython(indent)
	{
		return makeIndent(indent);
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
	argsPython(indent)
	{
		var code = makeIndent(indent);
		code += "break";
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
	argsPython(indent)
	{
		var code = "def ";
		code += this.funcName + '(';
		for(var i = 0; i < this.params.length; i++)
		{
			if(i > 0) code += ', ';
			code += this.params[i].argsPython(indent);
		}
		code += '):';
		code = [code];
		var codes = 0;
		for(var i = 0; i < this.statementlist.length; i++)
			if(this.statementlist[i])
			{
				codes = 1;
				code.push(this.statementlist[i].argsPython(indent + 1));
			}
		if(codes == 0) code.push(makeIndent(1) + "pass");
		return code.join("\n");
	}
}

/**
 * 関数から値を返す
 */
class ReturnStatement extends Statement {
	constructor(value, loc) {
		super(loc);
		this.value = value;
		this.caller = null;
		this.flag = false;
		this.state = 0;
	}
	clone()
	{
		let rtnv = new ReturnStatement(this.value.clone(), this.loc);
		// rtnv.caller  = this.caller;
		// rtnv.flag  = this.flag;
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
	argsPython(indent)
	{
		var code = makeIndent(indent);
		code += "return";
		if(this.value) code += ' ' + this.value.argsPython();
		return code;
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
		textareaAppend(vars[i] + ":" + valueString(v) + "\n");
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
	argsPython()
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
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: [this.variable, this.value], index: 0});
			this.state = 1;
		}
		else
		{
			if(!(this.variable.getValue() instanceof ArrayValue && this.value.getValue() instanceof Value)) throw new RuntimeError(this.first_line, "追加される値はリストです");
			code[0].stack[0].index++;
			this.variable.getValue().append(this.value.getValue());
			this.state = 0;
		}
	}
	argsPython(indent)
	{
		var code = makeIndent(indent);
		code += this.variable.argsPython() + ".push(" + this.value.argsPython() + ")";
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
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: [this.variable, this.value], index: 0});
			this.state = 1;
		}
		else
		{
			if(!(this.variable.getValue() instanceof ArrayValue && this.value.getValue() instanceof ArrayValue)) throw new RuntimeError(this.first_line, "リストどうしでないと連結できません");
			code[0].stack[0].index++;
			var a = [];	// 自分への連結対策
			for(var i of this.value.getValue()._value) a.push(i.getValue());
			this.variable.getValue().extend(a);
			this.state = 0;
		}
	}
	argsPython(indent)
	{
		var code = makeIndent(indent);
		code += this.variable.argsPython() + ".extend(" + this.value.argsPython() + ")";
		return code;
	}
}

class Input extends Statement
{
	constructor(x, type,loc)
	{
		super(loc);
		if(!(x instanceof Variable || x instanceof UNDEFINED))throw new RuntimeError(loc.first_line, "入力されるものは変数でなくてはいけません");
		this.variable = x;
		this.type = type;
		this.state = 0;
	}
	clone()
	{
		return new Input(this.variable.clone(), this.type, this.loc);
	}
	run()
	{
		if(selected_quiz < 0)	// 通常時
		{
			code[0].stack[0].index++;
			if(this.variable instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");
			var list = [new InputBegin(this.loc), new InputEnd(this.variable, this.type, this.loc)];
			code[0].stack.unshift({statementlist: list, index: 0});
		}
		else	// 自動採点時
		{
			if(this.state == 0)
			{
				if(this.variable.args) code[0].stack.unshift({statementlist: this.variable.args, index: 0});
				this.state = 1;
			}
			else
			{
				code[0].stack[0].index++;
				if(selected_quiz_input < Quizzes[selected_quiz].inputs(selected_quiz_case).length)
				{
					if(this.variable instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");
					let va = new Variable(this.variable.varname, this.loc);
					let vl = Quizzes[selected_quiz].inputs(selected_quiz_case)[selected_quiz_input++];
					// va.run();
					var v = null;
					if(this.type == typeOfValue.typeInt)
					{
						var v0 = BigInt(toHalf(vl, this.loc));
						v = new IntValue([v0], this.loc, v0);
					}
					else if(this.type == typeOfValue.typeFloat)
					{
						var v0 = Number(toHalf(vl, this.loc));
						v = new FloatValue([v0], this.loc, v0);
					}
					else if(this.type == typeOfValue.typeString) 
					{
						var v0 = vl + '';
						v = new StringValue([v0], this.loc, v0);
					}
					else if(this.type == typeOfValue.typeBoolean) 
					{
						var v0 = toBool(vl);
						v = new BooleanValue([v0], this.loc, v0);
					}
					if(v !== null)
					{
						var assign = new Assign(this.variable, v, null, this.loc);
						code[0].stack.unshift({statementlist: [assign], index: 0});
					}
					else throw new RuntimeError(this.first_line, '不明な型です。');
				}
				else throw new RuntimeError(this.first_line, '必要以上の入力を求めています。');
				this.state = 0;
			}
		}
	}
	argsPython(indent)
	{
		var code = makeIndent(indent);
		code += this.variable.argsPython() + " = ";
		switch(this.type)
		{
			case typeOfValue.typeInt: code += "int(input())"; break;
			case typeOfValue.typeFloat: code += "float(input())"; break;
			case typeOfValue.typeString: code += "input()"; break;
			case typeOfValue.typeBoolean: code += "bool(input())"; break;
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
				if(this.type == typeOfValue.typeInt)assign = new Assign(this.varname, new IntValue([toHalf(vl, this.loc)], this.loc,toHalf(vl, this.loc), null, this.loc));
				else if(this.type == typeOfValue.typeFloat)assign = new Assign(this.varname, new FloatValue([Number(toHalf(vl, this.loc))], this.loc, Number(toHalf(vl, this.loc))), null, this.loc);
				else if(this.type == typeOfValue.typeString) assign = new Assign(this.varname, new StringValue([vl + ''], this.loc, vl + ''), null, this.loc);
				else if(this.type == typeOfValue.typeBoolean) assign = new Assign(this.varname, new BooleanValue([toBool(vl)], this.loc, toBool(vl)), null, this.loc);
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
	argsPython(indent)
	{
		return makeIndent(indent) + "print()";
	}
}

/**
 * 
 * @param {*} v 
 * @param {*} flag 
 * @returns 
 */
function array2text(v, flag = false)	// flag: 文字列に''をつける
{
	if(!v) return '';
	if(v instanceof Value)
	{
		if(v instanceof ArrayValue)
		{
			let v1 = [];
			for(let i = 0; i < v.length; i++)
			{
				var tmp = v._value[i];
				v1.push(array2text(tmp, flag));

			}
			return '[' + v1.join(',') + ']';
		}
		else if(v instanceof DictionaryValue)
		{
			let v1 = [];
			let keys = v.getValue().keys();
			for(let key of keys) 
			{
				var val = v.getValue(key);
				if(typeof key === "string") key = "'" + key + "'";
				v1.push(key + ':' + array2text(val, flag));
			}
			return '{' + v1.join(',') + '}';
		}
		else if(v instanceof BooleanValue) return v.getValue() ? 'True' : 'False';
		else if(v instanceof FloatValue && isInteger(v.getValue()) && !v.getValue().toString().match(/[Ee]/)) return v.getValue() + '.0';
		else if(flag && v instanceof StringValue) return new String("'" + v.getValue() + "'");
		else return v.getValue();
	}
	else return new String(v);
}

function array2code(v, flag = false)	// flag: 文字列に''をつける
{
	if(!v) return '';
	if(v instanceof ArrayValue)
	{
		let v1 = [];
		for(let i = 0; i < v.length; i++) 
			v1.push(array2text(v.getValue(i).getCode(), flag));
		return '[' + v1.join(',') + ']';
	}
	else if(v instanceof DictionaryValue)
	{
		let v1 = [];
		let keys = v.getValue().keys();
		for(let key of keys) 
		{
			var val = v.getValue().get(key);
			// key = key.rtnv;
			// while(key instanceof Value) key = key.value;
			if(typeof key === "string") key = "'" + key + "'";
			v1.push(key + ':' + array2text(val.value, flag));
		}
		return '{' + v1.join(',') + '}';
	}
	else if(flag && v instanceof StringValue) return "'" + v.getValue() + "'";
	else if(v instanceof FloatValue && isInteger(v.getValue()) && !v.getValue().toString().match(/[Ee]/)) return v.getValue() + '.0';
	return v.getValue().toString();
}

function val2obj(val)
{
	if(val instanceof ArrayValue)
	{
		var rtnv = [];
		var l = val.getValue().value.length;
		for(var i = 0; i < l; i++) rtnv.push(val2obj(val.getValue().value[i]));
		return rtnv;
	}
	else if(val instanceof DictionaryValue)
	{
		var rtnv = {};
		for(var key of val.getValue().value.keys())
			rtnv[key] = val2obj(val.getValue().value.get(key).getValue());
		return rtnv;
	}
	else if(val instanceof IntValue)return Number(val.rtnv);
	else return val.rtnv;
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
			if(val instanceof IntValue) rtnv1.push(Number(val.getValue()));
			else rtnv1.push(val.getValue());
		}
		rtnv.push(rtnv1);
	}
	return rtnv;
}


class Output extends Statement
{
	/**
	 * 
	 * @param {ArrayValue<Value>} x 
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
			// code[0].stack.unshift({statementlist: [this.value], index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let s = '';
			for(var i = 0; i < this.value.length; i++)
			{
				s += (i > 0 ? ' ' : '') + valueString(this.value[i].getValue());
			}
			if(this.ln)	s += '\n';
			if(selected_quiz < 0) textareaAppend(s);
			else output_str += s;
			this.state = 0;
		}
	}
	argsPython(indent)
	{
		var code = makeIndent(indent);
		code += "print(";
		for(var i = 0; i < this.value.length; i++)
			code += (i > 0 ? ', ' : '') + this.value[i].argsPython();
		if(!this.ln) code += ",end=''";
		return code + ")";
	}
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
			for(var j = 0; j < this.blocks[i][1].length; j++) 
				if(this.blocks[i][1][j]) newblock1.push(this.blocks[i][1][j].clone());
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
				if(this.blocks[this.running] && this.blocks[this.running][0])
					code[0].stack.unshift({statementlist: [this.blocks[this.running][0]], index: 0});
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
			var flag = this.blocks[this.running][0] ? 
				toBool(this.blocks[this.running][0].getValue()) : 
				true;
			if(flag)
			{
				code[0].stack[0].index++;
				this.state = 0;
				code[0].stack.unshift({statementlist: this.blocks[this.running][1], index: 0});
				// if(debug_mode)
				// {
				// 		textareaAppend("DEBUG: If block " + this.running + " is executed\n");
				// 	for(var i of this.blocks[this.running][1]) textareaAppend("DEBUG:   " + constructor_name(i) + "\n");
				// }
			}
			else
			{
				this.running++;
				this.state = 1;
			}
		}
	}
	argsPython(indent)
	{
		var code = [];
		for(var i = 0; i < this.blocks.length; i++)
		{
			if(i == 0) code.push(makeIndent(indent) + "if " + this.blocks[i][0].argsPython() + ":");
			else if(this.blocks[i][0]) code.push(makeIndent(indent) + "elif " + this.blocks[i][0].argsPython(0) + ":");
			else code.push(makeIndent(indent) + "else:");
			if(this.blocks[i][1] && this.blocks[i][1].length > 0)
			{
				for(var j = 0; j < this.blocks[i][1].length; j++)
					code.push(this.blocks[i][1][j].argsPython(indent + 1));
			}	
			else code.push(makeIndent(indent + 1) + "pass");
		}
		return code.join("\n");
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
			if(!this.condition || toBool(this.condition.getJSValue()) == this.continuous) 
				code[0].stack[0].index++;
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
			if(!this.condition || toBool(this.condition.getJSValue()) == this.continuous) code[0].stack[0].index = 0;
			else code[0].stack[0].index = -1;
			this.state = 0;
		}
	}
}

class LoopBody extends Statement
{
	constructor(statementlist, loc)
	{
		super(loc);
		this.statementlist = statementlist;
	}
	clone()
	{
		var state = [];
		for(var i = 0; i < this.statementlist.length; i++) 
			if(this.statementlist[i]) state.push(this.statementlist[i].clone());
		return new LoopBody(state, this.loc);
	}
	run()
	{
		code[0].stack[0].index++;
		var state = [];
		for(var i = 0; i < this.statementlist.length; i++) 
			if(this.statementlist[i]) state.push(this.statementlist[i].clone());
		code[0].stack.unshift({statementlist: state, index: 0});
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
		this.statementlist = [];
		for(var statement of statementlist) this.statementlist.push(statement.clone());
	}
	clone()
	{
		var state = [];
		for(var i = 0; i < this.statementlist.length; i++) 
			if(this.statementlist[i]) state.push(this.statementlist[i].clone());
		return new ForIn(this.array.clone(), this.variable.clone(), state, this.loc);
	}
	argsPython(indent)
	{
		var code = [makeIndent(indent)];
		var pa = this.array.argsPython(), pv = this.variable.argsPython();
		code.push("for " + pv + " in " + pa + ":");
		var codes = 0;
		for(var i = 0; i < this.statementlist.length; i++)
			if(this.statementlist[i])
			{
				codes = 1;
				code.push(this.statementlist[i].argsPython(indent + 1));
			}
		if(codes == 0) code.push(makeIndent(indent + 1) + "pass");
		return code.join("\n");
	}
	run()
	{
		if(this.variable instanceof UNDEFINED) 
			throw new RuntimeError(this.loc.first_line, "未完成のプログラムです");
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: [this.array], index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let loop = [new ForIn_step(this, this.variable, this.array.getValue(), this.loc), 
				new LoopBegin(new BooleanValue([true], this.loc, true), true, this.loc),
				new LoopBody(this.statementlist, this.loc),
				new LoopEnd(null, true, this.loc)
			];
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
		return new ForIn_step(this.forin.clone(), this.variable.clone());
		// , this.array.clone(), this.loc);
	}
	run()
	{
		code[0].stack[0].index++;
		if(this.index < this.array.valueLength())
		{
			let assign = new Assign(this.variable, this.array.getValue(this.index++), null, this.loc);
			code[0].stack.unshift({statementlist: [assign], index: 0});
		}
		else
		{
			code[0].stack[0].statementlist[1] = 
			new LoopBegin(new BooleanValue([false], this.loc, false),true, this.loc);
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
	constructor(variable, begin, end, step, statementlist,loc)
	{
		super(loc);
		if(!(variable instanceof Variable || variable instanceof UNDEFINED)) throw new RuntimeError(loc.first_line, "繰り返しのカウンタは変数でなくてはいけません");
		this.variable = variable;
		this.begin = begin;
		this.end = end;
		this.step = step;
		this.statementlist = statementlist;
		this.state = 0;
	}
	clone()
	{
		var state = [];
		for(var i = 0; i < this.statementlist.length; i++) 
			if(this.statementlist[i]) state.push(this.statementlist[i].clone());
		return new ForInc(this.variable.clone(), this.begin.clone(), this.end.clone(), this.step.clone(), state, this.loc);
	}
	argsPython(indent)
	{
		var code = [];
		var pv = this.variable.argsPython(), pb = this.begin.argsPython(), pe = this.end.argsPython(), ps = this.step.argsPython();
		code.push(makeIndent(indent) + "for " + pv + " in range(" + pb + ", " + pe + "+1, " + ps + ")");
		var codes = 0;
		for(var i = 0; i < this.statementlist.length; i++)
			if(this.statementlist[i])
			{
				codes = 1;
				code.push(this.statementlist[i].argsPython(indent + 1));
			}
		if(codes == 0) code.push(makeIndent(indent + 1) + "pass");
		return code.join("\n");
	}
	run()
	{
		if(this.variable instanceof UNDEFINED) 
			throw new RuntimeError(this.first_line, "未完成のプログラムです");
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: [new Assign(this.variable, this.begin, null, this.loc)], index: 0});
			code[0].stack.unshift({statementlist: [this.begin, this.end, this.step], index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			if(this.step.getJSValue() <= 0) throw new RuntimeError(this.first_line, '増分は0より大きい値である必要があります');
			if(this.begin.getValue() instanceof IntValue || this.begin.getValue() instanceof FloatValue)
			{
				// let variable = new Variable(this.variable.varname, this.variable.args,this.loc);
				let condition = new Compare([this.variable,'<=', this.end], this.loc);	// IncとDecの違うところ
				let loop = [this.variable, condition, new LoopBegin(condition, true, this.loc)];
				loop.push(new LoopBody(this.statementlist, this.loc));
				// for(let i = 0; i < this.statementlist.length; i++)
				// 	if(this.statementlist[i]) loop.push(this.statementlist[i].clone());
				loop.push(this.step);
				loop.push(new Assign(this.variable, this.step, '+', this.loc));	// IncとDecの違うところ
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
	/**
	 * @constructor
	 * @param {Variable} varname 
	 * @param {Value} begin 
	 * @param {Value} end 
	 * @param {Value} step 
	 * @param {Array<Statement>} statementlist 
	 * @param {Location} loc 
	 */
	constructor(variable, begin, end, step, statementlist,loc)
	{
		super(loc);
		if(!(variable instanceof Variable || variable instanceof UNDEFINED)) throw new RuntimeError(loc.first_line, "繰り返しのカウンタは変数でなくてはいけません");
		this.variable = variable;
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
		return new ForDec(this.variable.clone(), this.begin.clone(), this.end.clone(), this.step.clone(), state, this.loc);
	}
	argsPython(indent)
	{
		var code = [];
		var pv = this.variable.argsPython(), pb = this.begin.argsPython(), pe = this.end.argsPython(), ps = this.step.argsPython();
		code.push(makeIndent(indent) + "for " + pv + " in range(" + pb + ", " + pe + "-1, " + ps + "):");
		var codes = 0;
		for(var i = 0; i < this.statementlist.length; i++)
			if(this.statementlist[i])
			{
				codes = 1;
				code.push(this.statementlist[i].argsPython(indent + 1));
			}
		if(codes == 0) code.push(makeIndent(indent + 1) + "pass");
		return code.join("\n");
	}
	run()
	{
		if(this.variable instanceof UNDEFINED) throw new RuntimeError(this.first_line, "未完成のプログラムです");
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: [new Assign(this.variable, this.begin, null, this.loc)], index: 0});
			code[0].stack.unshift({statementlist: [this.begin, this.end, this.step], index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			if(this.step.getJSValue() <= 0) throw new RuntimeError(this.first_line, '減分は0より大きい値である必要があります');
			if(this.begin.getValue() instanceof IntValue || this.begin.getValue() instanceof FloatValue)
			{
				// let variable = new Variable(this.variable.varname, this.variable.args,this.loc);
				let condition = new Compare([this.variable,'>=', this.end], this.loc);	// IncとDecの違うところ

				let loop = [this.variable, condition, new LoopBegin(condition, true, this.loc)];
				loop.push(new LoopBody(this.statementlist, this.loc));
				// for(let i = 0; i < this.statementlist.length; i++)
				//     if(this.statementlist[i]) loop.push(this.statementlist[i].clone());
				loop.push(this.step);
				loop.push(new Assign(this.variable, this.step, '-', this.loc));	// IncとDecの違うところ
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
		for(var i = 0; i < this.statementlist.length; i++) 
			if(this.statementlist[i]) state.push(this.statementlist[i].clone());
		return new While(this.condition.clone(), state, this.loc);
	}
	argsPython(indent)
	{
		var code = [];
		code.push(makeIndent(indent) + "while " + this.condition.argsPython() + ":");
		var codes = 0;
		for(var i = 0; i < this.statementlist.length; i++)
			if(this.statementlist[i])
			{
				codes = 1;
				code.push(this.statementlist[i].argsPython(indent + 1));
			}
		if(codes == 0) code.push(makeIndent(indent + 1) + "pass");
		return code.join("\n");
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
			loop.push(new LoopBody(this.statementlist, this.loc));
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
		wait_time = this.sec.getJSValue();
		code[0].stack[0].index++;
	}
	argsPython(indent)
	{
		var code = makeIndent(indent);
		python_lib["time"] = 1;
		return code + "time.sleep(" + this.sec.argsPython() + " / 1000)";
	}
}

class NopStatement extends Statement
{
	constructor(loc) {super(loc);}
	clone()	{return new NopStatement(this.loc);}
	run(){ code[0].stack[0].index++;}
	argsPython(indent){
		return makeIndent(indent) + "pass";
	}
}

class PauseStatement extends Statement
{
	constructor(loc) {super(loc);}
	clone(){return new PauseStatement(this.loc);}
	run(){code[0].stack[0].index++; }
	argsPython(indent){
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
	argsPython(indent)
	{
		return makeIndent(indent) + "break";
	}
}

