/* by watayan <watayan@watayan.net> */

%{
	function toHalf(s)
	{
		return s.replace(/[Ａ-Ｚａ-ｚ０-９．−]/g, function(s) {
			return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);}
		);
	}
%}


%lex

DecimalDigit	[0-9０-９]
NonZeroDigit	[1-9１-９]

IdentifierStart [a-zA-Zａ-ｚＡ-Ｚ]
IdentifierPart	[a-zA-Z0-9ａ-ｚＡ-Ｚ０-９]
Identifier		{IdentifierStart}{IdentifierPart}*

Integer			[0０] | ({NonZeroDigit}{DecimalDigit}*)
Float			{Integer}[.．]{DecimalDigit}+
String			"「"[^」]*"」"|"｢"[^｣]*"｣"|"\""[^"]*"\""
Comma			[，,、]
Print			"表示"|"印刷"|"出力"
Whitespace		[\s\t 　|｜]
NEWLINE			\r\n|\r|\n
UNDEFINED		"《"[^》]*"》"

%%

"真偽"				{return '真偽';}
"true"			{return 'TRUE';}
"TRUE"			{return 'TRUE';}
"真"				{return 'TRUE';}
"false"			{return 'FALSE';}
"FALSE"			{return 'FALSE';}
"偽"				{return 'FALSE';}
{String}		{return '文字列値';}
{Float}			{return '実数値';}
{Integer}		{return '整数値';}
{Comma}					{return 'COMMA';}
{UNDEFINED}		{return 'UNDEFINED';}
"+"					{return '+';}
"＋"				{return '+';}
"-"					{return '-';}
"ー"				{return '-';}
"−"					{return '-';}
"*"					{return '*';}
"＊"				{return '*';}
"✕"					{return '*';}
"/"					{return '/';}
"／"				{return '/';}
"÷"				{return '÷';}
"%"					{return '%';}
"％"				{return '%';}
"("					{return '(';}
")"					{return ')';}
"（"					{return '(';}
"）"					{return ')';}
"["					{return '[';}
"]"					{return ']';}
"［"					{return '[';}
"］"					{return ']';}
"{"					{return '{';}
"}"					{return '}';}
"｛"					{return '{';}
"｝"					{return '}';}
">="				{return '>=';}
"<="				{return '<=';}
"≧"				{return '>=';}
"≦"				{return '<=';}
"＞＝"			{return '>=';}
"＜＝"			{return '<=';}
">"					{return '>';}
"<"					{return '<';}
"＞"					{return '>';}
"＜"					{return '<';}
"="					{return '=';}
"＝"					{return '=';}
"!="				{return '!=';}
"≠"						{return '!=';}
"！＝"					{return '!=';}
"←"						{return '←';}
"かつ"					{return 'かつ';}
"または"				{return 'または';}
"でない"				{return 'でない';}
"を"{Print}"する"		{return 'を表示する';}
"を改行無しで"{Print}"する"	{return 'を改行無しで表示する';}
"を改行なしで"{Print}"する"	{return 'を改行無しで表示する';}
"を入力する"			{return 'を入力する';}
"もし"					{return 'もし';}
"ならば"				{return 'ならば';}
"を実行し"{Comma}"そうでなければ"			{return 'を実行し，そうでなければ';}
"を実行する"			{return 'を実行する';}
"を実行"				{return 'を実行する';}
"の間"{Comma}			{return 'の間，';}
"の間"					{return 'の間，';}
"繰り返しを抜ける"		{return '繰り返しを抜ける';}
"繰返しを抜ける"		{return '繰り返しを抜ける';}
"くりかえしを抜ける"	{return '繰り返しを抜ける';}
"繰り返し"{Comma}		{return '繰り返し，';}
"繰返し"{Comma}			{return '繰り返し，';}
"くりかえし"{Comma}		{return '繰り返し，';}
"繰り返し"				{return '繰り返し，';}
"繰返し"				{return '繰り返し，';}
"くりかえし"			{return '繰り返し，';}
"を"{Comma}				{return 'を，';}
"になるまで実行する"	{return 'になるまで実行する';}
"になるまで実行"		{return 'になるまで実行する';}
"を繰り返す"			{return 'を繰り返す';}
"を繰返す"				{return 'を繰り返す';}
"をくりかえす"			{return 'を繰り返す';}
"手続きを抜ける"		{return '手続きを抜ける';}
"手続き終了"			{return '手続き終了';}
"手続き終わり"			{return '手続き終了';}
"手続き"				{return '手続き';}
"関数終了"				{return '関数終了';}
"関数終わり"				{return '関数終了';}
"関数"					{return '関数';}
"を返す"				{return 'を返す';}
"を"					{return 'を';}
"から"				{return 'から';}
"まで"				{return 'まで';}
"ずつ"				{return 'ずつ';}
"増やしながら"{Comma}		{return '増やしながら，';}
"減らしながら"{Comma}		{return '減らしながら，';}
"増やしつつ"{Comma}		{return '増やしながら，';}
"減らしつつ"{Comma}		{return '減らしながら，';}
"増やしながら"		{return '増やしながら，';}
"減らしながら"		{return '減らしながら，';}
"増やしつつ"			{return '増やしながら，';}
"減らしつつ"			{return '減らしながら，';}
"整数"				{return '整数';}
"実数"				{return '実数';}
"文字列"				{return '文字列';}
"と"{Comma}				{return 'と';}
"と"					{return 'と';}
"描画領域開く"		{return 'gOpenWindow';}
"描画領域閉じる"		{return 'gCloseWindow';}
"描画領域全消去"		{return 'gClearWindow';}
"線色設定"				{return 'gSetLineColor';}
"塗色設定"				{return 'gSetFillColor';}
"線太さ設定"				{return 'gSetLineWidth';}
"文字サイズ設定"			{return 'gSetFontSize';}
"文字描画"				{return 'gDrawText';}
"線描画"				{return 'gDrawLine';}
"矩形描画"				{return 'gDrawBox';}
"矩形塗描画"				{return 'gFillBox';}
"円描画"				{return 'gDrawCircle';}
"円塗描画"				{return 'gFillCircle';}
"ミリ秒待つ"				{return 'ミリ秒待つ';}
{Identifier}	{return 'IDENTIFIER';}
<<EOF>>				{return 'EOF';}
{NEWLINE}				{return 'NEWLINE';}
{Whitespace}		/* skip whitespace */

/lex

%left 'と'
%left 'かつ' 'または' 'でない'
%nonassoc '=' '!=' '>' '<' '>=' '<='
%left '+' '-'
%left '*' '/' '÷' '%'
%left UMINUS
%
%start Program

%%

e
	: e '+' e		{$$ = new Add($1, $3, new Location(@1, @3));}
	| e '-' e		{$$ = new Sub($1, $3, new Location(@1, @3));}
	| e '*' e		{$$ = new Mul($1, $3, new Location(@1, @3));}
	| e '/' e		{$$ = new Div($1, $3, new Location(@1, @3));}
	| e '÷' e		{$$ = new Div2($1, $3, new Location(@1, @3));}
	| e '%' e		{$$ = new Mod($1, $3, new Location(@1, @3));}
	| '-' e		%prec UMINUS { $$ = new Minus($2, new Location(@2, @2));}
	| '(' e ')'		{$$ = $2;}
	| e '=' e		{$$ = new EQ($1, $3, new Location(@1, @3));}
	| e '!=' e		{$$ = new NE($1, $3, new Location(@1, @3));}
	| e '>' e		{$$ = new GT($1, $3, new Location(@1, @3));}
	| e '<' e		{$$ = new LT($1, $3, new Location(@1, @3));}
	| e '>=' e		{$$ = new GE($1, $3, new Location(@1, @3));}
	| e '<=' e		{$$ = new LE($1, $3, new Location(@1, @3));}
	| e 'かつ' e	{$$ = new And($1, $3, new Location(@1, @3));}
	| e 'または' e	{$$ = new Or($1, $3, new Location(@1, @3));}
	| e 'でない'	{$$ = new Not($1, new Location(@1, @1));}
	| e 'と' e		{$$ = new Append($1, $3, new Location(@1, @3));}
	| '整数値'		{$$ = new IntValue(Number(toHalf(yytext)), new Location(@1,@1));}
	| '実数値'		{$$ = new FloatValue(Number(toHalf(yytext)), new Location(@1,@1));}
	| '文字列値'	{$$ = new StringValue(yytext.substring(1, yytext.length - 1), new Location(@1, @1));}
	| 'TRUE'		{$$ = new BooleanValue(true, new Location(@1,@1));}
	| 'FALSE'		{$$ = new BooleanValue(false, new Location(@1,@1));}
	| IDENTIFIER '(' args ')' {$$ = new CallFunction($1, $3, new Location(@1,@1));}
	| variable
	| '[' args ']' {$$ = new ArrayValue($2, new Location(@1, @3));}
	| '{' args '}' {$$ = new ArrayValue($2, new Location(@1, @3));}
	;

variable
	: IDENTIFIER '[' args ']' {$$ = new Variable(toHalf($1), new ArrayValue($3), new Location(@1,@1));}
	| IDENTIFIER{$$ = new Variable(toHalf($1), null, new Location(@1, @1));}
	| UNDEFINED	{$$ = new UNDEFINED(yytext, new Location(@1,@1));}
	;

variablelist
	: variablelist 'COMMA' IDENTIFIER '[' args ']' {$$ = $1.concat({varname:toHalf($3), parameter:new ArrayValue($5, new Location(@5,@5))});}
	| variablelist 'COMMA' IDENTIFIER {$$ = $1.concat({varname:toHalf($3)});}
	| IDENTIFIER'[' args ']' {$$ = [{varname:toHalf($1), parameter:new ArrayValue($3, new Location(@3,@3))}];}
	| IDENTIFIER {$$ = [{varname:toHalf($1)}];}
	| UNDEFINED  {$$ = [new UNDEFINED(yytext, new Location(@1,@1))];}
	;

args
	: args 'COMMA' e {$$ = $1.concat($3);}
	| e { $$ = [$1];}
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
	| LoopStatement
	| IfStatement
	| SleepStatement
	| DefineFuncStatement
	| ReturnStatement
	;

EmptyStatement
	: 'NEWLINE'	{$$ = null;}
	;

DefineFuncStatement
	: '手続き' IDENTIFIER '(' args ')' 'NEWLINE' statementlist '手続き終了' 'NEWLINE'
		{$$ = new DefineStep($2, $4, $7, new Location(@1, @8));}
	| '関数' IDENTIFIER '(' args ')' 'NEWLINE' statementlist '関数終了' 'NEWLINE'
		{$$ = new DefineFunction($2, $4, $7, new Location(@1, @8));}
	;

ReturnStatement
	: '手続きを抜ける' 'NEWLINE' {$$ = new ExitStatement(new Location(@1,@1));}
	| e 'を返す' 'NEWLINE' {$$ = new ReturnStatement($1, new Location(@1, @2));}
	;

DefineStatement
	: '整数' variablelist 'NEWLINE'		{$$ = new DefinitionInt($2, new Location(@1,@2));}
	| '実数' variablelist 'NEWLINE'	{$$ = new DefinitionFloat($2, new Location(@1,@2));}
	| '文字列' variablelist 'NEWLINE'		{$$ = new DefinitionString($2, new Location(@1,@2));}
	| '真偽' variablelist 'NEWLINE'	{$$ = new DefinitionBoolean($2, new Location(@1,@2));}
	;

CallStatement
	: IDENTIFIER '(' args ')' 'NEWLINE' {$$ = new CallStep($1, $3, new Location(@1,@4));}
	;

IfStatement
	: 'もし' e 'ならば' 'NEWLINE' statementlist 'を実行する' 'NEWLINE'
	{$$ = new If($2,$5,null, new Location(@1, @6));}
	| 'もし' e 'ならば' 'NEWLINE' statementlist 'を実行し，そうでなければ' 'NEWLINE' statementlist 'を実行する' 'NEWLINE'
	{$$ = new If($2,$5,$8, new Location(@1, @9));}
	;

ForStatement
	: variable 'を' e 'から' e 'まで' e 'ずつ' '増やしながら，' 'NEWLINE' statementlist 'を繰り返す' 'NEWLINE'
		{$$ = new ForInc($1, $3, $5, $7,$11, new Location(@1,@12));}
	| variable 'を' e 'から' e 'まで' e 'ずつ' '減らしながら，' 'NEWLINE' statementlist 'を繰り返す' 'NEWLINE'
		{$$ = new ForDec($1, $3, $5, $7,$11, new Location(@1,@12));}
	| variable 'を' e 'から' e 'まで' '増やしながら，' 'NEWLINE' statementlist 'を繰り返す' 'NEWLINE'
		{$$ = new ForInc($1, $3, $5, new IntValue(1, new Location(@1, @1)),$9, new Location(@1,@10));}
	| variable 'を' e 'FOR2' e 'まで' '減らしながら，' 'NEWLINE' statementlist 'を繰り返す' 'NEWLINE'
		{$$ = new ForDec($1, $3, $5, new IntValue(1, new Location(@1, @1)),$9, new Location(@1,@10));}
	;

LoopStatement
	: '繰り返し，' 'NEWLINE' statementlist 'を，' e 'になるまで実行する' 'NEWLINE'
		{$$ = new Until($3, $5, new Location(@1, @6));}
	| '繰り返し，' 'NEWLINE' statementlist 'を' e 'になるまで実行する' 'NEWLINE'
		{$$ = new Until($3, $5, new Location(@1, @6));}
	;

WhileStatement
	: e 'の間，' 'NEWLINE' statementlist 'を繰り返す' 'NEWLINE'
		{$$ = new While($1, $4, new Location(@1, @5));}
	;


AssignStatement
	: variable '←' e 'NEWLINE'		{$$ = new Assign($1, $3, new Location(@1,@3));}
	;

PrintStatement
	: e 'を改行無しで表示する' 'NEWLINE' {$$ = new Output($1, false, new Location(@1,@2));}
	| e 'を表示する' 'NEWLINE' {$$ = new Output($1, true, new Location(@1,@2));}
	;

InputStatement
	: variable 'を入力する' 'NEWLINE'	{$$ = new Input($1, new Location(@1, @2));}
	;

GraphicStatement
	: 'gOpenWindow' '(' e 'COMMA' e ')'	'NEWLINE'{$$ = new GraphicStatement('gOpenWindow', [$3,$5], new Location(@1, @1));}
	| 'gCloseWindow' '(' ')' 'NEWLINE'	{$$ = new GraphicStatement('gCloseWindow', [], new Location(@1,@1));}
	| 'gClearWindow' '(' ')' 'NEWLINE'	{$$ = new GraphicStatement('gClearWindow', [], new Location(@1,@1));}
	| 'gSetLineColor' '(' e 'COMMA' e 'COMMA' e ')' 'NEWLINE'{$$ = new GraphicStatement('gSetLineColor', [$3,$5,$7], new Location(@1, @1));}
	| 'gSetFillColor' '(' e 'COMMA' e 'COMMA' e ')' 'NEWLINE'{$$ = new GraphicStatement('gSetFillColor', [$3,$5,$7], new Location(@1, @1));}
	| 'gSetLineWidth' '(' e ')' 'NEWLINE'{$$ = new GraphicStatement('gSetLineWidth', [$3], new Location(@1, @1));}
	| 'gSetFontSize' '(' e ')' 'NEWLINE'{$$ = new GraphicStatement('gSetFontSize', [$3], new Location(@1, @1));}
	| 'gDrawText' '(' e 'COMMA' e 'COMMA' e ')' 'NEWLINE'{$$ = new GraphicStatement('gDrawText', [$3,$5,$7], new Location(@1,@1));}
	| 'gDrawLine' '(' e 'COMMA' e 'COMMA' e 'COMMA' e ')' 'NEWLINE'{$$ = new GraphicStatement('gDrawLine', [$3,$5,$7,$9], new Location(@1,@1));}
	| 'gDrawBox' '(' e 'COMMA' e 'COMMA' e 'COMMA' e ')' 'NEWLINE'{$$ = new GraphicStatement('gDrawBox', [$3,$5,$7,$9], new Location(@1,@1));}
	| 'gFillBox' '(' e 'COMMA' e 'COMMA' e 'COMMA' e ')' 'NEWLINE'{$$ = new GraphicStatement('gFillBox', [$3,$5,$7,$9], new Location(@1,@1));}
	| 'gDrawCircle' '(' e 'COMMA' e 'COMMA' e ')' 'NEWLINE'{$$ = new GraphicStatement('gDrawCircle', [$3,$5,$7], new Location(@1,@1));}
	| 'gFillCircle' '(' e 'COMMA' e 'COMMA' e ')' 'NEWLINE'{$$ = new GraphicStatement('gFillCircle', [$3,$5,$7], new Location(@1,@1));}
	;

SleepStatement
	: e 'ミリ秒待つ' 'NEWLINE' {$$ = new SleepStatement($1, new Location(@1, @1));}
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
