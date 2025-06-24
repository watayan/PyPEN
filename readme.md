# PyPEN

本プログラムは，PEN（大阪学院大学情報学部の西田研究室と大阪市立大学大学院創造都市研究科の松浦研究室の共同プロジェクトとして開発された初学者向けプログラミング学習環境）に似たシステムで，
Pythonっぽい文法のプログラムが作れるものをWebアプリケーションとして作成したものです。
フローチャートについては中西のPenFlowchartを移植したものです。

なお，Internet Explorerでは動作しません。

## 使用方法
answer.js-distとsample.js-distをそれぞれanswer.jsとsample.jsにコピーしてください
（コピーしなかった場合は自動採点やサンプルプログラムボタンを表示しません）。
その後，適当なプログラムに書き換えてください。
といっても手作業でやるのは現実的でないので[WaPEN Tools](https://watayan.net/prog/wapentools.html)を使ってください。

ローカルマシンの適当なフォルダに展開して，
index.htmlをブラウザで読み込んでもいいし，
Webサーバの適当なディレクトリに展開して，
Webアプリケーションとして使用することもできます。
gitから入手すると，バージョンアップの際にgit pullするだけで更新できます。

## 使用しているプラグイン
* jQuery
* [jQuery contextMenu](https://swisnl.github.io/jQuery-contextMenu/)
* jQuery ui.position
* [CodeMirror](https://github.com/codemirror/CodeMirror)
* [zlib.js](https://github.com/imaya/zlib.js)
* [Plotly](https://plotly.com/javascript/)
