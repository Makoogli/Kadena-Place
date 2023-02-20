export function handleRequest(request) {
	return new Response(request.params.account);
}