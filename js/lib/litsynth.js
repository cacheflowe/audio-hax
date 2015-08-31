function note2freq(note) {
  return Math.pow(2, (note - 69) / 12) * 440;
}
function S(ac, track) {
   this.ac = ac;
   this.track = track;
   this.sink = ac.destination;
}
S.prototype.NoiseBuffer = function() {
  if (!S._NoiseBuffer) {
    S._NoiseBuffer = this.ac.createBuffer(1, this.ac.sampleRate / 10, this.ac.sampleRate);
    var cd = S._NoiseBuffer.getChannelData(0);
    for (var i = 0; i < cd.length; i++) {
      cd[i] = Math.random() * 2 - 1;
    }
  }
  return S._NoiseBuffer;
}
S.prototype.Kick = function(t) {
  var o = this.ac.createOscillator();
  var g = this.ac.createGain();
  o.connect(g);
  g.connect(this.sink);
  g.gain.setValueAtTime(1.0, t);
  g.gain.setTargetAtTime(0.0, t, 0.1);
  o.frequency.value = 100;
  o.frequency.setTargetAtTime(30, t, 0.15);
  o.start(t);
  o.stop(t + 1);
}
S.prototype.Hats = function(t) {
  var s = this.ac.createBufferSource();
  s.buffer = this.NoiseBuffer();
  var g = this.ac.createGain();
  var hpf = this.ac.createBiquadFilter();
  hpf.type = "highpass";
  hpf.frequency.value = 5000;
  g.gain.setValueAtTime(1.0, t);
  g.gain.setTargetAtTime(0.0, t, 0.02);
  s.connect(g);
  g.connect(hpf);
  hpf.connect(this.sink);
  s.start(t);
}
S.prototype.Bass = function(t, note) {
  var o = this.ac.createOscillator();
  var g = this.ac.createGain();
  o.frequency.value = note2freq(note);
  o.type = "triangle";
  g.gain.setValueAtTime(1.0, t);
  g.gain.setTargetAtTime(0.0, t, 0.1);
  o.connect(g);
  g.connect(this.sink);
  o.start(t);
  o.stop(t + 1);
}
S.prototype.clock = function() {
  var beatLen = 60 / this.track.tempo;
  return (this.ac.currentTime  - this.startTime) / beatLen;
}
S.prototype.start = function() {
  this.startTime = this.ac.currentTime;
  this.nextScheduling = 0;
  this.scheduler();
}
S.prototype.scheduler = function() {
  var beatLen = 60 / this.track.tempo;
  var current = this.clock();
  var lookahead = 0.5;
  if (current + lookahead > this.nextScheduling) {
    var steps = [];
    for (var i = 0; i < 4; i++) {
      steps.push(this.nextScheduling + i * beatLen / 4);
    }
    for (var i in this.track.tracks) {
      for (var j = 0; j < steps.length; j++) {
        var idx = Math.round(steps[j] / ((beatLen / 4)));
        var note = this.track.tracks[i][idx % this.track.tracks[i].length];
        if (note != 0) {
          this[i](steps[j], note);
        }
      }
    }
    this.nextScheduling += (60 / this.track.tempo);
  }
  setTimeout(this.scheduler.bind(this), 100);
}
var track = {
  tempo: 140,
  tracks: {
    Kick: [ 1,0,0,0, 1, 0,0,0, 1,0, 0,0, 1,0,0,0],
    Hats: [ 0,0,1,0, 0, 0,1,0, 0,0, 1,0, 0,0,1,1],
    Bass: [36,0,0,0,38,38,0,0,36,0,36,0,39,0,0,0]
  }
}
var ac = new AudioContext();
var s = new S(ac, track);
s.start();
