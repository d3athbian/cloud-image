import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventInterceptor } from "../../src/core/event-interceptor";

describe("EventInterceptor", () => {
  let mockLogger: { error: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn> };
  let interceptor: EventInterceptor;

  beforeEach(() => {
    mockLogger = {
      error: vi.fn(),
      warn: vi.fn(),
    };
    interceptor = new EventInterceptor({
      moduleName: "TestModule",
      logger: mockLogger as never,
    });
  });

  afterEach(() => {
    interceptor.destroy();
  });

  describe("on()", () => {
    it("should register event listener", () => {
      const handler = vi.fn();
      interceptor.on(window, "online", "handleOnline", handler);

      window.dispatchEvent(new Event("online"));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should catch sync errors and log them", () => {
      const errorHandler = vi.fn(() => {
        throw new Error("test error");
      });
      interceptor.on(window, "online", "handleOnline", errorHandler);

      window.dispatchEvent(new Event("online"));
      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("should catch async errors and log them", async () => {
      const asyncHandler = vi.fn(() => {
        return Promise.reject(new Error("async error"));
      });
      interceptor.on(window, "online", "handleOnline", asyncHandler);

      window.dispatchEvent(new Event("online"));
      await new Promise((r) => setTimeout(r, 10));
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("off()", () => {
    it("should remove event listener", () => {
      const handler = vi.fn();
      interceptor.on(window, "online", "handleOnline", handler);
      interceptor.off(window, "online", handler);

      window.dispatchEvent(new Event("online"));
      expect(handler).toHaveBeenCalledTimes(0);
    });
  });

  describe("destroy()", () => {
    it("should remove all listeners", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      interceptor.on(window, "online", "handleOnline", handler1);
      interceptor.on(window, "offline", "handleOffline", handler2);
      interceptor.destroy();

      window.dispatchEvent(new Event("online"));
      window.dispatchEvent(new Event("offline"));
      expect(handler1).toHaveBeenCalledTimes(0);
      expect(handler2).toHaveBeenCalledTimes(0);
    });
  });
});