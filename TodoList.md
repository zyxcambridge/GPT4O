## Todolist

### 修改代码，以实现以下功能并添加详细注释
[查阅文档](https://lmdeploy.readthedocs.io/zh-cn/latest/serving/api_server_vl.html)

1.拆分代码为多个文件夹
    - 拆分代码为多个文件夹，每个文件夹对应一个功能。
    - 添加详细注释，以帮助理解代码。
    
 **自动录制功能:**
   - 录制1小时的音频，并持续屏幕录制1小时。
   - 默认录制音频5分钟，完成一次语音识别，请求一次分析结果，
   - 间隔时间可以配置

2. **结果显示:**
   - 自动显示分析后的结果。

3. **实时监控:**
   - 实时分析桌面内容，跟踪鼠标和键盘活动。

4. **摄像头分析:**
   - 分析连接的外部摄像头信息。

5. **中断与连续分析:**
   - 支持在分析过程中进行打断操作。

6. **快捷键替代:**
   - 使用快捷键代替Siri功能。

7. **会话管理:**
   - 允许在会话间开启或关闭应用对话状态。

8. **内存优化:**
   - 使用缓冲区处理，减少磁盘读写。

9. **用户界面配置:**
   - 配置助手音频参数（如速度）及播放选项。
   - 设置窗口始终位于顶层（启用/禁用粘性位置）。
   - 屏幕截图设置自定义（如选择区域或全屏）。

10. **麦克风修复:**
    - 解决麦克风在.app中无法正常工作的bug，感谢@Claar修复。

11. **文本输入支持:**
    - 添加基于文本的输入替代语音识别。

12. **OpenAI 接口替代方案:**
    - 由于官方接口可能受限，可以考虑使用第三方服务获取OpenAI密钥，如:
      - [https://one.gptnb.me/](https://one.gptnb.me/)
      - [https://www.gptapi.us/](https://www.gptapi.us/)
      - [https://aihubmix.com/](https://aihubmix.com/)