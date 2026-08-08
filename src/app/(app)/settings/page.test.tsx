import { describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import SettingsPage from "./page";
import { renderWithProviders } from "@/test-utils";

const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
}));

describe("SettingsPage", () => {
  it("redirects to the merged profile dashboard", async () => {
    replaceMock.mockClear();
    renderWithProviders(<SettingsPage />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/profile"));
  });
});
