/**
 * 定義済み関数クラス
 */
class DefinedFunction
{
	/**
	 * @constructor
	 * @param {number} argc 引数の個数
	 * @param {function} func 実際の関数
	 * @param {string} module Pythonで必要となるモジュール。nullならナニもいらない
	 * @param {function} convert this.argcを受け取ってPythonコードの文字列を返す関数。nullならthis.funcName(this.argc)的なことをする。
	 */
	constructor(argc, func, module, convert) { 
		// super([], null);
		this.argc = argc; this.func = func; this.module = module; this.convert = convert;
		this.caller = null;
		this.loc = null;
		this.state = 0;		
	}
	/**
	 * 関数の値を返す
	 * @param {Array<Value>} parameters 
	 * @param {Location} loc 
	 * @returns {any}
	 */
	run()
	{
		if((this.argc instanceof Array && this.argc[0] <= this.parameters.length && this.argc[1] >= this.parameters.length)
			|| this.parameters.length == this.argc
			|| this.argc < 0)
			{
				code[0].stack[0].index++;
				this.caller.setValue(this.func(this.parameters, this.loc));
				code.shift();
			}
		else throw new RuntimeError(this.loc.first_line, "引数の個数が違います");
	}
	clone()
	{
		return new DefinedFunction(this.argc, this.func, this.module, this.convert);
	}
	setCaller(caller)
	{
		this.caller = caller;
	}
	setParameter(params)
	{
		this.parameters = params;
	}
	setLocation(loc)
	{
		this.loc = loc;
	}
	throwRuntimeError(funcname, message)
	{
		throw new RuntimeError(this.loc.first_line, funcname + ": " + message);
	}
}


/**
 * 定義済み関数一覧
 */
