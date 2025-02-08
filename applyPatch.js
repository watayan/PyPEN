const fs = require("fs");
const path = require("path");
const { applyPatch } = require("diff");

// パッチファイルとターゲットファイルのパス
const patchFilePath = path.join(__dirname, "dncl.patch");
const targetFilePath = path.join(__dirname, "dncl.js");

// パッチファイルを読み込む
const patch = fs.readFileSync(patchFilePath, "utf8");

// 変更対象のファイルを読み込む
let originalContent = fs.readFileSync(targetFilePath, "utf8");

// パッチを適用
const patchedContent = applyPatch(originalContent, patch);

if (patchedContent === false) {
    console.error("パッチの適用に失敗しました。");
    process.exit(1);
}

// ファイルを上書き保存
fs.writeFileSync(targetFilePath, patchedContent, "utf8");

console.log("パッチ適用完了: " + targetFilePath);
