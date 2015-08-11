(function() {

    var context,
        soundSource,
        audiofile,
        gainNode,
        animation,
        player = document.querySelector('.player'),
        bars = document.getElementsByClassName('player__stroke');

    function init() {
        if(context && context.state !== 'closed') {
            context.close();
        }
        context = new (window.AudioContext || window.webkitAudioContext)();
        console.log('init!');
    }

    function createTags(file, callback, reader) {
        var url = file.urn || file.name;
        ID3.loadTags(url, function() {
            var type = file.type.substring(file.type.lastIndexOf('/') + 1);
            var info = {
                type: type,
                size: file.size,
                track: ID3.getAllTags(url).track || '',
                artist: ID3.getAllTags(url).artist || 'Unknown artist',
                title: ID3.getAllTags(url).title || 'Unknown title',
            };
            createTitle(info);
        },
        {tags: ["artist", "title", "track"],
         dataReader: reader});
    }

    function handleFileSelect(data) {
        audiofile = data.files[0];
        createTags(audiofile, null, FileAPIReader(audiofile));
        getSound(audiofile);
    }

    function createTitle(tags) {
        document.querySelector('.player__data').setAttribute('title', tags.track + ' ' + tags.artist + ' — ' + tags.title + '.' + tags.type);
        document.querySelector('.player__data').innerHTML = tags.track + ' ' + tags.artist + ' — ' + tags.title + '.' + tags.type;
        document.querySelector('.player__size').innerHTML = (tags.size/(1024*1024)).toFixed(2) + 'MB';
    }

    function getSound(audiofile) {
        changePlayButtonState('player__resume', 'player__pause');
        init();

        var arrayBuffer;
        var fileReader = new FileReader();
        fileReader.onload = function() {
            arrayBuffer = this.result;
            createApp(arrayBuffer);
        };

        fileReader.readAsArrayBuffer(audiofile);
    }

    function changePlayButtonState(button1, button2) {
        document.getElementById(button1).setAttribute('class', 'hidden');
        document.getElementById(button2).setAttribute('class', '');
    }

    function playSound() {
        document.querySelector('.player__volume').value = Math.floor(gainNode.gain.value*100);

        if(context) {
            var state = context.state;
            if(state === 'suspended') {
                changePlayButtonState('player__resume', 'player__pause');
                context.resume();
                console.log('resume play!');
            }
            else if(state === 'running') {
                changePlayButtonState('player__pause', 'player__resume');
                context.suspend();
                console.log('pause!');
            }
            else if(state === 'closed') {
                getSound(audiofile);
                console.log('play again!');
            }
        }
        else {
            console.log('There is no audio context');
        }
    }

    function stopSound() {
        if(context) {
            soundSource.stop(context.currentTime);
            context.close();
            cancelAnimationFrame(animation);
            Array.prototype.forEach.call(bars, function(v, i) {
                v.style.height = '0px';
            });
            changePlayButtonState('player__pause', 'player__resume');
            console.log('stop!');
        }
        else {
            console.log('There is no audio context');
        }

    }

    function changeVolume(event) {
        var elem = event.target;
        gainNode.gain.value = parseInt(elem.value) / 100;
    };

    document.querySelector('.player__play').addEventListener('click', playSound);
    document.querySelector('.player__stop').addEventListener('click', stopSound);
    document.querySelector('.player__volume').addEventListener('input', changeVolume);


    function createApp(audioData) {

        var soundBuffer;
        soundSource = context.createBufferSource();
        context.decodeAudioData(audioData, function(soundBuffer){
            soundSource.buffer = soundBuffer;
        });

        gainNode = context.createGain();
        soundSource.connect(gainNode);
        gainNode.connect(context.destination);

        var analyser = context.createAnalyser();
        soundSource.connect(analyser);
        var frequencyData = new Uint8Array(analyser.frequencyBinCount);
        var dataOnBar = Math.floor(frequencyData.length / bars.length);

        function renderFrame() {
            animation = requestAnimationFrame(renderFrame);
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

        document.querySelector('.player__volume').value = 100;

        soundSource.start(context.currentTime);

        renderFrame();
    }

    document.getElementById('add_files').addEventListener('change', function(event) {
        handleFileSelect(event.target);
    });

    var counter = 0;
    player.addEventListener('dragenter', function(event) {
        counter++;
        player.setAttribute('class', 'player player--hovered');
    });

    player.addEventListener('dragleave', function(event) {
        if (--counter === 0) {
            player.setAttribute('class', 'player');
        }
    });

    player.addEventListener('drop', function(event) {
        event.preventDefault();
        if (--counter === 0) {
            player.setAttribute('class', 'player');
        }
        handleFileSelect(event.dataTransfer);
    });

    document.addEventListener('dragover', function(event) {
        event.preventDefault();
    });

}());