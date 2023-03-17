export async function onRequest(request) {
	class ElementHandler {
	  element(element) {
	    // An incoming element, such as `div`
	    element.setInnerContent("let url_param_pixel = '"+request.params.pixel+"';");
	  }

	  comments(comment) {
	    // An incoming comment
	  }

	  text(text) {
	    // An incoming piece of text
	  }
	}
	let res = await fetch('https://kadena-place-dynamic.pages.dev/pixels.html');
	return new HTMLRewriter().on('script#set_url_param_pixel_variable', new ElementHandler()).transform(res);
}