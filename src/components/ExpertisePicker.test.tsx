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

  it("shows no dropdown when focused with an empty query", async () => {
    vi.spyOn(api, "getMyExpertise").mockResolvedValue([]);

    renderWithProviders(<ExpertisePicker />);

    expect(await screen.findByText(/no expertise added yet/i)).toBeInTheDocument();

    const search = screen.getByLabelText(/search expertise/i);
    fireEvent.focus(search);

    expect(screen.queryByTestId("expertise-result")).not.toBeInTheDocument();
    expect(screen.queryByText(/no matches/i)).not.toBeInTheDocument();
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
    expect(await screen.findByText(/Mathematics \(Engineering \(B\.Tech\)\)/)).toBeInTheDocument();

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
    fireEvent.click(await screen.findByRole("button", { name: /remove cat \(quant\)/i }));

    await waitFor(() => expect(api.removeMyExpertise).toHaveBeenCalledWith("test-token", "entry-1"));
  });

  it("shows an add-new option when there are zero matches, and splits subject/level from parentheses", async () => {
    vi.spyOn(api, "getMyExpertise").mockResolvedValue([]);
    vi.spyOn(api, "createCustomExpertise").mockResolvedValue({
      expertiseTypeId: "type-custom",
      expertiseLevelId: "level-custom",
      typeName: "Data Structures",
      levelName: "Engineering",
    });
    vi.spyOn(api, "addMyExpertise").mockResolvedValue({
      id: "entry-custom",
      expertiseTypeId: "type-custom",
      expertiseTypeName: "Data Structures",
      expertiseLevelId: "level-custom",
      expertiseLevelName: "Engineering",
    });

    renderWithProviders(<ExpertisePicker />);

    const search = await screen.findByLabelText(/search expertise/i);
    fireEvent.focus(search);
    fireEvent.change(search, { target: { value: "Data Structures (Engineering)" } });

    expect(screen.queryByTestId("expertise-result")).not.toBeInTheDocument();
    const addNew = await screen.findByTestId("add-new-expertise");
    expect(addNew).toHaveTextContent(/add "data structures \(engineering\)" as a new subject/i);
    fireEvent.click(addNew);

    await waitFor(() =>
      expect(api.createCustomExpertise).toHaveBeenCalledWith("test-token", "Data Structures", "Engineering"),
    );
    await waitFor(() =>
      expect(api.addMyExpertise).toHaveBeenCalledWith("test-token", "type-custom", "level-custom"),
    );
  });

  it("calls createCustomExpertise with only a subject name when there are no parentheses", async () => {
    vi.spyOn(api, "getMyExpertise").mockResolvedValue([]);
    vi.spyOn(api, "createCustomExpertise").mockResolvedValue({
      expertiseTypeId: "type-custom",
      expertiseLevelId: "level-custom",
      typeName: "Excel Macros",
      levelName: "General",
    });
    vi.spyOn(api, "addMyExpertise").mockResolvedValue({
      id: "entry-custom",
      expertiseTypeId: "type-custom",
      expertiseTypeName: "Excel Macros",
      expertiseLevelId: "level-custom",
      expertiseLevelName: "General",
    });

    renderWithProviders(<ExpertisePicker />);

    const search = await screen.findByLabelText(/search expertise/i);
    fireEvent.focus(search);
    fireEvent.change(search, { target: { value: "Excel Macros" } });

    const addNew = await screen.findByTestId("add-new-expertise");
    fireEvent.click(addNew);

    await waitFor(() =>
      expect(api.createCustomExpertise).toHaveBeenCalledWith("test-token", "Excel Macros", undefined),
    );
  });
});
