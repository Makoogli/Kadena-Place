let supportsTouch;
let placeWidth = 1000;
let canvas = {};
let account;
let page = "home";

function getElement(_class){
	return document.getElementById('home').getElementsByClassName(_class).item(0);
}

function clientToCtx(x,y){
	return {
		x:(x-canvas.left-canvas.origin.x)/canvas.scale,
		y:(y-canvas.top-canvas.origin.y)/canvas.scale
	}
}

function pointsOnLineBetweenTwoPoints(x1,y1,x2,y2){
	let points = [];
	if(x1 == x2 && -1 < x1 && x1 < placeWidth){
		for(let i=Math.max(Math.min(y1,y2),0);i<Math.min(Math.max(y1,y2)+1,placeWidth);i++){
			points.push(x1+placeWidth*i);
		}
	}else if(y1 == y2 && -1 < y1 && y1 < placeWidth){
		for(let i=Math.max(Math.min(x1,x2),0);i<Math.min(Math.max(x1,x2)+1,placeWidth);i++){
			points.push(i+placeWidth*y1);
		}
	}else{
		let po1 = !(-1 < x1 && x1 < placeWidth && -1 < y1 && y1 < placeWidth);
		let po2 = !(-1 < x2 && x2 < placeWidth && -1 < y2 && y2 < placeWidth);
		let point = [x1,y1];
		if(!po1){
			points.push(point[0]+placeWidth*point[1]);
		}
		let m = (y2-y1)/(x2-x1);
		let b = 0.5+y1-m*(x1+0.5);
		let xp = (x1 < x2);
		let yp = (y1 < y2);
		for(let i=0;i<Math.abs(x1-x2)+Math.abs(y1-y2);i++){
			let sp = point[1] > m*point[0]+b;
			if(!yp^sp){
				point = [point[0]-1+(xp<<1),point[1]];
			}else{
				point = [point[0],point[1]-1+(yp<<1)];
			}
			if(po1){
				if(-1 < point[0] && point[0] < placeWidth && -1 < point[1] && point[1] < placeWidth){
					points.push(point[0]+placeWidth*point[1]);
					po1 = false;
				}
			}else if(po2){
				if(-1 < point[0] && point[0] < placeWidth && -1 < point[1] && point[1] < placeWidth){
					points.push(point[0]+placeWidth*point[1]);
				}else{
					break;
				}
			}else{
				points.push(point[0]+placeWidth*point[1]);
			}
		}
	}
	return points;
}

function hexToIntColor(hex){
	return [parseInt(hex.substring(1,3),16),parseInt(hex.substring(3,5),16),parseInt(hex.substring(5,7),16)];
}

function intToHexColor(intArr){
	return '#'+intArr[0].toString(16).padStart(2,'0')+intArr[1].toString(16).padStart(2,'0')+intArr[2].toString(16).padStart(2,'0');
}


function canvasViewingMouseDownHandler(){
	if(event.targetTouches == undefined){
		canvas.jCanvas.off('mousedown',canvasViewingMouseDownHandler);
		$(document).on('mousemove',canvasViewingMouseMoveHandler);
		$(document).on('mouseup',canvasViewingMouseUpHandler);
	}
}

function canvasViewingMouseUpHandler(){
	if(event.targetTouches == undefined){
		$(document).off('mousemove',canvasViewingMouseMoveHandler);
		$(document).off('mouseup',canvasViewingMouseUpHandler);
		canvas.jCanvas.on('mousedown',canvasViewingMouseDownHandler);
	}
}

function canvasViewingMouseMoveHandler(event){
	if(event.targetTouches == undefined){
		canvas.origin.x += event.originalEvent.movementX;
		canvas.origin.y += event.originalEvent.movementY;
		canvas.draw();
	}
}

function canvasTouchStartEndHandler(event){
	let num_of_touches_prev = canvas.touches.length;
	let num_of_touches = event.targetTouches.length;
	if(num_of_touches_prev == 1 && canvas.drawing){
		canvas.touches = [];
		for(let i=0;i<Math.min(num_of_touches,2);i++){
			canvas.touches.push({x:event.targetTouches[i].clientX,y:event.targetTouches[i].clientY});
		}
		canvas.addToCurrentEdit(canvas.accumulatedPointsDuringMath);
		canvas.addCurrentEditToHistory();
	}else if(num_of_touches == 1 && canvas.drawing){
		canvas.accumulatedPointsDuringMath = [];
		canvas.forgetFuture();
		canvas.currentEdit = [];
		let p = clientToCtx(event.targetTouches[0].clientX,event.targetTouches[0].clientY);
		canvas.touches = [];
		for(let i=0;i<Math.min(num_of_touches,2);i++){
			canvas.touches.push({x:event.targetTouches[i].clientX,y:event.targetTouches[i].clientY});
		}
		canvas.addToCurrentEdit([Math.floor(p.x)+placeWidth*Math.floor(p.y)]);
	}else{
		canvas.touches = [];
		for(let i=0;i<Math.min(num_of_touches,2);i++){
			canvas.touches.push({x:event.targetTouches[i].clientX,y:event.targetTouches[i].clientY});
		}
	}
}

