import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, CardBody, Col, Container, Row } from 'reactstrap';
import Breadcrumbs from '../../components/Common/Breadcrumb';
import FormModal from '../components/FormModal';
import LoadingSpiner from '../components/LoadingSpiner';
import ListPaginationBar from '../components/ListPaginationBar';
import useDebouncedValue from '../../Hooks/useDebouncedValue';
import {
  capitalizeWords,
  formatPhoneNumber,
  formatPrice,
} from '../components/capitalizeFunction';
import { deleteButton } from '../components/AlerteModal';
// Ancien import — 600 paiements/lot + filtres côté client
// import { useDeletePaiement, usePaginationPaiements } from '../../Api/queriesPaiement';
import {
  useDeletePaiement,
  usePaginationPaiementsListe,
} from '../../Api/queriesPaiement';
import PaiementForm from './PaiementForm';
import ReçuPaiement from './ReçuPaiement';
import { connectedUserRole } from '../Authentication/userInfos';

export default function PaiementsListe() {
  const [form_modal, setForm_modal] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 50;

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 400);

  const [filterReliqua, setFilterReliqua] = useState(false);
  const [todayPaiement, setTodayPaiement] = useState(false);

  /**
   * Objet filters mémorisé — correspond aux query params backend
   * (filterImpayes, today, todayDate, timezone).
   */
  const filters = useMemo(
    () => ({
      impayes: filterReliqua,
      today: todayPaiement,
    }),
    [filterReliqua, todayPaiement]
  );

  /** Retour page 1 quand recherche ou filtres changent */
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.impayes, filters.today]);

  const { data: items, isLoading, error, isFetching } =
    usePaginationPaiementsListe(page, limit, debouncedSearch, filters);

  // Ancien code — conservé en commentaire
  // const limit = 600;
  // const { data: items, isLoading, error } = usePaginationPaiements(page, limit);
  // const filterSearchPaiement = items?.results?.data?.filter(... recherche client ...);
  // const sumTotalAmount = filterSearchPaiement?.reduce(...);

  const paiementsPage = items?.results?.data ?? [];
  const totalPaiements = items?.results?.total ?? 0;
  const totalPages = items?.results?.totalPages ?? 0;
  const stats = items?.results?.stats ?? {
    sumTotalAmount: 0,
    sumTotalPaye: 0,
    sumNonPaye: 0,
  };

  const { mutate: deletePaiement, isDeleting } = useDeletePaiement();
  const [paiementToUpdate, setPaiementToUpdate] = useState(null);
  const [formModalTitle, setFormModalTitle] = useState('Nouveau Paiement');
  const [selectedPaiement, setSelectedPaiement] = useState(null);
  const [show_modal, setShow_modal] = useState(false);

  const showLoader = isLoading && paiementsPage.length === 0;
  const isSearchActive = debouncedSearch.trim().length > 0;
  const hasActiveFilters = filters.impayes || filters.today;

  const resetFilters = () => {
    setSearchTerm('');
    setFilterReliqua(false);
    setTodayPaiement(false);
  };

  function tog_form_modal() {
    setForm_modal(!form_modal);
  }

  function tog_show_modal() {
    setShow_modal(!show_modal);
  }

  return (
    <React.Fragment>
      <div className='page-content'>
        <Container fluid>
          <Breadcrumbs title='Transaction' breadcrumbItem='Paiements' />

          <FormModal
            form_modal={form_modal}
            setForm_modal={setForm_modal}
            tog_form_modal={tog_form_modal}
            modal_title={formModalTitle}
            size='md'
            bodyContent={
              <PaiementForm
                paiementToEdit={paiementToUpdate}
                tog_form_modal={tog_form_modal}
              />
            }
          />

          <ReçuPaiement
            show_modal={show_modal}
            tog_show_modal={tog_show_modal}
            selectedPaiementID={selectedPaiement}
          />

          <Row>
            <Col lg={12}>
              <Card>
                <CardBody>
                  <div id='paiementsList'>
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
                              setPaiementToUpdate(null);
                              setFormModalTitle('Nouveau Paiement');
                              tog_form_modal();
                            }}
                          >
                            <i className='fas fa-dollar-sign me-1'></i>
                            Ajouter un Paiement
                          </Button>
                          <p className='text-muted mb-0 font-size-14'>
                            Total affiché :{' '}
                            <span className='text-warning fw-semibold'>
                              {totalPaiements}
                            </span>{' '}
                            paiement{totalPaiements > 1 ? 's' : ''}
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
                              placeholder='Client, montant, date…'
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              style={{ minWidth: '220px' }}
                            />
                          </div>
                        </div>
                      </Col>
                    </Row>

                    {/* ─── Ligne 2 : statistiques sur le jeu filtré (serveur) ─── */}
                    <Row className='g-3 mb-3'>
                      <Col sm={4}>
                        <div className='border rounded-3 p-3 text-center h-100 bg-light'>
                          <p className='text-muted font-size-13 mb-2'>
                            Total Commande
                          </p>
                          <span className='text-info fs-5 fw-semibold'>
                            {formatPrice(stats.sumTotalAmount)} F
                          </span>
                        </div>
                      </Col>
                      <Col sm={4}>
                        <div className='border rounded-3 p-3 text-center h-100 bg-light'>
                          <p className='text-muted font-size-13 mb-2'>
                            Total Payés
                          </p>
                          <span className='text-success fs-5 fw-semibold'>
                            {formatPrice(stats.sumTotalPaye)} F
                          </span>
                        </div>
                      </Col>
                      <Col sm={4}>
                        <div className='border rounded-3 p-3 text-center h-100 bg-light'>
                          <p className='text-muted font-size-13 mb-2'>
                            Total Non Payés
                          </p>
                          <span className='text-danger fs-5 fw-semibold'>
                            {formatPrice(stats.sumNonPaye)} F
                          </span>
                        </div>
                      </Col>
                    </Row>

                    {/* ─── Ligne 3 : filtres rapides ─── */}
                    <Row className='mb-3'>
                      <Col xs={12}>
                        <div className='d-flex flex-wrap align-items-center gap-2 py-3 px-3 border rounded-3'>
                          <span className='text-muted fw-semibold font-size-14 me-1'>
                            Filtrer par :
                          </span>
                          <Button
                            type='button'
                            color={filterReliqua ? 'danger' : 'light'}
                            size='sm'
                            className={
                              filterReliqua
                                ? 'fw-semibold'
                                : 'border text-dark'
                            }
                            onClick={() => setFilterReliqua((prev) => !prev)}
                            aria-pressed={filterReliqua}
                          >
                            les Impayés
                          </Button>
                          <Button
                            type='button'
                            color={todayPaiement ? 'warning' : 'light'}
                            size='sm'
                            className={
                              todayPaiement
                                ? 'fw-semibold'
                                : 'border text-dark'
                            }
                            onClick={() => setTodayPaiement((prev) => !prev)}
                            aria-pressed={todayPaiement}
                          >
                            Aujourd'hui
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
                    {!error && (totalPaiements > 0 || isFetching) && (
                      <ListPaginationBar
                        page={page}
                        totalPages={totalPages}
                        total={totalPaiements}
                        onPageChange={setPage}
                        isLoading={isFetching}
                      />
                    )}

                    {showLoader && <LoadingSpiner />}

                    <div className='table-responsive table-card mt-3 mb-1'>
                      {!error && !showLoader && paiementsPage.length === 0 && (
                        <div className='text-center text-muted py-4'>
                          {isSearchActive || hasActiveFilters
                            ? `Aucun paiement trouvé${
                                isSearchActive
                                  ? ` pour « ${debouncedSearch} »`
                                  : ''
                              }`
                            : 'Aucun paiement pour le moment !'}
                        </div>
                      )}

                      {!error && paiementsPage.length > 0 && (
                        <table
                          className='table align-middle table-nowrap table-hover'
                          id='paiementTable'
                          style={{
                            opacity: isFetching ? 0.7 : 1,
                            transition: 'opacity 0.2s',
                          }}
                        >
                          <thead className='table-light'>
                            <tr>
                              <th style={{ width: '50px' }}>Date de Paiement</th>
                              <th>Client</th>
                              <th>Téléphone</th>
                              <th>Adresse de Livraison</th>
                              <th>Somme sur Facture</th>
                              <th>Somme Payé</th>
                              <th>Reliquat</th>
                              <th>Réduction</th>
                              <th>Methode de Paiement</th>
                              <th>Action</th>
                            </tr>
                          </thead>

                          <tbody className='text-center'>
                            {paiementsPage.map((paiement) => {
                              const reliquat =
                                (paiement?.totalAmount || 0) -
                                (paiement?.totalPaye || 0);

                              return (
                                <tr key={paiement?._id}>
                                  <th scope='row'>
                                    {new Date(
                                      paiement?.paiementDate
                                    ).toLocaleDateString()}
                                  </th>
                                  <td>
                                    {capitalizeWords(
                                      paiement?.commande?.fullName
                                    )}
                                  </td>
                                  <td>
                                    {formatPhoneNumber(
                                      paiement?.commande?.phoneNumber
                                    ) || '----'}
                                  </td>
                                  <td>
                                    {capitalizeWords(
                                      paiement?.commande?.adresse
                                    )}
                                  </td>
                                  <td>
                                    {formatPrice(paiement?.totalAmount)} F
                                  </td>
                                  <td>
                                    {formatPrice(paiement?.totalPaye)} F
                                  </td>
                                  <td>
                                    {reliquat > 0 ? (
                                      <span className='text-danger'>
                                        {formatPrice(reliquat)} F
                                      </span>
                                    ) : (
                                      <span>{formatPrice(reliquat)} F</span>
                                    )}
                                  </td>
                                  <td className='text-warning'>
                                    {formatPrice(paiement?.reduction)} F
                                  </td>
                                  <td className='text-warning'>
                                    {capitalizeWords(paiement?.methode)}
                                  </td>
                                  <td>
                                    {isDeleting && <LoadingSpiner />}
                                    {!isDeleting && (
                                      <div className='d-flex gap-2 justify-content-center'>
                                        <div>
                                          <button
                                            type='button'
                                            className='btn btn-sm btn-secondary show-item-btn'
                                            onClick={() => {
                                              setSelectedPaiement(paiement?._id);
                                              tog_show_modal();
                                            }}
                                          >
                                            <i className='bx bx-show align-center text-white'></i>
                                          </button>
                                        </div>
                                        {connectedUserRole === 'admin' && (
                                          <div className='edit'>
                                            <button
                                              type='button'
                                              className='btn btn-sm btn-success edit-item-btn'
                                              onClick={() => {
                                                setFormModalTitle(
                                                  'Modifier les données'
                                                );
                                                setPaiementToUpdate(paiement);
                                                tog_form_modal();
                                              }}
                                            >
                                              <i className='ri-pencil-fill text-white'></i>
                                            </button>
                                          </div>
                                        )}
                                        {connectedUserRole === 'admin' && (
                                          <div className='remove'>
                                            <button
                                              type='button'
                                              className='btn btn-sm btn-danger remove-item-btn'
                                              onClick={() => {
                                                deleteButton(
                                                  paiement?._id,
                                                  `Paiement de ${formatPrice(
                                                    paiement?.totalAmount
                                                  )} F`,
                                                  deletePaiement
                                                );
                                              }}
                                            >
                                              <i className='ri-delete-bin-fill text-white'></i>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
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
