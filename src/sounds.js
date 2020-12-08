import * as Tone from "tone";
let effect, reverb;

function createEffects() {
  effect = new Tone.FeedbackDelay().toDestination(); // create a delay effect and connect it to the master output
  reverb = new Tone.Reverb({
    // connect a reverb effect and connect it to the master output
    decay: 4, // decay time of 2 seconds.
    wet: 1.0, // fully wet signal
    preDelay: 0.25 // pre-delay time of 0.25 seconds
  });
}

createEffects();

export class CrashSound {
  constructor() {
    this.synth = new Tone.PolySynth({
      volume: -10
    }).toDestination();
    this.synth.connect(effect);
    this.synth.connect(reverb);
    this.synth.set({
      volume: -30,
      envelope: {
        attack: 0.001,
        decay: 0.3,
        sustain: 0.01,
        release: 1.3
      }
    });
    this.synth.set({
      oscillator: {
        type: "square"
      }
    });

    this.pattern = new Tone.Pattern(
      function (time, note) {
        this.synth.triggerAttackRelease(note, "16n");
      }.bind(this),
      ["C4", "C5", "D4", "D5", "E5", "E5", "C6", "D6", "E6", "F6", "G6"],
      "up"
    );
    //https://tonejs.github.io/docs/r12/CtrlPattern

    this.pattern.loop = false;
    this.pattern.interval = "32n";
  }

  reset() {}

  play() {
    this.pattern.index = 0; //reset the index
    this.pattern.stop(); //stop pattern first
    if (this.pattern.state !== "started") {
      //check wether the pattern has already started and if not start it
      this.pattern.start().stop("+0.2"); //start the pattern then stop
    }
  }
}

export class DrumBackingTrack {
  //example: https://tonejs.github.io/examples/shiny
  constructor() {
    //a compressor
    this.drumCompress = new Tone.Compressor({
      // https://tonejs.github.io/docs/14.7.34/Compressor
      volume: -30, // reducing output volume by 30 dB
      threshold: -30, //setting compressor's threshold to -30dB
      ratio: 10, //seyying gain reduction ratio at 10:1
      attack: 0.01, //fast attack
      release: 0.2 //fast release
    }).toDestination(); //connect to master

    this.distortion = new Tone.Distortion({
      // https://tonejs.github.io/docs/14.7.28/Distortion
      distortion: 0.4, //distortion amount (0-1) so setting at 40%
      wet: 0.4 // mix between wet and dry signals (0-1) also 40%
    });
    //hats
    this.hats = new Tone.Player({
      url: "https://tonejs.github.io/audio/drum-samples/CR78/hihat.mp3",
      volume: -53, //reducing volume by 53 dB
      fadeOut: 0.01 //adding a short fade out
    }).chain(this.distortion, this.drumCompress); //using the chain method to connect the hi hat player though distortion and compression

    this.hatsLoop = new Tone.Loop({
      //https://tonejs.github.io/docs/14.7.58/Loop.html
      callback: function (time) {
        //setting the callback function though the js object being passed to the constructor
        this.hats.start(time).stop(time + 0.05); //starting the player then stopping it 0.05 secounds afterwards
      }.bind(this), //we bind this callback function through the js object being passed to the constructor
      interval: "16n", // 16th note (semiquaver) divison
      probability: 1.0 //setting to 1.0 means this will trigger on every 16th note. try reducing the probability to see what happens
    }).start("1m");

    //snare
    this.snare = new Tone.Player({
      //as above for the hi hat
      url: "https://tonejs.github.io/audio/drum-samples/breakbeat9/snare.mp3",
      fadeOut: 0.1,
      volume: -41
    }).chain(this.distortion, this.drumCompress);
    this.snarePart = new Tone.Sequence( // https://tonejs.github.io/docs/14.7.58/Sequence
      function (time, velocity) {
        this.snare.start(time).stop(time + 0.5); //starting the player then stopping it 0.05 seconds afterwards
      }.bind(this), //we bind this callback function to the current execution context so that "this" relates to our object instance, not the annoymous callback function's "this"
      [null, 1, null, 1], //using null so that the function doesnt get called on the 1 and 3 divisions, only on the 2 and 4 divisions.
      "4n" //tigger interval is quater notes (quavers)
    ).start("1m"); //start 1 measure (1 bar) after the Tone.Transport has started. This ensures everything starts together

    //kick
    this.kick = new Tone.MembraneSynth({
      //https://tonejs.github.io/docs/14.7.58/MembraneSynth
      volume: -30, //reduce volume by 30 dB
      pitchDecay: 0.09, //setting a short pitch decay
      octaves: 6, //fairly high number of octaves for the pitch to ramp down over
      oscillator: {
        //setting oscillator type to square wave for some timbral complexity
        type: "square4"
      },
      envelope: {
        //percussive envelope
        attack: 0.0001,
        decay: 0.2,
        sustain: 0.0
      }
    }).connect(this.drumCompress); //connecting to the compressor
    this.kickPart = new Tone.Sequence(
      //https://tonejs.github.io/docs/14.7.58/Sequence
      (time, probability) => {
        this.kick.triggerAttackRelease("C1", time); //triggering the attack and release phases immediatly to get the percussive envelope effect
      },
      [
        //a sequence array of kick drum probabilities: a none "null" means the kick will be triggered, all other divisons are null so a kick is not triggered
        1,
        null,
        null,
        null,
        null,
        1,
        null,
        null,
        null,
        1,
        null,
        null,
        null,
        null,
        null,
        1
      ],

      "8n" //sequence callback will be called on 8th note (quaver)
    ).start("1m"); //start 1 measure (1 bar) after the Tone.Transport has started. this ensures everything starts together
  }
}

