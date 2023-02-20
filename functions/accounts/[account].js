export function onRequest(request) {
	return new Response("<!DOCTYPE html><html><body><div>Your account name is "+request.params.account+"</div></body></html>",{headers:{'content-type':'text/html;charset=UTF-8'}});
}