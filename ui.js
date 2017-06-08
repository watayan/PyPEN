'use strict';

function editButton(add_cord)
{
	var sourceTextArea = document.getElementById("sourceTextarea");
	var pos = sourceTextArea.selectionStart;
	var cord = sourceTextArea.value;
	var cord1 = cord.slice(0, pos);
	var cord2 = cord.slice(pos, cord.length);
	var re1 = /[｜| 　]*$/;
	var re2 = /[｜| 　\n]/;
	var add_cords = add_cord.split("\n");
	var tab = "";
	var array = re1.exec(cord1);
	if(array != null) tab = array[0];
//	console.log("["+cord[pos]+"]");
	if((cord[pos] && cord[pos] != "\n") || (pos > 0 && !re2.exec(cord[pos - 1])))
	{
		alert("この位置で入力支援ボタンを押してはいけません");
		sourceTextArea.focus();
		return;
	}
	for(var c in add_cords) if(c > 0) add_cords[c] = tab + add_cords[c];
	sourceTextArea.value = cord1 + add_cords.join("\n") + cord2;
	sourceTextArea.selectionStart = sourceTextArea.selectionEnd = sourceTextArea.value.length - cord2.length;
	sourceTextArea.focus();
}

function keyUp()
{
	var sourceTextArea = document.getElementById("sourceTextarea");
	var pos = sourceTextArea.selectionStart;
	var cord = sourceTextArea.value;
	var cord1 = cord.slice(0, pos);
	var cord2 = cord.slice(pos + 1, cord.length);
	var re1 = /《[^》《]*$/;
	var re2 = /^[^》《]*》/;
	var re3 = /\n?([｜|]*)([^｜|\n]*?)\n$/;
	var re4 = /(ならば|なければ|ながら|[，,、])$/;
	var tab = "";
	switch(window.event.keyCode)
	{
	case 39:
		if(pos > 0 && cord[pos - 1] == "《")
		{
			var match = re2.exec(cord2);
			if(match != null)
			{
				sourceTextArea.setSelectionRange(pos - 1, pos + match[0].length + 1);
				return false;
			}
		}
		break;
	case 37:
		if(cord[pos] == "》")
		{
			var match = re1.exec(cord1);
			if(match != null)
			{
				sourceTextArea.setSelectionRange(pos - match[0].length, pos + 1);
				return false;
			}
		}
		break;
	case 13:
		var match = re3.exec(cord1);
		if(match)
		{
			 tab = match[1] + "\n";
			 if(re4.exec(match[2])) tab = "｜" + tab;
		}
		sourceTextArea.value = cord1 + tab + cord2;
		pos = cord1.length + tab.length - 1;
		sourceTextArea.setSelectionRange(pos, pos);
		return false;
	default:
//		console.log(window.event.keyCode);
		break;
	}
	return true;
}

function mouseClick()
{
	var sourceTextArea = document.getElementById("sourceTextarea");
	var pos = sourceTextArea.selectionStart;
	var cord = sourceTextArea.value;
	var cord1 = cord.slice(0, pos);
	var cord2 = cord.slice(pos, cord.length);
	var re1 = /《[^》《]*$/;
	var re2 = /^[^》《]*》/;
	var match1 = re1.exec(cord1);
	var match2 = re2.exec(cord2);
	if(match1 != null && match2 != null)
	{
		var start = pos - match1[0].length;
		var end = pos + match2[0].length;
		sourceTextArea.setSelectionRange(start, end);
	}
}

function sampleButton(num)
{
	var sourceTextArea = document.getElementById("sourceTextarea");
	sourceTextArea.value = sample[num];
}

var sample=[
"「整数と実数の違い」を表示する\n"+
"11.0/2*2を表示する\n"+
"11/2*2を表示する"
,
"整数 a,b\n"+
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
"aを1から60まで1ずつ増やしながら\n"+
"｜b←random(5)\n"+
"｜c[b]←c[b]+1\n"+
"を繰り返す\n"+
"bを0から5まで1ずつ増やしながら\n"+
"｜c[b]を表示する\n"+
"を繰り返す"
];
