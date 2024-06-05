
ipcMain.on("video-buffer", (event, buffer) => {
    // const outputPath = path.resolve(__dirname, 'recording.webm'); // 设置输出路径
    fs.writeFile(videoFilePath, buffer, (err) => {
      // 将视频数据写入文件
      if (err) {
        console.error("Error saving video file:", err);
      } else {
        console.log("Video saved to:", videoFilePath);
      }
    });
  });
  
  ipcMain.on("save-video-frame", (event, buffer) => {
    const outputFramePath = path.join(tempFilesDir, `frame_${Date.now()}.png`); // 自定义保存路径和文件名，这里保存为 PNG 图片文件，你可以根据需要修改为其他格式或处理方式
    fs.writeFile(outputFramePath, buffer, (err) => {
      // 将视频数据写入文件
      if (err) {
        console.error("Error saving video file:", err);
      } else {
        // 将帧数据写入文件
        console.log(`saved to ${outputFramePath}`); // 输出保存路径和帧编号，便于调试和跟踪录制状态和进度
      }
    });
  });
  ipcMain.on("save-video", async (event, blob) => {
    try {
      // 将 Blob 对象转换为 ArrayBuffer
      const arrayBuffer = await blob.arrayBuffer();
      // 将 ArrayBuffer 转换为 Buffer
      const buffer = Buffer.from(arrayBuffer);
      // 定义输出路径，文件名使用当前时间戳来保证唯一性
      const outputPath = path.join(tempFilesDir, `video_${Date.now()}.webm`);
      // 使用 fs.writeFileSync 同步写入文件，也可以使用 fs.writeFile 异步写入
      fs.writeFileSync(outputPath, buffer);
      // 可选：回复渲染进程文件已保存的消息和路径
      event.reply("video-saved", outputPath);
      console.log(`Video saved to: ${outputPath}`);
    } catch (error) {
      console.error("Error saving video:", error);
      // 可选：回复渲染进程保存视频时发生的错误
      event.reply("video-save-error", error);
    }
  });
  