let KadenaPlace = {
	getPlace: async function(){
		let data = await Pact.fetch.local({meta:Pact.lang.mkMeta("", "5", 1e-7, 150000, 0, 600),pactCode:"(free.kadena-place.get-place)"},"https://api.chainweb.com/chainweb/0.0/mainnet01/chain/5/pact");
		let pixels = data.result.data;
		let pixelArray = Array(4000000);
		for(let i=0;i<pixels.length;i++){
			let hexColor = pixels[i].color;
			let r = parseInt(hexColor.substring(1,3),16);
			let g = parseInt(hexColor.substring(3,5),16);
			let b = parseInt(hexColor.substring(5,7),16);
			let redPos = 4*pixels[i].id;
			pixelArray[redPos+0] = r;
			pixelArray[redPos+1] = g;
			pixelArray[redPos+2] = b;
			pixelArray[redPos+3] = 255;
		}
		return pixelArray;
	},
	buyPixels: async function(){ //[{id:6,color:"#123456"},{id:7,color:"#654321"}]
		let pixels = [{id:0,color:"#123456"},{id:1,color:"#654321"},{id:2,color:"#000000"},{id:3,color:"#ff0000"}]
		let formattedPixels = [];
		let sumCost = 0;
		let pixelIds = [];
		for(let i=0;i<pixels.length;i++){
			pixelIds.push(pixels[i].id.toString());
		}
		let pixelsData = await getPixelsData(pixelIds);
		for(let i=0;i<pixels.length;i++){
			let pixelData = pixelsData[i];
			let pixel = {
				"pixel-id-str":pixels[i].id.toString(),
				"color":pixels[i].color,
				"is-new-pixel":!(pixelData.result.status == "success")
			}
			if(pixel["is-new-pixel"]){
				pixel["request-price-hundredths-str"] = "1";
			}else{
				pixel["request-price-hundredths-str"] = pixelData.result.data["price-hundredths-str"];
			}
			sumCost += parseInt(pixel["request-price-hundredths-str"]);
			formattedPixels.push(pixel);
		}
		let sumPixelRequestPrices
		let account = await KadenaPlace.getAccount();
		let data = await window.kadena.request({
			method:'kda_requestSign',
			networkId:'mainnet01',
			data:{
				networkId:'mainnet01',
				signingCmd:{
					pactCode:"(free.kadena-place.buy-many (read-string 'account) (read-msg 'pixels))",
					caps:[
						{
							role:"Gas cap",
							description:"Pay for gas",
							cap:{
								name:"coin.GAS",
								args:[]
							}
						},
						{
							role:"Transfer cap",
							description:"pay for pixels",
							cap:{
								name:"coin.TRANSFER",
								args:[account.wallet.account,"kadena-place mainnet pool kadena-place",sumCost/100]
							}
						}
					],
					sender:account.wallet.account,
					gasLimit:150000,
					gasPrice:1e-7,
					chainId:'5',
					ttl:600,
					envData:{
						account:account.wallet.account,
						pixels:formattedPixels
					},
					signingPubKey:account.wallet.publicKey,
					networkId:'mainnet01',
					networkVersion:'0.0'
				}
			}
		});
		KadenaPlace.sendSigned(data.signedCmd);
	},
	giveTip: async function(tip){ //{account:"sasfbsihbgsACCOUNTsdjfnosjgfd",amount:1.0,content:"XCSBDIFVAIencrypted messageVUCVSDUVFHUSV"}
		let account = await KadenaPlace.getAccount();
		let data = await window.kadena.request({
			method:'kda_requestSign',
			networkId:'mainnet01',
			data:{
				networkId:'mainnet01',
				signingCmd:{
					pactCode:"(free.kadena-place.give-tip (read-string 'from-account) (read-string 'to-account') (read-decimal 'amount) (read-string 'content))",
					caps:[
						{
							role:"Transfer cap",
							description:"pay for tip",
							cap:{
								name:"coin.TRANSFER",
								args:[account.wallet.account,tip.account,tip.amount]
							}
						}
					],
					sender:account.wallet.account,
					gasLimit:150000,
					gasPrice:1e-7,
					chainId:'5',
					ttl:600,
					envData:{
						"to-account":tip.account,
						"from-account":account.wallet.account,
						"amount":tip.amount,
						"content":tip.content
					},
					signingPubKey:account.wallet.publicKey,
					networkId:'mainnet01',
					networkVersion:'0.0'
				}
			}
		});
		KadenaPlace.sendSigned(data.signedCmd);
	},
	createAccount: async function(password,successFun,failFun){
		let account = await KadenaPlace.getAccount();
		let attrs;
		KadenaE2EEMessaging.yourKeys.publicKey = undefined;
		KadenaE2EEMessaging.yourKeys.privateKey = undefined;
		KadenaE2EEMessaging.generateKeys(KadenaE2EEMessaging.yourKeys);
		async function check(){
			if(KadenaE2EEMessaging.yourKeys.publicKey != undefined && KadenaE2EEMessaging.yourKeys.privateKey != undefined){
				clearInterval(interval);
				KadenaE2EEMessaging.account.name = sha256(KadenaE2EEMessaging.yourKeys.privateKey);
				KadenaE2EEMessaging.account.password = password;
				attrs = '(read-string "account") '+JSON.stringify(KadenaE2EEMessaging.yourKeys.publicKey)+' '+JSON.stringify(KadenaE2EEMessaging.account.name)+' '+JSON.stringify(KadenaE2EEMessaging.encryptPrivateKey(KadenaE2EEMessaging.yourKeys.privateKey,password));
				///
				let data = await window.kadena.request({
					method:'kda_requestSign',
					networkId:'mainnet01',
					data:{
						networkId:'mainnet01',
						signingCmd:{
							pactCode:"(free.kadena-place.create-account "+attrs+")",
							caps:[],
							sender:account.wallet.account,
							gasLimit:3000,
							gasPrice:1e-7,
							chainId:'5',
							ttl:600,
							envData:{
								account:account.wallet.account
							},
							signingPubKey:account.wallet.publicKey,
							networkId:'mainnet01',
							networkVersion:'0.0'
						}
					}
				});
				//let key = await KadenaPlace.sendSigned(data.signedCmd);
				let key = "tcna2l7Vf1XHrVOP4nQLp2BnCxNqOdUxGzgQ1CJvBU4";
				KadenaE2EEMessaging.e2ee_messaging.listen(key,async function(data){
					sessionStorage.setItem('kadena-e2ee-messaging-password',password);
					successFun(data);
				},function(){
					failFun();
				});
			}
		}
		let interval = setInterval(check,1000);
	},
	getTips: async function(tip_ids){
		return (await KadenaE2EEMessaging.e2ee_messaging.local('(free.e2ee-messaging.get-tips '+JSON.stringify(tip_ids)+')')).map(async function(tip_data){
			tip_data["decrypted-content"] = await KadenaE2EEMessaging.readMessage(tip_data["message-id"]);
			return tip_data;
		});
	},
	claimRewards: async function(){
		let account = await KadenaPlace.getAccount();
		let pixelIds = await KadenaPlace.getAllAccountPixelIds();
		let data = await window.kadena.request({
			method:'kda_requestSign',
			networkId:'mainnet01',
			data:{
				networkId:'mainnet01',
				signingCmd:{
					pactCode:"(free.kadena-place.claim-rewards (read-string 'account) (read-msg 'pixel-ids))",
					caps:[],
					sender:account.wallet.account,
					gasLimit:150000,
					gasPrice:1e-7,
					chainId:'5',
					ttl:600,
					envData:{
						"account":account.wallet.account,
						"pixel-ids":pixelIds
					},
					signingPubKey:account.wallet.publicKey,
					networkId:'mainnet01',
					networkVersion:'0.0'
				}
			}
		});
		KadenaPlace.sendSigned(data.signedCmd);
	},
	changeMinTip: async function(newMinTip){ //0.5
		let account = await KadenaPlace.getAccount();
		let data = await window.kadena.request({
			method:'kda_requestSign',
			networkId:'mainnet01',
			data:{
				networkId:'mainnet01',
				signingCmd:{
					pactCode:"(free.kadena-place.change-min-tip (read-string 'account) (read-decimal 'min-tip))",
					caps:[],
					sender:account.wallet.account,
					gasLimit:150000,
					gasPrice:1e-7,
					chainId:'5',
					ttl:600,
					envData:{
						"account":account.wallet.account,
						"min-tip":newMinTip
					},
					signingPubKey:account.wallet.publicKey,
					networkId:'mainnet01',
					networkVersion:'0.0'
				}
			}
		});
		KadenaPlace.sendSigned(data.signedCmd);
	},
	getAllAccountPixelIds: async function(){
		let account = await KadenaPlace.getAccount();
		let data = await Pact.fetch.local({meta:Pact.lang.mkMeta("", "5", 1e-7, 150000, 0, 600),pactCode:Pact.lang.mkExp("free.kadena-place.get-all-account-pixel-ids",account.wallet.account)},"https://api.chainweb.com/chainweb/0.0/mainnet01/chain/5/pact");
		return data.result.data;
	},
	getPixelsData: async function(pixelIds){
		let data = await Pact.fetch.local({meta:Pact.lang.mkMeta("", "5", 1e-7, 150000, 0, 600),pactCode:Pact.lang.mkExp("free.kadena-place.get-pixels-data",pixelIds)},"https://api.chainweb.com/chainweb/0.0/mainnet01/chain/5/pact");
		return data.result.data;
	},
	sendSigned: async function(signed){
		let data = await Pact.wallet.sendSigned(signed,"https://kadena2.app.runonflux.io/chainweb/0.0/mainnet01/chain/5/pact");
		return data["requestKeys"][0];
	},
	getKPAccount: async function(account){
		let data = await Pact.fetch.local({meta:Pact.lang.mkMeta("", "5", 1e-7, 150000, 0, 600),pactCode:Pact.lang.mkExp("free.kadena-place.get-account",account)},"https://api.chainweb.com/chainweb/0.0/mainnet01/chain/5/pact");
		return data.result.data;
	},
	kPAccountExists: async function(){
		let account = await KadenaPlace.getAccount();
		let data = await Pact.fetch.local({meta:Pact.lang.mkMeta("", "5", 1e-7, 150000, 0, 600),pactCode:Pact.lang.mkExp("free.kadena-place.get-account",account.wallet.account)},"https://api.chainweb.com/chainweb/0.0/mainnet01/chain/5/pact");
		return (data.result.status == 'success')?true:false;
	},
	getAccount: async function(){
		let data = await window.kadena.request({
			method:'kda_requestAccount',
			networkId:'mainnet01'
		});
		console.log(data);
		return data;
	},
	connect: async function(){
		let data = await window.kadena.request({
			method:'kda_connect',
			networkId:'mainnet01'
		});
		return data;
	},
	isXWalletInstalled: function(){
		const { kadena } = window;
		return Boolean(kadena && kadena.isKadena);
	},
	initialize: function(){
		if (isXWalletInstalled()) {
			console.log("XWallet is installed");
		}else{
			console.log("XWallet is not installed");
			}
	},
	getTx: async function(){
		let key = "6HiEiI61j7ZoIbeHOaNBMZYn0bk_4aiXR5lm2_RdcBA";
		let data = await Pact.fetch.poll({requestKeys:[key]},"https://api.chainweb.com/chainweb/0.0/mainnet01/chain/5/pact");
	},
	signInE2EEMessaging: async function(password){
		let account = await KadenaPlace.getAccount();
		if(await KadenaE2EEMessaging.signInAccount((await KadenaPlace.getKPAccount(account.wallet.account))["e2ee-messaging-account"],password)){
			sessionStorage.setItem('kadena-e2ee-messaging-password',password);
			document.getElementById('my_account_password').value = password;
			return true;
		}else{
			return false;
		}
	},
	accountPixelIds: async function(account){
		let data = await Pact.fetch.local({meta:Pact.lang.mkMeta("", "5", 1e-7, 150000, 0, 600),pactCode:'(free.kadena-place.get-all-account-pixel-ids "'+account+'")'},"https://api.chainweb.com/chainweb/0.0/mainnet01/chain/5/pact");
		return data.result.data;
	},
	accountAvailableRewards: async function(account){
		let pixels_data = await KadenaE2EEMessaging.e2ee_messaging.local('(free.kadena-place.get-pixels-data '+JSON.stringify(await KadenaPlace.accountPixelIds(account))+')');
		let rewards = pixels_data.length*(await KadenaPlace.placePrice());
		for(let i=0;i<pixels_data.length;i++){
			rewards -= pixels_data[i]["last-claim-place-price"];
		}
		return rewards/1000000;
	},
	placePrice: async function(){
		let data = await KadenaE2EEMessaging.e2ee_messaging.local('(free.kadena-place.get-place-price)');
		return data;
	},
	placeHistory: async function(){
		let data = await KadenaE2EEMessaging.e2ee_messaging.local('(free.kadena-place.get-place-history)');
		return data;
	}
}