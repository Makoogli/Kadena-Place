export const onRequest = ({params}) => {
	const {accountName} = params;
	return new Response(`Your account is ${accountName}`);
}