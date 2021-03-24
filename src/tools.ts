export function range(lo: number, hi: number): number[] {
  const res = [];

  for (let n = lo; n < hi; n++) {
    res.push(n);
  }

  return res;
}
