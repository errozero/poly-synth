var app = {

	//Web audio context (Passed in to instruments)
	context: new (window.AudioContext || window.webkitAudioContext)(),
	keyboardOctave: 3,
	synth: null,

	//----------------------

	init: function(){
		//Init the main UI and create the synth
		ui.init();
		app.createSynth();
	},

	//----------------------

	//Create a new instrument object
	createSynth: function(){

		app.synth = new synth({
			context: this.context
		});

		//Load the UI template for the synth
		$.get('js/synth.view.html', function(template){

			//Get the preset names to include in the UI
			var presets = app.synth.presets;

			//Use handlebars to replace placeholders within template
			var instrumentTemplateData = app.synth.viewData;
			
			var instrumentTemplate = Handlebars.compile(template);
			var instrumentHtml = instrumentTemplate(instrumentTemplateData);

			$('#instruments-container').append(instrumentHtml);

			//Set initial visual control positions
			ui.updateSynthVisualControls();

		});

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