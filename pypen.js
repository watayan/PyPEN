"use strict";

/**
 * @returns {string}
 * @param {string} code 
 */
function python_to_dncl(code)
{
    var python_lines = code.split('\n');
    while(python_lines.length > 1 && 
        /^[ 　]*$/.exec(python_lines[python_lines.length - 1]) && 
        !(/[:：]$/.exec(python_lines[python_lines.length - 2])))
        python_lines.pop();
    python_lines.push('');
    var dncl_lines = [];
    var pre_spaces = [0];
    var wait_for_indent = false;
    var ignore_spaces = false;
    for(var i = 0; i < python_lines.length; i++)
    {
        var line = python_lines[i].trimEnd();
        var result = /^([ 　]*)(.*)$/.exec(line);
        if(i < python_lines.length - 1 && result && !result[2])
        {
            dncl_lines.push(line);
            continue;
        } 
        if(result)
        {
            var spaces = count_spaces(result[1]);
            if(/^[ 　]*[#＃]/.exec(result[2]))
            {
                dncl_lines.push(line);
                continue;
            }
            if(wait_for_indent)
            {
                if(!ignore_spaces && spaces <= pre_spaces[0]) throw {"message":(i+1) + "行目行頭の空白の数がおかしいです"};
                pre_spaces.unshift(spaces);
            }
            var deindent = false;
            while(!ignore_spaces && spaces < pre_spaces[0])
            {
                var indent = pre_spaces.shift();
                if(indent == null) throw {"message":(i+1) + "行目行頭の空白の数がおかしいです"};
                if(spaces <=indent)
                {
                    // if(spaces < indent && (deindent || !/^(そうでなければ|そうでなくもし.*)[：:]$/.exec(result[2]))){
                    if(spaces < indent){
                        dncl_lines.push('■');
                    }
                    deindent = true;
                }
                else throw {"message":(i+1) + "行目行頭の空白の数がおかしいです"};
            }
            if(!ignore_spaces && spaces > pre_spaces[0]) throw {"message":(i+1) + "行目行頭の空白の数がおかしいです"};
            wait_for_indent = /[：:]$/.exec(result[2]) ? true : false;
            ignore_spaces = /[,，、\[{]$/.exec(result[2]) ? true : false;
        }
        dncl_lines.push(line);
    }
    return dncl_lines.join('\n') + '\n';
}

function count_spaces(s)
{
    var spaces = 0;
    for(var i = 0; i < s.length; i++)
        spaces += s[i] == ' ' ? 1 : 2;
    return spaces;
}
