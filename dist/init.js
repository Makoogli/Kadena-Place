$(document).ready(function(){
	let width = window.screen.width;
	supportsTouch = 'ontouchstart' in window || navigator.msMaxTouchPoints;
	if(supportsTouch){
		$('body').removeClass('nontouch');
	}
	canvas.parent = getElement('canvas');
	let canvasDivClientRect = canvas.parent.getBoundingClientRect();
	canvas.top = canvasDivClientRect.top;
	canvas.left = canvasDivClientRect.left;
	canvas.width = canvasDivClientRect.right-canvasDivClientRect.left;
	canvas.canvas = document.createElement('canvas');
	canvas.jCanvas = $(canvas.canvas);
	canvas.jCanvas.on('wheel',canvasZoomingMouseWheelHandler);
	canvas.canvas.addEventListener('touchstart',canvasTouchStartEndHandler);
	canvas.canvas.addEventListener('touchend',canvasTouchStartEndHandler);
	canvas.canvas.addEventListener('touchmove',canvasTouchMoveHandler);
	canvas.canvas.width = canvas.width;
	canvas.canvas.height = canvas.width;
	canvas.parent.appendChild(canvas.canvas);
	canvas.ctx = canvas.canvas.getContext('2d');
	canvas.ctx.imageSmoothingEnabled = false;
	canvas.placeImg = new Image();
	canvas.editsImg = new Image();
	canvas.palette = $('#home .palette');
	canvas.paletteX = 0;
	canvas.origin = {
		x:0,
		y:0
	};
	canvas.scale = canvas.width/placeWidth;
	canvas.resetZoom = function(){
		canvas.scale = canvas.width/placeWidth;
		canvas.origin = {x:0,y:0};
		canvas.draw();
	}
	canvas.color;
	canvas.colorParent;
	canvas.drawing = true;
	canvas.touches = [];
	canvas.startDrawing = function(){
		if(!canvas.drawing){
			canvas.jCanvas.off('mousedown',canvasViewingMouseDownHandler);
			canvas.jCanvas.on('mousedown',canvasDrawingMouseDownHandler);
			canvas.drawing = true;
			getElement('control').children.item(0).style.borderColor = 'rgba(0,0,0,0)';
			canvas.colorParent.style.backgroundColor = 'rgba(255,255,255,.5)';
			canvas.draw();
		}
	};
	canvas.stopDrawing = function(){
		if(canvas.drawing){
			canvas.jCanvas.off('mousedown',canvasDrawingMouseDownHandler);
			canvas.jCanvas.on('mousedown',canvasViewingMouseDownHandler);
			canvas.drawing = false;
			getElement('control').children.item(0).style.borderColor = 'rgba(0,0,0,0.4)';
			document.querySelector('button.change_color_wrapper').disabled = true;
			canvas.colorParent.style.backgroundColor = 'rgba(0,0,0,.2)';
			canvas.draw();
		}
	};
	canvas.changeColor = function(source){
		canvas.colorParent.style.backgroundColor = 'rgba(0,0,0,.2)';
		canvas.colorParent = source;
		canvas.color = {value:source.children.item(0).innerText};
		if(canvas.color.value != 'no_color'){
			document.querySelector('button.change_color_wrapper').disabled = false;
		}
		canvas.colorParent.style.backgroundColor = 'rgba(255,255,255,.5)';
		canvas.startDrawing();
	};
	canvas.startErasing = function(source){
		canvas.changeColor(source.children.item(0));
		canvas.color = {value:'no_color'};
		document.querySelector('button.change_color_wrapper').disabled = true;
	}
	canvas.colorParent = getElement('palette').children.item(0);
	canvas.color = {value:canvas.colorParent.children.item(0).innerText};
	canvas.prevClient = {
		x:0,
		y:0
	}
	canvas.gridLineWidthCoeff = 0.4;
	canvas.drawPlace = true;
	canvas.drawEdits = true;
	canvas.drawGrid = true;
	canvas.togglePlace = function(source){
		let child = source.children.item(0);
		child.checked = !(child.checked);
		canvas.drawPlace = child.checked;
		canvas.draw();
	}
	canvas.toggleEdits = function(source){
		let child = source.children.item(0);
		child.checked = !(child.checked);
		canvas.drawEdits = child.checked;
		canvas.draw();
	}
	canvas.toggleGrid = function(source){
		let child = source.children.item(0);
		child.checked = !(child.checked);
		canvas.drawGrid = child.checked;
		canvas.draw();
	}
	canvas.updateGridLineWidth = function(source){
		canvas.gridLineWidthCoeff = source.value;
		canvas.draw();
	}
	canvas.selected = {
		selected:false,
		x:0,
		y:0
	};
	canvas.history = [];
	canvas.historyIndex = 0;
	canvas.currentEdit = [];
	canvas.redo = function(){
		if(canvas.historyIndex<canvas.history.length){
			canvas.historyIndex++;
			let edit = canvas.history[canvas.historyIndex-1];
			for(let i=0;i<edit.length;i++){
				let redPos = 4*edit[i][0];
				let dColor = edit[i][1];
				for(let j=0;j<4;j++){
					canvas.editsBuffer[redPos+j] += dColor[j];
				}
			}
			canvas.makeEditsImg();
		}
	}
	canvas.doingMouseMoveMath = false;
	canvas.undo = function(){
		if(canvas.historyIndex>0){
			let edit = canvas.history[canvas.historyIndex-1];
			canvas.historyIndex--;
			for(let i=0;i<edit.length;i++){
				let redPos = 4*edit[i][0];
				let dColor = edit[i][1];
				for(let j=0;j<4;j++){
					canvas.editsBuffer[redPos+j] -= dColor[j];
				}
			}
			canvas.makeEditsImg();
		}
	}
	canvas.transform = function(){
		canvas.ctx.clearRect(-100,-100,placeWidth+200,placeWidth+200);
		canvas.ctx.setTransform(canvas.scale,0,0,canvas.scale,canvas.origin.x,canvas.origin.y);
	}
	canvas.draw = function(){
		canvas.transform();
		if(canvas.drawPlace){
			canvas.ctx.drawImage(canvas.placeImg,0,0);
		}
		if(canvas.drawEdits){
			canvas.ctx.drawImage(canvas.editsImg,0,0);
		}
		if(canvas.drawGrid){
			canvas.drawGridLines();
		}
		if(canvas.selected.selected && !canvas.drawing){
			canvas.drawSelected();
		}
	}
	canvas.drawGridLines = function(){
		canvas.ctx.strokeStyle = "#ffffff";
		let l = Math.max(0,-canvas.origin.x/canvas.scale);
		let u = Math.max(0,-canvas.origin.y/canvas.scale);
		let p = clientToCtx(canvas.left+canvas.width,canvas.top+canvas.width);
		let r = Math.min(placeWidth,p.x);
		let d = Math.min(placeWidth,p.y);
		for(let i=Math.ceil(Math.max(0,1-Math.log10(canvas.scale)));i<=3;i++){
			canvas.ctx.lineWidth = (canvas.gridLineWidthCoeff/canvas.scale)*(1-0.99*(10**(1-i))/canvas.scale);
			canvas.ctx.beginPath();
			for(let j=Math.ceil(l/(10**i));j<1+Math.floor(r/(10**i));j++){
				canvas.ctx.moveTo(j*(10**i),0);
				canvas.ctx.lineTo(j*(10**i),placeWidth);
			}
			for(let j=Math.ceil(u/(10**i));j<1+Math.floor(d/(10**i));j++){
				canvas.ctx.moveTo(0,j*10**i);
				canvas.ctx.lineTo(placeWidth,j*(10**i));
			}
			canvas.ctx.stroke();
		}
	}
	canvas.drawSelected = function(){
		canvas.ctx.strokeStyle = "#ff0000";
		canvas.ctx.lineWidth = 3*canvas.gridLineWidthCoeff/canvas.scale;
		let l = Math.max(0,-canvas.origin.x/canvas.scale);
		let u = Math.max(0,-canvas.origin.y/canvas.scale);
		let p = clientToCtx(canvas.left+canvas.width,canvas.top+canvas.width);
		let r = Math.min(placeWidth,p.x);
		let d = Math.min(placeWidth,p.y);
		canvas.ctx.beginPath();
		for(let i=0;i<2;i++){
			canvas.ctx.moveTo(l,canvas.selected.y+i);
			canvas.ctx.lineTo(r,canvas.selected.y+i);
		}
		for(let i=0;i<2;i++){
			canvas.ctx.moveTo(canvas.selected.x+i,u);
			canvas.ctx.lineTo(canvas.selected.x+i,d);
		}
		canvas.ctx.stroke();
	}
	canvas.updateSelected = function(x,y){
		if(0<x && x<placeWidth && 0<y && y<placeWidth){
			canvas.selected.selected = true;
			canvas.selected.x = Math.floor(x);
			canvas.selected.y = Math.floor(y);
			canvas.draw();
		}else{
			canvas.selected.selected = false;
			canvas.draw();
		}
	}
	canvas.updatePlace = async function(){
		canvas.placeBuffergetPlace();
	}
	canvas.editsBuffer = Array(4*placeWidth**2).fill(0);
	canvas.addCurrentEditToHistory = function(){
		canvas.history.push(canvas.currentEdit);
		canvas.historyIndex++;
		canvas.currentEdit = [];
	}
	canvas.addToCurrentEdit = function(points){
		let color = !(canvas.color.value == 'no_color')?hexToIntColor(canvas.color.value).concat([255]):[0,0,0,0];
		for(let i=0;i<points.length;i++){
			let redPos = 4*points[i];
			let dColor = Array(4);
			for(let j=0;j<4;j++){
				dColor[j] = color[j]-canvas.editsBuffer[redPos+j];
				canvas.editsBuffer[redPos+j] = color[j];
			}
			canvas.currentEdit.push([points[i],dColor]);
		}
		canvas.makeEditsImg();
	}
	canvas.forgetFuture = function(){
		canvas.history = canvas.history.slice(0,canvas.historyIndex);
	}
	canvas.clear = function(){
		canvas.forgetFuture();
		for(let i=0;i<placeWidth**2;i++){
			let redPos = 4*i;
			if(canvas.editsBuffer[redPos+3] == 255){
				canvas.currentEdit.push([i,canvas.editsBuffer.slice(redPos,redPos+4).map(value => -value)]);
			}
		}
		canvas.editsBuffer = Array(4*placeWidth**2).fill(0);
		if(canvas.currentEdit.length>0){
			canvas.addCurrentEditToHistory();
			canvas.makeEditsImg();
		}else{
			canvas.currentEdit = [];
		}
	}
	canvas.makeEditsImg = async function(){
		let newCanvas = document.createElement("canvas");
		newCanvas.width = placeWidth;
		newCanvas.height = placeWidth;
		let newCtx = newCanvas.getContext("2d");
		let idata = newCtx.createImageData(placeWidth,placeWidth);
		idata.data.set(canvas.editsBuffer);
		newCtx.putImageData(idata, 0, 0);
		let image = new Image();
		image.onload = function(){
			canvas.editsImg = image;
			canvas.draw();
			canvas.doingMouseMoveMath = false;
		}
		image.src = newCanvas.toDataURL();
	}
	canvas.makePlaceImg = async function(){
		let newCanvas = document.createElement("canvas");
		newCanvas.width = placeWidth;
		newCanvas.height = placeWidth;
		let newCtx = newCanvas.getContext("2d");
		canvas.placeBuffer = await KadenaPlace.getPlace();
		let idata = newCtx.createImageData(placeWidth,placeWidth);
		idata.data.set(canvas.placeBuffer);
		newCtx.putImageData(idata, 0, 0);
		let image = new Image();
		image.onload = function(){
			canvas.placeImg = image;
			canvas.draw();
		}
		image.src = newCanvas.toDataURL();
	}
	canvas.accumulatedPointsDuringMath = [];
	canvas.getPixelsData = async function(){
		let pixelIds = Array(placeWidth**2);
		for(let i=0;i<placeWidth**2;i++){
			pixelIds[i] = i;
		}
		let data = await getPixelsData(pixelIds);
		for(let i=0;i<placeWidth**2;i++){
			if(data[i].result.status == 'success'){
				canvas.pixelsData[i] = data[i].result.data;
			}else{
				canvas.pixelsData[i] = {color:'#000000','last-claim-place-price':'N/A',owner:'N/A','price-hundredths-str':'1'};
			}
		}
	}
	canvas.pixelsData = Array(placeWidth**2);
	//canvas.getPixelsData();
	canvas.makePlaceImg();

	$(window).resize(function(){
		resizeHandler();
	});

	document.addEventListener('touchmove', function (event) {
		if (event.scale !== 1) { event.preventDefault(); }
	}, { passive: false });

	var lastTouchEnd = 0;
	document.addEventListener('touchend', function (event) {
		var now = (new Date()).getTime();
		if (now - lastTouchEnd <= 300) {
    		event.preventDefault();
		}
  		lastTouchEnd = now;
	}, false);

	canvas.stopDrawing();
	connectFun(false);
});