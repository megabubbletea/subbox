const { contextBridge, ipcRenderer } = require('electron');
const MP4Box = require('mp4box');


interface API {
    send: (channel: string, data: any) => void;
    receive: (channel: string, func: (...args: any[]) => void) => void;
    mp4box: any; // Replace 'any' with the appropriate type for MP4Box
}

contextBridge.exposeInMainWorld('api', {
    send: (channel: string, data: any) => ipcRenderer.send(channel, data),
    receive: (channel: string, func: (...args: any[]) => void) => ipcRenderer.on(channel, (event: any, ...args: any[]) => func(...args)),
    mp4box: MP4Box
} as API);