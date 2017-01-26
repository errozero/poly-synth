var app = {

	//Create an instance of the synth
	keyboardOctave: 3,
	synth: new synth(),
	
	//----------------------

	init: function(){
		ui.init();
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