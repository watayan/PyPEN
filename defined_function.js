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
}


/**
 * 定義済み関数一覧
 */
var definedFunction = {
	"match": new DefinedFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(!(par1 instanceof StringValue) || !(par2 instanceof StringValue)) throw new RuntimeError(loc.first_line, "matchの引数は文字列にしてください");
		var re = RegExp(par1.rtnv.value);
		var result = re.exec(par2.rtnv.value);
		if(result)
		{
			var a = [];
			for(let i = 0; i < result.length; i++) a.push(new StringValue(result[i], loc));
			return new ArrayValue(a, loc);
		}
		return new ArrayValue([], loc);
	}, null, function(argc){
		return "re.match(" + argc[0] + ", " + argc[1] + ").groups()";
	}),
	"typeis": new DefinedFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		var result = false;
		if(!(par2 instanceof StringValue)) throw new RuntimeError(loc.first_line, "typeisの第2引数は文字列にしてください");
		if(par1 instanceof IntValue) result = par2.rtnv.value.match(/^整数|int|integer$/i);
		else if(par1 instanceof FloatValue) result = par2.rtnv.value.match(/^実数|float|double$/i);
		else if(par1 instanceof StringValue) result = par2.rtnv.value.match(/^文字列|string$/i);
		else if(par1 instanceof BooleanValue) result = par2.rtnv.value.match(/^真偽|bool|boolean$/i);
		else if(par1 instanceof ArrayValue) result = par2.rtnv.value.match(/^(リスト|list|array)$/i);
		else if(par1 instanceof DictionaryValue) result = par2.rtnv.value.match(/^辞書|dictionary|dict$/i);
		else if(par1 instanceof NullValue) result = false;
		else throw new RuntimeError(loc.first_line, "不明な型です");
		return new BooleanValue(result, loc);
	}, null, function(argc){
		return "isinstance(" + argc[0] + ", " + argc[1] + ")";
	}),
	"typeof": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue) return new StringValue("整数", loc);
		else if(par1 instanceof FloatValue) return new StringValue("実数", loc);
		else if(par1 instanceof StringValue) return new StringValue("文字列", loc);
		else if(par1 instanceof BooleanValue) return new StringValue("真偽", loc);
		else if(par1 instanceof ArrayValue) return new StringValue("リスト", loc);
		else if(par1 instanceof DictionaryValue) return new StringValue("辞書", loc);
		else if(par1 instanceof NullValue) return new StringValue("", loc);
		else throw new RuntimeError(loc.first_line, "不明な型です");
	}, null, function(argc){
		return "type(" + argc[0] + ")";
	}),
	"range": new DefinedFunction([1,3], function(param, loc){
		var par1 = BigInt(0), par2, par3 = BigInt(1);
		if(param.length == 1)
		{
			par2 = param[0].getValue().value;
		}
		else if(param.length == 2)
		{
			par1 = param[0].getValue().value;
			par2 = param[1].getValue().value;
		}
		else
		{
			par1 = param[0].getValue().value;
			par2 = param[1].getValue().value;
			par3 = param[2].getValue().value;
		}
		var args = [];
		if(par3 ==0) throw new RuntimeError(loc.first_line, "rangeのステップに0は指定できません");
		if(typeof par1 == 'bigint' && typeof par2 == 'bigint' && typeof par3 == 'bigint')
		{
			if(par3 > 0)
			{
				for(let i = par1; i < par2; i += par3) args.push(new IntValue(i, loc));
			}
			else
			{
				for(let i = par1; i > par2; i += par3) args.push(new IntValue(i, loc));
			}
			return new ArrayValue(args, this.loc);
		}
		else throw new RuntimeError(loc.first_line, "rangeの引数は整数にしてください");
	},null, null),
	"keys": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof DictionaryValue)
		{
			var args = [];
			var keys = par1.getValue().value.keys();
			for(let key of keys) args.push(new StringValue(key, loc));
			args.sort();
			return new ArrayValue(args, this.loc);
		}
		else throw new RuntimeError(loc.first_line, 'keysは辞書にしか使えません');
	}, null, null),
	"abs": new DefinedFunction(1, function (param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue) return new IntValue(Math.abs(Number(par1.value)), loc);
		else if(par1 instanceof FloatValue) return new FloatValue(Math.abs(par1.value), loc);
		else throw new RuntimeError(loc.first_line, "absは数値にしか使えません");
	}, null, null),
	"random": new DefinedFunction([0,1], function(param, loc){
		if(param.length == 0) return new FloatValue(Math.random(), this.loc);
		else{
			var par1 = param[0].getValue();
			if(par1 instanceof IntValue) return new IntValue(Math.floor(Math.random() * Math.floor(Number(par1.value) + 1)), this.loc);
			else throw new RuntimeError(loc.first_line, "randomは整数にしか使えません");
		} 
	}, "random", function(argc){
		if(argc[0])	return "random.randint(0," + argc[0] + ")";
		else return "random.random()";
	}),
	"ceil": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue) return par1;
		else if(par1 instanceof FloatValue) return new IntValue(Math.ceil(par1.value), this.loc);
		else throw new RuntimeError(loc.first_line, "ceilは数値にしか使えません");
	}, "math", null),
	"floor": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue) return par1;
		else if(par1 instanceof FloatValue) return new IntValue(Math.floor(par1.value), this.loc);
		else throw new RuntimeError(loc.first_line, "floorは数値にしか使えません");
	}, "math", null),
	"round": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue) return par1;
		else if(par1 instanceof FloatValue) return new IntValue(Math.round(par1.value), this.loc);
		else throw new RuntimeError(loc.first_line, "roundは数値にしか使えません");
	}, null, null),
	"sin": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
			return new FloatValue(Math.sin(Number(par1.value)), this.loc);
		else throw new RuntimeError(loc.first_line, "sinは数値にしか使えません");
	}, "math", null),
	"cos": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
			return new FloatValue(Math.cos(Number(par1.value)), this.loc);
		else throw new RuntimeError(loc.first_line, "cosは数値にしか使えません");
	}, "math", null),
	"tan": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			let v = Math.tan(Number(par1.value));
			if(isFinite(v)) return new FloatValue(v, this.loc);
			else throw new RuntimeError(loc.first_line, "オーバーフローしました");
		}
		else throw new RuntimeError(loc.first_line, "tanは数値にしか使えません");
	}, "math", null),
	"asin": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			if(Number(par1.value) > 1.0 || Number(par1.value) < -1.0)
				throw new RuntimeError(loc.first_line, "asinの定義域外の値が使われました");
			else
				return new FloatValue(Math.asin(Number(par1.value)), this.loc);
		}
		else throw new RuntimeError(loc.first_line, "asinは数値にしか使えません");
	}, "math", null),
	"acos": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			if(Number(par1.value) > 1.0 || Number(par1.value) < -1.0)
				throw new RuntimeError(loc.first_line, "acosの定義域外の値が使われました");
			else
				return new FloatValue(Math.acos(Number(par1.value)), this.loc);
		}
		else throw new RuntimeError(loc.first_line, "acosは数値にしか使えません");
	}, "math", null),
	"atan": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
			return new FloatValue(Math.atan(Number(par1.value)), this.loc);
		else throw new RuntimeError(loc.first_line, "atanは数値にしか使えません");
	}, "math", null),
	"atan2": new DefinedFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if((par1 instanceof IntValue || par1 instanceof FloatValue) && 
			(par2 instanceof IntValue || par2 instanceof FloatValue))
			return new FloatValue(Math.atan2(Number(par1.value), Number(par2.value)), this.loc);
		else throw new RuntimeError(loc.first_line, "atan2は数値にしか使えません");
	}, "math", null),
	"sqrt": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			if(Number(par1.value) < 0) throw new RuntimeError(loc.first_line, "負の数のルートを求めようとしました");
			return new FloatValue(Math.sqrt(Number(par1.value)), this.loc);
		}
		else throw new RuntimeError(this.first_line, "sqrtは数値にしか使えません");
	}, "math", null),
	"log": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			if(Number(par1.value) <= 0) throw new RuntimeError(loc.first_line, "正でない数の対数を求めようとしました");
			let v = Math.log(Number(par1.value));
			if(isFinite(v)) return new FloatValue(v, this.loc);
			throw new RuntimeError(this.first_line, "オーバーフローしました");
		}
		else throw new RuntimeError(loc.first_line, "logは数値にしか使えません");
	}, "math", null),
	"exp": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			let v = Math.exp(Number(par1.value));
			if(isFinite(v)) return new FloatValue(v, this.loc);
			throw new RuntimeError(loc.first_line, "オーバーフローしました");
		}
		else throw new RuntimeError(loc.first_line, "expは数値にしか使えません");
	}, "math", null),
	"pow": new DefinedFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par1 instanceof IntValue && par2 instanceof IntValue)
		{
			if(par1.value == 0 && par2.value <= 0) throw new RuntimeError(loc.first_line, "0は正の数乗しかできません");
			return par2.value >= 0 ? new IntValue(par1.value ** par2.value, this.loc) : new FloatValue(par1.value ** par2.value, this.loc);
		}
		else if((par1 instanceof IntValue || par1 instanceof FloatValue) &&
			(par2 instanceof IntValue || par2 instanceof FloatValue))
		{
			par1 = Number(par1.value);
			par2 = Number(par2.value);
			if(par1 < 0 && !Number.isInteger(par2)) throw new RuntimeError(loc.first_line, "負の数の非整数乗はできません");
			if(par1 == 0 && par2 <= 0) throw new RuntimeError(loc.first_line, "0は正の数乗しかできません");
			let v = par1 ** par2;
			if(isFinite(v)) return new FloatValue(v, this.loc);
			else throw new RuntimeError(loc.first_line, "オーバーフローしました");
		}
		else throw new RuntimeError(loc.first_line, "powerは数値にしか使えません");
	}, null, null),
	"length": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof StringValue) return new IntValue(par1.value.length, this.loc);
		else if(par1 instanceof ArrayValue) return new IntValue(par1.length, this.loc);
		else throw new RuntimeError(loc.first_line, "lengthは文字列と配列にしか使えません");
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
			if(par3 == null) v = par1.value.substr(Number(par2.value));
			else v = par1.value.substr(Number(par2.value), Number(par3.value));
			return new StringValue(v, this.loc);
		}
		else throw new RuntimeError(loc.first_line, "substringの引数の型が違います");
	}, null, function(argc){
		var code = argc[0] + '[' + argc[1] + ':';
		if(argc[2]) code += argc[1] + '+' + argc[2];
		return code + ']';
	}),
	"append": new DefinedFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par2 instanceof StringValue && par2 instanceof StringValue)
		{
			return new StringValue(par1.value + par2.value, this.loc);
		}
		else throw new RuntimeError(loc.first_line, "appendの引数の型が違います");
	}, null, function(argc){
		return argc[0] + '+' + argc[1];
	}),
	"split": new DefinedFunction([1,2], function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param.length == 2 ? param[1].getValue() : null;
		if(par1 instanceof StringValue && (par2 instanceof StringValue || par2 == null))
		{
			var v1 = par1.value;
			var v = par2 ? v1.split(par2.value) : v1.split("");
			var vr = [];
			for(var i = 0; i < v.length; i++) vr.push(new StringValue(v[i], this.loc));
			return new ArrayValue(vr, this.loc);
		}
		else throw new RuntimeError(loc.first_line, "splitの引数の型が違います");
	}, null, function(argc){
		if(argc.length == 2) return argc[0] + '.split(' + argc[1] + ')';
		else return 'list(' + argc[0] + ')';
	}),
	"extract": new DefinedFunction(3, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		var par3 = param[2].getValue();
		if(par1 instanceof StringValue && par2 instanceof StringValue && par3 instanceof IntValue)
		{
			var v1 = par1.value;
			var v2 = par2.value;
			var v3 = par3.value;
			var v = v1.split(v2);
			if(v3 >= 0 && v3 < v.length) return new StringValue(v[v3], this.loc);
			else throw new RuntimeError(loc.first_line, "番号の値が不正です");
		}
		else throw new RuntimeError(loc.first_line, "extractの引数の型が違います");
	}, null, function(argc){
		return argc[0] + '.split(' + argc[1] + ')[' + argc[2] + ']';
	}),
	"insert": new DefinedFunction(3, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		var par3 = param[2].getValue();
		if(par1 instanceof StringValue && par2 instanceof IntValue && par3 instanceof StringValue)
		{
			var v1 = par1.value;
			var v2 = Number(par2.value);
			var v3 = par3.value;
			if(v2 < 0 || v2 > v1.length) throw new RuntimeError(loc.first_line, "位置の値が不正です");
			var s1 = v1.substr(0, v2);
			var s2 = v1.substr(v2);
			return new StringValue(s1 + v3 + s2, this.loc);
		}
		else throw new RuntimeError(loc.first_line, "insertの引数の型が違います");
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
			var v1 = par1.value;
			var v2 = Number(par2.value);
			var v3 = Number(par3.value);
			var v4 = par4.value;

			if(v2 < 0 || v2 > v1.length) throw new RuntimeError(loc.first_line, "位置の値が不正です");
			if(v3 < 0 || v2 + v3 > v1.length)throw new RuntimeError(loc.first_line, "長さの値が不正です");
			var s1 = v1.substr(0, v2);
			var s2 = v1.substr(v2 + v3);
			return new StringValue(s1 + v4 + s2, this.loc);
		}
		else throw new RuntimeError(loc.first_line, "replaceの引数の型が違います");
	}, null, function (argc){
		return argc[0] + '[:' + argc[1] + ']+' + argc[3] + '+' + argc[0] + '[' + argc[1] + '+' + argc[2] + ':]';  
	}),
	"isfile": new DefinedFunction(1, function(param, loc){
		var par = param[0].getValue();
		if(par instanceof StringValue) return new BooleanValue(storage.getItem(par.value) != null, loc);
		else throw new RuntimeError(loc.first_line, "ファイル名は文字列でなくてはいけません");
	}, null, null),
	"openr": new DefinedFunction(1, function(param, loc){
		var par = param[0].getValue();
		if(par instanceof StringValue) return new IntValue(filesystem.openr(par.value), loc);
		else throw new RuntimeError(loc.first_line, "ファイル名は文字列でなくてはいけません");
	}, null, function(argc){
		return "open(" + argc[0] + ",'r')";
	}),
	"openw": new DefinedFunction(1, function(param, loc){
		var par = param[0].getValue();
		if(par instanceof StringValue) return new IntValue(filesystem.openw(par.value), loc);
		else throw new RuntimeError(loc.first_line, "ファイル名は文字列でなくてはいけません");
	}, null, function(argc){
		return "open(" + argc[0] + ",'w')";
	}),
	"opena": new DefinedFunction(1, function(param, loc){
		var par = param[0].getValue();
		if(par instanceof StringValue) return new IntValue(filesystem.opena(par.value), loc);
		else throw new RuntimeError(loc.first_line, "ファイル名は文字列でなくてはいけません");
	}, null, function(argc){
		return "open(" + argc[0] + ",'a')";
	}),
	"getline": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue)
		{
			var rtnv = filesystem.read_line(par1.value);
			if(rtnv == null) throw new RuntimeError(loc.first_line, "ファイル番号が不正です");
			return new StringValue(rtnv, loc);
		}
		else throw new RuntimeError(loc.first_line, "ファイル番号が必要です");
	}, null, function(argc){
		return argc[0] + ".readline()";
	}),
	"getchar": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue)
		{
			var rtnv = filesystem.read_ch(par1.value);
			if(rtnv == null) throw new RuntimeError(loc.first_line, "ファイル番号が不正です");
			return new StringValue(rtnv, loc);
		}
		else throw new RuntimeError(loc.first_line, "ファイル番号が必要です");
	}, null, function(argc){
		return argc[0] + ".read(1)";
	}),
	"pop": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof ArrayValue)
		{
			if(par1.value.length > 0)
				return par1.value.pop();
			else throw new RuntimeError(loc.first_line, "空の配列にpopを適用しようとしました");
		}
		else throw new RuntimeError(loc.first_line, "popは配列にしか使えません");
	}, null, function(argc){
		return argc[0] + '.pop()';
	}),
	"shift": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof ArrayValue)
		{
			if(par1.value.length > 0)
				return par1.value.shift();
			else throw new RuntimeError(loc.first_line, "空の配列にshiftを適用しようとしました");
		}
		else throw new RuntimeError(loc.first_line, "shiftは配列にしか使えません");
	}, null, function(argc){
		return argc[0] + '.pop(0)';
	}),
	"putline": new DefinedFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par1 instanceof IntValue && par2 instanceof StringValue)
		{
			var str = array2text(par2);
			var rtnv = filesystem.write_str(par1.value, str, true);
			if(!rtnv) throw new RuntimeError(this.first_line, "呼び出しが不正です");
			return new NullValue(loc);
		}
		else throw new RuntimeError(this.first_line, "呼び出しが不正です");
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
			var str = array2text(par2);
			var rtnv = filesystem.write_str(par1.value, str, false);
			if(!rtnv) throw new RuntimeError(this.first_line, "呼び出しが不正です");
			return new NullValue(loc);
		}
		else throw new RuntimeError(this.first_line, "呼び出しが不正です");
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
			var rtnv = filesystem.close(par1.value, true);
			if(!rtnv) throw new RuntimeError(this.first_line, "呼び出しが不正です");
			return new NullValue(loc);
		}
		else throw new RuntimeError(this.first_line, "呼び出しが不正です");
	}, null, function(argc){
		return argc[0].makePython() + '.close()\n';
	}),
	"push": new DefinedFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par1 instanceof ArrayValue && par2 instanceof Value)
		{
			par1.value.push(par2);
			return new NullValue(loc);
		}
		else throw new RuntimeError(loc.first_line, 'pushは配列にしか使えません');
	}, null, function(argc){
		return argc[0].makePython() + '.append(' + argc[1].makePython() + ')\n';
	}),
	"unshift": new DefinedFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par1 instanceof ArrayValue && par2 instanceof Value)
		{
			par1.value.unshift(par2);
			return new NullValue(loc);
		}
		else throw new RuntimeError(loc.first_line, 'pushは配列にしか使えません');
	}, null, function(argc){
		return argc[0].makePython() + '.insert(0, ' + argc[1].makePython() + ')\n';
	}),
};
