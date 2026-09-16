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
WithoutNewline	"改行"("無しで"|"なしで"|"せずに")
while			"の間"("繰り返す"|"繰返す"|"くりかえす"|)
Interval		"範囲"|"区間"
Increasing		("増やしながら"|"増やしつつ")("繰り返す"|"繰返す"|"くりかえす"|)
Decreasing		("減らしながら"|"減らしつつ")("繰り返す"|"繰返す"|"くりかえす"|)
Repeat			("繰り返す"|"繰返す"|"くりかえす")
Repeating		("繰り返し"|"繰返し"|"くりかえし")
Exit			("抜ける"|"ぬける"|"出る"|"でる")
Newline			(\r\n|\r|\n)+
UNDEFINED		"《"[^》]*"》"
IdentifierStart [_a-zA-Zａ-ｚＡ-Ｚ\u3040-\u30FF\u4E00-\u9FFF]
IdentifierPart  [_a-zA-Z0-9ａ-ｚＡ-Ｚ０-９\u3040-\u30FF\u4E00-\u9FFF]
Identifier		{IdentifierStart}{IdentifierPart}*
Boundary		[^_a-zA-Z0-9\u3040-\u30FF\u4E00-\u9FFF]
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
In				[Ii][Nn]/[^a-zA-Z0-9_]
And				[Aa][Nn][Dd]/[^a-zA-Z0-9_]
Or				[Oo][Rr]/[^a-zA-Z0-9_]
NotIn			[Nn][Oo][Tt]\s[Ii][Nn]/[^a-zA-Z0-9_]
Not				[Nn][Oo][Tt]/[^a-zA-Z0-9_]
If				[Ii][Ff]/[^a-zA-Z0-9_]
Elif			[Ee][Ll][Ii][Ff]/[^a-zA-Z0-9_]
Else			[Ee][Ll][Ss][Ee]/[^a-zA-Z0-9_]
While			[Ww][Hh][Ii][Ll][Ee]/[^a-zA-Z0-9_]
For				[Ff][Oo][Rr]/[^a-zA-Z0-9_]
Print			[Pp][Rr][Ii][Nn][Tt]/[^a-zA-Z0-9_]
Return			[Rr][Ee][Tt][Uu][Rr][Nn]/[^a-zA-Z0-9_]
Pass			[Pp][Aa][Ss][Ss]/[^a-zA-Z0-9_]
Break			[Bb][Rr][Ee][Aa][Kk]/[^a-zA-Z0-9_]
Def				[Dd][Ee][Ff]/[^a-zA-Z0-9_]
int				[Ii][Nn][Tt]/[^a-zA-Z0-9_]
float			[Ff][Ll][Oo][Aa][Tt]/[^a-zA-Z0-9_]
str				[Ss][Tt][Rr]/[^a-zA-Z0-9_]
bool			[Bb][Oo][Oo][Ll]/[^a-zA-Z0-9_]
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
Whitespace		[ 　\t]

%%

"真偽"/{Boundary}				{return '真偽';}
{Float}/{Boundary}			{return '実数値';}
{Integer}/{Boundary}			{return '整数値';}
{StringTrue}/{Boundary}		{return 'True';}
{StringFalse}/{Boundary}		{return 'False';}
{String}/{Boundary}			{return '文字列値';}
{UNDEFINED}/{Boundary}		{return 'UNDEFINED';}
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
{DivInt}					{return '//';}
{Div}						{return '/';}
{Mod}						{return '%';}
"."							{return 'DOT';}
[\(（]						{return '(';}
[\)）]						{return ')';}
[\[［]]						{return '[';}
[\]］]						{return ']';}
[{｛]						{return '{';}
[}｝]						{return '}';}
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
{Colon}						{return ':';}
{And}/{Boundary}			{return 'and';}
{Or}/{Boundary}				{return 'or';}
{NotIn}/{Boundary}			{return 'not_in';}
{Not}/{Boundary}			{return 'not';}
{In}/{Boundary}				{return 'in';}
{If}/{Boundary}				{return 'if';}
{Elif}/{Boundary}			{return 'elif';}
{Else}/{Boundary}			{return 'else';}
{While}/{Boundary}			{return 'while';}
{For}/{Boundary}			{return 'for';}
{Print}/{Boundary}			{return 'print';}
{Return}/{Boundary}			{return 'return';}
{Pass}/{Boundary}			{return 'pass';}
{Break}/Bounday				{return 'break';}
{Def}/{Boundary}			{return 'def';}
{int}/{Boundary}			{return '整数';}
{float}/{Boundary}			{return '実数';}
{str}/{Boundary}			{return '文字列';}
{bool}/{Boundary}			{return '真偽';}
"■"							{return 'ブロック終端'}
"を"{WithoutNewline}"で"{Output}"する"/{Boundary}
							{return 'を改行無しで表示する';}
