/**
 * @abstract
 */
class Value
{
	/** @type {Array<value of JS|Value>} */
	// _args;

	/** @type {bigint|number|string|boolean|Array|Map|Value} */
	// _value;

	/** @type {Location} */
	// _loc;

	/** @type {number} */
	// _state;

    /* this._args は初期化時の値を保持する。型はArray<value of JS|Value>
	       argsPyPEN，argsPython，run，_makeValue だけで使う
       this._value は実行時に値を返すための値を保持する。getValue経由で読み出す
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
	constructor(v, loc, value = null)
	{
		if(!Array.isArray(v)) throw new RuntimeError(loc.first_line, "Valueの引数は配列でなければなりません:" + constructor_name(this)+":" + v._value + ":" + v._args+"\n");
		this._args = v;			// 初期化用のArray
		this._value = value;	// 実際の値
		this._loc = loc;		// ソース中の位置情報
		this._state = 0;		// 実行状態管理 run()で使う
		// Object.seal(this);	実体を作るときにはコンストラクタの末尾で有効にする
	}

	/**
	 * Throw RuntimeError with message
	 * @param {string} msg 
	 * @throws {RuntimeError}
	 */
	throwRuntimeError(msg)	// Value（およびサブクラス）の外から呼ばないこと
	{
		throw new RuntimeError(this._loc.first_line, constructor_name(this) + ": " + msg);
	}

	copy()
	{
		return this;
	}

	/**
	 * Locationを返す
	 * @returns {Location}
	 */
	getLoc()
	{
		return this._loc;
	}

	getState()
	{
		return this._state;
	}

	setState(i)
	{
		this._state = i;
	}

	/**
	 * this._argsを返す
	 */
	getArgs(idx = null)	// return Array<value of JS|Value>
	{
		if(idx === null) return this._args;
		else return this._args[idx];
	}

	/* newpage */
	/* サブクラスで実装するメソッド
	   clone()		: Value		複製を作る。this._argsの要素をcloneしたArrayで初期化する（this._valueはnull）
	   _makeValue() : void		this._valueを作る。runから呼ばれる
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
		this.throwRuntimeError("cloneが作られていません");
	}

	/**
	 * this._valueを作る。実体のあるサブクラスでは必ずオーバーライドする
	 * @abstract
	 */
	_makeValue()
	{
		this.throwRuntimeError("_makeValueが作られていません");
	}

	/**
	 * this._argsを実行する
	 * this._valueは_makeValueで作る
	 */
	run()
	{
		if(this.getState() == 0)
		{
			if(this.getArgs().length > 0)
				code[0].stack.unshift({statementlist: this.getArgs(), index: 0});
			this.setState(1);
		}
		else
		{
			code[0].stack[0].index++;
			this._makeValue();
			this.setState(0);
		}
	}


	/**
	 * @abstract
	 * @returns {Value}
	 */
	getValue() //Valueを返す。
	{
		this.throwRuntimeError("getValueが作られていません");
	}

	/**
	 * @returns {bigint|number|string|boolean|Array|Map}
	 */
	getJSValue()	// 実際のJSの値を返す
	{
		this.throwRuntimeError("getJSValueが作られていません");
	}

	/**
	 * @abstract
	 */
	setValue()
	{
		this.throwRuntimeError("setValueが作られていません");
	}

	/**
	 * @abstract
	 * @returns {string}
	 */
	argsPyPEN()	// PyPENの文法で表した文字列
	{
		this.throwRuntimeError("argsPyPENが作られていません");
	}
	/**
	 * @abstract
	 * @returns {string}
	 */
	argsPython()	// Pythonの文法で表した文字列
	{
		this.throwRuntimeError("argsPythonが作られていません");
	}
	/**
	 * @abstract
	 * @returns {string}
	 */
	valueString()
	{
		this.throwRuntimeError("valueStringが作られていません");
	}
	/**
	 * @abstract
	 * @returns {string}
	 */
	valueCode()
	{
		this.throwRuntimeError("valueCodeが作られていません");
	}
}

/**
 * @abstract
 * IntValue, FloatValue, StringValue, BooleanValue, NullValue，UNDEFINED
 * this._valueはvalue of JS
 */
class PrimitiveValue extends Value
{
	/**
	 * 
	 * @param {Array<bigint|number|string|boolean>} v
	 * @param {Location} loc
	 */
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
	}
	run()
	{
		code[0].stack[0].index++;
		this._makeValue();
	}

	/* サブクラスで実装するメソッド
	   clone()		: Value		複製を作る。this._argsの要素をcloneしたArrayで初期化する（this._valueはnull）
	----------------------------
	   _makeValue() : void		IntValue, FloatValueではオーバーライド
	   argsPyPEN(), argsPython(), valueString(), valueCode() : FloatValue, StringValueではオーバーライド
	----------------------------*/

	_makeValue()
	{
		this._value = this.getArgs(0);
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
	 * 
	 * @returns {value of JS}
	 */
	getJSValue()
	{
		return this._value;
	}
	/**
	 * @param {Value} v
	 */
	setValue(v)
	{
		this._args[0] = this._value = v.getJSValue();
	}
	argsPyPEN()
	{
		return this.getArgs(0).toString();
	}
	argsPython()
	{
		return this.getArgs(0).toString();
	}
	valueString()
	{
		return this._value.toString();
	}
	valueCode()
	{
		return this._value.toString();
	}
}

/**
 * @abstract
 * CallFunction, Variable，Assignなど
 * this._valueはValue
 */
class SimpleValue extends Value
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
	}
	/* サブクラスで実装するメソッド
	   clone()		: Value		複製を作る。this._argsの要素をcloneしたArrayで初期化する（this._valueはnull）
	   _makeValue() : void		this._valueを作る。runから呼ばれる
	----------------------------*/
	run()
	{
		if(this.getState() == 0)
		{
			if(this.getArgs().length > 0)
				code[0].stack.unshift({statementlist: this.getArgs(), index: 0});
			this.setState(1);
		}
		else
		{
			code[0].stack[0].index++;
			this._makeValue();
			this.setState(0);
		}
	}
	getValue()
	{
		return this._value;
	}	
	getJSValue()
	{
		return this._value.getJSValue();
	}
	/**
	 * 
	 */
	setValue(v)
	{
		// this._value = 
		this._args[0] = v;
		this._makeValue();
	}
	argsPyPEN()
	{
		return this.getArgs(0).argsPyPEN();
	}
	argsPython()
	{
		return this.getArgs(0).argsPython();
	}
	valueString()
	{
		return valueString(this.getJSValue());
	}
	valueCode()
	{
		return valueCode(this.getJSValue());
	}
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
	 * @param {value of JS} value
	 */
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
	}

	/* サブクラスで実装するメソッド
	   clone()		: Value		複製を作る。this._argsの要素をcloneしたArrayで初期化する（this._valueはnull）
	   _makeValue() : void		this._valueを作る。runから呼ばれる
	   setValue()	: void		this._valueを設定する
	   argsPyPEN()	: string	PyPENの文法で表した文字列
	   argsPython() : string	Pythonの文法で表した文字列
	   valueString(): string	this._valueを文字列で表したもの
	   valueCode()	: string	this._valueをコードで表したもの
	----------------------------*/

	/**
	 * 
	 * @returns {Value|Array<Value>|Map<value of JS,Value>}
	 */
	getValue(idx = null)
	{
		if(idx === null) return this;
		return this._value[idx];
	}
	getJSValue(idx = null)
	{
		if(idx === null) return this._value;
		return this._value[idx].getJSValue();
	}

	/**
	 * @abstract
	 */
	_makeValue()
	{
		this.throwRuntimeError("_makeValueが作られていません");
	}
	run()
	{
		if(this.getState() == 0)
		{
			if(this.getArgs().length > 0)
				code[0].stack.unshift({statementlist: this.getArgs(), index: 0});
			this.setState(1);
		}
		else
		{
			code[0].stack[0].index++;
			this._makeValue();
			this.setState(0);
		}
	}
}

class IntValue extends PrimitiveValue
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value === null ? null : BigInt(value));
		Object.seal(this);
	}

	clone()
	{
		return new IntValue(this.getArgs(), this.getLoc(), this._value);
	}

	copy()
	{
		return new IntValue([this._value], this.getLoc(), this._value);
	}

	_makeValue()
	{
		try{
			this._value = BigInt(this.getArgs()[0]);
		}
		catch(e)
		{
			if(e instanceof RangeError)
				this.throwRuntimeError("整数で表せない値が使われました");
			else throw e;
		}
	}
}

class FloatValue extends PrimitiveValue
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		Object.seal(this);
	}

	clone()
	{
		return new FloatValue(this.getArgs(), this.getLoc(), this._value);
	}
	copy()
	{
		return new FloatValue([this._value], this.getLoc(), this._value);
	}
	/**
	 * @param {number} v 
	 * @returns {string}
	 */
	_toString(v)
	{
		// textareaAppend("FloatValue#toString: " + constructor_name(v) + "\n");
		if(isSafeInteger(v)) return (v).toFixed(1);
		else return (v).toString();
	}
	argsPyPEN()
	{
		return this._toString(this.getArgs(0));
	}
	argsPython()
	{
		return this._toString(this.getArgs(0));
	}
	valueString()
	{
		return this._toString(this.getJSValue());
	}
	valueCode()
	{
		return this._toString(this.getJSValue());
	}
}

class StringValue extends PrimitiveValue
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		Object.seal(this);
	}

	clone()
	{
		return new StringValue(this.getArgs(), this.getLoc(), this._value);
	}
	copy()
	{
		return new StringValue([this._value], this.getLoc(), this._value);
	}

	argsPyPEN()
	{
		return "'" + this.getArgs(0).replace(/'/g, "\\'") + "'";
	}
	argsPython()
	{
		return "'" + this.getArgs(0).replace(/'/g, "\\'") + "'";
	}
	valueString()
	{
		return this._value;
	}
	valueCode()
	{
		return "'" + this._value.replace(/'/g, "\\'") + "'";
	}
	valueLength()
	{
		return this._value.length;
	}
}

class BooleanValue extends PrimitiveValue
{
	/**
	 * 
	 * @param {boolean} v 
	 * @param {Location} loc 
	 */
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		Object.seal(this);
	}
	clone()
	{
		return new BooleanValue(this.getArgs(), this.getLoc(), this._value);
	}
	copy()
	{
		return new BooleanValue([this._value], this.getLoc(), this._value);
	}
	valueString()
	{
		return (this._value ? 'true' : 'false');
	}
	valueCode()
	{
		return  (this._value ? 'true' : 'false');
	}
}

class NullValue extends PrimitiveValue
{
	constructor(loc)
	{
		super([], loc);
		Object.seal(this);
	}

	clone()
	{
		return new NullValue(this.getLoc());
	}
	copy()
	{
		return new NullValue(this.getLoc());
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
	valueString()
	{
		return '';
	}
}

class UNDEFINED extends PrimitiveValue	// 未完成のプログラム用
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		Object.seal(this);
	}
	clone()
	{
		return new UNDEFINED(this.getArgs(), this.getLoc(), this.getArgs(0));
	}
	run()
	{
		this.throwRuntimeError("未完成のプログラムです");
	}
	copy()
	{
		return new UNDEFINED([this.getArgs(0)], this.getLoc(), this.getArgs(0));
	}
	argsPyPEN()
	{	
		return this.getArgs(0);
	}
	argsPython()
	{
		return this.getArgs(0);
	}
	valueCode()
	{
		return this.getArgs(0);
	}
	valueString()
	{
		return this.getArgs(0);
	}
}

/*********************************** Complex Value classes */

