const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });

// アップロード＆動画生成
app.post("/generate", upload.single("video"), (req, res) => {

  const inputPath = req.file.path;
  const outputPath = `output_${Date.now()}.mp4`;

  const title = req.body.title || "";
  const subtitle = req.body.subtitle || "";

  ffmpeg(inputPath)
    .videoFilters([
      {
        filter: "drawtext",
        options: {
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
          text: subtitle,
          fontsize: 36,
          fontcolor: "white",
          x: 50,
          y: "h-150"
        }
      }
    ])
    .on("end", () => {
      res.download(outputPath);
    })
    .on("error", (err) => {
      console.error(err);
      res.status(500).send("Error");
    })
    .save(outputPath);
});

app.listen(3000, () => console.log("Server running"));