var graphColor = [
	'#c00000','#00c000','#0000c0','#007070','#700070','#707000'
];

var graphical_functions = {
	"gOpenWindow": new BuiltinFunction(2, function(param, loc){
		var canvas = document.getElementById('canvas');
		context = canvas.getContext('2d');
		canvas.setAttribute("width", Number(param[0].getJSValue()) + "px");
		canvas.setAttribute("height", Number(param[1].getJSValue()) + "px");
		canvas.style.display="block";
		return new NullValue(loc);
	}, null, null),
	"gCloseWindow": new BuiltinFunction(0, function(param, loc){
		var canvas = document.getElementById('canvas');
		canvas.style.display = "none";
		context = null;
		return new NullValue(loc);
	}, null, null),
	"gClearWindow": new BuiltinFunction(0, function(param, loc){
		var canvas = document.getElementById('canvas');
		context.clearRect(0,0,canvas.width, canvas.height)
		return new NullValue(loc);
	}, null, null),
	"gSetLineColor": new BuiltinFunction(3, function(param, loc){
		if(context == null) throw new RuntimeError(loc.first_line, "描画領域がありません");
		let r = Number(param[0].getJSValue()), g = Number(param[1].getJSValue()), b = Number(param[2].getJSValue());
		context.strokeStyle = "rgb(" + r + "," + g + "," + b + ")";
		return new NullValue(loc);
	}, null, null),
	"gSetFillColor": new BuiltinFunction(3, function(param, loc){
		if(context == null) throw new RuntimeError(loc.first_line, "描画領域がありません");
		let r = Number(param[0].getJSValue()), g = Number(param[1].getJSValue()), b = Number(param[2].getJSValue());
		context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
		return new NullValue(loc);
	}, null, null),
	"gSetTextColor": new BuiltinFunction(3, function(param, loc){
		if(context == null) throw new RuntimeError(loc.first_line, "描画領域がありません");
		let r = Number(param[0].getJSValue()), g = Number(param[1].getJSValue()), b = Number(param[2].getJSValue());
		context.textStyle = "rgb(" + r + "," + g + "," + b + ")";
		return new NullValue(loc);
	}, null, null),
	"gSetLineWidth": new BuiltinFunction(1, function(param, loc){
		if(context == null) throw new RuntimeError(loc.first_line, "描画領域がありません");
		context.lineWidth = Number(param[0].getJSValue());
		return new NullValue(loc);
	}, null, null),
	"gSetFontSize": new BuiltinFunction(1, function(param, loc){
		if(context == null) throw new RuntimeError(loc.first_line, "描画領域がありません");
		context.font = Number(param[0].getJSValue()) + "px 'sans-serif'";
		return new NullValue(loc);
	}, null, null),
	"gDrawText": new BuiltinFunction(3, function(param, loc){
		if(context == null) throw new RuntimeError(loc.first_line, "描画領域がありません");
		var temp = context.fillStyle;
		context.fillStyle = context.textStyle;
		context.fillText(param[0].getJSValue(), Number(param[1].getJSValue()), Number(param[2].getJSValue()));
		context.fillStyle = temp;
		return new NullValue(loc);
	}, null, null),
	"gDrawLine": new BuiltinFunction(4, function(param, loc){
		if(context == null) throw new RuntimeError(loc.first_line, "描画領域がありません");
		let x1 = Number(param[0].getJSValue()), y1 = Number(param[1].getJSValue()),
			x2 = Number(param[2].getJSValue()), y2 = Number(param[3].getJSValue());
		context.beginPath();
		context.moveTo(x1, y1);
		context.lineTo(x2, y2);
		context.stroke();
		return new NullValue(loc);
	}, null, null),
	"gDrawPoint": new BuiltinFunction(2, function(param, loc){
		if(context == null) throw new RuntimeError(loc.first_line, "描画領域がありません");
		let x1 = Number(param[0].getJSValue()), y1 = Number(param[1].getJSValue());
		context.beginPath();
		context.arc(x1, y1, 1, 0, Math.PI * 2, false);
		context.stroke();
		return new NullValue(loc);
	}, null, null),
	"gDrawBox": new BuiltinFunction(4, function(param, loc){
		if(context == null) throw new RuntimeError(loc.first_line, "描画領域がありません");
		let x1 = Number(param[0].getJSValue()), y1 = Number(param[1].getJSValue()),
			width = Number(param[2].getJSValue()), height = Number(param[3].getJSValue());
		context.beginPath();
		context.strokeRect(x1, y1, width, height);
		context.stroke();
		return new NullValue(loc);
	}, null, null),
	"gFillBox": new BuiltinFunction(4, function(param, loc){
		if(context == null) throw new RuntimeError(loc.first_line, "描画領域がありません");
		let x1 = Number(param[0].getJSValue()), y1 = Number(param[1].getJSValue()),
			width = Number(param[2].getJSValue()), height = Number(param[3].getJSValue());
		context.fillRect(x1, y1, width, height);
		context.beginPath();
		context.strokeRect(x1, y1, width, height);
		context.stroke();
		return new NullValue(loc);
	}, null, null),
	"gDrawCircle": new BuiltinFunction(3, function(param, loc){
		if(context == null) throw new RuntimeError(loc.first_line, "描画領域がありません");
		let x1 = Number(param[0].getJSValue()), y1 = Number(param[1].getJSValue()), r = Number(param[2].getJSValue());
		context.beginPath();
		context.arc(x1, y1, r, 0, Math.PI * 2, false);
		context.stroke();
		return new NullValue(loc);
	}, null, null),
	"gFillCircle": new BuiltinFunction(3, function(param, loc){
		if(context == null) throw new RuntimeError(loc.first_line, "描画領域がありません");
		let x1 = Number(param[0].getJSValue()), y1 = Number(param[1].getJSValue()), r = Number(param[2].getJSValue());
		for(var i = 0; i < 2; i++)
		{
			context.beginPath();
			context.arc(x1, y1, r, 0, Math.PI * 2, false);
			if(i == 0) context.fill();
			else context.stroke();
		}
		return new NullValue(loc);
	}, null, null),
	"gDrawOval": new BuiltinFunction(4, function(param, loc){
		if(context == null) throw new RuntimeError(loc.first_line, "描画領域がありません");
		let x1 = Number(param[0].getJSValue()), y1 = Number(param[1].getJSValue()), w = Number(param[2].getJSValue()), h = Number(param[3].getJSValue());
		context.beginPath();
		context.ellipse(x1 + w / 2, y1 + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
		context.stroke();
		return new NullValue(loc);
	}, null, null),
	"gFillOval": new BuiltinFunction(4, function(param, loc){
		if(context == null) throw new RuntimeError(loc.first_line, "描画領域がありません");
		let x1 = Number(param[0].getJSValue()), y1 = Number(param[1].getJSValue()), w = Number(param[2].getJSValue()), h = Number(param[3].getJSValue());
		for(var i = 0; i < 2; i++)
		{
			context.beginPath();
			context.ellipse(x1 + w / 2, y1 + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
			if(i == 0) context.fill();
			else context.stroke();
		}
		return new NullValue(loc);
	}, null, null),
	"gDrawArc": new BuiltinFunction(7, function(param, loc){
		if(context == null) throw new RuntimeError(loc.first_line, "描画領域がありません");
		let x1 = Number(param[0].getJSValue()), y1 = Number(param[1].getJSValue()), w = Number(param[2].getJSValue()), h = Number(param[3].getJSValue()),
			theta1 = Number(param[4].getJSValue()), theta2 = Number(param[5].getJSValue()), style = Number(param[6].getJSValue());
		context.beginPath();
		context.ellipse(x1 + w / 2, y1 + h / 2, w / 2, h / 2, 0, -theta1 * Math.PI / 180, -theta2 * Math.PI / 180, true);
		switch(style)
		{
			case 2: // 半径
				context.lineTo(x1 + w / 2, y1 + h / 2);
				// fall through
			case 1: // 弦
				context.closePath();
		}
		context.stroke();
		return new NullValue(loc);
	}, null, null),
	"gFillArc": new BuiltinFunction(7, function(param, loc){
		if(context == null) throw new RuntimeError(loc.first_line, "描画領域がありません");
		let x1 = Number(param[0].getJSValue()), y1 = Number(param[1].getJSValue()), w = Number(param[2].getJSValue()), h = Number(param[3].getJSValue()),
			theta1 = Number(param[4].getJSValue()), theta2 = Number(param[5].getJSValue()), style = Number(param[6].getJSValue());
		for(var i = 0; i < 2; i++)
		{
			context.beginPath();
			context.ellipse(x1 + w / 2, y1 + h / 2, w / 2, h / 2, 0, -theta1 * Math.PI / 180, -theta2 * Math.PI / 180, true);
			switch(style)
			{
				case 2: // 半径
					context.lineTo(x1 + w / 2, y1 + h / 2);
					// fall through
				case 1: // 弦
					context.closePath();
			}
			if(i == 0) context.fill();
			else context.stroke();
		}
		return new NullValue(loc);
	}, null, null),
	"gBarplot": new BuiltinFunction(3, function(param, loc){
		var canvas = document.getElementById('canvas');
		var w = Number(param[0].getValue().getJSValue()), h = Number(param[1].getValue().getJSValue());
		if(context == null) context = canvas.getContext('2d');
		canvas.setAttribute("width", w + "px");
		canvas.setAttribute("height", h + "px");
		canvas.style.display="block";	
		// 値の取得
		var values = array2values(param[2], loc);
		var max = 0, min = 0, maxn = 0;
		for(var i = 0; i < values.length; i++)
		{
			var l = values[i].length;
			if(l > maxn) maxn = l;
			for(var j = 0; j < l; j++)
			{
				var v1 = values[i][j];
				if(v1 > max) max = v1;
				if(v1 < min) min = v1;
			}
		}
		if(max == 0) max = 1;
		// 軸の描画
		var x0 = w * 0.05, y0 = h * 0.95;
		y0 *= max / (max - min);
		w *= 0.9; h *= 0.9;
		context.beginPath();
		context.moveTo(x0, y0 - h * max / (max - min));
		context.lineTo(x0, y0 - h * min / (max - min));
		context.moveTo(x0, y0);
		context.lineTo(x0 + w, y0);
		context.stroke();
		if(values.length > 0)
		{
			var w0 = w / maxn / values.length;
			for(var i = 0; i < values.length; i++)
			{
				context.fillStyle = graphColor[i % 6];
				context.beginPath();
				for(var j = 0; j < values[i].length; j++)
				{
					var x = x0 + w0 * j + w0 / 2, y = y0 - (values[i][j] / (max - min)) * h;
					if(values[i][j] >= 0)
						context.fillRect(x0 + w0 * j * values.length + w0 * 0.8 * i + w0 * 0.1, y0 - h * (values[i][j] / (max - min)),w0 * 0.8, h * (values[i][j] / (max - min)));
					else
						context.fillRect(x0 + w0 * j * values.length + w0 * 0.8 * i + w0 * 0.1, y0, w0 * 0.8, h * (-values[i][j] / (max - min)));
				}
				context.stroke();
			}
		}
		return new NullValue(loc);
	}, null, null),
	"gLineplot": new BuiltinFunction(3, function(param, loc){
		var canvas = document.getElementById('canvas');
		var w = Number(param[0].getValue().getJSValue()), h = Number(param[1].getValue().getJSValue());
		if(context == null) context = canvas.getContext('2d');
		canvas.setAttribute("width", w + "px");
		canvas.setAttribute("height", h + "px");
		canvas.style.display="block";	
		// 値の取得
		var values = array2values(param[2], loc);
		var max = 0, min = 0, maxn = 0;
		for(var i = 0; i < values.length; i++)
		{
			var l = values[i].length;
			if(l > maxn) maxn = l;
			for(var j = 0; j < l; j++)
			{
				var v1 = values[i][j];
				if(v1 > max) max = v1;
				if(v1 < min) min = v1;
			}
		}
		if(max == 0) max = 1;
		// 軸の描画
		var x0 = w * 0.05, y0 = h * 0.95;
		y0 *= max / (max - min);
		w *= 0.9; h *= 0.9;
		context.beginPath();
		context.moveTo(x0, y0 - h * max / (max - min));
		context.lineTo(x0, y0 - h * min / (max - min));
		context.moveTo(x0, y0);
		context.lineTo(x0 + w, y0);
		context.stroke();
		if(values.length > 0)
		{
			var w0 = w / maxn;
			for(var i = 0; i < values.length; i++)
			{
				context.strokeStyle = graphColor[i % 6];
				context.beginPath();
				for(var j = 0; j < values[i].length; j++)
				{
					var x = x0 + w0 * j + w0 / 2, y = y0 - (values[i][j] / (max - min)) * h;
					if(j == 0) context.moveTo(x, y);
					else context.lineTo(x, y);
				}
				context.stroke();
			}
		}
		return new NullValue(loc);
	}, null, null),
	"gDrawGraph" : new BuiltinFunction(3, function(param, loc){
		drawGraph(param[0].getValue(), param[1].getValue(), loc);
		return new NullValue(loc);
	}, null, null),
	"gClearGraph" : new BuiltinFunction(0, function(param, loc){
		clearGraph();
		return new NullValue(loc);
	}, null, null),
};

function clearGraph()
{
	Plotly.purge(document.getElementById("graph"));
}

// グラフ描画を行う
// graph{
//  title: 文字列
//  x:{
// 	  title: 文字列
//    min: 実数
//    max: 実数
//  }
//  y:{
// 	  title:
//    min:
//    max:
//  }
// }
// dataは{
//   x: 値の配列（省略時は0〜len(y)-1）
//   y: 値の配列（省略不可）
//   type: 'bar' or 'line' or 'scatter'
//   color: 
//   size: 整数（省略時は1）
// }の配列
function drawGraph(layout, data, loc)
{
	var div = document.getElementById('graph');
	var graph_data = [], graph_layout = {};
	if(layout instanceof DictionaryValue)
	{
		for(var key of layout.getKeys())
		{
			var val = layout.getValue(key);
			if(val instanceof ArrayValue)
			{
				graph_layout[key] = {};
				for(var key1 of val.getJSValue().keys())
					graph_layout[key][key1] = val2obj(val.getValue(key1));
			}
			else graph_layout[key] = val2obj(val);
		}
	}
	else if(layout) throw new RuntimeError(loc.first_line, "レイアウト情報が辞書になっていません");
	if(data instanceof ArrayValue)
	{
		var dl = data._value.length;
		for(var i = 0; i < dl; i++)
		{
			var d = data._value[i].getValue();
			if(d instanceof DictionaryValue)
			{
				var va = {};
				for(var key of d.getKeys())
				{
					var val = d.getValue(key).getJSValue();
					va[key] = val2obj(val);
				}
				graph_data.push(va);
	
			}
			else throw new RuntimeError(loc.first_line, "データの" + i + "番目の要素が辞書になっていません");
		}
	}else throw new RuntimeError(loc.first_line, 'データが配列になっていません');
	// dump("graph_layout", graph_layout);
	Plotly.newPlot(div, graph_data, graph_layout);
};

graphical_functions["描画領域開く"] 	= graphical_functions["gOpenWindow"];
graphical_functions["描画領域全消去"] 	= graphical_functions['gClearWindow'];
graphical_functions["描画領域閉じる"] 	= graphical_functions['gCloseWindow'];
graphical_functions["線色設定"] 		= graphical_functions['gSetLineColor'];
graphical_functions["塗色設定"] 		= graphical_functions['gSetFillColor'];
graphical_functions["文字色設定"] 		= graphical_functions['gSetTextColor'];
graphical_functions["線太さ設定"] 		= graphical_functions['gSetLineWidth'];
graphical_functions["文字サイズ設定"] 	= graphical_functions['gSetFontSize'];
graphical_functions["点描画"] 			= graphical_functions['gDrawPoint'];
graphical_functions["線描画"] 			= graphical_functions['gDrawLine'];
graphical_functions["円描画"] 			= graphical_functions['gDrawCircle'];
graphical_functions["円塗描画"] 		= graphical_functions['gFillCircle'];
graphical_functions["矩形描画"] 		= graphical_functions['gDrawBox'];
graphical_functions["矩形塗描画"] 		= graphical_functions['gFillBox'];
graphical_functions["弧描画"] 			= graphical_functions['gDrawArc'];
graphical_functions["弧塗描画"] 		= graphical_functions['gFillArc'];
graphical_functions["楕円描画"] 		= graphical_functions['gDrawOval'];
graphical_functions["楕円塗描画"] 		= graphical_functions['gFillOval'];
graphical_functions["文字描画"] 		= graphical_functions['gDrawText'];
graphical_functions["棒グラフ描画"] 	= graphical_functions['gBarplot'];
graphical_functions["線グラフ描画"] 	= graphical_functions['gLineplot'];
graphical_functions["グラフ描画"] 		= graphical_functions['gDrawGraph'];
graphical_functions["グラフ消去"] 		= graphical_functions["gClearGraph"];
