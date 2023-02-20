export default {
	async fetch(request){
		return new Response(`Returning ${JSON.stringify(request)}`);
	}
}