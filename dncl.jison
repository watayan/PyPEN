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

Integer			[0０] | ({NonZeroDigit}{DecimalDigit}*)
Float			({Integer}([.．]{DecimalDigit}+)?[eE][+-]?{Integer}) | ({Integer}[.．]{DecimalDigit}+)
String			"「"[^」]*"」"|"'"(\\\'|[^\'])*"'"|"\""(\\\"|[^"])*"\""
Print			"表示"|"印刷"|"出力"
Whitespace		[\s\t 　]
Newline			\r\n|\r|\n
UNDEFINED		"《"[^》]*"》"
IdentifierStart [_a-zA-Zａ-ｚＡ-Ｚ]
IdentifierPart	[_a-zA-Z0-9ａ-ｚＡ-Ｚ０-９]
Identifier		{IdentifierStart}{IdentifierPart}*
StringTrue		"真"|[Tt][Rr][Uu][Ee]
StringFalse		"偽"|[Ff][Aa][Ll][Ss][Ee]
Assign			[:：][\=＝]|"←"
AssignAdd		[\+＋][\=＝←]
AssignDel		[\-ー−‐][\=＝←]
AssignMul		[\*＊×][\=＝←]
AssignDiv		[/／÷][\=＝←]
AssignDivInt	[/／÷][/／÷][\=＝←]
AssignMod		[%％][\=＝←]
AssignAnd		[&＆][\=＝←]
AssignOr		[\|｜][\=＝←]
AssignXor		[\^＾][\=＝←]
AssignLshift	[<＜][<＜][\=＝←]
AssignRshift	[>＞][>＞][\=＝←]
Add				[+＋]
Del				[-ー−‐]
Pow				[\*＊×][\*＊×]
Mul				[\*＊×]
Div				[/／÷]
DivInt			[/／÷][/／÷]
Mod				[%％]
And				[&＆]
Or				[\|｜]
Xor				[\^＾]
Not				[~〜]
Lshift			[<＜][<＜]
Rshift			[>＞][>＞]
EQ				[=＝]
EQEQ			[=＝][=＝]
NE				([!！][=＝])|([<＜][>＞])|"≠"
GE				([>＞][=＝])|"≧"
LE				([<＜][=＝])|"≦"
GT				[>＞]
LT				[<＜]
Comma			[，,、]
Colon			[:：]
Comment			[#＃♯].*(\r|\n|\r\n)

%%

"真偽"			{return '真偽';}
{StringTrue}	{return 'True';}
{StringFalse}	{return 'False';}
{String}		{return '文字列値';}
{Float}			{return '実数値';}
{Integer}		{return '整数値';}
{UNDEFINED}		{return 'UNDEFINED';}
{Assign}		{return '←';}
{AssignAdd}		{return '+←';}
{AssignDel}		{return '-←';}
{AssignMul}		{return '*←';}
{AssignDiv}		{return '/←';}
{AssignDivInt}	{return '//←';}
{AssignMod}		{return '%←';}
{AssignAnd}		{return '&←';}
{AssignOr}		{return '|←';}
{AssignXor}		{return '^←';}
{AssignLshift}	{return '<<←';}
{AssignRshift}	{return '>>←';}
{Add}			{return '+';}
{Del}			{return '-';}
{Pow}			{return '**';}
{Mul}			{return '*';}
{DivInt}		{return '//'}
{Div}			{return '/'}
{Mod}			{return '%';}
"("				{return '(';}
")"				{return ')';}
"（"			{return '(';}
"）"			{return ')';}
"["				{return '[';}
"]"				{return ']';}
"［"			{return '[';}
"］"			{return ']';}
"{"				{return '{';}
"}"				{return '}';}
"｛"			{return '{';}
"｝"			{return '}';}
{GE}			{return '>=';}
{LE}			{return '<=';}
{Rshift}		{return '>>';}
{Lshift}		{return '<<';}
{GT}			{return '>';}
{LT}			{return '<';}
{EQEQ}			{return '=='}
{EQ}			{return '=';}
{NE}			{return '!=';}
{And}			{return '&';}
{Or}			{return '|';}
{Xor}			{return '^';}
{Not}			{return '~';}
{Comma}			{return 'COMMA';}
{Colon}			{return ':'}
"かつ"			{return 'かつ';}
"または"		{return 'または';}
"でない"		{return 'でない';}
"■"				{return 'ブロック終端'}
"を"{Print}"する"		{return 'を表示する';}
"を改行無しで"{Print}"する"	{return 'を改行無しで表示する';}
"を改行なしで"{Print}"する"	{return 'を改行無しで表示する';}
{Print}"する"		{return '表示する';}
"改行無しで"{Print}"する"	{return '改行無しで表示する';}
"改行なしで"{Print}"する"	{return '改行無しで表示する';}
"入力する"			{return '入力する';}
"もし"					{return 'もし';}
"ならば"				{return 'ならば';}
"そうでなければ"		{return 'そうでなければ';}
"の間"					{return 'の間';}
"繰り返しを抜ける"		{return '繰り返しを抜ける';}
"繰返しを抜ける"		{return '繰り返しを抜ける';}
"くりかえしを抜ける"	{return '繰り返しを抜ける';}
"手続きを抜ける"		{return '手続きを抜ける';}
"手続き"				{return '手続き';}
"関数"					{return '関数';}
"を返す"				{return 'を返す';}
"の中に"				{return 'の中に';}
"に"					{return 'に';}
"を"					{return 'を';}
"個の"					{return '個の';}
"から"				{return 'から';}
"まで"				{return 'まで';}
"ずつ"				{return 'ずつ';}
"増やしながら"		{return '増やしながら';}
"減らしながら"		{return '減らしながら';}
"増やしつつ"		{return '増やしながら';}
"減らしつつ"		{return '減らしながら';}
"くりかえす"		{return '繰り返す';}
"繰り返す"			{return '繰り返す';}
"繰返す"			{return '繰り返す';}
"整数"				{return '整数';}
"実数"				{return '実数';}
"文字列"				{return '文字列';}
"と"{Comma}				{return 'と';}
"と"					{return 'と';}
"追加する"			{return '追加する';}
"連結する"			{return '連結する';}
"追加"				{return '追加する';}
"連結"				{return '連結する';}
"描画領域開く"			{return 'gOpenWindow';}
"gOpenWindow"			{return 'gOpenWindow';}
"描画領域閉じる"		{return 'gCloseWindow';}
"gCloseWindow"			{return 'gCloseWindow';}
"描画領域全消去"		{return 'gClearWindow';}
"gClearWindow"			{return 'gClearWindow';}
"線色設定"				{return 'gSetLineColor';}
"gSetLineColor"			{return 'gSetLineColor';}
"塗色設定"				{return 'gSetFillColor';}
"gSetFillColor"			{return 'gSetFillColor';}
"文字色設定"			{return 'gSetTextColor';}
"gSetTextColor"			{return 'gSetTextColor';}
"線太さ設定"			{return 'gSetLineWidth';}
"gSetLineWidth"			{return 'gSetLineWidth';}
"文字サイズ設定"		{return 'gSetFontSize';}
"gSetFontSize"			{return 'gSetFontSize';}
"文字描画"				{return 'gDrawText';}
"gDrawText"				{return 'gDrawText';}
"線描画"				{return 'gDrawLine';}
"gDrawLine"				{return 'gDrawLine';}
"点描画"				{return 'gDrawPoint';}
"gDrawPoint"			{return 'gDrawPoint';}
"矩形描画"				{return 'gDrawBox';}
"gDrawBox"				{return 'gDrawBox';}
"矩形塗描画"			{return 'gFillBox';}
"gFillBox"				{return 'gFillBox';}
"円描画"				{return 'gDrawCircle';}
"gDrawCircle"			{return 'gDrawCircle';}
"円塗描画"				{return 'gFillCircle';}
"gFillCircle"			{return 'gFillCircle';}
"楕円描画"				{return 'gDrawOval';}
"gDrawOval"				{return 'gDrawOval';}
"楕円塗描画"			{return 'gFillOval';}
"gFillOval"				{return 'gFillOval';}
"弧描画"				{return 'gDrawArc';}
"gDrawArc"				{return 'gDrawArc';}
"弧塗描画"				{return 'gFillArc';}
"gFillArc"				{return 'gFillArc';}
"棒グラフ描画"			{return 'gBarplot';}
"gBarplot"				{return 'gBarplot';}
"線グラフ描画"			{return 'gLineplot';}
"gLinePlot"				{return 'gLineplot';}
"グラフ描画"			{return 'gDrawGraph';}
"gDrawGraph"			{return 'gDrawGraph';}
"グラフ消去"			{return 'gClearGraph';}
"gClearGraph"			{return 'gClearGraph';}
"ミリ秒待つ"			{return 'ミリ秒待つ';}
"変数を確認する"		{return '変数を確認する';}
"改行する"				{return '改行する';}
"何もしない"			{return '何もしない';}
"一時停止する"			{return '一時停止する';}
"一時停止"				{return '一時停止';}
{Identifier}			{return '識別子';}
{Comment}				{return '改行';}
<<EOF>>					{return 'EOF';}
{Newline}				{return '改行';}
{Whitespace}		/* skip whitespace */

/lex

%left 'と'
%left 'または'
%left 'かつ' 
%left 'でない'
%nonassoc '=' '==' '!=' '>' '<' '>=' '<=' 'の中に'
%left '|'
%left '^'
%left '&'
%left '<<' '>>'
%left '+' '-'
%left '*' '/' '//' '%'
%left UMINUS '~'
%right '**'
%right '個の'
%
%start Program

%%

e
	: '整数値'		{$$ = new IntValue(Number(toHalf(yytext,@1)), new Location(@1,@1));}
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
	| e '==' e		{$$ = new EQ($1, $3, new Location(@1, @3));}
	| e '=' e		{$$ = new EQ($1, $3, new Location(@1, @3));}
	| e '!=' e		{$$ = new NE($1, $3, new Location(@1, @3));}
	| e '>' e		{$$ = new GT($1, $3, new Location(@1, @3));}
	| e '<' e		{$$ = new LT($1, $3, new Location(@1, @3));}
	| e '>=' e		{$$ = new GE($1, $3, new Location(@1, @3));}
	| e '<=' e		{$$ = new LE($1, $3, new Location(@1, @3));}
	| e 'の中に' e	{$$ = new IN($1, $3, new Location(@1, @3));}
	| e 'かつ' e	{$$ = new And($1, $3, new Location(@1, @3));}
	| e 'または' e	{$$ = new Or($1, $3, new Location(@1, @3));}
	| e 'でない'	{$$ = new Not($1, new Location(@1, @1));}
	| e 'と' e		{$$ = new Connect($1, $3, new Location(@1, @3));}
	| '整数' '(' e ')' {$$ = new ConvertInt($3, new Location(@1, @4));}
	| '実数' '(' e ')' {$$ = new ConvertFloat($3, new Location(@1, @4));}
	| '文字列' '(' e ')' {$$ = new ConvertString($3, new Location(@1, @4));}
	| '真偽' '(' e ')' {$$ = new ConvertBool($3, new Location(@1, @4));}
	| '識別子' '(' args ')' {$$ = new CallFunction($1, $3, new Location(@1,@1));}
	| variable		{$$ = $1;}
	| '[' args ']'	{$$ = new ArrayValue($2, new Location(@1, @3));}
	| '{' args '}'	{$$ = new DictionaryValue($2, new Location(@1, @3));}
	| e '個の' e	{$$ = new NumberOf($1, $3, new Location(@1, @3));}
	;

variable
	: variable '[' args ']' {$1.append($3); $$ = $1;}
	| '識別子' {$$ = new Variable(toHalf($1, @1), null, new Location(@1, @1));}
	| UNDEFINED	{$$ = new UNDEFINED(yytext, new Location(@1,@1));}
	;

slice
	: ':' {$$ = new SliceValue(new NullValue(@1), new NullValue(@1), new Location(@1,@1));}
	| ':' e {$$ = new SliceValue(new NullValue(@1), $2, new Location(@1,@1));}
	| e ':' {$$ = new SliceValue($1, new NullValue(@2), new Location(@1,@1));}
	| e ':' e {$$ = new SliceValue($1, $3, new Location(@1,@3));}
	;

args
	: args 'COMMA' e {$$ = $1.concat($3);}
	| args 'COMMA' slice {$$ = $1.concat($3);}
	| e { $$ = [$1];}
	| slice { $$ = [$1];}
	|   { $$ = [];}
	;

statementlist
	: statementlist statement	{ if($2 != null) $$ = $1.concat($2);}
	| 	{$$ = [];}
	;

statement
	: EmptyStatement
	| DefineStatement
	| CallStatement
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
	| '一時停止する' '改行'
		{$$ = new PauseStatement(new Location(@1, @1));}
	;

EmptyStatement
	: '改行' {$$ = null;}
	;

DumpStatement
	: '変数を確認する' '改行'
		{$$ = new DumpStatement(new Location(@1, @1));}
	|'変数を確認する' '(' ')' '改行'
		{$$ = new DumpStatement(new Location(@1, @1));}
	;

DefineFuncStatement
	: '手続き' '識別子' '(' args ')' ':' '改行' statementlist 'ブロック終端' '改行'
		{$$ = new DefineStep($2, $4, $8, new Location(@1, @9));}
	| '関数' '識別子' '(' args ')' ':' '改行' statementlist 'ブロック終端' '改行'
		{$$ = new DefineFunction($2, $4, $8, new Location(@1, @9));}
	;

ReturnStatement
	: '手続きを抜ける' '改行' {$$ = new ExitStatement(new Location(@1,@1));}
	| e 'を返す' '改行' 
		{$$ = [new runBeforeGetValue([$1], @1), new ReturnStatement($1, new Location(@1, @2))];}
	;

CallStatement
	: '識別子' '(' args ')' '改行' 
		{$$ = [new runBeforeGetValue($3, @1), new CallStep($1, $3, new Location(@1,@4))];}
	;


IfStatement
	: 'もし' e 'ならば' ':' '改行' statementlist 'ブロック終端' '改行'
		{$$ = [new runBeforeGetValue([$2], @1), new If($2,$6,null, new Location(@1, @7))];}
	| 'もし' e 'ならば' ':' '改行' statementlist 'そうでなければ' ':' '改行' statementlist 'ブロック終端' '改行'
		{$$ = [new runBeforeGetValue([$2], @1), new If($2,$6,$10, new Location(@1, @11))];}
	;

ForStatement
	: e 'を' e 'から' e 'まで' e 'ずつ' '増やしながら' '繰り返す' ':' '改行' statementlist 'ブロック終端' '改行'
		{$$ = [new runBeforeGetValue([$3], @1), new ForInc($1, $3, $5, $7,$13, new Location(@1,@14))];}
	| e 'を' e 'から' e 'まで' e 'ずつ' '減らしながら' '繰り返す' ':' '改行' statementlist 'ブロック終端' '改行'
		{$$ = [new runBeforeGetValue([$3], @1), new ForDec($1, $3, $5, $7,$13, new Location(@1,@14))];}
	| e 'を' e 'から' e 'まで' '増やしながら' '繰り返す' ':' '改行' statementlist 'ブロック終端' '改行'
		{$$ = [new runBeforeGetValue([$3], @1), new ForInc($1, $3, $5, new IntValue(1, new Location(@1, @1)),$11, new Location(@1,@12))];}
	| e 'を' e 'から' e 'まで' '減らしながら' '繰り返す' ':' '改行' statementlist 'ブロック終端' '改行'
		{$$ = [new runBeforeGetValue([$3], @1), new ForDec($1, $3, $5, new IntValue(1, new Location(@1, @1)),$11, new Location(@1,@12))];}
	| e 'を' e 'から' e 'まで' e 'ずつ' '増やしながら' ':' '改行' statementlist 'ブロック終端' '改行'
		{$$ = [new runBeforeGetValue([$3], @1), new ForInc($1, $3, $5, $7,$12, new Location(@1,@13))];}
	| e 'を' e 'から' e 'まで' e 'ずつ' '減らしながら' ':' '改行' statementlist 'ブロック終端' '改行'
		{$$ = [new runBeforeGetValue([$3], @1), new ForDec($1, $3, $5, $7,$12, new Location(@1,@13))];}
	| e 'を' e 'から' e 'まで' '増やしながら' ':' '改行' statementlist 'ブロック終端' '改行'
		{$$ = [new runBeforeGetValue([$3], @1), new ForInc($1, $3, $5, new IntValue(1, new Location(@1, @1)),$10, new Location(@1,@11))];}
	| e 'を' e 'から' e 'まで' '減らしながら' ':' '改行' statementlist 'ブロック終端' '改行'
		{$$ = [new runBeforeGetValue([$3], @1), new ForDec($1, $3, $5, new IntValue(1, new Location(@1, @1)),$10, new Location(@1,@11))];}
	;

WhileStatement
	: e 'の間' '繰り返す' ':' '改行' statementlist 'ブロック終端' '改行'
		{$$ = new While($1, $6, new Location(@1, @7));}
	| e 'の間' ':' '改行' statementlist 'ブロック終端' '改行'
		{$$ = new While($1, $5, new Location(@1, @6));}
	;

AssignStatement
	: e '←' e '改行'
		{$$ = [new runArgsBeforeGetValue([$1], @1), new runBeforeGetValue([$3], @1), new Assign($1, $3, null, new Location(@1,@3))];}
	| e '=' e '改行'
		{$$ = [new runArgsBeforeGetValue([$1], @1), new runBeforeGetValue([$3], @1), new Assign($1, $3, null, new Location(@1,@3))];}
	| e '+←' e '改行'
		{$$ = [new runArgsBeforeGetValue([$1], @1), new runBeforeGetValue([$3], @1), new Assign($1, $3, '+', new Location(@1,@3))];}
	| e '-←' e '改行'
		{$$ = [new runArgsBeforeGetValue([$1], @1), new runBeforeGetValue([$3], @1), new Assign($1, $3, '-', new Location(@1,@3))];}
	| e '*←' e '改行'
		{$$ = [new runArgsBeforeGetValue([$1], @1), new runBeforeGetValue([$3], @1), new Assign($1, $3, '*', new Location(@1,@3))];}
	| e '/←' e '改行'
		{$$ = [new runArgsBeforeGetValue([$1], @1), new runBeforeGetValue([$3], @1), new Assign($1, $3, '/', new Location(@1,@3))];}
	| e '//←' e '改行'
		{$$ = [new runArgsBeforeGetValue([$1], @1), new runBeforeGetValue([$3], @1), new Assign($1, $3, '//', new Location(@1,@3))];}
	| e '&←' e '改行'
		{$$ = [new runArgsBeforeGetValue([$1], @1), new runBeforeGetValue([$3], @1), new Assign($1, $3, '&', new Location(@1,@3))];}
	| e '|←' e '改行'
		{$$ = [new runArgsBeforeGetValue([$1], @1), new runBeforeGetValue([$3], @1), new Assign($1, $3, '|', new Location(@1,@3))];}
	| e '^←' e '改行'
		{$$ = [new runArgsBeforeGetValue([$1], @1), new runBeforeGetValue([$3], @1), new Assign($1, $3, '^', new Location(@1,@3))];}
	| e '<<←' e '改行'
		{$$ = [new runArgsBeforeGetValue([$1], @1), new runBeforeGetValue([$3], @1), new Assign($1, $3, '<<', new Location(@1,@3))];}
	| e '>>←' e '改行'
		{$$ = [new runArgsBeforeGetValue([$1], @1), new runBeforeGetValue([$3], @1), new Assign($1, $3, '>>', new Location(@1,@3))];}
	| e 'に' e 'を' '追加する' '改行'
		{$$ = [new runArgsBeforeGetValue([$1], @1), new runBeforeGetValue([$3], @1), new Append($1, $3, new Location(@1,@5))];}
	| e 'に' e 'を' '連結する' '改行'
		{$$ = [new runArgsBeforeGetValue([$1], @1), new runBeforeGetValue([$3], @1), new Extend($1, $3, new Location(@1,@5))];}
	;

PrintStatement
	: args 'を改行無しで表示する' '改行' 
		{$$ = [new runBeforeGetValue($1, @1), new Output($1, false, new Location(@1,@2))];}
	| args 'を表示する' '改行' 
		{$$ = [new runBeforeGetValue($1, @1), new Output($1, true, new Location(@1,@2))];}
	| '改行無しで表示する' '(' args ')' '改行' 
		{$$ = [new runBeforeGetValue($3, @1), new Output($3, false, new Location(@1,@2))];}
	| '表示する' '(' args ')' '改行' 
		{$$ = [new runBeforeGetValue($3, @1), new Output($3, true, new Location(@1,@2))];}
	| '改行する' '改行'
		{$$ = new Newline(new Location(@1, @1));}
	;

InputStatement
	: e 'に' '整数' 'を' '入力する' '改行'	
		{$$ = [new runArgsBeforeGetValue([$1], @1), new Input($1, typeOfValue.typeInt, new Location(@1, @4))];}
	| e 'に' '実数' 'を' '入力する' '改行'	
		{$$ = [new runArgsBeforeGetValue([$1], @1), new Input($1, typeOfValue.typeFloat, new Location(@1, @4))];}
	| e 'に' '文字列' 'を' '入力する' '改行'	
		{$$ = [new runArgsBeforeGetValue([$1], @1), new Input($1, typeOfValue.typeString, new Location(@1, @4))];}
	| e 'に' '真偽' 'を' '入力する' '改行'	
		{$$ = [new runArgsBeforeGetValue([$1], @1), new Input($1, typeOfValue.typeBoolean, new Location(@1, @4))];}
	;

GraphicStatement
	: 'gOpenWindow' '(' e 'COMMA' e ')'	'改行'
		{$$ = [new runBeforeGetValue([$3,$5], @1), new GraphicStatement('gOpenWindow', [$3,$5], new Location(@1, @1))];}
	| 'gCloseWindow' '(' ')' '改行'	
		{$$ = new GraphicStatement('gCloseWindow', [], new Location(@1,@1));}
	| 'gClearWindow' '(' ')' '改行'	
		{$$ = new GraphicStatement('gClearWindow', [], new Location(@1,@1));}
	| 'gSetLineColor' '(' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = [new runBeforeGetValue([$3,$5,$7], @1), new GraphicStatement('gSetLineColor', [$3,$5,$7], new Location(@1, @1))];}
	| 'gSetFillColor' '(' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = [new runBeforeGetValue([$3,$5,$7], @1), new GraphicStatement('gSetFillColor', [$3,$5,$7], new Location(@1, @1))];}
	| 'gSetTextColor' '(' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = [new runBeforeGetValue([$3,$5,$7], @1), new GraphicStatement('gSetTextColor', [$3,$5,$7], new Location(@1, @1))];}
	| 'gSetLineWidth' '(' e ')' '改行'
		{$$ = [new runBeforeGetValue([$3], @1), new GraphicStatement('gSetLineWidth', [$3], new Location(@1, @1))];}
	| 'gSetFontSize' '(' e ')' '改行'
		{$$ = [new runBeforeGetValue([$3], @1), new GraphicStatement('gSetFontSize', [$3], new Location(@1, @1))];}
	| 'gDrawText' '(' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = [new runBeforeGetValue([$3,$5,$7], @1), new GraphicStatement('gDrawText', [$3,$5,$7], new Location(@1,@1))];}
	| 'gDrawLine' '(' e 'COMMA' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = [new runBeforeGetValue([$3,$5,$7,$9], @1), new GraphicStatement('gDrawLine', [$3,$5,$7,$9], new Location(@1,@1))];}
	| 'gDrawPoint' '(' e 'COMMA' e ')' '改行'
		{$$ = [new runBeforeGetValue([$3,$5], @1), new GraphicStatement('gDrawPoint', [$3,$5], new Location(@1,@1))];}
	| 'gDrawBox' '(' e 'COMMA' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = [new runBeforeGetValue([$3,$5,$7,$9], @1), new GraphicStatement('gDrawBox', [$3,$5,$7,$9], new Location(@1,@1))];}
	| 'gFillBox' '(' e 'COMMA' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = [new runBeforeGetValue([$3,$5,$7,$9], @1), new GraphicStatement('gFillBox', [$3,$5,$7,$9], new Location(@1,@1))];}
	| 'gDrawCircle' '(' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = [new runBeforeGetValue([$3,$5,$7], @1), new GraphicStatement('gDrawCircle', [$3,$5,$7], new Location(@1,@1))];}
	| 'gFillCircle' '(' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = [new runBeforeGetValue([$3,$5,$7], @1), new GraphicStatement('gFillCircle', [$3,$5,$7], new Location(@1,@1))];}
	| 'gDrawOval' '(' e 'COMMA' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = [new runBeforeGetValue([$3,$5,$7,$9], @1), new GraphicStatement('gDrawOval', [$3,$5,$7,$9], new Location(@1,@1))];}
	| 'gFillOval' '(' e 'COMMA' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = [new runBeforeGetValue([$3,$5,$7,$9], @1), new GraphicStatement('gFillOval', [$3,$5,$7,$9], new Location(@1,@1))];}
	| 'gDrawArc' '(' e 'COMMA' e 'COMMA' e 'COMMA' e 'COMMA' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = [new runBeforeGetValue([$3,$5,$7,$9,$11,$13,$15], @1), new GraphicStatement('gDrawArc', [$3,$5,$7,$9,$11,$13,$15], new Location(@1,@1))];}
	| 'gFillArc' '(' e 'COMMA' e 'COMMA' e 'COMMA' e 'COMMA' e 'COMMA' e 'COMMA' e ')' '改行'
		{$$ = [new runBeforeGetValue([$3,$5,$7,$9,$11,$13,$15], @1), new GraphicStatement('gFillArc', [$3,$5,$7,$9,$11,$13,$15], new Location(@1,@1))];}
	| 'gBarplot' '(' e  'COMMA' e 'COMMA' e ')' '改行'
		{$$ = [new runBeforeGetValue([$3,$5,$7], @1), new GraphicStatement('gBarplot', [$3,$5,$7], new Location(@1,@1))];}
	| 'gLineplot' '(' e  'COMMA' e 'COMMA' e ')' '改行'
		{$$ = [new runBeforeGetValue([$3,$5,$7], @1), new GraphicStatement('gLineplot', [$3,$5,$7], new Location(@1,@1))];}
	| 'gDrawGraph' '(' e 'COMMA' e ')' '改行'
		{$$ = [new runBeforeGetValue([$3,$5], @1), new GraphicStatement('gDrawGraph', [$3,$5], new Location(@1,@1))];}
	| 'gClearGraph' '(' ')' '改行'
		{$$ = [new GraphicStatement('gClearGraph',[], new Location(@1,@1))];}
	;

SleepStatement
	: e 'ミリ秒待つ' '改行' 
		{$$ = [new runBeforeGetValue([$1], @1), new SleepStatement($1, new Location(@1, @1))];}
	;

BreakStatement
	: '繰り返しを抜ける' '改行'
		{$$ = new BreakStatement(new Location(@1,@1));}
	;

Program
	: SourceElements 'EOF'
	{ typeof console !== 'undefined' ? console.log($1) : print($1);
	          return $1; }
	;

SourceElements
	: SourceElements SourceElement	{ $$ = $1.concat($2);}
	|	{ $$ = [];}
	;

SourceElement
	: statement
	;
