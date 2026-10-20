import { screen, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import ChangeWorkout from "./ChangeWorkout";

import { renderWithProviders } from "../test/render";

import { getWorkoutDetails } from "../services/workouts";
import { getProfile } from "../services/profiles";
import { getExercises } from "../services/exercises";

beforeEach(() => {
  localStorage.clear();
});

vi.mock("../services/workouts", () => ({
  getWorkoutDetails: vi.fn(),
  deleteWorkout: vi.fn(),
  updateWorkout: vi.fn(),
}));

vi.mock("../services/profiles", () => ({
  getProfile: vi.fn(),
}));

vi.mock("../services/exercises", () => ({
  getExercises: vi.fn(),
}));

vi.mock("../components/WorkoutForm", () => ({
  default: () => <div data-testid="mock-workout-form" />,
}));

describe("ChangeWorkout", () => {
  it("loads workout data properly", async () => {
    vi.mocked(getProfile).mockResolvedValue({ preferred_workout_unit: "kg" });
    vi.mocked(getWorkoutDetails).mockResolvedValue({
      id: "workout-123",
      user_id: "user-123",
      name: "Test Workout",
      started_at: "2026-10-14T10:00:00Z",
      finished_at: "2026-10-14T11:00:00Z",
      duration_seconds: 3600,
      created_at: "2026-10-14T11:00:00Z",
      workout_exercises: [],
    });
    vi.mocked(getExercises).mockResolvedValue([
      {
        id: "exercise-123",
        user_id: "user-123",
        name: "Test Exercise",
        category: "Chest",
        created_at: "",
      },
    ]);

    renderWithProviders(
      <MemoryRouter initialEntries={["/history/workout-123/edit"]}>
        <Routes>
          <Route path="/history/:workoutId/edit" element={<ChangeWorkout />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getWorkoutDetails).toHaveBeenCalledWith("workout-123");
    });
    expect(
      await screen.findByRole("heading", { name: "Test Workout" }),
    ).toBeInTheDocument();
  });
});
