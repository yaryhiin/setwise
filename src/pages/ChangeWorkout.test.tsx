import { screen, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import ChangeWorkout from "./ChangeWorkout";

import { renderWithProviders } from "../test/render";

import {
  deleteWorkout,
  getWorkoutDetails,
  updateWorkout,
} from "../services/workouts";
import { getProfile } from "../services/profiles";
import { getExercises } from "../services/exercises";
import userEvent from "@testing-library/user-event";

const mockWorkout = {
  id: "workout-123",
  user_id: "user-123",
  name: "Test Workout",
  started_at: "2026-10-14T10:00:00Z",
  finished_at: "2026-10-14T11:00:00Z",
  duration_seconds: 3600,
  created_at: "2026-10-14T11:00:00Z",
  workout_exercises: [],
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
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
  default: ({ handleUpdate }: { handleUpdate: () => void }) => (
    <button onClick={handleUpdate}>Save</button>
  ),
}));

describe("ChangeWorkout", () => {
  it("loads workout data properly", async () => {
    vi.mocked(getProfile).mockResolvedValue({ preferred_workout_unit: "kg" });
    vi.mocked(getWorkoutDetails).mockResolvedValue(mockWorkout);
    vi.mocked(getExercises).mockResolvedValue([]);

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

  it.each([
    {
      scenario: "profile loading fails",
      profile: null,
      workout: mockWorkout,
      error: "",
    },
    {
      scenario: "workout loading fails",
      profile: { preferred_workout_unit: "kg" },
      workout: null,
      error: "",
    },
    {
      scenario: "workout service throws an error",
      profile: { preferred_workout_unit: "kg" },
      workout: null,
      error: "workout",
    },
    {
      scenario: "profile service throws an error",
      profile: null,
      workout: mockWorkout,
      error: "profile",
    },
  ])("handles $scenario correctly", async ({ profile, workout, error }) => {
    vi.mocked(getProfile).mockResolvedValue(profile);
    vi.mocked(getWorkoutDetails).mockResolvedValue(workout);
    vi.mocked(getExercises).mockResolvedValue([]);

    if (error === "workout") {
      vi.mocked(getWorkoutDetails).mockRejectedValue(
        new Error("Failed to fetch workout"),
      );
    } else if (error === "profile") {
      vi.mocked(getProfile).mockRejectedValue(
        new Error("Failed to fetch profile"),
      );
    }

    renderWithProviders(
      <MemoryRouter initialEntries={["/history/workout-123/edit"]}>
        <Routes>
          <Route path="/history/:workoutId/edit" element={<ChangeWorkout />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(
        "Something went wrong while loading your workout. Please try again.",
      ),
    ).toBeInTheDocument();
  });

  it("retry refetches workut data correctly", async () => {
    vi.mocked(getProfile).mockResolvedValue({ preferred_workout_unit: "kg" });
    vi.mocked(getWorkoutDetails)
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(mockWorkout);
    vi.mocked(getExercises).mockResolvedValue([]);

    renderWithProviders(
      <MemoryRouter initialEntries={["/history/workout-123/edit"]}>
        <Routes>
          <Route path="/history/:workoutId/edit" element={<ChangeWorkout />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(
        "Something went wrong while loading your workout. Please try again.",
      ),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(getWorkoutDetails).toHaveBeenCalledTimes(2);
    });
    expect(
      await screen.findByRole("heading", { name: "Test Workout" }),
    ).toBeInTheDocument();
  });

  it("saves workout correctly", async () => {
    vi.mocked(getProfile).mockResolvedValue({ preferred_workout_unit: "kg" });
    vi.mocked(getWorkoutDetails).mockResolvedValue(mockWorkout);
    vi.mocked(getExercises).mockResolvedValue([]);
    vi.mocked(updateWorkout).mockResolvedValue(undefined);

    renderWithProviders(
      <MemoryRouter initialEntries={["/history/workout-123/edit"]}>
        <Routes>
          <Route path="/history/:workoutId/edit" element={<ChangeWorkout />} />
        </Routes>
      </MemoryRouter>,
    );

    const saveBtn = await screen.findByRole("button", { name: "Save" });

    await userEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateWorkout).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test Workout",
        }),
        "workout-123",
      );
    });
  });

  it("deletes workout correctly", async () => {
    vi.mocked(getProfile).mockResolvedValue({ preferred_workout_unit: "kg" });
    vi.mocked(getWorkoutDetails).mockResolvedValue(mockWorkout);
    vi.mocked(getExercises).mockResolvedValue([]);
    vi.mocked(deleteWorkout).mockResolvedValue(true);

    renderWithProviders(
      <MemoryRouter initialEntries={["/history/workout-123/edit"]}>
        <Routes>
          <Route path="/history/:workoutId/edit" element={<ChangeWorkout />} />
        </Routes>
      </MemoryRouter>,
    );

    const deleteBtn = await screen.findByRole("button", { name: "Delete" });

    await userEvent.click(deleteBtn);

    expect(
      await screen.findByText(/Are you sure you want to delete this workout\?/),
    ).toBeInTheDocument();

    const modalDeleteBtn = await screen.findAllByRole("button", {
      name: "Delete",
    });

    await userEvent.click(modalDeleteBtn[1]);

    await waitFor(() => {
      expect(deleteWorkout).toHaveBeenCalledWith("workout-123");
    });
  });

  it("closes delete workout modal correctly", async () => {
    vi.mocked(getProfile).mockResolvedValue({ preferred_workout_unit: "kg" });
    vi.mocked(getWorkoutDetails).mockResolvedValue(mockWorkout);
    vi.mocked(getExercises).mockResolvedValue([]);

    renderWithProviders(
      <MemoryRouter initialEntries={["/history/workout-123/edit"]}>
        <Routes>
          <Route path="/history/:workoutId/edit" element={<ChangeWorkout />} />
        </Routes>
      </MemoryRouter>,
    );

    const deleteBtn = await screen.findByRole("button", { name: "Delete" });

    await userEvent.click(deleteBtn);

    expect(
      await screen.findByText(/Are you sure you want to delete this workout\?/),
    ).toBeInTheDocument();

    const modalDeleteBtn = await screen.findAllByRole("button", {
      name: "Back",
    });

    await userEvent.click(modalDeleteBtn[1]);

    expect(deleteWorkout).not.toHaveBeenCalled();
  });
});
