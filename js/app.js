var app = {

	//Web audio context (Pass in to instruments)
	context: new (window.AudioContext || window.webkitAudioContext)(),
	
	keyboardOctave: 2,
	
	//Container for instruments
	instruments: {},
	
	//ID of the current instrument that will receive user input
	currentInstrumentID: null,

	//----------------------

	init: function(){
			
		//Create the synth instrument
		app.currentInstrumentID = this.addInstrument('synth');
		
		//Init the UI
		ui.init();

	},

	//----------------------

	//Create a new instrument object
	addInstrument: function(instrumentName){
		
		//Create an id for this instrument
		var instrumentID = Date.now();
		this.instruments[instrumentID] = new window[instrumentName]({
			instrumentID: instrumentID,
			context: app.context
		});
		return instrumentID;

	},

	//----------------------

	//Receive a midi note number, return frequency
	midiNoteToFrequency: function(noteNumber){
		var tuningFrequency = 440;
		var tuningNote = 69;
		return Math.exp ((noteNumber-tuningNote) * Math.log(2) / 12) * tuningFrequency;
	},

};

app.init();