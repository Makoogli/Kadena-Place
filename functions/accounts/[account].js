export default {
	async fetch(request){
		class ElementHandler {
			element(element) {
	    		element.setInnerContent("account is "+request.params.account);
			}

			comments(comment) {
			}

			text(text) {
			}
		}
		let res = await fetch(request);
		return new HTMLRewriter().on('div', new ElementHandler()).transform(res);
	}
}