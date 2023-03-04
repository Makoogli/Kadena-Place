$(document).ready(async function(){
	let placeHistory = await KadenaPlace.placeHistory();
	$("body").text(placeHistory);
});