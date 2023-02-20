class ElementHandler {
  element(element) {
    // An incoming element, such as `div`
  }

  comments(comment) {
    // An incoming comment
  }

  text(text) {
    return 'the';
  }
}

export async function handleRequest(request) {
	let res = await fetch(request)
	return new HTMLRewriter().on('div', new ElementHandler()).transform(res);
}