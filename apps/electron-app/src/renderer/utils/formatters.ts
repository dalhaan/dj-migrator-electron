export const currencyFormatter = new Intl.NumberFormat("en-NZ", {
  style: "currency",
  currency: "NZD",
});

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const s = Math.floor(seconds - minutes * 60);

  return `${minutes}:${s.toLocaleString("en-NZ", {
    minimumIntegerDigits: 2,
    useGrouping: false,
  })}`;
}
