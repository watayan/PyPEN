/************************************************************ Value classes */

/**
 * @abstract
 */
class Value
{
	/** @type {Array<value of JS|Value>} */
	_args;

	/** @type {bigint|number|string|boolean|Array|Map|Value} */
	_value;

	/** @type {Location} */
	_loc;

	/** @type {number} */
	_state;

    /* this._args は初期化時の値を保持する。型はArray<value of JS|Value>
	       argsPyPEN，argsPython，run，_makeValue だけで使う
       this._value は実行時に返す値を保持する。
	   ・PrimitiveValueならvalue of JS
	   ・SimpleValueならValue
	   ・CollectionValueならArrayやMap
	   getArgs()  -> Array<value of JS|Value>
	       this._argsを返す
	   getValue() -> Value|Array<Value>|Map<value of JS,Value>
	       PrimitiveValueならthis，SimpleValueやCollectionValueならthis._value
	   getJSValue() -> value of JS(bigint|number|string|boolean|Array|Map)
	       PrimitiveValueならthis._value，SimpleValueならthis._value.getJSValue()，CollectionValueならthis._value
    */

	/**
	 * @constructor
	 * @param {Array<value of JS|Value>} v 
	 * @param {Location} loc 
	 */
	constructor(v, loc)
	{
		this._args = v;			// 初期化用のArray
		this._value = null;		// 実際の値
		this._loc = loc;		// ソース中の位置情報
		this._state = 0;		// 実行状態管理 run()で使う
		// Object.seal(this);	実体を作るときにはコンストラクタの末尾で有効にする
	}

	/**
	 * Throw RuntimeError with message
	 * @param {string} msg 
	 * @throws {RuntimeError}
	 */
	_throwRuntimeError(msg)	// Value（およびサブクラス）の外から呼ばないこと
	{
		throw new RuntimeError(this._loc.first_line, constructor_name(this) + ": " + msg);
	}

	/**
	 * Locationを返す
	 * @returns {Location}
	 */
	getLoc()
	{
		return this._loc;
	}

	/**
	 * this._argsを返す
	 */
	getArgs()	// return Array<value of JS|Value>
	{
		return this._args;
	}

	/* newpage */
	/* サブクラスで実装するメソッド
	   clone()		: Value		複製を作る
	   _makeValue() : void		this._valueを作る。runから呼ばれる
	   run()		: void		this._argsを実行する
	   getValue()	: Value		PrimitiveValueならthis，SimpleValueやCollectionValueならthis._value
	   getJSValue() : value of JS(bigint|number|string|boolean|Array|Map)	
	                  PrimitiveValueならthis._value，SimpleValueならthis._value.getJSValue()，CollectionValueならthis._value
	   setValue()	: void		this._valueを設定する
	   argsPyPEN()	: string	PyPENの文法で表した文字列
	   argsPython() : string	Pythonの文法で表した文字列
	   valueString(): string	this._valueを文字列で表したもの
	   valueCode()	: string	this._valueをコードで表したもの
	----------------------------*/

	/**
	 * @abstract
	 * @returns {Value}
	 * @throws {RuntimeError}
	 */
	clone()		// 実体のあるすべてのサブクラスで実体を実装する
	{
		this._throwRuntimeError("cloneが作られていません");
	}

	/**
	 * this._valueを作る。実体のあるサブクラスでは必ずオーバーライドする
	 * @abstract
	 */
	_makeValue()
	{
		this._throwRuntimeError("_makeValueが作られていません");
	}

	/**
	 * this._argsを実行する
	 * this._valueは_makeValueで作る
	 */
	run()
	{
		this._throwRuntimeError("runが作られていません");
	}

	/**
	 * @abstract
	 * @returns {Value}
	 */
	getValue() //Valueを返す。
	{
		this._throwRuntimeError("getValueが作られていません");
	}

	/**
	 * @returns {bigint|number|string|boolean|Array|Map}
	 */
	getJSValue()	// 実際のJSの値を返す
	{
		this._throwRuntimeError("getJSValueが作られていません");
	}

		/**
	 * @abstract
	 */
	setValue()
	{
		this._throwRuntimeError("setValueが作られていません");
	}

	/**
	 * @abstract
	 * @returns {string}
	 */
	argsPyPEN()	// PyPENの文法で表した文字列
	{
		this._throwRuntimeError("argsPyPENが作られていません");
	}
	/**
	 * @abstract
	 * @returns {string}
	 */
	argsPython()	// Pythonの文法で表した文字列
	{
		this._throwRuntimeError("argsPythonが作られていません");
	}
	/**
	 * @abstract
	 * @returns {string}
	 */
	valueString()
	{
		this._throwRuntimeError("valueStringが作られていません");
	}
	/**
	 * @abstract
	 * @returns {string}
	 */
	valueCode()
	{
		this._throwRuntimeError("valueCodeが作られていません");
	}
}

/**
 * @abstract
 * this._valueはvalue of JS
 */
class PrimitiveValue extends Value
{
	/**
	 * 
	 * @param {bigint|number|string|boolean} v
	 * @param {Location} loc
	 */
	constructor(v, loc)
	{
		super(v, loc);
	}

	/**
	 * 
	 * @returns {Value}
	 */
	getValue()
	{
		return this;
	}
	/**
	 * @param {bigint|number|string|boolean} v
	 */
	setValue(v)
	{
		this._value = v;
	}
	_makeValue()
	{
		this._value = this._args[0].getValue();
	}
	argsPyPEN()
	{
		return (this._args[0]).toString();
	}
	argsPython()
	{
		return (this._args[0]).toString();
	}
	valueString()
	{
		return (this._value).toString();
	}
	valueCode()
	{
		return (this._value).toString();
	}
	clone()
	{
		return new IntValue(this._args, this._loc);
	}
	// argsPyPEN() はStringValueで実装する
	// argsPython() はStringValueで実装する
	// valueCode() は各StringValueで実装する
	// run() はValue.run()そのまま
}

/**
 * @abstract
 * this._valueはArray<Value>またはMap<value of JS,Value>
 */
class CollectionValue extends Value
{
	/**
	 * 
	 * @param {Array<Value>} v
	 * @param {Location} loc
	 */
	constructor(v, loc)
	{
		super(v, loc);
	}

	/**
	 * 
	 * @returns {Value}
	 */
	getValue()
	{
		return this._value;
	}
	/**
	 * @abstract
	 */
	setValue(v, idx)
	{
		this._throwRuntimeError("setValueが作られていません");
	}

	/**
	 * @abstract
	 */
	_makeValue()
	{
		this._throwRuntimeError("_makeValueが作られていません");
	}
	run()
	{
		if(this._state == 0)
		{
			code[0].stack.unshift({statementlist: this._args, index: 0});
			this._state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			this._makeValue();
			this._state = 0;
		}
	}
	/**
	 * 
	 * @param {*} idx 
	 * idx があるときはValue，ないときはArray<Value>またはMapを返す
	 * @returns 
	 */
	getValue(idx = null)
	{
		if(idx === null) return this._value;
		return this._value[idx];
	}

	// clone() は各サブクラスで実装する
	// argsPyPEN() は各サブクラスで実装する
	// argsPython() は各サブクラスで実装する
	// valueString() は各サブクラスで実装する
	// valueCode() は各サブクラスで実装する
	// setValue() は各サブクラスで実装する
	// _makeValue() は各サブクラスで実装する
	// run() はValue.run()そのまま(Variableを除く）
}

class IntValue extends PrimitiveValue
{
	/**
	 * 
	 * @param {Array<string|number>} v 
	 * @param {Location} loc 
	 */
	constructor(v, loc)
	{
		super(v, loc);
		Object.seal(this);
	}
	_makeValue()
	{
		try{
			this._value = BigInt(this._args[0]);
		}
		catch(e)
		{
			if(e instanceof RangeError)
				this._throwRuntimeError("整数で表せない値が使われました");
			else throw e;
		}
	}
}

