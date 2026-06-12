import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, CardBody, Col, Container, Row } from 'reactstrap';
import Breadcrumbs from '../../components/Common/Breadcrumb';
import FormModal from '../components/FormModal';
import LoadingSpiner from '../components/LoadingSpiner';
import ListPaginationBar from '../components/ListPaginationBar';
import useDebouncedValue from '../../Hooks/useDebouncedValue';
import { capitalizeWords, formatPrice } from '../components/capitalizeFunction';
import { deleteButton } from '../components/AlerteModal';
// Ancien import — chargeait TOUTES les dépenses + filtre client
// import { useAllDepenses, useDeleteDepense } from '../../Api/queriesDepense';
import {
  usePaginationDepenses,
  useDeleteDepense,
} from '../../Api/queriesDepense';
import DepenseForm from './DepenseForm';

export default function DepenseListe() {
  const [form_modal, setForm_modal] = useState(false);
  const [formModalTitle, setFormModalTitle] = useState('Ajouter une Dépense');
  const [page, setPage] = useState(1);
  const limit = 50;

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 400);

  const [todayExpense, setTodayExpense] = useState(false);

  /** Filtre « aujourd'hui » — envoyé au backend avec todayDate + timezone */
  const filters = useMemo(
    () => ({
      today: todayExpense,
    }),
    [todayExpense]
  );

  /** Retour page 1 quand recherche ou filtre change */
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.today]);

  const { data: items, isLoading, error, isFetching } = usePaginationDepenses(
    page,
    limit,
    debouncedSearch,
    filters
  );

  // Ancien code — conservé en commentaire
  // const { data: depenseData, isLoading, error } = useAllDepenses();
  // const filterSearchDepense = depenseData?.filter(... recherche + today client ...);
  // const sumTotalExpense = filterSearchDepense?.reduce(...);

  const depensesPage = items?.results?.data ?? [];
  const totalDepenses = items?.results?.total ?? 0;
  const totalPages = items?.results?.totalPages ?? 0;
  const sumTotalExpense = items?.results?.stats?.sumTotalDepense ?? 0;

  const { mutate: deleteDepense, isDeleting } = useDeleteDepense();
  const [depenseToUpdate, setDepenseToUpdate] = useState(null);

  const showLoader = isLoading && depensesPage.length === 0;
  const isSearchActive = debouncedSearch.trim().length > 0;
  const hasActiveFilters = filters.today;

  const resetFilters = () => {
    setSearchTerm('');
    setTodayExpense(false);
  };

  function tog_form_modal() {
    setForm_modal(!form_modal);
  }

  return (
    <React.Fragment>
      <div className='page-content'>
        <Container fluid>
          <Breadcrumbs title='Transaction' breadcrumbItem='Depense' />

          <FormModal
            form_modal={form_modal}
            setForm_modal={setForm_modal}
            tog_form_modal={tog_form_modal}
            modal_title={formModalTitle}
            size='md'
            bodyContent={
              <DepenseForm
                depenseToEdit={depenseToUpdate}
                tog_form_modal={tog_form_modal}
              />
            }
          />

          <Row>
            <Col lg={12}>
              <Card>
                <CardBody>
                  <div id='depenseList'>
                    {/* ─── Ligne 1 : action + total | recherche ─── */}
                    <Row className='g-3 mb-3 align-items-center'>
                      <Col md={6} lg={5}>
                        <div className='d-flex flex-wrap align-items-center gap-3'>
                          <Button
                            color='info'
                            className='add-btn'
                            id='create-btn'
                            size='sm'
                            onClick={() => {
                              setDepenseToUpdate(null);
                              tog_form_modal();
                            }}
                          >
                            <i className='fas fa-dollar-sign me-1'></i>
                            Ajouter une Dépense
                          </Button>
                          <p className='text-muted mb-0 font-size-14'>
                            Total affiché :{' '}
                            <span className='text-warning fw-semibold'>
                              {totalDepenses}
                            </span>{' '}
                            dépense{totalDepenses > 1 ? 's' : ''}
                            {(isSearchActive || hasActiveFilters) && (
                              <span className='text-info'> · filtres actifs</span>
                            )}
                          </p>
                        </div>
                      </Col>
                      <Col md={6} lg={7}>
                        <div className='d-flex justify-content-md-end align-items-center gap-2 flex-wrap'>
                          {(isSearchActive || hasActiveFilters) && (
                            <Button
                              color='light'
                              size='sm'
                              className='border'
                              onClick={resetFilters}
                            >
                              <i className='ri-refresh-line me-1'></i>
                              Réinitialiser
                            </Button>
                          )}
                          {searchTerm !== '' && (
                            <Button
                              color='danger'
                              size='sm'
                              onClick={() => setSearchTerm('')}
                            >
                              <i className='fas fa-window-close'></i>
                            </Button>
                          )}
                          <div className='search-box flex-grow-1 flex-md-grow-0'>
                            <input
                              type='text'
                              className='form-control search border border-dark rounded'
                              placeholder='Motif, montant, date…'
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              style={{ minWidth: '220px' }}
                            />
                          </div>
                        </div>
                      </Col>
                    </Row>

                    {/* ─── Ligne 2 : total dépensé sur le jeu filtré (serveur) ─── */}
                    <Row className='g-3 mb-3'>
                      <Col sm={6} md={4}>
                        <div className='border rounded-3 p-3 text-center h-100 bg-light'>
                          <p className='text-muted font-size-13 mb-2'>
                            Total Dépensés
                          </p>
                          <span className='text-danger fs-5 fw-semibold'>
                            {formatPrice(sumTotalExpense)} F
                          </span>
                        </div>
                      </Col>
                      <Col sm={6} md={8}>
                        <div className='border rounded-3 p-3 h-100 bg-light d-flex flex-wrap align-items-center gap-2'>
                          <span className='text-muted fw-semibold font-size-14'>
                            Filtrer par :
                          </span>
                          <Button
                            type='button'
                            color={todayExpense ? 'warning' : 'light'}
                            size='sm'
                            className={
                              todayExpense
                                ? 'fw-semibold'
                                : 'border text-dark'
                            }
                            onClick={() => setTodayExpense((prev) => !prev)}
                            aria-pressed={todayExpense}
                          >
                            Dépense d'Aujourd'hui
                          </Button>
                        </div>
                      </Col>
                    </Row>

                    {error && (
                      <div className='text-danger text-center mb-3'>
                        Erreur de chargement des données
                      </div>
                    )}

                    {/* Pagination EN HAUT — avant le tableau */}
                    {!error && (totalDepenses > 0 || isFetching) && (
                      <ListPaginationBar
                        page={page}
                        totalPages={totalPages}
                        total={totalDepenses}
                        onPageChange={setPage}
                        isLoading={isFetching}
                      />
                    )}

                    {showLoader && <LoadingSpiner />}

                    <div className='table-responsive table-card mt-3 mb-1'>
                      {!error && !showLoader && depensesPage.length === 0 && (
                        <div className='text-center text-muted py-4'>
                          {isSearchActive || hasActiveFilters
                            ? `Aucune dépense trouvée${
                                isSearchActive
                                  ? ` pour « ${debouncedSearch} »`
                                  : ''
                              }`
                            : 'Aucune dépense pour le moment !'}
                        </div>
                      )}

                      {!error && depensesPage.length > 0 && (
                        <table
                          className='table align-middle table-nowrap'
                          id='depenseTable'
                          style={{
                            opacity: isFetching ? 0.7 : 1,
                            transition: 'opacity 0.2s',
                          }}
                        >
                          <thead className='table-light'>
                            <tr className='text-center'>
                              <th style={{ width: '50px' }}>Date de dépense</th>
                              <th>Motif de Dépense</th>
                              <th>Somme Dépensé</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody className='text-center'>
                            {depensesPage.map((depense) => (
                              <tr key={depense._id}>
                                <td>
                                  {new Date(
                                    depense.dateOfDepense
                                  ).toLocaleDateString()}
                                </td>
                                <td className='text-wrap'>
                                  {capitalizeWords(depense.motifDepense)}
                                </td>
                                <td className='text-danger'>
                                  {formatPrice(depense.totalAmount)} F
                                </td>
                                <td>
                                  <div className='d-flex gap-2 justify-content-center'>
                                    <div className='edit'>
                                      <button
                                        type='button'
                                        className='btn btn-sm btn-success edit-item-btn'
                                        onClick={() => {
                                          setFormModalTitle('Modifier les données');
                                          setDepenseToUpdate(depense);
                                          tog_form_modal();
                                        }}
                                      >
                                        <i className='ri-pencil-fill text-white'></i>
                                      </button>
                                    </div>
                                    {isDeleting && <LoadingSpiner />}
                                    {!isDeleting && (
                                      <div className='remove'>
                                        <button
                                          type='button'
                                          className='btn btn-sm btn-danger remove-item-btn'
                                          onClick={() => {
                                            deleteButton(
                                              depense._id,
                                              `depense de ${depense.totalAmount} F`,
                                              deleteDepense
                                            );
                                          }}
                                        >
                                          <i className='ri-delete-bin-fill text-white'></i>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
}
