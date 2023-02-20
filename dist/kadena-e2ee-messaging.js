let KadenaE2EEMessaging = {
	e2ee_messaging: new XWallet("https://kadena2.app.runonflux.io/chainweb/0.0/mainnet01/chain/5/pact","5",{gasLimit:3000}),
	yourKeys: {},
	account: {},
	generateKeys: async function(keyPair){
	    var rsa = new RSA();
	    rsa.generateKeyPair(function(pair) {
	        keyPair.publicKey = pair.publicKey.split("\r\n").join("");
	        keyPair.privateKey = pair.privateKey.split("\r\n").join("");
	    });
	},
	encrypt: function(publicKey,message){
		var crypt = new Crypt({
	        rsaStandard: 'RSA-OAEP'//,
	    });
	    return crypt.encrypt(publicKey, message);
	},
	decrypt: function(privateKey,message){
		var crypt = new Crypt({
	        rsaStandard: 'RSA-OAEP'//,
	    });
		return crypt.decrypt(privateKey, message);
	},
	hashPassword: function(password){
		let passwordHash16 = "";
		for(let i=0;i<75;i++){
			passwordHash16 += sha256(password+i.toString());
		}
		return passwordHashB = KadenaE2EEMessaging.hexToB(passwordHash16);
	},
	encryptPrivateKey: function(privateKey,password){
		let privateKeyB = atob(privateKey.substring(31,privateKey.length-29));
		let passwordHashB = KadenaE2EEMessaging.hashPassword(password).substring(0,privateKeyB.length);
		let xorB = Array(privateKeyB.length);
		for(let i=0;i<privateKeyB.length;i++){
			xorB[i] = String.fromCharCode(privateKeyB.charCodeAt(i)^passwordHashB.charCodeAt(i));
		}
		return btoa(xorB.join(""));
	},
	decryptPrivateKey: function(xorA,password){
		let xorB = atob(xorA);
		let passwordHashB = KadenaE2EEMessaging.hashPassword(password).substring(0,xorB.length);
		let privateKeyB = Array(xorB.length);
		for(let i=0;i<xorB.length;i++){
			privateKeyB[i] = String.fromCharCode(xorB.charCodeAt(i)^passwordHashB.charCodeAt(i));
		}
		return "-----BEGIN RSA PRIVATE KEY-----"+btoa(privateKeyB.join(""))+"-----END RSA PRIVATE KEY-----";
	},
	hexToB: function(hexstring){ //72 hashes
	    return hexstring.match(/\w{2}/g).map(function(a) {
	        return String.fromCharCode(parseInt(a, 16));
	    }).join("");
	},
	getKeys: async function(pair,account,password){
		let account_data = (await KadenaE2EEMessaging.e2ee_messaging.local('(free.e2ee-messaging.get-accounts ["'+account+'"])'))[0];
		return {publicKey:account_data['public-key'],privateKey:KadenaE2EEMessaging.decryptPrivateKey(account_data['xor-private-key-password-hash'],password)};
	},
	createAccount: async function(password){
		KadenaE2EEMessaging.yourKeys.publicKey = undefined;
		KadenaE2EEMessaging.yourKeys.privateKey = undefined;
		generateKeys(KadenaE2EEMessaging.yourKeys);
		async function check(){
			if(KadenaE2EEMessaging.yourKeys.publicKey != undefined && KadenaE2EEMessaging.yourKeys.privateKey != undefined){
				clearInterval(interval);
				KadenaE2EEMessaging.account.name = sha256(KadenaE2EEMessaging.yourKeys.privateKey);
				KadenaE2EEMessaging.account.password = password;
				coin_account = (await KadenaE2EEMessaging.e2ee_messaging.connect()).account;
				KadenaE2EEMessaging.e2ee_messaging.send('(free.e2ee-messaging.create-account (read-string "account") '+JSON.stringify(KadenaE2EEMessaging.yourKeys.publicKey)+' '+JSON.stringify(KadenaE2EEMessaging.account.name)+' '+JSON.stringify(encryptPrivateKey(KadenaE2EEMessaging.yourKeys.privateKey,password))+' (at "guard" (coin.details (read-string "account"))))',{"account":coin_account});
			}
		}
		let interval = setInterval(check,100);
	},
	signInAccount: async function(account_,password){
		KadenaE2EEMessaging.yourKeys = await KadenaE2EEMessaging.getKeys(KadenaE2EEMessaging.yourKeys,account_,password);
		if(sha256(KadenaE2EEMessaging.yourKeys.privateKey) == (await KadenaE2EEMessaging.e2ee_messaging.local('(free.e2ee-messaging.get-accounts ["'+account_+'"])'))[0]['private-key-hash']){
			KadenaE2EEMessaging.account.name = account_;
			KadenaE2EEMessaging.account.password = password;
			return true;
		}else{
			return false;
		}
	},
	sendMessage: async function(toAccount,messageText){
		if(KadenaE2EEMessaging.yourKeys.privateKey == undefined){
			console.log('need to sign in to send a message');
			return;
		}
		let fromAccountContent = {content:await encrypt(KadenaE2EEMessaging.yourKeys.publicKey,messageText)};
		let toAccountPublicKey = (await KadenaE2EEMessaging.e2ee_messaging.local('(free.e2ee-messaging.get-accounts ["'+toAccount+'"])'))[0]['public-key'];
		let toAccountContent = {content:await encrypt(toAccountPublicKey,messageText)};
		let conversation_id = await KadenaE2EEMessaging.e2ee_messaging.local('(free.e2ee-messaging.conversation-id "'+KadenaE2EEMessaging.account.name+'" "'+toAccount+'")');
		let canonical = await KadenaE2EEMessaging.e2ee_messaging.local('(free.e2ee-messaging.hash-canonical "'+KadenaE2EEMessaging.account.name+'" "'+toAccount+'")');
		let content = canonical?[fromAccountContent,toAccountContent]:[toAccountContent,fromAccountContent];
		KadenaE2EEMessaging.e2ee_messaging.send('(free.e2ee-messaging.create-message "'+KadenaE2EEMessaging.account.name+'" "'+toAccount+'" (read-msg "content"))',{"content":content});
	},
	readMessage: async function(message_ids){
		let content = await (await KadenaE2EEMessaging.e2ee_messaging.local('(free.e2ee-messaging.get-messages '+JSON.stringify(message_ids)+')'))[0]['content'][(await KadenaE2EEMessaging.e2ee_messaging.local('(free.e2ee-messaging.hash-canonical "'+KadenaE2EEMessaging.account.name+'" "'+withAccount+'")'))?0:1]['content'];
		return (await decrypt(KadenaE2EEMessaging.yourKeys.privateKey,content)).message;
	},
	changePassword: async function(privateKey,newPassword){
		if(sha256(privateKey) == (await KadenaE2EEMessaging.e2ee_messaging.local('(free.e2ee-messaging.get-accounts ["'+KadenaE2EEMessaging.account.name+'"])'))[0]["private-key-hash"]){
			KadenaE2EEMessaging.e2ee_messaging.send('(free.e2ee-messaging.change-password "'+KadenaE2EEMessaging.account.name+'" "'+KadenaE2EEMessaging.encryptPrivateKey(privateKey,newPassword)+'")');
			return true;
		}else{
			return false;
		}
	}
}
//KadenaE2EEMessaging.e2ee_messaging.connect();

