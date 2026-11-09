import rates from '../../data/ca/2026/jurisdictions.json';

export const canadianRegions = rates.jurisdictions.map(region => ({
  ...region,
  slug: region.name.toLowerCase().replaceAll(' ', '-'),
}));
