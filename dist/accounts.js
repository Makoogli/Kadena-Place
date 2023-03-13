$(document).ready(async function(){
	let res = JSON.stringify(await KadenaPlace.getKPAccount(url_param_account));
	if(res == undefined){
		res = "Does not exist";
	}
	console.log(res);
	$("body").text(res);
});