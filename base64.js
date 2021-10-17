var base64str = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_="

function B64encode(string, limit = true)
{
	var textencoder = new TextEncoder();
	var deflate = new Zlib.Deflate(textencoder.encode(string));
	var origin = deflate.compress();
	if(limit && origin.length > 1500) return null;
	var convert = new Array(Math.floor((origin.length + 2) / 3) * 4);
	for(var i = 0; i < origin.length; i+= 3)
	{
		var v1, v2, v3 = 64, v4 = 64;
		v1 = origin[i] >>> 2;
		v2 = 0x30 & (origin[i] << 4);
		if(i + 1 < origin.length)
		{
			v2 |= (0x0f & (origin[i + 1] >>> 4));
			v3 = 0x3C & origin[i + 1] <<2;
			if(i + 2 < origin.length)
			{
				v3 |= (0x03 & (origin[i + 2] >>> 6));
				v4 = 0x3f & origin[i + 2];
			}
		}
		var j = i / 3 * 4;
		convert[j++] = base64str[v1];
		convert[j++] = base64str[v2];
		convert[j++] = base64str[v3];
		convert[j]   = base64str[v4];
	}
	return convert.join('').replace(/=+$/,'');
}

function B64decode(string)
{
	var convert = new Array();
	try
	{
		for(var i = 0; i < string.length; i += 4)
		{
			var c1 = base64str.indexOf(string[i]), c2 = base64str.indexOf(string[i + 1]), c3, c4;
			convert.push((c1 << 2) | (c2 >> 4));
			if(i + 2 < string.length)
			{
				c3 = base64str.indexOf(string[i + 2]);
				convert.push(((c2 & 0x0f) << 4) | (c3 >>> 2));
				if(i + 3 < string.length)
				{
					c4 = base64str.indexOf(string[i + 3]);
					convert.push(((c3 & 0x03) << 6) | c4);
				}
			}
		}
		var inflate = new Zlib.Inflate(convert);
		var textdecoder = new TextDecoder();
		return textdecoder.decode((inflate.decompress()));
	}
	catch(e)
	{
		return '';
	}

}
