export async function onRequest(request) {
	class ElementHandler {
	  element(element) {
	    // An incoming element, such as `div`
	    element.setInnerContent("let url_param_time = '"+request.params.time+"';");
	  }

	  comments(comment) {
	    // An incoming comment
	  }

	  text(text) {
	    // An incoming piece of text
	  }
	}
	let res = await fetch('https://kadena-place-dynamic.pages.dev/timeline.html');
	return new HTMLRewriter().on('script#set_url_param_time_variable', new ElementHandler()).transform(res);
}