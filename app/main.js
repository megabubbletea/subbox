const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('fs').promises;

class Subbox {
    constructor () {
        this.mainWindow = null;
        this.init();
    }

    init () {
        app.whenReady().then(() => {
            this.registerIpcHandlers();
            this.createWindow();
            this.setupAppEvents();
        });

        app.on('window-all-closed', this.handleWindowsClosed.bind(this));
    }

    registerIpcHandlers () {
        ipcMain.handle('show-save-dialog', this.handleShowSaveDialog);
        ipcMain.handle('write-file', this.handleWriteFile);
    }

    createWindow () {
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true,
                sandbox: false
            }
        });

        this.mainWindow.loadFile('index.html');
        this.mainWindow.webContents.openDevTools();
    }

    setupAppEvents () {
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createWindow();
            }
        });
    }

    handleShowSaveDialog () {
        return dialog.showSaveDialogSync({
            title: 'Save Subtitles',
            filters: [
                { name: 'SubRip Subtitle', extensions: ['srt'] }
            ]
        });
    }

    async handleWriteFile (event, { filePath, content }) {
        await fs.writeFile(filePath, content, 'utf8');
    }

    handleWindowsClosed () {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    }
}

// Initialize the application
new Subbox();
