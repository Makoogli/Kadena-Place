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
	let res = await fetch('https://dynamicaccounts.kadena-place.pages.dev/accounts.html');
	return new HTMLRewriter().on('div', new ElementHandler()).transform(res);
	return new Response(JSON.stringify(request));
}