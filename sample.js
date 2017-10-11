"use strict";

var sample=[
"「整数と実数の違い」を表示する\n"+
"11.0/2*2を表示する\n"+
"11/2*2を表示する\n"+
"3.0÷2.0を表示する\n"+
"3÷2を表示する"
,
"整数 a,b\n"+
"a←0\n"+
"b←random(8)+1\n"+
"「1から9の数字を当ててください」を表示する\n"+
"繰り返し，\n"+
"｜aを入力する\n"+
"｜aを表示する\n"+
"｜もしa>bならば\n"+
"｜｜「大きい」を表示する\n"+
"｜を実行し，そうでなければ\n"+
"｜｜もしa<bならば\n"+
"｜｜｜「小さい」を表示する\n"+
"｜｜を実行する\n"+
"｜を実行する\n"+
"を，a=bになるまで実行する\n"+
"「あたり」を表示する"
,
"整数 a,b,c[5]\n"+
"「サイコロを60回振って出た目の回数を数えるシミュレーション」を表示する\n"+
"aを1から60まで1ずつ増やしながら，\n"+
"｜b←random(5)\n"+
"｜c[b]←c[b]+1\n"+
"を繰り返す\n"+
"bを0から5まで1ずつ増やしながら，\n"+
"｜c[b]を表示する\n"+
"を繰り返す"
,
"整数 a,b\n"+
"a←1\n"+
"bを1から100まで1ずつ増やしながら，\n"+
"｜a←a*b\n"+
"｜bと「!=」とaを表示する\n"+
"を繰り返す"
,
"整数 a,b\n"+
"描画領域開く(200,200)\n"+
"aを1から100まで1ずつ増やしながら，\n"+
"｜線色設定(random(255),random(255),random(255))\n"+
"｜円描画(random(200),random(200),random(30)+1)\n"+
"を繰り返す"
,
"整数 tyotensu,hensosu,Siten[22],Syuten[22],kotae,i,j,x,y\n"+
"文字列 Hen[8,8],Senbun[22],HenData[8]\n"+
"HenData[1] ← 「-AB-A-AB」\n"+
"HenData[2] ← 「---CA-AC」\n"+
"HenData[3] ← 「---E-EEB」\n"+
"HenData[4] ← 「-----EEC」\n"+
"HenData[5] ← 「-----DAD」\n"+
"HenData[6] ← 「------ED」\n"+
"HenData[7] ← 「-------F」\n"+
"HenData[8] ← 「--------」\n"+
"i を 1 から 8 まで 1 ずつ増やしながら，\n"+
"｜j を 1 から 8 まで 1 ずつ増やしながら，\n"+
"｜｜Hen[i,j] ← substring(HenData[i],j-1,1)\n"+
"｜を繰り返す\n"+
"を繰り返す\n"+
"tyotensu ← 8\n"+
"hensosu ← 0\n"+
"i を 1 から tyotensu-1 まで 1 ずつ増やしながら，\n"+
"｜j を i+1 から tyotensu まで 1 ずつ増やしながら，\n"+
"｜｜もし Hen[i,j]!=「-」 ならば\n"+
"｜｜｜hensosu ← hensosu+1\n"+
"｜｜｜Siten[hensosu] ← i\n"+
"｜｜｜Syuten[hensosu] ← j\n"+
"｜｜｜Senbun[hensosu] ← Hen[i,j]\n"+
"｜｜を実行する\n"+
"｜を繰り返す\n"+
"を繰り返す\n"+
"kotae ← 0\n"+
"x を 1 から hensosu-2 まで 1 ずつ増やしながら，\n"+
"｜y ← x+1\n"+
"｜Siten[x]=Siten[y] の間，\n"+
"｜｜もし Senbun[x]!=Senbun[y] かつ Hen[Syuten[x],Syuten[y]]!=「-」 ならば\n"+
"｜｜｜kotae ← kotae+1\n"+
"｜｜を実行する\n"+
"｜｜y ← y+1\n"+
"｜を繰り返す\n"+
"を繰り返す\n"+
"「三角形の個数は」とkotae を表示する\n"
];
