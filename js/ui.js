var ui = {

    //Keep track of which keys are pressed (stops re-triggering)
    keysDown: [],

    //-------------------

    init: function(){
        this.eventListeners();
        this.handlebarsHelpers();
    },

    //-------------------

    eventListeners: function(){
        
        var self = this;

        $(document)
        .keydown(function(e){
            self.keyDown(e);    
        })
        .keyup(function(e){
            self.keyUp(e);
        })
        ;

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

    keyDown: function(e){
        var keyCode = e.which;
        if(this.keysDown[keyCode]){
            return;
        }
        
        this.keysDown[keyCode] = true;
        
        var midiNote = this.keyCodeToMidiNote(keyCode);
        console.log(midiNote);

    },

    //-------------------

    keyUp: function(e){
        var keyCode = e.which;
        if(this.keysDown[keyCode]){
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
            77: 11
        };

        if(mappings[keyCode] !== undefined){
            return mappings[keyCode];
        } else {
            return false;
        }

    },

};