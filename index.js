const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

const app = express();

// ===== フォルダ準備 =====
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ===== multer設定 =====
const upload = multer({ dest: uploadDir });

// ===== 静的ファイル公開（動画URL用）=====
app.use(express.static(__dirname));

// ===== ログ確認用 =====
app.use((req, res, next) => {
  console.log("アクセス:", req.method, req.url);
  next();
});

// ===== メイン処理 =====
app.post("/generate", upload.single("video"), (req, res) => {

  console.log("リクエスト受信");

  // ファイルチェック
  if (!req.file) {
    console.log("ファイルがありません");
    return res.status(400).json({ error: "ファイルなし" });
  }

  const inputPath = req.file.path;
  const outputFileName = `output_${Date.now()}.mp4`;
  const outputPath = path.join(__dirname, outputFileName);

  const title = req.body.title || "";
  const subtitle = req.body.subtitle || "";

  console.log("入力ファイル:", inputPath);
  console.log("出力ファイル:", outputPath);

  ffmpeg(inputPath)
    .videoFilters([
      {
        filter: "drawtext",
        options: {
          fontfile: "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
          text: title,
          fontsize: 48,
          fontcolor: "white",
          x: "(w-text_w)/2",
          y: 50
        }
      },
      {
        filter: "drawbox",
        options: {
          y: "h-200",
          color: "black@0.6",
          width: "iw",
          height: 200,
          t: "fill"
        }
      },
      {
        filter: "drawtext",
        options: {
          fontfile: "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
          text: subtitle,
          fontsize: 36,
          fontcolor: "white",
          x: 50,
          y: "h-150"
        }
      }
    ])
    .on("start", (commandLine) => {
      console.log("FFmpeg開始:", commandLine);
    })
    .on("end", () => {

      console.log("動画生成完了");

      // ファイル存在確認
      if (!fs.existsSync(outputPath)) {
        console.log("出力ファイルが存在しない");
        return res.status(500).json({ error: "動画生成失敗" });
      }

      // URL返却
      const fileUrl = `https://video-api-1-nvo2.onrender.com/${outputFileName}`;

      console.log("返却URL:", fileUrl);

      return res.json({ url: fileUrl });
    })
.on("error", (err, stdout, stderr) => {
  console.error("FFmpegエラー:", err.message);
  console.error("stderr:", stderr);

  return res.status(500).json({
    error: err.message,
    detail: stderr
  });
})
    .save(outputPath);
});

// ===== サーバー起動 =====
app.listen(3000, () => {
  console.log("Server running");
});
