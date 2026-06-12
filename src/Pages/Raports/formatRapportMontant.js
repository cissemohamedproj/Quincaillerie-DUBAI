/**
 * Formate un montant pour l'affichage sur la page Rapports uniquement.
 * Limite à 2 décimales — n'altère pas la valeur source ni les calculs serveur.
 */
export const formatRapportMontant = (number) => {
  if (number == null || Number.isNaN(Number(number))) {
    return '0.00';
  }

  const num = Number(number);
  const fixed = num.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return `${formattedInt}.${decPart}`;
};

/**
 * Callback Chart.js — axe Y et infobulles à 2 décimales (affichage seulement).
 */
export const formatRapportChartValue = (value) => {
  if (value == null || Number.isNaN(Number(value))) {
    return '0.00';
  }
  return Number(value).toFixed(2);
};
