export type Box = { minX: number; minY: number; maxX: number; maxY: number };

export type FrameRoom = {
  /** Screen-space room the map can use: right of the signal slots, below the header. */
  left: number;
  top: number;
  right: number;
  bottom: number;
};

const MARGIN = 16;

function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high);
}

/**
 * How far to slide the map, in screen pixels, for a hovered group.
 * The group must sit inside the room, clear of the slots. Within that, the slide keeps every
 * main bubble out from under the slots and on screen when it can, and moves the group as
 * close to the center of the room as those limits allow. Vertically it moves only as far
 * as the group needs.
 */
export function hoverSlide(group: Box, mains: Box, room: FrameRoom): { dx: number; dy: number } {
  const groupLow = room.left + MARGIN - group.minX;
  const groupHigh = room.right - MARGIN - group.maxX;
  const mainsLow = room.left - mains.minX;
  const mainsHigh = room.right - mains.maxX;
  const toCenter = (room.left + room.right) / 2 - (group.minX + group.maxX) / 2;

  const low = Math.max(groupLow, mainsLow);
  const high = Math.min(groupHigh, mainsHigh);
  const dx =
    low <= high
      ? clamp(toCenter, low, high)
      : groupLow <= groupHigh
        ? clamp(0, groupLow, groupHigh)
        : groupLow;

  const topLow = room.top + MARGIN - group.minY;
  const bottomHigh = room.bottom - MARGIN - group.maxY;
  const dy = topLow <= bottomHigh ? clamp(0, topLow, bottomHigh) : topLow;
  return { dx: Math.round(dx), dy: Math.round(dy) };
}
