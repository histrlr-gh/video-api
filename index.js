const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.static(__dirname)); // ★追加

app.post("/generate", upload.single("video"), (req, res) => {

  console.log("リクエスト受信");

  const inputPath = req.file.path;
  const outputFileName = `output_${Date.now()}.mp4`;
  const outputPath = __dirname + "/" + outputFileName;

  ffmpeg(inputPath)
    .on("end", () => {

      console.log("動画生成完了");

      // URL返す
      res.json({
        url: `https://video-api-1-nvo2.onrender.com/${outputFileName}`
      });
    })
    .on("error", (err) => {
      console.error("FFmpegエラー:", err);
      res.status(500).send(err.message);
    })
    .save(outputPath);
});

app.listen(3000, () => console.log("Server running"));
