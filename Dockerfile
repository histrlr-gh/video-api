FROM node:18

RUN apt-get update && apt-get install -y \
  ffmpeg \
  fonts-noto-cjk \
  && apt-get clean

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# 出力ディレクトリ作成
RUN mkdir -p /app/outputs

EXPOSE 3000

CMD ["node", "index.js"]
