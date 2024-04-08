export const convertToClockFormat = (durationInSeconds: number) => {
  // Convert duration to minutes and seconds
  const totalMinutes = Math.floor(durationInSeconds / 60); // Get total minutes
  const remainingSeconds = Math.round(durationInSeconds % 60); // Get remaining seconds

  // Format the result as "MM:SS"
  const formattedDuration = `${totalMinutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;

  return formattedDuration;
};
