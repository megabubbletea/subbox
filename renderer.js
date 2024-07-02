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
    let MP4Box = window.api.mp4box;
    var video = document.createElement("video");
    var chunkSize  = 1024 * 1024; // bytes
    var fileSize  = file.size;
    var offset = 0;
    var readBlock = null; 
  
    mp4boxfile = MP4Box.createFile();
    mp4boxfile.onError = function(e) {
      console.log("Failed to parse ISOBMFF data");
    };
  
    var gpmd_track_id = null;
    var texttrack = null;
    var numSamples = null;
    mp4boxfile.onReady = function(info) {
      for (var i = 0; i < info.tracks.length; i++){
        if (info.tracks[i].codec == "gpmd"){
          gpmd_track_id = i;
          texttrack = video.addTextTrack("metadata", "Text track for extraction of track "+info.tracks[gpmd_track_id].id);
          numSamples = info.tracks[gpmd_track_id].nb_samples;
        }
      }
      mp4boxfile.onSamples = function (id, user, samples) {
        console.log("Received "+samples.length+" samples on track "+id+" for object "+user);
      }
      mp4boxfile.setExtractionOptions(info.tracks[gpmd_track_id].id, texttrack, { nbSamples: numSamples });
      mp4boxfile.start();
    };
  
    var onparsedbuffer = function(mp4boxfileobj, buffer) {
      buffer.fileStart = offset;
      mp4boxfileobj.appendBuffer(buffer);
    }
  
    var onBlockRead = function(evt) {
      if (evt.target.error == null) {
        onparsedbuffer(mp4boxfile, evt.target.result); // callback for handling read chunk
        offset += evt.target.result.byteLength;
      } else {
        console.log("Read error: " + evt.target.error);
        return;
      }
      if (offset >= fileSize) {
        console.log("Done reading file ("+fileSize+ " bytes)");
        mp4boxfile.flush();
        return;
      }
      readBlock(offset, chunkSize, file);
    }
  
    readBlock = function(_offset, length, _file) {
      var r = new FileReader();
      var blob = _file.slice(_offset, length + _offset);
      r.onload = onBlockRead;
      r.readAsArrayBuffer(blob);
    }
  
    readBlock(offset, chunkSize, file);
}