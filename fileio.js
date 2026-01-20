"use strict";

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
