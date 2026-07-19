import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { SingleExpertisePicker } from "./SingleExpertisePicker";
import { renderWithProviders } from "@/test-utils";
import * as api from "@/lib/api";
import { saveToken } from "@/lib/auth";

const options: api.ExpertiseTypeOption[] = [
  {
    id: "type-maths",
    type: "academic",
    name: "Mathematics",
    slug: "mathematics",
    levels: [{ id: "level-eng", name: "Engineering (B.Tech)", slug: "engineering" }],
  },
];

describe("SingleExpertisePicker", () => {
  beforeEach(() => {
    window.localStorage.clear();
    saveToken("test-token");
    vi.spyOn(api, "getExpertiseOptions").mockResolvedValue(options);
  });

  it("shows no dropdown when focused with an empty query", async () => {
    const onChange = vi.fn();
    renderWithProviders(<SingleExpertisePicker value={null} onChange={onChange} />);

    const search = await screen.findByLabelText(/search expertise/i);
    fireEvent.focus(search);

    expect(screen.queryByTestId("expertise-result")).not.toBeInTheDocument();
  });

  it("shows the dropdown once typing starts and selects a result", async () => {
    const onChange = vi.fn();
    renderWithProviders(<SingleExpertisePicker value={null} onChange={onChange} />);

    const search = await screen.findByLabelText(/search expertise/i);
    fireEvent.focus(search);
    fireEvent.change(search, { target: { value: "mathematics" } });

    const result = await screen.findByTestId("expertise-result");
    fireEvent.click(result);

    expect(onChange).toHaveBeenCalledWith({
      typeId: "type-maths",
      typeName: "Mathematics",
      levelId: "level-eng",
      levelName: "Engineering (B.Tech)",
    });
  });

  it("displays the selected value using the (Level) format", async () => {
    renderWithProviders(
      <SingleExpertisePicker
        value={{ typeId: "type-maths", typeName: "Mathematics", levelId: "level-eng", levelName: "Engineering (B.Tech)" }}
        onChange={vi.fn()}
      />,
    );

    expect(await screen.findByText("Mathematics (Engineering (B.Tech))")).toBeInTheDocument();
  });

  it("shows an add-new option with zero matches and splits subject/level from parentheses", async () => {
    vi.spyOn(api, "createCustomExpertise").mockResolvedValue({
      expertiseTypeId: "type-custom",
      expertiseLevelId: "level-custom",
      typeName: "Data Structures",
      levelName: "Engineering",
    });
    const onChange = vi.fn();

    renderWithProviders(<SingleExpertisePicker value={null} onChange={onChange} />);

    const search = await screen.findByLabelText(/search expertise/i);
    fireEvent.focus(search);
    fireEvent.change(search, { target: { value: "Data Structures (Engineering)" } });

    expect(screen.queryByTestId("expertise-result")).not.toBeInTheDocument();
    const addNew = await screen.findByTestId("add-new-expertise");
    fireEvent.click(addNew);

    await waitFor(() =>
      expect(api.createCustomExpertise).toHaveBeenCalledWith("test-token", "Data Structures", "Engineering"),
    );
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({
        typeId: "type-custom",
        typeName: "Data Structures",
        levelId: "level-custom",
        levelName: "Engineering",
      }),
    );
  });

  it("calls createCustomExpertise with only a subject name when there are no parentheses", async () => {
    vi.spyOn(api, "createCustomExpertise").mockResolvedValue({
      expertiseTypeId: "type-custom",
      expertiseLevelId: "level-custom",
      typeName: "Excel Macros",
      levelName: "General",
    });

    renderWithProviders(<SingleExpertisePicker value={null} onChange={vi.fn()} />);

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
