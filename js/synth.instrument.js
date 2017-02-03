var synth = function(config){
	
	this.instrumentName = 'Synth101';
	this.instrumentID = config.instrumentID || Date.now();
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

	//Preset values for all controls
	this.presets = [
		{name: 'default', value: [0,64,64,64,10,64,64,0] },
		{name: 'Crystals', value: [0,64,64,64,0,64,64,32] },
		{name: 'Slow', value: [127,0,0,16,127,0,0,16] }
	];

	this.controls = [
		{label: 'Amplitude Attack', type: 'knob', value: 0},
		{label: 'Amplitude Decay', type: 'knob', value: 0},
		{label: 'Amplitude Sustain', type: 'knob', value: 0},
		{label: 'Amplitude Release', type: 'knob', value: 0},
		{label: 'Filter Attack', type: 'knob', value: 0},
		{label: 'Filter Decay', type: 'knob', value: 0},
		{label: 'Filter Sustain', type: 'knob', value: 0},
		{label: 'Filter Release', type: 'knob', value: 0},
	];


	this.init();

	console.log(this.instrumentName + ' Created - Id: ' + this.instrumentID);

};

synth.prototype = {

	init: function(){

		//Load default preset
		this.loadPreset(1);
		
		//Set master volume of this instrument connect gain
		this.masterGainNode.gain.value = this.masterVolume;

		this.createNodes();
		this.connectNodes();
		
		//Set initial values of all controls
		this.initControlValues();

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
			filter.Q.value = -10;
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
		this.controls[id].value = value;
		
		console.log(this.controls[id].label + ' - ' + value);

		//Convert midi value to percentage
		var valuePercent = (value / 127) * 100;

		switch(id){
			case 0:
				//Amp attack
				var minAttack = 0.001;
				var maxAttack = 4;
				var attackTime = (maxAttack / 100) * valuePercent;
				for(var i=0; i<this.polyphony; i++){
					this.ampEnv.attack = attackTime + minAttack;
				}
				break;
			case 1:
				//Amp decay
				
				break;
			case 2:
				//Amp sustain
				
				break;
			case 3: 
				//Amp release
				var minRelease = 0.001;
				var maxRelease = 4;
				var releaseTime = (maxRelease / 100) * valuePercent;
				for(var i=0; i<this.polyphony; i++){
					this.ampEnv.release = releaseTime + minRelease;
				}
				break;
			case 4: 
				//Filter attack
				var minAttack = 0.001;
				var maxAttack = 4;
				var attackTime = (maxAttack / 100) * valuePercent;
				for(var i=0; i<this.polyphony; i++){
					this.filtEnv.attack = attackTime + minAttack;
				}
				break;
			case 5:
				//Filter decay

				break;
			case 6:
				//Filter sustain

				break;
			case 7:
				//Filter release
				var minRelease = 0.01;
				var maxRelease = 4;
				var releaseTime = (maxRelease / 100) * valuePercent;
				for(var i=0; i<this.polyphony; i++){
					this.filtEnv.release = releaseTime + minRelease;
				}
				break;
		};

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

		//Keep a log which voice this note is using (This can then be used on noteOff)
		this.noteVoiceLog[noteNumber] = currentVoice;

		console.log(noteNumber + ' using voice: ' + currentVoice);

		//Get frequency of midi note and note start time
		var frequency = app.midiNoteToFrequency(noteNumber);
		var startTime = this.context.currentTime;

		var ampNode = this.ampNodes[currentVoice];
		var filterNode = this.filterNodes[currentVoice];


		//Set frequency of the oscillators for this voice
		var oscNode;
		for(var i=0; i<this.oscsPerVoice; i++){
			oscNode = this.oscNodes[currentVoice][i];
			
			oscNode.type = 'sawtooth';
			//Tuning for second osc
			//if(i ==1){
				oscNode.detune.value = (i*3);
			//}

			if(i==1){
				oscNode.type = 'square';
				//frequency = app.midiNoteToFrequency(noteNumber+24);
			}

			oscNode.frequency.setValueAtTime(frequency, startTime + 0.01);

		}
		
		//Amp envelope
		ampNode.gain.cancelScheduledValues(startTime);
		ampNode.gain.setValueAtTime(ampNode.gain.value, startTime);
		ampNode.gain.linearRampToValueAtTime(0, startTime + this.timePadding);
		ampNode.gain.linearRampToValueAtTime(1, startTime + this.timePadding + this.ampEnv.attack);

		//Filter envelope
		filterNode.frequency.cancelScheduledValues(startTime);
		filterNode.frequency.setValueAtTime(filterNode.frequency.value, startTime);
		filterNode.frequency.linearRampToValueAtTime(this.filterMinFreq, startTime + this.timePadding);
		filterNode.frequency.linearRampToValueAtTime(this.filterMaxFreq, startTime + this.timePadding + this.filtEnv.attack);
		
	},

	//-------

	noteOff: function(noteNumber){
		//Find which voice was assigned to this note in the log
		if( typeof this.noteVoiceLog[noteNumber] == undefined){
			console.log('Could not find which voice is used for note: ' + noteNumber);
			return;
		}

		var voice = this.noteVoiceLog[noteNumber];
		var ampNode = this.ampNodes[voice];
		var filterNode = this.filterNodes[voice];

		var currentTime = this.context.currentTime;
		
		//Amp envelope
		ampNode.gain.cancelScheduledValues(currentTime);
		ampNode.gain.setValueAtTime(ampNode.gain.value, currentTime);
		//ampNode.gain.linearRampToValueAtTime(0, currentTime + this.timePadding + this.ampEnv.release);
		ampNode.gain.setTargetAtTime(0, currentTime, this.timePadding + this.ampEnv.release);

		//Filter envelope
		filterNode.frequency.cancelScheduledValues(currentTime);
		filterNode.frequency.setValueAtTime(filterNode.frequency.value, currentTime);
		filterNode.frequency.setTargetAtTime(this.filterMinFreq, currentTime, this.timePadding + this.filtEnv.release);

		//Remove from the log
		delete this.noteVoiceLog[noteNumber];
	},

	//-------

	loadPreset: function(id){
		console.log('Loading preset: ' + this.presets[id].name);
		for(var i in this.controls){
			this.controls[i].value = this.presets[id].value[i];
		}
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