export class BassBackingTrack {
  constructor() {
    this.bass = new Tone.FMSynth({
      //https://tonejs.github.io/docs/14.7.58/FMSynth.html
      volume: -14, //reduce volume by 14dB
      harmonicity: 3, //set harmonicity to 3 - the ratio between the two voices
      modulationIndex: 3.5, //set modulation index amount - this is basically the amount of modulation
      oscillator: {
        //setting a custom oscillator wave form with specific partials
        type: "custom",
        partials: [0, 1, 0, 2]
      },
      envelope: {
        //percussive amplitude envelope
        attack: 0.08,
        decay: 0.3,
        sustain: 0
      },
      modulation: {
        //using sawtooth wave as the modulator
        type: "sawtooth"
      },
      modulationEnvelope: {
        //fairly slow attack on the modulation envelope which controls modulation amount
        attack: 0.1,
        decay: 0.2,
        sustain: 0.3,
        release: 0.01
      }
    }).toDestination(); //connect bass to master
    this.bass.connect(reverb); //connect bass to reverb

    this.bassPart = new Tone.Part(
      // https://tonejs.github.io/docs/14.7.58/Part.html
      function (time, event) {
        //callback function
        if (Math.random() < event.prob) {
          //is a random float between 0 and 1 (exlusive) less than the probability we've set below?
          this.bass.triggerAttackRelease(event.note, event.dur, time); //trigger our bass sound with the corresponding note array below
        }
      }.bind(this), //we bind this callback function to the current execution context so that "this" relates to our object instance, not the annoymous callback function's "this"
      [
        //an array of JS objects containing note for timing, note number, duration and probability which is used in the callback above
        { time: "0:0", note: "C2", dur: "4n.", prob: 1 },
        { time: "0:2", note: "C2", dur: "8n", prob: 0.6 },
        { time: "0:2.6666", note: "C2", dur: "8n", prob: 0.4 },
        { time: "0:3.33333", note: "C2", dur: "8n", prob: 0.9 },
        { time: "1:0", note: "C2", dur: "4n.", prob: 1 },
        { time: "1:2", note: "C2", dur: "8n", prob: 0.6 },
        { time: "1:2.6666", note: "C2", dur: "8n", prob: 0.4 },
        { time: "1:3.33333", note: "F2", dur: "8n", prob: 0.9 },
        { time: "2:0", note: "F2", dur: "4n.", prob: 1 },
        { time: "2:2", note: "F2", dur: "8n", prob: 0.6 },
        { time: "2:2.6666", note: "F2", dur: "8n", prob: 0.4 },
        { time: "2:3.33333", note: "F2", dur: "8n", prob: 0.9 },
        { time: "3:0", note: "F2", dur: "4n.", prob: 1 },
        { time: "3:2", note: "F2", dur: "8n", prob: 0.6 },
        { time: "3:2.6666", note: "F2", dur: "8n", prob: 0.4 },
        { time: "3:3.33333", note: "F1", dur: "8n", prob: 0.9 }
      ]
    ).start("1m"); //start 1 measure (1 bar) after the Tone.Transport has started. this ensures everything starts together

    this.bassPart.loop = true; //loop our part
    this.bassPart.loopEnd = "4m"; //make sure we loop every 4 measures (bars)
  }
}
