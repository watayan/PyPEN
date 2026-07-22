var defined_functions = {
	// オブジェクト関係
	// copy: コピー
	// typeis: 型判定
	// typeof: 型名取得
	// range: 整数の範囲を生成
	// keys: 辞書のキーを取得
	"copy": new BuiltinFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		return par1.copy();
	}, null, null),

	"typeis": new BuiltinFunction(2, function(param, loc){
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
	}, null, function(argc){return "isinstance(" + argc[0] + ", " + argc[1] + ")";}),

	"typeof": new BuiltinFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue) return new StringValue(["整数"], loc, "整数");
		else if(par1 instanceof FloatValue) return new StringValue(["実数"], loc, "実数");
		else if(par1 instanceof StringValue) return new StringValue(["文字列"], loc, "文字列");
		else if(par1 instanceof BooleanValue) return new StringValue(["真偽"], loc, "真偽");
		else if(par1 instanceof ArrayValue) return new StringValue(["リスト"], loc, "リスト");
		else if(par1 instanceof DictionaryValue) return new StringValue(["辞書"], loc, "辞書");
		else if(par1 instanceof NullValue) return new StringValue([""], loc, "");
		else this.throwRuntimeError("typeof", "不明な型です");
	}, null, function(argc){return "type(" + argc[0] + ")";}),

	"range": new BuiltinFunction([1,2,3], function(param, loc){
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

	"keys": new BuiltinFunction(1, function(param, loc){
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

	// リスト（一部は文字列）関係
	// join: 結合
	// length: 長さ
	// append: 末尾に追加
	// extend: 末尾に結合
	// pop, shift, push, unshift: 末尾・先頭の削除・追加
	"join": new BuiltinFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par1 instanceof StringValue && par2 instanceof ArrayValue)
		{
			var sep = par1.getJSValue();
			var rtnv = [];
			for(var i = 0; i < par2._value.length; i++)
				rtnv.push(par2.getValue(i).valueString());
			var v = rtnv.join(sep);
			return new StringValue([v], loc, v);
		}
	},null, function(argc){return argc[0] + '.join(' + argc[1] + ')';}),

	"length": new BuiltinFunction(1, function(param, loc){
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
	}, null, function(argc){return "len(" + argc[0] + ")";}),

	"append": new BuiltinFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par1 instanceof StringValue && par2 instanceof StringValue)
		{
			var v = par1.getJSValue() + par2.getJSValue();
			return new StringValue([v], loc, v);
		}
		else if(par1 instanceof ArrayValue && par2 instanceof Value)
		{
			par1._value.push(par2);
			return par1;
		}
		else this.throwRuntimeError("append", "appendの引数の型が違います");
	}, null, function(argc){return argc[0] + '+' + argc[1];}),

	"extend": new BuiltinFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par1 instanceof StringValue && par2 instanceof StringValue)
		{
			var v = par1.getJSValue() + par2.getJSValue();
			return new StringValue([v], loc, v);
		}
		else if(par1 instanceof ArrayValue && par2 instanceof ArrayValue)
		{
			for(var i of par2._value) par1._value.push(i);
			return par1;
		}
		else this.throwRuntimeError("extend", "extendの引数の型が違います");
	}, null, function(argc){return argc[0] + '.extend(' + argc[1] + ')';}),

	"pop": new BuiltinFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof ArrayValue)
		{
			if(par1._value.length > 0)
				return par1._value.pop();
			else this.throwRuntimeError("pop", "空の配列にpopを適用しようとしました");
		}
		else this.throwRuntimeError("pop", "popは配列にしか使えません");
	}, null, function(argc){return argc[0] + '.pop()';}),

	"shift": new BuiltinFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof ArrayValue)
		{
			if(par1._value.length > 0)
				return par1._value.shift();
			else this.throwRuntimeError("shift", "空の配列にshiftを適用しようとしました");
		}
		else this.throwRuntimeError("shift", "shiftは配列にしか使えません");
	}, null, function(argc){
		return argc[0] + '.shift()';
	}),
	"push": new BuiltinFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par1 instanceof ArrayValue && par2 instanceof Value)
		{
			par1._args.push(par2);
			par1._value.push(par2);
			return new ArrayValue(par1._value, loc, par1._value);
		}
		else this.throwRuntimeError("push", "pushは配列にしか使えません");
	}, null, function(argc){
		return argsPython(argc[0]) + '.append(' + argsPython(argc[1]) + ')\n';
	}),
	"unshift": new BuiltinFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par1 instanceof ArrayValue && par2 instanceof Value)
		{
			par1._value.unshift(par2);
			return new NullValue(loc);
		}
		else this.throwRuntimeError("unshift", "unshiftは配列にしか使えません");
	}, null, function(argc){
		return argsPython(argc[0]) + '.insert(0, ' + argsPython(argc[1]) + ')\n';
	}),

	// 文字列関係
	// match: 正規表現にマッチする部分を抽出
	// search: 正規表現にマッチする部分を抽出
	// substring: 文字列の一部を抽出
	// split: 文字列を分割
	// extract: 文字列を分割して指定した番号の部分を抽出
	// insert: 文字列の指定した位置に文字列を挿入
	// replace: 文字列の指定した位置の指定した長さの部分を置換

	"match": new BuiltinFunction(2, function(param, loc){
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
	}, "re", function(argc){return "re.match(" + argc[0] + ", " + argc[1] + ").groups()";}),

	"search": new BuiltinFunction(2, function(param, loc){
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
	}, "re", function(argc){return "re.search(" + argc[0] + ", " + argc[1] + ").groups()";}),

	"substring": new BuiltinFunction([2,3], function(param, loc){
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
	"split": new BuiltinFunction([1,2], function(param, loc){
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
	"extract": new BuiltinFunction(3, function(param, loc){
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
	"insert": new BuiltinFunction(3, function(param, loc){
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
	"replace": new BuiltinFunction(4, function(param, loc){
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

	// 数学関係
	// abs: 絶対値
	// random: 乱数
	// ceil: 切り上げ
	// floor: 切り捨て
	// round: 四捨五入
	// sin, cos, tan, asin, acos, atan, atan2, sqrt, log, exp, pow
	"abs": new BuiltinFunction(1, function (param, loc){
		var par1 = param[0].getValue();
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

	"random": new BuiltinFunction([0,1], function(param, loc){
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

	"ceil": new BuiltinFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue) return par1;
		else if(par1 instanceof FloatValue)
		{
			var v = Math.ceil(par1.getJSValue());
			if(isSafeInteger(v)) return new IntValue([v], loc, v);
		}
		else this.throwRuntimeError("ceil", "ceilは数値にしか使えません");
	}, "math", null),

	"floor": new BuiltinFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue) return par1;
		else if(par1 instanceof FloatValue)
		{
			var v = Math.floor(par1.getJSValue());
			if(isSafeInteger(v)) return new IntValue([v], loc, v);
		}
		else this.throwRuntimeError("floor", "floorは数値にしか使えません");
	}, "math", null),

	"round": new BuiltinFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue) return par1;
		else if(par1 instanceof FloatValue)
		{
			var v = Math.round(par1.getJSValue());
			if(isSafeInteger(v)) return new IntValue([v], loc, v);
		}
		else this.throwRuntimeError("round", "roundは数値にしか使えません");
	}, null, null),

	"sin": new BuiltinFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			var v = Math.sin(Number(par1.getJSValue()));
			return new FloatValue([v], loc, v);
		}
		else this.throwRuntimeError("sin", "sinは数値にしか使えません");
	}, "math", null),
	"cos": new BuiltinFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			var v = Math.cos(Number(par1.getJSValue()));
			return new FloatValue([v], loc, v);
		}
		else this.throwRuntimeError("cos", "cosは数値にしか使えません");
	}, "math", null),
	"tan": new BuiltinFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			let v = Math.tan(Number(par1.getJSValue()));
			if(isFinite(v)) return new FloatValue([v], loc, v);
			else this.throwRuntimeError("tan", "オーバーフローしました");
		}
		else this.throwRuntimeError("tan", "tanは数値にしか使えません");
	}, "math", null),
	"asin": new BuiltinFunction(1, function(param, loc){
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
	"acos": new BuiltinFunction(1, function(param, loc){
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
	"atan": new BuiltinFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			var v = Math.atan(Number(par1.getJSValue()));
			return new FloatValue([v], loc, v);
		}
		else this.throwRuntimeError("atan", "atanは数値にしか使えません");
	}, "math", null),
	"atan2": new BuiltinFunction(2, function(param, loc){
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
	"sqrt": new BuiltinFunction(1, function(param, loc){
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
	"log": new BuiltinFunction(1, function(param, loc){
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
	"exp": new BuiltinFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			let v = Math.exp(Number(par1.getJSValue()));
			if(isFinite(v)) return new FloatValue([v], loc, v);
			this.throwRuntimeError("exp", "オーバーフローしました");
		}
		else this.throwRuntimeError("exp", "expは数値にしか使えません");
	}, "math", null),
	"pow": new BuiltinFunction(2, function(param, loc){
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


	// File I/O関係
	// isfile: ファイルが存在するかどうか
	// openr, openw, opena: ファイルを開く
	// getline, getchar: ファイルから1行・1文字読み込む
	// putline, putstr: ファイルに1行・1文字書き込む
	// close: ファイルを閉じる
	"isfile": new BuiltinFunction(1, function(param, loc){
		var par = param[0].getValue();
		if(par instanceof StringValue)
		{
			var v = storage.getItem(par.getJSValue()) != null;
			return new BooleanValue([v], loc, v);
		}
		else this.throwRuntimeError("isfile", "ファイル名は文字列でなくてはいけません");
	}, null, null),
	"openr": new BuiltinFunction(1, function(param, loc){
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
	"openw": new BuiltinFunction(1, function(param, loc){
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
	"opena": new BuiltinFunction(1, function(param, loc){
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
	"getline": new BuiltinFunction(1, function(param, loc){
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
	"getchar": new BuiltinFunction(1, function(param, loc){
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
	"putline": new BuiltinFunction(2, function(param, loc){
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
		var str = argsPython(argc[1]);
		if(!(argc[1] instanceof StringValue))
			str = 'str(' + str + ')';
		return argsPython(argc[0]) + '.write(' + str + " + '\n')";
	}),
	"putstr": new BuiltinFunction(2, function(param, loc){
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
		var str = argsPython(argc[1]);
		if(!(argc[1] instanceof StringValue))
			str = 'str(' + str + ')';
		return argsPython(argc[0]) + '.write(' + str + ")";
	}),
	"close": new BuiltinFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue)
		{
			var rtnv = filesystem.close(par1.getJSValue(), true);
			if(!rtnv) this.throwRuntimeError("close", "呼び出しが不正です");
			return new NullValue(loc);
		}
		else this.throwRuntimeError("close", "呼び出しが不正です");
	}, null, function(argc){
		return argsPython(argc[0]) + '.close()\n';
	}),

	// サウンド関係
	// samplingRate: サンプリングレートを取得
	// playWave: 波形を再生
	"samplingRate": new BuiltinFunction(0, function(param, loc){
		var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
		return new IntValue([audioCtx.sampleRate], loc, audioCtx.sampleRate);
	}, null, null),
	"playWave": new BuiltinFunction(2, function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param[1].getValue();
		if(par1 instanceof ArrayValue && (par2 instanceof IntValue || par2 instanceof FloatValue))
		{
			var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
			var duration = Number(par2.getJSValue());
			var myArrayBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
			for(var i = 0; i < audioCtx.sampleRate * duration; i++)
				myArrayBuffer.getChannelData(0)[i] = Number(par1.getValue(i % par1._value.length).getJSValue());
			var source = audioCtx.createBufferSource();
			source.buffer = myArrayBuffer;
			source.connect(audioCtx.destination);
			source.start();
			return new NullValue(loc);
		}
	}, null, null),
};

var more_functions = {
    "all": new BuiltinFunction(-1, function(param, loc){
        var par = param;
        if(param.length == 1 && param[0].getValue() instanceof ArrayValue)
            par = param[0].getValue().getJSValue();
        for(let i = 0; i < par.length; i++)
            if(!toBool(par[i].getValue())) return new BooleanValue([false], loc, false);
        return new BooleanValue([true], loc, true);
    }, null, null),
    "any": new BuiltinFunction(-1, function(param, loc){
        var par = param;
        if(param.length == 1 && param[0].getValue() instanceof ArrayValue)
            par = param[0].getValue().getJSValue();
        for(let i = 0; i < par.length; i++)
            if(toBool(par[i].getValue())) return new BooleanValue([true], loc, true);
        return new BooleanValue([false], loc, false);
    }, null, null),
    "sum": new BuiltinFunction(-1, function(param, loc){
        var par = param;    // 引数のArray
        if(par.length == 1 && par[0].getValue() instanceof ArrayValue) 
            par = par[0].getValue().getJSValue();
        var sum = BigInt(0);
        var int_flag = true;
        for(let i = 0; i < par.length; i++)
        {
            if(par[i] instanceof IntValue)
            {
                if(int_flag) sum += par[i].getJSValue();
                else sum += Number(par[i].getJSValue());
            }
            else if(par[i] instanceof FloatValue)
            {
                if(int_flag)
                {
                    sum = Number(sum);
                    int_flag = false;
                }
                sum += par[i].getJSValue();
            }
            else this.throwRuntimeError("sum", "引数は数値のリストです");
        }
        if(int_flag) return new IntValue([sum], this.loc, sum);
        else return new FloatValue([sum], this.loc, sum);
	}, null, null),
    "prod": new BuiltinFunction(-1, function(param, loc){
        var par = param;    // 引数のArrayValue
        if(par.length == 1 && par[0].getValue() instanceof ArrayValue) 
            par = param[0].getValue().getJSValue();
        var prod = BigInt(1);
        var int_flag = true;
        for(let i = 0; i < par.length; i++)
        {
            if(par[i] instanceof IntValue)
            {
                if(int_flag) prod *= par[i].getJSValue();
                else prod *= Number(par[i].getJSValue());
            }
            else if(par[i] instanceof FloatValue)
            {
                if(int_flag)
                {
                    prod = Number(prod);
                    int_flag = false;
                }
                prod *= par[i].getJSValue();
            }
            else this.throwRuntimeError("prod", "引数は数値のリストです");
        }
        if(int_flag) return new IntValue([prod], loc, prod);
        else return new FloatValue([prod], loc, prod);
    	}, null, null),
    "sumprod": new BuiltinFunction(2, function(param, loc){
        var par1 = param[0].getValue();
        var par2 = param[1].getValue();
        if(!(par1 instanceof ArrayValue) || !(par2 instanceof ArrayValue))
            throw new RuntimeError(loc.first_line, '引数は2つの数値の配列です');
        if(par1.valueLength() != par2.valueLength())
            throw new RuntimeError(loc.first_line, '引数の配列の長さが違います');
        var sumprod = BigInt(0);
        var int_flag = true;
        for(let i = 0; i < par1.valueLength(); i++)
        {
            var v1 = par1.getValue(i);
            var v2 = par2.getValue(i);
            if(v1 instanceof IntValue && v2 instanceof IntValue)
            {
                if(int_flag) sumprod += v1.getJSValue() * v2.getJSValue();
                else sumprod += Number(v1.getJSValue()) * Number(v2.getJSValue());
            }
            else if((v1 instanceof IntValue || v1 instanceof FloatValue) &&
                    (v2 instanceof IntValue || v2 instanceof FloatValue))
            {
                int_flag = false;
                sumprod += Number(v1.getJSValue()) * Number(v2.getJSValue());
            }
            else this.throwRuntimeError("sumprod", "引数は2つの数値の配列です");
        }
        if(int_flag) return new IntValue([sumprod], loc, sumprod);
        else return new FloatValue([sumprod], loc, sumprod);
	}, null, null),
    "average": new BuiltinFunction(-1, function(param, loc){
        var par = param;    // 引数のArray
        if(param.length == 1 && param[0].getValue() instanceof ArrayValue) par = param[0].getValue().getJSValue();
        var sum = functions["sum"].func(param, loc).getValue().getJSValue();
        if(par.length == 0) this.throwRuntimeError("average", "引数の配列は空であってはいけません");
        var v = Number(sum) / par.length;
        return new FloatValue([v], this.loc, v);
	}, null, null),
    "factorial": new BuiltinFunction(1, function(param, loc){
		var par1 = param[0];
		if(par1 instanceof IntValue && par1.getJSValue() >= BigInt(0))
		{
            var p = BigInt(1);
            for(let i = BigInt(2); i <= par1.getJSValue(); i++) p *= i;
            return new IntValue([p], this.loc, p);
		}
		else throw new RuntimeError(loc.first_line, '引数は非負整数です');
	}, null, null),
	"swap": new BuiltinFunction(2, function(param, loc){
		var par1 = param[0], par2 = param[1];
		if(par1 instanceof Variable && par2 instanceof Variable)
		{
			var vt1 = findVarTable(par1.varname);
			var vt2 = findVarTable(par2.varname);
			var val1 = getValueByArgs(vt1.vars[par1.varname], par1._args ? par1._args : null, loc);
			var val2 = getValueByArgs(vt2.vars[par2.varname], par2._args ? par2._args : null, loc);
			setVariableByArgs(vt1, par1.varname, par1._args ? par1._args : null, val2.getValue(), loc);
			setVariableByArgs(vt2, par2.varname, par2._args ? par2._args : null, val1.getValue(), loc);
			return new NullValue(loc);
		}
		else throw new RuntimeError(loc.first_line, "swapの引数は変数にしてください");
	},null, function(argc){
		return argc[0] + ", " + argc[1] + " = " + argc[1] + ", " + argc[0];
	}),
    "max": new BuiltinFunction(-1, function(param, loc){
        var par = param;    // 引数のArray
        if(par.length == 1 && par[0].getValue() instanceof ArrayValue) 
            par = par[0].getValue().getJSValue();
        var max_val = new NullValue(loc), val_type = 0; // 0:未定義, 1:Int, 2:Float
        for(let i = 0; i < par.length; i++)
        {
            var val = par[i].getValue();
            if(val instanceof IntValue)
            {
                if(val_type == 0) 
                {
                    max_val = val;
                    val_type = 1;
                }
                else if(val_type == 1)
                {
                    if(val.getValue().getJSValue() > max_val.getValue().getJSValue()) max_val = val;
                }
                else
                {
                    if(Number(val.getValue().getJSValue()) > max_val.getValue().getJSValue())
                    {
                        max_val = new FloatValue([Number(val.getValue().getJSValue())], loc, Number(val.getValue().getJSValue()));
                        val_type = 2;
                    } 
                }
            }
            else if(val instanceof FloatValue)
            {
                if(val_type == 0)
                {
                    max_val = val;
                    val_type = 2;
                }
                else
                {
                    if(val.getValue().getJSValue() > max_val.getValue().getJSValue())
                        max_val = new FloatValue([Number(val.getValue().getJSValue())], loc, Number(val.getValue().getJSValue()));
                }
            }
            else throw new RuntimeError(loc.first_line, '引数は数値のリストです');
        }
        return max_val;
    }, null, null),
    "min": new BuiltinFunction(-1, function(param, loc){
        var par = param;    // 引数のArray
        if(par.length == 1 && par[0].getValue() instanceof ArrayValue) 
            par = par[0].getValue().getJSValue();
        var min_val = new NullValue(loc), val_type = 0; // 0:未定義, 1:Int, 2:Float
        for(let i = 0; i < par.length; i++)
        {
            var val = par[i].getValue();
            if(val instanceof IntValue)
            {
                if(val_type == 0) 
                {
                    min_val = val;
                    val_type = 1;
                }
                else if(val_type == 1)
                {
                    if(val.getValue().getJSValue() < min_val.getValue().getJSValue()) min_val = val;
                }
                else
                {
                    if(Number(val.getValue().getJSValue()) < min_val.getValue().getJSValue())
                    {
                        min_val = new FloatValue([Number(val.getValue().getJSValue())], loc, Number(val.getValue().getJSValue()));
                        val_type = 2;
                    } 
                }
            }
            else if(val instanceof FloatValue)
            {
                if(val_type == 0)
                {
                    min_val = val;
                    val_type = 2;
                }
                else
                {
                    if(val.getValue().getJSValue() < min_val.getValue().getJSValue())
                        min_val = new FloatValue([Number(val.getValue().getJSValue())], loc, Number(val.getValue().getJSValue()));
                }
            }
            else throw new RuntimeError(loc.first_line, '引数は数値のリストです');
        }
        return min_val;
    }, null, null),
    "median": new BuiltinFunction(-1, function(param, loc){
        var par = param;    // 引数のArray
        if(par.length == 1 && par[0].getValue() instanceof ArrayValue) 
            par = param[0].getValue().getJSValue();
        var nums = [];
        for(let i = 0; i < par.length; i++) nums.push(Number(par[i].getValue().getJSValue()));
        if(nums.length == 0) return new NullValue(loc);
        nums.sort(function(a, b){return a - b;});
        if(nums.length % 2 == 1){
            var median = nums[(nums.length - 1) / 2];
            return new FloatValue([median], loc, median);
        }
        else{
            var median = (nums[nums.length / 2 - 1] + nums[nums.length / 2]) / 2;
            return new FloatValue([median], loc, median);
        }
    }, null, null),
    "comb": new BuiltinFunction(2, function(param, loc){
        var par1 = param[0].getValue();
        var par2 = param[1].getValue();
        if(par1 instanceof IntValue && par2 instanceof IntValue &&
           par1.getJSValue() >= BigInt(0) && par2.getJSValue() >= BigInt(0) && par1.getJSValue() >= par2.getJSValue())
        {
            var n = par1.getJSValue();
            var r = par2.getJSValue();
            if(r > n - r) r = n - r;
            var p = BigInt(1);
            for(let i = BigInt(0); i < r; i++) p *= (n - i);
            for(let i = BigInt(0); i < r; i++) p /= (i + BigInt(1));
            return new IntValue([p], loc, p);
        }
        else throw new RuntimeError(loc.first_line, '引数は非負整数で、1つ目の引数は2つ目の引数以上でなければなりません');
    }, null, null),
    "perm": new BuiltinFunction(2, function(param, loc){
        var par1 = param[0].getValue();
        var par2 = param[1].getValue();
        if(par1 instanceof IntValue && par2 instanceof IntValue &&
           par1.getJSValue() >= BigInt(0) && par2.getJSValue() >= BigInt(0) && par1.getJSValue() >= par2.getJSValue())
        {
            var n = par1.getJSValue();
            var r = par2.getJSValue();
            var p = BigInt(1);
            for(let i = BigInt(0); i < r; i++) p *= (n - i);
            return new IntValue([p], loc, p);
        }
        else throw new RuntimeError(loc.first_line, '引数は非負整数で、1つ目の引数は2つ目の引数以上でなければなりません');
    }, null, null),
    "pvariance": new BuiltinFunction(-1, function(param, loc){
        var par = param;    // 引数のArray
        if(param.length == 1 && param[0].getValue() instanceof ArrayValue) 
            par = param[0].getValue().getJSValue();
        var mean = functions["average"].func(par, loc).getJSValue();
        var sum = 0.0; 
        if(par.length == 0) throw new RuntimeError(loc.first_line, "空のリストでは分散は計算できません");
        for(let i = 0; i < par.length; i++)
            if(par[i] instanceof IntValue || par[i] instanceof FloatValue)
                sum += (Number(par[i].getJSValue()) - mean) ** 2;
            else throw new RuntimeError(loc.first_line, "引数は数値のリストでなくてはいけません");
        return new FloatValue([sum / par.length], loc, sum / par.length);
    }, null, null),
    "variance": new BuiltinFunction(-1, function(param, loc){
        var par = param;    // 引数のArray
        if(param.length == 1 && param[0].getValue() instanceof ArrayValue) 
            par = param[0].getValue().getJSValue();
        var mean = functions["average"].func(par, loc).getJSValue();
        var sum = 0.0; 
        if(par.length < 2) throw new RuntimeError(loc.first_line, "長さ2未満のリストでは分散は計算できません");
        for(let i = 0; i < par.length; i++)
            if(par[i] instanceof IntValue || par[i] instanceof FloatValue)
                sum += (Number(par[i].getJSValue()) - mean) ** 2;
            else throw new RuntimeError(loc.first_line, "引数は数値のリストでなくてはいけません");
        return new FloatValue([sum / (par.length - 1)], loc, sum / (par.length - 1));
    }, null, null),
    "pstdev": new BuiltinFunction(-1, function(param, loc){
        var s = functions["pvariance"].func(param, loc).getValue().getJSValue();
        return new FloatValue([Math.sqrt(s)], loc, Math.sqrt(s));
    }, null, null),
    "stdev": new BuiltinFunction(-1, function(param, loc){
        var s = functions["variance"].func(param, loc).getValue().getJSValue();
        return new FloatValue([Math.sqrt(s)], loc, Math.sqrt(s));
    }, null, null),
    "pcovariance": new BuiltinFunction(2, function(param, loc){
        var par1 = param[0].getValue();
        var par2 = param[1].getValue();
        if(par1 instanceof ArrayValue && par2 instanceof ArrayValue && par1.getJSValue().length == par2.getJSValue().length)
        {
            var n = par1.getJSValue().length;
            if(n == 0) throw new RuntimeError(loc.first_line, "空のリストでは共分散が計算できません");
            var s = 0.0;
            var m1 = functions["average"].func(par1.getJSValue(), loc).getValue().getJSValue(),
                m2 = functions["average"].func(par2.getJSValue(), loc).getValue().getJSValue();
            for(let i = 0; i < n; i++)
            {
                var val1, val2;
                if(par1.getJSValue()[i] instanceof IntValue || par1.getJSValue()[i] instanceof FloatValue)
                    val1 = Number(par1.getJSValue()[i].getValue().getJSValue());
                else throw new RuntimeError(loc.first_line, "数値のリストである必要があります");
                if(par2.getJSValue()[i] instanceof IntValue || par2.getJSValue()[i] instanceof FloatValue)
                    val2 = Number(par2.getJSValue()[i].getValue().getJSValue());
                else throw new RuntimeError(loc.first_line, "数値のリストである必要があります");
                s += (val1 - m1) * (val2 - m2);
            }
            return new FloatValue([s / n], loc, s / n);
        }
        else throw new RuntimeError(loc.first_line, "引数は2つの長さが等しい数値のリストでなくてはいけません");
    }, null, null),
    "covariance": new BuiltinFunction(2, function(param, loc){
        var par1 = param[0].getValue();
        var par2 = param[1].getValue();
        if(par1 instanceof ArrayValue && par2 instanceof ArrayValue && par1.getJSValue().length == par2.getJSValue().length)
        {
            var n = par1.getJSValue().length;
            if(n < 2) throw new RuntimeError(loc.first_line, "長さ2未満のリストでは共分散が計算できません");
            var s = 0.0;
            var m1 = functions["average"].func(par1.getJSValue(), loc).getValue().getJSValue(),
                m2 = functions["average"].func(par2.getJSValue(), loc).getValue().getJSValue();
            for(let i = 0; i < n; i++)
            {
                var val1, val2;
                if(par1.getJSValue()[i] instanceof IntValue || par1.getJSValue()[i] instanceof FloatValue)
                    val1 = Number(par1.getJSValue()[i].getValue().getJSValue());
                else throw new RuntimeError(loc.first_line, "数値のリストである必要があります");
                if(par2.getJSValue()[i] instanceof IntValue || par2.getJSValue()[i] instanceof FloatValue)
                    val2 = Number(par2.getJSValue()[i].getValue().getJSValue());
                else throw new RuntimeError(loc.first_line, "数値のリストである必要があります");
                s += (val1 - m1) * (val2 - m2);
            }
            return new FloatValue([s / (n - 1)], loc, s / (n - 1));
        }
        else throw new RuntimeError(loc.first_line, "引数は2つの長さが等しい数値のリストでなくてはいけません");
    }, null, null),
    "correl": new BuiltinFunction(2, function(param, loc){
        var par1 = param[0].getValue();
        var par2 = param[1].getValue();
        if(par1 instanceof ArrayValue && par2 instanceof ArrayValue && par1.getJSValue().length == par2.getJSValue().length)
        {
            var c = functions["pcovariance"].func([par1, par2], loc).getValue()._value;
            var s1 = functions["pstdev"].func(par1.getJSValue(), loc).getValue()._value;
            var s2 = functions["pstdev"].func(par2.getJSValue(), loc).getValue()._value;
            if(s1 == 0.0 || s2 == 0.0) throw new RuntimeError(loc.first_line, "標準偏差が0なので相関係数が計算できません");
            return new FloatValue([c / s1 / s2], loc, c / s1 / s2);
            }
        else throw new RuntimeError(loc.first_line, "引数は2つの長さが等しい数値のリストでなくてはいけません");
    }, null, null),
    "gcd": new BuiltinFunction(2, function(param, loc){
        var par1 = param[0].getValue();
        var par2 = param[1].getValue();
        if(par1 instanceof IntValue && par2 instanceof IntValue)
        {
            var a = par1.getJSValue();
            var b = par2.getJSValue();
            if(a < BigInt(0)) a = -a;
            if(b < BigInt(0)) b = -b;
            var g = gcd(a, b);
            return new IntValue([g], loc, g);
        }
        else throw new RuntimeError(loc.first_line, "引数は整数でなくてはいけません");
    }, null, null),
    "lcm": new BuiltinFunction(2, function(param, loc){
        var par1 = param[0].getValue();
        var par2 = param[1].getValue();
        if(par1 instanceof IntValue && par2 instanceof IntValue)
        {
            var a = par1.getJSValue() >= BigInt(0) ? par1.getJSValue() : -par1.getJSValue();
            var b = par2.getJSValue() >= BigInt(0) ? par2.getJSValue() : -par2.getJSValue();
            if(a == BigInt(0) || b == BigInt(0)) return new IntValue(BigInt(0), loc);
            var g = gcd(a, b);
            var l = (a / g) * b;
            return new IntValue([l], loc, l);
        }
        else throw new RuntimeError(loc.first_line, "引数は整数でなくてはいけません");
    }, null, null),
    "chr": new BuiltinFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof IntValue)
        {
            var code = Number(par1.getJSValue());
            if(code < 0 || code > 0x10FFFF)
                throw new RuntimeError(loc.first_line, "引数の値が不正です");
            var s = String.fromCodePoint(code);
            return new StringValue([s], loc, s);
        }
        else throw new RuntimeError(loc.first_line, "引数は整数でなくてはいけません");
    }, null, null),
    "ord": new BuiltinFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof StringValue)
        {
            var s = par1.getJSValue();
            if(s.length == 0)
                throw new RuntimeError(loc.first_line, "空文字列のordは定義されていません");
            var code = s.codePointAt(0);
            return new IntValue([BigInt(code)], loc, BigInt(code));
        }
        else throw new RuntimeError(loc.first_line, "引数は文字列でなくてはいけません");
    }, null, null),
    "linear_regression": new BuiltinFunction(2, function(param, loc){
        var par1 = param[0].getValue();
        var par2 = param[1].getValue();
        if(par1 instanceof ArrayValue && par2 instanceof ArrayValue && par1.valueLength() == par2.valueLength())
        {
            var n = par1.valueLength();
            if(n < 2) throw new RuntimeError(loc.first_line, "長さ2未満のリストでは線形回帰は計算できません");
            var sum_x = 0.0, sum_y = 0.0, sum_xy = 0.0, sum_x2 = 0.0;
            for(let i = 0; i < n; i++)
            {
                var x, y;
                if(par1.getValue(i) instanceof IntValue || par1.getValue(i) instanceof FloatValue)
                    x = Number(par1.getValue(i).getValue().getJSValue());
                else throw new RuntimeError(loc.first_line, "数値のリストである必要があります");
                if(par2.getValue(i) instanceof IntValue || par2.getValue(i) instanceof FloatValue)
                    y = Number(par2.getValue(i).getValue().getJSValue());
                else throw new RuntimeError(loc.first_line, "数値のリストである必要があります");
                sum_x += x;
                sum_y += y;
                sum_xy += x * y;
                sum_x2 += x * x;
            }
            if(n * sum_x2 - sum_x * sum_x == 0)
                throw new RuntimeError(loc.first_line, "線形回帰が計算できません");
            var slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x);
            var intercept = (sum_y - slope * sum_x) / n;
            return new ArrayValue([new FloatValue(slope, loc), new FloatValue(intercept, loc)], loc
                , [new FloatValue(slope, loc), new FloatValue(intercept, loc)]);
        }
        else throw new RuntimeError(loc.first_line, "引数は2つの長さが等しい数値のリストでなくてはいけません");
    }, null, null),
    "reverse": new BuiltinFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof ArrayValue)
        {
            for(let i = 0, j = par1.valueLength() - 1; i < j; i++, j--)
            {
                var temp = par1.getValue(i);
                par1.setValue(par1.getValue(j), i);
                par1.setValue(temp, j);
            }
            return par1;
        }
        else throw new RuntimeError(loc.first_line, "引数は配列でなくてはいけません");
    }, null, null),
    "reversed": new BuiltinFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof ArrayValue)
        {
            var arr = [];
            for(let i = par1.valueLength() - 1; i >= 0; i--) arr.push(par1.getValue(i));
            return new ArrayValue(arr, loc,arr);
        }
        else throw new RuntimeError(loc.first_line, "引数は配列でなくてはいけません");
    }, null, null),
    "sorted": new BuiltinFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof ArrayValue)
        {
            // var arr = [].concat(par1.getValue());
            // textareaAppend("DEBUG: " + constructor_name(par1.getJSValue()) + "\n");
            var arr = par1.getJSValue().toSorted(function(a, b){
                if(a instanceof IntValue && b instanceof IntValue)
                    return (a.getJSValue() < b.getJSValue()) ? -1 : (a.getJSValue() > b.getJSValue()) ? 1 : 0;
                else
                {
                    var va = (a instanceof IntValue || a instanceof FloatValue) ? Number(a.getJSValue()) : NaN;
                    var vb = (b instanceof IntValue || b instanceof FloatValue) ? Number(b.getJSValue()) : NaN;
                    if(!isNaN(va) && !isNaN(vb))
                        return (va < vb) ? -1 : (va > vb) ? 1 : 0;
                    else
                    {
                        var sa = a.getJSValue().toString();
                        var sb = b.getJSValue().toString();
                        return (sa < sb) ? -1 : (sa > sb) ? 1 : 0;
                    }
                }
            });
            return new ArrayValue(arr, loc, arr);
        }
        else throw new RuntimeError(loc.first_line, "引数は配列でなくてはいけません");
    }, null, null),
    "sort": new BuiltinFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof ArrayValue)
        {
            par1.getJSValue().sort(function(a, b){
                if(a instanceof IntValue && b instanceof IntValue)
                if(a instanceof IntValue && b instanceof IntValue)
                    return (a.getJSValue() < b.getJSValue()) ? -1 : (a.getJSValue() > b.getJSValue()) ? 1 : 0;
                else
                {
                    var va = (a instanceof IntValue || a instanceof FloatValue) ? Number(a.getJSValue()) : NaN;
                    var vb = (b instanceof IntValue || b instanceof FloatValue) ? Number(b.getJSValue()) : NaN;
                    if(!isNaN(va) && !isNaN(vb))
                        return (va < vb) ? -1 : (va > vb) ? 1 : 0;
                    else
                    {
                        var sa = a.getJSValue().toString();
                        var sb = b.getJSValue().toString();
                        return (sa < sb) ? -1 : (sa > sb) ? 1 : 0;
                    }
                }
            });
            return par1;
        }
        else throw new RuntimeError(loc.first_line, "引数は配列でなくてはいけません");
    }, null, null),
    "shuffled": new BuiltinFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof ArrayValue)
        {
            var arr = [].concat(par1.getJSValue());
            for(let i = arr.length - 1; i > 0; i--)
            {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
            return new ArrayValue(arr, loc, arr);
        }
        else throw new RuntimeError(loc.first_line, "引数は配列でなくてはいけません");
    }, null, null),
    "shuffle": new BuiltinFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof ArrayValue)
        {
            for(let i = par1.valueLength() - 1; i > 0; i--)
            {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = par1.getValue(i);
                par1.setValue(par1.getValue(j), i);
                par1.setValue(temp, j);
            }
            return par1;
        }
        else throw new RuntimeError(loc.first_line, "引数は配列でなくてはいけません");
    }, null, null),
    "next_permutation": new BuiltinFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof ArrayValue)
        {
            var arr = [].concat(par1.getJSValue());
            var i = arr.length - 2;
            while(i >= 0 && arr[i].getJSValue() >= arr[i + 1].getJSValue()) i--;
            if(i < 0) {
                return new ArrayValue([], loc, []);
            }
            var j = arr.length - 1;
            while(i < j && arr[i].getJSValue() >= arr[j].getJSValue()) j--;
            // arr[i]とarr[j]を交換
            var temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
            // arr[i+1]以降を反転
            var left = i + 1, right = arr.length - 1;
            while(left < right)
            {
                var temp2 = arr[left];
                arr[left] = arr[right];
                arr[right] = temp2;
                left++;
                right--;
            }
            return new ArrayValue(arr, loc, arr);
        }
        else throw new RuntimeError(loc.first_line, "引数は配列でなくてはいけません");
    }, null, null),
    "dnorm": new BuiltinFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof IntValue || par1 instanceof FloatValue)
        {
            var x = Number(par1.getJSValue());
            var res = dnorm(x);
            return new FloatValue([res], loc, res);
        }
        else throw new RuntimeError(loc.first_line, "引数は数値でなくてはいけません");
    }, null, null),
    "pnorm": new BuiltinFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof IntValue || par1 instanceof FloatValue)
        {
            var x = Number(par1.getJSValue());
            var res = pnorm(x);
            return new FloatValue([res], loc, res);
        }
        else throw new RuntimeError(loc.first_line, "引数は数値でなくてはいけません");
    }, null, null),
    "qnorm": new BuiltinFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof IntValue || par1 instanceof FloatValue)
        {
            var p = Number(par1.getJSValue());
            if(p < 0 || p > 1) throw new RuntimeError(loc.first_line, "確率は0から1の間でなくてはいけません");
            var res = qnorm(p);
            return new FloatValue([res], loc, res);
        }
        else throw new RuntimeError(loc.first_line, "引数は数値でなくてはいけません");
    }, null, null),
}

