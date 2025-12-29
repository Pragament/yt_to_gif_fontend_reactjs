export function computeOverlayScale(videoDimensions, containerRect) {
  if (!videoDimensions.width || !videoDimensions.height || !containerRect) {
    return { scaleX: 1, scaleY: 1 };
  }

  const scaleX = containerRect.width / videoDimensions.width;
  const scaleY = containerRect.height / videoDimensions.height;

  return { scaleX, scaleY };
}


