var synth = function(config){
	
	this.context = config.context;
	this.masterGainNode = null;
	this.notes = {};
	this.noteVoiceLog = {};

	this.polyphony = 16;
	this.oscsPerVoice = 2;
	this.lastVoice = 0;

	this.oscNodes = [];
	this.ampNodes = [];
	this.filterNodes = [];
	this.filterGainNodes = [];
	this.filterEnvelopeNodes = [];
	this.filterEnvelopeOscs = [];

	this.lfoNodes = [];
	this.lfoGainNodes = [];

	this.filterMaxFreq = 7200;
	this.filterMinFreq = 60;
	
	//Used in envelopes to help prevent clicking
	this.timePadding = 0.03;

	this.masterVolume = 0.3;

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
		{name: 'Basic', value: [0, 64, 64, 0, 0, 64, 64, 0, 127, 0, 0, 64, 64, 0, 64, 64, 0, 16, 0, 0, 0, 16, 0, 0, 3] },
		{name: 'Night Ride', value: [0, 64, 64, 14, 0, 64, 64, 7, 113, 32, 0, 64, 77, 0, 64, 64, 0, 16, 0, 0, 0, 16, 0, 0, 3] },
		{name: 'Crystal Caves', value: [0, 64, 64, 9, 0, 0, 60, 27, 127, 0, 0, 127, 71, 1, 127, 64, 1, 16, 0, 0, 0, 53, 1, 0, 2] },
		{name: 'Old VHS Tape', value: [0, 64, 64, 55, 0, 33, 10, 30, 68, 67, 0, 64, 64, 1, 65, 70, 1, 4, 7, 3, 3, 6, 1, 3, 2] },
		{name: 'Sunburst Pad', value: [20, 64, 64, 52, 26, 42, 0, 52, 64, 51, 0, 64, 64, 0, 108, 69, 1, 16, 0, 0, 0, 16, 0, 0, 3] },
		{name: 'Cascade Pad', value: [127, 64, 64, 70, 0, 80, 0, 102, 64, 59, 0, 108, 72, 0, 108, 65, 0, 16, 0, 0, 0, 14, 9, 1, 3] },
		{name: 'Rave Sound', value: [0, 4, 0, 0, 0, 64, 64, 5, 88, 0, 0, 108, 63, 0, 113, 64, 0, 16, 0, 0, 0, 16, 0, 0, 3] },
		{name: 'Fatalogue', value: [0, 64, 64, 14, 4, 18, 0, 12, 49, 61, 0, 18, 83, 0, 19, 64, 0, 16, 0, 0, 0, 16, 0, 0, 3] },
		{name: 'Hazy Morning', value: [0, 64, 64, 18, 0, 113, 72, 127, 56, 99, 0, 64, 65, 0, 108, 69, 1, 5, 14, 3, 3, 27, 1, 3, 0] },
		{name: 'Wub One', value: [0, 52, 66, 3, 25, 94, 87, 0, 76, 127, 0, 0, 61, 1, 18, 80, 0, 0, 0, 2, 3, 18, 127, 3, 3] },
		{name: 'Freeze Ray FX', value: [6, 64, 64, 17, 22, 63, 63, 17, 127, 53, 0, 127, 127, 0, 127, 64, 1, 16, 63, 0, 0, 101, 6, 3, 2] },
	];

	this.currentPreset = 1;

	this.controls = [
		{id: 0, label: 'Amplitude Attack', type: 'knob', value: 0},
		{id: 1, label: 'Amplitude Decay', type: 'knob', value: 0},
		{id: 2, label: 'Amplitude Sustain', type: 'knob', value: 0},
		{id: 3, label: 'Amplitude Release', type: 'knob', value: 0},

		{id: 4, label: 'Filter Attack', type: 'knob', value: 0},
		{id: 5, label: 'Filter Decay', type: 'knob', value: 0},
		{id: 6, label: 'Filter Sustain', type: 'knob', value: 0},
		{id: 7, label: 'Filter Release', type: 'knob', value: 0},

		{id: 8, label: 'Filter Cutoff', type: 'knob', value: 0},
		{id: 9, label: 'Filter Resonance', type: 'knob', value: 0},
		{id: 10, label: 'Filter Type LP', type: 'radio', value: 0},

		{id: 11, label: 'Oscillator 1 CRS', type: 'knob', value: 0},
		{id: 12, label: 'Oscillator 1 Fine', type: 'knob', value: 0},
		{id: 13, label: 'Oscillator 1 Type', type: 'radio', value: 0},
		{id: 14, label: 'Oscillator 2 CRS', type: 'knob', value: 0},
		{id: 15, label: 'Oscillator 2 Fine', type: 'knob', value: 0},
		{id: 16, label: 'Oscillator 2 Type', type: 'radio', value: 0},

		{id: 17, label: 'LFO 1 Rate', type: 'knob', value: 0},
		{id: 18, label: 'LFO 1 Amount', type: 'knob', value: 0},
		{id: 19, label: 'LFO 1 Shape', type: 'radio', value: 0},
		{id: 20, label: 'LFO 1 Target', type: 'radio', value: 0},

		{id: 21, label: 'LFO 2 Rate', type: 'knob', value: 0},
		{id: 22, label: 'LFO 2 Amount', type: 'knob', value: 0},
		{id: 23, label: 'LFO 2 Shape', type: 'radio', value: 0},
		{id: 24, label: 'LFO 2 Target', type: 'radio', value: 0},

	];

	//Data to include in the synths ui - passed in with handlebars
	this.viewData = {
		presets: this.presets,
		oscillators: [
			{id: 1, tuneControlID: 11, fineTuneControlID: 12, typeControlID: 13},
			{id: 2, tuneControlID: 14, fineTuneControlID: 15, typeControlID: 16}
		],
		lfos: [
			{id: 1, rateControlID: 17, amountControlID: 18, shapeControlID: 19, targetControlID: 20 },
			{id: 2, rateControlID: 21, amountControlID: 22, shapeControlID: 23, targetControlID: 24 },
		]
	};	

	this.init();

};

