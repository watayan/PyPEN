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
    cases(){return this._inputs.length;}
    /**
     * n番目の入力値セットを返す
     * @param {int} n 
     * @returns {Array}
     */
    input(n)
    {
        return this._inputs[n];
    }

    /**
     * n番目の出力値を返す
     * @returns {string|number}
     */
    output(n)
    {
        return this._outputs[n];
    }
}

let Quizzes=[
    new Quiz('大小関係','2つの整数を受け取って，大きい方を表示しなさい。',
    [[23,21],[100,200],[10,10],[-13,12]],
    [23,200,10,12]),
    new Quiz('最大公約数', '2つの整数を受け取って，最大公約数を返しなさい。',
    [[35,21],[21,35],[24,25],[23,23]],
    [7,7,1,23]),
    new Quiz('出力','「ABC」と出力しなさい',
    [[]],
    ['ABC']),
];