class SliceValue extends CollectionValue
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		Object.seal(this);
	}

	clone()
	{
		return new SliceValue([this.getArgs(0).clone(), this.getArgs(1).clone()], this.getLoc());
		// ,this._value ? this._value.slice() : null);
	}
	copy()
	{
		return new SliceValue([this.getArgs(0).copy(), this.getArgs(1).copy()], this.getLoc(), this._value);
	}
	_makeValue()
	{
		// if(!this._value)
		{
			this._value = [ this.getArgs(0).getValue(), this.getArgs(1).getValue() ];
			// this.getArgs(0) instanceof PrimitiveValue ? this.getArgs(0).getValue() : this.getArgs(0),
			// this.getArgs(1) instanceof PrimitiveValue ? this.getArgs(1).getValue() : this.getArgs(1)
			// ];
		}
	}

	argsPyPEN()
	{
		return this.getArgs(0).argsPyPEN() + ":" + this.getArgs(1).argsPyPEN();
	}
	argsPython()
	{
		var p1 = this.getArgs(0).argsPython();
		var p2 = this.getArgs(1).argsPython();
		return  p1 + ":" + p2;
	}
	valueString()
	{
		return this.getArgs(0).valueString() + ":" + this.getArgs(1).valueString();
	}
	valueCode()
	{
		return this.getArgs(0).valueCode() + ":" + this.getArgs(1).valueCode();
	}
	setValue(v1, v2)	// must be Value
	{
		if(! (v1 instanceof Value) || ! (v2 instanceof Value))
			this.throwRuntimeError("SliceValue#setValueの引数はValueでなければなりません");
		this._args[0] = v1;
		this._args[1] = v2;
		this._makeValue();
	}
	getArgs(idx = null)
	{
		if(idx === null) return this._args;
		else return this._args[idx];
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
	constructor(v,loc, value = null)
	{
		super(v, loc, value);
		Object.seal(this);
	}
	/* サブクラスで実装するメソッド
	   _makeValue() : void		this._valueを作る。runから呼ばれる
	   argsPyPEN()	: string	PyPENの文法で表した文字列
	   argsPython() : string	Pythonの文法で表した文字列
	   valueString(): string	this._valueを文字列で表したもの
	   valueCode()	: string	this._valueをコードで表したもの
	----------------------------*/

	clone()
	{
		var a = [], v = [];
		for(var i of this.getArgs()) a.push(i.clone());
		if(this._value)for(var i of this._value) v.push(i.clone());
		return new ArrayValue(a, this.getLoc());//, this._value ? v : null);
	}
	copy()
	{
		var a = [], v = [];
		for(var i of this.getValue()._value) a.push(i.copy());
		return new ArrayValue(a, this.getLoc(), a);
	}

	_makeValue()
	{
		// if(!this._value)
		{
			this._value = [];
			for(var i = 0; i < this.getArgs().length; i++) 
				this._value.push(this.getArgs(i).getValue());
				// this.getArgs(i) instanceof PrimitiveValue ? 
				// 	this.getArgs(i).getValue() : 
				// 	this.getArgs(i).getValue());
		}
	}
	getValue(idx = null)
	{
		if(idx === null) return this;
		if(idx < 0) idx += this._value.length;
		if(idx >= 0 && idx < this._value.length) return this._value[idx];
		else this.throwRuntimeError("リストの範囲外の値を取得しようとしました");
	}
	getJSValue(idx = null)
	{
		if(idx === null) return this._value;
		if(idx < 0) idx += this._value.length;
		if(idx >= 0 && idx < this._value.length) return this._value[idx].getJSValue();
		else this.throwRuntimeError("リストの範囲外の値を取得しようとしました");
	}
	setValue(v, idx)
	{
		if(idx < 0) idx += this._value.length;
		if(idx >= 0 && idx < this._value.length)
		{
			this._args[idx] = v; //this._value[idx] = v;
			this._makeValue();
		}
		else this.throwRuntimeError("リストの範囲外に値を設定しようとしました");
	}
	argsPyPEN()
	{
		var v = [];
		for(var i = 0; i < this.getArgs().length; i++) v.push(this.getArgs(i).argsPyPEN());
		return '[' + v.join(', ') + ']';
	}
	argsPython()
	{
		var v = [];
		for(var i = 0; i < this.getArgs().length; i++) v.push(this.getArgs(i).argsPython());
		return '[' + v.join(', ') + ']';
	}
	valueString()
	{
		var v = [];
		for(var i = 0; i < this._value.length; i++) v.push(valueCode(this._value[i]));
		return '[' + v.join(', ') + ']';
	}
	valueCode()
	{
		var v = [];
		for(var i = 0; i < this._value.length; i++) v.push(valueCode(this._value[i]));
		return '[' + v.join(', ') + ']';
	}

	/**
	 * 
	 * @param {Value} a 
	 */
	append(a)
	{
		this._args.push(a);
		this._makeValue();
		// this._value.push(a);
	}
	/**
	 * 
	 * @param {Array<Value>} a 
	 */
	extend(a)
	{
		for(var i of a) 
		{
			this._args.push(i);
			// this._value.push(i);
		}
		this._makeValue();
	}
	valueLength()
	{
		return this._value.length;
	}
}

/**
 * 辞書
 */
class DictionaryValue extends CollectionValue
{
	/**
	 * @constructor
	 * @param {Array<SliceValue>} v
	 * @param {Location} loc
	 */
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		Object.seal(this);
	}
	/* サブクラスで実装するメソッド
	   clone()		: Value		複製を作る。this._argsの要素をcloneしたArrayで初期化する（this._valueはnull）
	   _makeValue() : void		this._valueを作る。runから呼ばれる
	   argsPyPEN()	: string	PyPENの文法で表した文字列
	   argsPython() : string	Pythonの文法で表した文字列
	   valueString(): string	this._valueを文字列で表したもの
	   valueCode()	: string	this._valueをコードで表したもの
	----------------------------*/
	clone()
	{
		var a =[], m = new Map();
		for(var arg of this._args)
		{
			a.push(arg.clone());
			var key = arg.getArgs(0).clone();
			var val = arg.getArgs(1).clone();
			m.set(key.getJSValue(), val.clone());
		}
		return new DictionaryValue(a, this.getLoc(), m);
	}
	copy()
	{
		var a =[], m = new Map();
		for(var arg of this._args)
		{
			a.push(arg.copy());
			var key = arg.getArgs(0).copy();
			var val = arg.getArgs(1).copy();
			m.set(key.getJSValue(), val.copy());
		}
		return new DictionaryValue(a, this.getLoc(), m);
	}

    _makeValue()
	{
		// if(!this._value)
		{
			this._value = new Map();
			for(var i = 0; i < this.getArgs().length; i++)
			{
				if(this.getArgs(i) instanceof SliceValue)
				{
					var key = this.getArgs(i).getValue1();
					var val = this.getArgs(i).getValue2();
					if(isPrimitive(key.getValue())) this._value.set(key.getJSValue(), val.getValue());
					else this.throwRuntimeError("辞書のキーには単純型しか使えません");
				}
				else this.throwRuntimeError("辞書の初期化が間違っています");
			}
		}
    }
	has(key)
	{
		this._value.has(key);
	}
	getValue(key = null)
	{
		if(key === null) return this;
		if(isPrimitive(key.getValue())) return this._value.get(key.getJSValue());
		else this.throwRuntimeError("辞書のキーには単純型しか使えません");
	}
	getJSValue(key = null)
	{
		if(key === null) return this._value;
		if(isPrimitive(key.getValue())) return this._value.get(key.getJSValue()).getJSValue();
		else this.throwRuntimeError("辞書のキーには単純型しか使えません");
	}
	setValue(v, key)
	{
		if(isPrimitive(key.getValue())) //this._value.set(key.getJSValue(), v);
		{
			for(var i in this._args)
				if(this._args[i].getValue1().getJSValue() === key.getJSValue())
				{
					this._args[i] = new SliceValue([key.getValue(), v], this.getLoc(),[key.getValue(),v]);
					this._makeValue();
					return;
				}
			// キーがなかったときは追加
			this._args.push(new SliceValue([key.getValue(), v], this.getLoc(),[key.getValue(),v]));
			// this._value.set(key.getJSValue(), v);
			this._makeValue();
		}
		else this.throwRuntimeError("辞書のキーには単純型しか使えません");
	}

	argsPyPEN()
	{
		var ag = [];
		for(var arg of this.getArgs()) ag.push(arg.argsPyPEN());
		return '{' + ag.join(', ') + '}';
	}
	argsPython()
	{
		var ag = [];
		for(var arg of this._args) ag.push(arg.argsPython());
		return '{' + ag.join(', ') + '}';
	}
	valueString()
	{
		var ag = [];
		for(var [k,v] of this._value.entries())	
		{
			if(typeof(k) === "string") k = "'" + k + "'";
			if(typeof(k) === "number" && isSafeInteger(k)) k = k.toString() + ".0";
			ag.push(k + ':' + v.valueCode());
		}
		return '{' + ag.join(', ') + '}';
	}
	valueCode()
	{
		var ag = [];
		for(var [k,v] of this._value.entries())
		{
			if(typeof(k) === "string") k = "'" + k.replace(/'/g, "\\'") + "'";
			if(typeof(k) === "number" && isSafeInteger(k)) k = k.toString() + ".0";
			ag.push(k + ':' + v.valueCode());
		}
		return '{' + ag.join(', ') + '}';
	}
}

/**
 * 値渡しをする
 */
class Copy extends SimpleValue
{
	/**
	 * 
	 * @param {Value} v 
	 * @param {Location} loc 
	 */
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		Object.seal(this);
	}
	/* サブクラスで実装するメソッド
	   clone()		: Value		複製を作る。this._argsの要素をcloneしたArrayで初期化する（this._valueはnull）
	   _makeValue() : void		this._valueを作る。runから呼ばれる
	----------------------------*/
	clone()
	{
		return new Copy([this.getArgs(0).clone()], this.getLoc());
		// , this._value ? this._value.clone() : null);
	}
	copy()
	{
		return new Copy([this.getArgs(0).copy()], this.getLoc());
	}
	_makeValue()
	{
		var v = this.getArgs(0).getValue().copy();
		this._value = v;
	}
	argsPyPEN()
	{
		return "copy(" + this.getArgs(0).getPyPEN() + ")";
	}
	argsPython()
	{
		return  this.getArgs(0).argsPython() + ".copy()";
	}
	valueString()
	{
		return this.getValue().valueString();
	}
	valueCode()
	{
		return this.getValue().valueCode();
	}
}

class Variable extends SimpleValue
{
	/**
	 * 
	 * @param {string} x 
	 * @param {Array<Value>} y 
	 * @param {Location} loc 
	 */
	constructor(x, loc, value = null)
	{
		super([],loc, value);
		this.varname = x;
		this._value = null;
		Object.seal(this);
		if(debug_mode && !(loc instanceof Location)) 
			textareaAppend("Error Variable#constructor: " +x +": "+ constructor_name(loc) + "\n");
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i.clone());
		var rtnv = new Variable(this.varname, this.getLoc());
		// var rtnv = new Variable(this.varname, this.getLoc(), this._value ? this._value.clone() : null);
		rtnv._args = a;
		return rtnv;
	}
	_makeValue()
	{

	}

	getValue()
	{
		var vt = findVarTable(this.varname);
		if(vt)
		{
			var v = vt.vars[this.varname];
			return this._value = getValueByArgs(v, this.getArgs() , this.getLoc());
		}
		else this.throwRuntimeError("変数に" + this.varname + "がありません");
	}

	getJSValue()
	{
		return this.getValue().getJSValue();
	}

	setValue(v)
	{
		setVariableByArgs(this.varname, v, this.getArgs(), this.getLoc());
		this._makeValue();
		// this._value = v;
	}
	argsPyPEN()
	{
		if(this.getArgs().length > 0)
		{
			let ag = [];
			for(var i of this.getArgs()) ag.push(i.argsPyPEN());
			return this.varname + '['+ag.join(', ')+']';
		}
		return this.varname;
	}
	argsPython()
	{
		if(this.getArgs().length > 0)
		{
			let ag = [];
			for(var i of this.getArgs()) ag.push(i.argsPython());
			return this.varname + '['+ag.join(', ')+']';
		}
		return this.varname;
	}
	valueString()
	{
		return valueString(this.getValue());
	}
	valueCode()
	{
		return valueCode(this.getValue());
	}

	/**
	 * @param {Value} a 
	 */
	append(a)
	{
		this._args.push(a);
		// if(!this._args[1]) this._args[1] = new ArrayValue([a], this.getLoc(),[a]);
		// else this._args[1]._args.push(a);
	}
	/**
	 * 
	 * @param {Array<Value>} a 
	 */
	extend(a)
	{
		for(var i of a) this._args.push(i);
	}
}

/*********************************** Valueの演算 */

