	/**
	 * @constructor of DefinedFunction
	 * @param {number} argc 引数の個数
	 * @param {function} func 実際の関数
	 * @param {string} module Pythonで必要となるモジュール。nullならナニもいらない
	 * @param {function} convert this.argcを受け取ってPythonコードの文字列を返す関数。nullならthis.funcName(this.argc)的なことをする。
	 */

var functions = {
    "all": new DefinedFunction(-1, function(param, loc){
        var par = param;
        if(param.length == 1 && par[0] instanceof ArrayValue) par = par[0]._value;
        for(let i = 0; i < par.length; i++)
            if(!toBool(par[i]._value, loc)) return new BooleanValue([false], loc, false);
        return new BooleanValue([true], loc, true);
    }, null, null),
    "any": new DefinedFunction(-1, function(param, loc){
        var par = param;
        if(param.length == 1 && param[0] instanceof ArrayValue) par = param[0]._value;
        for(let i = 0; i < par.length; i++)
            if(toBool(par[i]._value, loc)) return new BooleanValue([true], loc, true);
        return new BooleanValue([false], loc, false);
    }, null, null),
    "sum": new DefinedFunction(-1, function(param, loc){
        var par = param;    // 引数のArray
        if(par.length == 1 && par[0].getValue() instanceof ArrayValue) par = par[0].getValue()._value;
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
    "prod": new DefinedFunction(-1, function(param, loc){
        var par = param;    // 引数のArrayValue
        if(par.length == 1 && par[0].getValue() instanceof ArrayValue) par = param[0]._value;
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
    "sumprod": new DefinedFunction(2, function(param, loc){
        var par1 = param[0].getValue();
        var par2 = param[1].getValue();
        if(!(par1 instanceof ArrayValue) || !(par2 instanceof ArrayValue))
            throw new RuntimeError(loc.first_line, '引数は2つの数値の配列です');
        if(par1._value.length != par2._value.length)
            throw new RuntimeError(loc.first_line, '引数の配列の長さが違います');
        var sumprod = BigInt(0);
        var int_flag = true;
        for(let i = 0; i < par1._value.length; i++)
        {
            var v1 = par1._value[i].getValue();
            var v2 = par2._value[i].getValue();
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
    "average": new DefinedFunction(-1, function(param, loc){
        var par = param;    // 引数のArray
        if(param.length == 1 && param[0].getValue() instanceof ArrayValue) par = param[0].getValue()._value;
        var sum = functions["sum"].func(param, loc).getValue()._value;
        if(par.length == 0) this.throwRuntimeError("average", "引数の配列は空であってはいけません");
        var v = Number(sum) / par.length;
        return new FloatValue([v], this.loc, v);
	}, null, null),
    "factorial": new DefinedFunction(1, function(param, loc){
		var par1 = param[0];
		if(par1 instanceof IntValue && par1.getJSValue() >= BigInt(0))
		{
            var p = BigInt(1);
            for(let i = BigInt(2); i <= par1.getJSValue(); i++) p *= i;
            return new IntValue([p], this.loc, p);
		}
		else throw new RuntimeError(loc.first_line, '引数は非負整数です');
	}, null, null),
	"swap": new DefinedFunction(2, function(param, loc){
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
    "max": new DefinedFunction(-1, function(param, loc){
        var par = param;    // 引数のArray
        if(par.length == 1 && par[0].getValue() instanceof ArrayValue) par = par[0].getValue().getJSValue();
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
                    if(val.getJSValue() > max_val.getJSValue()) max_val = val;
                }
                else
                {
                    if(Number(val.getJSValue()) > max_val.getJSValue())
                    {
                        max_val = new FloatValue([Number(val.getJSValue())], loc, Number(val.getJSValue()));
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
                    if(val.getJSValue() > max_val.getJSValue())
                        max_val = new FloatValue([Number(val.getJSValue())], loc, Number(val.getJSValue()));
                }
            }
            else throw new RuntimeError(loc.first_line, '引数は数値のリストです');
        }
        return max_val;
    }, null, null),
    "min": new DefinedFunction(-1, function(param, loc){
        var par = param;    // 引数のArray
        if(par.length == 1 && par[0].getValue() instanceof ArrayValue) par = par[0].getValue().getJSValue();
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
                    if(val.getJSValue() < min_val.getJSValue()) min_val = val;
                }
                else
                {
                    if(Number(val.getJSValue()) < min_val.getJSValue())
                    {
                        min_val = new FloatValue([Number(val.getJSValue())], loc, Number(val.getJSValue()));
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
                    if(val.getJSValue() < min_val.getJSValue())
                        min_val = new FloatValue([Number(val.getJSValue())], loc, Number(val.getJSValue()));
                }
            }
            else throw new RuntimeError(loc.first_line, '引数は数値のリストです');
        }
        return min_val;
    }, null, null),
    "median": new DefinedFunction(-1, function(param, loc){
        var par = param;    // 引数のArray
        if(par.length == 1 && par[0].getValue() instanceof ArrayValue) par = param[0].getValue().getJSValue();
        var nums = [];
        for(let i = 0; i < par.length; i++) nums.push(Number(par[i].getJSValue()));
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
    "comb": new DefinedFunction(2, function(param, loc){
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
    "perm": new DefinedFunction(2, function(param, loc){
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
    "pvariance": new DefinedFunction(-1, function(param, loc){
        var par = param;    // 引数のArray
        if(param.length == 1 && param[0].getValue() instanceof ArrayValue) par = param[0].getValue().getJSValue();
        var mean = functions["average"].func(par, loc).getJSValue();
        var sum = 0.0; 
        if(par.length == 0) throw new RuntimeError(loc.first_line, "空のリストでは分散は計算できません");
        for(let i = 0; i < par.length; i++)
            if(par[i] instanceof IntValue || par[i] instanceof FloatValue)
                sum += (Number(par[i].getJSValue()) - mean) ** 2;
            else throw new RuntimeError(loc.first_line, "引数は数値のリストでなくてはいけません");
        return new FloatValue([sum / par.length], loc, sum / par.length);
    }, null, null),
    "variance": new DefinedFunction(-1, function(param, loc){
        var par = param;    // 引数のArray
        if(param.length == 1 && param[0].getValue() instanceof ArrayValue) par = param[0].getValue().getJSValue();
        var mean = functions["average"].func(par, loc).getJSValue();
        var sum = 0.0; 
        if(par.length < 2) throw new RuntimeError(loc.first_line, "長さ2未満のリストでは分散は計算できません");
        for(let i = 0; i < par.length; i++)
            if(par[i] instanceof IntValue || par[i] instanceof FloatValue)
                sum += (Number(par[i].getJSValue()) - mean) ** 2;
            else throw new RuntimeError(loc.first_line, "引数は数値のリストでなくてはいけません");
        return new FloatValue([sum / (par.length - 1)], loc, sum / (par.length - 1));
    }, null, null),
    "pstdev": new DefinedFunction(-1, function(param, loc){
        var s = functions["pvariance"].func(param, loc).getValue().getJSValue();
        return new FloatValue([Math.sqrt(s)], loc, Math.sqrt(s));
    }, null, null),
    "stdev": new DefinedFunction(-1, function(param, loc){
        var s = functions["variance"].func(param, loc).getValue().getJSValue();
        return new FloatValue([Math.sqrt(s)], loc, Math.sqrt(s));
    }, null, null),
    "pcovariance": new DefinedFunction(2, function(param, loc){
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
    "covariance": new DefinedFunction(2, function(param, loc){
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
    "correl": new DefinedFunction(2, function(param, loc){
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
    "gcd": new DefinedFunction(2, function(param, loc){
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
    "lcm": new DefinedFunction(2, function(param, loc){
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
    "chr": new DefinedFunction(1, function(param, loc){
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
    "ord": new DefinedFunction(1, function(param, loc){
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
    "linear_regression": new DefinedFunction(2, function(param, loc){
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
    "reverse": new DefinedFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof ArrayValue)
        {
            for(let i = 0, j = par1.valueLength() - 1; i < j; i++, j--)
            {
                var temp = par1.getValue(i);
                par1.setValue(i, par1.getValue(j));
                par1.setValue(j, temp);
            }
            return par1;
        }
        else throw new RuntimeError(loc.first_line, "引数は配列でなくてはいけません");
    }, null, null),
    "reversed": new DefinedFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof ArrayValue)
        {
            var arr = [];
            for(let i = par1.value.length - 1; i >= 0; i--) arr.push(par1.value[i]);
            return new ArrayValue(arr, loc);
        }
        else throw new RuntimeError(loc.first_line, "引数は配列でなくてはいけません");
    }, null, null),
    "sorted": new DefinedFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof ArrayValue)
        {
            var arr = [].concat(par1.value);
            arr.sort(function(a, b){
                if(a instanceof IntValue && b instanceof IntValue)
                    return (a.value < b.value) ? -1 : (a.value > b.value) ? 1 : 0;
                else
                {
                    var va = (a instanceof IntValue || a instanceof FloatValue) ? Number(a.value) : NaN;
                    var vb = (b instanceof IntValue || b instanceof FloatValue) ? Number(b.value) : NaN;
                    if(!isNaN(va) && !isNaN(vb))
                        return (va < vb) ? -1 : (va > vb) ? 1 : 0;
                    else
                    {
                        var sa = a.toString();
                        var sb = b.toString();
                        return (sa < sb) ? -1 : (sa > sb) ? 1 : 0;
                    }
                }
            });
            return new ArrayValue(arr, loc);
        }
        else throw new RuntimeError(loc.first_line, "引数は配列でなくてはいけません");
    }, null, null),
    "sort": new DefinedFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof ArrayValue)
        {
            par1.value.sort(function(a, b){
                if(a instanceof IntValue && b instanceof IntValue)
                    return (a.value < b.value) ? -1 : (a.value > b.value) ? 1 : 0;
                else
                {
                    var va = (a instanceof IntValue || a instanceof FloatValue) ? Number(a.value) : NaN;
                    var vb = (b instanceof IntValue || b instanceof FloatValue) ? Number(b.value) : NaN;
                    if(!isNaN(va) && !isNaN(vb))
                        return (va < vb) ? -1 : (va > vb) ? 1 : 0;
                    else
                    {
                        var sa = a.toString();
                        var sb = b.toString();
                        return (sa < sb) ? -1 : (sa > sb) ? 1 : 0;
                    }
                }
            });
            return par1;
        }
        else throw new RuntimeError(loc.first_line, "引数は配列でなくてはいけません");
    }, null, null),
    "shuffled": new DefinedFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof ArrayValue)
        {
            var arr = [].concat(par1.value);
            for(let i = arr.length - 1; i > 0; i--)
            {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
            return new ArrayValue(arr, loc);
        }
        else throw new RuntimeError(loc.first_line, "引数は配列でなくてはいけません");
    }, null, null),
    "shuffle": new DefinedFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof ArrayValue)
        {
            for(let i = par1.valueLength() - 1; i > 0; i--)
            {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = par1.getValue(i);
                par1.setValue(i, par1.getValue(j));
                par1.setValue(j, temp);
            }
            return par1;
        }
        else throw new RuntimeError(loc.first_line, "引数は配列でなくてはいけません");
    }, null, null),
    "next_permutation": new DefinedFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof ArrayValue)
        {
            var arr = [].concat(par1._value);
            var i = arr.length - 2;
            while(i >= 0 && arr[i].value >= arr[i + 1].value) i--;
            if(i < 0) {
                return new ArrayValue([], loc);
            }
            var j = arr.length - 1;
            while(i < j && arr[i].value >= arr[j].value) j--;
            // arr[i]とarr[j]を交換
            var temp = arr[i].value;
            arr[i].value = arr[j].value;
            arr[j].value = temp;
            // arr[i+1]以降を反転
            var left = i + 1, right = arr.length - 1;
            while(left < right)
            {
                var temp2 = arr[left].value;
                arr[left].value = arr[right].value;
                arr[right].value = temp2;
                left++;
                right--;
            }
            return new ArrayValue(arr, loc, arr);
        }
        else throw new RuntimeError(loc.first_line, "引数は配列でなくてはいけません");
    }, null, null),
    "dnorm": new DefinedFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof IntValue || par1 instanceof FloatValue)
        {
            var x = Number(par1.getJSValue());
            var res = dnorm(x);
            return new FloatValue([res], loc, res);
        }
        else throw new RuntimeError(loc.first_line, "引数は数値でなくてはいけません");
    }, null, null),
    "pnorm": new DefinedFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof IntValue || par1 instanceof FloatValue)
        {
            var x = Number(par1.getJSValue());
            var res = pnorm(x);
            return new FloatValue([res], loc, res);
        }
        else throw new RuntimeError(loc.first_line, "引数は数値でなくてはいけません");
    }, null, null),
    "qnorm": new DefinedFunction(1, function(param, loc){
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

for(var f in functions){
    definedFunction[f] = functions[f];
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

definedFunction["mean"] = definedFunction["average"];