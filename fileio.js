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

var filesystem = new FileIO();
