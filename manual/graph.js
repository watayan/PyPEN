"use strict";

var pypen_path = null;

/**
 * 
 * @param {String} str 
 * @param {String} code 
 */
function make_link(str, code)
{
    if(!pypen_path)
    {
        var paths = location.href.split('/');
        paths.pop();paths.pop();
        pypen_path = paths.join('/');
        if(pypen_path.match(/^file/)) pypen_path += '/index.html';
    }
    document.write('<a href="' + pypen_path + '?code=' + code + '" target="_blank">' + str + '</a>');    
}
