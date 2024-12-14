// Event handler functions
class DropZoneHandler {
    constructor () {
        this.dropZone = document.getElementById('dropzone');
        this.setupEventListeners();
    }

    setupEventListeners () {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.preventDefaults);
            document.body.addEventListener(eventName, this.preventDefaults);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.highlight);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.unhighlight);
        });

        // Handle dropped files
        this.dropZone.addEventListener('drop', this.handleDrop);
    }

    preventDefaults (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlight () {
        document.getElementById('dropzone').classList.add('highlight');
    }

    unhighlight () {
        document.getElementById('dropzone').classList.remove('highlight');
    }

    handleDrop (e) {
        const files = e.dataTransfer.files;
        Array.from(files).forEach(file => new SubtitleExtractor(file).process());
    }
}

class SubtitleExtractor {
    constructor (file) {
        this.file = file;
        this.mp4boxfile = window.api.mp4box.createFile();
        this.subtitles = [];
    }

    process () {
        if (!this.file) return;

        this.mp4boxfile.onReady(this.handleFileReady.bind(this));
        this.setupFileReader();
    }

    handleFileReady (info) {
        this.displayFileInfo(info);
        this.extractSubtitles(info);
    }

    displayFileInfo (info) {
        const fileInfoDiv = document.getElementById('fileinfo');
        fileInfoDiv.innerHTML = this.generateFileInfoHTML(info);
    }

    generateFileInfoHTML (info) {
        return `
            <h2>File Information</h2>
            <ul>
                <li>Duration: ${info.duration / info.timescale} seconds</li>
                <li>Timescale: ${info.timescale}</li>
                <li>Tracks: ${info.tracks.length}</li>
                ${this.generateTrackListHTML(info.tracks)}
            </ul>
        `;
    }

    generateTrackListHTML (tracks) {
        return tracks.map(track => `
            <li>
                Track ${track.id}:
                <ul>
                    <li>Type: ${track.type}</li>
                    <li>Codec: ${track.codec}</li>
                    <li>Language: ${track.language}</li>
                    <li>Duration: ${track.duration / track.timescale} seconds</li>
                </ul>
            </li>
        `).join('');
    }

    extractSubtitles (info) {
        info.tracks.forEach(track => {
            if (track.type === 'subtitles') {
                this.setupSubtitleExtraction(track);
            }
        });
    }

    setupSubtitleExtraction (track) {
        console.log(`Found subtitle track: ${track.id}`);

        this.mp4boxfile.setExtractionOptions(track.id, null, {
            nbSamples: 1000
        });

        this.mp4boxfile.onSamples((id, user, samples) => {
            this.processSamples(samples);
            this.saveSRTFile();
        });

        this.mp4boxfile.start();
    }

    processSamples (samples) {
        samples.forEach(sample => {
            if (sample.data) {
                const text = new TextDecoder().decode(sample.data);
                this.subtitles.push({
                    start: sample.cts / sample.timescale,
                    end: (sample.cts + sample.duration) / sample.timescale,
                    text: text
                });
            }
        });
    }

    formatTime (seconds) {
        const pad = (num) => num.toString().padStart(2, '0');
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds * 1000) % 1000);
        return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${ms.toString().padStart(3, '0')}`;
    }

    generateSRTContent () {
        return this.subtitles.map((sub, index) =>
            `${index + 1}\n${this.formatTime(sub.start)} --> ${this.formatTime(sub.end)}\n${sub.text}\n`
        ).join('\n');
    }

    saveSRTFile () {
        const srtContent = this.generateSRTContent();
        window.api.showSaveDialog()
            .then(result => {
                if (!result.canceled) {
                    return window.api.writeFile(result.filePath, srtContent);
                }
            })
            .then(() => {
                console.log('Subtitles saved successfully');
            })
            .catch(err => {
                console.error('Error saving subtitles:', err);
            });
    }

    setupFileReader () {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                this.mp4boxfile.appendBuffer(e.target.result, 0);
                console.log('File processed successfully');
                this.mp4boxfile.flush();
            } catch (error) {
                console.error('Error processing file:', error);
            }
        };

        reader.onerror = (error) => {
            console.error('Error reading file:', error);
        };

        reader.readAsArrayBuffer(this.file);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new DropZoneHandler();
});
