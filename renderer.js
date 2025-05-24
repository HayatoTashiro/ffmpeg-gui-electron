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

    // 動画プレビュー用に反映
    const video = document.getElementById("preview");
    if (video) {
      video.src = "file://" + result.inputPath;
      video.load(); // 明示的にロード（任意）
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

function startConversion() {
  if (!window.inputFile || !window.outputDir) {
    alert("入力ファイルと出力フォルダを指定してください。");
    return;
  }

  document.getElementById("status").innerText = "変換中...";
  document.getElementById("start-button").disabled = true;
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
    audioOnly: getChecked("audio-only"),
    trimOnly: getChecked("trim-only"),
    customArgs: getValue("custom-args"),
  });
}

ipcRenderer.on("ffmpeg-log", (event, log) => {
  const logBox = document.getElementById("log");
  logBox.innerText += log;
  logBox.scrollTop = logBox.scrollHeight;
});

ipcRenderer.on("ffmpeg-done", (event, outputPath) => {
  const logBox = document.getElementById("log");
  document.getElementById("status").innerText = "";
  document.getElementById("start-button").disabled = false;
  if (outputPath) {
    logBox.innerText += `\n変換が完了しました。出力ファイル: ${outputPath}\n`;
  } else {
    logBox.innerText += `\nエラーが発生しました。\n`;
  }
});

// 秒数増減ボタン
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

function applyPreset(name) {
  const presets = {
    twitter: {
      resolution: "1280x720",
      "video-bitrate": "2500k",
      format: "mp4",
      crf: "28",
      "audio-only": false,
    },
    youtube: {
      resolution: "1920x1080",
      "video-bitrate": "5000k",
      format: "mp4",
      crf: "23",
      "audio-only": false,
    },
    discord: {
      resolution: "960x540",
      "video-bitrate": "1500k",
      "audio-bitrate": "128k",
      format: "mp4",
      crf: "28",
      "audio-only": false,
      "audio-channels": "2",
      "sample-rate": "44100",
      preset: "fast",
    },
    audio: {
      format: "mp3",
      "audio-only": true,
    },
  };

  const p = presets[name];
  if (!p) return;

  for (const [key, value] of Object.entries(p)) {
    if (typeof value === "boolean") {
      setCheckbox(key, value);
    } else {
      set(key, value);
    }
  }
}
function set(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}
function setCheckbox(id, value) {
  const el = document.getElementById(id);
  if (el) el.checked = value;
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