class Pow extends SimpleValue
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		Object.seal(this);
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i.clone());
		return new Pow(a, this._loc);
	}
	_makeValue()
	{
		let v1 = this.getArgs()[0].getValue(), v2 = this.getArgs()[1].getValue();
		if(v1 instanceof IntValue && v2 instanceof IntValue) // 整数の自然数乗
		{
			v1 = v1.getJSValue()
			v2 = v2.getJSValue()
			if(v1 == 0 && v2 <= 0) this.throwRuntimeError("0は正の数乗しかできません");
			try{
				if(v2 >= 0)
				{
					var v = v1 ** v2;
					this._value = new IntValue([v], this.getLoc(), v);
				}
				else
				{
					var v = Number(v1) ** Number(v2);
					this._value = new FloatValue([v], this.getLoc(), v);
				}
			}
			catch(e){
				if(e instanceof RangeError) this.throwRuntimeError("計算できない値です");
				else throw e;
			}
		}
		else if((v1 instanceof IntValue || v1 instanceof FloatValue) && (v2 instanceof IntValue || v2 instanceof FloatValue))
		{
			v1 = Number(v1.getJSValue());
			v2 = Number(v2.getJSValue());
			if(v1 < 0 && !Number.isSafeInteger(v2)) 
				this.throwRuntimeError("負の数の非整数乗はできません");
			if(v1 == 0 && v2 <= 0) this.throwRuntimeError("0は正の数乗しかできません");
			try{
				let v = v1 ** v2;
				if(isFinite(v)) this._value = new FloatValue([v], this.getLoc(), v);
				else this.throwRuntimeError("オーバーフローしました");
			}
			catch(e)
			{
				if(e instanceof RangeError) this.throwRuntimeError("計算できない値です");
				else throw e;
			}
		} else this.throwRuntimeError('数値でないもののべき乗はできません');
	}
	getCode()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub" || c1 == "Mul" || c1 == "Div" || c1 == "DivInt" || c1 == "Mod") brace1 = true;
		if(c2 == "Minus" || c2 == "Add" || c2 == "Sub" || c2 == "Mul" || c2 == "Div" || c2 == "DivInt" || c2 == "Mod") brace2 = true;
		return (brace1 ? '(' : '') + v1.getCode() + (brace1 ? ')' : '')
			+ '**'
			+ (brace2 ? '(' : '') + v2.getCode() + (brace2 ? ')' : '')
	}
	argsPython()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub" || c1 == "Mul" || c1 == "Div" || c1 == "DivInt" || c1 == "Mod") brace1 = true;
		if(c2 == "Minus" || c2 == "Add" || c2 == "Sub" || c2 == "Mul" || c2 == "Div" || c2 == "DivInt" || c2 == "Mod") brace2 = true;
		return (brace1 ? '(' : '') + v1.argsPython() + (brace1 ? ')' : '')
			+ ' ** '
			+ (brace2 ? '(' : '') + v2.argsPython() + (brace2 ? ')' : '')
	}
}

class Add extends SimpleValue
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		// Object.seal(this);
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i.clone());
		return new Add(a, this.getLoc());
	}
	run()
	{
		if(this.getState() == 0)
		{

			code[0].stack.unshift({statementlist: this.getArgs(), index: 0});
			this.setState(1);
		}
		else if(this.getState() == 1)
		{
			code[0].stack[0].index++;
			this._makeValue();
			this.setState(0);
		}
	}
	_makeValue()
	{
		let v1 = this.getArgs()[0].getValue(), v2 = this.getArgs()[1].getValue();
		if(v1 instanceof ArrayValue && v2 instanceof ArrayValue)
		{
			let v = [];
			for(let i = 0; i < v1.valueLength(); i++) v.push(v1.getValue(i));
			for(let i = 0; i < v2.valueLength(); i++) v.push(v2.getValue(i));
			this._value = new ArrayValue([v], this.getLoc(), v);
		}
		else if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) this.throwRuntimeError("リストと足し算ができるのはリストどうしだけです");
		else if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) this.throwRuntimeError("真偽型の足し算はできません");
		else if(v1 instanceof StringValue || v2 instanceof StringValue) // 一方でも文字列なら文字列結合
		{
			var s = v1.getJSValue() + v2.getJSValue();
			this._value = new StringValue([s], this.getLoc(), s);
		}
		else	// 数値どうし
		{
			if(v1 instanceof FloatValue || v2 instanceof FloatValue)	// 一方が実数型なら結果は実数型
			{
				let v =Number(v1.getJSValue()) + Number(v2.getJSValue());
				if(!isFinite(v)) this.throwRuntimeError("オーバーフローしました");
				this._value = new FloatValue([v], this.getLoc(), v);
			}
			else	// 整数型
			{
				try{
					var v = v1.getJSValue() + v2.getJSValue();
					this._value = new IntValue([v], this.getLoc(), v);
				}
				catch(e)
				{
					if(e instanceof RangeError) this.throwRuntimeError("計算できない値です");
					else throw e;
				}
			}
		}
	}
	argsPyPEN()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus") brace1 = true;
		if(c2 == "Minus") brace2 = true;
		return (brace1 ? '(' : '') + v1.argsPyPEN() + (brace1 ? ')' : '')
			+ '+'
			+ (brace2 ? '(' : '') + v2.argsPyPEN() + (brace2 ? ')' : '')
	}
	argsPython()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus") brace1 = true;
		if(c2 == "Minus") brace2 = true;
		return (brace1 ? '(' : '') + v1.argsPython() + (brace1 ? ')' : '')
			+ ' + '
			+ (brace2 ? '(' : '') + v2.argsPython() + (brace2 ? ')' : '')
	}
}

class Sub extends SimpleValue
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		Object.seal(this);
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i.clone());
		return new Sub(a, this.getLoc());
	}
	_makeValue()
	{
		let v1 = this.getArgs()[0].getValue(), v2 = this.getArgs()[1].getValue();
		if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) this.throwRuntimeError("リストの引き算はできません");
		if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) this.throwRuntimeError("真偽型の引き算はできません");
		if(v1 instanceof StringValue || v2 instanceof StringValue) this.throwRuntimeError("文字列の引き算はできません");
		if(v1 instanceof FloatValue || v2 instanceof FloatValue)
		{
			v1 = v1.getJSValue();
			v2 = v2.getJSValue();
			let v = Number(v1) - Number(v2);
			if(!isFinite(v)) this.throwRuntimeError("オーバーフローしました");
			this._value = new FloatValue([v], this.getLoc(), v);
		}
		else
		{
			try{
				// textareaAppend("Sub#makeValue: v1=" + constructor_name(v1) + ", v2=" + constructor_name(v2) + "\n");
				v1 = v1.getJSValue();
				v2 = v2.getJSValue();
				// textareaAppend("Sub#makeValue: v1=" + constructor_name(v1) + v1 + ", v2=" + constructor_name(v2) + v2+"\n");
				let v = v1 - v2;
				this._value = new IntValue([v], this.getLoc(), v);
			}
			catch(e)
			{
				if(e instanceof RangeError) 
					this.throwRuntimeError("計算できない値です");
				else throw e;
			}
		}
	}
	argsPyPEN()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus") brace1 = true;
		if(c2 == "Minus") brace2 = true;
		return (brace1 ? '(' : '') + v1.argsPyPEN() + (brace1 ? ')' : '')
			+ '-'
			+ (brace2 ? '(' : '') + v2.argsPyPEN() + (brace2 ? ')' : '')
	}
	argsPython()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus") brace1 = true;
		if(c2 == "Minus") brace2 = true;
		return (brace1 ? '(' : '') + v1.argsPython() + (brace1 ? ')' : '')
			+ ' - '
			+ (brace2 ? '(' : '') + v2.argsPython() + (brace2 ? ')' : '')
	}
}

class Mul extends SimpleValue
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		Object.seal(this);
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i.clone());
		return new Mul(a, this.getLoc());
	}
	_makeValue()
	{
		let v1 = this.getArgs()[0].getValue(), v2 = this.getArgs()[1].getValue();
		if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) 
			this.throwRuntimeError("真偽型のかけ算はできません");
		else if(v1 instanceof StringValue || v2 instanceof StringValue)
		{
			let va = null, vn = null;
			if(v1 instanceof IntValue){va = v2.getJSValue(); vn = Number(v1.getJSValue());}
			else if(v2 instanceof IntValue){va = v1.getJSValue(); vn = Number(v2.getJSValue());}
			else this.throwRuntimeError("文字列には整数しか掛けられません");
			let v = '';
			for(let i = 0; i < vn; i++) v += va;
			this._value = new StringValue([v], this.getLoc(), v);
		}
		else if(v1 instanceof ArrayValue || v2 instanceof ArrayValue)
		{
			let va = null, vn = null;
			if(v1 instanceof IntValue){va = v2; vn = v1.getJSValue();}
			else if(v2 instanceof IntValue){va = v1; vn = v2.getJSValue();}
			else this.throwRuntimeError("リストには整数しか掛けられません");
			let v = []
			for(let i = 0; i < vn; i++)
				for(let j = 0; j < va.valueLength(); j++) v.push(va.getValue(j));
			this._value = new ArrayValue(v, this.getLoc(), v);
		} 
		else
		{
			if(v1 instanceof FloatValue || v2 instanceof FloatValue)
			{
				let v = Number(v1.getJSValue()) * Number(v2.getJSValue());
				if(!isFinite(v)) this.throwRuntimeError("オーバーフローしました");
				this._value = new FloatValue([v], this.getLoc(), v);
			}
			else
			{
				try{
					var v = v1.getJSValue() * v2.getJSValue();
					this._value = new IntValue([v], this.getLoc(), v);
				}
				catch(e)
				{
					if(e instanceof RangeError) this.throwRuntimeError("計算できない値です");
					else throw e;
				}
			}
		}
	}
	argsPyPEN()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
		if(c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
		return (brace1 ? '(' : '') + v1.argsPyPEN() + (brace1 ? ')' : '')
			+ '*'
			+ (brace2 ? '(' : '') + v2.argsPyPEN() + (brace2 ? ')' : '')
	}
	argsPython()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
		if(c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
		return (brace1 ? '(' : '') + v1.argsPython() + (brace1 ? ')' : '')
			+ ' * '
			+ (brace2 ? '(' : '') + v2.argsPython() + (brace2 ? ')' : '')
	}
}

class Div extends SimpleValue	// /
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		// Object.seal(this);
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i.clone());
		return new Div(a, this.getLoc());
	}
	run()
	{
		if(this.getState() == 0)
		{

			code[0].stack.unshift({statementlist: this.getArgs(), index: 0});
			this.setState(1);
		}
		else if(this.getState() == 1)
		{
			code[0].stack[0].index++;
			this._makeValue();
			this.setState(0);
		}
	}
	_makeValue()
	{
		let v1 = this.getArgs()[0].getValue(), v2 = this.getArgs()[1].getValue();
		if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) 
			this.throwRuntimeError("リストのわり算はできません");
		if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) 
			this.throwRuntimeError("真偽型のわり算はできません");
		if(v1 instanceof StringValue || v2 instanceof StringValue) 
			this.throwRuntimeError("文字列のわり算はできません");
		if(v2.getJSValue() == 0) this.throwRuntimeError("0でわり算をしました");
		try{
			let v = Number(v1.getJSValue()) / Number(v2.getJSValue());
			if(!isFinite(v)) this.throwRuntimeError("オーバーフローしました");
			this._value = new FloatValue([v], this.getLoc(), v);
		}
		catch(e)
		{
			if(e instanceof RangeError) this.throwRuntimeError("計算できない値です");
			else throw e;
		}
	}
	argsPyPEN()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
		if(c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
			return (brace1 ? '(' : '') + v1.argsPyPEN() + (brace1 ? ')' : '')
			+ '/'
			+ (brace2 ? '(' : '') + v2.argsPyPEN() + (brace2 ? ')' : '')
	}
	argsPython()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
		if(c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
			return (brace1 ? '(' : '') + v1.argsPython() + (brace1 ? ')' : '')
			+ ' / '
			+ (brace2 ? '(' : '') + v2.argsPython() + (brace2 ? ')' : '')
	}
}

class DivInt extends SimpleValue // //
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		Object.seal(this);
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i.clone());
		return new DivInt(a, this.getLoc());
	}
	_makeValue()
	{
		let v1 = this.getArgs()[0].getValue(), v2 = this.getArgs()[1].getValue();
		if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) 
			this.throwRuntimeError("リストのわり算はできません");
		if(v1 instanceof BooleanValue || v2 instanceof BooleanValue) 
			this.throwRuntimeError("真偽型のわり算はできません");
		if(v1 instanceof StringValue || v2 instanceof StringValue) 
			this.throwRuntimeError("文字列のわり算はできません");
		if(v2.getJSValue() == 0) this.throwRuntimeError("0でわり算をしました");
		try{
			if(v1 instanceof IntValue && v2 instanceof IntValue){
				let r = v1.getJSValue() % v2.getJSValue();
				let q = v1.getJSValue() / v2.getJSValue();
				if(!SameSignBigInt(v1.getJSValue(), v2.getJSValue()) && r != 0) q--;
				this._value = new IntValue([q], this.getLoc(), q);
			}
			else{
				v1 = Number(v1.getJSValue());
				v2 = Number(v2.getJSValue());
				let v = Math.floor(v1 / v2);
				this._value = new FloatValue([v], this.getLoc(), v);
			}
		}
		catch(e)
		{
			if(e instanceof RangeError) this.throwRuntimeError("計算できない値です");
			else throw e;
		}
	}
	argsPyPEN()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
		if(c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
			return (brace1 ? '(' : '') + v1.argsPyPEN() + (brace1 ? ')' : '')
			+ '//'
			+ (brace2 ? '(' : '') + v2.argsPyPEN() + (brace2 ? ')' : '')
	}
	argsPython()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
		if(c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
			return (brace1 ? '(' : '') + v1.argsPython() + (brace1 ? ')' : '')
			+ ' // '
			+ (brace2 ? '(' : '') + v2.argsPython() + (brace2 ? ')' : '')
	}
}


