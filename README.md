# FFmpeg GUI Tool

Electron製のシンプルなGUIツールです。FFmpegを用いて動画のトリミング・変換・音声抽出・GIF作成などをGUIで行えます。

---

## 🔧 主な機能

- 動画のトリミング（開始時間・終了時間を指定）
- 解像度変更、フォーマット変換（MP4 / WebM / AVI / MOV / GIF / MP3）
- ビットレート、フレームレート、CRF値の指定
- 音声抽出、GIF変換モードの切り替え
- FFmpeg任意引数の追加入力
- 動画プレビューと「この位置を開始/終了に設定」機能
- Twitter / YouTube向けなどプリセット設定付き

---

## 🚀 セットアップ方法

1. Node.js をインストール（https://nodejs.org）
2. 本リポジトリをクローンまたはダウンロード
3. 以下のコマンドを実行：

```bash
npm install
npm start
```

---

## 🧪 プリセットの使い方

画面上部にあるプリセットボタンで、よく使う設定を一発で適用できます：

| プリセット名   | 内容                                         |
|----------------|----------------------------------------------|
| Twitter用       | 1280x720, MP4, 2500kbps, CRF 28               |
| YouTube用       | 1920x1080, MP4, 5000kbps, CRF 23              |
| 軽量GIF         | 480x270, GIF形式, 音声なし                   |
| 音声抽出        | MP3形式で音声のみ出力                        |

---

## 🧱 ビルド方法

### Windows用にビルド（WindowsまたはMacで）

```bash
npm run build:win
```

### Mac用にビルド（※macOSのみ）

```bash
npm run build:mac
```

> 事前に `electron-packager` をインストールしてください：

```bash
npm install --save-dev electron-packager
```

---

## 📁 フォルダ構成

```
ffmpeg-gui-electron/
├── index.html         # GUIレイアウト
├── style.css          # スタイル
├── renderer.js        # フロントロジック
├── main.js            # Electronメインプロセス
├── preload.js         # Preload（未使用）
├── package.json       # 依存とビルドスクリプト
└── README.md          # ← このファイル
```

---

## 📝 ライセンス

MIT

---

## 🙋 サポート・改善リクエスト

バグ報告・機能提案などお気軽にどうぞ！
