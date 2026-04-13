const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/generate", upload.single("video"), (req, res) => {

  console.log("リクエスト受信");

  const inputPath = req.file.path;
  const outputPath = `output_${Date.now()}.mp4`;

  const title = req.body.title || "";
  const subtitle = req.body.subtitle || "";

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
    .on("end", () => {

      console.log("動画生成完了");

      if (!fs.existsSync(outputPath)) {
        return res.status(500).send("動画生成失敗");
      }

      res.download(outputPath);
    })
    .on("error", (err) => {
      console.error("FFmpegエラー:", err);
      res.status(500).send(err.message);
    })
    .save(outputPath);
});

app.listen(3000, () => console.log("Server running"));
