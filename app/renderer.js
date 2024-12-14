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
        console.log('MP4Box file is ready:', info);
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
