const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("select-input-button")
    .addEventListener("click", selectInput);
  document
    .getElementById("select-output-button")
    .addEventListener("click", selectOutput);
  document
    .getElementById("start-button")
    .addEventListener("click", startConversion);
});

async function selectInput() {
  const result = await ipcRenderer.invoke("select-file");
  if (result && result.inputPath) {
    document.getElementById("input-path").innerText = result.inputPath;
    document.getElementById("output-path").innerText = result.defaultOutputDir;
    window.inputFile = result.inputPath;
    window.outputDir = result.defaultOutputDir;

    const video = document.getElementById("preview");
    if (video) {
      video.src = "file://" + result.inputPath;
      video.load();
    }
  }
}

async function selectOutput() {
  const outputPath = await ipcRenderer.invoke("select-output-dir");
  if (outputPath) {
    document.getElementById("output-path").innerText = outputPath;
    window.outputDir = outputPath;
  }
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function getChecked(id) {
  const el = document.getElementById(id);
  return el ? el.checked : false;
}

function setControlsEnabled(enabled) {
  const ids = [
    "select-input-button",
    "select-output-button",
    "start-time",
    "end-time",
    "resolution",
    "format",
    "video-bitrate",
    "audio-bitrate",
    "audio-channels",
    "sample-rate",
    "frame-rate",
    "preset",
    "crf",
    "output-filename",
    "trim-only",
  ];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = !enabled;
  });
}

function startConversion() {
  if (!window.inputFile || !window.outputDir) {
    alert("入力ファイルと出力フォルダを指定してください。");
    return;
  }

  document.getElementById("status").innerText = "変換中...";
  document.getElementById("start-button").disabled = true;
  setControlsEnabled(false);
  document.getElementById("log").innerText = "変換を開始しました...";

  ipcRenderer.send("start-conversion", {
    inputFile: window.inputFile,
    outputDir: window.outputDir,
    outputFilename: getValue("output-filename"),
    startTime: getValue("start-time"),
    endTime: getValue("end-time"),
    resolution: getValue("resolution"),
    format: getValue("format"),
    videoBitrate: getValue("video-bitrate"),
    audioBitrate: getValue("audio-bitrate"),
    audioChannels: getValue("audio-channels"),
    sampleRate: getValue("sample-rate"),
    frameRate: getValue("frame-rate"),
    preset: getValue("preset"),
    crf: getValue("crf"),
    trimOnly: getChecked("trim-only"),
  });
}

ipcRenderer.on("ffmpeg-log", (event, log) => {
  const logBox = document.getElementById("log");
  logBox.innerText += log;
  logBox.scrollTop = logBox.scrollHeight;
});

ipcRenderer.on("ffmpeg-done", (event, outputPath) => {
  document.getElementById("status").innerText = "";
  document.getElementById("start-button").disabled = false;
  setControlsEnabled(true);
  const logBox = document.getElementById("log");
  if (outputPath) {
    logBox.innerText += `
変換が完了しました。出力ファイル: ${outputPath}
`;
  } else {
    logBox.innerText += `
エラーが発生しました。
`;
  }
});

function adjustTime(id, delta) {
  const input = document.getElementById(id);
  let [h, m, s] = (input.value || "00:00:00")
    .split(":")
    .map((n) => parseInt(n) || 0);
  let total = h * 3600 + m * 60 + s + delta;
  if (total < 0) total = 0;
  h = String(Math.floor(total / 3600)).padStart(2, "0");
  m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  s = String(total % 60).padStart(2, "0");
  input.value = `${h}:${m}:${s}`;
}

function markStart() {
  const video = document.getElementById("preview");
  const seconds = Math.floor(video.currentTime);
  document.getElementById("start-time").value = secondsToHMS(seconds);
}

function markEnd() {
  const video = document.getElementById("preview");
  const seconds = Math.floor(video.currentTime);
  document.getElementById("end-time").value = secondsToHMS(seconds);
}

function secondsToHMS(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

document.getElementById("format").addEventListener("change", () => {
  const format = getValue("format");
  const isAudio = format === "mp3";
  ["resolution", "frame-rate", "video-bitrate", "preset", "crf"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) el.disabled = isAudio;
    }
  );
});
