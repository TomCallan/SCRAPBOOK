export const cosineSimilarity = (a: number[], b: number[]) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const getSmoothPath = (points: { x: number, y: number }[]) => {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }
  return path;
};

export const BOOK_COLORS = [
  'bg-stone-300',
  'bg-red-400',
  'bg-orange-400',
  'bg-amber-400',
  'bg-emerald-400',
  'bg-cyan-400',
  'bg-blue-400',
  'bg-indigo-400',
  'bg-fuchsia-400',
  'bg-rose-400'
];
