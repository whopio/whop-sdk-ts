export function getRandomColor() {
  const crayonColors = [
    "#9B00FF", // vibrant purple
    "#00B140", // bright green
    "#FF0040", // hot pink
    "#0066FF", // electric blue
    "#FF2D55", // vivid raspberry
    "#00E5FF", // bright cyan
    "#FF6B35", // bright orange
    "#4D4DFF", // intense blue
    "#7FFF00", // lime green
    "#E100FF", // magenta
  ];

  return crayonColors[Math.floor(Math.random() * crayonColors.length)];
}
