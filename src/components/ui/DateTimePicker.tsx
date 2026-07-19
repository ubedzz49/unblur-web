"use client";

import { useMemo, useState } from "react";
import styles from "./DateTimePicker.module.css";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MINUTE_STEPS = [0, 15, 30, 45];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// builds the calendar grid for a given month, padded with leading blanks so the
// 1st lands on its real weekday column
function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
  return cells;
}

interface DateTimePickerProps {
  label: string;
  value: string; // ISO string, or "" when nothing picked yet
  onChange: (iso: string) => void;
  error?: string;
}

export function DateTimePicker({ label, value, onChange, error }: DateTimePickerProps) {
  const parsedValue = value ? new Date(value) : null;
  const selectedDate = parsedValue && !Number.isNaN(parsedValue.getTime()) ? parsedValue : null;

  const today = useMemo(() => startOfDay(new Date()), []);
  const [viewYear, setViewYear] = useState(() => (selectedDate ?? today).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (selectedDate ?? today).getMonth());

  // default the clock to noon rather than the current minute -- avoids landing on an
  // already-past time the moment the user picks "today"
  const hour = selectedDate ? selectedDate.getHours() : 12;
  const minute = selectedDate ? selectedDate.getMinutes() : 0;

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  // first day of the viewed month, used to gate the "prev month" button so you can't
  // navigate to a month that's entirely in the past
  const viewIsCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  function combine(date: Date, h: number, m: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0, 0);
  }

  function selectDay(day: Date) {
    onChange(combine(day, hour, minute).toISOString());
  }

  function changeHour(newHour: number) {
    onChange(combine(selectedDate ?? today, newHour, minute).toISOString());
  }

  function changeMinute(newMinute: number) {
    onChange(combine(selectedDate ?? today, hour, newMinute).toISOString());
  }

  function goPrevMonth() {
    if (viewIsCurrentMonth) return;
    const prev = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(prev.getFullYear());
    setViewMonth(prev.getMonth());
  }

  function goNextMonth() {
    const next = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  return (
    <div className={styles.wrap} data-testid={`dtp-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <span className={styles.label}>{label}</span>

      <div>
        <div className={styles.calendarHeader}>
          <button
            type="button"
            className={styles.navButton}
            onClick={goPrevMonth}
            disabled={viewIsCurrentMonth}
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className={styles.monthLabel}>{monthLabel}</span>
          <button type="button" className={styles.navButton} onClick={goNextMonth} aria-label="Next month">
            ›
          </button>
        </div>

        <div className={styles.weekdayRow}>
          {WEEKDAYS.map((wd, i) => (
            <span key={i} className={styles.weekday}>
              {wd}
            </span>
          ))}
        </div>

        <div className={styles.dayGrid}>
          {grid.map((day, i) => {
            if (!day) return <span key={i} />;
            const isPast = day.getTime() < today.getTime();
            const isSelected = selectedDate !== null && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, today);
            return (
              <button
                key={i}
                type="button"
                className={styles.dayCell}
                disabled={isPast}
                data-selected={isSelected}
                data-today={isToday}
                data-testid="dtp-day"
                aria-label={day.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                aria-pressed={isSelected}
                onClick={() => selectDay(day)}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.timeRow}>
        <select
          aria-label={`${label} hour`}
          className={styles.timeSelect}
          value={hour}
          onChange={(e) => changeHour(Number(e.target.value))}
        >
          {Array.from({ length: 24 }, (_, h) => (
            <option key={h} value={h}>
              {String(h).padStart(2, "0")}
            </option>
          ))}
        </select>
        <span className={styles.timeSeparator}>:</span>
        <select
          aria-label={`${label} minute`}
          className={styles.timeSelect}
          value={minute}
          onChange={(e) => changeMinute(Number(e.target.value))}
        >
          {MINUTE_STEPS.map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, "0")}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p style={{ color: "var(--error, #c0392b)", fontSize: 13 }}>{error}</p>
      )}
    </div>
  );
}
