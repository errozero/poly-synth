var synth = function(){
	this.notesPlaying = [];
	this.init();
};

synth.prototype = {

	init: function(){

	},

	//-------

	noteOn: function(noteNumber, velocity){
		var frequency = app.midiNoteToFrequency(noteNumber);
		console.log('Note on: ' + noteNumber + ' velocity: ' + velocity + ', freq: ' + frequency);
	},

	//-------

	noteOff: function(){

	}

};