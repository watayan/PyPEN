var sound_functions = {
	// サウンド関係
	// samplingRate: サンプリングレートを取得
	// playWave: 波形を再生
	"samplingRate": new BuiltinFunction(0, function(param, loc){
		return new IntValue([audioCtx.sampleRate], loc, audioCtx.sampleRate);
	}, null, null),
	"playWave": new BuiltinFunction([1,2], function(param, loc){
		var par1 = param[0].getValue();
		var par2 = param.length < 2 ? null : param[1].getValue();
		if(par1 instanceof ArrayValue && (par2 === null || (par2 instanceof IntValue || par2 instanceof FloatValue)))
		{
			var bufferSize = par2 ? Number(par2.getJSValue()) * audioCtx.sampleRate : par1._value.length;
			var myArrayBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
			for(var i = 0; i < bufferSize; i++)
				myArrayBuffer.getChannelData(0)[i] = Number(par1.getValue(i % par1._value.length).getJSValue());
			var source = audioCtx.createBufferSource();
			source.buffer = myArrayBuffer;
			source.connect(audioCtx.destination);
			source.start();
			sleeping = function(){ return true; };
			source.onended = function(){ sleeping = null; };
			return new NullValue(loc);
		}
	}, null, null),
	"micReady": new BuiltinFunction(0, function(param, loc){
		try{
			sleeping = function(){ return true; };
			navigator.mediaDevices.getUserMedia({ audio: true })
			.then(stream => { sleeping = null; micStream = stream; })
			.catch(err => { sleeping = null; micStream = null; });
			return new NullValue(loc);
		}
		catch(e){
			sleeping = null;
			if(micStream)
			{
				micStream.getTracks().forEach(track => track.stop());
				micStream = null;
			}
			return new NullValue(loc);
		}
	}, null, null),
	"recordWave": new BuiltinFunction(1, function(param, loc){
		if(!micStream) throw new RuntimeError(loc.first_line, "マイクが準備できていません");
		var par1 = param[0].getValue();
		if(par1 instanceof IntValue || par1 instanceof FloatValue)
		{
			var duration = Number(par1.getJSValue());
			const required_samples = audioCtx.sampleRate * duration;
			var waveData = [];
			var finished = false;
			var nosound = true;
			sleeping = function(){ return true; };
			audioCtx.resume()
			.then(() => {
				var finalizeRecording = function(){
					if(finished) return new NullValue(loc);
					finished = true;
					sleeping = null;
					if(processor)
					{
						processor.onaudioprocess = null;
						try{ processor.disconnect(); } catch(e){};
					}
					if(source)
					{
						try{ source.disconnect(); } catch(e){};
					}
				}
				var source = audioCtx.createMediaStreamSource(micStream);
				var processor = audioCtx.createScriptProcessor(2048, 1, 1);
				source.connect(processor);
				processor.connect(audioCtx.destination);
				processor.onaudioprocess = (e) => {
					if(finished) return;
					var inputData = e.inputBuffer.getChannelData(0);
					var remaining_samples = required_samples - waveData.length;
					if(remaining_samples <= 0)
					{
						finalizeRecording();
						return new NullValue(loc);
					}
					for(var i = 0; i < inputData.length && waveData.length < required_samples; i++)
					{
						if(Math.abs(inputData[i]) > 0.001) nosound = false;
						if(!nosound) waveData.push(new FloatValue([inputData[i]], loc, inputData[i]));
					}
					if(waveData.length >= required_samples)
						finalizeRecording();
				};
			})
			.catch((e) => {
				finalizeRecording();
				textareaAppend("Error during recording: " + e + "\n"); // for DEBUG
			});
			return new ArrayValue(waveData, loc, waveData);
		}
		else return new NullValue(loc);
	}, null, null),
}

