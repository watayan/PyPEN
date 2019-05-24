"use strict";

/**
 * 自動採点用問題および解答
 */
class Quiz
{
    /**
     * 
     * @param {string} title
     * @param {string} question 
     * @param {Array} inputs 
     * @param {Array} outputs 
     */
    constructor(title, question,inputs,outputs)
    {
        this._title = title;
        this._question = question;
        this._inputs = inputs;
        this._outputs = outputs;
    }
    title(){return this._title;}
	question(){return this._question;}
	/**
	 * @returns {Number} 入力値セットの数
	 */
    cases(){return this._inputs.length;}
    /**
     * n番目の入力値セットを返す
     * @param {int} n 
     * @returns {Array}
     */
    input(n){return this._inputs[n];}

    /**
     * n番目の出力値を返す
     * @returns {string|number}
     */
    output(n){return this._outputs[n];}
}

let Quizzes=[
    new Quiz('出力','「ABC」と出力しなさい',
    [[]],
    ['ABC']),
    new Quiz('一次方程式','一次方程式ax=bのaとbを受け取って，xの値を表示しなさい。<br>ただし，解がないときは「解なし」，xが何でもいいときは「すべての値」と表示しなさい。',
    [[2,6],[2,5],[1.5,3.0],[0,0],[0,1]],
    [3,2.5,2,'すべての値','解なし']),
    new Quiz('大小関係','2つの整数を受け取って，大きい方を表示しなさい。',
    [[23,21],[100,200],[10,10],[-13,12]],
    [23,200,10,12]),
    new Quiz('最大公約数', '2つの整数を受け取って，最大公約数を表示しなさい。',
    [[35,21],[21,35],[24,25],[23,23]],
    [7,7,1,23]),
    new Quiz('曜日の計算','3つの整数（西暦年，月，日）を受け取って，<br>その日の曜日を番号（0:日曜，1:月曜，…，6:土曜）で表示しなさい。',
    [[1966,12,20],[2019,5,24]],
    [2,5]),
];