//signInAccount("5cc406bc82630787e02c47ef14d40dd58715a6db67619a8a20ac06f89d423246","1234");

//createAccount("1234");

//console.log(encrypt("-----BEGIN PUBLIC KEY-----MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEApRVhvDxdhGjjE9ySm8QUFIXg1QMPoOAd3Mzudi3Qiw2oH4C+AZs3FemIu6Ny548IwfVQRziTDPAb49zHbopeJU1NimTzqhYWHnf7TqOV2Uj9eaKv5I3rjy8wQmpfyIWclaHolU/t8x38h5nf5W4DBUQe9NxaFaDyFKMFeaVXFFtB6cgk4JPupUv/nOYgUHK7iop8hi+GX3K+8LdBEaZm1WzVUZuieom/kC/CB0JCCkLv3+0wQpwbnyJ36jdvomBL4qF2fmKIxFV9hSa/NEOjNDlP+sFpSlMR3XAhv7MQmAqd3z5daYnzKaVLIjFlcyWMSUEzYzE83j7qskhafDPIeUCodtR9JPx/PKNjJdI/INiPno1jvQIs3M7xnnII9qE0/i9Ua0simMa3Q3LLgOtf5pk+geE0+7KnNMCWR5/a1wCE/BjDOGEXtg7Gg3IZH/m7wGGdaRdIUqVAe+4W4fn/BRN7h2aghds2xXC2NtQXLEVgFKA1mpvL7DpcIq/DcbhOFiNxWKyx96raqkajBCj3zWiYdH2naBwCgvbxB2z8zEUtkT1M0RDUNzd9O6pLA1BEUWas5tsyv/0VIaWWGLbT2nzZ21H+LRQclsYLxCl3iqHeu1X/ZeXqLcLLMZ1oO9B1VgrBxfZz0ufGM/UZdOcKqk4Wm1FD3Pg0QfVUeOZb0W8CAwEAAQ==-----END PUBLIC KEY-----","Hello"));
//console.log(encrypt("-----BEGIN PUBLIC KEY-----MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA5E2TFIIpdgYblDGN57AFxr4fq2hAT7CHwOOlU62HqhIGSQAw+6Jb7E8jt3JhnXP8CQsiXaCNUA2px77xNkcS6R1G8HTizUhxWqi133kVFCJgSrL+FhFNyA5TvSeODN5UcwBFCbKLaiaOMhAjhU+RWwcXeS2OD3ahjT6+9HHtI3ehuvgXn6p1hXvokTFVPHDZdBZsJ8HFxKZU6NAYSYgnXjfepDMKMJfmsMd5FlnwPAMXdWSbghKwzJ4S/r+UPJCMdX5OJFq2nNF26X0RHIEf4kfsrPDQ9fUZ2UtEBYSUTbt7CE77BJFaMB6K/oVwjqWxkcGTU0ln+YCauqeOsTG4XWc2YZPH4JyUI7r3XBvx7UxL8CbJR1Ssh8QmkHOep3hBcw8cDzgLH5MK79zTDn/+TaAkSwmroWjj05Y0et9nWSJ0kbsDo8ZKr8E2BEGTPFUbHKS9RrlRUgv/po86O86QnqMsHHEp+yRmnyzY/FMyw/06W7sibHfN2MEea241mWquk02aTRVsnbwB2w6bU2u+y2rbEskH6HbdhPtejJy2i131nzJ7tp9AGz/1IY6qJbBAsUECH+gnu17wtbG08gl3xiV5D1DGJXrqTk1LwXxG34aTjVa2rEA5HpO3qnCxxDkkZZJj5E6vqOGu/k5IQYuXW3JXrMtQ8LNTRxm0JwBjzXMCAwEAAQ==-----END PUBLIC KEY-----","Hello"))