synth.prototype = {

	init: function(){
		
		this.createNodes();
		this.connectNodes();

		//Load default preset
		this.loadPreset(this.currentPreset);
		
	},

	//-------

	createNodes: function(){

		var self = this;

		//Loop through the voices count (polyphony) and create oscillator, filter and gain nodes
		for(var i=0; i<this.polyphony; i++){
			
			//Osc's for each voice
			var voice = [];
			for(var oscNum=0; oscNum<this.oscsPerVoice; oscNum++){
				var osc = this.context.createOscillator();
				osc.type = 'sawtooth';
				osc.detune.value = (oscNum*0.5);

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


			//Push all the nodes into the relevant arrays
			this.oscNodes.push(voice);
			this.ampNodes.push(amp);
			this.filterNodes.push(filter);
			
		}

		//Create 2 LFO Oscillators and gain nodes
		for(var i=0; i<2; i++){
			
			var lfoNode = this.context.createOscillator();
			lfoNode.frequency.value = 1.5;
			lfoNode.start();
			
			var lfoGainNode = this.context.createGain();
			lfoGainNode.gain.value = 1050;

			this.lfoNodes.push(lfoNode);
			this.lfoGainNodes.push(lfoGainNode);

		}
		
		//Create the master gain node 
		this.masterGainNode = this.context.createGain();
		this.masterGainNode.gain.value = this.masterVolume;


	},

	//-------

	connectNodes: function(){

		//Connect the lfo nodes to the lfo gain nodes
		for(var key in this.lfoNodes){
			this.lfoNodes[key].connect(this.lfoGainNodes[key]);
		}

		//Loop through each voice and connect the nodes together
		for(var i=0; i<this.polyphony; i++){

			//Connect the osc nodes for this voice to the voice filter node
			for(var oscNum=0; oscNum<this.oscsPerVoice; oscNum++){
				this.oscNodes[i][oscNum].connect(this.filterNodes[i]);
			}
			
			//Connect the filter node to the amp node
			this.filterNodes[i].connect(this.ampNodes[i]);

			//Connect the amp node to the master node
			this.ampNodes[i].connect(this.masterGainNode);

			//Connect master gain node to destination (speakers)
			this.masterGainNode.connect(this.context.destination);

			//Connect lfo to filter
			for(var key in this.lfoNodes){
				this.lfoGainNodes[key].connect(this.filterNodes[i].detune);
			}

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
				var maxDecay = 3;
				var decayTime = (maxDecay / 100) * valuePercent;
				this.filtEnv.decay = decayTime;
				break;
			case 6:
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
				//var value = ((this.filterMaxFreq/100) * valuePercent) + this.filterMinFreq;
				
				this.filtCutoffFrequency = value;
				var value = ((7/100) * valuePercent) + 2;
				value = Math.pow(2, value);

				var voice;
				for(var key in this.noteVoiceLog){
					voice = this.noteVoiceLog[key];
					//this.filterNodes[voice].frequency.setValueAtTime(value, this.context.currentTime);
				}

				for(var i=0; i<this.polyphony; i++){
					this.filterNodes[i].frequency.setValueAtTime(value, this.context.currentTime);
				}
				

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
			
			//=========
			//--OSC 1--
			//=========
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

			//=========
			//--OSC 2--
			//=========
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
				break;
			
			//=========
			//--LFO 1--
			//=========
			case 17:
				//LFO 1 rate
				this.setLfoRate(0, value);
				break;
			case 18: 
				//LFO 1 amount
				this.setLfoAmount(0, value);
				break;
			case 19: 
				//LFO 1 shape
				this.setLfoShape(0, value);
				break
			case 20:
				//LFO 1 target
				this.setLfoTarget(0, value);
				break;

			//=========
			//--LFO 2--
			//=========
			case 21:
				//LFO 2 rate
				this.setLfoRate(1, value);
				break;
			case 22: 
				//LFO 2 amount
				this.setLfoAmount(1, value);
				break;
			case 23: 
				//LFO 2 shape
				this.setLfoShape(1, value);
				break;
			case 24:
				//LFO 2 target
				this.setLfoTarget(1, value);
				break;



			
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

		//Get frequency of midi note and note start time
		var frequency = app.midiNoteToFrequency(noteNumber);

		//Select a voice to use
		var currentVoice = this.getVoice();
		this.lastVoice = currentVoice;

		//Keep a log of which voice this note is using (This can then be used on noteOff)
		this.noteVoiceLog[noteNumber] = currentVoice;

		//Set frequency of the oscillators for this voice
		var oscNode;
		for(var i=0; i<this.oscsPerVoice; i++){
			oscNode = this.oscNodes[currentVoice][i];			
			oscNode.frequency.setValueAtTime(frequency, this.context.currentTime + this.timePadding	);
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
		filterNode.detune.cancelScheduledValues(currentTime);
		filterNode.detune.setValueAtTime(filterNode.detune.value, currentTime);
		//filterNode.detune.linearRampToValueAtTime(1, currentTime + this.timePadding);

		//Attack phase
		var attackTime = this.timePadding + this.filtEnv.attack;
		var targetFrequency = 7200; //this.filterMaxFreq;
		//targetFrequency = Math.pow(2, targetFrequency);
		filterNode.detune.linearRampToValueAtTime(targetFrequency, currentTime + attackTime);

		//Decay phase (decay to sustain value)
		var decayTime = this.timePadding + this.filtEnv.decay;
		var sustainPercent = this.filtEnv.sustain;

		//Calculate sustain (between current cutoff and max)
		var cutoffPercent = (this.filtCutoffFrequency/127) * 100 ;
		var minSustain = (7200 / 100) * cutoffPercent;
		var maxSustain = 7200; 

		var sustainValue = (sustainPercent * (maxSustain - minSustain) / 100) + minSustain;
		console.log(sustainValue);

		filterNode.detune.setTargetAtTime(sustainValue, currentTime + attackTime, decayTime);
	},

	//-------

	filterEnvelopeEnd: function(voice){

		var currentTime = this.context.currentTime;
		var filterNode = this.filterNodes[voice];

		//Release phase
		filterNode.detune.cancelScheduledValues(currentTime);
		filterNode.detune.setValueAtTime(filterNode.detune.value, currentTime);
		filterNode.detune.setTargetAtTime(this.filtCutoffFrequency, currentTime, this.timePadding + this.filtEnv.release);

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

	setLfoRate: function(lfoID, value){
		var percentVal = (value/127) * 100;
		var maxVal = 20;
		var minVal = 0.1;
		value = ((maxVal/100) * percentVal) + minVal;
		this.lfoNodes[lfoID].frequency.setValueAtTime(value, this.context.currentTime);
	},

	//-------

	setLfoAmount: function(lfoID, value){
		var percentVal = ( value/127 ) * 100;
		value = (2400/100) * percentVal;
		this.lfoGainNodes[lfoID].gain.setValueAtTime(value, this.context.currentTime);
	},

	//-------

	setLfoShape: function(lfoID, value){
		var shapes = ['sawtooth', 'square', 'triangle', 'sine'];
		this.lfoNodes[lfoID].type = shapes[value];
	},

	//-------

	setLfoTarget: function(lfoID, value){
		//Disconnect LFO from current target
		this.lfoGainNodes[lfoID].disconnect();

		//Loop through polyphony
		for(var i=0; i<this.polyphony; i++){

			//Connect to OSC 1 Frequency
			if(value ===0){
				this.lfoGainNodes[lfoID].connect(this.oscNodes[i][0].detune);
			}
			//Connect to OSC 2 Frequency
			else if(value == 1){
				this.lfoGainNodes[lfoID].connect(this.oscNodes[i][1].detune);
			}
			//Connect to OSC 1 & 2 Frequency
			else if(value == 2){
				this.lfoGainNodes[lfoID].connect(this.oscNodes[i][0].detune);
				this.lfoGainNodes[lfoID].connect(this.oscNodes[i][1].detune);
			}
			//Connect to Filter cutoff
			else {
				this.lfoGainNodes[lfoID].connect(this.filterNodes[i].detune);
			}

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
			//filtValue = this.filterNodes[key].frequency.value;
			filtValue = this.filterEnvelopeNodes[key].gain.value;
			//console.log(filtValue);
			filtPercent = Math.floor( (filtValue / this.filterMaxFreq) * 100)

			$('.js-voice-level[data-id="' + key + '"] div').height(gainPercent + '%');
			$('.js-voice-filter[data-id="' + key + '"] div').height(filtPercent + '%');
		}

	}

};