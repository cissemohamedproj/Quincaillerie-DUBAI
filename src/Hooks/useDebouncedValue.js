import { useEffect, useState } from 'react';

/**
 * Retarde la mise à jour d'une valeur (ex : champ de recherche).
 * Évite d'appeler l'API à chaque frappe — une requête seulement
 * après `delay` ms sans nouvelle saisie.
 *
 * @param {any} value  — valeur instantanée (searchTerm)
 * @param {number} delay — délai en ms (400 par défaut)
 */
export default function useDebouncedValue(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
