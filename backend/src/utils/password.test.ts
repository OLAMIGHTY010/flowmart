import { hashPassword, comparePassword } from "./password";

describe("Password Utility", () => {
	const plainTextPassword = "mySuperSecretPassword123!";

	describe("hashPassword", () => {
		it("should return a hashed string", async () => {
			const hash = await hashPassword(plainTextPassword);

			expect(hash).toBeDefined();
			expect(typeof hash).toBe("string");
			// The hash should never equal the plain text password
			expect(hash).not.toBe(plainTextPassword);
		});

		it("should generate unique hashes for the exact same password due to salting", async () => {
			const hash1 = await hashPassword(plainTextPassword);
			const hash2 = await hashPassword(plainTextPassword);

			// bcrypt.genSalt(10) should guarantee these are different
			expect(hash1).not.toBe(hash2);
		});
	});

	describe("comparePassword", () => {
		it("should return true when comparing the correct password with its hash", async () => {
			const hash = await hashPassword(plainTextPassword);
			const isMatch = await comparePassword(plainTextPassword, hash);

			expect(isMatch).toBe(true);
		});

		it("should return false when comparing an incorrect password", async () => {
			const hash = await hashPassword(plainTextPassword);
			const isMatch = await comparePassword("wrongPassword456", hash);

			expect(isMatch).toBe(false);
		});
	});
});
