function timepToMilliseconds(timep){
	return (new Date(timep)).getTime();
}

async function makeTimeline(){
	let placeHistory = await KadenaPlace.placeHistory();
	let points = [];
	for(let i=0;i<placeHistory.length;i++){
		let pixelHistory = placeHistory[i].history;
		for(let j=0;j<pixelHistory.length;j++){
			let pixelPoint = pixelHistory[i];
			pixelPoint.id = placeHistory[i].id;
			pixelPoint.time = timepToMilliseconds(pixelPoint.time.timep);
			points.push(pixelPoint);
		}
	}
	return points.sort(function(a,b){
		return a.time - b.time;
	});
}

$(document).ready(async function(){
	let timeline = await makeTimeline();
	$("body").text(JSON.stringify(timeline));
});