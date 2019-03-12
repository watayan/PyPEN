function var_declaration()
{
    var message=["宣言されていない変数を使うとエラーになる。",
                 "宣言されていない変数を使うと，その時点で変数が生成される。"];
    document.write(message[setting.var_declaration]);
}

function array_origin()
{
    var message=["a[0]〜a[n]",
                 "a[0]〜a[n-1]",
                 "a[1]〜a[n]"];
    document.write(message[setting.array_origin]);
}

function a6()
{
    var message=["{0,1,2,3,4,5,6}",
                 "{0,1,2,3,4,5}",
                 "{1,2,3,4,5,6}"];
    document.write(message[setting.array_origin]);
}

function div_mode()
{
    var message=["／と÷は同じで，余りを切り捨てる。",
                 "／は普通の割り算だが，÷は余りを切り捨てる。"];
    document.write(message[setting.div_mode]);
}

