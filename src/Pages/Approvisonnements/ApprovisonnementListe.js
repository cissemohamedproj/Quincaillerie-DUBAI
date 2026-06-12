import React, { useEffect, useState } from 'react';
import { Button, Card, CardBody, Col, Container, Row } from 'reactstrap';
import Breadcrumbs from '../../components/Common/Breadcrumb';
import { useNavigate } from 'react-router-dom';
import LoadingSpiner from '../components/LoadingSpiner';
import ListPaginationBar from '../components/ListPaginationBar';
import {
  capitalizeWords,
  formatPhoneNumber,
  formatPrice,
} from '../components/capitalizeFunction';
import { deleteButton } from '../components/AlerteModal';
// Ancien import — chargeait tous les approvisionnements avec double populate
// import {
//   useAllApprovisonnement,
//   useCancelApprovisonnement,
//   useDeleteApprovisonnement,
// } from '../../Api/queriesApprovisonnement';
import {
  usePaginationApprovisonnements,
  useCancelApprovisonnement,
  useDeleteApprovisonnement,
} from '../../Api/queriesApprovisonnement';
import Swal from 'sweetalert2';
import useDebouncedValue from '../../Hooks/useDebouncedValue';

export default function ApprovisonnementListe() {
  const [page, setPage] = useState(1);
  const limit = 50;

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data: items, isLoading, error, isFetching } =
    usePaginationApprovisonnements(page, limit, debouncedSearch);

  // Ancien code — conservé en commentaire
  // const { data: approvisonnementData, isLoading, error } = useAllApprovisonnement();
  // const filterSearchApprovisonnement = approvisonnementData?.filter((appro) => { ... });

  const approPage = items?.results?.data ?? [];
  const totalAppro = items?.results?.total ?? 0;
  const totalPages = items?.results?.totalPages ?? 0;

  const { mutate: cancelApprovisonnement } = useCancelApprovisonnement();
  const { mutate: deleteApprovisonnement } = useDeleteApprovisonnement();

  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const showLoader = isLoading && approPage.length === 0;
  const isSearchActive = debouncedSearch.trim().length > 0;

  function handleCancelApprovisonnement(appro) {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-success ms-2',
        cancelButton: 'btn btn-danger me-2',
      },
      buttonsStyling: false,
    });

    swalWithBootstrapButtons
      .fire({
        title: `Attention ${appro?.quantity} quantité sera soustraire de votre STOCK !  `,
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
            setIsDeleting(true);
            cancelApprovisonnement(appro?._id, {
              onSuccess: () => {
                setIsDeleting(false);
                swalWithBootstrapButtons.fire({
                  title: 'Succès!',
                  text: `Approvisonnement Annulé avec succès STOCK rétabli.`,
                  icon: 'success',
                });
                navigate('/produits');
              },
              onError: (e) => {
                setIsDeleting(false);
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
            setIsDeleting(false);
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
          setIsDeleting(false);
          swalWithBootstrapButtons.fire({
            title: "Echec d'Annulation",
            icon: 'error',
          });
        }
      });
  }

  return (
    <React.Fragment>
      <div className='page-content'>
        <Container fluid>
          <Breadcrumbs title='Produits' breadcrumbItem='Approvisonnement' />

          <Row>
            <Col lg={12}>
              <Card>
                <CardBody>
                  <Row className='g-4 mb-3'>
                    <Col>
                      <p className='text-center font-size-15 mt-2'>
                        Approvisonnement Total:{' '}
                        <span className='text-warning'>{totalAppro}</span>
                        {isSearchActive && (
                          <span className='text-muted font-size-13'>
                            {' '}
                            (résultat{totalAppro > 1 ? 's' : ''} recherche)
                          </span>
                        )}
                      </p>
                    </Col>
                    <Col className='col-sm'>
                      <div className='d-flex gap-3 justify-content-sm-end'>
                        {searchTerm !== '' && (
                          <Button
                            color='danger'
                            onClick={() => setSearchTerm('')}
                          >
                            <i className='fas fa-window-close'></i>
                          </Button>
                        )}
                        <div className='search-box me-4'>
                          <input
                            type='text'
                            className='form-control search border border-black rounded'
                            placeholder='Rechercher...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <div id='approvisonnementList'>
                    {error && (
                      <div className='text-danger text-center'>
                        Erreur de chargement des données
                      </div>
                    )}

                    {/* Pagination EN HAUT — avant le tableau */}
                    {!error && (totalAppro > 0 || isFetching) && (
                      <ListPaginationBar
                        page={page}
                        totalPages={totalPages}
                        total={totalAppro}
                        onPageChange={setPage}
                        isLoading={isFetching}
                      />
                    )}

                    {showLoader && <LoadingSpiner />}

                    <div className='table-responsive table-card mt-3 mb-1'>
                      {!error && !showLoader && approPage.length === 0 && (
                        <div className='text-center text-mutate'>
                          {isSearchActive
                            ? `Aucun approvisionnement trouvé pour « ${debouncedSearch} »`
                            : 'Aucune approvisonnement pour le moment !'}
                        </div>
                      )}
                      {!error && approPage.length > 0 && (
                        <table
                          className='table align-middle table-nowrap table-hover'
                          id='approvisonnementTable'
                          style={{
                            opacity: isFetching ? 0.7 : 1,
                            transition: 'opacity 0.2s',
                          }}
                        >
                          <thead className='table-light'>
                            <tr className='text-center'>
                              <th scope='col' style={{ width: '50px' }}>
                                Date d'arrivée
                              </th>
                              <th data-sort='marchandise'>Produit</th>
                              <th data-sort='quantity'>Quantité arrivée</th>
                              <th data-sort='price'>Prix d'achat</th>
                              <th data-sort='fournisseur_name'>Fournisseur</th>
                              <th>Téléphone</th>
                              <th>Adresse</th>
                              <th>Action</th>
                            </tr>
                          </thead>

                          <tbody className='list form-check-all text-center'>
                            {approPage.map((appro) => (
                              <tr key={appro._id} className='text-center'>
                                <th scope='row'>
                                  {appro?.deliveryDate
                                    ? new Date(
                                        appro.deliveryDate
                                      ).toLocaleDateString('fr-Fr', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        weekday: 'short',
                                      })
                                    : '—'}
                                </th>
                                <td>
                                  {capitalizeWords(appro?.produit?.name ?? '')}
                                </td>
                                <td>{formatPrice(appro?.quantity)}</td>
                                <td>
                                  {formatPrice(appro?.price)}
                                  {' F '}
                                </td>
                                <td>
                                  {capitalizeWords(
                                    appro?.fournisseur?.firstName ?? ''
                                  )}{' '}
                                  {capitalizeWords(
                                    appro?.fournisseur?.lastName ?? ''
                                  )}
                                </td>
                                <td>
                                  {formatPhoneNumber(
                                    appro?.fournisseur?.phoneNumber
                                  )}
                                </td>
                                <td>
                                  {capitalizeWords(
                                    appro?.fournisseur?.adresse ?? ''
                                  )}
                                </td>
                                <td>
                                  <div className='d-flex gap-2 justify-content-center'>
                                    {isDeleting && <LoadingSpiner />}
                                    {!isDeleting && (
                                      <div className='remove'>
                                        <button
                                          className='btn btn-sm btn-warning remove-item-btn'
                                          type='button'
                                          onClick={() =>
                                            handleCancelApprovisonnement(appro)
                                          }
                                        >
                                          Annuler
                                        </button>
                                      </div>
                                    )}
                                    {!isDeleting && (
                                      <div className='remove'>
                                        <button
                                          className='btn btn-sm btn-danger remove-item-btn'
                                          type='button'
                                          onClick={() => {
                                            deleteButton(
                                              appro?._id,
                                              appro?.produit?.name,
                                              deleteApprovisonnement
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
