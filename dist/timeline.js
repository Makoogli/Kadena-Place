function timepToMilliseconds(timep){
	return (new Date(timep)).getTime();
}

$(document).ready(async function(){
	let placeHistory = await KadenaPlace.placeHistory();
	$("body").text((timepToMilliseconds((await KadenaPlace.getKPAccount("k:e61108b15a8c5b45d7593ebdd1e66c1bd0d9f40cb4190d2e68c922355c0bb932")).joined)).toString());
});