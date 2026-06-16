// 1. Define the mock spies OUTSIDE the mock factories
const mockSendMail = jest.fn();
const mockVerify = jest.fn().mockResolvedValue(true);
const mockReadFile = jest.fn();
const mockCompile = jest.fn();

// 2. Mock external dependencies with full ES Module compatibility
jest.mock("nodemailer", () => ({
	__esModule: true,
	default: {
		createTransport: jest.fn(() => ({
			sendMail: mockSendMail,
			verify: mockVerify,
		})),
	},
}));

jest.mock("fs/promises", () => ({
	__esModule: true,
	default: { readFile: mockReadFile },
	readFile: mockReadFile,
}));

jest.mock("handlebars", () => ({
	__esModule: true,
	default: { compile: mockCompile },
	compile: mockCompile,
}));

describe("Email Service", () => {
	let emailService: any;
	let consoleLogSpy: jest.SpyInstance;
	let consoleErrorSpy: jest.SpyInstance;

	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetModules();

		consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
		consoleErrorSpy = jest
			.spyOn(console, "error")
			.mockImplementation(() => {});

		// Dynamically require the service fresh for EACH test
		emailService = require("./email.service").emailService;
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});

	it("should verify the SMTP connection on initialization", async () => {
		await new Promise(process.nextTick);
		expect(mockVerify).toHaveBeenCalled();
	});

	it("should compile an HTML template and send an OTP email successfully", async () => {
		const mockFileContent = "<html>{{otp}}</html>";
		mockReadFile.mockResolvedValue(mockFileContent);

		const mockCompiledTemplate = jest
			.fn()
			.mockReturnValue("<html>123456</html>");
		mockCompile.mockReturnValue(mockCompiledTemplate);

		mockSendMail.mockResolvedValue(true);

		const testData = { fullName: "Test User", otp: "123456" };
		await emailService.sendOtpEmail("test@flowmart.com", testData);

		expect(mockReadFile).toHaveBeenCalled();
		expect(mockCompile).toHaveBeenCalledWith(mockFileContent);
		expect(mockCompiledTemplate).toHaveBeenCalledWith(testData);

		expect(mockSendMail).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "test@flowmart.com",
				subject: "Verify your FlowMart Account (OTP)",
				html: "<html>123456</html>",
			})
		);
	});

	it("should compile an HTML template and send a Welcome email successfully", async () => {
		const mockFileContent = "<html>Welcome {{fullName}}</html>";
		mockReadFile.mockResolvedValue(mockFileContent);

		const mockCompiledTemplate = jest
			.fn()
			.mockReturnValue("<html>Welcome Vendor Admin</html>");
		mockCompile.mockReturnValue(mockCompiledTemplate);

		mockSendMail.mockResolvedValue(true);

		const testData = { fullName: "Vendor Admin", role: "vendor" };
		await emailService.sendWelcomeEmail("vendor@flowmart.com", testData);

		expect(mockSendMail).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "vendor@flowmart.com",
				subject: "Welcome to FlowMart Logistics Platform",
				html: "<html>Welcome Vendor Admin</html>",
			})
		);
	});

	it("should throw an error and log it if template compilation fails", async () => {
		mockReadFile.mockRejectedValue(
			new Error("ENOENT: no such file or directory")
		);

		await expect(
			emailService.sendOtpEmail("test@flowmart.com", {
				fullName: "Fail",
				otp: "000",
			})
		).rejects.toThrow("Template compilation failed");

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Error compiling template: otp-verification",
			expect.any(Error)
		);
	});
});
