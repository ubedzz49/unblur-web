import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DateTimePicker } from "./DateTimePicker";

describe("DateTimePicker", () => {
  it("disables every past day in the current month view", () => {
    render(<DateTimePicker label="Slot" value="" onChange={vi.fn()} />);

    const today = new Date();
    const days = screen.getAllByTestId("dtp-day");

    for (const day of days) {
      const dayNumber = Number(day.textContent);
      const cellDate = new Date(today.getFullYear(), today.getMonth(), dayNumber);
      if (cellDate.getTime() < new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) {
        expect(day).toBeDisabled();
      }
    }
  });

  it("never lets a click on a disabled past day produce a change", () => {
    const onChange = vi.fn();
    render(<DateTimePicker label="Slot" value="" onChange={onChange} />);

    const today = new Date();
    const days = screen.getAllByTestId("dtp-day");
    const pastDay = days.find((d) => {
      const n = Number(d.textContent);
      return new Date(today.getFullYear(), today.getMonth(), n).getTime() < today.setHours(0, 0, 0, 0);
    });

    if (pastDay) {
      fireEvent.click(pastDay);
      expect(onChange).not.toHaveBeenCalled();
    }
  });

  it("disables the 'previous month' button while viewing the current month", () => {
    render(<DateTimePicker label="Slot" value="" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /previous month/i })).toBeDisabled();
  });

  it("does not let you navigate to a month entirely in the past", () => {
    render(<DateTimePicker label="Slot" value="" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /next month/i }));
    fireEvent.click(screen.getByRole("button", { name: /previous month/i }));
    // back to the current month -- every day still enabled/disabled the same as before,
    // and prev is disabled again rather than having gone further back
    expect(screen.getByRole("button", { name: /previous month/i })).toBeDisabled();
  });

  it("calls onChange with a future ISO timestamp when a valid day is selected", () => {
    const onChange = vi.fn();
    render(<DateTimePicker label="Slot" value="" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /next month/i }));
    const days = screen.getAllByTestId("dtp-day");
    fireEvent.click(days[days.length - 1]);

    expect(onChange).toHaveBeenCalledTimes(1);
    const iso = onChange.mock.calls[0][0];
    expect(new Date(iso).getTime()).toBeGreaterThan(Date.now());
  });

  it("lets hour and minute selection move an already-picked date's time", () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    future.setHours(10, 0, 0, 0);
    const onChange = vi.fn();
    render(<DateTimePicker label="Slot" value={future.toISOString()} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/slot hour/i), { target: { value: "14" } });
    expect(new Date(onChange.mock.calls[0][0]).getHours()).toBe(14);

    fireEvent.change(screen.getByLabelText(/slot minute/i), { target: { value: "30" } });
    expect(new Date(onChange.mock.calls.at(-1)![0]).getMinutes()).toBe(30);
  });
});
