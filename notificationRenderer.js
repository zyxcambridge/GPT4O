const { ipcRenderer } = require("electron");

ipcRenderer.on("add-window-name-to-app", (event, windowName) => {
  updateWindowMessage(`Window Selected: ${windowName}`);
});

ipcRenderer.on("stop-recording", () => {
  // Stop the media recorder
  updateWindowMessage("Processing...");
});

ipcRenderer.on("push-transcription-to-windows", (event, transcriptionData) => {
  updateWindowMessage(`${transcriptionData} ... thinking...`);
});

// push-transcription-to-windows

ipcRenderer.on("start-recording", async () => {
  updateWindowMessage("Recording in progress...");
});

ipcRenderer.on("push-vision-response-to-windows", (event, visionResponse) => {
  updateWindowMessage(visionResponse);
});
function getTimeString(){
  let now = new Date();

  let year = now.getFullYear();
  let month = now.getMonth() + 1; // getMonth()返回的月份从0开始，所以需要加1
  let day = now.getDate();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  let seconds = now.getSeconds();

  // 将月份、日期、小时、分钟和秒数转换为两位数的字符串
  month = month < 10 ? '0' + month : month;
  day = day < 10 ? '0' + day : day;
  hours = hours < 10 ? '0' + hours : hours;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;

  // 拼接格式化后的时间字符串
  let formattedTime = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  console.log("当前时间：", formattedTime);
  return formattedTime
}
function updateWindowMessage(message) {
  const analysisContainer = document.getElementById("analysis");

  let messageDiv = analysisContainer.querySelector(".window-message");
  let messageTimeDiv = analysisContainer.querySelector(".message-time");
  if (!messageDiv) {
    messageDiv = document.createElement("div");
    messageDiv.className = "window-message";
    analysisContainer.appendChild(messageDiv);
  }

  messageDiv.textContent = message;
  messageTimeDiv.textContent = getTimeString();
}
