import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import FeedPage from "./page";
import { renderWithProviders } from "@/test-utils";
import * as api from "@/lib/api";
import { saveToken } from "@/lib/auth";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/feed",
}));

const doubt: api.Doubt = {
  id: "doubt-1",
  authorUserId: "user-2",
  title: "How do I solve this integral?",
  description: "Stuck on integrating x^2 sin(x) by parts twice.",
  expertiseLevelId: "level-eng",
  status: "open",
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
  resolvedAt: null,
  matchType: "exact",
};

const relatedDoubt: api.Doubt = {
  ...doubt,
  id: "doubt-2",
  title: "Related calculus question",
  matchType: "related",
};

describe("FeedPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    saveToken("test-token");
  });

  it("shows an empty state prompting to add expertise when the user has none", async () => {
    vi.spyOn(api, "getMyExpertise").mockResolvedValue([]);
    const feedSpy = vi.spyOn(api, "getFeed");

    renderWithProviders(<FeedPage />);

    expect(await screen.findByText(/add your expertise to see doubts/i)).toBeInTheDocument();
    expect(feedSpy).not.toHaveBeenCalled();
  });

  it("shows an empty feed state when expertise is tagged but no doubts match", async () => {
    vi.spyOn(api, "getMyExpertise").mockResolvedValue([
      {
        id: "entry-1",
        expertiseTypeId: "type-maths",
        expertiseTypeName: "Mathematics",
        expertiseLevelId: "level-eng",
        expertiseLevelName: "Engineering (B.Tech)",
      },
    ]);
    vi.spyOn(api, "getFeed").mockResolvedValue([]);

    renderWithProviders(<FeedPage />);

    expect(await screen.findByText(/no open doubts in your areas right now/i)).toBeInTheDocument();
  });

  it("renders exact and related doubts, with a badge distinguishing related ones", async () => {
    vi.spyOn(api, "getMyExpertise").mockResolvedValue([
      {
        id: "entry-1",
        expertiseTypeId: "type-maths",
        expertiseTypeName: "Mathematics",
        expertiseLevelId: "level-eng",
        expertiseLevelName: "Engineering (B.Tech)",
      },
    ]);
    vi.spyOn(api, "getFeed").mockResolvedValue([doubt, relatedDoubt]);

    renderWithProviders(<FeedPage />);

    expect(await screen.findByText(doubt.title)).toBeInTheDocument();
    expect(await screen.findByText(relatedDoubt.title)).toBeInTheDocument();
    expect(screen.getAllByText(/related/i).length).toBeGreaterThan(0);
  });

  it("shows a retry affordance on error and refetches on click", async () => {
    vi.spyOn(api, "getMyExpertise").mockResolvedValue([
      {
        id: "entry-1",
        expertiseTypeId: "type-maths",
        expertiseTypeName: "Mathematics",
        expertiseLevelId: "level-eng",
        expertiseLevelName: "Engineering (B.Tech)",
      },
    ]);
    const feedSpy = vi
      .spyOn(api, "getFeed")
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce([doubt]);

    renderWithProviders(<FeedPage />);

    const retryButton = await screen.findByRole("button", { name: /try again/i });
    fireEvent.click(retryButton);

    await waitFor(() => expect(feedSpy).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(doubt.title)).toBeInTheDocument();
  });
});
