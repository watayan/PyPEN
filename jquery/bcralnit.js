/************************************************
 * #### jQuery bcralnit.js v0.0.1 ####
 * add line number in textarea, pre, div etc.
 * Coded by Ican Bachors 2017.
 * https://github.com/bachors/bcralnit.js
 * Updates will be posted to this site.
 ***********************************************/

$.fn.bcralnit = function(e) {
    var f = {
        width: '60px',
        background: '#ddd',
        color: '#333',
        addClass: ''
    };
    if (typeof e === 'object') {
        e.width = (e.width == undefined ? f.width : e.width);
        e.background = (e.background == undefined ? f.background : e.background);
        e.color = (e.color == undefined ? f.color : e.color);
        e.addClass = (e.addClass == undefined ? f.addClass : e.addClass)
    } else {
        e = f
    }
    $(this).each(function(i, a) {
        var f = $(this)[0].tagName,		
			kk = (f == 'TEXTAREA' ? $(this).val() : $(this).text()),
            w = $(this).css('width'),
            h = $(this).css('height'),
            d = ($(this).css('display') == 'inline' ? 'inline-block' : $(this).css('display')),
            ff = $(this).css('font-family'),
            fs = $(this).css('font-size'),
            fw = $(this).css('font-weight'),
            lh = $(this).css('line-height'),
            bt = $(this).css('border-top-width'),
            bb = $(this).css('border-bottom-width'),
            br = $(this).css('border-right-width'),
            bl = $(this).css('border-left-width'),
            m = $(this).css('margin'),
            pt = $(this).css('padding-top'),
            pb = $(this).css('padding-bottom'),
            pl = $(this).css('padding-left'),
            pr = $(this).css('padding-right'),
            nw = (parseInt(w) - parseInt(e.width)) + 'px',
            c = ($(this).attr('id') != null && $(this).attr('id') != undefined ? 'bcralnit_' + $(this).attr('id') + i : 'bcralnit_' + $(this).attr('class') + i),
            b = '<div class="bcr_number" style="text-shadow:none;position:absolute;box-sizing:border-box;border:none;margin:0px;overflow-x:hidden;overflow-y:auto;white-space:pre-wrap;white-space:-moz-pre-wrap;white-space:-pre-wrap;white-space:-o-pre-wrap;word-wrap:break-word;padding:' + (parseInt(pt) + parseInt(bt)) + 'px ' + pr + ' ' + pb + ' ' + pl + ';font-family:' + ff + ';font-size:' + fs + ';font-weight:' + fw + ';line-height:' + lh + ';right:' + e.width + ';width:' + (parseInt(nw) - parseInt(br) - parseInt(bl)) + 'px;height:calc(100% - ' + bb + ');background:' + e.background + ';color:' + e.background + '"></div>';	
		if(e.addClass != ''){
			$(this).addClass(e.addClass);
		}
        $(this).css('width', nw);
        $(this).css('height', '100%');
        $(this).css('position', 'absolute');
        $(this).css('overflow-x', 'hidden');
        $(this).css('overflow-y', 'auto');
        $(this).css('resize', 'none');
        $(this).css('top', '0px');
        $(this).css('margin', '0px');
        $(this).css('box-shadow', 'none');
        $(this).css('left', e.width);
        $(this).css('box-sizing', 'border-box');
        $(this).css('white-space', 'pre-wrap');
        $(this).css('white-space', 'moz-pre-wrap');
        $(this).css('white-space', '-pre-wrap');
        $(this).css('white-space', '-o-pre-wrap');
        $(this).css('word-wrap', 'break-word');
        $(this).addClass("bcr_line");
        $(this).wrap('<div id="' + c + '" style="display:' + d + ';overflow:hidden;box-sizing:border-box;border:none;background:' + e.background + ';position:relative;padding:0px;margin:' + m + ';width:' + w + ';height:' + h + '"></div>');
        $(this).before(b);
        addln(c, kk);
        $(this).on('blur focus change keyup keydown', function() {
			if(f == 'TEXTAREA'){
				var vv = $(this).val();
				addln(c, vv);
			}
        });
        $(this).scroll(function() {
            $('#' + c + ' .bcr_number').scrollTop($(this).scrollTop())
        })
    });

    function addln(b, vv) {
        var a = vv.split(/\n/),
			c = '';
        for (i = 0; i < a.length; i++) {
            var n = ((i + 1) + '      ').slice(0, 6);
            var f = a[i];
            var g = f.substring(n.toString().length, f.length);
            c += '<span style="background:transparent;border:none;box-shadow:none;color:' + e.color + '">' + n + '</span>' + g.replace(/\</ig, '~').replace(/\>/ig, '~') + '<br>'
        };
        $('#' + b + ' .bcr_number').html(c);
        $('#' + b + ' .bcr_number').scrollTop($('#' + b + ' .bcr_line').scrollTop());
    }
}
