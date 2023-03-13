export async function onRequest(request) {
	class ElementHandler {
	  element(element) {
	    // An incoming element, such as `div`
	    element.setInnerContent("let url_param_account = '"+request.params.account+"';");
	  }

	  comments(comment) {
	    // An incoming comment
	  }

	  text(text) {
	    // An incoming piece of text
	  }
	}
	let res = await fetch('https://dynamicaccounts.kadena-place-dynamic.pages.dev/accounts.html');
	return new HTMLRewriter().on('script#set_url_param_account_variable', new ElementHandler()).transform(res);
}