"を"{Output}"する"/{Boundary}
							{return 'を表示する';}
{WithoutNewline}{Output}"する"/{Boundary}
							{return '改行無しで表示する';}
{Output}"する"/{Boundary}	{return '表示する';}
"入力する"/{Boundary}		{return '入力する';}
"もし"/{Boundary}			{return 'もし';}
"ならば"/{Boundary}			{return 'ならば';}
"そうでなければ"/{Boundary}	{return 'そうでなければ';}
"そうでなくもし"/{Boundary}	{return 'そうでなくもし';}
{while}/{Boundary}			{return 'の間';}
{Repeating}"を"{Exit}/{Boundary}
							{return '繰り返しを抜ける';}
"手続きを"{Exit}/{Boundary}	{return '関数を抜ける';}
"関数を"{Exit}/{Boundary}	{return '関数を抜ける';}
"手続き"/{Boundary}			{return '関数';}
"関数"/{Boundary}			{return '関数';}
"を返す"/{Boundary}			{return 'を返す';}
"の中に"/{Boundary}			{return 'の中に';}
"について"/{Boundary}		{return 'について';}
"に"/{Boundary}				{return 'に';}
"を"/{Boundary}				{return 'を';}
"個の"/{Boundary}			{return '個の';}
"から"/{Boundary}			{return 'から';}
"まで"/{Boundary}			{return 'まで';}
"ずつ"/{Boundary}			{return 'ずつ';}
{Increasing}/{Boundary}		{return '増やしながら';}
{Decreasing}/{Boundary}		{return '減らしながら';}
{Repeat}/{Boundary}			{return '繰り返す';}
"の要素"/{Boundary}			{return 'の要素';}
{Interval}/{Boundary}		{return '区間';}
"整数"/{Boundary}			{return '整数';}
"実数"/{Boundary}			{return '実数';}
"文字列"/{Boundary}			{return '文字列';}
"と"{Comma}/{Boundary}		{return 'と';}
"と"/{Boundary}				{return 'と';}
"で"/{Boundary}				{return 'で';}
"追加する"/{Boundary}		{return '追加する';}
"連結する"/{Boundary}		{return '連結する';}
"追加"/{Boundary}			{return '追加する';}
"連結"/{Boundary}			{return '連結する';}
"描画領域開く"/{Boundary}	{return 'gOpenWindow';}
"gOpenWindow"/{Boundary}	{return 'gOpenWindow';}
"描画領域閉じる"/{Boundary}	{return 'gCloseWindow';}
"gCloseWindow"/{Boundary}	{return 'gCloseWindow';}
"描画領域全消去"/{Boundary}	{return 'gClearWindow';}
"gClearWindow"/{Boundary}	{return 'gClearWindow';}
"線色設定"/{Boundary}		{return 'gSetLineColor';}
"gSetLineColor"/{Boundary}	{return 'gSetLineColor';}
"塗色設定"/{Boundary}		{return 'gSetFillColor';}
"gSetFillColor"/{Boundary}	{return 'gSetFillColor';}
"文字色設定"/{Boundary}		{return 'gSetTextColor';}
"gSetTextColor"/{Boundary}	{return 'gSetTextColor';}
"線太さ設定"/{Boundary}		{return 'gSetLineWidth';}
"gSetLineWidth"/{Boundary}	{return 'gSetLineWidth';}
"文字サイズ設定"/{Boundary}	{return 'gSetFontSize';}
"gSetFontSize"/{Boundary}	{return 'gSetFontSize';}
"文字描画"/{Boundary}		{return 'gDrawText';}
"gDrawText"/{Boundary}		{return 'gDrawText';}
"線描画"/{Boundary}			{return 'gDrawLine';}
"gDrawLine"/{Boundary}		{return 'gDrawLine';}
"点描画"/{Boundary}			{return 'gDrawPoint';}
"gDrawPoint"/{Boundary}		{return 'gDrawPoint';}
"矩形描画"/{Boundary}		{return 'gDrawBox';}
"gDrawBox"/{Boundary}		{return 'gDrawBox';}
"矩形塗描画"/{Boundary}		{return 'gFillBox';}
"gFillBox"/{Boundary}		{return 'gFillBox';}
"円描画"/{Boundary}			{return 'gDrawCircle';}
"gDrawCircle"/{Boundary}	{return 'gDrawCircle';}
"円塗描画"/{Boundary}		{return 'gFillCircle';}
"gFillCircle"/{Boundary}	{return 'gFillCircle';}
"楕円描画"/{Boundary}		{return 'gDrawOval';}
"gDrawOval"/{Boundary}		{return 'gDrawOval';}
"楕円塗描画"/{Boundary}		{return 'gFillOval';}
"gFillOval"/{Boundary}		{return 'gFillOval';}
"弧描画"/{Boundary}			{return 'gDrawArc';}
"gDrawArc"/{Boundary}		{return 'gDrawArc';}
"弧塗描画"/{Boundary}		{return 'gFillArc';}
"gFillArc"/{Boundary}		{return 'gFillArc';}
"棒グラフ描画"/{Boundary}	{return 'gBarplot';}
"gBarplot"/{Boundary}		{return 'gBarplot';}
"線グラフ描画"/{Boundary}	{return 'gLineplot';}
"gLinePlot"/{Boundary}		{return 'gLineplot';}
"グラフ描画"/{Boundary}		{return 'gDrawGraph';}
"gDrawGraph"/{Boundary}		{return 'gDrawGraph';}
"グラフ消去"/{Boundary}		{return 'gClearGraph';}
"gClearGraph"/{Boundary}	{return 'gClearGraph';}
"ミリ秒待つ"/{Boundary}		{return 'ミリ秒待つ';}
"変数を確認する"/{Boundary}	{return '変数を確認する';}
"改行する"/{Boundary}		{return '改行する';}
"何もしない"/{Boundary}		{return '何もしない';}
"一時停止する"/{Boundary}	{return '一時停止する';}
"一時停止"/{Boundary}		{return '一時停止する';}
{Identifier}				{return '識別子';}
{Comment}					{}
<<EOF>>						{return 'EOF';}
{Newline}					{return '改行';}
{Whitespace}				/* skip whitespace */

