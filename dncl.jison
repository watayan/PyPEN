/* by watayan <watayan@watayan.net> */

%lex

DecimalDigit	[0-9]
NonZeroDigit	[1-9]

IdentifierStart [a-zA-Z]
IdentifierPart	[a-zA-Z0-9]
Identifier		{IdentifierStart}{IdentifierPart}*

Integer			[0] | ({NonZeroDigit}{DecimalDigit}*)
Float			{Integer}"."{DecimalDigit}+
String			"「"[^」]*"」"
Comma			[，,、]
Print			"表示"|"印刷"|"出力"
Whitespace		[\s\t 　|｜]
NEWLINE			\r\n|\r|\n
UNDEFINED		"《"[^》]*"》"

%%

"true"			{return 'true';}
"false"			{return 'false';}
{String}		{return 'STRING';}
{Float}			{return 'FLOAT';}
{Integer}		{return 'INTEGER';}
{Identifier}	{return 'IDENTIFIER';}
{UNDEFINED}		{return 'UNDEFINED';}
","					{return ',';}
"+"					{return '+';}
"＋"				{return '+';}
"-"					{return '-';}
"ー"				{return '-';}
"*"					{return '*';}
"＊"				{return '*';}
"✕"					{return '*';}
"/"					{return '/';}
"／"				{return '/';}
"÷"				{return '/';}
"%"					{return '%';}
"％"				{return '%';}
"("					{return '(';}
")"					{return ')';}
"["					{return '[';}
"]"					{return ']';}
">="				{return '>=';}
"<="				{return '<=';}
">"					{return '>';}
"<"					{return '<';}
"="					{return '=';}
"!="				{return '!=';}
"←"					{return '<-';}
"かつ"				{return 'AND';}
"または"				{return 'OR';}
"でない"				{return 'NOT';}
"を"{Print}"する"			{return 'PRINTLN';}
"を改行無しで"{Print}"する"	{return 'PRINT';}
"を改行なしで"{Print}"する"	{return 'PRINT';}
"を入力する"			{return 'INPUT';}
"もし"				{return 'IF';}
"ならば"			{return 'THEN';}
"を実行し"{Comma}"そうでなければ"			{return 'ELSE';}
"を実行する"			{return 'ENDIF';}
"を実行"			{return 'ENDIF';}
"の間"{Comma}			{return 'WHILE';}
"繰り返し"{Comma}			{return 'LOOP';}
"繰返し"{Comma}			{return 'LOOP';}
"を"{Comma}			{return 'UNTIL1';}
"になるまで実行する"	{return 'UNTIL2';}
"になるまで実行"		{return 'UNTIL2';}	
"を繰り返す"			{return 'ENDLOOP';}
"を繰返す"			{return 'ENDLOOP';}
"を"					{return 'FOR1';}
"から"				{return 'FOR2';}
"まで"				{return 'FOR3';}
"ずつ"				{return 'FOR4';}
"増やしながら"{Comma}		{return 'FORINC';}
"減らしながら"{Comma}		{return 'FORDEC';}
"増やしつつ"{Comma}		{return 'FORINC';}
"減らしつつ"{Comma}		{return 'FORDEC';}
"整数"				{return 'DEFINT';}
"実数"				{return 'DEFFLOAT';}
"文字列"				{return 'DEFSTR';}
"真偽"				{return 'DEFBOOL';}
"と"					{return 'APPEND';}
<<EOF>>				{return 'EOF';}
{NEWLINE}				{return 'NEWLINE';}
{Whitespace}		/* skip whitespace */

/lex

%left APPEND
%left AND OR
%right NOT
%nonassoc '=' '!=' '>' '<' '>=' '<='
%left '+' '-'
%left '*' '/' '%'
%left UMINUS
%
%start Program

%%


e
	: e '+' e	{ $$ = new Add($1, $3, new Location(@1, @3));}
	| e '-' e	{ $$ = new Sub($1, $3, new Location(@1, @3));}
	| e '*' e	{ $$ = new Mul($1, $3, new Location(@1, @3));}
	| e '/' e	{ $$ = new Div($1, $3, new Location(@1, @3));}
	| e '%' e	{ $$ = new Mod($1, $3, new Location(@1, @3));}
	| '-' e		%prec UMINUS { $$ = new Minus($2, new Location(@2, @2));}
	| '(' e ')'	{$$ = $2;}
	| e '=' e			{$$ = new EQ($1, $3, new Location(@1, @3));}
	| e '!=' e			{$$ = new NE($1, $3, new Location(@1, @3));}
	| e '>' e			{$$ = new GT($1, $3, new Location(@1, @3));}
	| e '<' e			{$$ = new LT($1, $3, new Location(@1, @3));}
	| e '>=' e			{$$ = new GE($1, $3, new Location(@1, @3));}
	| e '<=' e			{$$ = new LE($1, $3, new Location(@1, @3));}
	| e 'AND' e	{$$ = new And($1, $3, new Location(@1, @3));}
	| e 'OR' e	{$$ = new Or($1, $3, new Location(@1, @3));}
	| e 'NOT'		{$$ = new Not($1, new Location(@1, @1));}
	| e 'APPEND' e	{$$ = new Append($1, $3, new Location(@1, @3));}
	| INTEGER	{$$ = new IntValue(Number(yytext), new Location(@1,@1));}
	| FLOAT		{$$ = new FloatValue(Number(yytext), new Location(@1,@1));}
	| STRING	{$$ = new StringValue(yytext.substring(1, yytext.length - 1), new Location(@1, @1));}
	| TRUE		{$$ = new BooleanValue(true, new Location(@1,@1));}
	| FALSE		{$$ = new BooleanValue(false, new Location(@1,@1));}
	| IDENTIFIER'('parameterlist')'
				{$$ = new CallFunction($1, $3, new Location(@1,@1));}
	| variable
	;

