// calculate score BY ITEM from:
// average item accuracy, total item guesses, user accuracy
// base score let's just say is 1000
// judge based on user accuracy, but boost score if average accuracy is on the lower side
// formula: score = baseScore * (userAccuracy / averageItemAccuracy)

export function calculateScore(
  averageItemAccuracy: number,
  totalItemGuesses: number,
  userAccuracy: number,
  baseScore: number = 1000
) {
  const score = baseScore * (userAccuracy / averageItemAccuracy);
  return score;
}

// this might get more complex in the future
