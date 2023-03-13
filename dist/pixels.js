$(document).ready(async function(){
	let res = JSON.stringify(await KadenaPlace.getPixelsData([url_param_pixel]));
	if(res == undefined){
		res = "Does not exist";
	}
	console.log(res);
	$("body").text(res);
});