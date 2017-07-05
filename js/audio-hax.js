/////////////////////////////////////////////////////////////////////
// JSFX SETUP
/////////////////////////////////////////////////////////////////////
jsfxgui.createSampleGenerators("sample-generators");
jsfxgui.createConfigurationPanel("config-panel");
jsfxgui.initLogging("log");
jsfxgui.initLibrary("library");
jsfxgui.initField("libload");
jsfxgui.onplay = onplay;

function onplay(){
  console.log('played a jsfx sound');
}

var onchange = document.getElementById("playonchange");
jsfxgui.onvaluemodified = play;
function play(){
  console.log(jsfxgui.play());
}


/////////////////////////////////////////////////////////////////////
// DELAY FOR LITSYNTHS
// via: http://sonoport.github.io/sampler-and-delaynode.html
/////////////////////////////////////////////////////////////////////
function addDelayNode(audioContext, _delayTime, feedback) {

    var delay = audioContext.createDelay();
    delay.delayTime.value = _delayTime;

    var _feedback = audioContext.createGain();
    _feedback.gain.value = feedback;

    var filter = audioContext.createBiquadFilter();
    filter.frequency.value = 4000;

    filter.connect(delay);
    delay.connect(_feedback);
    _feedback.connect(filter);
    delay.connect(audioContext.destination);

    return delay;
}

var delayOne = addDelayNode(blip.getContext(), 0.3, 0.2);
delayOne.connect(blip.getContext().destination);



/////////////////////////////////////////////////////////////////////
// LITSYNTH-GENERATED INSTRUMENTS
/////////////////////////////////////////////////////////////////////
function note2freq(note) {
  return Math.pow(2, (note - 69) / 12) * 440;
}

// TODO: add a spectrum analyser
var Bass = {};
Bass.play = function(audioContext, t, note, length, oscType) {
  var o = audioContext.createOscillator();
  var g = audioContext.createGain();
  o.frequency.value = note2freq(note);
  o.type = oscType || "triangle";
  // o.type = "square";
  g.gain.setValueAtTime(1.0, t);
  g.gain.setTargetAtTime(0.0, t, length);
  o.connect(g);
  g.connect(delayOne);
  g.connect(audioContext.destination);
  o.start(t);
  // o.stop(t + 2); // this kills subsequent play() calls
};


/////////////////////////////////////////////////////////////////////
// RIFFWAVE-GENERATED SOUNDS
/////////////////////////////////////////////////////////////////////
// EFFECT
var effect = [];
for (var i=0; i<5000; i++) {
  // effect[i] = 64 + Math.round(32*(Math.cos(i*i/2000)+Math.sin(i*i/4000)));
  // effect[i] = 128 + Math.round(64*(Math.cos(i*i/2000)+Math.sin(i*i/4000)));
  var timeOsc = 250 + 500 * Math.sin(i/10000);
  effect[i] = 64 + Math.round(64*Math.cos(timeOsc*0.9));
}
var riffwaveSound03 = new RIFFWAVE();
riffwaveSound03.header.numChannels = 1;
// riffwaveSound03.header.sampleRate = 44100;
riffwaveSound03.header.bitsPerSample = 8;
riffwaveSound03.Make(effect);
var riff03 = new Audio(riffwaveSound03.dataURI);

// tone - from http://www3.nd.edu/~dthain/courses/cse20211/fall2013/wavfile/
var WAVFILE_SAMPLES_PER_SECOND = 44100/2;
var soundSeconds = 0.1;
var NUM_SAMPLES = WAVFILE_SAMPLES_PER_SECOND * soundSeconds;
var frequency = 440.0/4;
var TWO_PI = 2 * Math.PI;
var t = 0;
var sndTest = [];
for (var i=0; i < NUM_SAMPLES; i++) {
  t = i / WAVFILE_SAMPLES_PER_SECOND;
  sndTest[i] = 64 + 32 * Math.round(Math.sin(frequency * t * TWO_PI));
}
var wave7 = new RIFFWAVE();
wave7.header.numChannels = 1;
wave7.header.sampleRate = WAVFILE_SAMPLES_PER_SECOND;
// wave7.header.bitsPerSample = 16;
wave7.Make(sndTest);
var audio7 = new Audio(wave7.dataURI);


/////////////////////////////////////////////////////////////////////
// LOAD SOUNDS INTO BLIP.JS
/////////////////////////////////////////////////////////////////////

// keep track of all loaded sounds in a global library
var soundLib = [];
function loaded() {
    for(key in samplesToLoad) {
        soundLib.push(blip.clip().sample(key));
    }
}

// blip load a jsfx sound, wav sample and riffwave output ---------------------------------------
var samplesToLoad = {
  'bass-vocal': './audio/bass.wav',
  'kick': './audio/kick.wav',
  'riffwave-tone': audio7.src,
  'jsfxRand01': jsfxgui.randomize().src
};
blip.sampleLoader().samples(samplesToLoad)
.done(loaded)
.load();

