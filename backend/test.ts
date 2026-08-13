import { registerUser, loginUser } from "./src/services/auth";

async function runTest() {
	try {
		const registeredUser = await registerUser("faustoche@example.com", "TestPassword123!");
		console.log(registeredUser);

		const loggedInUser = await loginUser("faustoche@example.com", "TestPassword123!");
		console.log(loggedInUser);
	} catch (error) {
		console.error(error);
	}
}

runTest();