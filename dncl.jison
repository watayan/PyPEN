/* by watayan <watayan@watayan.net> */

%{
	const typeOfValue=
	{
		typeInt:1,
		typeFloat:2,
		typeString:3,
		typeBoolean:4,
		typeArray:5
	};
	function toHalf(s, token)
	{
		if(setting.zenkaku_mode == 1)
		{
			if(/[Ａ-Ｚａ-ｚ０-９．−]/.exec(s))
				throw {message:token.first_line + "行目に全角文字が間違って使われています"};
		}
		return s.replace(/[Ａ-Ｚａ-ｚ０-９．−]/g, function(s) {
			return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);}
		);
	}
	function escape_bracket(s)
	{
		if(/^".*"$/.exec(s)) return s.substr(1, s.length - 2).replace(/\\\"/g, "\"");
		else if(/^'.*'$/.exec(s)) return s.substr(1, s.length - 2).replace(/\\'/g,"'");
		else return s.substr(1, s.length - 2);
	}

%}


%lex

DecimalDigit	[0-9０-９]
NonZeroDigit	[1-9１-９]
ZeroOneDigit	[01０１]
HexDigit		[0-9A-Fa-f０-９Ａ-Ｆａ-ｆ]
OctDigit		[0-7０-７]

Float			({Integer}([.．]{DecimalDigit}+)?[eE][+-]?{Integer}) | ({Integer}[.．]{DecimalDigit}+)
Integer			({NonZeroDigit}{DecimalDigit}*) | ("0x"{HexDigit}+) | ("0b"{ZeroOneDigit}+) | ("0o"{OctDigit}+) | [0０]
String			"「"[^」]*"」"|"'"(\\\'|[^\'])*"'"|"\""(\\\"|[^"])*"\""
Output			"表示"|"印刷"|"出力"
Newline			(\r\n|\r|\n)+
UNDEFINED		"《"[^》]*"》"
IdentifierStart [_a-zA-Zａ-ｚＡ-Ｚ]
IdentifierPart	[_a-zA-Z0-9ａ-ｚＡ-Ｚ０-９]
StringTrue		"真"|[Tt][Rr][Uu][Ee]
StringFalse		"偽"|[Ff][Aa][Ll][Ss][Ee]
EQEQ			[\=＝][\=＝]
Assign			[\=＝]
AssignAdd		[\+＋][\=＝]
AssignDel		[\-ー−‐][\=＝]
AssignMul		[\*＊×][\=＝]
AssignDiv		[/／][\=＝]
AssignDivInt	([/／][/／]|"÷")[\=＝]
AssignMod		[%％][\=＝]
AssignAnd		[&＆][\=＝]
AssignOr		[\|｜][\=＝]
AssignXor		[\^＾][\=＝]
AssignLshift	[<＜][<＜][\=＝]
AssignRshift	[>＞][>＞][\=＝]
In				[Ii][Nn]
And				[Aa][Nn][Dd]
Or				[Oo][Rr]
Not				[Nn][Oo][Tt]
If				[Ii][Ff]
Elif			[Ee][Ll][Ii][Ff]
Else			[Ee][Ll][Ss][Ee]
While			[Ww][Hh][Ii][Ll][Ee]
For				[Ff][Oo][Rr]
Print			[Pp][Rr][Ii][Nn][Tt]
Return			[Rr][Ee][Tt][Uu][Rr][Nn]
Pass			[Pp][Aa][Ss][Ss]
Break			[Bb][Rr][Ee][Aa][Kk]
Identifier		{IdentifierStart}{IdentifierPart}*
Add				[+＋]
Del				[-ー−‐]
Pow				[\*＊×][\*＊×]
Mul				[\*＊×]
Div				[/／]
DivInt			[/／][/／]|"÷"
Mod				[%％]
BitAnd			[&＆]
BitOr			[\|｜]
BitXor			[\^＾]
BitNot			[~〜]
Lshift			[<＜][<＜]
Rshift			[>＞][>＞]
NE				([!！][=＝])|([<＜][>＞])|"≠"
GE				([>＞][=＝])|"≧"
LE				([<＜][=＝])|"≦"
GT				[>＞]
LT				[<＜]
Comma			[，,、]
Colon			[:：]
Comment			[#＃♯].*(\r|\n|\r\n)
Whitespace		[ 　]

%%

"真偽"						{return '真偽';}
{Float}						{return '実数値';}
{Integer}					{return '整数値';}
{StringTrue}				{return 'True';}
{StringFalse}				{return 'False';}
{String}					{return '文字列値';}
{UNDEFINED}					{return 'UNDEFINED';}
{EQEQ}						{return '=='}
{Assign}					{return '=';}
{AssignAdd}					{return '+=';}
{AssignDel}					{return '-=';}
{AssignMul}					{return '*=';}
{AssignDiv}					{return '/=';}
{AssignDivInt}				{return '//=';}
{AssignMod}					{return '%=';}
{AssignAnd}					{return '&=';}
{AssignOr}					{return '|=';}
{AssignXor}					{return '^=';}
{AssignLshift}				{return '<<=';}
{AssignRshift}				{return '>>=';}
{Add}						{return '+';}
{Del}						{return '-';}
{Pow}						{return '**';}
{Mul}						{return '*';}
{DivInt}					{return '//'}
{Div}						{return '/'}
{Mod}						{return '%';}
"("							{return '(';}
")"							{return ')';}
"（"						{return '(';}
"）"						{return ')';}
"["							{return '[';}
"]"							{return ']';}
"［"						{return '[';}
"］"						{return ']';}
"{"							{return '{';}
"}"							{return '}';}
"｛"						{return '{';}
"｝"						{return '}';}
{GE}						{return '>=';}
{LE}						{return '<=';}
{Rshift}					{return '>>';}
{Lshift}					{return '<<';}
{GT}						{return '>';}
{LT}						{return '<';}
{NE}						{return '!=';}
{BitAnd}					{return '&';}
{BitOr}						{return '|';}
{BitXor}					{return '^';}
{BitNot}					{return '~';}
{Comma}						{return 'COMMA';}
{Colon}						{return ':'}
{And}						{return 'and';}
{Or}						{return 'or';}
{Not}						{return 'not';}
{In}						{return 'in';}
{If}						{return 'if';}
{Elif}						{return 'elif';}
{Else}						{return 'else';}
{While}						{return 'while';}
{For}						{return 'for';}
{Print}						{return 'print';}
{Return}					{return 'return';}
{Pass}						{return 'pass';}
{Break}						{return 'break';}
"■"							{return 'ブロック終端'}
"を"{Output}"する"			{return 'を表示する';}
"を改行無しで"{Output}"する"	{return 'を改行無しで表示する';}
"を改行なしで"{Output}"する"	{return 'を改行無しで表示する';}
{Output}"する"				{return '表示する';}
"改行無しで"{Output}"する"	{return '改行無しで表示する';}
"改行なしで"{Output}"する"	{return '改行無しで表示する';}
"入力する"					{return '入力する';}
"もし"						{return 'もし';}
"ならば"					{return 'ならば';}
"そうでなければ"			{return 'そうでなければ';}
"そうでなくもし"			{return 'そうでなくもし';}
"の間"						{return 'の間';}
"繰り返しを抜ける"			{return '繰り返しを抜ける';}
"繰返しを抜ける"			{return '繰り返しを抜ける';}
"くりかえしを抜ける"		{return '繰り返しを抜ける';}
"繰り返しをぬける"			{return '繰り返しを抜ける';}
"繰返しをぬける"			{return '繰り返しを抜ける';}
"くりかえしをぬける"		{return '繰り返しを抜ける';}
"手続きを抜ける"			{return '関数を抜ける';}
"関数を抜ける"				{return '関数を抜ける';}
"手続きをぬける"			{return '関数を抜ける';}
"関数をぬける"				{return '関数を抜ける';}
"手続き"					{return '関数';}
"関数"						{return '関数';}
"を返す"					{return 'を返す';}
"の中に"					{return 'の中に';}
"について"					{return 'について';}
"に"						{return 'に';}
"を"						{return 'を';}
"個の"						{return '個の';}
"から"						{return 'から';}
"まで"						{return 'まで';}
"ずつ"						{return 'ずつ';}
"増やしながら"				{return '増やしながら';}
"減らしながら"				{return '減らしながら';}
"増やしつつ"				{return '増やしながら';}
"減らしつつ"				{return '減らしながら';}
"くりかえす"				{return '繰り返す';}
"繰り返す"					{return '繰り返す';}
"繰返す"					{return '繰り返す';}
"の要素"					{return 'の要素';}
"整数"						{return '整数';}
"実数"						{return '実数';}
"文字列"					{return '文字列';}
"と"{Comma}					{return 'と';}
"と"						{return 'と';}
"追加する"					{return '追加する';}
"連結する"					{return '連結する';}
"追加"						{return '追加する';}
"連結"						{return '連結する';}
"描画領域開く"				{return 'gOpenWindow';}
"gOpenWindow"				{return 'gOpenWindow';}
"描画領域閉じる"			{return 'gCloseWindow';}
"gCloseWindow"				{return 'gCloseWindow';}
"描画領域全消去"			{return 'gClearWindow';}
"gClearWindow"				{return 'gClearWindow';}
"線色設定"					{return 'gSetLineColor';}
"gSetLineColor"				{return 'gSetLineColor';}
"塗色設定"					{return 'gSetFillColor';}
"gSetFillColor"				{return 'gSetFillColor';}
"文字色設定"				{return 'gSetTextColor';}
"gSetTextColor"				{return 'gSetTextColor';}
"線太さ設定"				{return 'gSetLineWidth';}
"gSetLineWidth"				{return 'gSetLineWidth';}
"文字サイズ設定"			{return 'gSetFontSize';}
"gSetFontSize"				{return 'gSetFontSize';}
"文字描画"					{return 'gDrawText';}
"gDrawText"					{return 'gDrawText';}
"線描画"					{return 'gDrawLine';}
"gDrawLine"					{return 'gDrawLine';}
"点描画"					{return 'gDrawPoint';}
"gDrawPoint"				{return 'gDrawPoint';}
"矩形描画"					{return 'gDrawBox';}
"gDrawBox"					{return 'gDrawBox';}
"矩形塗描画"				{return 'gFillBox';}
"gFillBox"					{return 'gFillBox';}
"円描画"					{return 'gDrawCircle';}
"gDrawCircle"				{return 'gDrawCircle';}
"円塗描画"					{return 'gFillCircle';}
"gFillCircle"				{return 'gFillCircle';}
"楕円描画"					{return 'gDrawOval';}
"gDrawOval"					{return 'gDrawOval';}
"楕円塗描画"				{return 'gFillOval';}
"gFillOval"					{return 'gFillOval';}
"弧描画"					{return 'gDrawArc';}
"gDrawArc"					{return 'gDrawArc';}
"弧塗描画"					{return 'gFillArc';}
"gFillArc"					{return 'gFillArc';}
"棒グラフ描画"				{return 'gBarplot';}
"gBarplot"					{return 'gBarplot';}
"線グラフ描画"				{return 'gLineplot';}
"gLinePlot"					{return 'gLineplot';}
"グラフ描画"				{return 'gDrawGraph';}
"gDrawGraph"				{return 'gDrawGraph';}
"グラフ消去"				{return 'gClearGraph';}
"gClearGraph"				{return 'gClearGraph';}
"ミリ秒待つ"				{return 'ミリ秒待つ';}
"変数を確認する"			{return '変数を確認する';}
"改行する"					{return '改行する';}
"何もしない"				{return '何もしない';}
"一時停止する"				{return '一時停止する';}
"一時停止"					{return '一時停止する';}
"copy"						{return 'copy';}
"複製"						{return 'copy';}
{Identifier}				{return '識別子';}
{Comment}					{return '改行';}
<<EOF>>						{return 'EOF';}
{Newline}					{return '改行';}
{Whitespace}				/* skip whitespace */

/lex

%right '=' '+=' '-=' '*=' '/=' '//=' '%=' '&=' '|=' '^=' '<<=' '>>='
%left 'と'
%left 'or'
%left 'and' 
%right 'not'
%right 'の中に'
%left '==' '!=' '>' '<' '>=' '<=' 'in'  'not_in'
%right '個の'
%left '|'
%left '^'
%left '&'
%left '<<' '>>'
%left '+' '-'
%left '*' '/' '//' '%'
%left UMINUS '~'
%right '**'
%right ELSE_PREC
%nonassoc 'else' 'そうでなければ' 'elif' 'そうでなくもし'
%
%start Program

%%

e
	: '整数値'		{$$ = new IntValue(toHalf(yytext,@1), new Location(@1,@1));}
	| '実数値'		{$$ = new FloatValue(Number(toHalf(yytext,@1)), new Location(@1,@1));}
	| '文字列値'	{$$ = new StringValue(escape_bracket(yytext), new Location(@1, @1));}
	| 'True'		{$$ = new BooleanValue(true, new Location(@1,@1));}
	| 'False'		{$$ = new BooleanValue(false, new Location(@1,@1));}
	| e '**' e		{$$ = new Pow($1, $3, new Location(@1, @3));}
	| e '+' e		{$$ = new Add($1, $3, new Location(@1, @3));}
	| e '-' e		{$$ = new Sub($1, $3, new Location(@1, @3));}
	| e '*' e		{$$ = new Mul($1, $3, new Location(@1, @3));}
	| e '/' e		{$$ = new Div($1, $3, new Location(@1, @3));}
	| e '//' e		{$$ = new DivInt($1, $3, new Location(@1, @3));}
	| e '%' e		{$$ = new Mod($1, $3, new Location(@1, @3));}
	| '-' e			%prec UMINUS { $$ = new Minus($2, new Location(@2, @2));}
	| e '&' e		{$$ = new BitAnd($1, $3, new Location(@1, @3));}
	| e '|' e		{$$ = new BitOr($1, $3, new Location(@1, @3));}
	| e '^' e		{$$ = new BitXor($1, $3, new Location(@1, @3));}
	| '~' e			{$$ = new BitNot($2, new Location(@1, @2));}
	| e '<<' e		{$$ = new BitLShift($1, $3, new Location(@1, @3));}
	| e '>>' e		{$$ = new BitRShift($1, $3, new Location(@1, @3));}
	| '(' e ')'		{$$ = $2;}
	| e '==' e		{$$ = new Compare($1, $2, $3, new Location(@1,@3));}
	| e '!=' e		{$$ = new Compare($1, $2, $3, new Location(@1,@3));}
	| e '>' e		{$$ = new Compare($1, $2, $3, new Location(@1,@3));}
	| e '<' e		{$$ = new Compare($1, $2, $3, new Location(@1,@3));}
	| e '>=' e		{$$ = new Compare($1, $2, $3, new Location(@1,@3));}
	| e '<=' e		{$$ = new Compare($1, $2, $3, new Location(@1,@3));}
	| e 'の中に' e	{$$ = new Compare($1, $2, $3, new Location(@1,@3));}
	| e 'not' 'in' e	{$$ = new Compare($1, 'not in', $4, new Location(@1,@4));}
	| e 'in' e		{$$ = new Compare($1, $2, $3, new Location(@1,@3));}
	| e 'and' e	{$$ = new And($1, $3, new Location(@1, @3));}
	| e 'or' e	{$$ = new Or($1, $3, new Location(@1, @3));}
	| 'not' e 	{$$ = new Not($2, new Location(@1, @2));}
	| 'copy' '(' e ')' {$$ = new Copy($3, new Location(@1, @4));}
	| e 'と' e		{$$ = new Connect($1, $3, new Location(@1, @3));}
	| '整数' '(' e ')' {$$ = new ConvertInt($3, new Location(@1, @4));}
	| '実数' '(' e ')' {$$ = new ConvertFloat($3, new Location(@1, @4));}
	| '文字列' '(' e ')' {$$ = new ConvertString($3, new Location(@1, @4));}
	| '真偽' '(' e ')' {$$ = new ConvertBool($3, new Location(@1, @4));}
	| '識別子' '(' args ')' {$$ = new CallFunction($1, $3, new Location(@1,@4));}
	| variable		{$$ = $1;}
	| '[' args ']'	{$$ = new ArrayValue($2, new Location(@1, @3));}
	| '[' '改行' args ']'	{$$ = new ArrayValue($3, new Location(@1, @4));}
	| '{' args '}'	{$$ = new DictionaryValue($2, new Location(@1, @3));}
	| '{' '改行' args '}'	{$$ = new DictionaryValue($3, new Location(@1, @4));}
	| e '個の' e	{$$ = new NumberOf($1, $3, new Location(@1, @3));}
	| e '=' e
		{$$ = new Assign($1, $3, null, new Location(@1,@3));}
	| e '+=' e
		{$$ = new Assign($1, $3, '+', new Location(@1,@3));}
	| e '-=' e
		{$$ = new Assign($1, $3, '-', new Location(@1,@3));}
	| e '*=' e
		{$$ = new Assign($1, $3, '*', new Location(@1,@3));}
	| e '/=' e
		{$$ = new Assign($1, $3, '/', new Location(@1,@3));}
	| e '//=' e
		{$$ = new Assign($1, $3, '//', new Location(@1,@3));}
	| e '%=' e
		{$$ = new Assign($1, $3, '%', new Location(@1,@3));}
	| e '&=' e
		{$$ = new Assign($1, $3, '&', new Location(@1,@3));}
	| e '|=' e
		{$$ = new Assign($1, $3, '|', new Location(@1,@3));}
	| e '^=' e
		{$$ = new Assign($1, $3, '^', new Location(@1,@3));}
	| e '<<=' e
		{$$ = new Assign($1, $3, '<<', new Location(@1,@3));}
	| e '>>=' e
		{$$ = new Assign($1, $3, '>>', new Location(@1,@3));}
	;

variable
	: variable '[' args ']' {$1.append($3); $$ = $1;}
	| '識別子' {$$ = new Variable(toHalf($1, @1), null, new Location(@1, @1));}
	| UNDEFINED	{$$ = new UNDEFINED(yytext, new Location(@1,@1));}
	;

slice
	: ':' {$$ = new SliceValue(new NullValue(@1), new NullValue(@1), new Location(@1,@1));}
	| ':' e {$$ = new SliceValue(new NullValue(@1), $2, new Location(@1,@1));}
	| e ':' {$$ = new SliceValue($1, new NullValue(@1), new Location(@1,@1));}
	| e ':' e {$$ = new SliceValue($1, $3, new Location(@1,@3));}
	;

args
	: args 'COMMA' e {$$ = $1.concat($3);}
	| args 'COMMA' slice {$$ = $1.concat($3);}
	| args 'COMMA' '改行' e {$$ = $1.concat($4);}
	| args 'COMMA' '改行' slice {$$ = $1.concat($4);}
	| args 'COMMA' '改行' {$$ = $1;}
	| args 'COMMA'  {$$ = $1;}
	| e { $$ = [$1];}
	| slice { $$ = [$1];}
	|   { $$ = [];}
	;

statements
	: statements statement { if($2 != null) $$ = $1.concat($2);}
	| statements '改行' { $$ = $1;}
	| statement {$$ = [$1];}
	;

statementlist
	: statements 'ブロック終端' '改行' { $$ = $1;}
	;

statement
	: ExpressionStatement
	| AssignStatement
	| PrintStatement
	| InputStatement
	| GraphicStatement
	| ForStatement
	| WhileStatement
	| IfStatement
	| SleepStatement
	| DefineFuncStatement
	| ReturnStatement
	| DumpStatement
	| BreakStatement
	| NopStatement
	;

NopStatement
	: '何もしない' '改行'
		{$$ = new NopStatement(new Location(@1,@1));}
	| 'pass' '改行'
		{$$ = new NopStatement(new Location(@1, @1));}
	| '一時停止する' '改行'
		{$$ = new PauseStatement(new Location(@1, @1));}
	;

ExpressionStatement
	: e '改行' {$$ = $1;}
	;

DumpStatement
	: '変数を確認する' '改行'
		{$$ = new DumpStatement(new Location(@1, @1));}
	|'変数を確認する' '(' ')' '改行'
		{$$ = new DumpStatement(new Location(@1, @1));}
	;

DefineFuncStatement
	: '関数' '識別子' '(' args ')' ':' '改行' statementlist
		{$$ = new DefineFunction($2, $4, $8, new Location(@1, @8));}
	;

ReturnStatement
	: '手続きを抜ける' '改行' {$$ = new ExitStatement(new Location(@1,@1));}
	| '関数を抜ける' '改行'   {$$ = new ExitStatement(new Location(@1,@1));}
	| 'return' '改行'		  {$$ = new ExitStatement(new Location(@1,@1));}
	| e 'を返す' '改行'       {$$ = new ReturnStatement($1, new Location(@1, @2));}
	| 'return' e '改行'		  {$$ = new ReturnStatement($2, new Location(@1, @2));}
	;

IfStatement
	: If ElseIfList ElsePart
		{var tmp = [$1]; 
		tmp = tmp.concat($2); 
		tmp.push($3); 
		$$ = new If(tmp, new Location(@1, @3));}
	| If ElsePart %prec ELSE_PREC
		{var tmp = [$1]; 
		tmp.push($2); 
		$$ = new If(tmp, new Location(@1, @2));}
	| If %prec ELSE_PREC
		{var tmp = [$1]; 
		$$ = new If(tmp, new Location(@1, @1));}
	;

If
	: 'もし' e 'ならば' ':' '改行' statementlist
		{$$ = [$2, $6];}
	| 'if' e ':' '改行' statementlist
		{$$ = [$2, $5];}
	| 'もし' e 'ならば' ':' statement
		{$$ = [$2, [$5]];}
	| 'if' e ':' statement
		{$$ = [$2, [$4]];}
	;

ElsePart
	: 'そうでなければ' ':' '改行' statementlist
		{$$ = [null, $4];}
	| 'else' ':' '改行' statementlist
		{$$ = [null, $4];}
	| 'そうでなければ' ':' statement
		{$$ = [null, [$3]];}
	| 'else' ':' statement
		{$$ = [null, [$3]];}
	;

Elif
	: 'そうでなくもし' e 'ならば' ':' '改行' statementlist
		{$$ = [$2, $6];}
	| 'elif' e ':' '改行' statementlist
		{$$ = [$2, $5];}
	| 'そうでなくもし' e 'ならば' ':' statement
		{$$ = [$2, [$5]];}
	| 'elif' e ':' statement
		{$$ = [$2, [$4]];}
	;

ElseIfList
	: ElseIfList Elif {$1.push($2); $$ = $1;}
	| Elif
		{$$ = [$1];}
	;

ForStatement
	: e 'を' e 'から' e 'まで' e 'ずつ' '増やしながら' '繰り返す' ':' '改行' statementlist
		{$$ = new ForInc($1, $3, $5, $7,$13, new Location(@1,@13));}
	| e 'を' e 'から' e 'まで' e 'ずつ' '減らしながら' '繰り返す' ':' '改行' statementlist
		{$$ = new ForDec($1, $3, $5, $7,$13, new Location(@1,@13));}
	| e 'を' e 'から' e 'まで' '増やしながら' '繰り返す' ':' '改行' statementlist
		{$$ =  new ForInc($1, $3, $5, new IntValue(1, new Location(@1, @1)),$11, new Location(@1,@10));}
	| e 'を' e 'から' e 'まで' '減らしながら' '繰り返す' ':' '改行' statementlist
		{$$ = new ForDec($1, $3, $5, new IntValue(1, new Location(@1, @1)),$11, new Location(@1,@10));}
	| e 'を' e 'から' e 'まで' e 'ずつ' '増やしながら' ':' '改行' statementlist
		{$$ = new ForInc($1, $3, $5, $7,$12, new Location(@1,@11));}
	| e 'を' e 'から' e 'まで' e 'ずつ' '減らしながら' ':' '改行' statementlist
		{$$ = new ForDec($1, $3, $5, $7,$12, new Location(@1,@11));}
	| e 'を' e 'から' e 'まで' '増やしながら' ':' '改行' statementlist
		{$$ = new ForInc($1, $3, $5, new IntValue(1, new Location(@1, @1)),$10, new Location(@1,@9));}
	| e 'を' e 'から' e 'まで' '減らしながら' ':' '改行' statementlist
		{$$ = new ForDec($1, $3, $5, new IntValue(1, new Location(@1, @1)),$10, new Location(@1,@9));}
	| e 'の要素' e 'について' '繰り返す' ':' '改行' statementlist
		{$$ = new ForIn($1, $3, $8, new Location(@1,@8));}
	| e 'の要素' e 'について' ':' '改行' statementlist
		{$$ = new ForIn($1, $3, $7, new Location(@1,@7));}
	| 'for' e 'in' e ':' '改行' statementlist
		{$$ = new ForIn($4, $2, $7, new Location(@1,@7));}
	;

WhileStatement
	: e 'の間' '繰り返す' ':' '改行' statementlist
		{$$ = new While($1, $6, new Location(@1, @6));}
	| e 'の間' ':' '改行' statementlist
		{$$ = new While($1, $5, new Location(@1, @5));}
	| 'while' e ':' '改行' statementlist
		{$$ = new While($2, $5, new Location(@1, @5));}
	;

AssignStatement
	: e 'に' e 'を' '追加する' '改行'
		{$$ = new Append($1, $3, new Location(@1,@5));}
	| e 'に' e 'を' '連結する' '改行'
		{$$ = new Extend($1, $3, new Location(@1,@5));}
	;

PrintStatement
	: args 'を改行無しで表示する' '改行'
		{$$ = new Output($1, false, new Location(@1,@2));}
	| args 'を表示する' '改行'
		{$$ = new Output($1, true, new Location(@1,@2));}
	| '改行無しで表示する' '(' args ')' '改行'
		{$$ = new Output($3, false, new Location(@1,@4));}
	| '表示する' '(' args ')' '改行'
		{$$ = new Output($3, true, new Location(@1,@4));}
	| '改行する' '改行'
		{$$ = new Newline(new Location(@1, @1));}
	| 'print' '(' args ')' '改行'
		{$$ = new Output($3, true, new Location(@1,@4));}
	;

InputStatement
	: e 'に' '整数' 'を' '入力する' '改行'
		{$$ = new Input($1, typeOfValue.typeInt, new Location(@1, @4));}
	| e 'に' '実数' 'を' '入力する' '改行'	
		{$$ = new Input($1, typeOfValue.typeFloat, new Location(@1, @4));}
	| e 'に' '文字列' 'を' '入力する' '改行'	
		{$$ = new Input($1, typeOfValue.typeString, new Location(@1, @4));}
	| e 'に' '真偽' 'を' '入力する' '改行'	
		{$$ = new Input($1, typeOfValue.typeBoolean, new Location(@1, @4));}
	;

GraphicStatement
	: 'gOpenWindow' '(' e 'COMMA' e ')'	'改行'
		{$$ = new GraphicStatement('gOpenWindow', [$3,$5], new Location(@1, @1));}
	| 'gCloseWindow' '(' ')' '改行'	
		{$$ = new GraphicStatement('gCloseWindow', [], new Location(@1,@1));}
	| 'gClearWindow' '(' ')' '改行'	
		{$$ = new GraphicStatement('gClearWindow', [], new Location(@1,@1));}
	| 'gSetLineColor' '(' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = new GraphicStatement('gSetLineColor', [$3,$5,$7], new Location(@1, @1));}
	| 'gSetFillColor' '(' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = new GraphicStatement('gSetFillColor', [$3,$5,$7], new Location(@1, @1));}
	| 'gSetTextColor' '(' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = new GraphicStatement('gSetTextColor', [$3,$5,$7], new Location(@1, @1));}
	| 'gSetLineWidth' '(' e ')' '改行'
		{$$ = new GraphicStatement('gSetLineWidth', [$3], new Location(@1, @1));}
	| 'gSetFontSize' '(' e ')' '改行'
		{$$ = new GraphicStatement('gSetFontSize', [$3], new Location(@1, @1));}
	| 'gDrawText' '(' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = new GraphicStatement('gDrawText', [$3,$5,$7], new Location(@1,@1));}
	| 'gDrawLine' '(' e 'COMMA' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = new GraphicStatement('gDrawLine', [$3,$5,$7,$9], new Location(@1,@1));}
	| 'gDrawPoint' '(' e 'COMMA' e ')' '改行'
		{$$ = new GraphicStatement('gDrawPoint', [$3,$5], new Location(@1,@1));}
	| 'gDrawBox' '(' e 'COMMA' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = new GraphicStatement('gDrawBox', [$3,$5,$7,$9], new Location(@1,@1));}
	| 'gFillBox' '(' e 'COMMA' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = new GraphicStatement('gFillBox', [$3,$5,$7,$9], new Location(@1,@1));}
	| 'gDrawCircle' '(' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = new GraphicStatement('gDrawCircle', [$3,$5,$7], new Location(@1,@1));}
	| 'gFillCircle' '(' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = new GraphicStatement('gFillCircle', [$3,$5,$7], new Location(@1,@1));}
	| 'gDrawOval' '(' e 'COMMA' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = new GraphicStatement('gDrawOval', [$3,$5,$7,$9], new Location(@1,@1));}
	| 'gFillOval' '(' e 'COMMA' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = new GraphicStatement('gFillOval', [$3,$5,$7,$9], new Location(@1,@1));}
	| 'gDrawArc' '(' e 'COMMA' e 'COMMA' e 'COMMA' e 'COMMA' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = new GraphicStatement('gDrawArc', [$3,$5,$7,$9,$11,$13,$15], new Location(@1,@1));}
	| 'gFillArc' '(' e 'COMMA' e 'COMMA' e 'COMMA' e 'COMMA' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = new GraphicStatement('gFillArc', [$3,$5,$7,$9,$11,$13,$15], new Location(@1,@1));}
	| 'gBarplot' '(' e  'COMMA' e 'COMMA' e ')' '改行'
		{$$ = new GraphicStatement('gBarplot', [$3,$5,$7], new Location(@1,@1));}
	| 'gLineplot' '(' e  'COMMA' e 'COMMA' e ')' '改行'
		{$$ = new GraphicStatement('gLineplot', [$3,$5,$7], new Location(@1,@1));}
	| 'gDrawGraph' '(' e 'COMMA' e ')' '改行'
		{$$ = new GraphicStatement('gDrawGraph', [$3,$5], new Location(@1,@1));}
	| 'gClearGraph' '(' ')' '改行'
		{$$ = new GraphicStatement('gClearGraph',[], new Location(@1,@1));}
	;

SleepStatement
	: e 'ミリ秒待つ' '改行' 
		{$$ = new SleepStatement($1, new Location(@1, @1));}
	;

BreakStatement
	: '繰り返しを抜ける' '改行'
		{$$ = new BreakStatement(new Location(@1,@1));}
	| 'break' '改行'
		{$$ = new BreakStatement(new Location(@1,@1));}
	;

Program
	: statements 'EOF'
	{ return $1;}
	;
