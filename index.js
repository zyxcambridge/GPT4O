/** 
### TodoList.md #########
  // 增加倒计时record_time_interval5分钟的设定

*/
const {
  app,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  globalShortcut,
  systemPreferences,
} = require("electron");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const OpenAI = require("openai");
const { Blob } = require("buffer");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegStatic = require("ffmpeg-static");
const FormData = require("form-data");
const { exec } = require("child_process");
const activeWin = require("active-win");
const Store = require("electron-store");
const buffer = require("buffer");

const store = new Store();
ffmpeg.setFfmpegPath(ffmpegStatic);

//////////////////SET CONFIGS AND PLACEHOLDER VARIABLES//////////////////
let openAiApiKey = store.get("userApiKey", "");
// openAiApiKey="sk-"

// OpenAI.baseURL = "http://localhost:1234/v1"
// UserDefineModels = "Repository/Yi-VL-34B-GGUF"

OpenAI.baseURL = "https://api.aiproxy.io/v1"
UserDefineModels ="gpt-4o"
openAiApiKey_aiproxy="sk-"
openai_whisper_tts_base = "https://api.aiproxy.io/v1/"
let openai = new OpenAI({
  apiKey: openAiApiKey_aiproxy,
});
openai.baseURL = "https://api.aiproxy.io/v1"
// - 间隔时间可以配置,默认5分钟，300000 是5*60秒 // 将时间转换为毫秒
let record_time_interval = store.get("record_time_interval", 1*60*1000);

// OpenAI.baseURL = "https://api.openai.com/v1"
// UserDefineModels ="gpt-4-vision-preview"
// openAiApiKey="sk-"
// openAiApiKey_aiproxy = openAiApiKey
// // const url = "https://api.openai.com/v1/audio/speech";
// openai_whisper_tts_base = "https://api.openai.com/v1/"
// let openai = new OpenAI({
//   apiKey: openAiApiKey_aiproxy,
// });
// openai.baseURL = "https://api.openai.com/v1"


// This is the keyboard shortcut that triggers the app
// command + space
const keyboardShortcut = "CommandOrControl+Shift+space"; 
// 定义一个变量来控制播放状态
let isPlayingTTS = false;
const notificationWidth = 300; 
const notificationHeight = 100; 
const notificationOpacity = 0.8; 
const mainWindowWidth = 600;
const mainWindowHeight = 400; 

let isRecording = false;
let mainWindow;
let notificationWindow;

let conversationHistory = null;
conversationHistoryPath="prompt_base_config.json"
fs.readFile(conversationHistoryPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the conversation history file:', err);
    return;
  }
  conversationHistory = JSON.parse(data);
  console.log('Conversation history loaded:', conversationHistory);
});


// Set to true if you intend to package the app, otherwise false.
const useElectronPackager = false;
let tempFilesDir;
// This decides what directory/storage strategy to use (local project or application folder)
if (useElectronPackager) {
  tempFilesDir = path.join(app.getPath("userData"), "macOSpilot-temp-files");
} else {
  tempFilesDir = path.join(__dirname, "macOSpilot-temp-files");
}

if (!fs.existsSync(tempFilesDir)) {
  fs.mkdirSync(tempFilesDir, { recursive: true });
}

const micRecordingFilePath = path.join(tempFilesDir, "macOSpilotMicAudio.raw");
const mp3FilePath = path.join(tempFilesDir, "macOSpilotAudioInput.mp3.wav");
const screenshotFilePath = path.join(tempFilesDir, "macOSpilotScreenshot.png");
const audioFilePath = path.join(tempFilesDir, "macOSpilotTtsResponse.mp3");
const videoFilePath = path.join(tempFilesDir, "video.mp4");

// Create main Electron window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: mainWindowWidth,
    height: mainWindowHeight,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.loadFile("index.html");
}

// Create "always on top" Electron notification window
function createNotificationWindow() {
  notificationWindow = new BrowserWindow({
    width: notificationWidth,
    height: notificationHeight,
    frame: false,
    transparent: true, // Enable transparency
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    alwaysOnTop: true,
    skipTaskbar: true,
    x: 100,
    y: 100,
  });
  notificationWindow.setOpacity(notificationOpacity);
  notificationWindow.loadFile("notifications.html");
}

