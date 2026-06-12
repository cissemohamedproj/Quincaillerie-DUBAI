import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardText,
  Col,
  Container,
  Row,
} from 'reactstrap';
import Breadcrumbs from '../../components/Common/Breadcrumb';

import LoadingSpiner from '../components/LoadingSpiner';
import ListPaginationBar from '../components/ListPaginationBar';
import {
  capitalizeWords,
  formatPhoneNumber,
  formatPrice,
} from '../components/capitalizeFunction';
import { companyName } from '../CompanyInfo/CompanyInfo';
// Ancien import — chargeait commandes + factures via paginationCommandes (100/lot, sans recherche)
// import { usePaginationCommandes } from '../../Api/queriesCommande';
import { usePaginationFacturesHistorique } from '../../Api/queriesPaiement';
import useDebouncedValue from '../../Hooks/useDebouncedValue';

import FactureHeader from './Details/FactureHeader';
import { useNavigate } from 'react-router-dom';

export default function FactureListe() {
  const [page, setPage] = useState(1);
  const limit = 12;

  /** Recherche instantanée + debounce 400 ms avant appel API */
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 400);

  /** Retour page 1 quand la recherche debouncée change */
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data: items, isLoading, error, isFetching } =
    usePaginationFacturesHistorique(page, limit, debouncedSearch);

  // Ancien code — conservé en commentaire
  // const { data: items, isLoading, error } = usePaginationCommandes(page, limit);
  // items?.factures?.data — pas de recherche serveur, pagination en bas

  const facturesPage = items?.results?.data ?? [];
  const totalFactures = items?.results?.total ?? 0;
  const totalPages = items?.results?.totalPages ?? 0;

  const navigate = useNavigate();

  const showLoader = isLoading && facturesPage.length === 0;
  const isSearchActive = debouncedSearch.trim().length > 0;

  return (
    <React.Fragment>
      <div className='page-content'>
        <Container fluid>
          <Breadcrumbs title='Commande' breadcrumbItem='Liste de Factures' />

          {/* ─── En-tête : total + recherche ─── */}
          <Row className='g-3 mb-3 align-items-center'>
            <Col md={6} lg={5}>
              <p className='text-muted mb-0 font-size-14'>
                Total affiché :{' '}
                <span className='text-warning fw-semibold'>{totalFactures}</span>{' '}
                facture{totalFactures > 1 ? 's' : ''}
                {isSearchActive && (
                  <span className='text-info'> · recherche active</span>
                )}
              </p>
            </Col>
            <Col md={6} lg={7}>
              <div className='d-flex justify-content-md-end align-items-center gap-2 flex-wrap'>
                {isSearchActive && (
                  <Button
                    color='light'
                    size='sm'
                    className='border'
                    onClick={() => setSearchTerm('')}
                  >
                    <i className='ri-refresh-line me-1'></i>
                    Effacer
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
                    placeholder='Client, téléphone, montant, date…'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ minWidth: '220px' }}
                  />
                </div>
              </div>
            </Col>
          </Row>

          {error && (
            <div className='text-danger text-center mb-3'>
              Erreur de chargement des données
            </div>
          )}

          {/* Pagination EN HAUT — avant la liste des factures */}
          {!error && (totalFactures > 0 || isFetching) && (
            <ListPaginationBar
              page={page}
              totalPages={totalPages}
              total={totalFactures}
              onPageChange={setPage}
              isLoading={isFetching}
            />
          )}

          {showLoader && <LoadingSpiner />}

          {!error && !showLoader && facturesPage.length === 0 && (
            <div className='text-center text-muted py-4'>
              {isSearchActive
                ? `Aucune facture trouvée pour « ${debouncedSearch} »`
                : 'Aucune facture pour le moment.'}
            </div>
          )}

          {!error &&
            facturesPage.length > 0 &&
            facturesPage.map((comm, index) => (
              <Row
                key={comm._id}
                className='d-flex flex-column justify-content-center'
                style={{
                  opacity: isFetching ? 0.7 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                <Col className='col-sm-auto mb-3'>
                  <div className='d-flex gap-4 justify-content-center align-items-center'>
                    <Button
                      color='info'
                      className='add-btn'
                      id='create-btn'
                      onClick={() =>
                        navigate(`/factures/selected_facture/${comm?._id}`)
                      }
                    >
                      <i className='bx bx-show align-center me-1'></i> Détails
                    </Button>
                  </div>
                </Col>

                <Card
                  id={`facture-${comm?._id}`}
                  className='d-flex justify-content-center border border-info'
                  style={{
                    boxShadow: '0px 0px 10px rgba(100, 169, 238, 0.5)',
                    borderRadius: '15px',
                    width: '583px',
                    margin: '20px auto',
                    position: 'relative',
                  }}
                >
                  <CardBody>
                    <FactureHeader />
                    <div className='border-bottom border-info my-2 px-2 '>
                      <div className='d-flex justify-content-between align-item-center mt-2'>
                        <CardText>
                          <strong>Facture N°: </strong>{' '}
                          <span className='text-danger'>
                            {(page - 1) * limit + index + 1}
                          </span>
                        </CardText>
                        <CardText>
                          <strong> Date:</strong>{' '}
                          {new Date(comm.createdAt).toLocaleDateString()}
                        </CardText>
                      </div>

                      <div className='d-flex justify-content-between align-item-center  '>
                        <CardText>
                          <strong>Client: </strong>
                          {capitalizeWords(comm?.commande?.fullName)}{' '}
                        </CardText>
                        <CardText className='me-2'>
                          <strong>Tél: </strong>
                          {formatPhoneNumber(comm?.commande?.phoneNumber) ||
                            '-----'}
                        </CardText>
                      </div>
                      <CardText className='text-start'>
                        <strong>Livraison: </strong>
                        {capitalizeWords(comm?.commande?.adresse)}
                      </CardText>
                    </div>

                    <div className='my-2 p-2'>
                      <table className='table align-middle table-nowrap table-hover table-bordered border-2 border-info text-center'>
                        <thead>
                          <tr>
                            <th>Qté</th>
                            <th>Désignations</th>
                            <th>P.U</th>
                            <th>Montant</th>
                          </tr>
                        </thead>

                        <tbody>
                          {comm?.commande?.items?.map((article) => (
                            <tr key={article._id}>
                              <td>{article?.quantity} </td>
                              <td className='text-wrap'>
                                {capitalizeWords(article?.produit?.name)}{' '}
                              </td>
                              <td>{formatPrice(article?.customerPrice)} F </td>
                              <td>
                                {formatPrice(
                                  article?.customerPrice * article?.quantity
                                )}
                                {' F'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <CardFooter>
                      <div className='p-1'>
                        <div className='d-flex justify-content-between align-item-center'>
                          <CardText className={'text-center'}>
                            Total:{' '}
                            <strong style={{ fontSize: '14px' }}>
                              {formatPrice(comm?.totalAmount)} F{' '}
                            </strong>
                          </CardText>
                          <div>
                            <CardText className='text-center '>
                              Payé:
                              <strong style={{ fontSize: '14px' }}>
                                {formatPrice(comm?.totalPaye)} F{' '}
                              </strong>
                            </CardText>
                            <CardText className='text-center '>
                              Reliquat:
                              <strong style={{ fontSize: '14px' }}>
                                {formatPrice(
                                  comm?.totalAmount - comm?.totalPaye
                                )}{' '}
                                F{' '}
                              </strong>
                            </CardText>
                          </div>
                        </div>
                      </div>
                      <p className=' mt-2 text-info'>
                        Arrêté la présente facture à la somme de:{' '}
                        <strong style={{ fontSize: '14px' }}>
                          {formatPrice(comm?.totalAmount)} F
                        </strong>
                      </p>
                      <p className='font-size-10 text-center'>
                        Merci pour votre confiance et votre achat chez{' '}
                        {companyName}. Nous espérons vous revoir bientôt!
                      </p>
                    </CardFooter>
                  </CardBody>
                </Card>
              </Row>
            ))}
        </Container>
      </div>
    </React.Fragment>
  );
}