class Mod extends SimpleValue
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		Object.seal(this);
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i.clone());
		return new Mod(a, this.getLoc());
	}
	_makeValue()
	{
		let v1 = this.getArgs()[0].getValue(), v2 = this.getArgs()[1].getValue();
		if(v1 instanceof IntValue && v2 instanceof IntValue){
			let r = v1.getJSValue() % v2.getJSValue();
			let q = (v1.getJSValue() - r) / v2.getJSValue();
			if(!SameSignBigInt(v1.getJSValue(), v2.getJSValue()) && r != 0) q--;
			var v = v1.getJSValue() - q * v2.getJSValue();
			// textareaAppend("Mod: " + v + " " + (typeof v) + "\n");
			this._value = new IntValue([v], this.getLoc(), v);
		}
		else
		{
			v1 = Number(v1.getJSValue());
			v2 = Number(v2.getJSValue());
			var v = v1 - Math.floor(v1 / v2) * v2;
			this._value = new FloatValue([v], this.getLoc(), v);
		}
	}
	argsPyPEN()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
		if(c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
		return (brace1 ? '(' : '') + v1.argsPyPEN() + (brace1 ? ')' : '')
			+ '%'
			+ (brace2 ? '(' : '') + v2.argsPyPEN() + (brace2 ? ')' : '')
	}
	argsPython()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
		if(c2 == "Minus" || c2 == "Add" || c2 == "Sub") brace2 = true;
		return (brace1 ? '(' : '') + v1.argsPython() + (brace1 ? ')' : '')
			+ ' % '
			+ (brace2 ? '(' : '') + v2.argsPython() + (brace2 ? ')' : '')
	}
}

class Minus extends SimpleValue
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		Object.seal(this);
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i.clone());
		return new Minus(a, this.getLoc());
	}
	_makeValue()
	{
		let v1 = this.getArgs()[0].getValue();
		if(v1 instanceof IntValue)
		{
			try{
				var v = -v1.getJSValue();
				this._value = new IntValue([v], this.getLoc(), v);
			}
			catch(e)
			{
				if(e instanceof RangeError) 
					this.throwRuntimeError("計算できない値です");
				else throw e;
			}
		}
		else if(v1 instanceof FloatValue)
		{
			let v = -v1.getJSValue();
			if(!isFinite(v)) this.throwRuntimeError("オーバーフローしました");
			this._value = new FloatValue([v], this.getLoc(), v);
		}
		else
			this.throwRuntimeError("マイナスは数値にしかつけられません");
	}
	argsPyPEN()
	{
		let v1 = this.getArgs()[0];
		let c1 = constructor_name(v1);
		let brace1 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
		return '-' + (brace1 ? '(' : '') + v1.argsPyPEN() + (brace1 ? ')' : '');
	}
	argsPython()
	{
		let v1 = this.getArgs()[0];
		let c1 = constructor_name(v1);
		let brace1 = false;
		if(c1 == "Minus" || c1 == "Add" || c1 == "Sub") brace1 = true;
		return '-' + (brace1 ? '(' : '') + v1.argsPython() + (brace1 ? ')' : '');
	}
}

class And extends SimpleValue
{
	constructor(v, loc, value = null)
	{
		super(v,loc, value);
		Object.seal(this);
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i.clone());
		return new And(a, this.getLoc());
	}
	_makeValue()
	{
		let v1 = this.getArgs()[0].getValue();
		if(v1 instanceof BooleanValue)
		{
			if(!v1.getJSValue()) 
			{
				this._value = new BooleanValue([false], this.getLoc(), false);
			}
			else
			{
				let v2 = this.getArgs()[1].getValue();
				if(v2 instanceof BooleanValue) 
				{
					var v = v2.getJSValue();
					this._value = new BooleanValue([v], this.getLoc(), v);
				}
			}
		}
		else
			this.throwRuntimeError("and は真偽値にしか使えません");
	}
	argsPyPEN()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c2 == "And" || c2 == "Or" || c2 == "Not") brace2 = true;
		return (brace1 ? '(' : '') + v1.argsPyPEN() + (brace1 ? ')' : '')
			+ ' and '
			+ (brace2 ? '(' : '') + v2.argsPyPEN() + (brace2 ? ')' : '')
	}
	argsPython()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c2 == "And" || c2 == "Or" || c2 == "Not") brace2 = true;
		return (brace1 ? '(' : '') + v1.argsPython() + (brace1 ? ')' : '')
			+ ' and '
			+ (brace2 ? '(' : '') + v2.argsPython() + (brace2 ? ')' : '')
	}
}

class Or extends SimpleValue
{
	constructor(v, loc, value = null)
	{
		super(v,loc, value);
		Object.seal(this);
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i.clone());
		return new Or(a, this.getLoc());
	}
	_makeValue()
	{
		let v1 = this.getArgs(0).getValue();
		if(v1 instanceof BooleanValue)
		{
			if(v1.getJSValue()) 
			{
				this._value = new BooleanValue([true], this.getLoc(), true);
			}
			else
			{
				let v2 = this.getArgs(1).getValue();
				if(v2 instanceof BooleanValue)
				{
					var v = v2.getJSValue();
					this._value = new BooleanValue([v], this.getLoc(), v);
				}
			}
		}
		else
			this.throwRuntimeError("or は真偽値にしか使えません");
	}
	argsPyPEN()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c2 == "And" || c2 == "Or" || c2 == "Not") brace2 = true;
		return (brace1 ? '(' : '') + v1.argsPyPEN() + (brace1 ? ')' : '')
			+ ' or '
			+ (brace2 ? '(' : '') + v2.argsPyPEN() + (brace2 ? ')' : '')
	}
	argsPython()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c2 == "And" || c2 == "Or" || c2 == "Not") brace2 = true;
		return (brace1 ? '(' : '') + v1.argsPython() + (brace1 ? ')' : '')
			+ ' or '
			+ (brace2 ? '(' : '') + v2.argsPython() + (brace2 ? ')' : '')
	}
}

class Not extends SimpleValue
{
	constructor(v, loc, value = null)
	{
		super(v,loc, value);
		Object.seal(this);
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i.clone());
		return new Not(a, this.getLoc());
	}
	_makeValue()
	{
		let v1 = this.getArgs(0).getValue();
		if(v1 instanceof Value){
			var v = !toBool(v1);
			this._value = new BooleanValue([v], this.getLoc(), v);
		}
		else this.throwRuntimeError("not は真偽値にしか使えません"
			+ debug_mode ? ("(" + constructor_name(v1) + ")") : ''
		);
	}
	argsPyPEN()
	{
		let v1 = this.getArgs()[0];
		let c1 = constructor_name(v1);
		let brace1 = false;
	//	if(c2 == "And" || c2 == "Or" || c2 == "Not") brace2 = true;
		return 'not ' + (brace1 ? '(' : '') + v1.argsPyPEN() + (brace1 ? ')' : '');
	}
	argsPython()
	{
		let v1 = this.getArgs()[0];
		let c1 = constructor_name(v1);
		let brace1 = false;
		if(c1 == "And" || c1 == "Or" || c1 == "Not") brace2 = true;
		return 'not ' + (brace1 ? '(' : '') + v1.argsPython() + (brace1 ? ')' : '');
	}
}

class BitAnd extends SimpleValue
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		Object.seal(this);
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i.clone());
		return new BitAnd(a, this.getLoc());
	}
	_makeValue()
	{
		let v1 = this.getArgs()[0].getValue(), v2 = this.getArgs()[1].getValue();
		if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) 
			this.throwRuntimeError("リストのビット積はできません");
		else if(v1 instanceof StringValue || v2 instanceof StringValue) 
			this.throwRuntimeError("文字列のビット積はできません");
		else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) 
		{
			var v = v1.getJSValue() & v2.getJSValue();
			this._value = new BooleanValue([v], this.getLoc(), v);
		}
		else if(v1 instanceof FloatValue || v2 instanceof FloatValue) 
			this.throwRuntimeError("実数のビット積はできません");
		else
		{
			try{
				v1 = v1 instanceof BooleanValue ? (v1.getJSValue() ? 1 : 0) : v1.getJSValue();
				v2 = v2 instanceof BooleanValue ? (v2.getJSValue() ? 1 : 0) : v2.getJSValue();
				this._value = new IntValue([v1 & v2], this.getLoc(), v1 & v2);
			}
			catch(e)
			{
				if(e instanceof RangeError) this.throwRuntimeError("計算できない値です");
				else throw e;
			}
		}
	}
	argsPyPEN()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift") brace1 = true;
		if(c2 == "Minus" || c2 == "BitRShift" || c2 == "BitLShift") brace2 = true;
		return (brace1 ? '(' : '') + v1.argsPyPEN() + (brace1 ? ')' : '')
			+ '&'
			+ (brace2 ? '(' : '') + v2.argsPyPEN() + (brace2 ? ')' : '')
	}
	argsPython()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift" || c1 == "BitNot") brace1 = true;
		if(c2 == "Minus" || c2 == "BitRShift" || c2 == "BitLShift" || c2 == "BitNot") brace2 = true;
		return (brace1 ? '(' : '') + v1.argsPython() + (brace1 ? ')' : '')
			+ ' & '
			+ (brace2 ? '(' : '') + v2.argsPython() + (brace2 ? ')' : '')
	}
}

class BitOr extends SimpleValue
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		Object.seal(this);
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i.clone());
		return new BitOr(a, this.getLoc());
	}
	_makeValue()
	{
		let v1 = this.getArgs()[0].getValue(), v2 = this.getArgs()[1].getValue();
		if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) 
			this.throwRuntimeError("リストのビット和はできません");
		else if(v1 instanceof StringValue || v2 instanceof StringValue) 
			this.throwRuntimeError("文字列のビット和はできません");
		else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue)
		{
			var v = v1.getJSValue() | v2.getJSValue();
			this._value = new BooleanValue([v], this.getLoc(), v);
		}
		else if(v1 instanceof FloatValue || v2 instanceof FloatValue) 
			this.throwRuntimeError("実数のビット和はできません");
		else
		{
			try{
				v1 = v1 instanceof BooleanValue ? (v1.getJSValue() ? 1 : 0) : v1.getJSValue();
				v2 = v2 instanceof BooleanValue ? (v2.getJSValue() ? 1 : 0) : v2.getJSValue();
				var v = v1 | v2;
				this._value = new IntValue([v], this.getLoc(), v);
			}
			catch(e)
			{
				if(e instanceof RangeError) 
					this.throwRuntimeError("計算できない値です");
				else throw e;
			}
		}
	}
	argsPyPEN()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift" || c1 == "BitNot") brace1 = true;
		if(c2 == "Minus" || c2 == "BitRShift" || c2 == "BitLShift" || c2 == "BitNot") brace2 = true;
		return (brace1 ? '(' : '') + v1.argsPyPEN() + (brace1 ? ')' : '')
			+ '|'
			+ (brace2 ? '(' : '') + v2.argsPyPEN() + (brace2 ? ')' : '')
	}
	argsPython()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift" || c1 == "BitNot") brace1 = true;
		if(c2 == "Minus" || c2 == "BitRShift" || c2 == "BitLShift" || c2 == "BitNot") brace2 = true;
		return (brace1 ? '(' : '') + v1.argsPython() + (brace1 ? ')' : '')
			+ ' | '
			+ (brace2 ? '(' : '') + v2.argsPython() + (brace2 ? ')' : '')
	}
}

