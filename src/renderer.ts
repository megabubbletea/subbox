document.addEventListener('DOMContentLoaded', () => {
    let dropZone = document.getElementById('dropzone');

    if (dropZone) {
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
    }
});

function preventDefaults(e: Event) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e: Event) {
    const dropZone = document.getElementById('dropzone');
    if (dropZone) {
        dropZone.classList.add('highlight');
    }
}

function unhighlight(e: Event) {
    const dropZone = document.getElementById('dropzone');
    if (dropZone) {
        dropZone.classList.remove('highlight');
    }
}

function handleDrop(e: DragEvent) {
    let dt = e.dataTransfer;
    if (dt) {
        let files = dt.files;
        
        // Process each file
        Array.from(files).forEach(processFile);
    }
}

function processFile(file: File) {
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function (e: ProgressEvent<FileReader>) {
            const arrayBuffer: ArrayBuffer | null;
            let mp4boxfile: any;
            
            if (arrayBuffer !== null) {
                // Create a new file
                mp4boxfile = window.api.mp4box.createFile(); // ts-ignore
                mp4boxfile.fileStart = 0;
                
                // Append the buffer for processing
                mp4boxfile.appendBuffer(arrayBuffer);
            
                // Flush to force processing of the appended data
                mp4boxfile.flush();
            
                // Once the file is ready, you can access its information
                mp4boxfile.onReady = function (info: any) {
                    console.log("File info:", info);
                };
            }
        };
        
        reader.readAsArrayBuffer(file);
    }
}