/lex

%left 'COMMA'
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
%left 'DOT'
%right ELSE_PREC
%nonassoc 'else' 'そうでなければ' 'elif' 'そうでなくもし'

%start Program

%%

e
	: '整数値'		{$$ = new IntValue([toHalf(yytext,@1)], new Location(@1,@1));}
	| '実数値'		{$$ = new FloatValue([Number(toHalf(yytext,@1))], new Location(@1,@1));}
	| '文字列値'	{$$ = new StringValue([escape_bracket(yytext)], new Location(@1, @1));}
	| 'True'		{$$ = new BooleanValue([true], new Location(@1,@1));}
	| 'False'		{$$ = new BooleanValue([false], new Location(@1,@1));}
	| e '**' e		{$$ = new Pow([$1, $3], new Location(@1, @3));}
	| e '+' e		{$$ = new Add([$1, $3], new Location(@1, @3));}
	| e '-' e		{$$ = new Sub([$1, $3], new Location(@1, @3));}
	| e '*' e		{$$ = new Mul([$1, $3], new Location(@1, @3));}
	| e '/' e		{$$ = new Div([$1, $3], new Location(@1, @3));}
	| e '//' e		{$$ = new DivInt([$1, $3], new Location(@1, @3));}
	| e '%' e		{$$ = new Mod([$1, $3], new Location(@1, @3));}
	| '-' e			%prec UMINUS { $$ = new Minus([$2], new Location(@2, @2));}
	| e '&' e		{$$ = new BitAnd([$1, $3], new Location(@1, @3));}
	| e '|' e		{$$ = new BitOr([$1, $3], new Location(@1, @3));}
	| e '^' e		{$$ = new BitXor([$1, $3], new Location(@1, @3));}
	| '~' e			{$$ = new BitNot([$2], new Location(@1, @2));}
	| e '<<' e		{$$ = new BitLShift([$1, $3], new Location(@1, @3));}
	| e '>>' e		{$$ = new BitRShift([$1, $3], new Location(@1, @3));}
	| '(' e ')'		{$$ = ($2 instanceof Compare) ? new ParenValue([$2], new Location(@1, @3)) : $2;}
	| e '==' e		{$$ = new Compare([$1, $2, $3], new Location(@1,@3));}
	| e '!=' e		{$$ = new Compare([$1, $2, $3], new Location(@1,@3));}
	| e '>' e		{$$ = new Compare([$1, $2, $3], new Location(@1,@3));}
	| e '<' e		{$$ = new Compare([$1, $2, $3], new Location(@1,@3));}
	| e '>=' e		{$$ = new Compare([$1, $2, $3], new Location(@1,@3));}
	| e '<=' e		{$$ = new Compare([$1, $2, $3], new Location(@1,@3));}
	| e 'の中に' e	{$$ = new Compare([$1, $2, $3], new Location(@1,@3));}
	| e 'not' 'in' e	{$$ = new Compare([$1, 'not in', $4], new Location(@1,@4));}
	| e 'in' e		{$$ = new Compare([$1, $2, $3], new Location(@1,@3));}
	| e 'and' e	{$$ = new And([$1, $3], new Location(@1, @3));}
	| e 'or' e	{$$ = new Or([$1, $3], new Location(@1, @3));}
	| 'not' e 	{$$ = new Not([$2], new Location(@1, @2));}
	| e 'と' e		{$$ = new Connect([$1, $3], new Location(@1, @3));}
	| '整数' '(' e ')' {$$ = new ConvertInt([$3], new Location(@1, @4));}
	| '実数' '(' e ')' {$$ = new ConvertFloat([$3], new Location(@1, @4));}
	| '文字列' '(' e ')' {$$ = new ConvertString([$3], new Location(@1, @4));}
	| '真偽' '(' e ')' {$$ = new ConvertBool([$3], new Location(@1, @4));}
	| '識別子' '(' args ')' {$$ = new CallFunction([$1, $3], new Location(@1,@4));}
	| e 'DOT' '識別子' '(' args ')' 
		{$$ = new CallFunction([$3, [$1].concat($5)], new Location(@1,@6));}
	| variable		{$$ = $1;}
	| '[' args ']'	{$$ = new ArrayValue($2, new Location(@1,@3));}
	| '[' '改行' args ']'	{$$ = new ArrayValue($3, new Location(@1,@4));}
	| '{' args '}'	{$$ = new DictionaryValue($2, new Location(@1, @3));}
	| '{' '改行' args '}'	{$$ = new DictionaryValue($3, new Location(@1, @4));}
	| e '個の' e	{$$ = new NumberOf([$1, $3], new Location(@1, @3));}
	| e '=' e		{$$ = new Assign($1, $3, null, new Location(@1,@3));}
	| e '+=' e		{$$ = new Assign($1, $3, '+', new Location(@1,@3));}
	| e '-=' e		{$$ = new Assign($1, $3, '-', new Location(@1,@3));}
	| e '*=' e		{$$ = new Assign($1, $3, '*', new Location(@1,@3));}
	| e '/=' e		{$$ = new Assign($1, $3, '/', new Location(@1,@3));}
	| e '//=' e		{$$ = new Assign($1, $3, '//', new Location(@1,@3));}
	| e '%=' e		{$$ = new Assign($1, $3, '%', new Location(@1,@3));}
	| e '&=' e		{$$ = new Assign($1, $3, '&', new Location(@1,@3));}
	| e '|=' e		{$$ = new Assign($1, $3, '|', new Location(@1,@3));}
	| e '^=' e		{$$ = new Assign($1, $3, '^', new Location(@1,@3));}
	| e '<<=' e		{$$ = new Assign($1, $3, '<<', new Location(@1,@3));}
	| e '>>=' e		{$$ = new Assign($1, $3, '>>', new Location(@1,@3));}
	;