class BitXor extends SimpleValue
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		Object.seal(this);
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i.clone());
		return new BitXor(a, this.getLoc());
	}
	_makeValue()
	{
		let v1 = this.getArgs(0).getValue(), v2 = this.getArgs(1).getValue();
		if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) 
			this.throwRuntimeError("リストの排他的ビット和はできません");
		else if(v1 instanceof StringValue || v2 instanceof StringValue) 
			this.throwRuntimeError("文字列の排他的ビット和はできません");
		else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue)
		{
			var v = v1.getJSValue() ^ v2.getJSValue();
			this._value = new BooleanValue([v], this.getLoc(), v);
		}
		else if(v1 instanceof FloatValue || v2 instanceof FloatValue) 
			this.throwRuntimeError("実数の排他的ビット和はできません");
		else
		{
			try{
				v1 = v1 instanceof BooleanValue ? (v1.getJSValue() ? 1 : 0) : v1.getJSValue();
				v2 = v2 instanceof BooleanValue ? (v2.getJSValue() ? 1 : 0) : v2.getJSValue();
				var v = v1 ^ v2;
				this._value = new IntValue([v], this.getLoc(), v);
			}
			catch(e)
			{
				if(e instanceof RangeError) 
					this.throwRuntimeError("計算できない値です");
				else throw e;
			}
		}
	}
	argsPyPEN()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift" || c1 == "BitNot") brace1 = true;
		if(c2 == "Minus" || c2 == "BitRShift" || c2 == "BitLShift" || c2 == "BitNot") brace2 = true;
		return (brace1 ? '(' : '') + v1.argsPyPEN() + (brace1 ? ')' : '')
			+ '^'
			+ (brace2 ? '(' : '') + v2.argsPyPEN() + (brace2 ? ')' : '')
	}
	argsPython()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift" || c1 == "BitNot") brace1 = true;
		if(c2 == "Minus" || c2 == "BitRShift" || c2 == "BitLShift" || c2 == "BitNot") brace2 = true;
		return (brace1 ? '(' : '') + v1.argsPython() + (brace1 ? ')' : '')
			+ ' ^ '
			+ (brace2 ? '(' : '') + v2.argsPython() + (brace2 ? ')' : '')
	}
}

class BitNot extends SimpleValue
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		Object.seal(this);
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i.clone());
		return new BitNot(a, this.getLoc());
	}
	_makeValue()
	{
		let v1 = this.getArgs(0).getValue()
		if(v1 instanceof ArrayValue) 
			this.throwRuntimeError("リストのビット反転はできません");
		else if(v1 instanceof StringValue) 
			this.throwRuntimeError("文字列のビット反転はできません");
		else if(v1 instanceof BooleanValue)
		{
			var v = !v1.getJSValue();
			this._value = new BooleanValue([v], this.getLoc(), v);
		}
		else if(v1 instanceof FloatValue) 
			this.throwRuntimeError("実数のビット反転はできません");
		else
		{
			try{
				var v = v1 instanceof BooleanValue ? (v1.getJSValue() ? 0 : 1) : ~v1.getJSValue();
				this._value = new IntValue([v], this.getLoc(), v);
			}
			catch(e)
			{
				if(e instanceof RangeError) 
					this.throwRuntimeError("計算できない値です");
				else throw e;
			}
		}
	}
	argsPyPEN()
	{
		let v1 = this.getArgs()[0];
		let c1 = constructor_name(v1);
		let brace1 = false;
		if(c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift") brace1 = true;
		return '~' + (brace1 ? '(' : '') + v1.argsPyPEN() + (brace1 ? ')' : '');
	}
	argsPython()
	{
		let v1 = this.getArgs()[0];
		let c1 = constructor_name(v1);
		let brace1 = false;
		if(c1 == "Minus" || c1 == "BitRShift" || c1 == "BitLShift") brace1 = true;
		return '~' + (brace1 ? '(' : '') + v1.argsPython() + (brace1 ? ')' : '');
	}
}

class BitLShift extends SimpleValue
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		Object.seal(this);
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i.clone());
		return new BitLShift(a, this.getLoc());
	}
	_makeValue()
	{
		let v1 = this.getArgs()[0].getValue(), v2 = this.getArgs()[1].getValue();
		if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) 
			this.throwRuntimeError("リストのビットシフトはできません");
		else if(v1 instanceof StringValue || v2 instanceof StringValue) 
			this.throwRuntimeError("文字列のビットシフトはできません");
		else if(v1 instanceof FloatValue || v2 instanceof FloatValue) 
			this.throwRuntimeError("実数のビットシフトはできません");
		else
		{
			try{
				v1 = v1 instanceof BooleanValue ? (v1.getJSValue() ? 1 : 0) : v1.getJSValue();
				v2 = v2 instanceof BooleanValue ? (v2.getJSValue() ? 1 : 0) : v2.getJSValue();
				var v = v1 << v2;
				this._value = new IntValue([v], this.getLoc(), v);
			}
			catch(e)
			{
				if(e instanceof RangeError) 
					this.throwRuntimeError("計算できない値です");
				else throw e;
			}
		}
	}
	argsPyPEN()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "BitNot") brace1 = true;
		if(c2 == "Minus" || c2 == "BitNot") brace2 = true;
		return (brace1 ? '(' : '') + v1.argsPyPEN() + (brace1 ? ')' : '')
			+ '<<'
			+ (brace2 ? '(' : '') + v2.argsPyPEN() + (brace2 ? ')' : '')
	}
	argsPython()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "BitNot") brace1 = true;
		if(c2 == "Minus" || c2 == "BitNot") brace2 = true;
		return (brace1 ? '(' : '') + v1.argsPython() + (brace1 ? ')' : '')
			+ ' << '
			+ (brace2 ? '(' : '') + v2.argsPython() + (brace2 ? ')' : '')
	}
}

class BitRShift extends SimpleValue
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		Object.seal(this);
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i.clone());
		return new BitRShift(a, this.getLoc());
	}
	_makeValue()
	{
		let v1 = this.getArgs()[0].getValue(), v2 = this.getArgs()[1].getValue();
		if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) 
			this.throwRuntimeError("リストのビットシフトはできません");
		else if(v1 instanceof StringValue || v2 instanceof StringValue) 
			this.throwRuntimeError("文字列のビットシフトはできません");
		else if(v1 instanceof FloatValue || v2 instanceof FloatValue) 
			this.throwRuntimeError("実数のビットシフトはできません");
		else
		{
			try{
				v1 = v1 instanceof BooleanValue ? (v1.getJSValue() ? 1 : 0) : v1.getJSValue();
				v2 = v2 instanceof BooleanValue ? (v2.getJSValue() ? 1 : 0) : v2.getJSValue();
				var v = v1 >> v2;
				this._value = new IntValue([v], this.getLoc(), v);
			}
			catch(e)
			{
				if(e instanceof RangeError) 
					this.throwRuntimeError("計算できない値です");
				else throw e;
			}
		}
	}
	argsPyPEN()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "BitNot") brace1 = true;
		if(c2 == "Minus" || c2 == "BitNot") brace2 = true;
		return (brace1 ? '(' : '') + v1.argsPyPEN() + (brace1 ? ')' : '')
			+ '>>'
			+ (brace2 ? '(' : '') + v2.argsPyPEN() + (brace2 ? ')' : '')
	}
	argsPython()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let c1 = constructor_name(v1), c2 = constructor_name(v2);
		let brace1 = false, brace2 = false;
		if(c1 == "Minus" || c1 == "BitNot") brace1 = true;
		if(c2 == "Minus" || c2 == "BitNot") brace2 = true;
		return (brace1 ? '(' : '') + v1.argsPython() + (brace1 ? ')' : '')
			+ ' >> '
			+ (brace2 ? '(' : '') + v2.argsPython() + (brace2 ? ')' : '')
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
		if(v1.valueLength() != v2.valueLength()) return false;
		for(let i = 0; i < v1.valueLength(); i++) 
			rtnv = rtnv && ArrayCompare(v1.getValue().getArgs()[i], v2.getValue().getArgs()[i]);
	}
	else rtnv = rtnv && typeof v1 == typeof v2 && v1.getJSValue() == v2.getJSValue();
	return rtnv;
}

class Compare extends SimpleValue
{
	constructor(v,loc, value = null)
	{
		super(v,loc, value);
		Object.seal(this);
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i instanceof Value ? i.clone() : i);
		return new Compare(a, this.getLoc());
	}
	run()
	{
		if(this.getState() == 0)
		{
			if(this.getArgs().length > 0) 
				code[0].stack.unshift({statementlist: [this.getArgs()[0]], index: 0});
			this.setState(1);
		}
		else if(this.getState() == 1)
		{
			if(this.getArgs()[0] instanceof Compare && !this.getArgs()[0].getJSValue())
			{
				code[0].stack[0].index++;
				this.setState(0);
				this._value = new BooleanValue([false], this.getLoc(), false);
			}
			else
			{
				code[0].stack.unshift({statementlist:[this.getArgs()[2]], index: 0});
				this.setState(2);
			}
		}
		else
		{
			code[0].stack[0].index++;
			this.setState(0);
			this._makeValue();
		}
	}
	_makeValue()
	{
		var v1, v2 = this.getArgs()[2].getValue();
		if(this.getArgs()[0] instanceof Compare) 
			v1 = this.getArgs()[0].getArgs()[2].getValue();
		else v1 = this.getArgs()[0].getValue();
		switch(this.getArgs()[1])
		{
		case '==':
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue)
			{
				var v = ArrayCompare(v1, v2);
				this._value = new BooleanValue([v], this.getLoc(), v);
			}
			else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue)
				this.throwRuntimeError("辞書は比較できません");
			else if(v1 instanceof StringValue != v2 instanceof StringValue)
				this.throwRuntimeError("文字列とそれ以外の値は比べられません");
			else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue)
				this.throwRuntimeError("真偽値とそれ以外の値は比べられません");
			else
			{
				var v = (v1.getJSValue() == v2.getJSValue());
				this._value = new BooleanValue([v], this.getLoc(), v);
			}
			break;
		case '!=':
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue)
			{
				var v = !ArrayCompare(v1, v2);
				this._value = new BooleanValue([v], this.getLoc(), v);
			}
			else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue)
				this.throwRuntimeError("辞書は比較できません");
			else if(v1 instanceof StringValue != v2 instanceof StringValue)
				this.throwRuntimeError("文字列とそれ以外の値は比べられません");
			else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue)
				this.throwRuntimeError("真偽値とそれ以外の値は比べられません");
			else
			{
				var v = (v1.getJSValue() != v2.getJSValue());
				this._value = new BooleanValue([v], this.getLoc(), v);
			}
			break;
		case '>':
		case '<':
		case '>=':
		case '<=':
			if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) 
				this.throwRuntimeError("リストを比べることはできません")
			else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue)
				this.throwRuntimeError("辞書は比較できません");
			else if(v1 instanceof StringValue != v2 instanceof StringValue) 
				this.throwRuntimeError("文字列とそれ以外の値は比べられません");
			else if(v1 instanceof BooleanValue != v2 instanceof BooleanValue) 
				this.throwRuntimeError("真偽値とそれ以外の値は比べられません");
			else{
				switch(this.getArgs()[1])
				{
					case '>': var v = (v1.getJSValue() > v2.getJSValue()); break;
					case '<': var v = (v1.getJSValue() < v2.getJSValue()); break;
					case '>=': var v = (v1.getJSValue() >= v2.getJSValue()); break;
					case '<=': var v = (v1.getJSValue() <= v2.getJSValue()); break;
				}
				this._value = new BooleanValue([v], this.getLoc(), v);
			}
			break;
		case 'の中に':
			if(v1 instanceof ArrayValue)
			{
				var flag = false;
				for(let i = 0; i < v1.getJSValue().length; i++) 
					flag |= ArrayCompare(v1.getJSValue()[i], v2);
				this._value = new BooleanValue([flag], this.getLoc(), flag);
			}
			else this.throwRuntimeError("\"の中に\"の前にはリストが必要です");
			break;
		case 'in':
			if(v2 instanceof ArrayValue)
			{
				var flag = false;
				for(let i = 0; i < v2.getJSValue().length; i++) 
					flag |= ArrayCompare(v2.getJSValue()[i], v1);
				this._value = new BooleanValue([flag], this.getLoc(), flag);
			}
			else this.throwRuntimeError("\"in\"の後にはリストが必要です");
			break;
		case 'not in':
			if(v2 instanceof ArrayValue)
			{
				var flag = false;
				for(let i = 0; i < v2.getJSValue().length; i++) 
					flag |= ArrayCompare(v2.getJSValue()[i], v1);
				this._value = new BooleanValue([!flag], this.getLoc(), !flag);
			}
			else this.throwRuntimeError("\"not in\"の後にはリストが必要です");
		}
	}
	argsPyPEN()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[2];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.argsPyPEN() + (brace1 ? ')' : '')
			+  this.getArgs()[1]
			+ (brace2 ? '(' : '') + v2.argsPyPEN() + (brace2 ? ')' : '')
	}
	argsPython()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[2];
		let brace1 = false, brace2 = false;
		var op = this.getArgs()[1];
		switch(op)
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
		return (brace1 ? '(' : '') + v1.argsPython() + (brace1 ? ')' : '')
			+  op
			+ (brace2 ? '(' : '') + v2.argsPython() + (brace2 ? ')' : '')
	}
}