function canvasTouchMoveHandler(event){
	if(canvas.drawing == true){
		let p1 = clientToCtx(canvas.touches[0].x,canvas.touches[0].y);
		let p2 = clientToCtx(event.targetTouches[0].clientX,event.targetTouches[0].clientY);
		canvas.accumulatedPointsDuringMath = canvas.accumulatedPointsDuringMath.concat(pointsOnLineBetweenTwoPoints(Math.floor(p1.x),Math.floor(p1.y),Math.floor(p2.x),Math.floor(p2.y)));
		for(let i=0;i<Math.min(canvas.touches.length,2);i++){
			canvas.touches[i] = {x:event.targetTouches[i].clientX,y:event.targetTouches[i].clientY};
		}
		if(!canvas.doingMouseMoveMath){
			canvas.doingMouseMoveMath = true;
			canvas.addToCurrentEdit(canvas.accumulatedPointsDuringMath);
			canvas.accumulatedPointsDuringMath = [];
		}
	}else{
		if(canvas.touches.length == 1){
			canvas.origin.x -= canvas.touches[0].x;
			canvas.origin.x += event.targetTouches[0].clientX;
			canvas.origin.y -= canvas.touches[0].y;
			canvas.origin.y += event.targetTouches[0].clientY;
			for(let i=0;i<Math.min(canvas.touches.length,2);i++){
				canvas.touches[i] = {x:event.targetTouches[i].clientX,y:event.targetTouches[i].clientY};
			}
			canvas.draw();
		}else{
			let newScale = canvas.scale*((((event.targetTouches[0].clientX-event.targetTouches[1].clientX)**2+(event.targetTouches[0].clientY-event.targetTouches[1].clientY)**2)**(1/2))/(((canvas.touches[0].x-canvas.touches[1].x)**2+(canvas.touches[0].y-canvas.touches[1].y)**2)**(1/2)));
			let coords = {x:(event.targetTouches[0].clientX+event.targetTouches[1].clientX)/2,y:(event.targetTouches[0].clientY+event.targetTouches[1].clientY)/2};
			let contextCoords = clientToCtx(coords.x,coords.y);
			canvas.origin.x = 2*coords.x-(canvas.touches[0].x+canvas.touches[1].x)/2-canvas.left-contextCoords.x*newScale;
			canvas.origin.y = 2*coords.y-(canvas.touches[0].y+canvas.touches[1].y)/2-canvas.top-contextCoords.y*newScale;
			canvas.scale = newScale;
			for(let i=0;i<Math.min(canvas.touches.length,2);i++){
				canvas.touches[i] = {x:event.targetTouches[i].clientX,y:event.targetTouches[i].clientY};
			}
			canvas.draw();
		}
	}
}

function canvasDrawingMouseDownHandler(event){
	if(event.targetTouches == undefined){
		canvas.jCanvas.off('mousedown',canvasDrawingMouseDownHandler);
		canvas.jCanvas.on('mousemove',canvasDrawingMouseMoveHandler);
		canvas.jCanvas.on('mouseup',canvasDrawingMouseUpHandler);
		canvas.accumulatedPointsDuringMath = [];
		canvas.forgetFuture();
		canvas.currentEdit = [];
		let p = clientToCtx(event.clientX,event.clientY);
		canvas.addToCurrentEdit([Math.floor(p.x)+placeWidth*Math.floor(p.y)]);
		canvas.prevClient.x = event.clientX;
		canvas.prevClient.y = event.clientY;
	}
}

function canvasDrawingMouseUpHandler(){
	if(event.targetTouches == undefined){
		canvas.jCanvas.off('mousemove',canvasDrawingMouseMoveHandler);
		canvas.jCanvas.off('mouseup',canvasDrawingMouseUpHandler);
		canvas.jCanvas.on('mousedown',canvasDrawingMouseDownHandler);
		canvas.addToCurrentEdit(canvas.accumulatedPointsDuringMath);
		canvas.addCurrentEditToHistory();
	}
}

function canvasDrawingMouseMoveHandler(event){
	if(event.targetTouches == undefined){
		let p1 = clientToCtx(canvas.prevClient.x,canvas.prevClient.y);
		let p2 = clientToCtx(event.clientX,event.clientY);
		canvas.accumulatedPointsDuringMath = canvas.accumulatedPointsDuringMath.concat(pointsOnLineBetweenTwoPoints(Math.floor(p1.x),Math.floor(p1.y),Math.floor(p2.x),Math.floor(p2.y)));
		if(!canvas.doingMouseMoveMath){
			canvas.doingMouseMoveMath = true;
			canvas.addToCurrentEdit(canvas.accumulatedPointsDuringMath);
			canvas.accumulatedPointsDuringMath = [];
		}
		canvas.prevClient.x = event.clientX;
		canvas.prevClient.y = event.clientY;
	}
}

