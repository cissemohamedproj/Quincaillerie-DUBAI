import { Button, Card, CardBody, Col, Container, Row } from 'reactstrap';
import Breadcrumbs from '../../components/Common/Breadcrumb';
import LoadingSpiner from '../components/LoadingSpiner';
import ListPaginationBar from '../components/ListPaginationBar';
import {
  capitalizeWords,
  formatPhoneNumber,
  formatPrice,
} from '../components/capitalizeFunction';
import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
// Ancien import — chargeait TOUTES les commandes + factures + populate
// import {
//   useAllCommandes,
//   useDeleteCommande,
//   usePaginationCommandes,
// } from '../../Api/queriesCommande';
import {
  usePaginationCommandesHistorique,
  useDeleteCommande,
} from '../../Api/queriesCommande';
import { useNavigate } from 'react-router-dom';
import { connectedUserRole } from '../Authentication/userInfos';
import useDebouncedValue from '../../Hooks/useDebouncedValue';

export default function CommandeListe() {
  const [page, setPage] = useState(1);
  const limit = 50;

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 400);

  const [todayCommande, setTodayCommande] = useState(false);
  const [delivredCommande, setDelivredCommande] = useState(false);
  const [notDelivredCommande, setNotdelivredCommande] = useState(false);

  /**
   * Objet filters mémorisé — évite des re-renders inutiles de React Query
   * et correspond aux query params du backend (today, filterEnCours, filterEnAttente).
   */
  const filters = useMemo(
    () => ({
      today: todayCommande,
      enCours: delivredCommande,
      enAttente: notDelivredCommande,
    }),
    [todayCommande, delivredCommande, notDelivredCommande]
  );

  /** Retour page 1 quand recherche ou filtres changent */
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.today, filters.enCours, filters.enAttente]);

  const { data: items, isLoading, error, isFetching } =
    usePaginationCommandesHistorique(page, limit, debouncedSearch, filters);

  // Ancien code — conservé en commentaire
  // const { data: commandes, isLoading, error } = useAllCommandes();
  // const commandeIdsWithFacture = useMemo(() => { ... commandes?.factures ... }, []);
  // const { filterCommandes, totalCommandesLivres, ... } = useMemo(() => { ... filtre client ... }, []);

  const commandesPage = items?.results?.data ?? [];
  const totalCommandes = items?.results?.total ?? 0;
  const totalPages = items?.results?.totalPages ?? 0;
  const stats = items?.results?.stats ?? {
    livre: 0,
    enCours: 0,
    enAttente: 0,
  };

  const { mutate: deleteCommandeAndRestorStock } = useDeleteCommande();
  const [isDeleting, setIsDeletting] = useState(false);
  const navigate = useNavigate();

  const showLoader = isLoading && commandesPage.length === 0;
  const isSearchActive = debouncedSearch.trim().length > 0;
  const hasActiveFilters =
    filters.today || filters.enCours || filters.enAttente;

  const handleCommandeClick = (id) => {
    navigate(`/facture/${id}`);
  };

  function deleteCommande(comm) {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-success ms-2',
        cancelButton: 'btn btn-danger me-2',
      },
      buttonsStyling: false,
    });

    swalWithBootstrapButtons
      .fire({
        title: `Attention après l'Annulation les produits seront ajouter sur votre STOCK !  `,
        text: 'Voulez-vous continuer ?',
        icon: 'question',
        iconColor: 'red',
        showCancelButton: true,
        confirmButtonText: 'Oui, Continuer',
        cancelButtonText: 'Non',
        reverseButtons: true,
      })
      .then((result) => {
        if (result.isConfirmed) {
          try {
            const payload = {
              commandeId: comm?._id,
              items: comm?.items.map((item) => ({
                // produit peut être un ObjectId ou un objet peuplé (.lean + populate)
                produit: item.produit?._id ?? item.produit,
                quantity: item.quantity,
              })),
            };

            setIsDeletting(true);
            deleteCommandeAndRestorStock(payload, {
              onSuccess: () => {
                setIsDeletting(false);
                swalWithBootstrapButtons.fire({
                  title: 'Succès!',
                  text: `Commande Annulé avec succès les produits sont ajouté sur le STOCK.`,
                  icon: 'success',
                });
              },
              onError: (e) => {
                setIsDeletting(false);
                swalWithBootstrapButtons.fire({
                  title: 'Erreur',
                  text:
                    e?.response?.data?.message ||
                    'Une erreur est survenue lors de la suppression.',
                  icon: 'error',
                });
              },
            });
          } catch (e) {
            setIsDeletting(false);
            swalWithBootstrapButtons.fire({
              title: 'Erreur',
              text:
                e ||
                e?.response?.data?.message ||
                "Une erreur est survenue lors de l'Annulation.",
              icon: 'error',
            });
          }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          setIsDeletting(false);
          swalWithBootstrapButtons.fire({
            title: 'Commande non Annulée',
            icon: 'error',
          });
        }
      });
  }

  return (
    <React.Fragment>
      <div className='page-content'>
        <Container fluid>
          <Breadcrumbs title='Commande' breadcrumbItem='Historique' />

          <Row>
            <Col lg={12}>
              <Card>
                <CardBody>
                  <div id='commandeList'>
                    <Col md={12}>
                      <div className=' d-flex align-items-center gap-3 mb-4 justify-content-end'>
                        {searchTerm !== '' && (
                          <Button
                            color='danger'
                            onClick={() => setSearchTerm('')}
                          >
                            <i className='fas fa-window-close'></i>
                          </Button>
                        )}
                        <div className='search-box me-2'>
                          <input
                            type='text'
                            className='form-control search border border-dark rounded'
                            placeholder='Rechercher...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                    </Col>

                    <Col md={12}>
                      <div className='d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4'>
                        <div className='d-flex flex-column justify-content-center align-items-center gap-2 text-warning'>
                          <label
                            className='form-check-label'
                            htmlFor='filterToday'
                          >
                            Commande d'Aujourd'hui
                          </label>
                          <input
                            type='checkbox'
                            className='form-check-input'
                            id='filterToday'
                            checked={todayCommande}
                            onChange={() => setTodayCommande(!todayCommande)}
                          />
                        </div>
                        <div className='d-flex flex-column justify-content-center align-items-center gap-2 text-warning'>
                          <label
                            className='form-check-label'
                            htmlFor='filterDelivredCommande'
                          >
                            Commandes En Cours
                          </label>
                          <input
                            type='checkbox'
                            className='form-check-input'
                            id='filterDelivredCommande'
                            checked={delivredCommande}
                            onChange={() =>
                              setDelivredCommande(!delivredCommande)
                            }
                          />
                        </div>
                        <div className='d-flex flex-column justify-content-center align-items-center gap-2 text-warning'>
                          <label
                            className='form-check-label'
                            htmlFor='filterNotDelivredCommande'
                          >
                            Commande En Attente
                          </label>
                          <input
                            type='checkbox'
                            className='form-check-input'
                            id='filterNotDelivredCommande'
                            checked={notDelivredCommande}
                            onChange={() =>
                              setNotdelivredCommande(!notDelivredCommande)
                            }
                          />
                        </div>
                      </div>
                    </Col>

                    {/* Compteurs calculés côté serveur sur l'ensemble filtré */}
                    <Row className='mt-4 d-flex flex-wrap justify-content-center align-items-center'>
                      <Col
                        md={3}
                        className='d-flex flex-column justify-content-center align-items-center'
                      >
                        <h6 className='text-center font-size-15 mt-2'>
                          Commande Enregistrée
                        </h6>
                        <span className='text-info font-size-18'>
                          {formatPrice(stats.livre)}
                        </span>
                      </Col>
                      <Col
                        md={3}
                        className='d-flex flex-column justify-content-center align-items-center'
                      >
                        <h6 className='text-center font-size-15 mt-2'>
                          Commande En Cours
                        </h6>
                        <span className='text-info font-size-18'>
                          {formatPrice(stats.enCours)}
                        </span>
                      </Col>
                      <Col
                        md={3}
                        className='d-flex flex-column justify-content-center align-items-center'
                      >
                        <h6 className='text-center font-size-15 mt-2'>
                          Commande En Attente
                        </h6>
                        <span className='text-danger font-size-18'>
                          {formatPrice(stats.enAttente)}
                        </span>
                      </Col>
                      <Col md={12} className='text-center mt-2'>
                        <span className='text-warning font-size-13'>
                          Total affiché : {totalCommandes} commande
                          {totalCommandes > 1 ? 's' : ''}
                          {(isSearchActive || hasActiveFilters) &&
                            ' (filtres actifs)'}
                        </span>
                      </Col>
                    </Row>

                    {error && (
                      <div className='text-danger text-center mt-3'>
                        Erreur de chargement des données
                      </div>
                    )}

                    {/* Pagination EN HAUT — avant le tableau */}
                    {!error && (totalCommandes > 0 || isFetching) && (
                      <ListPaginationBar
                        page={page}
                        totalPages={totalPages}
                        total={totalCommandes}
                        onPageChange={setPage}
                        isLoading={isFetching}
                      />
                    )}

                    {showLoader && <LoadingSpiner />}

                    <div className='table-responsive table-card mt-3 mb-1'>
                      {!error && !showLoader && commandesPage.length === 0 && (
                        <div className='text-center text-mutate'>
                          {isSearchActive || hasActiveFilters
                            ? `Aucune commande trouvée${
                                isSearchActive
                                  ? ` pour « ${debouncedSearch} »`
                                  : ''
                              }`
                            : 'Aucune commande pour le moment !'}
                        </div>
                      )}
                      {!error && commandesPage.length > 0 && (
                        <table
                          className='table align-middle table-nowrap table-hover'
                          id='commandeTable'
                          style={{
                            opacity: isFetching ? 0.7 : 1,
                            transition: 'opacity 0.2s',
                          }}
                        >
                          <thead className='table-light'>
                            <tr>
                              <th scope='col' style={{ width: '50px' }}>
                                <i className='fas fa-dollar-sign text-warning'></i>
                              </th>
                              <th scope='col' style={{ width: '50px' }}>
                                Date de Commande
                              </th>
                              <th className='sort' data-sort='fullName'>
                                Client
                              </th>
                              <th className='sort' data-sort='phoneNumber'>
                                Téléphone
                              </th>
                              <th className='sort' data-sort='adresse'>
                                Adresse de Livraison
                              </th>
                              <th className='sort' data-sort='items'>
                                Article
                              </th>
                              <th className='sort' data-sort='statut'>
                                Statut
                              </th>
                              <th className='sort' data-sort='action'>
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className='list form-check-all text-center'>
                            {commandesPage.map((comm) => (
                              <tr key={comm?._id}>
                                <th scope='row'>
                                  {comm?.hasFacture ? (
                                    <i className='fas fa-check-circle text-success'></i>
                                  ) : (
                                    <i className='fas fa-times-circle text-danger'></i>
                                  )}
                                </th>
                                <th>
                                  {new Date(
                                    comm?.commandeDate
                                  ).toLocaleDateString('fr-Fr', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                  })}
                                </th>
                                <td>{capitalizeWords(comm?.fullName)}</td>
                                <td>
                                  {formatPhoneNumber(comm?.phoneNumber) ||
                                    '------'}
                                </td>
                                <td>{capitalizeWords(comm?.adresse)}</td>
                                <td>{comm?.items?.length} acticles</td>
                                <td>
                                  <span
                                    className={`badge badge-soft-${
                                      comm?.statut === 'livré'
                                        ? 'success'
                                        : 'warning'
                                    } text-uppercase`}
                                  >
                                    {comm?.statut}
                                  </span>
                                </td>
                                <td>
                                  {isDeleting && <LoadingSpiner />}
                                  {!isDeleting && (
                                    <div className='d-flex gap-2 justify-content-center'>
                                      <div className='show-details'>
                                        <button
                                          type='button'
                                          className='btn btn-sm btn-info show-item-btn'
                                          onClick={() =>
                                            handleCommandeClick(comm?._id)
                                          }
                                        >
                                          <i className=' bx bx-show-alt text-white'></i>
                                        </button>
                                      </div>
                                      {connectedUserRole === 'admin' && (
                                        <div className='edit'>
                                          <button
                                            type='button'
                                            className='btn btn-sm btn-success edit-item-btn'
                                            onClick={() =>
                                              navigate(
                                                `/updateCommande/${comm?._id}`
                                              )
                                            }
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
                                            onClick={() =>
                                              deleteCommande(comm)
                                            }
                                          >
                                            <i className='ri-delete-bin-fill text-white'></i>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
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