class NumberOf extends SimpleValue
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		this.statementlist = null;
		Object.seal(this);
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i.clone());
		return new NumberOf(a, this.getLoc());
	}
	run()
	{
		if(this.getState() == 0)
		{
			if(this.getArgs().length > 0) 
				code[0].stack.unshift({statementlist: [this.getArgs()[0]], index: 0});
			this.setState(1);
		}
		else if(this.getState() == 1)
		{
			this.statementlist = [];
			for(var i = 0; i < this.getArgs(0).getJSValue(); i++) 
				this.statementlist.push(this.getArgs(1).clone());
			code[0].stack.unshift({statementlist: this.statementlist, index: 0});
			this.setState(2);
		}
		else
		{
			code[0].stack[0].index++;
			this.setState(0);
			this._makeValue();
		}
	}
	_makeValue()
	{
		var a = [];
		for(var i of this.statementlist) a.push(i.getValue());
		this._value = new ArrayValue(a, this.getLoc(), a);
	}
	argsPyPEN()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let brace1 = false, brace2 = false;
		return (brace1 ? '(' : '') + v1.argsPyPEN() + (brace1 ? ')' : '')
			+ '個の'
			+ (brace2 ? '(' : '') + v2.argsPyPEN() + (brace2 ? ')' : '')
	}
	argsPython()
	{
		let v1 = this.getArgs()[0], v2 = this.getArgs()[1];
		let brace1 = false, brace2 = false;
		return '[' + (brace1 ? '(' : '') + v2.argsPython() + (brace1 ? ')' : '')
			+ ' for _ in range('
			+ (brace2 ? '(' : '') + v1.argsPython() + (brace2 ? ')' : '')
			+ ')]';
	}
}

class ConvertInt extends SimpleValue
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		Object.seal(this);
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i.clone());
		return new ConvertInt(a, this.getLoc());
	}
	_makeValue()
	{
		let v = this.getArgs(0).getValue();
		let r = Number.NaN;
		if(v instanceof IntValue) r = v.getJSValue();
		else if(v instanceof FloatValue) r = Math.floor(v.getJSValue());
		else if(v instanceof StringValue) r = Math.floor(Number(v.getJSValue()));
		else if(v instanceof BooleanValue) r = v.getJSValue() ? 1 : 0;
		else this.throwRuntimeError('整数に直せません');
		this._value = new IntValue([r], this.getLoc(), r);
	}
	argsPyPEN()
	{
		return '整数(' + this.getArgs()[0].argsPyPEN() + ')';
	}
	argsPython()
	{
		return 'int(' + this.getArgs()[0].argsPython() + ')';
	}
}

class ConvertFloat extends SimpleValue
{
	constructor(v, loc, value = null)
	{ 
		super(v, loc, value);
		Object.seal(this);
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i.clone());
		return new ConvertFloat(a, this.getLoc());
	}
	_makeValue()
	{
		let v = this.getArgs()[0].getValue();
		let r = Number.NaN;
		if(v instanceof IntValue || v instanceof FloatValue) r = v.getJSValue();
		else if(v instanceof StringValue) r = Number(v.getJSValue());
		else if(v instanceof BooleanValue) r = v.getJSValue() ? 1 : 0;
		else this.throwRuntimeError('実数に直せません');
		if(isFinite(r)) 
			this._value = new FloatValue([r], this.getLoc(), r);
		else this.throwRuntimeError('実数に直せません');
	}
	argsPyPEN()
	{
		return '実数(' + this.getArgs()[0].argsPyPEN() + ')';
	}
	argsPython()
	{
		return 'float(' + this.getArgs()[0].argsPython() + ')';
	}
}

class ConvertString extends SimpleValue
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		Object.seal(this);
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i.clone());
		return new ConvertString(a, this.getLoc());
	}
	_makeValue()
	{
		let v = this.getArgs()[0].getValue();
		let r = '';
		if(v instanceof IntValue || v instanceof FloatValue) r = String(v.getJSValue());
		else if(v instanceof StringValue) r = v.getJSValue();
		else if(v instanceof BooleanValue) r = v.getJSValue() ? 'true' : 'false';
		this._value = new StringValue([r], this.getLoc(), r);
	}
	argsPyPEN()
	{
		return '文字列(' + this.getArgs()[0].argsPyPEN() + ')';
	}
	argsPython()
	{
		return 'str(' + this.getArgs()[0].argsPython() + ')';
	}
}

/**
 * 
 * @param {Value} v 
 * @returns boolean
 */
function toBool(v)
{
	let re = /^(0+|false|偽|)$/i;
	if(typeof v === "boolean") return v;
	else if(v instanceof IntValue || v instanceof FloatValue) return v.getJSValue() != 0;
	else if(v instanceof StringValue) return re.exec(v.getJSValue()) ? false : true;
	else if(v instanceof BooleanValue) return v.getJSValue();
	else if(v instanceof ArrayValue) return v.valueLength() != 0;
	else if(v instanceof DictionaryValue) return v.getValue().size() != 0;
	else throw new RuntimeError(null, '真偽値に直せません'
		+ debug_mode ? ("\n値の型: " + constructor_name(v)) : ''
	);
}

class ConvertBool extends SimpleValue
{
	constructor(v, loc, value = null)
	{
		super(v, loc, value);
		Object.seal(this);
	}
	clone()
	{
		var a = [];
		for(var i of this.getArgs()) a.push(i.clone());
		return new ConvertBool(a, this.getLoc());
	}
	_makeValue()
	{
		let v = toBool(this.getArgs()[0].getValue());
		this._value = new BooleanValue([v], this.getLoc(), v);
	}
	argsPyPEN()
	{
		return '真偽(' + this.getArgs()[0].argsPyPEN() + ')';
	}
	argsPython()
	{
		return 'bool(' + this.getArgs()[0].argsPython() + ')';
	}
}


/**
 * 関数呼び出し
 */
class CallFunction extends SimpleValue
{
	/**
	 * @constructor
	 * @param {Location} loc 
	 */
	constructor(v, loc, value = null)
	{
		super(v[1], loc, value);	// v = [funcname, args] args is Array of Value
		if(v[1] instanceof Array == false)
			this.throwRuntimeError('DEBUG: 関数の引数がArrayではありません'+"\n"
			+constructor_name(v[1]));
		// textareaAppend("CallFunction name: " + v[0] + "\n");
		// for(var i of v[1])
		// 	textareaAppend("CallFunction arg: " + constructor_name(i) + "\n");
		this.funcname = v[0];
		// Object.seal(this);
	}
	clone()
	{
		var parm = [];
		for(var i = 0; i < this.getArgs().length; i++) parm.push(this.getArgs()[i].clone());
		return new CallFunction([this.funcname, parm], this.getLoc());
		//			this._value ? this._value.clone() : null);
	}
	setValue(v, idx = null)
	{
		if(idx !== null) this.throwRuntimeError("これはおかしい");
		this._value = v;
		// this._args[idx] = v;
	}
	run()
	{
		if(this.getState() == 0)
		{
			code[0].stack.unshift({statementlist: this.getArgs(), index: 0});
			this.setState(1);
		}
		else if(this.getState() == 1)
		{
			code[0].stack[0].index++;
			this._makeValue();
			this.setState(0);
		}
	}
	_makeValue()
	{
		if(definedFunction[this.funcname])
		{
			let fn = definedFunction[this.funcname].clone();
			fn.setCaller(this, false);
			var a = [];
			for(var i of this.getArgs())
			{
				a.push(i);
				// textareaAppend("CallFunction arg value: " + constructor_name(i.getValue()) + "\n");
			} 
			fn.setParameter(a);
			fn.setLocation(this.getLoc());
			let statementlist = [fn];
			code.unshift(new parsedFunction(statementlist));
		}
		else if(myFuncs[this.funcname])
		{
			let fn = myFuncs[this.funcname];
			let vt = new varTable();
			let globalVarTable = varTables[varTables.length - 1];
			for(let i of Object.keys(globalVarTable.vars)) 
				vt.vars[i] = globalVarTable.vars[i].copy();
			for(let i = 0; i < this.getArgs().length; i++)
				vt.vars[fn.params[i].varname] = this.getArgs()[i].getValue();
			let statementlist = cloneStatementlist(fn.statementlist);
			statementlist.push(new ReturnStatement(new NullValue(this.getLoc()), this.getLoc()));
			setCaller(statementlist, this);
			let pf = new parsedFunction(statementlist);
			code.unshift(pf);
			varTables.unshift(vt);
		}
		else
			this.throwRuntimeError('関数 '+this.funcname+' は定義されていません');
	}
	argsPyPEN(indent = 0)
	{
		let ag = [];
		for(let i = 0; i < this.getArgs().length; i++)
			ag.push(this.getArgs()[i].argsPyPEN());
		return makeIndent(indent) + this.funcname + '(' + ag.join(', ') + ')';
	}
	argsPython(indent = 0)
	{
		let deffunc = null;
		if(definedFunction[this.funcname]) deffunc = definedFunction[this.funcname];
		else if(myFuncs[this.funcname]) deffunc = myFuncs[this.funcname];
		let ag = [];
		for(let i = 0; i < this.getArgs().length; i++)
			ag.push(this.getArgs()[i].argsPython(indent));
		if(deffunc)
		{
			var prefix = '';
			if(deffunc.module)
			{
				prefix= deffunc.module + ".";
				python_lib[deffunc.module] = 1;
			}
			if(deffunc.convert) return makeIndent(indent) + deffunc.convert(ag);
			else return makeIndent(indent) + prefix + this.funcname + '(' + ag.join(', ') + ')';
		}
		else 
			return makeIndent(indent) + this.funcname + '(' + ag.join(', ') + ')';
	}
}

