
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
				s += (i > 0 ? ' ' : '') + array2text(this.value[i].rtnv);
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