// Function to re-position "always on top" notification window when a new active window is used
function repositionNotificationWindow(selectedWindow) {
  // Calculate top-right position which is what's currently used
  const topRightX =
    selectedWindow.bounds.x + selectedWindow.bounds.width - notificationWidth;
  const topRightY = selectedWindow.bounds.y;

  // Ensure the window is not positioned off-screen
  const safeX = Math.max(topRightX, 0);
  const safeY = Math.max(topRightY, 0);
  // Currently set to 15px in form the right-hand corner of the active window
  if (notificationWindow) {
    notificationWindow.setPosition(safeX - 15, safeY + 15);
  }
}

// Recorded audio gets passed to this function when the microphone recording has stopped
ipcMain.on("audio-buffer", (event, buffer) => {
  // openAiApiKey = store.get("userApiKey", "");
  console.log("openAiApiKey:  " + openAiApiKey + " = openAiApiKey_aiproxy :" +openAiApiKey_aiproxy);
  // Save buffer to the temporary file
  fs.writeFile(micRecordingFilePath, buffer, (err) => {
    if (err) {
      console.error("Failed to save temporary audio file:", err);
      return;
    }
    // Convert the temporary file to MP3 and send to Vision API
    try {
      ffmpeg(micRecordingFilePath)
        .setFfmpegPath(ffmpegStatic)
        .audioBitrate(32)
        .toFormat("wav").outputOptions([
          "-ar 16000"
        ])
        .on("error", (err) => {
          console.error("Error converting to MP3:", err);
        })
        .on("end", async () => {
          fs.unlink(micRecordingFilePath, (err) => {
            if (err) console.error("Failed to delete temporary file:", err);
          });
          // Send user audio recording to OpenAI Whisper API for transcription
          const audioInput = await transcribeUserRecording(mp3FilePath);

          // Set a default response and call the Vision API to overwrite it if we have a transcription of the user recording
          let visionApiResponse = "There was an error calling OpenAI.";
          if (audioInput) {
            // Call Vision API with screenshot and transcription of question
            visionApiResponse = await callVisionAPI(
              screenshotFilePath,
              audioInput
            );
          }
          // Update both windows with the response text
          mainWindow.webContents.send(
            "push-vision-response-to-windows",
            visionApiResponse
          );
          notificationWindow.webContents.send(
            "push-vision-response-to-windows",
            visionApiResponse
          );
          // 重写编写调用逻辑，保证可以被已经注册的keyboardShortcut 中断，停止播放
          await playVisionApiResponse(visionApiResponse);
        })
        .save(mp3FilePath);
    } catch (error) {
      console.log(error);
    }
  });
});

// Capture a screenshot of the selected window, and save it to disk
async function captureWindow(windowName) {
  const sources = await desktopCapturer.getSources({ 
    types: ["screen"] ,
    thumbnailSize: { width: 1920, height: 1080 }, 
    fetchWindowIcons: true});
  const selectedSource = sources.find((source) => source.name === "Entire screen");

  if (!selectedSource) {
    console.error("Window not found:", windowName);
    return "Window not found";
  }
  // 设置一个更大的缩略图尺寸，例如 3840x2160
  const thumbnailSize = { width: 3840, height: 2160 };
  // 获取更大的缩略图
  const screenshot = selectedSource.thumbnail.toPNG({ width: thumbnailSize.width, height: thumbnailSize.height });
  // 保存缩略图到文件
  fs.writeFile(screenshotFilePath, screenshot, async (err) => {
    if (err) {
      throw err;
    }
  });
  return "Window found";
}

