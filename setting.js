var setting = 
{
    zenkaku_mode: 2,
    // 変数名や数値，数値の入力で全角が使われた場合の処理
    // 0 内部的に強制的に半角に直してエラーを出さない
    // 1 エラーを出して停止する
    // 2 何もしない

    quiz_mode: 1,
    // 問題を表示するかどうか
    // 0 表示しない
    // 1 表示する

    graphic_command: 0,
    // グラフィックコマンドが英語か日本語か
    // 0 日本語
    // 1 英語

    builtin_function: [
        "common",
        "extra",
        "fileio",
        "graphic",
        "math",
        "sound"
    ],
    // 読み込む組み込み関数定義ファイル

    flowchart_mode: 0,
    // 起動時にフローチャートを表示するかどうか
    // 0 表示しない
    // 1 表示する
};
