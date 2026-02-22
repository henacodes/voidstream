export const parsePercent = (line: string) => {
  const match = line.match(/(\d+\.\d+)%/);
  return match ? parseFloat(match[1]) : null;
};
