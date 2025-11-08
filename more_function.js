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
    "sum": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof ArrayValue)
		{
            var sum = BigInt(0);
            var int_flag = true;
            for(let i = 0; i < par1.value.length; i++)
            {

                if(par1.value[i] instanceof IntValue)
                {
                    if(int_flag) sum += par1.value[i].value;
                    else sum += Number(par1.value[i].value);
                }
                else if(par1.value[i] instanceof FloatValue)
                {
                    if(int_flag)
                    {
                        sum = Number(sum);
                        int_flag = false;
                    }
                    sum += par1.value[i].value;
                }
                else throw new RuntimeError(loc.first_line, '引数は数値の配列です');
            }
            if(int_flag) return new IntValue(sum, this.loc);
            else return new FloatValue(sum, this.loc);
		}
		else throw new RuntimeError(loc.first_line, '引数は数値の配列です');
	}, null, null),
    "product": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof ArrayValue)
		{
            var product = BigInt(1);
            var int_flag = true;
            for(let i = 0; i < par1.value.length; i++)
            {

                if(par1.value[i] instanceof IntValue)
                {
                    if(int_flag) product *= par1.value[i].value;
                    else product *= Number(par1.value[i].value);
                }
                else if(par1.value[i] instanceof FloatValue)
                {
                    if(int_flag)
                    {
                        product = Number(product);
                        int_flag = false;
                    }
                    product *= par1.value[i].value;
                }
                else throw new RuntimeError(loc.first_line, '引数は数値の配列です');
            }
            if(int_flag) return new IntValue(product, this.loc);
            else return new FloatValue(product, this.loc);
		}
		else throw new RuntimeError(loc.first_line, '引数は数値の配列です');
	}, null, null),
    "average": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof ArrayValue)
		{
            var sum = functions["sum"].func(param, loc).getValue().value;
            if(par1.value.length == 0) throw new RuntimeError(loc.first_line, '引数の配列は空であってはいけません');
            return new FloatValue(Number(sum) / par1.value.length, this.loc);
		}
		else throw new RuntimeError(loc.first_line, '引数は数値の配列です');
	}, null, null),
    "average": new DefinedFunction(1, function(param, loc){
		var par1 = param[0].getValue();
		if(par1 instanceof ArrayValue)
		{
            var sum = functions["sum"].func(param, loc).getValue().value;
            if(par1.value.length == 0) throw new RuntimeError(loc.first_line, '引数の配列は空であってはいけません');
            return new FloatValue(Number(sum) / par1.value.length, this.loc);
		}
		else throw new RuntimeError(loc.first_line, '引数は数値の配列です');
	}, null, null),


};


for(var f in functions){
    definedFunction[f] = functions[f];
}

/*
ascii
bin
bool
float
format
hex
int
max
min
oct
ord
reversed
round
sorted
str

---math---
factorial
gcd
lcm
perm
comb
ceil
fabs
floor
fma
fmod
modf
remainder
trunc
cbrt
sqrt
exp
log
sinh, cosh, tanh
acosh, asinh, atanh
erf,gamma
pi
e
tau
*/