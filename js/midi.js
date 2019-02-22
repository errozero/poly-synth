var midi = {

	midiAcess:null,
	inputDeviceID:null,
	outputDeviceID:null,
	output:null,
	active: false,
	tempInstrument:null,

	connected: false,
	devices: {},
	deviceMapping: {},
	learn:false,
	learnSelected: {
		type: null,
		instrument: null,
		instrumentCount:null,
		controlID: null,
		controlType: null
	},

	init:function(){

		console.log('Starting MIDI....');

		function onMIDISuccess(midiAccess) {

			console.log('<===---MIDI INPUTS---===>');
			console.log(midiAccess.inputs);

			midi.connected = true;

			midi.midiAccess = midiAccess;

			var inputDeviceCount = midiAccess.inputs.size;
			var outputDeviceCount = midiAccess.outputs.size;
			
			//Monitor input signals
		    var inputs = midiAccess.inputs.values();
		    for(var input = inputs.next(); input && !input.done; input = inputs.next()){
		    	input.value.onmidimessage = midi.midiMessage;
		    }

		}

		function onMIDIFailure(e) {
			midi.connected = false;
		    console.log("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + e);
		}

		if(navigator.requestMIDIAccess) {
			navigator.requestMIDIAccess({ sysex: false }).then(onMIDISuccess, onMIDIFailure);
		} else {
		    console.log("No MIDI support in your browser.");
		}


	},


	midiMessage: function(message){

		var deviceID = message.target.id;
		var data = message.data;
		
		var controlType = data[0];
		var controlID = data[1];
		var controlVal = data[2];

		console.log(controlID);

		//Only continues controllers allowed
		if(controlType == 144){
			app.checkContext();
			app.hideInstructions();
			app.synth.noteOn(controlID);
		}

		else if(controlType == 128){
			app.synth.noteOff(controlID);
		}

	},


}

midi.init();