/************************************************************ Value classes */

/**
 * 値クラスの親クラス
 */
class Value
{
	/**
	 * @constructor
	 * @param {number|string|boolean|string|hash} v 
	 * @param {Location} loc 
	 */
	constructor(v, loc)
	{
		this.value = v;		// value must be value(include array, hash), not Value
		this.rtnv = this;	// rtnv must be Value, not value
		this.loc = loc;
	}
	clone()
	{
		throw new RuntimeError(this.first_line, constructor_name(this) + "はcloneが作られていません");
	}

	get first_line() {return this.loc.first_line;}

	/**
	 * @returns {Value} 値がほしいときはこれを使う（Variableなど）。
	 * 					オブジェクトがほしいときはValue本体を使う。
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

/*********************************** Valueの演算 */

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