function canvasZoomingMouseWheelHandler(event){
	let newScale = canvas.scale*2**(-event.originalEvent.deltaY/1000);
	let contextCoords = clientToCtx(event.clientX,event.clientY);
	canvas.origin.x = event.clientX-canvas.left-contextCoords.x*newScale;
	canvas.origin.y = event.clientY-canvas.top-contextCoords.y*newScale;
	canvas.scale = newScale;
	canvas.draw();
}

function mouseUpPalette(){
	$(document).off('mouseup',mouseUpPalette);
	$(document).off('mousemove',mouseMovePalette);
	$(document).off('touchend',mouseUpPalette);
	$(document).off('touchmove',mouseMovePalette);
}

function mouseMovePalette(event){
	event = (event.targetTouches == undefined)?event:event.targetTouches[0];
	let newLeft = canvas.palette.offset().left-canvas.palette.parent().offset().left-canvas.paletteX+event.clientX;
	if(newLeft > 0){
		newLeft = 0;
	}else if(newLeft < canvas.palette.parent().width()-canvas.palette.width()){
		newLeft = canvas.palette.parent().width()-canvas.palette.width();
	}
	canvas.palette.css('left',newLeft+'px');
	canvas.paletteX = event.clientX;
}

function mouseDownPalette(event){
	event = (event.targetTouches == undefined)?event:event.targetTouches[0];
	canvas.paletteX = event.clientX;
	$(document).on('mouseup',mouseUpPalette);
	$(document).on('mousemove',mouseMovePalette);
	$(document).on('touchend',mouseUpPalette);
	$(document).on('touchmove',mouseMovePalette);
}

async function resizeHandler(){
	canvas.parent.removeChild(canvas.canvas);
	let canvasDivClientRect = canvas.parent.getBoundingClientRect();
	canvas.top = canvasDivClientRect.top;
	canvas.left = canvasDivClientRect.left;
	canvas.scale /= canvas.width;
	canvas.width = canvasDivClientRect.right-canvasDivClientRect.left;
	canvas.scale *= canvas.width;
	canvas.canvas.width = canvas.width;
	canvas.canvas.height = canvas.width;
	canvas.parent.appendChild(canvas.canvas);
	canvas.ctx.imageSmoothingEnabled = false;
	canvas.draw();
}

function thinChangeColor(source){
	let div = canvas.colorParent.children.item(0);
	div.style.backgroundColor = source.value;
	div.innerText = source.value;
	canvas.changeColor(canvas.colorParent);
}

function popupMenu(){
	document.getElementById('links_popup').style.display = 'flex';
}

function closeMenu(){
	document.getElementById('links_popup').style.display = 'none';
}

function popupPixelData(){
	document.getElementById('pixel_data_popup').style.display = 'flex';
}

function closePixelData(){
	document.getElementById('pixel_data_popup').style.display = 'none';
}

function popupCommit(){
	document.getElementById('commit_popup').style.display = 'flex';
}

function closeCommit(){
	document.getElementById('commit_popup').style.display = 'none';
}

function popupSettings(){
	document.getElementById('settings_popup').style.display = 'flex';
}

function closeSettings(){
	document.getElementById('settings_popup').style.display = 'none';
}

function popupXWalletNotInstalled(){
	document.getElementById('xwallet_not_installed_popup').style.display = 'flex';
}

function closeXWalletNotInstalled(){
	document.getElementById('xwallet_not_installed_popup').style.display = 'none';
}

function popupNotConnectedToXWallet(){
	document.getElementById('not_connected_to_xwallet').style.display = 'flex';
}

function closeNotConnectedToXWallet(){
	document.getElementById('not_connected_to_xwallet').style.display = 'none';
}

function popupCreateAccount(){
	document.getElementById('create_account_popup').style.display = 'flex';
}

function closeCreateAccount(){
	document.getElementById('create_account_popup').style.display = 'none';
}

function popupSignIn(){
	document.getElementById('sign_in_popup').style.display = 'flex';
}

function closeSignIn(){
	document.getElementById('sign_in_popup').style.display = 'none';
}

function popupChangePassword(){
	document.getElementById('change_password_popup').style.display = 'flex';
}

function closeChangePassword(){
	document.getElementById('change_password_popup').style.display = 'none';
}

function popupChangeMinTip(){
	document.getElementById('change_min_tip_popup').style.display = 'flex';
}

