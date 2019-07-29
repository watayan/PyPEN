# WaPEN (Web-aided PEN)

本プログラムは，PEN（大阪学院大学情報学部の西田研究室と大阪市立大学大学院創造都市研究科の松浦研究室の共同プロジェクトとして開発された初学者向けプログラミング学習環境）に似たシステムをWebアプリケーションとして作成したものです。
フローチャートについては中西のPenFlowchartを移植したものです。

## 使用方法
answer.js-distとsample.js-distをそれぞれanswer.jsとsample.jsにコピーしてください。
その後，適当なプログラムに書き換えてください
（クォートでくくったり\nを行末に挿入したり面倒ではありますが）。
Perlがインストールされていれば，
sample1.PEN，sample2.PEN，…をWaPENのディレクトリに置いて
makesample.plを実行することでsample.jsが生成できます。

ローカルマシンの適当なフォルダに展開して，
index.htmlをブラウザで読み込んでもいいし，
Webサーバの適当なディレクトリに展開して，
Webアプリケーションとして使用することもできます。
gitから入手すると，バージョンアップの際にgit pullするだけで更新できます。

## 使用しているプラグイン
* jQuery
* jQuery LinedTextArea
* jQuery contextMenu
* jQuery ui.position
