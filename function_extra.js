var functions = {
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
}

functions["mean"] = functions["average"];

for(var key in functions) builtin_functions[key] = functions[key];