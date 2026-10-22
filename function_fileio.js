var functions = {

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
};

var storage = localStorage;

class FileIO {
    constructor()
    {
        this.clear();
    }
    clear()
    {
        this.files = [];
    }
    all_close()
    {
        for(var i = 0; i < this.files.length; i++)
        {
            try{
                if(this.files[n].mode == "r") this.close(i);
            }
            catch(e)
            {
                return false;
            }
            this.files[n] = null;
        }
        return true;
    }
    openr(filename)
    {
        var value = storage.getItem(filename);
        if(value)
        {
            this.files.push({
                "name": filename,
                "val" : value,
                "pos" : 0,
                "mode": "r"
            });
            return this.files.length - 1;
        }
        return -1;
    }
    openw(filename)
    {
        this.files.push({
            "name": filename,
            "val" : "",
            "pos" : 0,
            "mode": "w"
        });
        return this.files.length - 1;
    }
    opena(filename)
    {
        var value = storage.getItem(filename);
        var str = value ? value : "";
        this.files.push({
            "name": filename,
            "val" : str,
            "pos" : str.length,
            "mode": "w"
        });
        return this.files.length - 1;
    }
    close(n)
    {
        if(n >= 0 && n < this.files.length)
        {
            if(this.files[n])
            {
                if(this.files[n].mode == "w")
                {
                    try{
                        storage.setItem(this.files[n].name, this.files[n].val);
                    }
                    catch(e)
                    {
                        this.files[n] = null;
                        return false;
                    }
                }
            }
            this.files[n] = null;
            return true;
        }
        else return false;
    }
    read_line(n)
    {
        if(n < 0 || n >= this.files.length || this.files[n] == null) return null;
        if(this.files[n].pos >= this.files[n].val.length) return "";
        var re = /([^\r\n]*)(\r\n|\r|\n)/;
        var substr = this.files[n].val.substring(this.files[n].pos)
        var res = re.exec(substr);
        if(res)
        {
            this.files[n].pos += res[1].length + res[2].length;
            return res[0];
        }
        else{
            this.files[n].pos += substr.length;
            return substr;
        }
    }
    read_ch(n)
    {
        if(n < 0 || n >= this.files.length || this.files[n] == null) return null;
        if(this.files[n].pos >= this.files[n].val.length) return "";
        return this.files[n].val[this.files[n].pos++];
    }
    write_str(n, str, newline)
    {
        if(n < 0 || n >= this.files.length || this.files[n] == null) return false;
        if(this.files[n].mode == "w")
        {
            this.files[n].val += str + (newline ? "\n" : "");
            return true;
        }
        else return false;
    }
};

document.getElementById("storage_download").onclick = function(ev)
{
	var element = document.getElementById("storage_download");
	var list = document.getElementById("storage_list");
	var n = list.options.selectedIndex;
	if(n >= 0 && n < storage.length)
	{
		var filename = list.options[n].value;
		var str = storage.getItem(filename);
		var blob = new Blob([str], {type:"text/plain"});
		if(window.navigator.msSaveBlob)
		{
			window.navigator.msSaveBlob(blob, filename);
		}
		else
		{
			window.URL = window.URL || window.webkitURL;
			element.setAttribute("href", window.URL.createObjectURL(blob));
			element.setAttribute("download", filename);
		}
	}
	else
	{
		element.removeAttribute("href");
	}
};


document.getElementById("storage_upload1").onclick = function(ev){
	document.getElementById("storage_upload").click();
	return false;
}

document.getElementById("storage_upload").addEventListener("change", function(ev){
	var file = ev.target.files;
	var reader = new FileReader();
	reader.readAsText(file[0], "UTF-8");
	reader.onload = function(ev)
	{
		var data = reader.result;
		try{
			storage.setItem(file[0].name,data);
			storage_list_update();
		}
		catch(e)
		{
			window.alert("ストレージに保存できませんでした");
		}
	}
});

document.getElementById("storage_remove").onclick = function(ev)
{
	var list = document.getElementById("storage_list");
	var n = list.options.selectedIndex;
	if(n >= 0)
	{
		var key = list.options[n].value;
		storage.removeItem(key);
		storage_list_update();	
	}
};

document.getElementById("storage_clear").onclick = function(ev)
{
	if(window.confirm("ストレージを空にしていいですか？"))
	{
		storage.clear();
		storage_list_update();	
	}
};

function storage_list_update()
{
	var list = document.getElementById("storage_list");
	while(list.options.length) list.options.remove(0);
	var n = storage.length;
	if(n > 0)
	{
		for(var i = 0; i < n; i++)
		{
			var option = document.createElement("option");
			option.text = option.value = storage.key(i);
			list.appendChild(option);
		}
	}
	else
	{
		var option = document.createElement("option");
		option.text = "--空--";
		// option.attributes.add("disabled");
		list.appendChild(option);
	}
}

var filesystem = new FileIO();

function reset_fileio()
{
	filesystem.all_close();
	filesystem.clear();
	storage_list_update();
}

for(var key in functions) builtin_functions[key] = functions[key];