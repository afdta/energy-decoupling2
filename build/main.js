//gig economy interactive - oct 2016

import card from '../../js-modules/card-api.js';
import state_select from '../../js-modules/state-select.js';
import history from '../../js-modules/history.js';
import dir from '../../js-modules/rackspace.js';

dir.local();
dir.add("data");

function mainfn(){
	var state = history();
	var url = dir.url("data", "energy_decoupling.json");
	console.log(url);
	d3.json(url, function(err,dat){
		console.log(dat);
	});
}

document.addEventListener("DOMContentLoaded", function(){
	mainfn();
});