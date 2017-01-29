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

	this.controls = [
		{label: 'Amplitude Attack', type: 'knob', value: 64},
		{label: 'Amplitude Decay', type: 'knob', value: 64},
		{label: 'Amplitude Sustain', type: 'knob', value: 64},
		{label: 'Amplitude Release', type: 'knob', value: 64},
		{label: 'Filter Attack', type: 'knob', value: 64},
		{label: 'Filter Decay', type: 'knob', value: 64},
		{label: 'Filter Sustain', type: 'knob', value: 64},
		{label: 'Filter Release', type: 'knob', value: 64},
	];

	this.init();

	console.log(this.instrumentName + ' Created - Id: ' + this.instrumentID);

};

synth.prototype = {

	init: function(){
		
		//Set master volume of this instrument connect gain
		this.masterGainNode.gain.value = 0.3;

		this.createNodes();
		this.connectNodes();
		
		//Set initial values of all controls
		this.initControlValues();

	},

	//-------

	createNodes: function(){

		//Loop through the voices count (polyphony) and create oscillator, filter and gain nodes
		for(var i=0; i<this.polyphony; i++){
			
			//2 Osc's for each voice
			var voice = [
				this.context.createOscillator(),
				this.context.createOscillator()
			];

			//Start oscs playing
			for(var key in voice){
				voice[key].start();
			}

			//Create amp (gain) node and set volume to 0
			var amp = this.context.createGain();
			amp.gain.value = 0;
			
			//Create filter node
			var filter = this.context.createBiquadFilter();
			filter.frequency.value = 3000;
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

			//Connect the 2 osc nodes for this voice to the voice amp (gain) node
			this.oscNodes[i][0].connect(this.ampNodes[i]);
			this.oscNodes[i][1].connect(this.ampNodes[i]);
			
			//Connect the amp node for this voice to the filter node
			this.ampNodes[i].connect(this.filterNodes[i]);

			//Connect the filter node to the master gain
			this.filterNodes[i].connect(this.masterGainNode);

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
		
		switch(id){
			case 0:
				//Tune
				break;
			case 1:
				//Set cutoff
				break;
			case 1:
				//Set Res
				break;
		};

	},

	//-------

	noteOn: function(noteNumber, velocity){

		//Select a voice to use
		var currentVoice = this.lastVoice + 1;
		if(currentVoice >= this.polyphony){
			currentVoice = 0;
		}
		this.lastVoice = currentVoice;

		//Keep a log which voice this note is using (This can then be used on noteOff)
		this.noteVoiceLog[noteNumber] = currentVoice;

		console.log(noteNumber + ' using voice: ' + currentVoice);

		//Get frequency of midi note and note start time
		var frequency = app.midiNoteToFrequency(noteNumber);
		var startTime = this.context.currentTime;

		var ampNode = this.ampNodes[currentVoice];
		var filterNode = this.filterNodes[currentVoice];


		//Set frequecy of the 2 oscillators for this voice
		var oscNode;
		for(var i=0; i<this.oscsPerVoice; i++){
			oscNode = this.oscNodes[currentVoice][i];
			oscNode.frequency.setValueAtTime(frequency, startTime+ 0.01);
			oscNode.type = 'sawtooth';
			//Tuning for second osc
			if(i ==1){
				oscNode.detune.value = 6;
			}
		}
		
		//Amp envelope
		//ampNode.gain.setValueAtTime(0, startTime);
		ampNode.gain.cancelScheduledValues(startTime);
		ampNode.gain.linearRampToValueAtTime(0, startTime + 0.01);
		ampNode.gain.linearRampToValueAtTime(1, startTime + 0.05);

		//Filter envelope
		filterNode.frequency.cancelScheduledValues(startTime);
		filterNode.frequency.linearRampToValueAtTime(0, startTime + 0.01);
		filterNode.frequency.linearRampToValueAtTime(3000, startTime + 0.02);
		
	},

	//-------

	noteOff: function(noteNumber){
		//Find which voice was assigned to this note in the log
		if( typeof this.noteVoiceLog[noteNumber] == undefined){
			console.log('Could not find which voice is used for note: ' + noteNumber);
			return;
		}

		var voice = this.noteVoiceLog[noteNumber];
		console.log('Stopping voice: ' + voice);

		var currentTime = this.context.currentTime;
		
		//this.ampNodes[voice].gain.cancelScheduledValues(currentTime);
		this.ampNodes[voice].gain.exponentialRampToValueAtTime(0.000001, currentTime + 6);

		this.filterNodes[voice].frequency.exponentialRampToValueAtTime(0.000001, currentTime + 4);

		//Remove from the log
		delete this.noteVoiceLog[noteNumber];
	}

};