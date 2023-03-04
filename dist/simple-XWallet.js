
let XWallet = function(apiHost,chainId,meta=undefined){
	if(window.Pact == undefined){
		throw new Error("pact-lang-api not detected");
	}
	meta.gasPrice = meta.gasPrice || 1e-7;
	meta.gasLimit = meta.gasLimit || 150000;
	meta.ttl = meta.ttl || 600;
	this.connect = async function(){
		let data = await window.kadena.request({method:'kda_connect',networkId:'mainnet01'});
		if(data.status == "success"){
			this.account = data.account;
			return this.account;
		}else{
			throw new Error("Connect to XWallet failed");
		}
	}
	this.apiHost = function(_apiHost){return new XWallet(_apiHost,chainId,meta)};
	this.chainId = function(_chainId){return new XWallet(apiHost,_chainId,meta)};
	this.meta = function(_meta){return new XWallet(apiHost,chainId,_meta)};
	this.local = async function(pactCode,envData=undefined,caps=undefined){
		let data = await Pact.fetch.local({meta:Pact.lang.mkMeta("", "5", 1e-7, 100, 0, 600),envData:envData,caps:caps,pactCode:pactCode},apiHost);
		if(data.result.status == "success"){
			return data.result.data;
		}else{
			console.log(data);
			throw new Error("Local command "+pactCode+" failed");
		}
	}
	this.send = async function(pactCode,envData=undefined,caps=undefined){
		this.account = this.account || (await this.connect());
		let data = await window.kadena.request({
			method:'kda_requestSign',
			networkId:'mainnet01',
			data:{
				networkId:'mainnet01',
				signingCmd:{
					pactCode:pactCode,
					envData:envData,
					caps:caps,
					signingPubKey:this.account.publicKey,
					networkId:'mainnet01',
					networkVersion:'0.0',
					sender:this.account.account,
					chainId:chainId,
					...meta
				}
			}
		});
		if(data.status == "success"){
			return await Pact.wallet.sendSigned(data.signedCmd,apiHost);
		}else{
			throw new Error("Send command "+pactCode+" failed");
		}
	}
	this.listen = async function(key,successFun,failFun){
		let req = {"requestKeys":[key]};
		async function check(){
			let res = await Pact.fetch.poll(req,apiHost); //////////////////////////////////////////
			if(res[req.requestKeys[0]] != undefined){
				let data = res[req.requestKeys[0]];
				clearInterval(interval);
				if(data.result.status == 'success'){
					successFun(data.result.data);
				}else if(failFun){
					failFun();
				}
			}
		}
		let interval = setInterval(check,5000);
	}
}