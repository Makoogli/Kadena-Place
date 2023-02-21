export async function onRequest(request) {
	class ElementHandler {
	  element(element) {
	    // An incoming element, such as `div`
	    let script = window.createElement('script');
	    script.text = "let url_param_account = '"+request.params.account+"';"
	    element.prepend(script);
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