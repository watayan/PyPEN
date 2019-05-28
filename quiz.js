"use strict";

/**
 * 
 * @param {String} title 
 * @param {String} question 
 * @param {Array<Array>} inputs 
 * @param {Array} output 
 * @param {Number} timeout 
 */
function Quiz(title,question,inputs,output,timeout)
{
    this._title = title;
    this._question = question;
    this._inputs = inputs;
    this._output = output;
    this._timeout = timeout;
    if(typeof timeout == 'undefined') this._timeout = 10000;
}

Quiz.prototype = {
    title: function(){return this._title;},
    question: function(){return this._question;},
    inputs: function(n){return this._inputs[n];},
    output: function(n){return this._output[n];},
    timeout: function(){return this._timeout;},
    cases: function(){return this._inputs.length;}
}