//signInAccount("0Bun_VpV0KxewD7JrHDMYx0b6h16-Eqia_xgEI00LYo","1234");

//setTimeout(function(){KadenaE2EEMessaging.e2ee_messaging.send('(free.e2ee-messaging.create-conversation "aQ4VPkBRrcXcqA5-WGdba57d46ucUKRUiy1sc5PYmI8" "0Bun_VpV0KxewD7JrHDMYx0b6h16-Eqia_xgEI00LYo")')},1000);

//setTimeout(function(){sendMessage("0Bun_VpV0KxewD7JrHDMYx0b6h16-Eqia_xgEI00LYo","Hello");},1000);

//setTimeout(async function(){let msg = await readMessage("aQ4VPkBRrcXcqA5-WGdba57d46ucUKRUiy1sc5PYmI8",0);console.log(msg);},1000);

//window.KadenaE2EEMessaging.e2ee_messagingAPI.createConversation("5cc406bc82630787e02c47ef14d40dd58715a6db67619a8a20ac06f89d423246","039d18b9970d80719182d67f680b2f7e562ae41a6de77da5040f00ac6162aa48");

/*async function getTx(){
	let data = await Pact.fetch.poll({requestKeys: ["k0Uml7xzI5G7owHvZ4NIoRCc_YYXIG-yWHOltwXnVW4"]}, "https://kadena2.app.runonflux.io/chainweb/0.0/mainnet01/chain/5/pact");
	console.log(data);
}

getTx();*/

/*async function getGuard(account){
	let data = await window.KadenaE2EEMessaging.e2ee_messagingAPI.get("coin.details",[account]);
	console.log(data);
}

getGuard("k:e61108b15a8c5b45d7593ebdd1e66c1bd0d9f40cb4190d2e68c922355c0bb932");*/

//signInUsername("5cc406bc82630787e02c47ef14d40dd58715a6db67619a8a20ac06f89d423246","4321");

//setTimeout(async function(){changePassword("1234")},1000);