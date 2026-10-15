import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import ExecuteModal from "./ExecuteModal";

import { renderWithProviders } from "../test/render";

describe("ExecuteModal", () => {
  it("renders title, text and buttons correctly", () => {
    const onClose = vi.fn();
    const onDelete = vi.fn();

    renderWithProviders(
      <ExecuteModal
        text="Message"
        onClose={onClose}
        btnText="Execute"
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText("Message")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Confirm Action" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Execute" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });

  it("calls onClose when clicked", async () => {
    const onClose = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <ExecuteModal
        text="Message"
        onClose={onClose}
        btnText="Execute"
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("calls onDelete when clicked", async () => {
    const onClose = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <ExecuteModal
        text="Message"
        onClose={onClose}
        btnText="Execute"
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Execute" }));

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
  });
});
