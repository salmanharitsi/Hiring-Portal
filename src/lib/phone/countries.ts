export type Country = {
  iso2: string;      
  name: string;      
  dial: string;      
};

export const COUNTRIES: Country[] = [
  { iso2: "ID", name: "Indonesia", dial: "+62" },
  { iso2: "MY", name: "Malaysia", dial: "+60" },
  { iso2: "SG", name: "Singapore", dial: "+65" },
  { iso2: "US", name: "United States", dial: "+1" },
  { iso2: "GB", name: "United Kingdom", dial: "+44" },
  { iso2: "AU", name: "Australia", dial: "+61" },
  { iso2: "JP", name: "Japan", dial: "+81" },
  { iso2: "PH", name: "Philippines", dial: "+63" },
  { iso2: "IN", name: "India", dial: "+91" },
  { iso2: "PL", name: "Poland", dial: "+48" },
  { iso2: "PS", name: "Palestine", dial: "+970" },
  { iso2: "PT", name: "Portugal", dial: "+351" },
  { iso2: "PR", name: "Puerto Rico", dial: "+1" },
].sort((a, b) => a.name.localeCompare(b.name));

export function flagEmoji(iso2: string) {
  return iso2
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export function getFlagUrl(iso2: string): string {
  return `https://flagcdn.com/w40/${iso2.toLowerCase()}.png`;
}

export function getFlagUrlAlt(iso2: string): string {
  return `https://purecatamphetamine.github.io/country-flag-icons/3x2/${iso2.toUpperCase()}.svg`;
}