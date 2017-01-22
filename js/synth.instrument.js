var synth = function(){
	this.notesPlaying = [];
	this.init();
};

synth.prototype.init = function(){
	console.log('Synth init');
}

synth.prototype.playNote = function(noteNumber){
	console.log('Play note');
}

synth.prototype.stopNote = function(noteNumber){
	console.log('Stop note');
}