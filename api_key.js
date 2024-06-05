// Manage API key storage/access
ipcMain.on("submit-api-key", (event, apiKey) => {
    store.set("userApiKey", apiKey); // Directly saving the API key using electron-store
  });
  
  // Function to mask the API key except for the last 4 characters
  function maskApiKey(apiKey) {
    if (apiKey.length <= 4) {
      return apiKey; // If the key is too short, just return it
    }
    return "*".repeat(apiKey.length - 4) + apiKey.slice(-4);
  }
  
  // Handle request for API key
  ipcMain.on("request-api-key", (event) => {
    const apiKey = store.get("userApiKey", ""); // Get the API key
    const maskedApiKey = maskApiKey(apiKey); // Get the masked version
    event.reply("send-api-key", maskedApiKey); // Send the masked key
  });
  
  // fetch the key to send to backend logic
  ipcMain.handle("get-api-key", (event) => {
    return store.get("userApiKey", "");
  });
  