class FloatValue extends PrimitiveValue
{
	/**
	 * 
	 * @param {Array<number>} v 
	 * @param {Location} loc 
	 */
	constructor(v, loc)
	{
		super(v, loc);
		Object.seal(this);
	}
	/**
	 * @param {number} v 
	 * @returns {string}
	 */
	#toString(v)
	{
		if(isSafeInteger(v)) return (v).toFixed(1);
		else return (v).toString();
	}
	argsPyPEN()
	{
		return this.#toString(this._args.argsPyPEN());
	}
	argsPython()
	{
		return this.#toString(this._args.argsPython());
	}
	valueString()
	{
		return this.#toString(this._value);
	}
	valueCode()
	{
		return this.#toString(this._value);
	}
	_makeValue()
	{
		this._value = Number(this._args[0]);
		if(!isFinite(this._value))
			this._throwRuntimeError("実数型で表せない値が使われました");
	}
}

class StringValue extends PrimitiveValue
{
	/**
	 * 
	 * @param {string} v 
	 * @param {Location} loc 
	 */
	constructor(v, loc)
	{
		super(v, loc);
		Object.seal(this);
	}
	argsPyPEN()
	{
		return "'" + this._args[0].replace(/'/g, "\\'") + "'";
	}
	argsPython()
	{
		return "'" + this._args[0].replace(/'/g, "\\'") + "'";
	}
	valueString()
	{
		return this._value.replace(/'/g, "\\'");
	}
	valueCode()
	{
		return "'" + this._value.replace(/'/g, "\\'") + "'";
	}
	valueLength()
	{
		return this._value.length;
	}
	_makeValue()
	{
		this._value = this._args[0];
	}
}

class BooleanValue extends PrimitiveValue
{
	/**
	 * 
	 * @param {boolean} v 
	 * @param {Location} loc 
	 */
	constructor(v, loc)
	{
		super(v, loc);
		Object.seal(this);
	}
	clone()
	{
		return new BooleanValue(this._args, this._loc);
	}
	valueString()
	{
		return (this._value ? 'true' : 'false');
	}
	valueCode()
	{
		return  (this._value ? 'true' : 'false');
	}
	_makeValue()
	{
		try{
			this._value = this._args[0];
		}
		catch(e)
		{
			this._throwRuntimeError("真偽型に変換できない値が使われました");
		}
	}
}

class NullValue extends PrimitiveValue
{
	/**
	 * @param {Location} loc 
	 */
	constructor(loc)
	{
		super([], loc);
		Object.seal(this);
	}

	/**
	 * 
	 * @returns {NullValue}
	 */
	clone()
	{
		return new NullValue(this._loc);
	}
	argsPyPEN()
	{
		return '';
	}
	argsPython()
	{
		return '';
	}
	valueCode()
	{
		return '';
	}
}

class UNDEFINED extends PrimitiveValue	// 未完成のプログラム用
{
	/**
	 * 
	 * @param {Array<Value>} v 
	 * @param {Location} loc 
	 */
	constructor(v, loc)
	{
		super(v, loc);
		Object.seal(this);
	}
	clone()
	{
		return new UNDEFINED(this._args, this._loc);
	}
	argsPyPEN()
	{
		return this._args.argsPyPEN();
	}
	argsPython()
	{
		return this._args.argsPython();
	}
	valueCode()
	{
		this._throwRuntimeError("未完成のプログラムです");
	}
}

/*********************************** Complex Value classes */

class SliceValue extends CollectionValue
{
	constructor(v, loc)
	{
		super(v, loc);
		Object.seal(this);
	}
	// argsPyPEN() は各サブクラスで実装する
	// argsPython() は各サブクラスで実装する
	// valueString() は各サブクラスで実装する
	// valueCode() は各サブクラスで実装する
	// setValue() は各サブクラスで実装する
	// _makeValue() は各サブクラスで実装する
	// run() はValue.run()そのまま(Variableを除く）
	clone()
	{
		var rtnv = new SliceValue(this._args[0].clone(), this._args[1].clone(), this._loc);
		return rtnv;
	}
	run()
	{
		if(this._state == 0)
		{
			code[0].stack.unshift({statementlist: this._args, index: 0});
			this._state = 1;
		}
		else
		{
			this.#makeValue();
			code[0].stack[0].index++;
			this._state = 0;
		}
	}
	#makeValue()
	{
		if(!this._value) 
			this._value = [
			this._args[0] instanceof PrimitiveValue ? this._args[0].getValue() : this._args[0],
			this._args[1] instanceof PrimitiveValue ? this._args[1].getValue() : this._args[1]
		];
	}
	argsPyPEN()
	{
		return this._args[0].argsPyPEN() + ":" + this._args[1].argsPyPEN();
	}
	argsPython()
	{
		var p1 = this._args[0].argsPython();
		var p2 = this._args[1].argsPython();
		return  p1 + ":" + p2;
	}
	valueString()
	{
		return this._value[0].valueString() + ":" + this._value[1].valueString();
	}
	valueCode()
	{
		return this._value[0].valueCode() + ":" + this._value[1].valueCode();
	}
	getValue(idx)
	{
		return this._value[idx];
	}
	getValue1()
	{
		return this._value[0];
	}
	getValue2()
	{
		return this._value[1];
	}
	valueLength()
	{
		return 2;
	}
}

/**
 * リスト
 */
class ArrayValue extends CollectionValue
{
	/**
	 * @constructor
	 * @param {Array<Value>} v 
	 * @param {Location} loc 
	 */
	constructor(v,loc)
	{
		super(v, loc);
		Object.seal(this);
	}

	clone()
	{
		var a = [];
		for(var i = 0; i < this._args._args.length; i++) a.push(this._args._args[i].clone());
		var rtnv = new ArrayValue(a, this._loc);
		return rtnv;
	}
	argsPyPEN()
	{
		var v = [];
		for(var i = 0; i < this._args._args.length; i++) v.push(this._args._args[i].argsPyPEN());
		return '[' + v.join(',') + ']';
	}
	argsPython()
	{
		var v = [];
		for(var i = 0; i < this._args._args.length; i++) v.push(this._args._args[i].argsPython());
		return '[' + v.join(', ') + ']';
	}
	valueString()
	{
		var v = [];
		for(var i = 0; i < this._value.length; i++)
			{
				v.push(this._value[i].valueString());
			} 
		return '[' + v.join(',') + ']';
	}
	valueCode()
	{
		var v = [];
		for(var i = 0; i < this._value.length; i++) v.push(this._value[i].valueCode());
		return '[' + v.join(',') + ']';
	}

	/**
	 * @override
	 * @param {Value} v
	 * @param {number} idx
	 * @returns {void}
	 */
	setValue(v, idx)
	{
		if(idx < 0) idx += this._value.length;
		if(idx >= 0 && idx < this._value.length) this._value[idx] = v;
		else this._throwRuntimeError("配列の範囲外に値を設定しようとしました");
	}
	_makeValue()
	{
		if(!this._value)
		{
			this._value = [];
			for(var i = 0; i < this._args.length; i++) this._value.push(
				this._args[i] instanceof PrimitiveValue ?
				this._args[i].getValue() : this._args[i]);
		}
	}
	/**
	 * 
	 * @param {Value} a 
	 */
	append(a)
	{
		this._args.push(a);
	}
	/**
	 * 
	 * @param {Array<Value>} a 
	 */
	extend(a)
	{
		for(var i of a) this._args.push(i);
	}
	valueLength()
	{
		return this._value.length;
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
		super(v, loc);
		Object.seal(this);
	}
	clone()
	{
		var a =[];
		for(var arg of this._args)a.push(arg.clone());
		return new DictionaryValue(a, this._loc);
	}
    #makeValue()
	{
		if(!this._value)
		{
			this._value = new Map();
			for(var i = 0; i < this._args.length; i++)
			{
				if(this._args[i] instanceof SliceValue)
				{
					var key = this._args[i].getValue1();
					var val = this._args[i].getValue2();
					if(isPrimitive(key)) this._value.set(key.getJSValue(), val);
					else this._throwRuntimeError("辞書のキーには単純型しか使えません");
				}
				else this._throwRuntimeError("辞書の初期化が間違っています");
			}
		}
    }
	argsPyPEN()
	{
		var ag = [];
		for(var arg of this._args) 
			ag.push(arg.argsPyPEN());
		return '{' + ag.join(',') + '}';
	}
	argsPython()
	{
		var ag = [];
		for(var arg of this._args) 
			ag.push(arg.argsPython());
		return '{' + ag.join(', ') + '}';
	}
	valueString()
	{
		var ag = [];
		for(var [k,v] of this._value.entries())	
		{
			if(typeof(k) === "string") k = "'" + k + "'";
			ag.push(k + ':' + v.valueCode());
		}
		return '{' + ag.join(',') + '}';
	}
	valueCode()
	{
		var ag = [];
		for(var [k,v] of this._value.entries())
		{
			if(typeof(k) === "string") k = "'" + k.replace(/'/g, "\\'") + "'";
			ag.push(k + ':' + v.valueCode());
		}
		return '{' + ag.join(',') + '}';
	}
	run()
	{
		if(this._state == 0)
		{
			code[0].stack.unshift({statementlist: this._args, index: 0});
			this._state = 1;
		}
		else
		{
			this.#makeValue();
			code[0].stack[0].index++;
			this._state = 0;
		}
	}
}

/**
 * 値渡しをする
 */
class Copy extends Value
{
	/**
	 * 
	 * @param {Value} v 
	 * @param {Location} loc 
	 */
	constructor(v, loc)
	{
		super(v, loc);
		Object.seal(this);
	}
	clone()
	{
		var rtnv = new Copy(this._args.clone(), this._loc);
		return rtnv;
	}
	getCode()
	{
		return "copy(" + this._args.getCode() + ")";
	}
	makePython()
	{
		return  this._args.makePython() + ".copy()";
	}
	getCode()
	{
		return "copy(" + this._args.getCode() + ")";
	}
}

/*********************************** Valueの演算 */

class Pow extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this._value = null;
		this._state = 0;
		Object.seal(this);
	}
	clone()
	{
		return  new Pow(this._args[0].clone(), this._args[1].clone(), this._loc);
	}
	run()
	{
		if(this._state == 0)
		{
			code[0].stack.unshift({statementlist: this._args, index:0});
			this._state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this._args[0].getValue().value, v2 = this._args[1].getValue().value;
			if(v1 instanceof IntValue && v2 instanceof IntValue) // 整数の自然数乗
			{
				v1 = v1.args;
				v2 = v2.args;
				if(v1 == 0 && v2 <= 0) throw new RuntimeError(this.first_line, "0は正の数乗しかできません");
				try{
					this.value = v2 >= 0 ? new IntValue(v1 **  v2) : new FloatValue(Number(v1) ** Number(v2));
				}
				catch(e){
					if(e instanceof RangeError) throw new RuntimeError(this.first_line, "計算できない値です");
					else throw e;
				}
			}
			else if((v1 instanceof IntValue || v1 instanceof FloatValue) && (v2 instanceof IntValue || v2 instanceof FloatValue))
			{
				v1 = Number(v1.args);
				v2 = Number(v2.args);
				if(v1 < 0 && !Number.isSafeInteger(v2)) throw new RuntimeError(this.first_line, "負の数の非整数乗はできません");
				if(v1 == 0 && v2 <= 0) throw new RuntimeError(this.first_line, "0は正の数乗しかできません");
				try{
					let v = v1 ** v2;
					if(isFinite(v)) this.value = new FloatValue(v, this.loc);
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
		let v1 = this.args[0], v2 = this.args[1];
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
		let v1 = this.args[0], v2 = this.args[1];
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
		return this.value;
	}
}

class Add extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new Add(this.args[0].clone(), this.args[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.args[0].getValue().value, v2 = this.args[1].getValue().value;
			if(v1 instanceof ArrayValue && v2 instanceof ArrayValue)
			{
				v1 = v1.args;
				v2 = v2.args;
				let v = [];
				for(let i = 0; i < v1.length; i++) v.push(v1[i])
				for(let i = 0; i < v2.length; i++) v.push(v2[i])
				this.value = new ArrayValue(v, this.loc);
			}
			else if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の足し算はできません");
			else if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型の足し算はできません");
			else if(v1 instanceof StringValue || v2 instanceof StringValue) // 一方でも文字列なら文字列結合
			{
				v1 = v1.args;
				v2 = v2.args;
				this.value = new StringValue(v1 + v2, this.loc);
			}
			else	// 数値どうし
			{
				if(v1 instanceof FloatValue || v2 instanceof FloatValue)	// 一方が実数型なら結果は実数型
				{
					v1 = v1.args;
					v2 = v2.args;
					let v =Number(v1) + Number(v2);
					if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
					this.value = new FloatValue(v, this.loc);
				}
				else	// 整数型
				{
					try{
						v1 = v1.args;
						v2 = v2.args;
						this.value = new IntValue(v1 + v2, this.loc);
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
		let v1 = this.args[0], v2 = this.args[1];
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
		let v1 = this.args[0], v2 = this.args[1];
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
		return this.value;
	}
}

class Sub extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new Sub(this.args[0].clone(), this.args[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index:0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.args[0].getValue().value, v2 = this.args[1].getValue().value;
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の引き算はできません");
			if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型の引き算はできません");
			if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の引き算はできません");
			if(v1 instanceof FloatValue || v2 instanceof FloatValue)
			{
				v1 = v1.args;
				v2 = v2.args;
				let v = Number(v1) - Number(v2);
				if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
				this.value = new FloatValue(v, this.loc);
			}
			else
			{
				try{
					v1 = v1.args;
					v2 = v2.args;
					this.value = new IntValue(v1 - v2, this.loc);
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
		let v1 = this.args[0], v2 = this.args[1];
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
		let v1 = this.args[0], v2 = this.args[1];
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
		return this.value;
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
		return new Mul(this.args[0].clone(), this.args[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.args[0].getValue().value, v2 = this.args[1].getValue().value;
			if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型のかけ算はできません");
			else if(v1 instanceof StringValue || v2 instanceof StringValue)
			{
				let va = null, vn = null;
				if(v1 instanceof IntValue){va = v2.value.args; vn = Number(v1.value.args);}
				else if(v2 instanceof IntValue){va = v1.value.args; vn = Number(v2.value.args);}
				else throw new RuntimeError(this.first_line, "文字列には整数しか掛けられません");
				let v = '';
				for(let i = 0; i < vn; i++)
					v += va;
				this.value = new StringValue(v, this.loc);
			}
			else if(v1 instanceof ArrayValue || v2 instanceof ArrayValue)
			{
				let va = null, vn = null;
				if(v1 instanceof IntValue){va = v2.value; vn = v1.value;}
				else if(v2 instanceof IntValue){va = v1.value; vn = v2.value;}
				else throw new RuntimeError(this.first_line, "配列には整数しか掛けられません");
				let v = []
				for(let i = 0; i < vn.args; i++)
					for(let j = 0; j < va.length; j++) v.push(va.args[j]);
				this.value = new ArrayValue(v, this.loc);
			} 
			else
			{
				if(v1 instanceof FloatValue || v2 instanceof FloatValue)
				{
					let v = Number(v1.value) * Number(v2.value);
					if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
					this.value = new FloatValue(v, this.loc);
				}
				else
				{
					try{
						this.value = new IntValue(v1.value * v2.value, this.loc);
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
		let v1 = this.args[0], v2 = this.args[1];
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
		let v1 = this.args[0], v2 = this.args[1];
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
		return this.value;
	}
}

class Div extends Value	// /
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new Div(this.args[0].clone(), this.args[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.args[0].getValue(), v2 = this.args[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のわり算はできません");
			if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型のわり算はできません");
			if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のわり算はできません");
			if(v2.args == 0) throw new RuntimeError(this.first_line, "0でわり算をしました");
			try{
				let v = Number(v1.args) / Number(v2.args);
				if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
				this.value = new FloatValue(v, this.loc);
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
		let v1 = this.args[0], v2 = this.args[1];
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
		let v1 = this.args[0], v2 = this.args[1];
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
		return this.value;
	}
}

class DivInt extends Value // //
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new DivInt(this.args[0].clone(), this.args[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.args[0].getValue(), v2 = this.args[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のわり算はできません");
			if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽型のわり算はできません");
			if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のわり算はできません");
			if(v2.args == 0) throw new RuntimeError(this.first_line, "0でわり算をしました");
			try{
				if(v1 instanceof IntValue && v2 instanceof IntValue){
					let r = v1.args % v2.args;
					let q = v1.args / v2.args;
					if(!SameSignBigInt(v1.args, v2.args) && r != 0) q--;
					this.value = new IntValue(q, this.loc);
				}
				else{
					v1 = Number(v1.args);
					v2 = Number(v2.args);
					this.value = new FloatValue(Math.floor(v1 / v2), this.loc);
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
		let v1 = this.args[0], v2 = this.args[1];
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
		let v1 = this.args[0], v2 = this.args[1];
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
		return this.value;
	}
}


class Mod extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new Mod(this.args[0].clone(), this.args[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.args[0].getValue(), v2 = this.args[1].getValue();
				if(v1 instanceof IntValue && v2 instanceof IntValue){
					let r = v1.args % v2.args;
					let q = v1.args / v2.args;
					if(!SameSignBigInt(v1.args, v2.args) && r != 0) q--;
					this.value = new IntValue(v1.args - q * v2.args, this.loc);
				}
				else
				{
					v1 = Number(v1.args);
					v2 = Number(v2.args);
					this.value = new FloatValue(v1 - Math.floor(v1 / v2) * v2, this.loc);
				}
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.args[0], v2 = this.args[1];
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
		let v1 = this.args[0], v2 = this.args[1];
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
		return this.value;
	}
}

class Minus extends Value
{
	constructor(x, loc)
	{
		super([x], loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new Minus(this.args[0].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.args[0].getValue();
			if(v1 instanceof IntValue)
			{
				try{
					this.value = new IntValue(-v1.args, this.loc);
				}
					catch(e)
				{
					if(e instanceof RangeError) throw new RuntimeError(this.first_line, "計算できない値です");
					else throw e;
				}
			}
			else if(v1 instanceof FloatValue)
			{
				let v = -v1.args;
				if(!isFinite(v)) throw new RuntimeError(this.first_line, "オーバーフローしました");
				this.value = new FloatValue(v, this.loc);
			}
			else
				throw new RuntimeError(this.first_line, "マイナスは数値にしかつけられません");
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.args[0];
		let c1 = constructor_name(v1);
		let brace1 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
		return '-' + (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '');
	}
	makePython()
	{
		let v1 = this.args[0];
		let c1 = constructor_name(v1);
		let brace1 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
		return '-' + (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '');
	}
	getValue()
	{
		return this.value;
	}
}

class And extends Value
{
	constructor(x, y, loc)
	{
		super([x,y],loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new And(this.args[0].clone(), this.args[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index:0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.args[0].getValue();
			if(v1 instanceof BooleanValue)
			{
				if(!v1.args) this.value = new BooleanValue(false, this.loc);
				else
				{
					let v2 = this.args[1].getValue();
					if(v2 instanceof BooleanValue) this.value = new BooleanValue(v2.args, this.loc);
				}
			}
			else
				throw new RuntimeError(this.first_line, "and は真偽値にしか使えません");
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.args[0], v2 = this.args[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c2 == "And" || c2 == "Or" || c2 == "Not") brace2 = true;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ ' and '
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.args[0], v2 = this.args[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c2 == "And" || c2 == "Or" || c2 == "Not") brace2 = true;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' and '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.value;
	}
}

class Or extends Value
{
	constructor(x, y, loc)
	{
		super([x,y],loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new Or(this.args[0].clone(), this.args[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index:0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.args[0].getValue();
			if(v1 instanceof BooleanValue)
			{
				if(v1.args) this.value = new BooleanValue(true, this.loc);
				else
				{
					let v2 = this.args[1].getValue();
					if(v2 instanceof BooleanValue) this.value = new BooleanValue(v2.args, this.loc);
				}
			}
			else
				throw new RuntimeError(this.first_line, "or は真偽値にしか使えません");
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.args[0], v2 = this.args[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c2 == "And" || c2 == "Or" || c2 == "Not") brace2 = true;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ ' or '
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.args[0], v2 = this.args[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c2 == "And" || c2 == "Or" || c2 == "Not") brace2 = true;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' or '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.value;
	}
}

class Not extends Value
{
	constructor(x, loc)
	{
		super([x],loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new Not(this.args[0].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index:0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.args[0].getValue();
			if(v1 instanceof BooleanValue) this.value = new BooleanValue(!v1.args, this.loc);
			else throw new RuntimeError(this.first_line, "not は真偽値にしか使えません");
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.args[0];
		let c1 = constructor_name(v1);
		let brace1 = false;
	//	if(c2 == "And" || c2 == "Or" || c2 == "Not") brace2 = true;
		return 'not ' + (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '');
	}
	makePython()
	{
		let v1 = this.args[0];
		let c1 = constructor_name(v1);
		let brace1 = false;
		if(c1 == "And" || c1 == "Or" || c1 == "Not") brace2 = true;
		return 'not ' + (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '');
	}
	getValue()
	{
		return this.value;
	}
}

class BitAnd extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new BitAnd(this.args[0].clone(), this.args[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index:0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.args[0].getValue(), v2 = this.args[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビット積はできません");
			else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビット積はできません");
			else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) this.value = new BooleanValue(v1.args & v2.args, this.loc);
			else if(v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビット積はできません");
			else
			{
				try{
					v1 = v1 instanceof BooleanValue ? (v1.args ? 1 : 0) : v1.args;
					v2 = v2 instanceof BooleanValue ? (v2.args ? 1 : 0) : v2.args;
					this.value = new IntValue(v1 & v2, this.loc);
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
		let v1 = this.args[0], v2 = this.args[1];
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
		let v1 = this.args[0], v2 = this.args[1];
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
		return this.value;
	}
}

class BitOr extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new BitOr(this.args[0].clone(), this.args[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index:0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.args[0].getValue(), v2 = this.args[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビット和はできません");
			else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビット和はできません");
			else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) this.value = new BooleanValue(v1.args | v2.args, this.loc);
			else if(v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビット和はできません");
			else
			{
				try{
					v1 = v1 instanceof BooleanValue ? (v1.args ? 1 : 0) : v1.args;
					v2 = v2 instanceof BooleanValue ? (v2.args ? 1 : 0) : v2.args;
					this.value = new IntValue(v1 | v2, this.loc);
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
		let v1 = this.args[0], v2 = this.args[1];
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
		let v1 = this.args[0], v2 = this.args[1];
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
		return this.value;
	}
}

class BitXor extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new BitXor(this.args[0].clone(), this.args[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.args[0].getValue(), v2 = this.args[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の排他的ビット和はできません");
			else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の排他的ビット和はできません");
			else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) this.value = new BooleanValue(v1.args ^ v2.args, this.loc);
			else if(v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数の排他的ビット和はできません");
			else
			{
				try{
					v1 = v1 instanceof BooleanValue ? (v1.args ? 1 : 0) : v1.args;
					v2 = v2 instanceof BooleanValue ? (v2.args ? 1 : 0) : v2.args;
					this.value = new IntValue(v1 ^ v2, this.loc);
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
		let v1 = this.args[0], v2 = this.args[1];
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
		let v1 = this.args[0], v2 = this.args[1];
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
		return this.value;
	}
}

class BitNot extends Value
{
	constructor(x, loc)
	{
		super([x], loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new BitNot(this.args[0].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.args[0].getValue()
			if(v1 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビット反転はできません");
			else if(v1 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビット反転はできません");
			else if(v1 instanceof BooleanValue) this.value = new BooleanValue(!v1.args, this.loc);
			else if(v1 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビット反転はできません");
			else
			{
				try{
					this.value = new IntValue(~v1.args, this.loc);
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
		let v1 = this.args[0];
		let c1 = constructor_name(v1);
		let brace1 = false;
		if(c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift") brace1 = true;
		return '~' + (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '');
	}
	makePython()
	{
		let v1 = this.args[0];
		let c1 = constructor_name(v1);
		let brace1 = false;
		if(c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift") brace1 = true;
		return '~' + (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '');
	}
	getValue()
	{
		return this.value;
	}
}

class BitLShift extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new BitLShift(this.args[0].clone(), this.args[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.args[0].getValue(), v2 = this.args[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビットシフトはできません");
			else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビットシフトはできません");
			else if(v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビットシフトはできません");
			else
			{
				try{
					v1 = v1 instanceof BooleanValue ? (v1.args ? 1 : 0) : v1.args;
					v2 = v2 instanceof BooleanValue ? (v2.args ? 1 : 0) : v2.args;
					this.value = new IntValue(v1 << v2, this.loc);
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
		let v1 = this.args[0], v2 = this.args[1];
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
		let v1 = this.args[0], v2 = this.args[1];
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
		return this.value;
	}
}

class BitRShift extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new BitRShift(this.args[0].clone(), this.args[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].state[0].index++;
			let v1 = this.args[0].getValue(), v2 = this.args[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビットシフトはできません");
			else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビットシフトはできません");
			else if(v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビットシフトはできません");
			else
			{
				try{
					v1 = v1 instanceof BooleanValue ? (v1.args ? 1 : 0) : v1.args;
					v2 = v2 instanceof BooleanValue ? (v2.args ? 1 : 0) : v2.args;
					this.value = new IntValue(v1 >> v2, this.loc);
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
		let v1 = this.args[0], v2 = this.args[1];
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
		let v1 = this.args[0], v2 = this.args[1];
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
		return this.value;
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
		for(let i = 0; i < v1.length; i++) rtnv = rtnv && ArrayCompare(v1.getValue().args[i], v2.getValue().args[i]);
	}
	else rtnv = rtnv && typeof v1 == typeof v2 && v1.args == v2.args;
	return rtnv;
}

class Compare extends Value
{
	constructor(x,y,z,loc)
	{
		super([x,y,z],loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new Compare(this.args[0].clone(), this.args[1], this.args[2].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: [this.args[0]], index: 0});
			this.state = 1;
		}
		else if(this.state == 1)
		{
			if(this.args[0] instanceof Compare && !this.args[0].getValue().args)
			{
				code[0].stack[0].index++;
				this.state = 0;
				this.value = new BooleanValue(false, this.loc);
			}
			else
			{
				code[0].stack.unshift({statementlist:[this.args[2]], index: 0});
				this.state = 2;
			}
		}
		else
		{
			code[0].stack[0].index++;
			this.state = 0;
			var v1, v2 = this.args[2].getValue();
			if(this.args[0] instanceof Compare) v1 = this.args[0].args[2].getValue();
			else v1 = this.args[0].getValue();
			switch(this.args[1])
			{
			case '==':
				if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) this.value = new BooleanValue(ArrayCompare(v1, v2), this.loc);
				else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
				else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
				else this.value = new BooleanValue(v1.args == v2.args, this.loc);
				break;
			case '!=':
				if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) this.value = new BooleanValue(!ArrayCompare(v1, v2), this.loc);
				else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
				else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
				else this.value = new BooleanValue(v1.args != v2.args, this.loc);
				break;
			case '>':
				if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません")
				else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
				else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
				this.value = new BooleanValue(v1.args > v2.args, this.loc);
				break;
			case '<':
				if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません")
				else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
				else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
				this.value = new BooleanValue(v1.args < v2.args, this.loc);
				break;
			case '>=':
				if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません")
				else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
				else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
				this.value = new BooleanValue(v1.args >= v2.args, this.loc);
				break;
			case '<=':
				if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません")
				else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
				else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
				this.value = new BooleanValue(v1.args <= v2.args, this.loc);
				break;
			case 'の中に':
				var flag = false;
				if(v1 instanceof ArrayValue)
					for(let i = 0; i < v1.args.length; i++) flag |= ArrayCompare(v1.args[i], v2);
				else throw new RuntimeError(this.first_line, "\"の中に\"の前には配列が必要です");
				this.value = new BooleanValue(flag, this.loc);
				break;
			case 'in':
				var flag = false;
				if(v2 instanceof ArrayValue)
					for(let i = 0; i < v2.args.length; i++) flag |= ArrayCompare(v2.args[i], v1);
				else throw new RuntimeError(this.first_line, "\"in\"の後には配列が必要です");
				this.value = new BooleanValue(flag, this.loc);
				break;
			case 'not in':
				var flag = false;
				if(v2 instanceof ArrayValue)
					for(let i = 0; i < v2.args.length; i++) flag |= ArrayCompare(v2.args[i], v1);
				else throw new RuntimeError(this.first_line, "\"not in\"の後には配列が必要です");
				this.value = new BooleanValue(!flag, this.loc);
			}
		}
	}
	getCode()
	{
		let v1 = this.args[0], v2 = this.args[2];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+  this.args[1]
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.args[0], v2 = this.args[2];
		let brace1 = false, brace2 = false;
		var op = this.args[1];
		switch(this.args[1])
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
		return this.value;
	}
}

class EQ extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new EQ(this.args[0].clone(), this.args[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.args[0].getValue(), v2 = this.args[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) this.value = new BooleanValue(ArrayCompare(v1, v2), this.loc);
			else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
			else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
			else this.value = new BooleanValue(v1.args == v2.args, this.loc);
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.args[0], v2 = this.args[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '=='
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.args[0], v2 = this.args[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' == '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.value;
	}
}

class NE extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new NE(this.args[0].clone(), this.args[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.args[0].getValue(), v2 = this.args[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) this.value = new BooleanValue(!ArrayCompare(v1, v2), this.loc);
			else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
			else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
			else this.value = new BooleanValue(v1.args != v2.args, this.loc);
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.args[0], v2 = this.args[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '!='
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.args[0], v2 = this.args[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' != '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.value;
	}
}

class GT extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.value = null;
		this.state  = 0;
	}
	clone()
	{
		return new GT(this.args[0].clone(), this.args[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.args[0].getValue(), v2 = this.args[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません")
			else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
			else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
			this.value = new BooleanValue(v1.args > v2.args, this.loc);
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.args[0], v2 = this.args[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '>'
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.args[0], v2 = this.args[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' > '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.value;
	}
}

class GE extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new GE(this.args[0].clone(), this.args[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.args[0].getValue(), v2 = this.args[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません")
			else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
			else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
			this.value = new BooleanValue(v1.args >= v2.args, this.loc);
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.args[0], v2 = this.args[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '>='
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.args[0], v2 = this.args[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' >= '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.value;
	}
}

class LT extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new LT(this.args[0].clone(), this.args[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.args[0].getValue(), v2 = this.args[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません")
			else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
			else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
			this.value = new BooleanValue(v1.args < v2.args, this.loc);
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.args[0], v2 = this.args[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '<'
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.args[0], v2 = this.args[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' < '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.value;
	}
}

class LE extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new LE(this.args[0].clone(), this.args[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.args[0].getValue(), v2 = this.args[1].getValue();
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列を比べることはできません")
			else if(v1 instanceof StringValue != v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列とそれ以外の値は比べられません");
			else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) throw new RuntimeError(this.first_line, "真偽値とそれ以外の値は比べられません");
			this.value = new BooleanValue(v1.args <= v2.args, this.loc);
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.args[0], v2 = this.args[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '<='
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.args[0], v2 = this.args[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.makePython() + (brace1 ? ')' : '')
			+ ' <= '
			+ (brace2 ? '(' : '') + v2.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.value;
	}
}

class IN extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new IN(this.args[0].clone(), this.args[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = this.args[0].getValue(), v2 = this.args[1].getValue();
			var flag = false;
			if(v1 instanceof ArrayValue)
				for(let i = 0; i < v1.args.length; i++) flag |= ArrayCompare(v1.args[i], v2);
			else throw new RuntimeError(this.first_line, "\"の中に\"の前には配列が必要です");
			this.value = new BooleanValue(flag, this.loc);
			this.state = 0;
		}
	}
	getCode()
	{
		let v1 = this.args[0], v2 = this.args[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ 'の中に'
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()	// 逆順になることに注意
	{
		let v1 = this.args[0], v2 = this.args[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v2.makePython() + (brace1 ? ')' : '')
			+ ' in '
			+ (brace2 ? '(' : '') + v1.makePython() + (brace2 ? ')' : '')
	}
	getValue()
	{
		return this.value;
	}
}

class NumberOf extends Value
{
	constructor(x, y, loc)
	{
		super([x,y], loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new NumberOf(this.args[0].clone(), this.args[1].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
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
			statementlist.push(new ForInc(var2, new IntValue(1, this.loc),this.args[0].getValue(), new IntValue(1, this.loc),
				[this.args[1], new Append(var1, this.args[1], this.loc)], this.loc));
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
		let v1 = this.args[0], v2 = this.args[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '個の'
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	makePython()
	{
		let v1 = this.args[0], v2 = this.args[1];
		let brace1 = false, brace2 = false;
		return '[' + (brace1 ? '(' : '') + v2.makePython() + (brace1 ? ')' : '')
			+ ' for _ in range('
			+ (brace2 ? '(' : '') + v1.makePython() + (brace2 ? ')' : '')
			+ ')]';
	}
	getValue()
	{
		return this.value;
	}
	setValue(v)
	{
		this.value = v.clone();
	}
}


class ConvertInt extends Value
{
	constructor(x, loc)
	{
		super([x], loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new ConvertInt(this.args[0].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v = this.args[0].getValue();
			let r = Number.NaN;
			if(v instanceof IntValue) r = v.args;
			else if(v instanceof FloatValue) r = Math.floor(v.args);
			else if(v instanceof StringValue) r = Math.floor(Number(v.args));
			else if(v instanceof BooleanValue) r = v.args ? 1 : 0;
			if(isSafeInteger(r)) this.value = new IntValue(r, this.loc);
			else throw new RuntimeError(this.loc.first_line, '整数に直せません');
			this.state = 0;
		}
	}
	getCode()
	{
		return '整数(' + this.args[0].getCode() + ')';
	}
	makePython()
	{
		return 'int(' + this.args[0].makePython() + ')';
	}
	getValue()
	{
		return this.value;
	}
}

class ConvertFloat extends Value
{
	constructor(x, loc)
	{ 
		super([x], loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new ConvertFloat(this.args[0].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v = this.args[0].getValue();
			let r = Number.NaN;
			if(v instanceof IntValue || v instanceof FloatValue) r = v.args;
			else if(v instanceof StringValue) r = Number(v.args);
			else if(v instanceof BooleanValue) r = v.args ? 1 : 0;
			if(isFinite(r)) this.value = new FloatValue(r, this.loc);
			else throw new RuntimeError(this.loc.first_line, '実数に直せません');
			this.state = 0;
		}
	}
	getCode()
	{
		return '実数(' + this.args[0].getCode() + ')';
	}
	makePython()
	{
		return 'float(' + this.args[0].makePython() + ')';
	}
	getValue()
	{
		return this.value;
	}
}

class ConvertString extends Value
{
	constructor(x, loc)
	{
		super([x], loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new ConvertString(this.args[0].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v = this.args[0].getValue();
			let r = '';
			if(v instanceof IntValue || v instanceof FloatValue) r = String(v.args);
			else if(v instanceof StringValue) r = v.args
			else if(v instanceof BooleanValue) r = v.args ? 'True' : 'False';
			this.value = new StringValue(r, this.loc);
			this.state = 0;
		}
	}
	getCode()
	{
		return '文字列(' + this.args[0].getCode() + ')';
	}
	makePython()
	{
		return 'str(' + this.args[0].makePython() + ')';
	}
	getValue()
	{
		return this.value;
	}
}

function toBool(v)
{
	let re = /^(0+|false|偽|)$/i;
	if(v instanceof IntValue || v instanceof FloatValue) return v.getValue() != 0;
	else if(v instanceof StringValue) return re.exec(v.getValue()) ? false : true;
	else if(v instanceof BooleanValue) return v.getValue();
	else if(v instanceof ArrayValue) return v.getValue().valueLength() != 0;
	else if(v instanceof DictionaryValue) return v.getValue().size() != 0;
	return false;
}

class ConvertBool extends Value
{
	constructor(x, loc)
	{
		super([x], loc);
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		return new ConvertBool(this.args[0].clone(), this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v = this.args[0].getValue();
			this.value = new BooleanValue(toBool(v), this.loc);
			this.state = 0;
		}
	}
	getCode()
	{
		return '真偽(' + this.args[0].getCode() + ')';
	}
	makePython()
	{
		return 'bool(' + this.args[0].makePython() + ')';
	}
	getValue()
	{
		return this.value;
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
		super(y,loc); 
		this.varname = x;
		Object.seal(this);
	}
	clone()
	{
		return new Variable(this.varname, this.args ? this.args.clone() : null, this.loc);
	}
	run()
	{
		if(this._state == 0)
		{
			if(this.args) code[0].stack.unshift({statementlist: this.args, index: 0});
			this._state = 1;
		}
		else
		{
			this.#makeValue();
			code[0].stack[0].index++;
			this._state = 0;
		}
	}
	#makeValue()
	{
		var vt = findVarTable(this.varname);
		if(vt)
		{
			var v = vt.vars[this.varname];
			this._value = getValueByArgs(v, this.args ? this.args : null, this.loc);
		}
		else throw new RuntimeError(this.first_line, "変数に" + this.varname + "がありません");
	}
	makeCode()
	{
		let vn = this.args[0];
		let pm = this.args[1];
		if(pm != null)
		{
			let ag = new Array(pm.length);
			for(let i = 0; i < pm.length; i++)
			{
				ag[i] = pm.args[i].getCode();
			}
			vn += '['+ag.join(',')+']';
		}
		return vn;
	}
	makePython()
	{
		let vn = this.args[0];
		let pm = this.args[1];
		if(pm != null)
		{
			let ag = new Array(pm.length);
			for(let i = 0; i < pm.length; i++)
			{
				ag[i] = '[' + pm.args[i].makePython() + ']';
			}
			vn += ag.join('');
		}
		return vn;
	}
	getValue()
	{
		return this._value;
	}
	toString()
	{
		return this._value.toString();
	}
	/**
	 * @param {Value} a 
	 */
	append(a)
	{
		if(!this._args[1]) this._args[1] = new ArrayValue([a], this.loc);
		else this._args[1]._args.push(a);
	}
	/**
	 * 
	 * @param {Array<Value>} a 
	 */
	extend(a)
	{
		if(!this._args[1]) this._args[1] = new ArrayValue(a, this.loc);
		else for(var i of a) this._args[1]._args.push(i);
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
		this.value = null;
		this.state = 0;
	}
	clone()
	{
		var parm = [];
		for(var i = 0; i < this.args[1].length; i++) parm.push(this.args[1][i].clone());
		var rtnv = new CallFunction(this.args[0], parm, this.loc);
		return rtnv;
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args[1], index: 0});
			this.state = 1;
		}
		else if(this.state == 1)
		{
			code[0].stack[0].index++;
			var func = this.args[0], param = this.args[1];
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
		this.value = v;
	}
	getValue()
	{
		return this.value;
	}
	getCode()
	{
		let func = this.args[0], param = this.args[1];
		let ag = [];
		for(let i = 0; i < param.length; i++)
			ag.push(param[i].getCode());
		return func + '(' + ag.join(',') + ')';
	}
	makePython()
	{
		let func = this.args[0], param = this.args[1];
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
		var rtnv = new Connect(this.args[0].clone(), this.args[1].clone(), this.loc);
		rtnv.value = this.value;
		return rtnv;
	}
	run()
	{
		if(this.state == 0)
		{
			code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			let v1 = array2text(this.args[0].getValue());
			let v2 = array2text(this.args[1].getValue());
			let v = v1 + v2;
			this.value = new StringValue(v, this.loc);
			this.state = 0;
		}
	}
	getCode()
	{
		return this.args[0].getCode() + "と" + this.args[1].getCode();
	}
	makePython()
	{
		var re=/^str\(/;
		var p1 = this.args[0].makePython();
		var p2 = this.args[1].makePython();
		if(!re.exec(p1) && !(this.args[0] instanceof StringValue)) p1 = "str(" + p1 + ")";
		if(!re.exec(p2) && !(this.args[1] instanceof StringValue)) p2 = "str(" + p2 + ")";
		return  p1 + " + " + p2;
	}
	getValue()
	{
		return this.value;
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
		super([variable, value, operator],loc);
		if(!(variable instanceof Variable || variable instanceof UNDEFINED)) 
			throw new RuntimeError(loc.first_line, "変数でないものに代入はできません");
	}
	clone()
	{
		return new Assign(this._args, this.loc);
	}
	run()
	{
		var variable = this._args[0];
		var value    = this._args[1];
		var operator = this._args[2];

		if(varianle instanceof UNDEFINED) 
			throw new RuntimeError(this.first_line, "未完成のプログラムです");
		if(this._state == 0)
		{
			let a=[];
			if(operator) a.push(variable);
			a.push(value);
			code[0].stack.unshift({statementlist: a, index: 0});
			this._state = 1;
		}
		else if(this._state == 1)
		{
			if(!this._operator && variable._args[1]._args.length > 0)
				code[0].stack.unshift({statementlist: variable._args[1]._args, index: 0});
			this._state = 2;
		}
		else if(this._state == 2)
		{
			var vt1 = findVarTable(variable.varname);
			var v2  = value;
			if(operator)
			{
				if(!vt1) throw new RuntimeError(this.first_line, '変数 '+this.variable.varname+' は定義されていません');
				var v1 = getValueByArgs(vt1.vars[this.variable.varname], this.variable.args ? this.variable.args.args : null, this.loc);
				var v3 = null;
				switch(this.operator)
				{
					case '+':
						if(v1 instanceof BooleanValue) v1 = new IntValue(v1.args ? 1 : 0, this.loc);
						if(v2 instanceof BooleanValue) v2 = new IntValue(v2.args ? 1 : 0, this.loc);
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の足し算はまだサポートしていません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書の足し算はまだサポートしていません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) v3 = new StringValue(String(v1.args) + String(v2.args), this.loc);
						else if(v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(v1.args + v2.args, this.loc);
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) v3 = new FloatValue(Number(v1.args) + Number(v2.args), this.loc);
						break;
					case '-':
						if(v1 instanceof BooleanValue) v1 = new IntValue(v1.args ? 1 : 0, this.loc);
						if(v2 instanceof BooleanValue) v2 = new IntValue(v2.args ? 1 : 0, this.loc);
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の引き算はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書の引き算はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の引き算はできません");
						else if(v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(v1.args - v2.args, this.loc);
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) v3 = new FloatValue(Number(v1.args) - Number(v2.args), this.loc);
						break;
					case '*':
						if(v1 instanceof BooleanValue) v1 = new IntValue(v1.args ? 1 : 0, this.loc);
						if(v2 instanceof BooleanValue) v2 = new IntValue(v2.args ? 1 : 0, this.loc);
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の掛け算は出来ません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書の掛け算はできません");
						else if(v1 instanceof StringValue)
						{
							if(v2 instanceof IntValue) v3 = new StringValue(v1.args.repeat(v2.args >= 0 ? Number(v2.args) : 0), this.loc);
							else throw new RuntimeError(this.first_line, "文字列に掛けられるのは整数だけです")
						}
						else if(v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(v1.args * v2.args, this.loc);
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) v3 = new FloatValue(Number(v1.args) * Number(v2.args), this.loc);
						break;
					case '/':
						if(v1 instanceof BooleanValue) v1 = new IntValue(v1.args ? 1 : 0, this.loc);
						if(v2 instanceof BooleanValue) v2 = new IntValue(v2.args ? 1 : 0, this.loc);
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の割り算はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書の割り算はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の割り算はできません");
						else
						{
							if(v2.args == 0) throw new RuntimeError(this.first_line, '0で割り算をしました');
							else v3 = new FloatValue(Number(v1.args) / Number(v2.args), this.loc);
						}
						break;
					case '//':
						if(v1 instanceof BooleanValue) v1 = new IntValue(v1.args ? 1 : 0, this.loc);
						if(v2 instanceof BooleanValue) v2 = new IntValue(v2.args ? 1 : 0, this.loc);
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の割り算はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書の割り算はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の割り算はできません");
						else if(v1 instanceof IntValue && v2 instanceof IntValue)
						{
							let q = v1.args / v2.args, r = v1.args % v2.args;
							if(!SameSignBigInt(v1.args, v2.args) && r != 0) q--;
							v3 = new IntValue(q, this.loc);
						}
						else
						{
							if(Number(v2.args) == 0) throw new RuntimeError(this.first_line, '0で割り算をしました');
							let v4 = Math.floor(Number(v1.args) / Number(v2.args));
							v3 = new FloatValue(v4, this.loc);
						}
						break;
					case '%':
						if(v1 instanceof BooleanValue) v1 = new IntValue(v1.args ? 1 : 0, this.loc);
						if(v2 instanceof BooleanValue) v2 = new IntValue(v2.args ? 1 : 0, this.loc);
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の割り算はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書の割り算はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の割り算はできません");
						else if(v1 instanceof IntValue && v2 instanceof IntValue)
						{
							let q = v1.args / v2.args, r = v1.args % v2.args;
							if(!SameSignBigInt(v1.args, v2.args) && r != 0) q--;
							v3 = new IntValue(r - q * v2.args, this.loc);
						}
						else
						{
							if(Number(v2.args) == 0) throw new RuntimeError(this.first_line, '0で割り算をしました');
							let v4 = Math.floor(Number(v1.args) / Number(v2.args));
							v3 = new FloatValue(Number(v1.args) - v4 * Number(v2.args), this.loc);
						}
						break;
					case '&':
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビット積はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書のビット積はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビット積はできません");
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビット積はできません");
						else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) v3 = new BooleanValue(v1.args && v2.args, this.loc);
						else
						{
							if(v1 instanceof BooleanValue) v1 = new IntValue(v1.args ? 1 : 0, this.loc);
							if(v2 instanceof BooleanValue) v2 = new IntValue(v2.args ? 1 : 0, this.loc);
							if(v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(v1.args & v2.args, this.loc);
						} 
						break;
					case '|':
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビット和はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書のビット和はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビット和はできません");
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビット和はできません");
						else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) v3 = new BooleanValue(v1.args && v2.args, this.loc);
						else
						{
							if(v1 instanceof BooleanValue) v1 = new IntValue(v1.args ? 1 : 0, this.loc);
							if(v2 instanceof BooleanValue) v2 = new IntValue(v2.args ? 1 : 0, this.loc);
							if(v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(v1.args | v2.args, this.loc);
						} 
						break;
					case '^':
						if(v1 instanceof ArrayValue && v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列の排他的論理和はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書の排他的論理和はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列の排他的論理和はできません");
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数の排他的論理和はできません");
						else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) v3 = new BooleanValue(v1.args && v2.args, this.loc);
						else
						{
							if(v1 instanceof BooleanValue) v1 = new IntValue(v1.args ? 1 : 0, this.loc);
							if(v2 instanceof BooleanValue) v2 = new IntValue(v2.args ? 1 : 0, this.loc);
							if(v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(v1.args ^ v2.args, this.loc);
						} 
						break;
					case '<<':
						if(v1 instanceof ArrayValue && v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビットシフトはできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書のビットシフトはできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビットシフトはできません");
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビットシフトはできません");
						else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) v3 = new BooleanValue(v1.args && v2.args, this.loc);
						else
						{
							if(v1 instanceof BooleanValue) v1 = new IntValue(v1.args ? 1 : 0, this.loc);
							if(v2 instanceof BooleanValue) v2 = new IntValue(v2.args ? 1 : 0, this.loc);
							if(v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(v1.args << v2.args, this.loc);
						} 
						break;
					case '>>':
						if(v1 instanceof ArrayValue && v2 instanceof ArrayValue) throw new RuntimeError(this.first_line, "配列のビットシフトはできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) throw new RuntimeError(this.first_line, "辞書のビットシフトはできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) throw new RuntimeError(this.first_line, "文字列のビットシフトはできません");
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) throw new RuntimeError(this.first_line, "実数のビットシフトはできません");
						else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) v3 = new BooleanValue(v1.args && v2.args, this.loc);
						else
						{
							if(v1 instanceof BooleanValue) v1 = new IntValue(v1.args ? 1 : 0, this.loc);
							if(v2 instanceof BooleanValue) v2 = new IntValue(v2.args ? 1 : 0, this.loc);
							if(v1 instanceof IntValue && v2 instanceof IntValue) v3 = new IntValue(v1.args >> v2.args, this.loc);
						} 
						break;
				}
				if(!v3) throw new RuntimeError(this.first_line, '複合代入演算子の使い方が間違っています');
				setVariableByArgs(vt1,this.variable.varname, this.variable.args ? this.variable.args.getValue() : null, v3, this.loc);
				this.value = v3;
			}
			else
			{
				if(!vt1)	// 変数が定義されていないので，ダミーを代入
				{
					vt1 = varTables[0];
					vt1.vars[variable.varname] = new NullValue(this.loc);
				}
				setVariableByArgs(vt1, variable.varname, variable._args[1]._args.length > 0 ? variable._args[1] : null, v2, this.loc);
				this._value = v2;
			}
			this._state = 0;
			code[0].stack[0].index++;
		}
	}
	getValue()
	{
		return this._value;
	}
	makePython(indent)
	{
		var code = Parts.makeIndent(indent);
		code += this._args[0].makePython() + " ";
		if(this._args[2]) code += this._args[2];
		code += "= " + this._args[1].makePython() + "\n";
		return code;
	}
}

/**
 * vtにあるvn[args]にnewvalをセットする(vt.vars[vn]は既に存在するものとする)
 * @param {VarTable} vt 
 * @param {String} vn 
 * @param {Array<Value>} args 
 * @param {Value} newval 
 * @param {Location} loc 
 */
function setVariableByArgs(vt,vn, args, newval, loc)
{
	if(args && args.length > 0)
	{
		var v = vt.vars[vn];
		for(var i = 0; i < args.length - 1; i++)	// 最後の手前までの添字をたどる
		{
			var arg = args[i];
			if(v instanceof ArrayValue)
			{
				if(arg instanceof IntValue)
				{
					var idx = Number(arg.getValue());
					var l = v.value.args.length;
					if(idx < 0) idx += l;
					if(idx >= 0 && idx < l) v = v.getValue(idx);
					else throw new RuntimeError(loc.first_line, "配列の範囲を超えています");
				}
				else throw new RuntimeError(loc.first_line, "配列の添字は整数でなければなりません");
			}
			else if(v instanceof DictionaryValue)
			{
				if(isPrimitive(arg))
				{
					var key = arg.getValue();
					if(v.getValue().has(key)) v = v.getValue().get(key);
					else throw new RuntimeError(loc.first_line, "辞書にキー"+key.args+"がありません");
				}
			}
			else if(v instanceof StringValue)
			{
				if(arg instanceof IntValue)
				{
					var idx = Number(arg.getValue().args);
					var l = v.value.args.length;
					if(idx < 0) idx += l;
					if(idx >= 0 && idx < l) v = new StringValue(v.getValue().charAt(idx), loc);
					else throw new RuntimeError(loc.first_line, "文字列の範囲を超えています");
				}
				else if(arg instanceof SliceValue)
				{
					var idx1 = Number(arg.getValue1().getValue().args);
					var idx2 = Number(arg.getValue2().getValue().args);
					var l = v.value.args.length;
					if(!idx1) idx1 = 0;
					if(!idx2) idx2 = l;
					if(idx1 < 0) idx1 += l;
					if(idx2 < 0) idx2 += l;
					if(idx1 >= 0 && idx2 >= 0 && idx1 < l && idx2 <= l)
						v = new StringValue(v.value.substring(idx1, idx2), loc);
					else throw new RuntimeError(loc.first_line, "文字列の範囲を超えています");
				}
			}
			else throw new RuntimeError(loc.first_line, "添字が使える型ではありません");
		}
		// 最後の添字を使って代入
		var arg = args.getElement(args.length - 1);
		if(v instanceof ArrayValue)
		{
			if(arg instanceof IntValue)
			{
				var idx = Number(arg.getValue());
				var l = v.value.args.length;
				if(idx < 0) idx += l;
				if(idx >= 0 && idx < l) v.setValue(idx, newval.clone());
				else throw new RuntimeError(loc.first_line, "配列の範囲を超えています");
			}
			else throw new RuntimeError(loc.first_line, "配列の添字は整数でなければなりません");
		}
		else if(v instanceof DictionaryValue)
		{
			if(isPrimitive(arg))
			{
				var key = arg.getValue();
				if(v.getValue().has(key)) v.setValue(key, newval.clone());
				else throw new RuntimeError(loc.first_line, "辞書にキー"+key.args+"がありません");
			}
		}
		else if(v instanceof StringValue)
		{
			if(newval instanceof StringValue)
			{
				if(arg instanceof IntValue)
				{
					var idx = Number(arg.getValue().args);
					var l = v.value.args.length;
					if(idx < 0) idx += l;
					if(idx >= 0 && idx < l) 
					v = new StringValue(s.substring(0, idx) + newval.getValue() + s.substring(idx + 1), loc);
					else throw new RuntimeError(loc.first_line, "文字列の範囲を超えています");
				}
				else if(arg instanceof SliceValue)
				{
					var idx1 = Number(arg.getValue1().getValue().args);
					var idx2 = Number(arg.getValue2().getValue().args);
					var l = v.value.args.length;
					if(!idx1) idx1 = 0;
					if(!idx2) idx2 = l;
					if(idx1 < 0) idx1 += l;
					if(idx2 < 0) idx2 += l;
					if(idx1 >= 0 && idx2 >= 0 && idx1 < l && idx2 <= l)
						v = new StringValue(s.substring(0, idx1) + newval.getValue() + s.substring(idx2), loc);
					else throw new RuntimeError(loc.first_line, "文字列の範囲を超えています");
				}
			}
			else throw new RuntimeError(loc.first_line, "文字列に代入できるのは文字列だけです");
		}
		else throw new RuntimeError(loc.first_line, "添字が使える型ではありません");
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
	var val = v;
	if(args && args.length > 0)
	{
		for(var i = 0; i < args.length; i++)
		{
			var arg = args._value[i];
			if(val instanceof ArrayValue)
			{
				if(arg instanceof IntValue)
				{
					var idx = Number(arg.getValue());
					var l = val.length;
					if(idx < 0) idx += l;
					if(idx >= 0 && idx < l) val = val._args[idx];
					else throw new RuntimeError(loc.first_line, "配列の範囲を超えてアクセスしました");
				}
				else if(arg instanceof SliceValue)
				{
					var idx1 = Number(arg.getValue1().getValue());
					var idx2 = Number(arg.getValue2().getValue());
					var l = val.length;
					if(!idx1) idx1 = 0;
					if(!idx2) idx2 = l;
					if(idx1 < 0) idx1 += l;
					if(idx2 < 0) idx2 += l;
					if(idx1 >= 0 && idx2 >= 0 && idx1 <= l && idx2 <= l)
					{
						var a = [];
						for(var j = idx1; j < idx2; j++) a.push(val.getValue(j).clone());
						val = new ArrayValue(a, loc);
					}
					else throw new RuntimeError(loc.first_line, "配列の範囲を超えました");
				}
				else throw new RuntimeError(loc.first_line, "リストの添字は整数かスライスです"
					+ debug_mode ? (" (arg type: " + arg.constructor.name + ")") : ''
				);
			}
			else if(v instanceof DictionaryValue)
			{
				if(isPrimitive(arg))
				{
					var key = arg.getValue();
					if(v.getValue().args.has(key.args)) v = v.value.get(key.args);
					else throw new RuntimeError(loc.first_line, "辞書にキー"+key.args+"がありません");
				}
				else throw new RuntimeError(loc.first_line, "辞書の添字は基本型です");
			}
			else if(v instanceof StringValue)
			{
				if(arg instanceof IntValue)
				{
					var idx = Number(arg.getValue());
					var l = val.length;
					if(idx < 0) idx += l;
					if(idx >= 0 && idx < l) v = new StringValue(v.getValue()[idx], loc);
					else throw new RuntimeError(loc.first_line, "配列の範囲を超えてアクセスしました");
				}
				else if(arg instanceof SliceValue)
				{
					var idx1 = Number(arg.getValue1().getValue());
					var idx2 = Number(arg.getValue2().getValue());
					var l = val.length;
					if(!idx1) idx1 = 0;
					if(!idx2) idx2 = l;
					if(idx1 < 0) idx1 += l;
					if(idx2 < 0) idx2 += l;
					if(idx1 >= 0 && idx2 >= 0 && idx1 <= l && idx2 <= l)
						v = new StringValue(v.getValue().substring(idx1, idx2), loc);
					else throw new RuntimeError(loc.first_line, "配列の範囲を超えました");
				}
				else throw new RuntimeError(loc.first_line, "文字列の添字は整数かスライスです");
			}
		}
	}
	return val;
}
