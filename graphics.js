var graphColor = [
	'#c00000','#00c000','#0000c0','#007070','#700070','#707000'
];

class GraphicStatement extends Statement
{
	constructor(command, args, loc)
	{
		super(loc);
		this.command = command;
		this.args = args;
		this.state = 0;
	}
	clone()
	{
		var args = [];
		for(var i = 0; i < this.args.length; i++) args.push(this.args[i].clone());
		return new GraphicStatement(this.command, args, this.loc);
	}
	run()
	{
		if(this.state == 0)
		{
			if(this.args) code[0].stack.unshift({statementlist: this.args, index: 0});
			this.state = 1;
		}
		else
		{
			code[0].stack[0].index++;
			if(this.command == 'gOpenWindow')
			{
				var canvas = document.getElementById('canvas');
				context = canvas.getContext('2d');
				canvas.setAttribute("width", Number(this.args[0].getValue().value) + "px");
				canvas.setAttribute("height", Number(this.args[1].getValue().value) + "px");
				canvas.style.display="block";
			}
			else if(this.command == 'gCloseWindow')
			{
				var canvas = document.getElementById('canvas');
				canvas.style.display = "none";
				context = null;
			}
			else if(this.command == 'gClearWindow')
			{
				var canvas = document.getElementById('canvas');
				context.clearRect(0,0,canvas.width, canvas.height)
			}
			else if(this.command == 'gSetLineColor')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let r = Number(this.args[0].getValue().value), g = Number(this.args[1].getValue().value), b = Number(this.args[2].getValue().value);
				context.strokeStyle = "rgb(" + r + "," + g + "," + b + ")";
			}
			else if(this.command == 'gSetFillColor')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let r = Number(this.args[0].getValue().value), g = Number(this.args[1].getValue().value), b = Number(this.args[2].getValue().value);
				context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
			}
			else if(this.command == 'gSetTextColor')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let r = Number(this.args[0].getValue().value), g = Number(this.args[1].getValue().value), b = Number(this.args[2].getValue().value);
				context.textStyle = "rgb(" + r + "," + g + "," + b + ")";
			}
			else if(this.command == 'gSetLineWidth')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				context.lineWidth = Number(this.args[0].getValue().value);
			}
			else if(this.command == 'gSetFontSize')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				context.font = Number(this.args[0].getValue().value) + "px 'sans-serif'";
			}
			else if(this.command == 'gDrawText')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				var temp = context.fillStyle;
				context.fillStyle = context.textStyle;
				context.fillText(this.args[0].getValue().value, Number(this.args[1].getValue().value), Number(this.args[2].getValue().value));
				context.fillStyle = temp;
			}
			else if(this.command == 'gDrawLine')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let x1 = Number(this.args[0].getValue().value), y1 = Number(this.args[1].getValue().value),
					x2 = Number(this.args[2].getValue().value), y2 = Number(this.args[3].getValue().value);
				context.beginPath();
				context.moveTo(x1, y1);
				context.lineTo(x2, y2);
				context.stroke();
			}
			else if(this.command == 'gDrawPoint')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let x1 = numthis.args[0].getValue().value, y1 = this.args[1].getValue().value;
				context.beginPath();
				context.arc(x1, y1, 1, 0, Math.PI * 2, false);
				context.stroke();
			}
			else if(this.command == 'gDrawBox')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let x1 = Number(this.args[0].getValue().value), y1 = Number(this.args[1].getValue().value),
					width = Number(this.args[2].getValue().value), height = Number(this.args[3].getValue().value);
				context.beginPath();
				context.strokeRect(x1, y1, width, height);
				context.stroke();
			}
			else if(this.command == 'gFillBox')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let x1 = Number(this.args[0].getValue().value), y1 = Number(this.args[1].getValue().value),
					width = Number(this.args[2].getValue().value), height = Number(this.args[3].getValue().value);
				context.fillRect(x1, y1, width, height);
				context.beginPath();
				context.strokeRect(x1, y1, width, height);
				context.stroke();
			}
			else if(this.command == 'gDrawCircle')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let x1 = Number(this.args[0].getValue().value), y1 = Number(this.args[1].getValue().value), r = Number(this.args[2].getValue().value);
				context.beginPath();
				context.arc(x1, y1, r, 0, Math.PI * 2, false);
				context.stroke();
			}
			else if(this.command == 'gFillCircle')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let x1 = Number(this.args[0].getValue().value), y1 = Number(this.args[1].getValue().value), r = Number(this.args[2].getValue().value);
				for(var i = 0; i < 2; i++)
				{
					context.beginPath();
					context.arc(x1, y1, r, 0, Math.PI * 2, false);
					if(i == 0) context.fill();
					else context.stroke();
				}
			}
			else if(this.command == 'gDrawOval')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let x1 = Number(this.args[0].getValue().value), y1 = Number(this.args[1].getValue().value), w = Number(this.args[2].getValue().value), h = Number(this.args[3].getValue().value);
				context.beginPath();
				context.ellipse(x1 + w / 2, y1 + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
				context.stroke();
			}
			else if(this.command == 'gFillOval')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let x1 = Number(this.args[0].getValue().value), y1 = Number(this.args[1].getValue().value), w = Number(this.args[2].getValue().value), h = Number(this.args[3].getValue().value);
				for(var i = 0; i < 2; i++)
				{
					context.beginPath();
					context.ellipse(x1 + w / 2, y1 + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
					if(i == 0) context.fill();
					else context.stroke();
				}
			}
			else if(this.command == 'gDrawArc')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let x1 = Number(this.args[0].getValue().value), y1 = Number(this.args[1].getValue().value), w = Number(this.args[2].getValue().value), h = Number(this.args[3].getValue().value),
					theta1 = Number(this.args[4].getValue().value), theta2 = Number(this.args[5].getValue().value), style = Number(this.args[6].getValue().value);
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
			}
			else if(this.command == 'gFillArc')
			{
				if(context == null) throw new RuntimeError(this.first_line, "描画領域がありません");
				let x1 = Number(this.args[0].getValue().value), y1 = Number(this.args[1].getValue().value), w = Number(this.args[2].getValue().value), h = Number(this.args[3].getValue().value),
					theta1 = Number(this.args[4].getValue().value), theta2 = Number(this.args[5].getValue().value), style = Number(this.args[6].getValue().value);
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
			}
			else if(this.command == 'gBarplot')
			{
				if(context == null)
				{
					var canvas = document.getElementById('canvas');
					var w = Number(this.args[0].getValue().value), 
						h = Number(this.args[1].getValue().value);
					context = canvas.getContext('2d');
					canvas.setAttribute("width", w + "px");
					canvas.setAttribute("height", h + "px");
					canvas.style.display="block";
				}
				// 値の取得
				var values = array2values(this.args[2], this.loc);
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
			}
			else if(this.command == 'gLineplot')
			{
				if(context == null)
				{
					var canvas = document.getElementById('canvas');
					var w = Number(this.args[0].getValue().value), h = Number(this.args[1].getValue().value);
					context = canvas.getContext('2d');
					canvas.setAttribute("width", w + "px");
					canvas.setAttribute("height", h + "px");
					canvas.style.display="block";	
				}
				// 値の取得
				var values = array2values(this.args[2], this.loc);
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
			}
			else if(this.command == 'gDrawGraph')
			{
				drawGraph(this.args[0].getValue(), this.args[1].getValue(), this.loc);
			}
			else if(this.command == 'gClearGraph')
			{
				clearGraph();
			}
			else
			{
				throw new RuntimeError(this.first_line, "未実装のコマンド" + this.command + "が使われました");
			}
			this.state = 0;
		}
	}
	makePython(indent)
	{
		throw new RuntimeError(this.first_line, "グラフィック命令はPythonに変換できません");
	}
}

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
		for(var key of layout.value.keys())
		{
			var val = layout.value.get(key).getValue();
			if(val instanceof ArrayValue)
			{
				graph_layout[key] = {};
				for(var key1 of val.value.keys())
					graph_layout[key][key1] = val2obj(val.value.get(key1).getValue());
			}
			else graph_layout[key] = val2obj(val);
		}
	}
	else if(layout) throw new RuntimeError(loc.first_line, "レイアウト情報が辞書になっていません");
	if(data instanceof ArrayValue)
	{
		var dl = data.value.length;
		for(var i = 0; i < dl; i++)
		{
			var d = data.value[i].getValue();
			if(d instanceof DictionaryValue)
			{
				var va = {};
				for(var key of d.value.keys())
				{
					var val = d.value.get(key).getValue();
					va[key] = val2obj(val);
				}
				graph_data.push(va);
	
			}
			else throw new RuntimeError(loc.first_line, "データの" + i + "番目の要素が辞書になっていません");
		}
	}else throw new RuntimeError(loc.first_line, 'データが配列になっていません');
	Plotly.newPlot(div, graph_data, graph_layout);
}