variable
	: variable '[' args ']' {$1.extend($3); $$ = $1;}
	| '識別子' {$$ = new Variable(toHalf($1, @1), new Location(@1, @1));}
	| UNDEFINED	{$$ = new UNDEFINED([yytext], new Location(@1,@1));}
	;

slice
	: ':' {$$ = new SliceValue([new NullValue(@1), new NullValue(@1)], new Location(@1,@1));}
	| ':' e {$$ = new SliceValue([new NullValue(@1), $2], new Location(@1,@1));}
	| e ':' {$$ = new SliceValue([$1, new NullValue(@1)], new Location(@1,@1));}
	| e ':' e {$$ = new SliceValue([$1, $3], new Location(@1,@3));}
	;

args
	: args 'COMMA' e {$1.push($3);$$ = $1;}
	| args 'COMMA' slice {$1.push($3);$$ = $1;}
	| args 'COMMA' '改行' e {$1.push($4);$$ = $1;}
	| args 'COMMA' '改行' slice {$1.push($4);$$ = $1;}
	| args 'COMMA' '改行' {$$ = $1;}
	| args 'COMMA'  {$$ = $1;}
	| e { $$ = [$1]}
	| slice { $$ = [$1]}
	|   { $$ = []}
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
	| DefineStatement
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

