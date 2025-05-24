const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const ffmpeg = require("ffmpeg-static");

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 800,
    icon: path.join(__dirname, "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile("index.html");
}

app.whenReady().then(() => {
  createWindow();
});

ipcMain.handle("select-file", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Videos", extensions: ["mp4", "mov", "avi", "mkv"] }],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const inputPath = result.filePaths[0];
  const defaultOutputDir = path.dirname(inputPath);
  return { inputPath, defaultOutputDir };
});

ipcMain.handle("select-output-dir", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.on("start-conversion", (event, args) => {
  const {
    inputFile,
    outputDir,
    outputFilename,
    startTime,
    endTime,
    resolution,
    format,
    videoBitrate,
    audioBitrate,
    audioChannels,
    sampleRate,
    frameRate,
    preset,
    crf,
    audioOnly,
    trimOnly,
    customArgs,
  } = args;

  const ext = format === "gif" ? "gif" : format;
  const baseName = outputFilename || path.parse(inputFile).name + "_converted";
  const outputFile = path.join(outputDir, baseName + "." + ext);

  let ffmpegArgs = ["-y", "-i", inputFile];

  // 時間指定は常に有効
  if (startTime) ffmpegArgs.push("-ss", startTime);
  if (endTime) ffmpegArgs.push("-to", endTime);

  // trimOnly でない場合に変換系を追加
  if (!trimOnly) {
    if (audioOnly && format !== "gif") ffmpegArgs.push("-vn");
    if (resolution) ffmpegArgs.push("-vf", `scale=${resolution}`);
    if (frameRate) ffmpegArgs.push("-r", frameRate);
    if (videoBitrate) ffmpegArgs.push("-b:v", videoBitrate);
    if (audioBitrate) ffmpegArgs.push("-b:a", audioBitrate);
    if (audioChannels) ffmpegArgs.push("-ac", audioChannels);
    if (sampleRate) ffmpegArgs.push("-ar", sampleRate);
    if (preset) ffmpegArgs.push("-preset", preset);
    if (crf) ffmpegArgs.push("-crf", crf);
  }

  // GIFモードのときは音声を必ず除去
  if (format === "gif") {
    ffmpegArgs.push("-an");
  }

  if (customArgs) {
    const extras = customArgs.match(/(?:[^\s"]+|"[^"]*")+/g);
    if (extras) ffmpegArgs.push(...extras);
  }

  ffmpegArgs.push(outputFile);

  // ログ出力：コマンドを表示
  event.sender.send(
    "ffmpeg-log",
    "\n実行コマンド:\n" + ["ffmpeg", ...ffmpegArgs].join(" ") + "\n\n"
  );

  const ffmpegProcess = spawn(ffmpeg, ffmpegArgs);

  ffmpegProcess.stderr.on("data", (data) => {
    event.sender.send("ffmpeg-log", data.toString());
  });

  ffmpegProcess.on("close", (code) => {
    event.sender.send("ffmpeg-done", code === 0 ? outputFile : null);
  });
});
