const CURRENCY_BY_COUNTRY: Record<string, string> = {
  au: "AUD",
  at: "EUR",
  be: "EUR",
  br: "BRL",
  ca: "CAD",
  ch: "CHF",
  de: "EUR",
  es: "EUR",
  fr: "EUR",
  gb: "GBP",
  in: "INR",
  it: "EUR",
  mx: "MXN",
  nl: "EUR",
  nz: "NZD",
  pl: "PLN",
  sg: "SGD",
  us: "USD",
  za: "ZAR",
};

export function currencyForCountry(country: string): string {
  return CURRENCY_BY_COUNTRY[country.toLowerCase()] ?? "USD";
}

function formatLakh(amount: number): string {
  return String(Number((amount / 100_000).toFixed(1)));
}

export function formatAnnualSalary(amount: number, currency: string): string {
  if (currency === "INR") return `₹${formatLakh(amount)}L`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatAnnualSalaryRange(min: number, max: number, currency: string): string {
  if (currency === "INR") {
    return `₹${formatLakh(min)}–${formatLakh(max)} LPA`;
  }
  return `${formatAnnualSalary(min, currency)} – ${formatAnnualSalary(max, currency)}`;
}
