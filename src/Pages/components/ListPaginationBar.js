import React from 'react';
import { Button } from 'reactstrap';

/**
 * Barre de pagination réutilisable — affichée EN HAUT de la liste (exigence UX).
 *
 * @param {number} page       — page courante (1-based)
 * @param {number} totalPages — nombre total de pages
 * @param {number} total      — nombre total d'éléments (pour affichage informatif)
 * @param {function} onPageChange — callback (newPage) appelé au clic Précédent/Suivant
 * @param {boolean} isLoading — désactive les boutons pendant le chargement
 */
export default function ListPaginationBar({
  page = 1,
  totalPages = 0,
  total = 0,
  onPageChange,
  isLoading = false,
}) {
  const safeTotalPages = totalPages > 0 ? totalPages : 0;
  const canGoPrev = !isLoading && page > 1;
  const canGoNext = !isLoading && safeTotalPages > 0 && page < safeTotalPages;

  return (
    <div className='d-flex flex-wrap gap-3 justify-content-between align-items-center mb-3 mt-2'>
      <p className='text-muted mb-0 font-size-14'>
        {total > 0 ? (
          <>
            <span className='fw-semibold'>{total}</span> élément
            {total > 1 ? 's' : ''} au total
          </>
        ) : (
          'Aucun élément'
        )}
      </p>

      <div className='d-flex gap-3 justify-content-end align-items-center'>
        <Button
          disabled={!canGoPrev}
          color='secondary'
          size='sm'
          onClick={() => onPageChange(page - 1)}
        >
          Précédent
        </Button>

        <p className='text-center mb-0 font-size-14'>
          Page <span className='text-primary fw-semibold'>{page}</span>
          {safeTotalPages > 0 && (
            <>
              {' '}
              sur <span className='text-info fw-semibold'>{safeTotalPages}</span>
            </>
          )}
        </p>

        <Button
          disabled={!canGoNext}
          color='primary'
          size='sm'
          onClick={() => onPageChange(page + 1)}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}
