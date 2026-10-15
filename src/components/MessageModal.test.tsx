import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import MessageModal from "./MessageModal";

import { renderWithProviders } from "../test/render";

describe("MessageModal", () => {
  it("renders title and text correctly", () => {
    const onClose = vi.fn();

    renderWithProviders(
      <MessageModal title="Title" text="Message" onClose={onClose} />,
    );

    expect(screen.getByRole("heading", { name: "Title" })).toBeInTheDocument();
    expect(screen.getByText("Message")).toBeInTheDocument();
  });

  it("calls onClose when clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <MessageModal title="Title" text="Message" onClose={onClose} />,
    );

    await user.click(screen.getByRole("button", { name: "Ok" }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