function gcd(a, b)
{
    if(b == BigInt(0)) return a;
    else return gcd(b, a % b);
}

function dnorm(x)
{
    return Math.exp(-0.5 * x * x) / (Math.sqrt(2 * Math.PI));
}

function pnorm(x) {
    // Abramowitz and Stegun approximation
    // 26.2.17 of ''Handbook of Mathematical Functions With Formulas, Graphs, and Mathematical Tables''
    const b = [1.330274429, -1.821255978, 1.781477937, -0.356563782, 0.319381530];
    const p = 0.2316419;
    const t = 1 / (1 + p * Math.abs(x));
    var v = 0;
    for(let bi of b) v = (bi + v) * t;
    const prob = dnorm(x) * v;
    return x > 0 ? 1 - prob : prob;
}

function qnorm(p) {
    if (p === 0) return -Infinity;
    if (p === 1) return Infinity;
    if (p === 0.5) return 0;
    // Acklam's algorithm
    // from ''An algorithm for computing the inverse normal cumulative distribution function''
    if(p < 0.02425 || p > 0.97575){
        const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
        const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00, 1.0];
        var p1 = p > 0.5 ? 1 - p : p;
        const q = Math.sqrt(-2 * Math.log(p1));
        var v1 = 0, v2 = 0;
        for(let ci of c) v1 = v1 * q + ci;
        for(let di of d) v2 = v2 * q + di;
        return p > 0.5 ? -v1 / v2 : v1 / v2;
    }
    else{
        const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
        const b = [ -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01, 1.0];
    const q = p - 0.5;
    const r = q * q;
    var v1 = 0, v2 = 0;
    for(let ai of a) v1 = v1 * r + ai;
    for(let bi of b) v2 = v2 * r + bi;
    return v1 * q / v2;
    }
}

more_functions["mean"] = more_functions["average"];

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
