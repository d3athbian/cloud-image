import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StateSync } from "../../src/core/state-sync";

describe("StateSync", () => {
  let stateSync: StateSync;

  beforeEach(() => {
    stateSync = new StateSync({
      onSyncError: vi.fn(),
      maxRetries: 3,
    });
  });

  afterEach(() => {
    stateSync.destroy();
  });

  describe("init()", () => {
    it("should initialize without throwing in node environment", async () => {
      await stateSync.init();
      expect(typeof stateSync.isOnline()).toBe("boolean");
    });
  });

  describe("isOnline()", () => {
    it("should return online status as boolean", () => {
      const status = stateSync.isOnline();
      expect(typeof status).toBe("boolean");
    });
  });

  describe("destroy()", () => {
    it("should clean up without throwing", () => {
      expect(() => stateSync.destroy()).not.toThrow();
    });
  });

  describe("syncState()", () => {
    it("should not throw when called", async () => {
      await stateSync.init();
      await expect(
        stateSync.syncState("test", { value: 123 })
      ).resolves.not.toThrow();
    });
  });
});