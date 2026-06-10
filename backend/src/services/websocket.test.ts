import { Server as HttpServer } from "http";
import { initWebSocketHub, sendInAppNotification } from "./websocket";
import { Server } from "socket.io";

// 1. Mock socket.io entirely to intercept internal constructor instances and event chains
jest.mock("socket.io", () => {
	const mockIo = {
		on: jest.fn(),
		to: jest.fn().mockReturnThis(),
		emit: jest.fn(),
	};
	return {
		Server: jest.fn().mockImplementation(() => mockIo),
	};
});

describe("WebSocket Infrastructure Service", () => {
	let mockHttpServer: Partial<HttpServer>;
	let mockIoInstance: any;
	let capturedConnectionHandler: Function;

	beforeEach(() => {
		jest.clearAllMocks();

		// Instantiate a dummy HTTP server handle
		mockHttpServer = {} as HttpServer;

		// Retrieve our mocked instance wrapper reference
		mockIoInstance = new Server() as any;

		// Capture the 'connection' lifecycle handler callback when initialized
		mockIoInstance.on.mockImplementation(
			(event: string, handler: Function) => {
				if (event === "connection") {
					capturedConnectionHandler = handler;
				}
			}
		);

		// Initialize the WebSocket Hub
		initWebSocketHub(mockHttpServer as HttpServer);
	});

	it("should successfully initialize the Socket.IO Server with wildcard CORS matching", () => {
		expect(Server).toHaveBeenCalledWith(mockHttpServer, {
			cors: { origin: "*" },
		});
		expect(mockIoInstance.on).toHaveBeenCalledWith(
			"connection",
			expect.any(Function)
		);
	});

	describe("Connection & Subscription Lifecycle Tracking", () => {
		it("should track a user connection and safely route real-time in-app data updates", () => {
			let capturedDisconnectHandler: Function = () => {};

			// Build a simulated active user client connection socket
			const mockSocket = {
				id: "socket-session-xyz",
				handshake: {
					query: { userId: "attendee-456" },
				},
				on: jest
					.fn()
					.mockImplementation((event: string, handler: Function) => {
						if (event === "disconnect") {
							capturedDisconnectHandler = handler;
						}
					}),
			};

			// Trigger user establishing a websocket connection pipeline
			capturedConnectionHandler(mockSocket);

			expect(mockSocket.on).toHaveBeenCalledWith(
				"disconnect",
				expect.any(Function)
			);

			// Attempt to push a status sync payload to this specific connected user
			const eventName = "order.status_changed";
			const samplePayload = { orderId: "order-789", status: "ready" };

			sendInAppNotification("attendee-456", eventName, samplePayload);

			// Verify targeted delivery mapping occurred correctly
			expect(mockIoInstance.to).toHaveBeenCalledWith(
				"socket-session-xyz"
			);
			expect(mockIoInstance.emit).toHaveBeenCalledWith(
				eventName,
				samplePayload
			);
		});

		it("should bypass data distribution workflows if targeted user identifier is not actively connected", () => {
			// Clear call histories
			mockIoInstance.to.mockClear();
			mockIoInstance.emit.mockClear();

			// Broadcast message to a non-existent or inactive user
			sendInAppNotification("offline-user-999", "order.delivered", {
				orderId: "none",
			});

			expect(mockIoInstance.to).not.toHaveBeenCalled();
			expect(mockIoInstance.emit).not.toHaveBeenCalled();
		});

		it("should clean up the connected user memory registry map on client socket disconnect", () => {
			let capturedDisconnectHandler: Function = () => {};

			const mockSocket = {
				id: "socket-session-to-drop",
				handshake: {
					query: { userId: "leaving-user-111" },
				},
				on: jest
					.fn()
					.mockImplementation((event: string, handler: Function) => {
						if (event === "disconnect") {
							capturedDisconnectHandler = handler;
						}
					}),
			};

			// Connect user
			capturedConnectionHandler(mockSocket);

			// Reset mocking tracking histories
			mockIoInstance.to.mockClear();
			mockIoInstance.emit.mockClear();

			// Trigger the socket connection loss event loop execution
			capturedDisconnectHandler();

			// Try sending a message to the disconnected user profile
			sendInAppNotification("leaving-user-111", "ping", {
				message: "hello",
			});

			// Ensure no transmission was attempted since memory was cleared out
			expect(mockIoInstance.to).not.toHaveBeenCalled();
			expect(mockIoInstance.emit).not.toHaveBeenCalled();
		});

		it("should handle anonymous connections missing query parameter details gracefully without mapping memory", () => {
			const mockAnonymousSocket = {
				id: "anon-socket-id",
				handshake: { query: {} }, // Missing userId
				on: jest.fn(),
			};

			// Connect anonymous socket
			capturedConnectionHandler(mockAnonymousSocket);

			mockIoInstance.to.mockClear();

			// Attempting to notify should yield no side-effects
			sendInAppNotification(undefined as any, "global", {});
			expect(mockIoInstance.to).not.toHaveBeenCalled();
		});
	});
});
