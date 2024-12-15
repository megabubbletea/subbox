const { contextBridge, ipcRenderer } = require('electron');
const MP4Box = require('mp4box');

// Separate version display logic
const setupVersionDisplay = () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    };

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency]);
    }
};

// MP4Box wrapper factory
const createMP4BoxWrapper = () => {
    const file = MP4Box.createFile();

    return {
        appendBuffer: (buffer, fileStart) => {
            buffer.fileStart = fileStart;
            file.appendBuffer(buffer);
        },
        onReady: (callback) => {
            file.onReady = callback;
        },
        onSamples: (callback) => {
            file.onSamples = callback;
        },
        setExtractionOptions: (trackId, user, options) => {
            file.setExtractionOptions(trackId, user, options);
        },
        start: () => file.start(),
        stop: () => file.stop(),
        flush: () => file.flush()
    };
};

// IPC communication handlers
const ipcHandlers = {
    send: (channel, data) => ipcRenderer.send(channel, data),
    receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
    writeFile: (filePath, content) => ipcRenderer.invoke('write-file', { filePath, content })
};

// DOM content loaded event listener
window.addEventListener('DOMContentLoaded', setupVersionDisplay);

// Expose API to renderer process
contextBridge.exposeInMainWorld('api', {
    ...ipcHandlers,
    mp4box: {
        createFile: createMP4BoxWrapper
    }
});
