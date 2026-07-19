import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { ExpertisePicker } from "./ExpertisePicker";
import { renderWithProviders } from "@/test-utils";
import * as api from "@/lib/api";
import { saveToken } from "@/lib/auth";

const options: api.ExpertiseTypeOption[] = [
  {
    id: "type-maths",
    type: "academic",
    name: "Mathematics",
    slug: "mathematics",
    levels: [
      { id: "level-12", name: "Higher Secondary — Science", slug: "hs-science" },
      { id: "level-eng", name: "Engineering (B.Tech)", slug: "engineering" },
    ],
  },
  {
    id: "type-cat",
    type: "competitive",
    name: "CAT",
    slug: "cat-exam",
    levels: [{ id: "level-quant", name: "Quant", slug: "quant" }],
  },
];

describe("ExpertisePicker", () => {
  beforeEach(() => {
    window.localStorage.clear();
    saveToken("test-token");
    vi.spyOn(api, "getExpertiseOptions").mockResolvedValue(options);
  });

  it("shows an empty state, then searching and picking a result adds it", async () => {
    vi.spyOn(api, "getMyExpertise").mockResolvedValue([]);
    vi.spyOn(api, "addMyExpertise").mockResolvedValue({
      id: "entry-1",
      expertiseTypeId: "type-maths",
      expertiseTypeName: "Mathematics",
      expertiseLevelId: "level-eng",
      expertiseLevelName: "Engineering (B.Tech)",
    });

    renderWithProviders(<ExpertisePicker />);

    expect(await screen.findByText(/no expertise added yet/i)).toBeInTheDocument();

    const search = screen.getByLabelText(/search expertise/i);
    fireEvent.focus(search);
    fireEvent.change(search, { target: { value: "engineering" } });

    const result = await screen.findByTestId("expertise-result");
    expect(result).toHaveTextContent(/mathematics/i);
    expect(result).toHaveTextContent(/engineering/i);
    fireEvent.click(result);

    await waitFor(() =>
      expect(api.addMyExpertise).toHaveBeenCalledWith("test-token", "type-maths", "level-eng"),
    );
  });

  it("does not show an already-added level in search results", async () => {
    vi.spyOn(api, "getMyExpertise").mockResolvedValue([
      {
        id: "entry-1",
        expertiseTypeId: "type-maths",
        expertiseTypeName: "Mathematics",
        expertiseLevelId: "level-eng",
        expertiseLevelName: "Engineering (B.Tech)",
      },
    ]);

    renderWithProviders(<ExpertisePicker />);
    expect(await screen.findByText(/Mathematics — Engineering \(B\.Tech\)/)).toBeInTheDocument();

    const search = screen.getByLabelText(/search expertise/i);
    fireEvent.focus(search);
    fireEvent.change(search, { target: { value: "mathematics" } });

    const resultButtons = await screen.findAllByTestId("expertise-result");
    expect(resultButtons).toHaveLength(1);
    expect(resultButtons[0]).toHaveTextContent(/higher secondary/i);
  });

  it("removes an existing entry", async () => {
    vi.spyOn(api, "getMyExpertise").mockResolvedValue([
      {
        id: "entry-1",
        expertiseTypeId: "type-cat",
        expertiseTypeName: "CAT",
        expertiseLevelId: "level-quant",
        expertiseLevelName: "Quant",
      },
    ]);
    vi.spyOn(api, "removeMyExpertise").mockResolvedValue(undefined);

    renderWithProviders(<ExpertisePicker />);
    fireEvent.click(await screen.findByRole("button", { name: /remove cat — quant/i }));

    await waitFor(() => expect(api.removeMyExpertise).toHaveBeenCalledWith("test-token", "entry-1"));
  });
});
