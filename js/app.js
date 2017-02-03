var app = {

	//Web audio context (Pass in to instruments)
	context: new (window.AudioContext || window.webkitAudioContext)(),
	
	keyboardOctave: 3,
	
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

		var self = this;

		//Create an id for this instrument
		var instrumentID = Date.now();
		this.instruments[instrumentID] = new window[instrumentName]({
			instrumentID: instrumentID,
			context: app.context
		});

		//Add the UI template for this instrument
		$.get('js/' + instrumentName + '.view.html', function(template){

			//Use handlebars to replace placeholders within template
			var instrumentTemplateData = {
				instrumentID: instrumentID,
			};
			var instrumentTemplate = Handlebars.compile(template);
			var instrumentHtml = instrumentTemplate(instrumentTemplateData);

			$('#instruments-container').append(instrumentHtml);

			//Set initial visual control positions
			self.updateInstrumentVisualControls(instrumentID);	

		});

		return instrumentID;

	},

	//----------------------

	updateInstrumentVisualControls: function(instrumentID){
		var controls = this.instruments[instrumentID].controls;
		console.log(controls);
		for(var i in controls){
			var percentVal = Math.round( (controls[i].value / 127) * 100 );
			$('.js-control-knob[data-instrument-id="' + instrumentID + '"][data-control-id="' + i + '"]').val(percentVal);
		}
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