variable
	: IDENTIFIER'['parameterlist']'
			{$$ = new Variable($1, $3, new Location(@1,@1));}
	| IDENTIFIER{$$ = new Variable($1, null, new Location(@1, @1));}
	| UNDEFINED	{$$ = new UNDEFINED(new Location(@1,@1));}
	;
	
variablelist
	: variablelist ',' IDENTIFIER '['parameterlist']' {$$ = $1.concat({varname:$3, parameter:$5});}
	| variablelist ',' IDENTIFIER {$$ = $1.concat({varname:$3});}
	| IDENTIFIER'['parameterlist']' {$$ = [{varname:$1, parameter:$3}];}
	| IDENTIFIER {$$ = [{varname:$1}];}
	| UNDEFINED  {$$ = [new UNDEFINED(new Location(@1,@1))];}
	;

parameterlist
	: parameterlist ',' e {$$ = $1.concat($3);}
	| e { $$ = [$1];}
	|   { $$ = [];}
	;

statementlist
	: statementlist statement	{ if($2 != null) $$ = $1.concat($2);}
	| 	{$$ = [];}
	;

statement
	:EmptyStatement
	|DefineStatement
	|IfStatement
	|ForStatement
	|LoopStatement
	|WhileStatement
	|AssignStatement
	|PrintStatement
	|InputStatement
	;

EmptyStatement
	: 'NEWLINE'	{ $$ = null;}
	;

DefineStatement
	: DEFINT variablelist 'NEWLINE'		{$$ = new DefinitionInt($2, new Location(@1,@2));}
	| DEFFLOAT variablelist 'NEWLINE'	{$$ = new DefinitionFloat($2, new Location(@1,@2));}
	| DEFSTR variablelist 'NEWLINE'		{$$ = new DefinitionString($2, new Location(@1,@2));}
	| DEFBOOL variablelist 'NEWLINE'	{$$ = new DefinitionBoolean($2, new Location(@1,@2));}
	;

IfStatement
	: 'IF' e 'THEN' 'NEWLINE' statementlist 'ENDIF' 'NEWLINE'
	{
		$$ = new If($2,$5,null, new Location(@1, @6));
	}
	| 'IF' e 'THEN' 'NEWLINE' statementlist 'ELSE' 'NEWLINE' statementlist 'ENDIF' 'NEWLINE'
	{
		$$ = new If($2,$5,$8, new Location(@1, @9));
	}
	;

ForStatement
	: variable 'FOR1' e 'FOR2' e 'FOR3' e 'FOR4' 'FORINC' 'NEWLINE' statementlist 'ENDLOOP' 'NEWLINE'
		{$$ = new ForInc($1, $3, $5, $7,$11, new Location(@1,@12));}
	| variable 'FOR1' e 'FOR2' e 'FOR3' e 'FOR4' 'FORDEC' 'NEWLINE' statementlist 'ENDLOOP' 'NEWLINE'
		{$$ = new ForDec($1, $3, $5, $7,$11, new Location(@1,@12));}
	| variable 'FOR1' e 'FOR2' e 'FOR3' 'FORINC' 'NEWLINE' statementlist 'ENDLOOP' 'NEWLINE'
		{$$ = new ForInc($1, $3, $5, new IntValue(1, new Location(@1, @1)),$9, new Location(@1,@10));}
	| variable 'FOR1' e 'FOR2' e 'FOR3' 'FORDEC' 'NEWLINE' statementlist 'ENDLOOP' 'NEWLINE'
		{$$ = new ForDec($1, $3, $5, new IntValue(1, new Location(@1, @1)),$9, new Location(@1,@10));}
	;

LoopStatement
	: 'LOOP' 'NEWLINE' statementlist 'UNTIL1' e 'UNTIL2' 'NEWLINE'
		{$$ = new Until($3, $5, new Location(@1, @7));}
	;

WhileStatement
	: e 'WHILE' 'NEWLINE' statementlist 'ENDLOOP' 'NEWLINE'
		{$$ = new While($1, $4, new Location(@1, @6));}
	;


AssignStatement
	: variable '<-' e 'NEWLINE'		{$$ = new Assign($1, $3, new Location(@1,@3));}
	;

PrintStatement
	: e 'PRINT' 'NEWLINE' {$$ = new Output($1, false, new Location(@1,@2));}
	| e 'PRINTLN' 'NEWLINE' {$$ = new Output($1, true, new Location(@1,@2));}
	;

InputStatement
	: variable 'INPUT' 'NEWLINE'	{$$ = new Input($1, new Location(@1, @2));}
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
	:statement
	;
