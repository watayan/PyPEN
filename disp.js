const INTTYPE = 1, FLOATTYPE = 2, STRINGTYPE = 3, BOOLEANTYPE = 4;

function toString (obj, indent) {
  var key, s, val;
  indent = indent || '';
  s = '';
  s += '<' + (obj ? obj.constructor.name : '') + '>';
  for (key in obj) {
    if(key == 'loc') continue;
    val = obj[key];
    s += '\n' + indent;
    s += key + ': ';
    if (typeof val === 'object') {
      s += toString(val, indent + '    ');
    } else if (typeof val === 'function') {
      s += val.name;
    } else {
      s += val;
    }
  }
  if (typeof obj === 'number')
    s += '\n' + indent + obj.toString();
  return s;
};
