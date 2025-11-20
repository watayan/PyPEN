	/**
	 * @constructor of DefinedFunction
	 * @param {number} argc 引数の個数
	 * @param {function} func 実際の関数
	 * @param {string} module Pythonで必要となるモジュール。nullならナニもいらない
	 * @param {function} convert this.argcを受け取ってPythonコードの文字列を返す関数。nullならthis.funcName(this.argc)的なことをする。
	 */

var functions = {
    "abs": new DefinedFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof IntValue)
        {
            if(par1.value >= BigInt(0)) return new IntValue(par1.value, loc);
            else return new IntValue(-par1.value, loc);
        }
        else if(par1 instanceof FloatValue) return new FloatValue(Math.abs(par1.value), loc);
        else throw new RuntimeError(loc.first_line, '引数は数値でなければなりません');
    }, null, null),
    "all": new DefinedFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof ArrayValue)
        {
            for(let i = 0; i < par1.value.length; i++)
                if(!toBool(par1.value[i], loc)) return new BooleanValue(false, loc);
            return new BooleanValue(true, loc);
        }
        else throw new RuntimeError(loc.first_line, '引数は数値の配列です');
    }, null, null),
    "any": new DefinedFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof ArrayValue)
        {
            for(let i = 0; i < par1.value.length; i++)
                if(toBool(par1.value[i], loc)) return new BooleanValue(true, loc);
            return new BooleanValue(false, loc);
        }
        else throw new RuntimeError(loc.first_line, '引数は数値の配列です');
    }, null, null),
    "sum": new DefinedFunction(-1, function(param, loc){
        var par;    // 引数のArray
        if(param.length == 1 && param[0].getValue() instanceof ArrayValue)
            par = param[0].getValue().value;
        else
            par = param;
        var sum = BigInt(0);
        var int_flag = true;
        for(let i = 0; i < par.length; i++)
        {
            if(par[i] instanceof IntValue)
            {
                if(int_flag) sum += par[i].value;
                else sum += Number(par[i].value);
            }
            else if(par[i] instanceof FloatValue)
            {
                if(int_flag)
                {
                    sum = Number(sum);
                    int_flag = false;
                }
                sum += par[i].value;
            }
            else throw new RuntimeError(loc.first_line, '引数は数値のリストです');
        }
        if(int_flag) return new IntValue(sum, this.loc);
        else return new FloatValue(sum, this.loc);
	}, null, null),
    "prod": new DefinedFunction(-1, function(param, loc){
        var par;    // 引数のArray
        if(param.length == 1 && param[0].getValue() instanceof ArrayValue)
            par = param[0].getValue().value;
        else
            par = param;
        var prod = BigInt(1);
        var int_flag = true;
        for(let i = 0; i < par.length; i++)
        {
            if(par[i] instanceof IntValue)
            {
                if(int_flag) prod *= par[i].value;
                else prod *= Number(par[i].value);
            }
            else if(par[i] instanceof FloatValue)
            {
                if(int_flag)
                {
                    prod = Number(prod);
                    int_flag = false;
                }
                prod *= par[i].value;
            }
            else throw new RuntimeError(loc.first_line, '引数は数値のリストです');
        }
        if(int_flag) return new IntValue(prod, this.loc);
        else return new FloatValue(prod, this.loc);
    	}, null, null),
    "sumprod": new DefinedFunction(2, function(param, loc){
        var par1 = param[0].getValue();
        var par2 = param[1].getValue();
        if(!(par1 instanceof ArrayValue) || !(par2 instanceof ArrayValue))
            throw new RuntimeError(loc.first_line, '引数は数値の配列です');
        if(par1.value.length != par2.value.length)
            throw new RuntimeError(loc.first_line, '引数の配列の長さが違います');
        var sumprod = BigInt(0);
        var int_flag = true;
        for(let i = 0; i < par1.value.length; i++)
        {
            var v1 = par1.getElement(i);
            var v2 = par2.getElement(i);
            if(v1 instanceof IntValue && v2 instanceof IntValue)
            {
                if(int_flag) sumprod += v1.value * v2.value;
                else sumprod += Number(v1.value) * Number(v2.value);
            }
            else if((v1 instanceof IntValue || v1 instanceof FloatValue) &&
                    (v2 instanceof IntValue || v2 instanceof FloatValue))
            {
                int_flag = false;
                sumprod += Number(v1.value) * Number(v2.value);
            }
            else throw new RuntimeError(loc.first_line, '引数は数値の配列です');
        }
        if(int_flag) return new IntValue(sumprod, this.loc);
        else return new FloatValue(sumprod, this.loc);
	}, null, null),
    "average": new DefinedFunction(-1, function(param, loc){
        var par;    // 引数のArray
        if(param.length == 1 && param[0].getValue() instanceof ArrayValue)
            par = param[0].getValue().value;
        else
            par = param;
            var sum = functions["sum"].func(param, loc).getValue().value;
            if(par.length == 0) throw new RuntimeError(loc.first_line, '引数の配列は空であってはいけません');
            return new FloatValue(Number(sum) / par.length, this.loc);
	}, null, null),
    "factorial": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue && par1.value >= BigInt(0))
		{
            var p = BigInt(1);
            for(let i = BigInt(2); i <= par1.value; i++) p *= i;
            return new IntValue(p, this.loc);
		}
		else throw new RuntimeError(loc.first_line, '引数は非負整数です');
	}, null, null),
	"swap": new DefinedFunction(2, function(param, loc){
		var par1 = param[0], par2 = param[1];
		if(par1 instanceof Variable && par2 instanceof Variable)
		{
			var vt1 = findVarTable(par1.varname);
			var vt2 = findVarTable(par2.varname);
			var val1 = getValueByArgs(vt1.vars[par1.varname], par1.args ? par1.args.value : null, loc);
			var val2 = getValueByArgs(vt2.vars[par2.varname], par2.args ? par2.args.value : null, loc);
			setVariableByArgs(vt1, par1.varname, par1.args ? par1.args.value : null, val2.getValue(), loc);
			setVariableByArgs(vt2, par2.varname, par2.args ? par2.args.value : null, val1.getValue(), loc);
			return new NullValue(loc);
		}
		else throw new RuntimeError(loc.first_line, "swapの引数は変数にしてください");
	},null, function(argc){
		return argc[0] + ", " + argc[1] + " = " + argc[1] + ", " + argc[0];
	}),
    "max": new DefinedFunction(-1, function(param, loc){
        var par;    // 引数のArray
        if(param.length == 1 && param[0].getValue() instanceof ArrayValue)
            par = param[0].getValue().value;
        else
            par = param;
        var max_val = null, val_type = 0; // 0:未定義, 1:Int, 2:Float
        for(let i = 0; i < par.length; i++)
        {
            var val = par[i];
            if(val instanceof IntValue)
            {
                if(val_type == 0) 
                {
                    max_val = val.value;
                    val_type = 1;
                }
                else if(val_type == 1)
                {
                    if(val.value > max_val) max_val = val.value;
                }
                else
                {
                    if(Number(val.value) > max_val) max_val = Number(val.value);
                }
            }
            else if(val instanceof FloatValue)
            {
                val_type = 2;
                if(val_type == 0) max_val = val.value;
                else
                {
                    if(val.value > max_val) max_val = val.value;
                }
            }
            else throw new RuntimeError(loc.first_line, '引数は数値のリストです');
        }
        if(val_type == 1) return new IntValue(max_val, this.loc);
        else if(val_type == 2) return new FloatValue(max_val, this.loc);
        else return new NullValue(this.loc);
    }, null, null),
    "min": new DefinedFunction(-1, function(param, loc){
        var par;    // 引数のArray
        if(param.length == 1 && param[0].getValue() instanceof ArrayValue) par = param[0].getValue().value;
        else par = param;
        var min_val = null, val_type = 0; // 0:未定義, 1:Int, 2:Float
        for(let i = 0; i < par.length; i++)
        {
            var val = par[i];
            if(val instanceof IntValue)
            {
                if(val_type == 0) 
                {
                    min_val = val.value;
                    val_type = 1;
                }
                else if(val_type == 1)
                {
                    if(val.value < min_val) min_val = val.value;
                }
                else
                {
                    if(Number(val.value) < min_val) min_val = Number(val.value);
                }
            }
            else if(val instanceof FloatValue)
            {
                val_type = 2;
                if(val_type == 0) min_val = val.value;
                else
                {
                    if(val.value < min_val) min_val = val.value;
                }
            }
            else throw new RuntimeError(loc.first_line, '引数は数値のリストです');
        }
        if(val_type == 1) return new IntValue(min_val, this.loc);
        else if(val_type == 2) return new FloatValue(min_val, this.loc);
        else return new NullValue(this.loc);
    }, null, null),
    "median": new DefinedFunction(-1, function(param, loc){
        var par;    // 引数のArray
        if(param.length == 1 && param[0].getValue() instanceof ArrayValue) par = param[0].getValue().value;
        else par = param;
        var nums = [];
        for(let i = 0; i < par.length; i++) nums.push(Number(par[i].getValue().value));
        nums.sort(function(a, b){return a - b;});
        if(nums.length == 0) return new NullValue(loc);
        else if(nums.length % 2 == 1){
            var median = nums[(nums.length - 1) / 2];
            return new FloatValue(median, loc);
        }
        else{
            var median = (nums[nums.length / 2 - 1] + nums[nums.length / 2]) / 2;
            return new FloatValue(median, loc);
        }
    }, null, null),
    "comb": new DefinedFunction(2, function(param, loc){
        var par1 = param[0].getValue();
        var par2 = param[1].getValue(); 
        if(par1 instanceof IntValue && par2 instanceof IntValue &&
           par1.value >= BigInt(0) && par2.value >= BigInt(0) && par1.value >= par2.value)
        {
            var n = par1.value;
            var r = par2.value;
            if(r > n - r) r = n - r;
            var p = BigInt(1);
            for(let i = BigInt(0); i < r; i++) p *= (n - i);
            for(let i = BigInt(0); i < r; i++) p /= (i + BigInt(1));
            return new IntValue(p, loc);
        }
        else throw new RuntimeError(loc.first_line, '引数は非負整数で、1つ目の引数は2つ目の引数以上でなければなりません');
    }, null, null),
    "perm": new DefinedFunction(2, function(param, loc){
        var par1 = param[0].getValue();
        var par2 = param[1].getValue(); 
        if(par1 instanceof IntValue && par2 instanceof IntValue &&
           par1.value >= BigInt(0) && par2.value >= BigInt(0) && par1.value >= par2.value)
        {
            var n = par1.value;
            var r = par2.value;
            var p = BigInt(1);
            for(let i = BigInt(0); i < r; i++) p *= (n - i);
            return new IntValue(p, loc);
        }
        else throw new RuntimeError(loc.first_line, '引数は非負整数で、1つ目の引数は2つ目の引数以上でなければなりません');
    }, null, null),
    "pvariance": new DefinedFunction(-1, function(param, loc){
        var par;    // 引数のArray
        if(param.length == 1 && param[0].getValue() instanceof ArrayValue) par = param[0].getValue().value;
        else par = param;
        var mean = functions["average"].func(par, loc).getValue().value;
        var sum = 0.0; 
        if(par.length == 0) throw new RuntimeError(loc.first_line, "空のリストでは分散は計算できません");
        for(let i = 0; i < par.length; i++)
            if(par[i] instanceof IntValue || par[i] instanceof FloatValue)
                sum += (Number(par[i].getValue().value) - mean) ** 2;
            else throw new RuntimeError(loc.first_line, "引数は数値のリストでなくてはいけません");
        return new FloatValue(sum / par.length, loc);
    }, null, null),
    "variance": new DefinedFunction(-1, function(param, loc){
        var par;    // 引数のArray
        if(param.length == 1 && param[0].getValue() instanceof ArrayValue) par = param[0].getValue().value;
        else par = param;
        var mean = functions["average"].func(par, loc).getValue().value;
        var sum = 0.0;
        if(par.length < 2) throw new RuntimeError(loc.first_line, "長さ2未満のリストでは分散は計算できません");
        for(let i = 0; i < par.length; i++)
            if(par[i] instanceof IntValue || par[i] instanceof FloatValue)
                sum += (Number(par[i].value) - mean) ** 2;
            else throw new RuntimeError(loc.first_line, "引数は数値のリストでなくてはいけません");
        return new FloatValue(sum / (par.length - 1), loc);
    }, null, null),
    "pstdev": new DefinedFunction(-1, function(param, loc){
        var s = functions["pvariance"].func(param, loc).getValue().value;
        return new FloatValue(Math.sqrt(s), loc);
    }, null, null),
    "stdev": new DefinedFunction(-1, function(param, loc){
        var s = functions["variance"].func(param, loc).getValue().value;
        return new FloatValue(Math.sqrt(s), loc);
    }, null, null),
    "pcovariance": new DefinedFunction(2, function(param, loc){
        var par1 = param[0].getValue();
        var par2 = param[1].getValue();
        if(par1 instanceof ArrayValue && par2 instanceof ArrayValue && par1.value.length == par2.value.length)
        {
            var n = par1.value.length;
            if(n == 0) throw new RuntimeError(loc.first_line, "空のリストでは共分散が計算できません");
            var s = 0.0;
            var m1 = functions["average"].func(par1.value, loc).getValue().value,
                m2 = functions["average"].func(par2.value, loc).getValue().value;
            for(let i = 0; i < n; i++)
            {
                var val1, val2;
                if(par1.value[i] instanceof IntValue || par1.value[i] instanceof FloatValue)
                    val1 = Number(par1.value[i].getValue().value);
                else throw new RuntimeError(loc.first_line, "数値のリストである必要があります");
                if(par2.value[i] instanceof IntValue || par2.value[i] instanceof FloatValue)
                    val2 = Number(par2.value[i].getValue().value);
                else throw new RuntimeError(loc.first_line, "数値のリストである必要があります");
                s += (val1 - m1) * (val2 - m2);
            }
            return new FloatValue(s / n, loc);
        }
        else throw new RuntimeError(loc.first_line, "引数は2つの長さが等しい数値のリストでなくてはいけません");
    }, null, null),
    "covariance": new DefinedFunction(2, function(param, loc){
        var par1 = param[0].getValue();
        var par2 = param[1].getValue();
        if(par1 instanceof ArrayValue && par2 instanceof ArrayValue && par1.value.length == par2.value.length)
        {
            var n = par1.value.length;
            if(n < 1) throw new RuntimeError(loc.first_line, "長さ2未満のリストでは共分散が計算できません");
            var s = 0.0;
            var m1 = functions["average"].func(par1.value, loc).getValue().value,
                m2 = functions["average"].func(par2.value, loc).getValue().value;
            for(let i = 0; i < n; i++)
            {
                var val1, val2;
                if(par1.value[i] instanceof IntValue || par1.value[i] instanceof FloatValue)
                    val1 = Number(par1.value[i].getValue().value);
                else throw new RuntimeError(loc.first_line, "数値のリストである必要があります");
                if(par2.value[i] instanceof IntValue || par2.value[i] instanceof FloatValue)
                    val2 = Number(par2.value[i].getValue().value);
                else throw new RuntimeError(loc.first_line, "数値のリストである必要があります");
                s += (val1 - m1) * (val2 - m2);
            }
            return new FloatValue(s / (n - 1), loc);
        }
        else throw new RuntimeError(loc.first_line, "引数は2つの長さが等しい数値のリストでなくてはいけません");
    }, null, null),
    "correl": new DefinedFunction(2, function(param, loc){
        var par1 = param[0].getValue();
        var par2 = param[1].getValue();
        if(par1 instanceof ArrayValue && par2 instanceof ArrayValue && par1.value.length == par2.value.length)
        {
            var c = functions["pcovariance"].func([par1, par2], loc).getValue().value;
            var s1 = functions["pstdev"].func(par1.value, loc).getValue().value;
            var s2 = functions["pstdev"].func(par2.value, loc).getValue().value;
            if(s1 == 0.0 || s2 == 0.0) throw new RuntimeError(loc.first_line, "標準偏差が0なので相関係数が計算できません");
            return new FloatValue(c / s1 / s2, loc);
            }
        else throw new RuntimeError(loc.first_line, "引数は2つの長さが等しい数値のリストでなくてはいけません");
    }, null, null),
    "gcd": new DefinedFunction(2, function(param, loc){
        var par1 = param[0].getValue();
        var par2 = param[1].getValue();
        if(par1 instanceof IntValue && par2 instanceof IntValue)
        {
            var a = par1.value >= BigInt(0) ? par1.value : -par1.value;
            var b = par2.value >= BigInt(0) ? par2.value : -par2.value;
            var g = gcd(a, b);
            return new IntValue(g, loc);
        }
        else throw new RuntimeError(loc.first_line, "引数は整数でなくてはいけません");
    }, null, null),
    "lcm": new DefinedFunction(2, function(param, loc){
        var par1 = param[0].getValue();
        var par2 = param[1].getValue();
        if(par1 instanceof IntValue && par2 instanceof IntValue)
        {
            var a = par1.value >= BigInt(0) ? par1.value : -par1.value;
            var b = par2.value >= BigInt(0) ? par2.value : -par2.value;
            if(a == BigInt(0) || b == BigInt(0)) return new IntValue(BigInt(0), loc);
            var g = gcd(a, b);
            var l = (a / g) * b;
            return new IntValue(l, loc);
        }
        else throw new RuntimeError(loc.first_line, "引数は整数でなくてはいけません");
    }, null, null),
    "chr": new DefinedFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof IntValue)
        {
            var code = Number(par1.value);
            if(code < 0 || code > 0x10FFFF)
                throw new RuntimeError(loc.first_line, "引数の値が不正です");
            return new StringValue(String.fromCodePoint(code), loc);
        }
        else throw new RuntimeError(loc.first_line, "引数は整数でなくてはいけません");
    }, null, null),
    "ord": new DefinedFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof StringValue)
        {
            var s = par1.value;
            if(s.length == 0)
                throw new RuntimeError(loc.first_line, "空文字列のordは定義されていません");
            var code = s.codePointAt(0);
            return new IntValue(BigInt(code), loc);
        }
        else throw new RuntimeError(loc.first_line, "引数は文字列でなくてはいけません");
    }, null, null),
    "linear_regression": new DefinedFunction(2, function(param, loc){
        var par1 = param[0].getValue();
        var par2 = param[1].getValue();
        if(par1 instanceof ArrayValue && par2 instanceof ArrayValue && par1.value.length == par2.value.length)
        {
            var n = par1.value.length;
            if(n < 2) throw new RuntimeError(loc.first_line, "長さ2未満のリストでは線形回帰は計算できません");
            var sum_x = 0.0, sum_y = 0.0, sum_xy = 0.0, sum_x2 = 0.0;
            for(let i = 0; i < n; i++)
            {
                var x, y;
                if(par1.value[i] instanceof IntValue || par1.value[i] instanceof FloatValue)
                    x = Number(par1.value[i].getValue().value);
                else throw new RuntimeError(loc.first_line, "数値のリストである必要があります");
                if(par2.value[i] instanceof IntValue || par2.value[i] instanceof FloatValue)
                    y = Number(par2.value[i].getValue().value);
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
            return new ArrayValue([new FloatValue(slope, loc), new FloatValue(intercept, loc)], loc);
        }
        else throw new RuntimeError(loc.first_line, "引数は2つの長さが等しい数値のリストでなくてはいけません");
    }, null, null),
    "reverse": new DefinedFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof ArrayValue)
        {
            for(let i = 0, j = par1.value.length - 1; i < j; i++, j--)
            {
                var temp = par1.value[i];
                par1.value[i] = par1.value[j];
                par1.value[j] = temp;
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
            for(let i = par1.value.length - 1; i > 0; i--)
            {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = par1.value[i];
                par1.value[i] = par1.value[j];
                par1.value[j] = temp;
            }
            return par1;
        }
        else throw new RuntimeError(loc.first_line, "引数は配列でなくてはいけません");
    }, null, null),
    "next_permutation": new DefinedFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof ArrayValue)
        {
            var arr = [].concat(par1.value);
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
            return new ArrayValue(arr, loc);
        }
        else throw new RuntimeError(loc.first_line, "引数は配列でなくてはいけません");
    }, null, null),
};  

for(var f in functions){
    definedFunction[f] = functions[f];
}

function gcd(a, b)
{
    if(b == BigInt(0)) return a;
    else return gcd(b, a % b);
}

definedFunction["mean"] = definedFunction["average"];