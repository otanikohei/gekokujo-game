# オセロゲーム

ブラウザで動作するオセロ（リバーシ）ゲームです。

## 特徴

- 足軽 vs 殿さま
- 8x8標準ボード
- リアルタイムスコア表示
- 有効手のハイライト表示
- レスポンシブデザイン

## プレイ方法

1. [GitHub Pages](https://your-username.github.io/othello-game) でプレイ
2. または、ローカルで実行:
   ```bash
   python -m http.server 8000
   ```
   ブラウザで `http://localhost:8000` を開く

## 技術スタック

- HTML5
- CSS3 (Grid, Flexbox, アニメーション)
- Vanilla JavaScript (ES6+)

## ゲームルール

- 足軽（プレイヤー）と殿さま（AI）で対戦
- 相手の顔を挟んで裏返す
- 顔の数が多い方が勝利