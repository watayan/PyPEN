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
            else return new IntValue(par1.value, loc);
        }
        else if(par1 instanceof FloatValue) return new FloatValue(Math.abs(par1.value), loc);
        else throw new RuntimeError(loc.first_line, '引数は数値でなければなりません');
    }, null, null),
    "all": new DefinedFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof ArrayValue)
        {
            for(let i = 0; i < par1.value.length; i++)
            {
                if(par1.value[i] instanceof IntValue)
                {
                    if(par1.value[i].value == BigInt(0)) return new BooleanValue(false, loc);
                }
                else if(par1.value[i] instanceof FloatValue)
                {
                    if(par1.value[i].value == 0.0) return new BooleanValue(false, loc);
                }
                else if(par1.value[i] instanceof BooleanValue)
                {
                    if(!par1.value[i].value) return new BooleanValue(false, loc);
                }
                else throw new RuntimeError(loc.first_line, '引数は数値の配列です');
            }
            return new BooleanValue(true, loc);
        }
        else throw new RuntimeError(loc.first_line, '引数は数値の配列です');
    }, null, null),
    "any": new DefinedFunction(1, function(param, loc){
        var par1 = param[0].getValue();
        if(par1 instanceof ArrayValue)
        {
            for(let i = 0; i < par1.value.length; i++)
            {
                if(par1.value[i] instanceof IntValue)
                {
                    if(par1.value[i].value != BigInt(0)) return new BooleanValue(true, loc);
                }
                else if(par1.value[i] instanceof FloatValue)
                {
                    if(par1.value[i].value != 0.0) return new BooleanValue(true, loc);
                }
                else if(par1.value[i] instanceof BooleanValue)
                {
                    if(par1.value[i].value) return new BooleanValue(true, loc);
                }
                else throw new RuntimeError(loc.first_line, '引数は数値の配列です');
            }
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
    "next_permutation": new DefinedFunction(1, function(param, loc){
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


};


var steps = {

};

for(var f in functions){
    definedFunction[f] = functions[f];
}

for(var s in steps){
    definedStep[s] = steps[s];
}
