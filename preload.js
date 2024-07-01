const { contextBridge, ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector);
      if (element) element.innerText = text
    }
  
    for (const dependency of ['chrome', 'node', 'electron']) {
      replaceText(`${dependency}-version`, process.versions[dependency]);
    }
});
  
contextBridge.exposeInMainWorld('electronAPI', {
    sendToMain: (channel, data) => ipcRenderer.send(channel, data),
    receiveFromMain: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
});