// Function to send audio file of user recording and return a transcription
async function transcribeUserRecording(mp3FilePath) {
  try {
    // https://github.com/ggerganov/whisper.cpp/tree/master/bindings/javascript
    const form = new FormData();
    form.append("file", fs.createReadStream(mp3FilePath));
    form.append("model", "whisper-1");
    form.append("response_format", "text");
    const whisper_url= openai_whisper_tts_base+"audio/transcriptions"
    response = await axios.post(
      whisper_url,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${openAiApiKey_aiproxy}`,
        },
      }
    );

    ///////////////////////////////////////////////////////
    // // curl 127.0.0.1:8080/inference \
    // // -H "Content-Type: multipart/form-data" \
    // // -F file="/Users/yixin0909zhang/Desktop/whisper.cpp/test_audio.mp3.wav" \
    // // -F temperature="0.0" \
    // // -F temperature_inc="0.2" \
    // // -F response_format="json"
    // form.append("file", fs.createReadStream(mp3FilePath));
    // form.append("temperature", "0.0");
    // form.append("temperature_inc", "0.2");
    // form.append("response_format", "json");

    // response = await axios.post(
    //   "http://127.0.0.1:8080/inference",
    //   form,
    //   {
    //     headers: {
    //       ...form.getHeaders(),
    //     },
    //   }
    // );
    // //for whisper.cpp format to openai api format
    // response.data = response.data.text
    ///////////////////////////////////////////////////////
    console.log("response.data: " + response.data);

    // Adding user's question to windows to give sense of progress
    notificationWindow.webContents.send(
      "push-transcription-to-windows",
      response.data
    );

    mainWindow.webContents.send("push-transcription-to-windows", response.data);

    return response.data;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return false;
  }
}

// Function to call the Vision API with the screenshot and transcription of the user question
async function callVisionAPI(inputScreenshot, audioInput) {
  const base64Image = fs.readFileSync(inputScreenshot).toString("base64");
  const dataUrl = `data:image/png;base64,${base64Image}`;
  const userMessage = {
    role: "user",
    content: [
      { type: "text", text: audioInput },
      {
        type: "image_url",
        image_url: {
          url: dataUrl,
        },
      },
    ],
  };

  conversationHistory.push(userMessage);
  try {
    console.log("conversationHistory: " + JSON.stringify(conversationHistory));
    const response = await openai.chat.completions.create({
      max_tokens: 300,
      model: UserDefineModels,
      messages: conversationHistory,
    });
    const responseContent = response.choices[0].message.content;
    // ///////////////////////////////////////////////////////
    // // openai.baseURL = "http://localhost:1234/v1"
    // const response = await openai.chat.completions.create({
    //   max_tokens: 100,
    //   model: UserDefineModels,
    //   messages: conversationHistory,
    //   frequency_penalty:2,
    // });
    // const responseContent = response.choices[0].message.content;
    // ///////////////////////////////////////////////////////
    conversationHistory.push({
      role: "assistant",
      content: responseContent,
    });

    return responseContent;
  } catch (error) {
    console.log(error);
  }
}

// Function that takes text input, calls TTS API, and plays back the response audio
async function playVisionApiResponse(inputText) {
  const tts_url = openai_whisper_tts_base + "audio/speech";
  const voice = "echo"; 
  const model = "tts-1";
  const headers = {
    Authorization: `Bearer ${openAiApiKey_aiproxy}`, 
  };
  const data = {
    model: model,
    input: inputText,
    voice: voice,
    response_format: "mp3",
  };
  try {
    const response = await axios.post(tts_url, data, {
      headers: headers,
      responseType: "stream",
    });

    // Save the response stream to a file
    const writer = fs.createWriteStream(audioFilePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    }).then(() => {
      // Play the audio file using a system command
      let playCommand;
      switch (process.platform) {
        case "darwin": // macOS
          playCommand = `afplay "${audioFilePath}"`;
          break;
        case "win32": // Windows
          playCommand = `start "${audioFilePath}"`;
          break;
        case "linux": // Linux (requires aplay or mpg123 or similar to be installed)
          playCommand = `aplay "${audioFilePath}"`; // or mpg123, etc.
          break;
        default:
          console.error("Unsupported platform for audio playback");
          return;
      }
      if(isPlayingTTS)
      {
        exec(playCommand, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error playing audio: ${error.message}`);
            return;
          }
          isPlayingTTS = false;
          resolve();
        });
      }

    });
    writer.on("error", reject);

  } catch (error) {
    if (error.response) {
      console.error(
        `Error with HTTP request: ${error.response.status} - ${error.response.statusText}`
      );
    } else {
      console.error(`Error in streamedAudio: ${error.message}`);
    }
  }
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// 假设 registerKeyboardShortcut 是一个函数，用于注册并触发快捷键
async function registerKeyboardShortcut() {
  // 这里是模拟的触发快捷键的代码
  console.log('Keyboard shortcut triggered');
  // 在这里添加触发快捷键后要执行的代码
  if (!isRecording) {
    try {
      const activeWindow = await activeWin();
      captureWindowStatus = await captureWindow(activeWindow.title);
      repositionNotificationWindow(activeWindow);

      if (captureWindowStatus !== "Window found") {
        const responseMessage = "Unable to capture this window, try another.";
        mainWindow.webContents.send("add-window-name-to-app", responseMessage);
        notificationWindow.webContents.send("add-window-name-to-app", responseMessage);
        return;
      }

      // If window is found, continue as expected
      const responseMessage = `${activeWindow.owner.name}: ${activeWindow.title}`;
      mainWindow.webContents.send("add-window-name-to-app", responseMessage);
      notificationWindow.webContents.send("add-window-name-to-app", responseMessage);
    } catch (error) {
      console.error("Error capturing the active window:", error);
    }
    mainWindow.webContents.send("start-recording");
    notificationWindow.webContents.send("start-recording");

    mainWindow.webContents.send("start-recording-video");
    // notificationWindow.webContents.send("start-recording-video");
    isRecording = true;
    // 中断播放
    if (isPlayingTTS) {
      // 中断播放
      exec("killall afplay", (error, stdout, stderr) => {
        if (error) {
          console.error(`Error stopping audio: ${error.message}`);
          return;
        }
        isPlayingTTS = false;
      });
    }
  } else {
    // 5分钟后自动执行这个
    mainWindow.webContents.send("stop-recording");
    notificationWindow.webContents.send("stop-recording");
    mainWindow.webContents.send("stop-recording-video");
    // notificationWindow.webContents.send("stop-recording-video");
    isRecording = false;
  }
}
// Run when Electron app is ready
app.whenReady().then(() => {
  createMainWindow();
  createNotificationWindow();

  // Request microphone access
  systemPreferences
    .askForMediaAccess("microphone")
    .then((accessGranted) => {
      if (accessGranted) {
        console.log("Microphone access granted");
      } else {
        console.log("Microphone access denied");
      }
    })
    .catch((err) => {
      console.error("Error requesting microphone access:", err);
    });

  // 请求摄像头权限
  systemPreferences.askForMediaAccess("camera").then((granted) => {
    if (granted) {
      console.log("摄像头权限已授予");
      // 在这里编写使用摄像头的代码
    } else {
      console.log("摄像头权限被拒绝");
    }
  });
  // This call initializes MediaRecorder with an 500ms audio recording, to get around an issue seen on some machines where the first user-triggered recording doesn't work.

  mainWindow.webContents.send("init-mediaRecorder");
  // If defined keyboard shortcut is triggered then run

  globalShortcut.register(keyboardShortcut, async () => {
    // If the microphone recording isn't already running
    console.log(`start to record ,
          默认录制音频record_time_interval5分钟，
          完成一次语音识别，请求一次分析结果，`);
    await registerKeyboardShortcut();
  });
  // 模拟每5分钟触发一次键盘快捷键
  setInterval(async () => {
    if (isRecording) {
      console.log("5分钟到了，自动停止录音");
      await registerKeyboardShortcut();
    }
  }, record_time_interval );
  // 如果你想要只触发一次，可以使用 setTimeout 并在其中调用 registerKeyboardShortcut
  // setTimeout(registerKeyboardShortcut, record_time_interval);
  ipcMain.handle("video-start-recording", async () => {
    console.log("video-start-recording");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const recordedChunks = [];
      const streamRecorder = new MediaRecorder(stream);

      streamRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        } else {
          // ...停止录制后处理数据
        }
      };

      streamRecorder.start(); // 开始录制

      // 这里你可以设置一个定时器或者其他机制来停止录制，例如：
      setTimeout(() => streamRecorder.stop(), 10000); // 10秒后停止录制

      return new Promise((resolve) => {
        streamRecorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: "video/mp4" }); // 创建 Blob 对象
          const buffer = Buffer.from(blob); // 转换为 Buffer 以使用 Node.js 文件系统 API
          // const outputPath = path.resolve(__dirname, 'recording.webm'); // 设置输出路径
          fs.writeFile(videoFilePath, buffer, (err) => {
            // 将视频数据写入文件
            if (err) {
              console.error("Error saving video file:", err);
              resolve(false);
            } else {
              console.log("Video saved to:", outputPath);
              resolve(true);
            }
          });
        };
      });
    } catch (err) {
      console.error("Error accessing media devices:", err);
      return false;
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  // Unregister all shortcuts when the application is about to quit
  globalShortcut.unregisterAll();
});

ipcMain.on("update-analysis-content", (event, content) => {
  // Forward the content to the notification window
  if (notificationWindow) {
    notificationWindow.webContents.send("update-analysis-content", content);
  }
});
