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

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    document.getElementById('dropzone').classList.add('highlight');
}

function unhighlight(e) {
    document.getElementById('dropzone').classList.remove('highlight');
}

function handleDrop(e) {
    let dt = e.dataTransfer;
    let files = dt.files;

    // Process each file
    Array.from(files).forEach(processFile);
}

function processFile(file) {
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function (e) {
            const arrayBuffer = e.target.result;
            mp4boxfile = window.api.mp4box.createFile();
            arrayBuffer.fileStart = 0;
            
            // Append the buffer for processing
            mp4boxfile.appendBuffer(arrayBuffer);
        
            // Flush to force processing of the appended data
            mp4boxfile.flush();
        
            // Once the file is ready, you can access its information
            mp4boxfile.onReady = function (info) {
                console.log("File info:", info);
            };
        };
        
        reader.readAsArrayBuffer(file);
    }
}