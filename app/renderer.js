document.addEventListener('DOMContentLoaded', () => {
    let dropZone = document.getElementById('dropzone');

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);
});

function preventDefaults (e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight (e) {
    document.getElementById('dropzone').classList.add('highlight');
}

function unhighlight (e) {
    document.getElementById('dropzone').classList.remove('highlight');
}

function handleDrop (e) {
    let dt = e.dataTransfer;
    let files = dt.files;

    // Process each file
    Array.from(files).forEach(processFile);
}

function processFile (file) {
    if (!file) return;

    let mp4boxfile = window.api.mp4box.createFile();

    mp4boxfile.onReady((info) => {
        // Get the fileinfo element
        const fileInfoDiv = document.getElementById('fileinfo');

        // Create HTML content from the info object
        const html = `
            <h2>File Information</h2>
            <ul>
                <li>Duration: ${info.duration / info.timescale} seconds</li>
                <li>Timescale: ${info.timescale}</li>
                <li>Tracks: ${info.tracks.length}</li>
                ${info.tracks.map(track => `
                    <li>
                        Track ${track.id}:
                        <ul>
                            <li>Type: ${track.type}</li>
                            <li>Codec: ${track.codec}</li>
                            <li>Language: ${track.language}</li>
                            <li>Duration: ${track.duration / track.timescale} seconds</li>
                        </ul>
                    </li>
                `).join('')}
            </ul>
        `;

        // Set the HTML content
        fileInfoDiv.innerHTML = html;

        // Extract subtitles from tracks
        info.tracks.forEach(track => {
            if (track.type === 'subtitles') {
                console.log(`Found subtitle track: ${track.id}`);

                // Set up subtitle extraction
                mp4boxfile.setExtractionOptions(track.id, null, {
                    nbSamples: 1000  // Number of samples to extract at once
                });

                let subtitles = [];

                mp4boxfile.onSamples = (track_id, ref, samples) => {
                    samples.forEach(sample => {
                        if (sample.data) {
                            const text = new TextDecoder().decode(sample.data);
                            const startTime = sample.cts / sample.timescale;
                            const endTime = (sample.cts + sample.duration) / sample.timescale;

                            subtitles.push({
                                start: startTime,
                                end: endTime,
                                text: text
                            });
                        }
                    });

                    // Convert to SRT format
                    const srtContent = subtitles.map((sub, index) => {
                        const formatTime = (seconds) => {
                            const pad = (num) => num.toString().padStart(2, '0');
                            const hours = Math.floor(seconds / 3600);
                            const minutes = Math.floor((seconds % 3600) / 60);
                            const secs = Math.floor(seconds % 60);
                            const ms = Math.floor((seconds * 1000) % 1000);
                            return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${ms.toString().padStart(3, '0')}`;
                        };

                        return `${index + 1}\n${formatTime(sub.start)} --> ${formatTime(sub.end)}\n${sub.text}\n`;
                    }).join('\n');

                    // Open Save As dialog and save the file
                    window.api.showSaveDialog({
                        title: 'Save Subtitles',
                        defaultPath: `subtitles_track${track_id}.srt`,
                        filters: [
                            { name: 'SubRip Subtitle', extensions: ['srt'] }
                        ]
                    }).then(result => {
                        if (!result.canceled) {
                            window.api.writeFile(result.filePath, srtContent)
                                .then(() => {
                                    console.log(`Subtitles saved to: ${result.filePath}`);
                                })
                                .catch(err => {
                                    console.error('Error saving subtitles:', err);
                                });
                        }
                    });
                };

                // Start extraction
                mp4boxfile.start();
            }
        });
    });

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const arrayBuffer = e.target.result;
            // Add fileStart property to the buffer
            mp4boxfile.appendBuffer(arrayBuffer, 0);
            console.log('File processed successfully');

            mp4boxfile.flush();
        } catch (error) {
            console.error('Error processing file:', error);
        }
    };

    reader.onerror = function (error) {
        console.error('Error reading file:', error);
    };

    reader.readAsArrayBuffer(file);
}
