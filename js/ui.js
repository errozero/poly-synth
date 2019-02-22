var ui = {

    //Keep track of which keys are pressed (stops re-triggering)
    keysDown: [],
    mousePos: {},
    mouseDown: false,
    lastControlID: null,
    dragStart: null,

    //-------------------

    init: function(){
        this.eventListeners();
        this.handlebarsHelpers();
    },

    //-------------------

    eventListeners: function(){
        
        var self = this;

        $(document)

        .mousedown(function(){
			self.mouseDown = true;
		})
		.mouseup(function(){
			self.mouseDown = false;
			self.lastControlID = null;
			self.dragStart = null;
		})
        //Mouse move
		.mousemove(function(e){
			self.mousePos = {x: e.pageX, y: e.pageY};
			if(ui.lastControlID == null) return;
			//Set knob pos
			var vPos = e.clientY;
			self.setKnobPos(vPos);
		})

        .keydown(function(e){
            self.keyDown(e);    
        })
        .keyup(function(e){
            self.keyUp(e);
        })

        .on('mousedown', '.js-control-knob', function(e){
            var controlID = $(this).data('control-id');
            self.lastControlID = controlID;
            self.dragStart = e.clientY;
        })

        //Adjust instrument control
        /*
        .on('input', '.js-control-knob', function(){

            var controlID = $(this).data('control-id');
            var value = $(this).val();

            //Convert percent value to midi value
            var midiValue = Math.round((127 / 100) * value);

            //Pass the control id and midi value to the instrument
            app.synth.setControlValue(controlID, midiValue);

        })
        */

        .on('mousedown', '.js-control-radio-button', function(){
            console.log('radio click');
            var controlID = $(this).data('control-id');
            var value = $(this).data('value');
            app.synth.setControlValue(controlID, value);
            ui.updateSynthVisualControls();
        })

        .on('mousedown', '.js-preset-select', function(){
            var presetID = $(this).data('preset-id');
            app.synth.loadPreset(presetID);
            ui.updateSynthVisualControls();
            //ui.highlightPreset(presetID);
        })
        ;

    },

    //-------------
    
    highlightPreset: function(presetID){
        $('.preset-selected').removeClass('preset-selected');
        $('.js-preset-select[data-preset-id="' + presetID + '"]').addClass('preset-selected');
    },

    //-------------

	handlebarsHelpers: function(){
		
        /*
		Handlebars.registerHelper('simpleLoop', function(n, block) {
		    var accum = '';
		    for(var i = 0; i < n; ++i)
		        accum += block.fn(i);
		    return accum;
		});

		Handlebars.registerHelper('isEqual', function(a, b, opts){
			if(a===b){
				return opts.fn(this);
			} else{
				return opts.inverse(this);
			}
		});
        */

	},

    //-------------------

    //Capture all press events
    keyDown: function(e){
        //e.preventDefault();

        var keyCode = e.which;
        if(this.keysDown[keyCode]){
            return; 
        }

        var midiNote = this.keyCodeToMidiNote(keyCode);

        app.checkContext();
        app.hideInstructions();

        if(midiNote){
            this.keysDown[keyCode] = midiNote;
            app.synth.noteOn(midiNote, 127);
        }
        
    },

    //-------------------

    keyUp: function(e){
        var keyCode = e.which;
        if(this.keysDown[keyCode]){
            var midiNote = this.keysDown[keyCode];
            app.synth.noteOff(midiNote);
            this.keysDown[keyCode] = false;
        }
    },
    
    //-------------------

    keyCodeToMidiNote: function(keyCode){
        
        var mappings = {
            90: 0,
            83: 1,
            88: 2,
            68: 3,
            67: 4,
            86: 5,
            71: 6,
            66: 7,
            72: 8,
            78: 9,
            74: 10,
            77: 11,
            //Next octave
            81: 12,
            50: 13,
            87: 14,
            51: 15,
            69: 16,
            82: 17,
            53: 18,
            84: 19,
            54: 20,
            89: 21,
            55: 22,
            85: 23,
            //Next octave
            73: 24,
            57: 25,
            79: 26,
            48: 27,
            80: 28,
            219: 29,
            187: 30,
            221: 31,
            222: 32
        };

        if(mappings[keyCode] !== undefined){
            var midiNote = mappings[keyCode] + (app.keyboardOctave*12);
            return midiNote;
        } else {
            return false;
        }

    },

    //----------------------

   	setKnobPos: function(vPos){

		//Limit min and max vals
		function limitVal(newVal){
			if(newVal < 0){
				newVal = 0;
			} else if(newVal > 127){
				newVal = 127;
			}

			return newVal;
		}

		var pointer = {y: vPos};
		
		//Set the drag start pos
		if(!ui.mouseDown){
			ui.dragStart = pointer.y;
			ui.mouseDown = true;
		}
		ui.dragNew = pointer.y;

		//Difference between dragStart and dragNew
		var moveAmount = ui.dragNew - ui.dragStart;

		//Invert the value
		if(moveAmount < 0){
			moveAmount = Math.abs(moveAmount);
		} else if(moveAmount > 0){
			moveAmount = -Math.abs(moveAmount);
		}

		var currentKnobID = ui.lastControlID,
		currentVal;
        
        currentVal = app.synth.controls[currentKnobID].value;
		var newVal = limitVal(currentVal + moveAmount);
        app.synth.setControlValue(currentKnobID, newVal);
		ui.setKnobRotation(currentKnobID, newVal);
		
		//Update dragstart
		ui.dragStart = ui.dragNew;

		return;
	},

    //----------------------

    setKnobRotation: function(controlID, value){

        var valPercent = Math.round( (value / 127) * 100 );

        var rotAngle = (270 / 100) * valPercent - 135; 
        var css = { transition: 'transform 0s', transform: 'rotate(' + rotAngle + 'deg)' };	
        var element = $('.js-control-knob[data-control-id="' + controlID + '"]');
        
        if(element){
            element.css(css);
        } 

    },  

    //----------------------

    updateSynthVisualControls: function(){
		var controls = app.synth.controls;
        var presetID = app.synth.currentPreset;
		for(var i in controls){

            if(controls[i].type == 'knob'){
                this.setKnobRotation(i, controls[i].value);
            }
            else if(controls[i].type == 'radio'){
                $('.js-control-radio-button[data-control-id="' + i + '"]').removeClass('btn-enabled');
                $('.js-control-radio-button[data-control-id="' + i + '"][data-value="' + controls[i].value + '"]').addClass('btn-enabled');;
            }

		}

        this.highlightPreset(presetID);

	},

};