DefineStatement
	: '関数' '識別子' '(' args ')' ':' '改行' statementlist
		{$$ = new DefineStatement($2, $4, $8, new Location(@1, @8));}
	| 'def' '識別子' '(' args ')' ':' '改行' statementlist
		{$$ = new DefineStatement($2, $4, $8, new Location(@1, @8));}

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
	| If ElseIfList %prec ELSE_PREC
		{var tmp = [$1]; 
		tmp = tmp.concat($2); 
		$$ = new If(tmp, new Location(@1, @2));}
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
	: e 'を' '区間' '[' e 'COMMA' e ']' 'で' e 'ずつ' '増やしながら' ':' '改行' statementlist
		{$$ = new ForIntervalInc($1, new IntervalValue([$5, $7,'cc'], new Location(@5, @8)), $10, $15, new Location(@1, @15));}
	| e 'を' '区間' '[' e 'COMMA' e ']' 'で' '増やしながら' ':' '改行' statementlist
		{$$ = new ForIntervalInc($1, new IntervalValue([$5, $7,'cc'], new Location(@5, @8)), new IntValue([1], new Location(@1, @1), 1), $13, new Location(@1, @13));}
	| e 'を' '区間' '[' e 'COMMA' e ']' 'で' ':' '改行' statementlist
		{$$ = new ForIntervalInc($1, new IntervalValue([$5, $7,'cc'], new Location(@5, @8)), new IntValue([1], new Location(@1, @1), 1), $12, new Location(@1, @12));}
	| e 'を' '区間' '[' e 'COMMA' e ')' 'で' e 'ずつ' '増やしながら' ':' '改行' statementlist
		{$$ = new ForIntervalInc($1, new IntervalValue([$5, $7,'co'], new Location(@5, @8)), $10, $15, new Location(@1, @15));}
	| e 'を' '区間' '[' e 'COMMA' e ')' 'で' '増やしながら' ':' '改行' statementlist
		{$$ = new ForIntervalInc($1, new IntervalValue([$5, $7,'co'], new Location(@5, @8)), new IntValue([1], new Location(@1, @1), 1), $13, new Location(@1, @13));}
	| e 'を' '区間' '[' e 'COMMA' e ')' 'で' ':' '改行' statementlist
		{$$ = new ForIntervalInc($1, new IntervalValue([$5, $7,'co'], new Location(@5, @8)), new IntValue([1], new Location(@1, @1), 1), $12, new Location(@1, @12));}	
	| e 'を' '区間' '(' e 'COMMA' e ']' 'で' e 'ずつ' '増やしながら' ':' '改行' statementlist
		{$$ = new ForIntervalInc($1, new IntervalValue([$5, $7,'oc'], new Location(@5, @8)), $10, $15, new Location(@1, @15));}
	| e 'を' '区間' '(' e 'COMMA' e ']' 'で' '増やしながら' ':' '改行' statementlist
		{$$ = new ForIntervalInc($1, new IntervalValue([$5, $7,'oc'], new Location(@5, @8)), new IntValue([1], new Location(@1, @1), 1), $13, new Location(@1, @13));}
	| e 'を' '区間' '(' e 'COMMA' e ']' 'で' ':' '改行' statementlist
		{$$ = new ForIntervalInc($1, new IntervalValue([$5, $7,'oc'], new Location(@5, @8)), new IntValue([1], new Location(@1, @1), 1), $12, new Location(@1, @12));}
	| e 'を' '区間' '(' e 'COMMA' e ')' 'で' e 'ずつ' '増やしながら' ':' '改行' statementlist
		{$$ = new ForIntervalInc($1, new IntervalValue([$5, $7,'oo'], new Location(@5, @8)), $10, $15, new Location(@1, @15));}
	| e 'を' '区間' '(' e 'COMMA' e ')' 'で' '増やしながら' ':' '改行' statementlist
		{$$ = new ForIntervalInc($1, new IntervalValue([$5, $7,'oo'], new Location(@5, @8)), new IntValue([1], new Location(@1, @1), 1), $13, new Location(@1, @13));}
	| e 'を' '区間' '(' e 'COMMA' e ')' 'で' ':' '改行' statementlist
		{$$ = new ForIntervalInc($1, new IntervalValue([$5, $7,'oo'], new Location(@5, @8)), new IntValue([1], new Location(@1, @1), 1), $12, new Location(@1, @12));}
	| e 'を' '区間' '[' e 'COMMA' e ']' 'で' e 'ずつ' '減らしながら' ':' '改行' statementlist
		{$$ = new ForIntervalDec($1, new IntervalValue([$5, $7,'cc'], new Location(@5, @8)), $10, $15, new Location(@1, @15));}
	| e 'を' '区間' '[' e 'COMMA' e ']' 'で' '減らしながら' ':' '改行' statementlist
		{$$ = new ForIntervalDec($1, new IntervalValue([$5, $7,'cc'], new Location(@5, @8)), new IntValue([1], new Location(@1, @1), 1), $13, new Location(@1, @13));}
	| e 'を' '区間' '[' e 'COMMA' e ')' 'で' e 'ずつ' '減らしながら' ':' '改行' statementlist
		{$$ = new ForIntervalDec($1, new IntervalValue([$5, $7,'co'], new Location(@5, @8)), $10, $15, new Location(@1, @15));}
	| e 'を' '区間' '[' e 'COMMA' e ')' 'で' '減らしながら' ':' '改行' statementlist
		{$$ = new ForIntervalDec($1, new IntervalValue([$5, $7,'co'], new Location(@5, @8)), new IntValue([1], new Location(@1, @1), 1), $13, new Location(@1, @13));}
	| e 'を' '区間' '(' e 'COMMA' e ']' 'で' e 'ずつ' '減らしながら' ':' '改行' statementlist
		{$$ = new ForIntervalDec($1, new IntervalValue([$5, $7,'oc'], new Location(@5, @8)), $10, $15, new Location(@1, @15));}
	| e 'を' '区間' '(' e 'COMMA' e ']' 'で' '減らしながら' ':' '改行' statementlist
		{$$ = new ForIntervalDec($1, new IntervalValue([$5, $7,'oc'], new Location(@5, @8)), new IntValue([1], new Location(@1, @1), 1), $13, new Location(@1, @13));}
	| e 'を' '区間' '(' e 'COMMA' e ')' 'で' e 'ずつ' '減らしながら' ':' '改行' statementlist
		{$$ = new ForIntervalDec($1, new IntervalValue([$5, $7,'oo'], new Location(@5, @8)), $10, $15, new Location(@1, @15));}
	| e 'を' '区間' '(' e 'COMMA' e ')' 'で' '減らしながら' ':' '改行' statementlist
		{$$ = new ForIntervalDec($1, new IntervalValue([$5, $7,'oo'], new Location(@5, @8)), new IntValue([1], new Location(@1, @1), 1), $13, new Location(@1, @13));}

	| e 'を' e 'から' e 'まで' e 'ずつ' '増やしながら' ':' '改行' statementlist
		{$$ = new ForInc($1, $3, $5, $7,$12, new Location(@1,@11));}
	| e 'を' e 'から' e 'まで' e 'ずつ' '減らしながら' ':' '改行' statementlist
		{$$ = new ForDec($1, $3, $5, $7,$12, new Location(@1,@11));}
	| e 'を' e 'から' e 'まで' '増やしながら' ':' '改行' statementlist
		{$$ = new ForInc($1, $3, $5, new IntValue([1], new Location(@1, @1), 1),$10, new Location(@1,@9));}
	| e 'を' e 'から' e 'まで' '減らしながら' ':' '改行' statementlist
		{$$ = new ForDec($1, $3, $5, new IntValue([1], new Location(@1, @1), 1),$10, new Location(@1,@9));}
	| e 'の要素' e 'について' ':' '改行' statementlist
		{$$ = new ForIn($1, $3, $7, new Location(@1,@7));}
	| 'for' e 'in' e ':' '改行' statementlist
		{$$ = new ForIn($4, $2, $7, new Location(@1,@7));}
	;

WhileStatement
	: e 'の間' ':' '改行' statementlist
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
