let KadenaPlaceTimeLine;
let pixelsRef;
let pointImg;

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

function makePoint(time){
	pixelsRef = Array(1000000);
	for(let i=0;i<KadenaPlaceTimeLine.length;i++){
		let pixelPoint = KadenaPlaceTimeLine[i];
		pixelsRef[JSON.parse(pixelPoint.id)] = i;
	}
	let buffer = Array(4000000);
	for(let i=0;i<1000000;i++){
		if(pixelsRef[i] == undefined){
			buffer[4*i] = 0;
			buffer[4*i+1] = 0;
			buffer[4*i+2] = 0;
			buffer[4*i+3] = 0;
		}else{
			let hexColor = KadenaPlaceTimeLine[pixelsRef[i]].color;
			buffer[4*i] = parseInt(hexColor.substring(1,3),16);
			buffer[4*i+1] = parseInt(hexColor.substring(3,5),16);
			buffer[4*i+2] = parseInt(hexColor.substring(5,7),16);
			buffer[4*i+3] = 255;
		}
	}
	let newCanvas = document.createElement("canvas");
	newCanvas.width = placeWidth;
	newCanvas.height = placeWidth;
	let newCtx = newCanvas.getContext("2d");
	let idata = newCtx.createImageData(placeWidth,placeWidth);
	idata.data.set(buffer);
	newCtx.putImageData(idata, 0, 0);
	let image = new Image();
	image.onload = function(){
		pointImg = image;
		draw();
	}
	image.src = newCanvas.toDataURL();
}

$(document).ready(async function(){
	let timeline = await makeTimeline();
});