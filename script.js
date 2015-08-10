(function() {

    var context,
        analyser,
        soundSource,
        soundBuffer,
        music,
        volumeNode,
        bars = document.getElementsByClassName('player__stroke');

    function init() {
        try {
            if(context) {
                context.close();
            }
            context = new (window.AudioContext || window.webkitAudioContext)();
            console.log('init!');
        }
        catch(err) {
            console.log(err.message);
        }
    }

    function handleFileSelect(data) {
        music = data.files[0];
        createTitle(data.files[0]);
        createSound();
    }

    function createTitle(data) {
        document.querySelector('.player__name').innerHTML = data.name;
        document.querySelector('.player__size').innerHTML = ' — ' + (data.size/(1024*1024)).toFixed(2) + 'MB';
    }

    document.getElementById('add_files').addEventListener('change', function(event) {
        handleFileSelect(event.target);
    }, false);


    function createSound() {
        init();
        var arrayBuffer;
        var fileReader = new FileReader();
        fileReader.onload = function() {
            arrayBuffer = this.result;
            audioGraph(arrayBuffer);
        };
        try { //я это, вообще, правильно использую?
            fileReader.readAsArrayBuffer(music);
        }
        catch(err) {
            console.log(err.message);
        }
    }

    function playSound() {
        soundSource.start(context.currentTime);
        console.log('play!');
    }

    function pauseSound() {
        var state = context.state;
        if(state === 'suspended') {
            context.resume();
            console.log('resume play!');
        }
        else if(state === 'running') {
            context.suspend();
            console.log('pause!');
        }
    }

    function stopSound() {
        // Array.prototype.forEach.call(bars, function(v, i) {
        //     console.log('height - ' + v.style.height);
        //     v.style.height = '0 px';
        // });
        soundSource.stop(context.currentTime);
        console.log('stop!');
    }

    function changeVolume(e) {
        var elem = e.target;
        var fraction = parseInt(elem.value) / parseInt(elem.max);
        volumeNode.gain.value = fraction * fraction;
    };

    document.querySelector('.player__play').addEventListener('click', createSound);
    document.querySelector('.player__pause').addEventListener('click', pauseSound);
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
                    v.style.height = (sum / dataOnBar) / 2.5  + 'px'; //немного уменьшить высоту
                });
            }

            playSound(soundSource);
            renderFrame();
        });
    }

    document.querySelector('.player').addEventListener('dragenter', function(event) {
        document.querySelector('.player').style.background = '#444444';
    }, false);

    document.querySelector('.player').addEventListener('dragleave', function(event) {
        document.querySelector('.player').style.background = '#333333';
    }, false);

    document.querySelector('.player').addEventListener('drop', function(event) {
        event.preventDefault();
        handleFileSelect(event.dataTransfer);
    }, false);

    document.addEventListener('dragover', function(event) {
        event.preventDefault();
    }, false);

}());