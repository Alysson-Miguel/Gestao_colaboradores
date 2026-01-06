export function formatDateBR(dateStr) {
  if (!dateStr) return "-";

  // espera YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss
  const [y, m, d] = dateStr.substring(0, 10).split("-");
  return `${d}/${m}/${y}`;
}
