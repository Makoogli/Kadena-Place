$(document).ready(async function(){
	let res = JSON.stringify(await KadenaPlace.getKPAccount(url_param_account));/*
	try{
		res = JSON.stringify(await KadenaPlace.getKPAccount());
	}catch{
		res = "Does not exist";
	}*/
	console.log(res);
	$("body").text(res);
});