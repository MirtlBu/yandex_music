(function() {

    var context,
        analyser,
        soundSource,
        soundBuffer,
        music,
        volumeNode,
        mute = false;

    function init() {
        context = new (window.AudioContext || window.webkitAudioContext)();
    }

    function handleFileSelect(event) {
        music = event.target.files[0];
    }

    document.getElementById('files').addEventListener('change', handleFileSelect, false);


    function createSound() {
        var arrayBuffer;
        var fileReader = new FileReader();
        fileReader.onload = function() {
            arrayBuffer = this.result;
            audioGraph(arrayBuffer);
        };
        fileReader.readAsArrayBuffer(music);
    }

    function playSound() {
        soundSource.start(context.currentTime);
    }

    function stopSound() {
        soundSource.stop(context.currentTime);
    }

    function changeVolume(e) {
        var elem = e.target;
        var fraction = parseInt(elem.value) / parseInt(elem.max);
        volumeNode.gain.value = fraction * fraction;
    };

    document.querySelector('.player__play').addEventListener('click', createSound);
    document.querySelector('.player__stop').addEventListener('click', stopSound);
    document.querySelector('.player__volume').addEventListener('input', changeVolume);


    function audioGraph(audioData) {

        soundSource = context.createBufferSource();

        context.decodeAudioData(audioData, function(soundBuffer){
            soundSource.buffer = soundBuffer;

            volumeNode = context.createGain();
            soundSource.connect(volumeNode);
            volumeNode.connect(context.destination);

            analyser = context.createAnalyser();
            soundSource.connect(analyser);
            var frequencyData = new Uint8Array(analyser.frequencyBinCount);
            var bars = document.getElementsByClassName('player__stroke');
            var dataOnBar = Math.floor(frequencyData.length / bars.length);

            function renderFrame() {
                requestAnimationFrame(renderFrame);
                analyser.getByteFrequencyData(frequencyData);
                Array.prototype.forEach.call(bars, function(v, i) {
                    var start = i*dataOnBar;
                    var sum = 0;
                    for(var j = 0; j < dataOnBar; j++) {
                        sum = sum + frequencyData[start + j];
                    }
                    v.style.height = (sum / dataOnBar) / 3  + 'px';
                });
            }

            playSound(soundSource);
            renderFrame();
        });
    }

    document.querySelector('.player').addEventListener("dragover", function( event ) {
          event.preventDefault();
      }, false);

    document.querySelector('.player').addEventListener("drop", function(event) {
        event.preventDefault();
        console.log('drop!');
    });

    init();

}());