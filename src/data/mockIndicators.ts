import type { SocioEconomicIndicator } from "@/types/geo";

/**
 * Demo socio-economic / ESG indicators for packet 24g.
 * Seeded on a few ZA pack places until Stats SA ingest lands in the geo JSON.
 */
export const mockIndicators: SocioEconomicIndicator[] = [
  {
    placeId: "za-gp",
    key: "unemployment_rate",
    label: "Unemployment rate",
    value: 34.2,
    unit: "%",
    year: 2024,
    source: "Stats SA QLFS (demo)",
    countryCode: "ZA",
  },
  {
    placeId: "za-gp",
    key: "households_piped_water",
    label: "Households with piped water",
    value: 88.1,
    unit: "%",
    year: 2022,
    source: "Census / CS (demo)",
    countryCode: "ZA",
  },
  {
    placeId: "za-gp",
    key: "youth_neet",
    label: "Youth NEET (15–24)",
    value: 42.5,
    unit: "%",
    year: 2024,
    source: "Stats SA (demo)",
    countryCode: "ZA",
  },
  {
    placeId: "za-muni-jhb",
    key: "unemployment_rate",
    label: "Unemployment rate",
    value: 36.8,
    unit: "%",
    year: 2024,
    source: "Stats SA QLFS (demo)",
    countryCode: "ZA",
  },
  {
    placeId: "za-muni-jhb",
    key: "households_electricity",
    label: "Households with electricity",
    value: 91.4,
    unit: "%",
    year: 2022,
    source: "Census / CS (demo)",
    countryCode: "ZA",
  },
  {
    placeId: "za-muni-jhb",
    key: "grievance_density",
    label: "Open grievances per 10k HH (desk)",
    value: 4.2,
    unit: "per 10k",
    year: 2026,
    source: "TrustLedger desk (demo)",
    countryCode: "ZA",
  },
  {
    placeId: "za-muni-cpt",
    key: "unemployment_rate",
    label: "Unemployment rate",
    value: 27.9,
    unit: "%",
    year: 2024,
    source: "Stats SA QLFS (demo)",
    countryCode: "ZA",
  },
  {
    placeId: "za-muni-cpt",
    key: "households_piped_water",
    label: "Households with piped water",
    value: 94.6,
    unit: "%",
    year: 2022,
    source: "Census / CS (demo)",
    countryCode: "ZA",
  },
  {
    placeId: "za-muni-cpt",
    key: "air_quality_days",
    label: "Good air-quality days (year)",
    value: 287,
    unit: "days",
    year: 2025,
    source: "City AQ (demo)",
    countryCode: "ZA",
  },
  {
    placeId: "za-muni-eth",
    key: "unemployment_rate",
    label: "Unemployment rate",
    value: 31.5,
    unit: "%",
    year: 2024,
    source: "Stats SA QLFS (demo)",
    countryCode: "ZA",
  },
  {
    placeId: "za-muni-eth",
    key: "informal_dwellings",
    label: "Informal dwellings share",
    value: 18.3,
    unit: "%",
    year: 2022,
    source: "Census / CS (demo)",
    countryCode: "ZA",
  },
  {
    placeId: "za-ec",
    key: "unemployment_rate",
    label: "Unemployment rate",
    value: 41.9,
    unit: "%",
    year: 2024,
    source: "Stats SA QLFS (demo)",
    countryCode: "ZA",
  },
  {
    placeId: "za-ec",
    key: "households_piped_water",
    label: "Households with piped water",
    value: 72.4,
    unit: "%",
    year: 2022,
    source: "Census / CS (demo)",
    countryCode: "ZA",
  },
];

/** Featured places that have demo indicators (for the intelligence picker). */
export const FEATURED_INDICATOR_PLACES = [
  { id: "za-gp", name: "Gauteng", level: "province" },
  { id: "za-ec", name: "Eastern Cape", level: "province" },
  {
    id: "za-muni-jhb",
    name: "City of Johannesburg Metropolitan Municipality",
    level: "metro",
  },
  {
    id: "za-muni-cpt",
    name: "City of Cape Town Metropolitan Municipality",
    level: "metro",
  },
  {
    id: "za-muni-eth",
    name: "Ethekwini Metropolitan Municipality",
    level: "metro",
  },
] as const;

/** @deprecated use FEATURED_INDICATOR_PLACES */
export const FEATURED_INDICATOR_PLACE_IDS = FEATURED_INDICATOR_PLACES.map(
  (p) => p.id,
);
