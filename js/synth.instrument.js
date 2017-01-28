var synth = function(config){
	
	this.instrumentName = 'Synth101';
	this.instrumentID = config.instrumentID || Date.now();
	this.context = config.context;
	this.gainNode = this.context.createGain();
	this.notes = {};

	this.controls = [
		{label: 'Tune', type: 'knob', value: 64},
		{label: 'Cutoff', type: 'knob', value: 64},
		{label: 'Resonance', type: 'knob', value: 64},
	];

	this.init();

	console.log(this.instrumentName + ' Created - Id: ' + this.instrumentID);

};

synth.prototype = {

	init: function(){
		
		//Set master volume of this instrument
		this.gainNode.gain.value = 0.3;
		this.gainNode.connect(this.context.destination);
		
		//Set initial values of all controls
		this.initControlValues();

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

	connectNodes: function(){

	},

	//-------

	noteOn: function(noteNumber, velocity){
		var frequency = app.midiNoteToFrequency(noteNumber);
		var startTime = this.context.currentTime;
		
		//Array of 2 oscillators
		this.notes[noteNumber] = [
			this.context.createOscillator(),
			this.context.createOscillator(),
		];

		//Loop through the 2 oscillators
		for(var key in this.notes[noteNumber]){

			//Set values of oscillator
			this.notes[noteNumber][key].frequency.value = frequency;
			this.notes[noteNumber][key].type = 'sawtooth';

			//Tuning for second oscillator
			if(key > 0){
				this.notes[noteNumber][key].detune.value = 6;
			}

			//Connect the oscillator to the gain node and start playing
			this.notes[noteNumber][key].connect(this.gainNode);	
			this.notes[noteNumber][key].start(startTime);

		}
		
	},

	//-------

	noteOff: function(noteNumber){
		this.notes[noteNumber][0].stop(this.context.currentTime);
		this.notes[noteNumber][1].stop(this.context.currentTime);		
	}

};