const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

const app = express();

// ===== フォルダ準備 =====
const uploadDir = path.join(__dirname, "uploads");
const outputDir = path.join(__dirname, "outputs");

[uploadDir, outputDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ===== multer設定 =====
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB上限
});

// ===== 静的ファイル公開（outputs フォルダを公開）=====
app.use("/outputs", express.static(outputDir));

// ===== ヘルスチェック（Renderのスリープ対策確認用）=====
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ===== ログ =====
app.use((req, res, next) => {
  console.log("アクセス:", req.method, req.url);
  next();
});

// ===== 日本語フォントパス =====
const FONT_PATH = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc";

// ===== メイン処理 =====
app.post("/generate", upload.single("video"), (req, res) => {
  console.log("リクエスト受信");

  if (!req.file) {
    return res.status(400).json({ error: "ファイルなし" });
  }

  const inputPath = req.file.path;
  const outputFileName = `output_${Date.now()}.mp4`;
  const outputPath = path.join(outputDir, outputFileName);

  // テキストのエスケープ（FFmpeg用：コロンやシングルクォートを処理）
  const escapeText = (text) => {
    return (text || "").replace(/\\/g, "\\\\")
                       .replace(/'/g, "\\'")
                       .replace(/:/g, "\\:");
  };

  const title    = escapeText(req.body.title);
  const subtitle = escapeText(req.body.subtitle);

  console.log("タイトル:", title);
  console.log("テロップ:", subtitle);
  console.log("入力:", inputPath);
  console.log("出力:", outputPath);

  ffmpeg(inputPath)
    .videoFilters([
      // タイトル（上部・背景付き）
      {
        filter: "drawbox",
        options: {
          x: 0, y: 0,
          width: "iw",
          height: 80,
          color: "black@0.6",
          t: "fill"
        }
      },
      {
        filter: "drawtext",
        options: {
          fontfile: FONT_PATH,
          text: title,
          fontsize: 40,
          fontcolor: "white",
          x: "(w-text_w)/2",
          y: 20
        }
      },
      // テロップ（下部・背景付き）
      {
        filter: "drawbox",
        options: {
          x: 0,
          y: "ih-90",
          width: "iw",
          height: 90,
          color: "black@0.6",
          t: "fill"
        }
      },
      {
        filter: "drawtext",
        options: {
          fontfile: FONT_PATH,
          text: subtitle,
          fontsize: 32,
          fontcolor: "white",
          x: 30,
          y: "h-65"
        }
      }
    ])
.outputOptions([
  "-c:v libx264",
  "-preset fast",
  "-crf 23",
  "-c:a aac",
  "-ac 2",
  "-ar 44100",
  "-af aresample=async=1",
  "-movflags +faststart",
  "-max_muxing_queue_size 1024"  // ← 追加：キュー詰まり対策
])
    .on("start", (cmd) => {
      console.log("FFmpeg開始:", cmd);
    })
    .on("end", () => {
      console.log("動画生成完了:", outputPath);

      // アップロードした元ファイルを削除
      fs.unlink(inputPath, () => {});

      if (!fs.existsSync(outputPath)) {
        return res.status(500).json({ error: "出力ファイルが見つかりません" });
      }

      const fileUrl = `https://video-api-1-nvo2.onrender.com/outputs/${outputFileName}`;
      console.log("URL:", fileUrl);
      return res.json({ url: fileUrl });
    })
    .on("error", (err, stdout, stderr) => {
      console.error("FFmpegエラー:", err.message);
      console.error("stderr:", stderr);
      fs.unlink(inputPath, () => {});
      return res.status(500).json({ error: err.message, detail: stderr });
    })
    .save(outputPath);
});

// ===== サーバー起動 =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