class Connect extends Value
{
	constructor(v,loc,value = null)
	{
		super(v,loc,value);
	}
	clone()
	{
		return new Connect(this.getArgs(), this.getLoc());
		// , this._value ? this._value.clone() : null);
	}
	_makeValue()
	{
		let v1 = valueString(this.getArgs()[0]);
		let v2 = valueString(this.getArgs()[1]);
		let v = v1 + v2;
		this._value = new StringValue([v], this.getLoc(), v);
	}
	getValue()
	{
		if(this._value == null) this._makeValue();
		return this._value;
	}
	argsPyPEN()
	{
		return argsPyPEN(this.getArgs(0)) + "と" + argsPyPEN(this.getArgs(1));
	}
	argsPython()
	{
		var re=/^str\(/;
		var p1 = this.getArgs()[0].argsPython();
		var p2 = this.getArgs()[1].argsPython();
		if(!re.exec(p1) && !(this.getArgs()[0] instanceof StringValue)) p1 = "str(" + p1 + ")";
		if(!re.exec(p2) && !(this.getArgs()[1] instanceof StringValue)) p2 = "str(" + p2 + ")";
		return  p1 + " + " + p2;
	}
	valueString()
	{
		return this.getArgs()[0].valueString() + this.getArgs()[1].valueString();
	}
	valuePython()
	{
		var re=/^str\(/;
		var p1 = this.getArgs()[0].valuePython();
		var p2 = this.getArgs()[1].valuePython();
		if(!re.exec(p1) && !(this.getArgs(0) instanceof StringValue)) p1 = "str(" + p1 + ")";
		if(!re.exec(p2) && !(this.getArgs(1) instanceof StringValue)) p2 = "str(" + p2 + ")";
		return  p1 + " + " + p2;
	}
}

class Assign extends SimpleValue
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
		super([value],loc);
		this.variable = variable;
		this.operator = operator;
		if(!(variable instanceof Variable || variable instanceof UNDEFINED)) 
			this.throwRuntimeError("変数でないものに代入はできません");
		Object.seal(this);
	}
	clone()
	{
		return new Assign(this.variable, this.getArgs()[0].clone(), this.operator, this.getLoc());
		// , this._value ? this._value.copy() : null);
	}
	run()
	{
		if(this.variable instanceof UNDEFINED) 
			this.throwRuntimeError("未完成のプログラムです");
		if(this.getState() == 0)
		{
			let a = [];
			if(this.operator) a.push(this.variable);
			a.push(this.getArgs()[0]);
			code[0].stack.unshift({statementlist: a, index: 0});
			this.setState(1);
		}
		else if(this.getState() == 1)
		{
			if(!this.operator && this.variable.getArgs().length > 0)
				code[0].stack.unshift({statementlist: this.variable.getArgs(), index: 0});
			this.setState(2);
		}
		else if(this.getState() == 2)
		{
			var vt1 = findVarTable(this.variable.varname);
			var v2  = this.getArgs()[0].getValue();
			if(this.operator)
			{
				if(!vt1) this.throwRuntimeError('変数 '+this.variable.varname+' は定義されていません');
				var v1 = getValueByArgs(vt1.vars[this.variable.varname], 
					this.variable.getArgs() ? this.variable.getArgs() : null,
					this.getLoc());
				var v3 = null;
				switch(this.operator)	// 複合代入演算
				{
					case '+':
						if(v1 instanceof BooleanValue) 
						{
							var v = v1.getJSValue() ? 1 : 0;
							v1 = new IntValue([v], this.getLoc(), v);
						}
						if(v2 instanceof BooleanValue) 
						{
							var v = v2.getJSValue() ? 1 : 0;
							v2 = new IntValue([v], this.getLoc(), v);
						}
						if(v1 instanceof ArrayValue && v2 instanceof ArrayValue)
						{
							var v = [];
							for(var i of v1.getJSValue()) v.push(i);
							for(var i of v2.getJSValue()) v.push(i);
							v3 = new ArrayValue(v, this.getLoc(), v);
						}
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) 
							this.throwRuntimeError("辞書の足し算はまだサポートしていません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue)
						{
							var v = String(v1.getJSValue()) + String(v2.getJSValue());
							v3 = new StringValue([v], this.getLoc(), v);
						}
						else if(v1 instanceof IntValue && v2 instanceof IntValue)
						{
							var v = v1.getJSValue() + v2.getJSValue();
							v3 = new IntValue([v], this.getLoc(), v);
						}
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue)
						{
							var v = Number(v1.getJSValue()) + Number(v2.getJSValue());
							v3 = new FloatValue([v], this.getLoc(), v);
						}
						break;
					case '-':
						if(v1 instanceof BooleanValue)
						{
							var v = v1.getJSValue() ? 1 : 0;
							v1 = new IntValue([v], this.getLoc(), v);
						}
						if(v2 instanceof BooleanValue)
						{
							var v = v2.getJSValue() ? 1 : 0;
							v2 = new IntValue([v], this.getLoc(), v);
						} 
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) 
							this.throwRuntimeError("リストの引き算はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue)
							 this.throwRuntimeError("辞書の引き算はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) 
							this.throwRuntimeError("文字列の引き算はできません");
						else if(v1 instanceof IntValue && v2 instanceof IntValue)
						{
							var v = v1.getJSValue() - v2.getJSValue();
							v3 = new IntValue([v], this.getLoc(), v);
						}
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue)
						{
							var v = Number(v1.getJSValue()) - Number(v2.getJSValue());
							v3 = new FloatValue([v], this.getLoc(), v);
						}
						break;
					case '*':
						if(v1 instanceof BooleanValue)
						{
							var v = v1.getJSValue() ? 1 : 0;
							v1 = new IntValue([v], this.getLoc(), v);
						}
						if(v2 instanceof BooleanValue)
						{
							var v = v2.getJSValue() ? 1 : 0;
							v2 = new IntValue([v], this.getLoc(), v);
						} 
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue)
						{
							let va = null, vn = null;
							if(v1 instanceof IntValue){va = v2; vn = v1.getJSValue();}
							else if(v2 instanceof IntValue){va = v1; vn = v2.getJSValue();}
							else this.throwRuntimeError("リストには整数しか掛けられません");
							let v = []
							for(let i = 0; i < vn; i++)
								for(let j = 0; j < va.valueLength(); j++) v.push(va.getValue(j));
							v3 = new ArrayValue([v], this.getLoc(), v);

						}
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) this.throwRuntimeError("辞書の掛け算はできません");
						else if(v1 instanceof StringValue)
						{
							if(v2 instanceof IntValue)
							{
								v = '';
								for(var i = 0; i < v2.getJSValue(); i++) v += v1.getJSValue();
								v3 = new StringValue([v], this.getLoc(), v);
							}
							else this.throwRuntimeError("文字列に掛けられるのは整数だけです");
						}
						else if(v1 instanceof IntValue && v2 instanceof IntValue)
						{
							var v = v1.getJSValue() * v2.getJSValue();
							v3 = new IntValue([v], this.getLoc(), v);
						}
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue)
						{
							var v = Number(v1.getJSValue()) * Number(v2.getJSValue());
							v3 = new FloatValue([v], this.getLoc(), v);
						}
						break;
					case '/':
						if(v1 instanceof BooleanValue)
						{
							var v = v1.getJSValue() ? 1 : 0;
							v1 = new IntValue([v], this.getLoc(), v);
						}
						if(v2 instanceof BooleanValue)
						{
							var v = v2.getJSValue() ? 1 : 0;
							v2 = new IntValue([v], this.getLoc(), v);
						} 
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) this.throwRuntimeError("リストの割り算はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) this.throwRuntimeError("辞書の割り算はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) this.throwRuntimeError("文字列の割り算はできません");
						else
						{
							if(v2.args == 0) this.throwRuntimeError('0で割り算をしました');
							var v = Number(v1.getJSValue()) / Number(v2.getJSValue());
							v3 = new FloatValue([v], this.getLoc(), v);
						}
						break;
					case '//':
						if(v1 instanceof BooleanValue)
						{
							var v = v1.getJSValue() ? 1 : 0;
							v1 = new IntValue([v], this.getLoc(), v);
						}
						if(v2 instanceof BooleanValue)
						{
							var v = v2.getJSValue() ? 1 : 0;
							v2 = new IntValue([v], this.getLoc(), v);
						} 
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) this.throwRuntimeError("リストの割り算はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) this.throwRuntimeError("辞書の割り算はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) this.throwRuntimeError("文字列の割り算はできません");
						else if(v1 instanceof IntValue && v2 instanceof IntValue)
						{
							let q = v1.getJSValue() / v2.getJSValue(), r = v1.getJSValue() % v2.getJSValue();
							if(!SameSignBigInt(q, r) && r != 0) q--;
							v3 = new IntValue([q], this.getLoc(), q);
						}
						else
						{
							if(Number(v2.args) == 0) this.throwRuntimeError('0で割り算をしました');
							let v = Math.floor(Number(v1.args) / Number(v2.args));
							v3 = new FloatValue([v], this.getLoc(), v);
						}
						break;
					case '%':
						if(v1 instanceof BooleanValue)
						{
							var v = v1.getJSValue() ? 1 : 0;
							v1 = new IntValue([v], this.getLoc(), v);
						}
						if(v2 instanceof BooleanValue)
						{
							var v = v2.getJSValue() ? 1 : 0;
							v2 = new IntValue([v], this.getLoc(), v);
						} 
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) this.throwRuntimeError("リストの割り算はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) this.throwRuntimeError("辞書の割り算はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) this.throwRuntimeError("文字列の割り算はできません");
						else if(v1 instanceof IntValue && v2 instanceof IntValue)
						{
							let q = v1.getJSValue() / v2.getJSValue(), r = v1.getJSValue() % v2.getJSValue();
							if(!SameSignBigInt(v1.getJSValue(), v2.getJSValue()) && r != 0) q--;
							var v = r - q * v2.getJSValue();
							v3 = new IntValue([v], this.getLoc(), v);
						}
						else
						{
							if(Number(v2.getJSValue()) == 0) this.throwRuntimeError('0で割り算をしました');
							let v = Math.floor(Number(v1.getJSValue()) / Number(v2.getJSValue()));
							v = Number(v1.getJSValue()) - v * Number(v2.getJSValue());
							v3 = new FloatValue([v], this.getLoc(), v);
						}
						break;
					case '&':
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) this.throwRuntimeError("リストのビット積はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) this.throwRuntimeError("辞書のビット積はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) this.throwRuntimeError("文字列のビット積はできません");
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) this.throwRuntimeError("実数のビット積はできません");
						else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) 
						{
							var v = v1.getJSValue() && v2.getJSValue();
							v3 = new BooleanValue([v], this.getLoc(), v);
						}
						else
						{
							if(v1 instanceof BooleanValue)
							{
								var v = v1.getJSValue() ? 1 : 0;
								v1 = new IntValue([v], this.getLoc(), v);
							}
							if(v2 instanceof BooleanValue)
							{
								var v = v2.getJSValue() ? 1 : 0;
								v2 = new IntValue([v], this.getLoc(), v);
							} 
							if(v1 instanceof IntValue && v2 instanceof IntValue)
							{
								var v = v1.getsJSValue() & v2.getJSValue();
								v3 = new IntValue([v], this.getLoc(), v);
							}
						} 
						break;
					case '|':
						if(v1 instanceof ArrayValue || v2 instanceof ArrayValue) this.throwRuntimeError("リストのビット和はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) this.throwRuntimeError("辞書のビット和はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) this.throwRuntimeError("文字列のビット和はできません");
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) this.throwRuntimeError("実数のビット和はできません");
						else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue)
						{
							var v = v1.getJSValue() || v2.getJSValue();
							v3 = new BooleanValue([v], this.getLoc(), v);
						}
						else
						{
							if(v1 instanceof BooleanValue)
							{
								var v = v1.getJSValue() ? 1 : 0;
								v1 = new IntValue([v], this.getLoc(), v);
							}
							if(v2 instanceof BooleanValue)
							{
								var v = v2.getJSValue() ? 1 : 0;
								v2 = new IntValue([v], this.getLoc(), v);
							} 

							if(v1 instanceof IntValue && v2 instanceof IntValue)
							{
								var v = v1.getJSValue() | v2.getJSValue();
								v3 = new IntValue([v], this.getLoc(), v);
							} 
						} 
						break;
					case '^':
						if(v1 instanceof ArrayValue && v2 instanceof ArrayValue) this.throwRuntimeError("リストの排他的論理和はできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) this.throwRuntimeError("辞書の排他的論理和はできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) this.throwRuntimeError("文字列の排他的論理和はできません");
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) this.throwRuntimeError("実数の排他的論理和はできません");
						else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) 
						{
							var v = v1.getJSValue() ^ v2.getJSValue();
							v3 = new BooleanValue([v], this.getLoc(), v);
						}
						else
						{
							if(v1 instanceof BooleanValue)
							{
								var v = v1.getJSValue() ? 1 : 0;
								v1 = new IntValue([v], this.getLoc(), v);
							}
							if(v2 instanceof BooleanValue)
							{
								var v = v2.getJSValue() ? 1 : 0;
								v2 = new IntValue([v], this.getLoc(), v);
							} 

							if(v1 instanceof IntValue && v2 instanceof IntValue)
							{
								var v = v1.getJSValue() ^ v2.getJSValue();
								v3 = new IntValue([v], this.getLoc(), v);
							}
						} 
						break;
					case '<<':
						if(v1 instanceof ArrayValue && v2 instanceof ArrayValue) this.throwRuntimeError("リストのビットシフトはできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) this.throwRuntimeError("辞書のビットシフトはできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) this.throwRuntimeError("文字列のビットシフトはできません");
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) this.throwRuntimeError("実数のビットシフトはできません");
						else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue)
							this.throwRuntimeError("真偽値のビットシフトはできません");
						else
						{
							if(v1 instanceof BooleanValue)
							{
								var v = v1.getJSValue() ? 1 : 0;
								v1 = new IntValue([v], this.getLoc(), v);
							}
							if(v2 instanceof BooleanValue)
							{
								var v = v2.getJSValue() ? 1 : 0;
								v2 = new IntValue([v], this.getLoc(), v);
							} 

							if(v1 instanceof IntValue && v2 instanceof IntValue)
							{
								var v = v1.getJSValue() << v2.getJSValue();
								v3 = new IntValue([v], this.getLoc(), v);
							} 
						} 
						break;
					case '>>':
						if(v1 instanceof ArrayValue && v2 instanceof ArrayValue) this.throwRuntimeError("リストのビットシフトはできません");
						else if(v1 instanceof DictionaryValue || v2 instanceof DictionaryValue) this.throwRuntimeError("辞書のビットシフトはできません");
						else if(v1 instanceof StringValue || v2 instanceof StringValue) this.throwRuntimeError("文字列のビットシフトはできません");
						else if(v1 instanceof FloatValue || v2 instanceof FloatValue) this.throwRuntimeError("実数のビットシフトはできません");
						else if(v1 instanceof BooleanValue && v2 instanceof BooleanValue) 
							this.throwRuntimeError("真偽値のビットシフトはできません");
						else
						{
							if(v1 instanceof BooleanValue)
							{
								var v = v1.getJSValue() ? 1 : 0;
								v1 = new IntValue([v], this.getLoc(), v);
							}
							if(v2 instanceof BooleanValue)
							{
								var v = v2.getJSValue() ? 1 : 0;
								v2 = new IntValue([v], this.getLoc(), v);
							} 

							if(v1 instanceof IntValue && v2 instanceof IntValue)
							{
								var v = v1.getJSValue() >> v2.getJSValue();
								v3 = new IntValue([v], this.getLoc(), v);
							}
						} 
						break;
				}
				if(!v3) this.throwRuntimeError('複合代入演算子の使い方が間違っています');
				setVariableByArgs(vt1,this.variable.varname, this.variable.getArgs(), v3.getValue(), this.getLoc());
				this._value = v3.getValue();
			}
			else
			{
				if(!vt1)	// 変数が定義されていないので，ダミーを代入
				{
					vt1 = varTables[0];
					vt1.vars[this.variable.varname] = new NullValue(this.getLoc());
				}
				setVariableByArgs(vt1, this.variable.varname, this.variable.getArgs(), v2, this.getLoc());
				this._value = v2;
			}
			this.setState(0);
			code[0].stack[0].index++;
			this._makeValue();
		}
	}
	_makeValue()
	{
		if(!(this._value instanceof Value)) this.throwRuntimeError("代入する値が不明です");
		// this._value = this.getArgs()[0]._value;
	}
	argsPython(indent = 0)
	{
		var code = makeIndent(indent);
		code += argsPython(this.variable) + " ";
		if(this.operator) code += this.operator;
		code += "= " + argsPython(this.getArgs(0));
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
	// textareaAppend("DEBUG: setVariableByArgs: vn=" + vn + ", args=" + (args ? args.length : 0) + constructor_name(newval) + "\n");
	if(!(newval instanceof Value))
		throw new RuntimeError(loc.first_line, "代入する値が不明です" +
			"\n" + constructor_name(newval));
	if(args && args.length > 0)
	{
		var v = vt.vars[vn];
		for(var i = 0; i < args.length - 1; i++)	// 最後の手前までの添字をたどる
		{
			var arg = args[i];
			if(v.getValue() instanceof ArrayValue)
			{
				if(arg.getValue() instanceof IntValue)
				{
					var idx = Number(arg.getJSValue());
					var l = v.valueLength();
					if(idx < 0) idx += l;
					if(idx >= 0 && idx < l) v = v.getValue(idx);
					else throw new RuntimeError(loc.first_line, "リストの範囲を超えています");
				}
				else throw new RuntimeError(loc.first_line, "リストの添字は整数でなければなりません");
			}
			else if(v.getValue() instanceof DictionaryValue)
			{
				if(isPrimitive(arg.getValue()))
				{
					var key = arg.getJSValue();
					if(v.getJSValue().has(key)) v = v.getJSValue().get(key);
					else throw new RuntimeError(loc.first_line, "辞書にキー"+key+"がありません!");
				}
				else throw new RuntimeError(loc.first_line, "辞書の添字は単純型でなければなりません!");
			}
			else if(v.getValue() instanceof StringValue)
			{
				if(arg.getValue() instanceof IntValue)
				{
					var idx = Number(arg.getJSValue());
					var l = arg.getJSValue().length;
					if(idx < 0) idx += l;
					if(idx >= 0 && idx < l) v = new StringValue(v.getJSValue().charAt(idx), loc);
					else throw new RuntimeError(loc.first_line, "文字列の範囲を超えています");
				}
				else if(arg.getValue() instanceof SliceValue)
				{
					var idx1 = Number(arg.getValue1().getJSValue());
					var idx2 = Number(arg.getValue2().getJSValue());
					var l = arg.getJSValue().length;
					if(!idx1) idx1 = 0;
					if(!idx2) idx2 = l;
					if(idx1 < 0) idx1 += l;
					if(idx2 < 0) idx2 += l;
					if(idx1 >= 0 && idx2 >= 0 && idx1 < l && idx2 <= l)
						v = new StringValue(v.getJSValue().substring(idx1, idx2), loc);
					else throw new RuntimeError(loc.first_line, "文字列の範囲を超えています");
				}
			}
			else throw new RuntimeError(loc.first_line, "添字が使える型ではありません");
		}
		// 最後の添字を使って代入
		var arg = args[args.length - 1];
		if(v.getValue() instanceof ArrayValue)
		{
			if(arg.getValue() instanceof IntValue)
			{
				var idx = Number(arg.getJSValue());
				var l = v.getValue().valueLength();
				// textareaAppend("DEBUG: setVariableByArgs: idx=" + idx + ", length=" + l + "\n");
				if(idx < 0) idx += l;
				// textareaAppend("DEBUG: setVariableByArgs: newval" + constructor_name(newval) + "\n");
				if(idx >= 0 && idx < l)
				{
					 v.getValue().setValue(newval,idx);
				}
				else throw new RuntimeError(loc.first_line, "リストの範囲を超えています!");
			}
			else throw new RuntimeError(loc.first_line, "リストの添字は整数でなければなりません");
		}
		else if(v.getValue() instanceof DictionaryValue)
		{
			if(isPrimitive(arg.getValue()))
			{
				v.getValue().setValue(newval, arg);
			}
			else throw new RuntimeError(loc.first_line, "辞書の添字は単純型でなければなりません");
		}
		else if(v.getValue() instanceof StringValue)
		{
			if(newval instanceof StringValue)
			{
				if(arg.getValue() instanceof IntValue)
				{
					var s = v.getJSValue();
					var idx = Number(arg.getJSValue());
					var l = s.length;
					if(idx < 0) idx += l;
					if(idx >= 0 && idx < l)
					{
						s = s.substring(0, idx) + newval.getJSValue() + s.substring(idx + 1);
						v = new StringValue([s], loc, s);
					} 
					else throw new RuntimeError(loc.first_line, "文字列の範囲を超えています");
				}
				else if(arg.getValue() instanceof SliceValue)
				{
					var s = v.getJSValue();
					var idx1 = Number(arg.getValue1().getJSValue());
					var idx2 = Number(arg.getValue2().getJSValue());
					var l = s.length;
					if(!idx1) idx1 = 0;
					if(!idx2) idx2 = l;
					if(idx1 < 0) idx1 += l;
					if(idx2 < 0) idx2 += l;
					if(idx1 >= 0 && idx2 >= 0 && idx1 < l && idx2 <= l)
					{
						s = s.substring(0, idx1) + newval.getJSValue() + s.substring(idx2);
						v = new StringValue([s], loc, s);
					}
					else throw new RuntimeError(loc.first_line, "文字列の範囲を超えています");
				}
			}
			else throw new RuntimeError(loc.first_line, "文字列に代入できるのは文字列だけです");
		}
		else throw new RuntimeError(loc.first_line, "添字が使える型ではありません");
	}
	else
	{
		// textareaAppend("DEBUG: setVariableByArgs: newval" + constructor_name(newval) + "\n");
		vt.vars[vn] = newval;
	}
}

