let KadenaPlace = {
	getPlace: async function(){
		let data = await Pact.fetch.local({meta:Pact.lang.mkMeta("", "5", 1e-7, 150000, 0, 600),pactCode:"(free.kadena-place-paint.get-place)"},"https://api.chainweb.com/chainweb/0.0/mainnet01/chain/5/pact");
		let pixels = data.result.data;
		let pixelArray = Array(4000000);
		for(let i=0;i<pixels.length;i++){
			let hexColor = pixels[i][1];
			let r = parseInt(hexColor.substring(1,3),16);
			let g = parseInt(hexColor.substring(3,5),16);
			let b = parseInt(hexColor.substring(5,7),16);
			let redPos = 4*parseInt(pixels[i][0]);
			pixelArray[redPos+0] = r;
			pixelArray[redPos+1] = g;
			pixelArray[redPos+2] = b;
			pixelArray[redPos+3] = 255;
		}
		return pixelArray;
	},
	buyPixels: async function(pixels,cost){
		let account = await KadenaPlace.getAccount();
		let createAccount = (await KadenaPlace.accountExists()) ? "" : "(free.kadena-place-paint.create-account (read-string 'account))";
		let data = await window.kadena.request({
			method:'kda_requestSign',
			networkId:'mainnet01',
			data:{
				networkId:'mainnet01',
				signingCmd:{
					pactCode:createAccount+"(free.kadena-place-paint.buy-many (read-string 'account) (read-msg 'pixels))",
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
								args:[account.wallet.account,"kadena-place paint pool",cost]
							}
						},
						{
							role:"Account cap",
							description:"confirm owner",
							cap:{
								name:"free.kadena-place-paint.ACCOUNT-GUARD",
								args:[account.wallet.account]
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
						pixels:pixels
					},
					signingPubKey:account.wallet.publicKey,
					networkId:'mainnet01',
					networkVersion:'0.0'
				}
			}
		});
		KadenaPlace.sendSigned(data.signedCmd);
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
					pactCode:"(free.kadena-place-paint.claim-rewards (read-string 'account) (read-msg 'pixel-ids))",
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
	accountExists: async function(){
		let account = await KadenaPlace.getAccount();
		let data = await Pact.fetch.local({meta:Pact.lang.mkMeta("", "5", 1e-7, 150000, 0, 600),pactCode:Pact.lang.mkExp("free.kadena-place-paint.get-account",account.wallet.account)},"https://api.chainweb.com/chainweb/0.0/mainnet01/chain/5/pact");
		return data.result == "success";
	},
	getAllAccountPixelIds: async function(){
		let account = await KadenaPlace.getAccount();
		let data = await Pact.fetch.local({meta:Pact.lang.mkMeta("", "5", 1e-7, 150000, 0, 600),pactCode:Pact.lang.mkExp("free.kadena-place-paint.get-all-account-pixel-ids",account.wallet.account)},"https://api.chainweb.com/chainweb/0.0/mainnet01/chain/5/pact");
		return data.result.data;
	},
	getPixelsData: async function(pixelIds){
		let data = await Pact.fetch.local({meta:Pact.lang.mkMeta("", "5", 1e-7, 150000, 0, 600),pactCode:Pact.lang.mkExp("free.kadena-place-paint.get-pixels-data",pixelIds)},"https://api.chainweb.com/chainweb/0.0/mainnet01/chain/5/pact");
		return data.result.data;
	},
	sendSigned: async function(signed){
		let data = await Pact.wallet.sendSigned(signed,"https://api.chainweb.com/chainweb/0.0/mainnet01/chain/5/pact");
		return data["requestKeys"][0];
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
	accountPixelIds: async function(account){
		let data = await Pact.fetch.local({meta:Pact.lang.mkMeta("", "5", 1e-7, 150000, 0, 600),pactCode:'(free.kadena-place-paint.get-all-account-pixel-ids "'+account+'")'},"https://api.chainweb.com/chainweb/0.0/mainnet01/chain/5/pact");
		return data.result.data;
	},
	accountAvailableRewards: async function(account){
		let pixels_data = (await Pact.fetch.local({meta:Pact.lang.mkMeta("", "5", 1e-7, 150000, 0, 600),pactCode:'(free.kadena-place-paint.get-pixels-data '+JSON.stringify(await KadenaPlace.accountPixelIds(account))+')'},"https://api.chainweb.com/chainweb/0.0/mainnet01/chain/5/pact")).result.data;
		let rewards = pixels_data.length*(await KadenaPlace.placePrice());
		for(let i=0;i<pixels_data.length;i++){
			rewards -= pixels_data[i]["last-claim-place-price"];
		}
		return rewards/1000000;
	},
	placePrice: async function(){
		let data = await Pact.fetch.local({meta:Pact.lang.mkMeta("", "5", 1e-7, 150000, 0, 600),pactCode:"(free.kadena-place-paint.get-place-price)"},"https://api.chainweb.com/chainweb/0.0/mainnet01/chain/5/pact");
		return data.result.data;
	},
	accountData: async function(account){
		let data = await Pact.fetch.local({meta:Pact.lang.mkMeta("", "5", 1e-7, 150000, 0, 600),pactCode:'(free.kadena-place-paint.get-account "'+account+'")'},"https://api.chainweb.com/chainweb/0.0/mainnet01/chain/5/pact");
		return data.result.data;
	}
}