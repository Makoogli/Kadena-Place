export async function onRequest(request) {
	class ElementHandler {
	  element(element) {
	    // An incoming element, such as `div`
	    element.setInnerContent("account is "+request.params.account);
	  }

	  comments(comment) {
	    // An incoming comment
	  }

	  text(text) {
	    // An incoming piece of text
	  }
	}
	let res = await fetch(request);
	return new HTMLRewriter().on('div', new ElementHandler()).transform(res);
}