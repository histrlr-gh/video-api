FROM node:18

# FFmpegインストール、フォントパッケージ（fonts-dejavu）を明示的にインストール
RUN apt-get update && apt-get install -y ffmpeg
RUN apt-get update && apt-get install -y ffmpeg fonts-dejavu && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
