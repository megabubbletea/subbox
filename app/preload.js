const { contextBridge, ipcRenderer } = require('electron');
const MP4Box = require('mp4box');

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    };

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency]);
    }
});

contextBridge.exposeInMainWorld('api', {
    send: (channel, data) => ipcRenderer.send(channel, data),
    receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    mp4box: {
        createFile: () => {
            const file = MP4Box.createFile();
            return {
                appendBuffer: (buffer, fileStart) => {
                    buffer.fileStart = fileStart;  // Add fileStart property
                    file.appendBuffer(buffer);
                },
                onReady: (callback) => {
                    file.onReady = callback;
                },
                stop: () => file.stop(),
                flush: () => file.flush()
            };
        }
    }
});
