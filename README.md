# GPT4O
# 复现GPT4O的实时视频和音频理解

# Demo
<!-- markdown 显示图片 gif -->
![GPT4O-Gif](imgs/20240520-054003.gif)
https://www.bilibili.com/video/BV1Vm421M7ZN/

# 安装
```bash
# step1: 克隆仓库
git clone https://github.com/zyxcambridge/GPT4O.git

# step2: 进入目录
cd GPT4O

# step3: 安装依赖
yarn install

# step4: 修改key

OpenAI.baseURL = "https://api.aiproxy.io/v1"
UserDefineModels ="gpt-4-vision-preview"
openAiApiKey_aiproxy="sk-"
openai_whisper_tts_base = "https://api.aiproxy.io/v1/"
let openai = new OpenAI({
  apiKey: openAiApiKey_aiproxy,
});
openai.baseURL = "https://api.aiproxy.io/v1"

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


# step5: 构建应用
yarn start

```

### Turn it into an .app with Electron

Want to create an .app executable instead of running this from your terminal?

First go to `index.js` and change `const useElectronPackager` from `false` to `true`.

Run one of these in your terminal, depending on which platform you're on.

```bash
npm  run  package-mac
npm  run  package-win
npm  run  package-linux
```

Note I have only tested this on Mac (Apple silicon and Intel).

Go to `/release-builds/` in your project folder, and chose the folder of your platform. In there is an executable, `.app` if you're on Mac. Double-click it to open the app, note that it may take a few seconds the first time so be patient.

Once the app is opened, trigger your keyboard shortcut. You'll be asked to grant Privacy & Security permissions. You may need to repeat this another one or two times for all permissions to work properly, and to restart the app.