function closeChangeMinTip(){
	document.getElementById('change_min_tip_popup').style.display = 'none';
}

/*function connected(account_name){
	account = account_name;
	let connectButton = $('#connect_button');
	connectButton.text(account.slice(0,10))
	connectButton.attr('disabled',true);
}*/

async function changePassword(){
	let oldPass = document.getElementById('password_4').value;
	let newPass1 = document.getElementById('password_5').value;
	let newPass2 = document.getElementById('password_6').value;
	if(newPass1 == newPass2){
		let account = await KadenaPlace.getAccount();
		let privateKey = await KadenaE2EEMessaging.decryptPrivateKey((await KadenaE2EEMessaging.e2ee_messaging.local('(free.e2ee-messaging.get-accounts ["'+(await KadenaPlace.getKPAccount(account.wallet.account))["e2ee-messaging-account"]+'"])'))[0]["xor-private-key-password-hash"],oldPass);
		if(await KadenaE2EEMessaging.changePassword(privateKey,newPass1)){
			closeChangePassword();
			sessionStorage.setItem('kadena-e2ee-messaging-password',newPass1);
			document.getElementById('my_account_password').value = newPass1;
		}else{
			console.log('something wrong');
		}
	}else{
		console.log('passwords dont match');
	}
}

async function createAccount(){
	let pass1 = document.getElementById('password_1').value;
	let pass2 = document.getElementById('password_2').value;
	if(pass1 == pass2){
		KadenaPlace.createAccount(pass1,async function(data){
			let account = await KadenaPlace.getAccount();
			connectButton.map(function(i){$(connectButton[i]).text(account.wallet.account.slice(0,10))});
			if(page == 'my-account'){
				switchPage('my-account');
			}
		},function(){
			connectButton.map(function(i){$(connectButton[i]).attr('disabled',false)});
		});
		closeCreateAccount();
		let connectButton = $('#page div.connect button');
		connectButton.map(function(i){$(connectButton[i]).attr('disabled',true)});
	}
}

async function signInAccount(){
	let pass = document.getElementById('password_3').value;
	let valid = await KadenaPlace.signInE2EEMessaging(pass);
	if(valid){
		closeSignIn();
		let connectButton = $('#page div.connect button');
		connectButton.map(function(i){$(connectButton[i]).text(account.slice(0,10));$(connectButton[i]).attr('disabled',true)});
		if(page == 'my-account'){
			switchPage('my-account');
		}
	}
}

async function connected(account_name){ // then (signIn || createAccount) then show account
	account = account_name;
	let connectButton = $('#page div.connect button');
	if(await KadenaPlace.kPAccountExists()){
		if(sessionStorage.getItem('kadena-e2ee-messaging-password') != null && sha256(await KadenaE2EEMessaging.decryptPrivateKey((await KadenaE2EEMessaging.e2ee_messaging.local('(free.e2ee-messaging.get-accounts ["'+(await KadenaPlace.getKPAccount(account))["e2ee-messaging-account"]+'"])'))[0]["xor-private-key-password-hash"],sessionStorage.getItem('kadena-e2ee-messaging-password'))) == (await KadenaE2EEMessaging.e2ee_messaging.local('(free.e2ee-messaging.get-accounts ["'+(await KadenaPlace.getKPAccount(account))["e2ee-messaging-account"]+'"])'))[0]["private-key-hash"]){
			connectButton.map(function(i){$(connectButton[i]).text(account.slice(0,10));$(connectButton[i]).attr('disabled',true)});
			document.getElementById('password_3').value = sessionStorage.getItem('kadena-e2ee-messaging-password');
			signInAccount();
		}else{
			connectButton.map(function(i){$(connectButton[i]).text('Sign In');$(connectButton[i]).attr('onclick',"popupSignIn()")});
		}
	}else{
		connectButton.map(function(i){$(connectButton[i]).text('Create Account');$(connectButton[i]).attr('onclick',"popupCreateAccount()")});
	}
}

async function checkAccount(interval){
	let account = await KadenaPlace.getAccount();
	if(account.status == 'success'){
		clearInterval(interval);
		connected(account.wallet.account);
	}
}

function startCheckingForAccount(){
	let interval = setInterval(function(){
		checkAccount(interval);
	},500);
}

async function connectFun(canPopup){
	if(KadenaPlace.isXWalletInstalled()){
		startCheckingForAccount();
		if(canPopup){
			let data = await KadenaPlace.connect();
		}
	}else{
		if(canPopup){
			popupXWalletNotInstalled();
		}
	}
}

function toggleShowHideAccountPassword(btn){
	if(btn.innerText == 'Show'){
		btn.innerText = 'Hide';
		document.getElementById('my_account_password').type = 'text';
	}else{
		btn.innerText = 'Show';
		document.getElementById('my_account_password').type = 'password';
	}
}