// load a second set of sounds ---------------
setTimeout(function(){
  samplesToLoad = {
    'janet': './audio/janet-stab.wav',
    'snare': './audio/clap.wav',
    // 'jsfxRand02': jsfxgui.randomize().src,
    // 'jsfxRand03': jsfxgui.randomize().src
  };
  blip.sampleLoader().samples(samplesToLoad)
  .done(loaded)
  .load();
}, 2000);

// manually load a sound in ---------------
var hat = null;
setTimeout(function(){
  blip.sampleLoader().samples({'hat': './audio/hi-hat.wav'}).done(function(){
    hat = blip.clip().sample('hat');
    soundLib.push(blip.clip().sample('hat'));
  }).load();
}, 3000);


/////////////////////////////////////////////////////////////////////
// BUILD SEQUENCE PLAYER VIA BLIP.JS
/////////////////////////////////////////////////////////////////////
var melodic = blip.loop()
    .tempo(120 * 4)
    .data([{step:0, tune:0.9}, {step:1, tune:1.0}, {step:2, tune:1.1}, {step:3, tune:1.2}, {step:4, tune:1.3}, {step:5, tune:1.4}, {step:6, tune:1.5}, {step:7, tune:1.6}])
    .tick(function (t, d) {
      // console.log(d.step);
      for(var i=0; i < soundLib.length; i++) {
        if(blip.sample('kick') == soundLib[i].sample() && d.step % 4 == 0) {
          soundLib[i].play(0, { 'rate': d.tune });
        } else if(blip.sample('snare') == soundLib[i].sample() && d.step == 4) {
          soundLib[i].play(0, { 'rate': d.tune });
        } else if(blip.sample('hat') == soundLib[i].sample() && d.step % 1 == 0) {
          if (blip.chance(1.5/2)) soundLib[i].play(0, { 'rate': d.tune });
        } else if(blip.sample('bass-vocal') == soundLib[i].sample() && d.step % 8 == 0) {
          soundLib[i].play(0, { 'rate': blip.random(0.6, 1.4) });
        } else if(blip.sample('riffwave-tone') == soundLib[i].sample() && d.step % 2 == 0) {
          soundLib[i].play(0, { 'rate': d.tune/2 });
        } else {
          // randomly play the sound
          if (blip.chance(1/32)) soundLib[i].play(0, { 'rate': blip.random(0.2, 1.4) });
        }
      }
      // non-blip sample playback
      if(d.step % 2 == 0) {
        Bass.play(blip.getContext(), 0, 36 + d.step, 0.05);
      }
      if(d.step % 2 == 1) {
        // Bass.play(blip.getContext(), 0, 48 - d.step, 0.05, 'sine');
      }
});
var playing = false;
function togglePlay(e) {
  if(e.target.nodeName.toLowerCase().match(/button|input/i)) return;
  e.preventDefault();
  e.stopPropagation();
  if(playing) melodic.stop();
  else melodic.start();
  playing = !playing;
}
function togglePlayClick(e) {
  document.body.removeEventListener('click', togglePlayTouch);
  togglePlay(e);
}
function togglePlayTouch(e) {
  document.body.removeEventListener('click', togglePlayClick);
  togglePlay(e);
}
document.body.addEventListener('click', togglePlayClick);
document.body.addEventListener('touchstart', togglePlayTouch);



/////////////////////////////////////////////////////////////////////
// AUDIO VISUALIZER VIA HACKED BLIP.JS CLIP OBJECTS
/////////////////////////////////////////////////////////////////////

// frame loop for animating eq
// setup canvas
var canvas = document.getElementById('draw-canvas');
// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight;
var ctx = canvas.getContext('2d');
var frameCount = 0;
var gridSize = 100;
var numBands = canvas.width;
var TWO_PI = Math.PI * 2;
var bandRadians = TWO_PI / numBands;
var eqInterval = -1;
// loop it / draw hearts
function draw() {
  requestAnimationFrame(draw);
  // get eq size for traversal
  if(eqInterval == -1 && soundLib.length > 0) {
    eqInterval = numBands / soundLib[0].eqData().length;
  }
  if(soundLib.length == 0) return;
  // clear it out
  ctx.fillStyle = 'rgba(0,0,0,1)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // draw circles
  var rowHeight = canvas.height/soundLib.length;
  for( var i=0; i < soundLib.length; i++ ){
    var curRowY = (i+1) * rowHeight;
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.beginPath();
    ctx.moveTo(0,curRowY);
    for(var j = 0; j < numBands; j++) {
      var amp = rowHeight * soundLib[i].eqData()[j] / 255;
      ctx.lineTo(j * eqInterval, curRowY - amp);
    }
    ctx.lineTo(j * eqInterval, curRowY);
    ctx.closePath();
    ctx.fill();
  }
}
requestAnimationFrame(draw);
