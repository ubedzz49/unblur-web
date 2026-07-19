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

const ME: api.UserProfile = {
  id: "user-1",
  email: "me@example.com",
  phone: null,
  name: "Me",
  photoUrl: null,
  bio: null,
  aiNotesAndTranscriptsEnabled: false,
  createdAt: new Date().toISOString(),
};

const MY_EXPERTISE = [
  {
    id: "entry-1",
    expertiseTypeId: "type-maths",
    expertiseTypeName: "Mathematics",
    expertiseLevelId: "level-eng",
    expertiseLevelName: "Engineering (B.Tech)",
  },
];

const doubt: api.Doubt = {
  id: "doubt-1",
  authorUserId: "user-2",
  title: "How do I solve this integral?",
  description: "Stuck on integrating x^2 sin(x) by parts twice.",
  expertiseLevelId: "level-eng",
  status: "open",
  autoDetected: false,
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
  resolvedAt: null,
  matchType: "exact",
};

const relatedDoubt: api.Doubt = {
  ...doubt,
  id: "doubt-2",
  title: "Semantically similar calculus question",
  matchType: "related",
};

const myOwnDoubt: api.Doubt = {
  ...doubt,
  id: "doubt-3",
  authorUserId: ME.id,
  title: "A doubt I posted myself",
};

function mockCommon() {
  vi.spyOn(api, "getMe").mockResolvedValue(ME);
  vi.spyOn(api, "getExpertiseOptions").mockResolvedValue([]);
}

describe("FeedPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    saveToken("test-token");
    mockCommon();
  });

  it("shows an empty state prompting to add expertise when the user has none", async () => {
    vi.spyOn(api, "getMyExpertise").mockResolvedValue([]);
    const feedSpy = vi.spyOn(api, "getFeed");

    renderWithProviders(<FeedPage />);

    expect(await screen.findByText(/add your expertise to see doubts/i)).toBeInTheDocument();
    expect(feedSpy).not.toHaveBeenCalled();
  });

  it("shows an empty feed state when expertise is tagged but no doubts match", async () => {
    vi.spyOn(api, "getMyExpertise").mockResolvedValue(MY_EXPERTISE);
    vi.spyOn(api, "getFeed").mockResolvedValue([]);

    renderWithProviders(<FeedPage />);

    expect(await screen.findByText(/no open doubts in your areas right now/i)).toBeInTheDocument();
  });

  it("renders exact and related doubts without a visible 'related' label", async () => {
    vi.spyOn(api, "getMyExpertise").mockResolvedValue(MY_EXPERTISE);
    vi.spyOn(api, "getFeed").mockResolvedValue([doubt, relatedDoubt]);

    renderWithProviders(<FeedPage />);

    expect(await screen.findByText(doubt.title)).toBeInTheDocument();
    expect(await screen.findByText(relatedDoubt.title)).toBeInTheDocument();
    // no standalone "Related" badge/label should render as its own element
    expect(screen.queryByText(/^related$/i)).not.toBeInTheDocument();
  });

  it("excludes the current user's own doubts from the Feed tab", async () => {
    vi.spyOn(api, "getMyExpertise").mockResolvedValue(MY_EXPERTISE);
    vi.spyOn(api, "getFeed").mockResolvedValue([doubt, myOwnDoubt]);

    renderWithProviders(<FeedPage />);

    expect(await screen.findByText(doubt.title)).toBeInTheDocument();
    expect(screen.queryByText(myOwnDoubt.title)).not.toBeInTheDocument();
  });

  it("shows the user's own doubts under the My doubts tab", async () => {
    vi.spyOn(api, "getMyExpertise").mockResolvedValue(MY_EXPERTISE);
    vi.spyOn(api, "getFeed").mockResolvedValue([doubt]);
    vi.spyOn(api, "getMyDoubts").mockResolvedValue([myOwnDoubt]);

    renderWithProviders(<FeedPage />);

    await screen.findByText(doubt.title);
    fireEvent.click(screen.getByRole("tab", { name: /my doubts/i }));

    expect(await screen.findByText(myOwnDoubt.title)).toBeInTheDocument();
    expect(screen.queryByText(doubt.title)).not.toBeInTheDocument();
  });

  it("shows a retry affordance on error and refetches on click", async () => {
    vi.spyOn(api, "getMyExpertise").mockResolvedValue(MY_EXPERTISE);
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
