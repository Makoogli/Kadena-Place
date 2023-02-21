export async function onRequest(request) {
	class ElementHandler {
	  element(element) {
	    // An incoming element, such as `div`
	    element.before("<head><script>let url_param_account = '"+request.params.account+"';</script></head>");
	  }

	  comments(comment) {
	    // An incoming comment
	  }

	  text(text) {
	    // An incoming piece of text
	  }
	}
	let res = await fetch('https://dynamicaccounts.kadena-place.pages.dev/accounts.html');
	return new HTMLRewriter().on('head', new ElementHandler()).transform(res);
}