/**
 * v[args]の値を取得する
 * @param {Value} v
 * @param {Array<Value>} args 
 * @param {Location} loc 
 * @returns Value
 */
function getValueByArgs(v, args, loc)
{
	v = v.getValue();
	if(args && args.length > 0)
	{
		for(var i = 0; i < args.length; i++)
		{
			var arg = args[i];
			if(v instanceof ArrayValue)
			{
				if(arg.getValue() instanceof IntValue)
				{
					var idx = Number(arg.getJSValue());
					var l = v._value.length;
					if(idx < 0) idx += l;
					if(idx >= 0 && idx < l) v = v._value[idx].getValue();
					else throw new RuntimeError(loc.first_line, "リストの範囲を超えてアクセスしました");
				}
				else if(arg.getValue() instanceof SliceValue)
				{
					var idx1 = Number(arg.getValue1().getJSValue());
					var idx2 = Number(arg.getValue2().getJSValue());
					var l = v._value.length;
					if(!idx1) idx1 = 0;
					if(!idx2) idx2 = l;
					if(idx1 < 0) idx1 += l;
					if(idx2 < 0) idx2 += l;
					if(idx1 >= 0 && idx2 >= 0 && idx1 <= l && idx2 <= l)
					{
						var a = [], b = [];
						for(var j = idx1; j < idx2; j++){
							a.push(v.getValue(j).clone());
							b.push(v.getValue(j).getValue());
						}
						v = new ArrayValue(a, loc, a);
					}
					else throw new RuntimeError(loc.first_line, "リストの範囲を超えました");
				}
				else throw new RuntimeError(loc.first_line, "リストの添字は整数かスライスです"
					+ (debug_mode ? (" (arg type: " + arg.constructor.name + ")") : '')
				);
			}
			else if(v instanceof DictionaryValue)
			{
				if(isPrimitive(arg.getValue()))
				{
					var key = arg.getJSValue();
					if(v.getJSValue().has(key)) v = v.getJSValue().get(key).getValue();
					else throw new RuntimeError(loc.first_line, "辞書にキー"+key+"がありません!!");
				}
				else throw new RuntimeError(loc.first_line, "辞書の添字は基本型です");
			}
			else if(v instanceof StringValue)
			{
				if(arg.getValue() instanceof IntValue)
				{
					var idx = Number(arg.getJSValue());
					var l = v.getJSValue().length;
					if(idx < 0) idx += l;
					if(idx >= 0 && idx < l) 
					{
						var s = v.getJSValue().charAt(idx);
						v = new StringValue([s], loc, s);
					}
					else throw new RuntimeError(loc.first_line, "リストの範囲を超えてアクセスしました");
				}
				else if(arg.getValue() instanceof SliceValue)
				{
					var idx1 = Number(arg.getValue1().getJSValue());
					var idx2 = Number(arg.getValue2().getJSValue());
					var l = v.getJSValue().length;
					if(!idx1) idx1 = 0;
					if(!idx2) idx2 = l;
					if(idx1 < 0) idx1 += l;
					if(idx2 < 0) idx2 += l;
					// textareaAppend("DEBUG: String slice idx1=" + idx1 + ", idx2=" + idx2 + ", length=" + l + "\n");
					if(idx1 >= 0 && idx2 >= 0 && idx1 <= l && idx2 <= l)
					{
						var s = v.getJSValue().substring(idx1, idx2);
						v = new StringValue([s], loc, s);
					}
					else throw new RuntimeError(loc.first_line, "リストの範囲を超えました");
				}
				else throw new RuntimeError(loc.first_line, "文字列の添字は整数かスライスです");
			}
		}
	}
	return v;
}

function setCaller(statementlist, caller)
{
	for(let i = 0; i < statementlist.length; i++)
	{
		if(statementlist[i] instanceof ReturnStatement) 
		{
			statementlist[i].setCaller(caller, true);
		}
		else if(statementlist[i].statementlist) setCaller(statementlist[i].statementlist, caller);
		else if(statementlist[i].state) setCaller(statementlist[i].state, caller);
		else if(statementlist[i].blocks)
		{
			for(var j = 0; j < statementlist[i].blocks.length; j++)
				setCaller(statementlist[i].blocks[j][1], caller);
		}
	}
}

function cloneStatementlist(statementlist)
{
	var rtnv = [];
	for(let i = 0; i < statementlist.length; i++) 
		if(statementlist[i]) rtnv.push(statementlist[i].clone());
	return rtnv;
}

/**
 * 
 * @param {Value|Array|Map} v 
 */
function argsPyPEN(v)
{
	if(v instanceof Value) return v.argsPyPEN();
	else if(v instanceof Array)
	{
		let ag = [];
		for(let i = 0; i < v.length; i++)
			ag.push(argsPyPEN(v[i]));
		return '[' + ag.join(', ') + ']';
	}
	else if(v instanceof Map)
	{
		let ag = [];
		for(let [key, value] of v)
			ag.push(key + ': ' + argsPyPEN(value));
		return '{' + ag.join(', ') + '}';
	}
	else return v + '';
}

function argsPython(v)
{
	if(v instanceof Value) return v.argsPython();
	else if(v instanceof Array)
	{
		let ag = [];
		for(let i = 0; i < v.length; i++)
			ag.push(argsPython(v[i]));
		return '[' + ag.join(', ') + ']';
	}
	else if(v instanceof Map)
	{
		let ag = [];
		for(let [key, value] of v)
			ag.push(key + ': ' + argsPython(value));
		return '{' + ag.join(', ') + '}';
	}
	else return v + '';
}

function valueString(v)
{
	if(v instanceof Value) return v.valueString();
	else if(v instanceof Array)
	{
		let ag = [];
		for(let i = 0; i < v.length; i++)
			ag.push(valueString(v[i]));
		return '[' + ag.join(', ') + ']';
	}
	else if(v instanceof Map)
	{
		let ag = [];
		for(let [key, value] of v)
		{
			if(typeof key === 'string') key = "'" + key + "'";
			ag.push(key + ':' + valueString(value));
		}
		return '{' + ag.join(', ') + '}';
	}
	else return v + '';
}

function valueCode(v)
{
	if(v instanceof Value) return v.valueCode();
	else if(v instanceof Array)
	{
		let ag = [];
		for(let i = 0; i < v.length; i++)
			ag.push(valueCode(v[i]));
		return '[' + ag.join(', ') + ']';
	}
	else if(v instanceof Map)
	{
		let ag = [];
		for(let [key, value] of v)
			ag.push(key + ': ' + valueCode(value));
		return '{' + ag.join(', ') + '}';
	}
	else return v + '';
}