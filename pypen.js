"use strict";

/**
 * @returns {string}
 * @param {string} code 
 */
function python_to_dncl(code)
{
    var python_lines = code.split('\n');
    var dncl_lines = [];
    var pre_spaces = [0];
    var wait_for_indent = false;
    for(var i = 0; i < python_lines.length; i++)
    {
        var line = python_lines[i];
        var result = /^([ 　]*)(.*)$/.exec(line);
        if(result)
        {
            var spaces = count_spaces(result[1]);
            if(wait_for_indent)
            {
                if(spaces <= pre_spaces[0]) throw {"message":(i+1) + "行目行頭の空白の数がおかしいです"};
                pre_spaces.unshift(spaces);
                wait_for_indent = false;
            }
            while(spaces < pre_spaces[0])
            {
                var indent = pre_spaces.shift();
                if(indent == null) throw {"message":(i+1) + "行目行頭の空白の数がおかしいです"};
                if(spaces <=indent)
                {
                    if(!/^そうでなければ[：:]$/.exec(result[2])) dncl_lines.push('■');
                }
                else throw {"message":(i+1) + "行目行頭の空白の数がおかしいです"};
            }
            if(spaces > pre_spaces[0]) throw {"message":(i+1) + "行目行頭の空白の数がおかしいです"};
            if(/[：:]$/.exec(result[2])) wait_for_indent = true;
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