var definedFunction = {
	"match": new DefinedFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(!(par1 instanceof StringValue) || !(par2 instanceof StringValue)) 
			this.throwRuntimeError("match", "matchの引数は文字列です");
		var re = RegExp(par1.getJSValue());
		var result = re.exec(par2.getJSValue());
		if(result)
		{
			var a = [];
			for(let i = 0; i < result.length; i++) a.push(new StringValue([result[i]], loc, result[i]));
			return new ArrayValue(a, loc, a);
		}
		return new ArrayValue([], loc, []);
	}, null, function(argc){
		return "re.match(" + argc[0] + ", " + argc[1] + ").groups()";
	}),
	"search": new DefinedFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(!(par1 instanceof StringValue) || !(par2 instanceof StringValue))
			this.throwRuntimeError("search", "searchの引数は文字列です");
		var re = RegExp(par1.getJSValue(),"g");
		var result = par2.getJSValue().match(re);
		if(result)
		{
			var a = [];
			for(let i = 0; i < result.length; i++) 
				a.push(new StringValue([result[i]], loc, result[i]));
			return new ArrayValue(a, loc, a);
		}
		return new ArrayValue([], loc, []);
	}, null, function(argc){
		return "re.search(" + argc[0] + ", " + argc[1] + ").groups()";
	}),
	"typeis": new DefinedFunction(2, function(param, loc){
		// textareaAppend("typeis called with param[0] " + constructor_name(param[0]) + "\n");
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		var result = false;
		if(!(par2 instanceof StringValue)) 
			this.throwRuntimeError("typeis", "typeisの第2引数は文字列にしてください");
		var s = par2.getJSValue();
		if(par1 instanceof IntValue) result = s.match(/^整数|int|integer$/i);
		else if(par1 instanceof FloatValue) result = s.match(/^実数|float|double$/i);
		else if(par1 instanceof StringValue) result = s.match(/^文字列|string$/i);
		else if(par1 instanceof BooleanValue) result = s.match(/^真偽|bool|boolean$/i);
		else if(par1 instanceof ArrayValue) result = s.match(/^(リスト|list|array)$/i);
		else if(par1 instanceof DictionaryValue) result = s.match(/^辞書|dictionary|dict$/i);
		else if(par1 instanceof NullValue) result = false;
		else this.throwRuntimeError("typeis", "不明な型です" + constructor_name(par1));
		return new BooleanValue([result], loc, result);
	}, null, function(argc){
		return "isinstance(" + argc[0] + ", " + argc[1] + ")";
	}),
	"typeof": new DefinedFunction(1, function(param, loc){
		// textareaAppend("typeof called with param[0] " + constructor_name(param[0]) + "\n");
		var par1 = param[0].getValue();
		// textareaAppend("typeof called with par1 " + constructor_name(par1) + "\n");
		if(par1 instanceof IntValue) return new StringValue(["整数"], loc, "整数");
		else if(par1 instanceof FloatValue) return new StringValue(["実数"], loc, "実数");
		else if(par1 instanceof StringValue) return new StringValue(["文字列"], loc, "文字列");
		else if(par1 instanceof BooleanValue) return new StringValue(["真偽"], loc, "真偽");
		else if(par1 instanceof ArrayValue) return new StringValue(["リスト"], loc, "リスト");
		else if(par1 instanceof DictionaryValue) return new StringValue(["辞書"], loc, "辞書");
		else if(par1 instanceof NullValue) return new StringValue([""], loc, "");
		else this.throwRuntimeError("typeof", "不明な型です");
	}, null, function(argc){
		return "type(" + argc[0] + ")";
	}),
	"range": new DefinedFunction([1,3], function(param, loc){
		var par1 = BigInt(0), par2, par3 = BigInt(1);
		if(param.length == 1)
		{
			par2 = param[0].getJSValue();
		}
		else if(param.length == 2)
		{
			par1 = param[0].getJSValue();
			par2 = param[1].getJSValue();
		}
		else
		{
			par1 = param[0].getJSValue();
			par2 = param[1].getJSValue();
			par3 = param[2].getJSValue();
		}
		var args = [];
		if(par3 == 0) this.throwRuntimeError("range", "rangeのステップに0は指定できません");
		if(typeof par1 == 'bigint' && typeof par2 == 'bigint' && typeof par3 == 'bigint')
		{
			if(par3 > 0)
			{
				for(let i = par1; i < par2; i += par3) args.push(new IntValue([i], loc, i));
			}
			else
			{
				for(let i = par1; i > par2; i += par3) args.push(new IntValue([i], loc, i));
			}
			return new ArrayValue(args, loc, args);	
		}
		else this.throwRuntimeError("range", "rangeの引数は整数にしてください");
	},null, null),
	"keys": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof DictionaryValue)
		{
			var args = [];
			for(let key of par1._value.keys()) {
				switch(typeof key) {
					case 'number':
						args.push(new FloatValue([key], loc, key)); break;
					case 'bigint':
						args.push(new IntValue([key], loc, key)); break;
					case 'boolean':
						args.push(new BooleanValue([key], loc, key)); break;
					case 'string':
						args.push(new StringValue([key], loc, key)); break;
					default:
						this.throwRuntimeError("keys", "辞書のキーの型が不正です");
				}
			}
			return new ArrayValue(args, loc, args);
		}
		else this.throwRuntimeError("keys", "keysは辞書にしか使えません");
	}, null, null),
	"abs": new DefinedFunction(1, function (param, loc){
		var par1 = param[0].getValue();
		textareaAppend("abs FloatValue:" + par1.getJSValue() + "\n");
		if(par1 instanceof IntValue)
		{
			var v = par1.getJSValue();
			if(v < 0) v = -v;
			return new IntValue([v], loc, v);
		}
		else if(par1 instanceof FloatValue)
		{
			var v = par1.getJSValue();
			if(v < 0) v = -v;
			return new FloatValue([v], loc, v);
		}
		else this.throwRuntimeError("abs", "absは数値にしか使えません");
	}, null, null),
	"random": new DefinedFunction([0,1], function(param, loc){
		if(param.length == 0)
		{
			var v = Math.random();
			return new FloatValue([v], loc, v);
		}
		else{
			var par1 = param[0].getValue();
			if(par1 instanceof IntValue)
			{
				var v = Math.floor(Math.random() * (Number(par1.getJSValue()) + 1));
				return new IntValue([v], loc, v);
			}
			else this.throwRuntimeError("random", "randomは引数なしか，整数の引数をとります");
		} 
	}, "random", function(argc){
		if(argc[0])	return "random.randint(0," + argc[0] + ")";
		else return "random.random()";
	}),
	"ceil": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue) return par1;
		else if(par1 instanceof FloatValue)
		{
			var v = Math.ceil(par1.getJSValue());
			if(isSafeInteger(v)) return new IntValue([v], loc, v);
		}
		else this.throwRuntimeError("ceil", "ceilは数値にしか使えません");
	}, "math", null),
	"floor": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue) return par1;
		else if(par1 instanceof FloatValue)
		{
			var v = Math.floor(par1.getJSValue());
			if(isSafeInteger(v)) return new IntValue([v], loc, v);
		}
		else this.throwRuntimeError("floor", "floorは数値にしか使えません");
	}, "math", null),
	"round": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue) return par1;
		else if(par1 instanceof FloatValue)
		{
			var v = Math.round(par1.getJSValue());
			if(isSafeInteger(v)) return new IntValue([v], loc, v);
		}
		else this.throwRuntimeError("round", "roundは数値にしか使えません");
	}, null, null),
	"sin": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			var v = Math.sin(Number(par1.getJSValue()));
			return new FloatValue([v], loc, v);
		}
		else this.throwRuntimeError("sin", "sinは数値にしか使えません");
	}, "math", null),
	"cos": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			var v = Math.cos(Number(par1.getJSValue()));
			return new FloatValue([v], loc, v);
		}
		else this.throwRuntimeError("cos", "cosは数値にしか使えません");
	}, "math", null),
	"tan": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			let v = Math.tan(Number(par1.getJSValue()));
			if(isFinite(v)) return new FloatValue([v], loc, v);
			else this.throwRuntimeError("tan", "オーバーフローしました");
		}
		else this.throwRuntimeError("tan", "tanは数値にしか使えません");
	}, "math", null),
	"asin": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			if(Number(par1.getJSValue()) > 1.0 || Number(par1.getJSValue()) < -1.0)
				this.throwRuntimeError("asin", "asinの定義域外の値が使われました");
			else
			{
				var v = Math.asin(Number(par1.getJSValue()));
				return new FloatValue([v], loc, v);
			}
		}
		else this.throwRuntimeError("asin", "asinは数値にしか使えません");
	}, "math", null),
	"acos": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			if(Number(par1.getJSValue()) > 1.0 || Number(par1.getJSValue()) < -1.0)
				this.throwRuntimeError("acos", "acosの定義域外の値が使われました");
			else
			{
				var v = Math.acos(Number(par1.getJSValue()));
				return new FloatValue([v], loc, v);
			}
		}
		else this.throwRuntimeError("acos", "acosは数値にしか使えません");
	}, "math", null),
	"atan": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			var v = Math.atan(Number(par1.getJSValue()));
			return new FloatValue([v], loc, v);
		}
		else this.throwRuntimeError("atan", "atanは数値にしか使えません");
	}, "math", null),
	"atan2": new DefinedFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if((par1 instanceof IntValue || par1 instanceof FloatValue) && 
			(par2 instanceof IntValue || par2 instanceof FloatValue))
		{
			var v = Math.atan2(Number(par1.getJSValue()), Number(par2.getJSValue()));
			return new FloatValue([v], loc, v);
		}
		else this.throwRuntimeError("atan2", "atan2は数値にしか使えません");
	}, "math", null),
	"sqrt": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			if(Number(par1.getJSValue()) < 0) 
				this.throwRuntimeError("sqrt", "負の数のルートを求めようとしました");
			var v = Math.sqrt(Number(par1.getJSValue()));
			return new FloatValue([v], loc, v);
		}
		else this.throwRuntimeError("sqrt", "sqrtは数値にしか使えません");
	}, "math", null),
	"log": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			if(Number(par1.getJSValue()) <= 0) this.throwRuntimeError("log", "正でない数の対数を求めようとしました");
			let v = Math.log(Number(par1.getJSValue()));
			if(isFinite(v)) return new FloatValue([v], loc, v);
			this.throwRuntimeError("log", "オーバーフローしました");
		}
		else this.throwRuntimeError("log", "logは数値にしか使えません");
	}, "math", null),
	"exp": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			let v = Math.exp(Number(par1.getJSValue()));
			if(isFinite(v)) return new FloatValue([v], loc, v);
			this.throwRuntimeError("exp", "オーバーフローしました");
		}
		else this.throwRuntimeError("exp", "expは数値にしか使えません");
	}, "math", null),
	"pow": new DefinedFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par1 instanceof IntValue && par2 instanceof IntValue)
		{
			if(par1.getJSValue() == 0 && par2.getJSValue() <= 0) 
				this.throwRuntimeError("pow", "0は正の数乗しかできません");
			var v = par1.getJSValue() ** par2.getJSValue();
			return par2.getJSValue() >= 0 ? 
				new IntValue([v], loc, v) :
				new FloatValue([v], loc, v);
		}
		else if((par1 instanceof IntValue || par1 instanceof FloatValue) &&
			(par2 instanceof IntValue || par2 instanceof FloatValue))
		{
			par1 = Number(par1.getJSValue());
			par2 = Number(par2.getJSValue());
			if(par1 < 0 && !Number.isInteger(par2)) 
				this.throwRuntimeError("pow", "負の数の非整数乗はできません");
			if(par1 == 0 && par2 <= 0)
				 this.throwRuntimeError("pow", "0は正の数乗しかできません");
			let v = par1 ** par2;
			if(isFinite(v)) return new FloatValue([v], loc, v);
			else this.throwRuntimeError("pow", "オーバーフローしました");
		}
		else this.throwRuntimeError("pow", "powは数値にしか使えません");
	}, null, null),
	"length": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof StringValue)
		{
			var v = par1.getJSValue().length;
			return new IntValue([v], loc, v);
		}
		else if(par1 instanceof ArrayValue)
		{
			var v = par1._value.length;
			return new IntValue([v], loc, v);
		} 
		else this.throwRuntimeError("length", "lengthは文字列と配列にしか使えません"
			+ (debug_mode ? (":" + constructor_name(par1)) : "")
		);
	}, null, function(argc){
		return "len(" + argc[0] + ")";
	}),
	"substring": new DefinedFunction([2,3], function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		var par3 = param.length == 3 ? param[2].getValue() : null;
		if(par1 instanceof StringValue &&
			par2 instanceof IntValue &&
			(par3 == null || par3 instanceof IntValue))
		{
			var v;
			if(par3 == null) v = par1.getJSValue().substr(Number(par2.getJSValue()));
			else v = par1.getJSValue().substr(Number(par2.getJSValue()), Number(par3.getJSValue()));
			return new StringValue([v], loc, v);
		}
		else this.throwRuntimeError("substring", "substringの引数の型が違います");
	}, null, function(argc){
		var code = argc[0] + '[' + argc[1] + ':';
		if(argc[2]) code += argc[1] + '+' + argc[2];
		return code + ']';
	}),
	"append": new DefinedFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par1 instanceof StringValue && par2 instanceof StringValue)
		{
			var v = par1.getJSValue() + par2.getJSValue();
			return new StringValue([v], loc, v);
		}
		else if(par1 instanceof ArrayValue && par2 instanceof Value)
		{
			var v = par1._value.slice();
			v.push(par2);
			return new ArrayValue(v, loc, v);
		}
		else this.throwRuntimeError("append", "appendの引数の型が違います");
	}, null, function(argc){
		return argc[0] + '+' + argc[1];
	}),
	"split": new DefinedFunction([1,2], function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param.length == 2 ? param[1].getValue() : null;
		if(par1 instanceof StringValue && (par2 instanceof StringValue || par2 == null))
		{
			var v1 = par1.getJSValue();
			var v = par2 ? v1.split(par2.getJSValue()) : v1.split("");
			var vr = [];
			for(var i = 0; i < v.length; i++) 
				vr.push(new StringValue([v[i]], loc, v[i]));
			return new ArrayValue(vr, loc, vr);
		}
		else this.throwRuntimeError("split", "splitの引数の型が違います");
	}, null, function(argc){
		if(argc.length == 2) return argc[0] + '.split(' + argc[1] + ')';
		else return 'list(' + argc[0] + ')';
	}),
	"extend": new DefinedFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par1 instanceof StringValue && par2 instanceof StringValue)
		{
			var v = par1.getJSValue() + par2.getJSValue();
			return new StringValue([v], loc, v);
		}
		else if(par1 instanceof ArrayValue && par2 instanceof ArrayValue)
		{
			var v = par1._value.slice();
			for(var i of par2._value) v.push(i);
			return new ArrayValue(v, loc, v);
		}
		else this.throwRuntimeError("extend", "extendの引数の型が違います");
	}, null, function(argc){
		return argc[0] + '.extend(' + argc[1] + ')';
	}),
	"extract": new DefinedFunction(3, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		var par3 = param[2].getValue();
		if(par1 instanceof StringValue && par2 instanceof StringValue && par3 instanceof IntValue)
		{
			var v1 = par1.getJSValue();
			var v2 = par2.getJSValue();
			var v3 = par3.getJSValue();
			var v = v1.split(v2);
			if(v3 >= 0 && v3 < v.length) return new StringValue([v[v3]], loc, v[v3]);
			else this.throwRuntimeError("extract", "番号の値が不正です");
		}
		else this.throwRuntimeError("extract", "extractの引数の型が違います");
	}, null, function(argc){
		return argc[0] + '.split(' + argc[1] + ')[' + argc[2] + ']';
	}),
	"insert": new DefinedFunction(3, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		var par3 = param[2].getValue();
		if(par1 instanceof StringValue && par2 instanceof IntValue && par3 instanceof StringValue)
		{
			var v1 = par1.getJSValue();
			var v2 = Number(par2.getJSValue());
			var v3 = par3.getJSValue();
			if(v2 < 0 || v2 > v1.length) this.throwRuntimeError("insert", "位置の値が不正です");
			var s1 = v1.substr(0, v2);
			var s2 = v1.substr(v2);
			var s = s1 + v3 + s2;
			return new StringValue([s], loc, s);
		}
		else this.throwRuntimeError("insert", "insertの引数の型が違います");
	}, null, function(argc){
		return argc[0] + '[:' + argc[1] + ']+' + argc[2] + '+' + argc[0] + '[' + argc[1] + ':]';  
	}),
	"replace": new DefinedFunction(4, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		var par3 = param[2].getValue();
		var par4 = param[3].getValue();
		if(par1 instanceof StringValue && par2 instanceof IntValue && par3 instanceof IntValue && par4 instanceof StringValue)
		{
			var v1 = par1.getJSValue();
			var v2 = Number(par2.getJSValue());
			var v3 = Number(par3.getJSValue());
			var v4 = par4.getJSValue();

			if(v2 < 0 || v2 > v1.length) this.throwRuntimeError("replace", "位置の値が不正です");
			if(v3 < 0 || v2 + v3 > v1.length)this.throwRuntimeError("replace", "長さの値が不正です");
			var s1 = v1.substr(0, v2);
			var s2 = v1.substr(v2 + v3);
			var s = s1 + v4 + s2;
			return new StringValue([s], loc, s);
		}
		else this.throwRuntimeError("replace", "replaceの引数の型が違います");
	}, null, function (argc){
		return argc[0] + '[:' + argc[1] + ']+' + argc[3] + '+' + argc[0] + '[' + argc[1] + '+' + argc[2] + ':]';  
	}),
	"isfile": new DefinedFunction(1, function(param, loc){
		var par = param[0].getValue();
		if(par instanceof StringValue)
		{
			var v = storage.getItem(par.getJSValue()) != null;
			return new BooleanValue([v], loc, v);
		}
		else this.throwRuntimeError("isfile", "ファイル名は文字列でなくてはいけません");
	}, null, null),
	"openr": new DefinedFunction(1, function(param, loc){
		var par = param[0].getValue();
		if(par instanceof StringValue)
			{
				var v = filesystem.openr(par.getJSValue());
				return new IntValue([v], loc, v);
			}
		else this.throwRuntimeError("openr", "ファイル名は文字列でなくてはいけません");
	}, null, function(argc){
		return "open(" + argc[0] + ",'r')";
	}),
	"openw": new DefinedFunction(1, function(param, loc){
		var par = param[0].getValue();
		if(par instanceof StringValue)
		{
			var v = filesystem.openw(par.getJSValue());
			return new IntValue([v], loc, v);
		}
		else this.throwRuntimeError("openw", "ファイル名は文字列でなくてはいけません");
	}, null, function(argc){
		return "open(" + argc[0] + ",'w')";
	}),
	"opena": new DefinedFunction(1, function(param, loc){
		var par = param[0].getValue();
		if(par instanceof StringValue)
		{
			var v = filesystem.opena(par.getJSValue());
			return new IntValue([v], loc, v);
		}
		else this.throwRuntimeError("opena", "ファイル名は文字列でなくてはいけません");
	}, null, function(argc){
		return "open(" + argc[0] + ",'a')";
	}),
	"getline": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue)
		{
			var rtnv = filesystem.read_line(par1.getJSValue());
			if(rtnv == null) this.throwRuntimeError("getline", "ファイル番号が不正です");
			return new StringValue([rtnv], loc, rtnv);
		}
		else this.throwRuntimeError("getline", "ファイル番号が必要です");
	}, null, function(argc){
		return argc[0] + ".readline()";
	}),
	"getchar": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue)
		{
			var rtnv = filesystem.read_ch(par1.getJSValue());
			if(rtnv == null) this.throwRuntimeError("getchar", "ファイル番号が不正です");
			return new StringValue([rtnv], loc, rtnv);
		}
		else this.throwRuntimeError("getchar", "ファイル番号が必要です");
	}, null, function(argc){
		return argc[0] + ".read(1)";
	}),
	"putline": new DefinedFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par1 instanceof IntValue && par2 instanceof StringValue)
		{
			var str = par2.getJSValue() + '\n';
			var rtnv = filesystem.write_str(par1.getJSValue(), str, true);
			if(!rtnv) throw new RuntimeError(this.first_line, "呼び出しが不正です");
			return new NullValue(loc);
		}
		else this.throwRuntimeError("putline", "呼び出しが不正です");
	}, null, function(argc){
		var str = argc[1].makePython();
		if(!(argc[1] instanceof StringValue))
			str = 'str(' + str + ')';
		return argc[0].makePython() + '.write(' + str + " + '\n')";
	}),
	"putstr": new DefinedFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par1 instanceof IntValue && par2 instanceof StringValue)
		{
			var str = par2.getJSValue();
			var rtnv = filesystem.write_str(par1.getJSValue(), str, false);
			if(!rtnv) this.throwRuntimeError("putstr", "呼び出しが不正です");
			return new NullValue(loc);
		}
		else this.throwRuntimeError("putstr", "呼び出しが不正です");
	}, null, function(argc){
		var str = argc[1].makePython();
		if(!(argc[1] instanceof StringValue))
			str = 'str(' + str + ')';
		return argc[0].makePython() + '.write(' + str + ")";
	}),
	"close": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue)
		{
			var rtnv = filesystem.close(par1.getJSValue(), true);
			if(!rtnv) this.throwRuntimeError("close", "呼び出しが不正です");
			return new NullValue(loc);
		}
		else this.throwRuntimeError("close", "呼び出しが不正です");
	}, null, function(argc){
		return argc[0].makePython() + '.close()\n';
	}),
	"pop": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof ArrayValue)
		{
			if(par1._value.length > 0)
				return par1._value.pop();
			else this.throwRuntimeError("pop", "空の配列にpopを適用しようとしました");
		}
		else this.throwRuntimeError("pop", "popは配列にしか使えません");
	}, null, function(argc){
		return argc[0] + '.pop()';
	}),
	"shift": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof ArrayValue)
		{
			if(par1._value.length > 0)
				return par1._value.shift();
			else this.throwRuntimeError("shift", "空の配列にshiftを適用しようとしました");
		}
		else this.throwRuntimeError("shift", "shiftは配列にしか使えません");
	}, null, function(argc){
		return argc[0] + '.pop(0)';
	}),
	"push": new DefinedFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par1 instanceof ArrayValue && par2 instanceof Value)
		{
			par1._value.push(par2);
			return new NullValue(loc);
		}
		else this.throwRuntimeError("push", "pushは配列にしか使えません");
	}, null, function(argc){
		return argc[0].makePython() + '.append(' + argc[1].makePython() + ')\n';
	}),
	"unshift": new DefinedFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par1 instanceof ArrayValue && par2 instanceof Value)
		{
			par1._value.unshift(par2);
			return new NullValue(loc);
		}
		else this.throwRuntimeError("unshift", "unshiftは配列にしか使えません");
	}, null, function(argc){
		return argc[0].makePython() + '.insert(0, ' + argc[1].makePython() + ')\n';
	}),
};
