export default {
	async fetch(request) {
		return new Response(`Your account is ${request.params.accouns}`);
	},
};