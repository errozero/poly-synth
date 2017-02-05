var synth = function(config){
	
	this.context = config.context;
	this.masterGainNode = this.context.createGain();
	this.notes = {};
	this.noteVoiceLog = {};

	this.polyphony = 8;
	this.oscsPerVoice = 2;
	this.lastVoice = 0;

	this.oscNodes = [];
	this.ampNodes = [];
	this.filterNodes = [];
	this.filterMaxFreq = 3500;
	this.filterMinFreq = 10;
	
	//Used in envelopes to help prevent clicking
	this.timePadding = 0.03;

	this.masterVolume = 0.09;

	//Control values
	this.ampEnv = {
		attack: 0,
		decay: 0,
		sustain: 0,
		release: 0,
	};

	this.filtEnv = {
		attack: 0,
		decay: 0,
		sustain: 0,
		release: 0,
	};

	this.filtCutoffFrequency = this.filterMinFreq;

	this.oscTuning = [0,0];
	this.oscFineTuning = [0,0];

	//Preset values for all controls
	this.presets = [
		{name: 'Default', value: [0,64,64,64,10,64,64,0 ,127,0, 0, 64, 64, 0, 64, 64, 0] },
		{name: 'Crystals', value: [0,64,64,64,0,64,64,32 ,127,0, 0, 64, 64, 0, 64, 64, 0] },
		{name: 'Slow', value: [127,0,0,16,127,0,0,16 ,127,0, 0, 64, 64, 0, 64, 64, 0] },
		{name: 'Bass One', value: [0, 127, 127, 4, 0, 1, 0, 1, 127, 0, 0, 64, 64, 1, 64, 64, 0] }
	];

	this.currentPreset = 0;

	this.controls = [
		{label: 'Amplitude Attack', type: 'knob', value: 0},
		{label: 'Amplitude Decay', type: 'knob', value: 0},
		{label: 'Amplitude Sustain', type: 'knob', value: 0},
		{label: 'Amplitude Release', type: 'knob', value: 0},

		{label: 'Filter Attack', type: 'knob', value: 0},
		{label: 'Filter Decay', type: 'knob', value: 0},
		{label: 'Filter Sustain', type: 'knob', value: 0},
		{label: 'Filter Release', type: 'knob', value: 0},

		{label: 'Filter Cutoff', type: 'knob', value: 0},
		{label: 'Filter Resonance', type: 'knob', value: 0},
		{label: 'Filter Type LP', type: 'radio', value: 0},

		{label: 'Oscillator 1 CRS', type: 'knob', value: 0},
		{label: 'Oscillator 1 Fine', type: 'knob', value: 0},
		{label: 'Oscillator 1 Type', type: 'radio', value: 0},
		{label: 'Oscillator 2 CRS', type: 'knob', value: 0},
		{label: 'Oscillator 2 Fine', type: 'knob', value: 0},
		{label: 'Oscillator 2 Type', type: 'radio', value: 0},

	];

	//Data to include in the synths ui - passed in with handlebars
	this.viewData = {
		presets: this.presets,
		oscillators: [
			{id: 1, tuneControlID: 11, fineTuneControlID: 12, typeControlID: 13},
			{id: 2, tuneControlID: 14, fineTuneControlID: 15, typeControlID: 16}
		]
	};

	this.init();

};

