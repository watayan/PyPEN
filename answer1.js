"use strict";

/**
 * 自動採点用問題および解答
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Quiz = function () {
  /**
   * 
   * @param {string} title
   * @param {string} question 
   * @param {Array} inputs 
   * @param {Array} outputs 
   * @param {Number} timeout
   */
  function Quiz(title, question, inputs, outputs) {
    var timeout = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 10000;

    _classCallCheck(this, Quiz);

    this._title = title;
    this._question = question;
    this._inputs = inputs;
    this._outputs = outputs;
    this._timeout = timeout;
  }

  _createClass(Quiz, [{
    key: 'title',
    value: function title() {
      return this._title;
    }
  }, {
    key: 'question',
    value: function question() {
      return this._question;
    }
  }, {
    key: 'timeout',
    value: function timeout() {
      return this._timeout;
    }
    /**
     * @returns {Number} 入力値セットの数
     */

  }, {
    key: 'cases',
    value: function cases() {
      return this._inputs.length;
    }
    /**
     * n番目の入力値セットを返す
     * @param {int} n 
     * @returns {Array}
     */

  }, {
    key: 'input',
    value: function input(n) {
      return this._inputs[n];
    }

    /**
     * n番目の出力値を返す
     * @returns {string|number}
     */

  }, {
    key: 'output',
    value: function output(n) {
      return this._outputs[n];
    }
  }]);

  return Quiz;
}();

var Quizzes = [new Quiz('出力', '「ABC」と出力しなさい', [[]], ['ABC']), new Quiz('敬称をつける', '文字列を1つ受け取って，それの後ろに「さん」をつけて表示しなさい。', [['ABC'], ['わたやん'], ['さかなクン'], ['いちにの'], ['']], ['ABCさん', 'わたやんさん', 'さかなクンさん', 'いちにのさん', 'さん']), new Quiz('一次方程式', '一次方程式ax=bのaとbを受け取って，xの値を表示しなさい。<br>ただし，解がないときは「解なし」，xが何でもいいときは「すべての値」と表示しなさい。', [[2, 6], [2, 5], [1.5, 3.0], [0, 0], [0, 1]], [3, 2.5, 2, 'すべての値', '解なし']), new Quiz('大小関係', '2つの整数を受け取って，大きい方を表示しなさい。', [[23, 21], [100, 200], [10, 10], [-13, 12]], [23, 200, 10, 12]), new Quiz('最大公約数', '2つの整数を受け取って，最大公約数を表示しなさい。', [[35, 21], [21, 35], [24, 25], [23, 23], [19661220, 20190528], [527215277, 20190528]], [7, 7, 1, 23, 36, 1]), new Quiz('曜日の計算', '3つの整数（西暦年，月，日）を受け取って，<br>その日の曜日を番号（0:日曜，1:月曜，…，6:土曜）で表示しなさい。', [[1966, 12, 20], [2019, 5, 24], [2019, 1, 1], [2019, 1, 31], [2019, 3, 1], [2020, 1, 1], [2020, 3, 1], [2100, 3, 1], [2100, 2, 1]], [2, 5, 2, 4, 5, 3, 0, 1, 1])];
