$(document).ready(await function(){
	let res;
	try{
		res = JSON.stringify(await KadenaPlace.getKPAccount());
	}catch{
		res = "Does not exist";
	}
	$("body").text(res);
});