synth.prototype = {

	init: function(){

		console.log('Synth created');
		
		//Set master volume of this instrument connect gain
		this.masterGainNode.gain.value = this.masterVolume;

		this.createNodes();
		this.connectNodes();

		//Load default preset
		this.loadPreset(this.currentPreset);
		
		//Set initial values of all controls
		//this.initControlValues();

		var self = this;
		window.requestAnimationFrame(function render(){
			self.animate();
			window.requestAnimationFrame(render);
		});

	},

	//-------

	createNodes: function(){

		//Loop through the voices count (polyphony) and create oscillator, filter and gain nodes
		for(var i=0; i<this.polyphony; i++){
			
			//Osc's for each voice
			var voice = [];
			for(var oscNum=0; oscNum<this.oscsPerVoice; oscNum++){
				var osc = this.context.createOscillator();
				osc.type = 'sawtooth';
				osc.detune.value = (oscNum*6);

				voice.push(osc);
			}

			//Start oscs playing
			for(var key in voice){
				voice[key].start();
			}

			//Create amp (gain) node and set volume to 0
			var amp = this.context.createGain();
			amp.gain.value = 0;
			
			//Create filter node
			var filter = this.context.createBiquadFilter();
			filter.frequency.value = this.filterMinFreq;
			filter.Q.value = 10;
			filter.type = 'lowpass';

			this.oscNodes.push(voice);
			this.ampNodes.push(amp);
			this.filterNodes.push(filter);
			
		}

	},

	//-------

	connectNodes: function(){

		//Loop through each voice and connect the nodes together
		for(var i=0; i<this.polyphony; i++){

			//Connect the osc nodes for this voice to the voice amp (gain) node
			for(var oscNum=0; oscNum<this.oscsPerVoice; oscNum++){
				this.oscNodes[i][oscNum].connect(this.filterNodes[i]);
			}
			
			//Connect the filter node to the gain node
			this.filterNodes[i].connect(this.ampNodes[i]);

			//Connect the amp node for this voice to the filter node
			this.ampNodes[i].connect(this.masterGainNode);

			//TODO - Connect master gain node to a mixer channel rather than directly to destination
			//Connect master gain node to destination (speakers)
			this.masterGainNode.connect(this.context.destination);

		}

	},

	//-------

	initControlValues: function(){
		for(var i=0; i<this.controls.length; i++){
			this.setControlValue(i, this.controls[i].value);
		}
	},

	//-------

	setControlValue: function(id, value){

		var midiValue = value;

		//Convert midi value to percentage
		var valuePercent = (value / 127) * 100;

		switch(id){
			case 0:
				//Amp attack
				var minAttack = 0.001;
				var maxAttack = 4;
				var attackTime = (maxAttack / 100) * valuePercent;
				this.ampEnv.attack = attackTime + minAttack;
				break;
			case 1:
				//Amp decay
				var minDecay = 0.001;
				var maxDecay = 2;
				var decayTime = (maxDecay / 100) * valuePercent;
				this.ampEnv.decay = decayTime + minDecay;
				break;
			case 2:
				//Amp sustain
				var minSustain = 0;
				var maxSustain = 1;
				var sustainValue = (maxSustain / 100) * valuePercent;
				this.ampEnv.sustain = sustainValue;
				break;
			case 3: 
				//Amp release
				var minRelease = 0.001;
				var maxRelease = 4;
				var releaseTime = (maxRelease / 100) * valuePercent;
				this.ampEnv.release = releaseTime + minRelease;
				break;
			case 4: 
				//Filter attack
				var minAttack = 0.001;
				var maxAttack = 4;
				var attackTime = (maxAttack / 100) * valuePercent;
				this.filtEnv.attack = attackTime + minAttack;
				break;
			case 5:
				//Filter decay
				var minDecay = 0.001;
				var maxDecay = 2;
				var decayTime = (maxDecay / 100) * valuePercent;
				this.filtEnv.decay = decayTime + minDecay;
				break;
			case 6:
				//Filter sustain (Stored as percentage)
				var minSustain = this.filterMinFreq;
				var maxSustain = (this.filterMaxFreq - minSustain);
				//var sustainValue = ((maxSustain / 100) * valuePercent) + minSustain;
				//this.filtEnv.sustain = sustainValue;
				this.filtEnv.sustain = valuePercent;
				break;
			case 7:
				//Filter release
				var minRelease = 0.01;
				var maxRelease = 4;
				var releaseTime = (maxRelease / 100) * valuePercent;
				this.filtEnv.release = releaseTime + minRelease;
				break;
			case 8:
				//Filter cutoff
				var value = ( (this.filterMaxFreq - this.filterMinFreq) / 100) * valuePercent;
				value += this.filterMinFreq;
				this.filtCutoffFrequency = value;
				break;
			case 9:
				//Filter resonance
				var maxResonance = 20;
				var value = (maxResonance / 100) * valuePercent;
				for(var i=0; i<this.polyphony; i++){
					this.filterNodes[i].Q.setValueAtTime(value, this.context.currentTime);
				}
				break
			case 10:
				//Toggle filter type
				var options = {
					'0': 'lowpass',
					'127': 'highpass'
				};

				var filterType = options[value];

				for(var i=0; i<this.polyphony; i++){
					this.filterNodes[i].type = filterType;
				}

				break

			case 11:
				//Osc 1 CRS Tuning
				this.setOscTune(0, value);
				break;
			case 12:
				//Osc 1 Fine Tuning
				this.setOscFineTune(0, value);
				break;
			case 13:
				//Toggle osc 1 type 
				this.setOscType(0,value);
				break
			case 14:
				//Osc 2 CRS Tuning
				this.setOscTune(1, value);
				break;
			case 15:
				//Osc 2 Fine Tuning
				this.setOscFineTune(1, value);
				break;
			case 16:
				//Toggle osc 2 type 
				this.setOscType(1,value);
				break
			
		};

		this.controls[id].value = midiValue;

	},

	//-------

	//Find the next free voice to use - sequential, unless a key is still pressed and using that voice
	getVoice: function(){
		
		var self = this;

		function voiceFree(voice){
			var free = true;
			for(var key in self.noteVoiceLog){
				if(self.noteVoiceLog[key] == voice){
					free = false;
				}
			}
			return free;
		}

		//Select the next voice
		var voice = this.lastVoice + 1;	
		if(voice > this.polyphony-1){
			voice = 0;
		}

		for(var i=0; i<this.polyphony; i++){

			//Check if the voice is free - use this voice if so
			//Otherwise continue in loop and check if next voice is free
			if(voiceFree(voice)){
				break;
			} else {
				voice++;
				if(voice > this.polyphony-1){
					voice = 0;
				}
			}

		}

		return voice;
	},

	//-------

	noteOn: function(noteNumber, velocity){

		//Select a voice to use
		var currentVoice = this.getVoice();
		this.lastVoice = currentVoice;

		//Keep a log of which voice this note is using (This can then be used on noteOff)
		this.noteVoiceLog[noteNumber] = currentVoice;

		//Get frequency of midi note and note start time
		var frequency = app.midiNoteToFrequency(noteNumber);

		//Set frequency of the oscillators for this voice
		var oscNode;
		for(var i=0; i<this.oscsPerVoice; i++){
			oscNode = this.oscNodes[currentVoice][i];			
			oscNode.frequency.setValueAtTime(frequency, this.context.currentTime + 0.01);
			//oscNode.detune.setValueAtTime(this.oscTuning[i], this.context.currentTime);
		}
		
		//Start the envelopes
		this.ampEnvelopeStart(currentVoice);
		this.filterEnvelopeStart(currentVoice);
		
	},

	//-------

	noteOff: function(noteNumber){
		//Find which voice was assigned to this note in the log
		if( typeof this.noteVoiceLog[noteNumber] == undefined){
			console.log('Could not find which voice is used for note: ' + noteNumber);
			return;
		}

		var voice = this.noteVoiceLog[noteNumber];
		
		//Envelope end
		this.ampEnvelopeEnd(voice);
		this.filterEnvelopeEnd(voice);

		//Remove from the log
		delete this.noteVoiceLog[noteNumber];
	},

	//-------

	ampEnvelopeStart: function(voice){

		var currentTime = this.context.currentTime;
		var ampNode = this.ampNodes[voice];
		
		//Init envelope (Set value to current value and quickly ramp to 0 to avoid clicks)
		ampNode.gain.cancelScheduledValues(currentTime);
		ampNode.gain.setValueAtTime(ampNode.gain.value, currentTime);
		ampNode.gain.linearRampToValueAtTime(0, currentTime + this.timePadding);
		
		//Attack phase
		var attackTime = this.timePadding + this.ampEnv.attack;
		ampNode.gain.linearRampToValueAtTime(1, currentTime + attackTime);

		//Decay phase (decay to sustain value)
		var decayTime = this.timePadding + this.ampEnv.decay;
		var sustainValue = this.ampEnv.sustain;
		ampNode.gain.setTargetAtTime(sustainValue, currentTime + attackTime, decayTime);

	},

	//-------

	ampEnvelopeEnd: function(voice){

		var currentTime = this.context.currentTime;
		var ampNode = this.ampNodes[voice];

		//Release phase
		ampNode.gain.cancelScheduledValues(currentTime);
		ampNode.gain.setValueAtTime(ampNode.gain.value, currentTime);
		ampNode.gain.setTargetAtTime(0, currentTime, this.timePadding + this.ampEnv.release);
	},

	//-------

	filterEnvelopeStart: function(voice){

		var currentTime = this.context.currentTime;
		var filterNode = this.filterNodes[voice];

		//Init envelope (Set value to current value and quickly ramp to filter min to avoid clicks)
		filterNode.frequency.cancelScheduledValues(currentTime);
		filterNode.frequency.setValueAtTime(filterNode.frequency.value, currentTime);
		filterNode.frequency.linearRampToValueAtTime(this.filterMinFreq, currentTime + this.timePadding);

		//Attack phase
		var attackTime = this.timePadding + this.filtEnv.attack;
		var targetFrequency = this.filtCutoffFrequency;
		filterNode.frequency.linearRampToValueAtTime(targetFrequency, currentTime + attackTime);

		//Decay phase (decay to sustain value)
		var decayTime = this.timePadding + this.filtEnv.decay;
		var sustainValue = (targetFrequency/100) * this.filtEnv.sustain;
		filterNode.frequency.setTargetAtTime(sustainValue, currentTime + attackTime, decayTime);
	},

	//-------

	filterEnvelopeEnd: function(voice){

		var currentTime = this.context.currentTime;
		var filterNode = this.filterNodes[voice];

		//Release phase
		filterNode.frequency.cancelScheduledValues(currentTime);
		filterNode.frequency.setValueAtTime(filterNode.frequency.value, currentTime);
		filterNode.frequency.setTargetAtTime(this.filterMinFreq, currentTime, this.timePadding + this.filtEnv.release);

	},

	//-------

	setOscType: function(osc, value){
		var options = [
			'sawtooth',
			'square',
			'triangle',
			'sine'
		];

		var oscType = options[value];

		for(var i=0; i<this.polyphony; i++){
			this.oscNodes[i][osc].type = oscType;
		}
	},

	//-------

	setOscTune: function(osc, value){
		
		value = value-63.5;
		var tunePercent = (value/63.5)*100;

		var maxTune = (24/100) * tunePercent;
		var finalVal = Math.round((maxTune / 100) * tunePercent);

		if(tunePercent < 0){
			finalVal = -Math.abs(finalVal);
		}

		this.oscTuning[osc] = (finalVal*100);

		finalVal = this.oscFineTuning[osc] + this.oscTuning[osc];

		console.log(this.oscTuning[osc]);

		for(var i=0; i<this.polyphony; i++){
			this.oscNodes[i][osc].detune.setValueAtTime(finalVal, this.context.currentTime);
		}

	},

	//-------

	setOscFineTune: function(osc, value){
		value = value-63.5;
		var tunePercent = (value/63.5)*100;

		var finalVal = Math.round(tunePercent);

		if(tunePercent < 0){
			finalVal = -Math.abs(finalVal);
		}

		this.oscFineTuning[osc] = finalVal;

		finalVal = this.oscFineTuning[osc] + this.oscTuning[osc];

		console.log(this.oscFineTuning[osc]);

		for(var i=0; i<this.polyphony; i++){
			this.oscNodes[i][osc].detune.setValueAtTime(finalVal, this.context.currentTime);
		}
	},

	//-------

	loadPreset: function(id){
		console.log('Loading preset: ' + this.presets[id].name);
		this.currentPreset = id;
		for(var i=0; i<this.controls.length; i++){
			this.setControlValue(i, this.presets[id].value[i]);
		}
	},

	//-------

	dumpPresetToConsole: function(){
		var controlValues = '[';
		for(var i=0; i<this.controls.length; i++){
			controlValues += this.controls[i].value;
			if(i<this.controls.length-1){
				controlValues += ', ';
			}
		}
		controlValues += ']';
		console.log(controlValues);
		return true;
	},

	//-------

	animate: function(){
		var gainValue, gainPercent, filtValue, filtPercent;
		for(var key in this.ampNodes){
			gainValue = this.ampNodes[key].gain.value;
			gainPercent = Math.floor(gainValue * 100);
			filtValue = this.filterNodes[key].frequency.value;
			filtPercent = Math.floor( (filtValue / this.filterMaxFreq) * 100)

			$('.js-voice-level[data-id="' + key + '"] div').height(gainPercent + '%');
			$('.js-voice-filter[data-id="' + key + '"] div').height(filtPercent + '%');
		}
	}

};