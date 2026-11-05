import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("visible text", () => {
  it("shows the Pipe Flyer name in the rendered output", () => {
    render(<App />);
    expect(screen.getAllByText("Pipe Flyer").length).toBeGreaterThan(0);
  });

  it("does not show the old Flappy Bird trade dress", () => {
    render(<App />);
    expect(document.body.textContent ?? "").not.toMatch(/flappy/i);
  });
});

describe("keyboard start", () => {
  it("starts the game with Space from the start screen", () => {
    render(<App />);
    expect(screen.getByText("Start flying")).toBeInTheDocument();
    fireEvent.keyDown(window, { code: "Space" });
    expect(screen.queryByText("Start flying")).not.toBeInTheDocument();
  });
});
