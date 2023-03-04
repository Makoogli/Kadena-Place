$(document).ready(async function(){
	let placeHistory = await KadenaPlace.placeHistory();
	$("body").text(JSON.stringify(placeHistory));
});