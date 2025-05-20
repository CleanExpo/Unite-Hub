import type React from "react"
// Simple utility functions for drag and drop functionality
export function handleDragStart(e: React.DragEvent, itemId: string) {
  e.dataTransfer.setData("text/plain", itemId)
  e.dataTransfer.effectAllowed = "move"

  // Add a class to the dragged element for styling
  if (e.currentTarget instanceof HTMLElement) {
    setTimeout(() => {
      e.currentTarget.classList.add("dragging")
    }, 0)
  }
}

export function handleDragEnd(e: React.DragEvent) {
  // Remove the dragging class
  if (e.currentTarget instanceof HTMLElement) {
    e.currentTarget.classList.remove("dragging")
  }
}

export function handleDragOver(e: React.DragEvent) {
  e.preventDefault()
  e.dataTransfer.dropEffect = "move"

  // Add a class to the target column for styling
  if (e.currentTarget instanceof HTMLElement) {
    e.currentTarget.classList.add("drag-over")
  }
}

export function handleDragLeave(e: React.DragEvent) {
  // Remove the drag-over class
  if (e.currentTarget instanceof HTMLElement) {
    e.currentTarget.classList.remove("drag-over")
  }
}
