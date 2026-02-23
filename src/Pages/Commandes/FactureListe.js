import React, { useRef, useState } from 'react';
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
import {
  capitalizeWords,
  formatPhoneNumber,
  formatPrice,
} from '../components/capitalizeFunction';
import { companyName } from '../CompanyInfo/CompanyInfo';
import { usePaginationCommandes } from '../../Api/queriesCommande';

import FactureHeader from './Details/FactureHeader';
import { useNavigate } from 'react-router-dom';

// ----------------------------------------
// ----------------------------------------
// ----------------------------------------
export default function FactureListe() {
  const [page, setPage] = useState(1);
  const limit = 100;
  const navigate = useNavigate();
  const { data: items, isLoading, error } = usePaginationCommandes(page, limit);

  return (
    <React.Fragment>
      <div className='page-content'>
        <Container fluid>
          <Breadcrumbs title='Commande' breadcrumbItem='Liste de Factures' />

          {error && (
            <div className='text-danger text-center'>
              Erreur de chargement des données
            </div>
          )}
          {isLoading && <LoadingSpiner />}
          {items?.factures?.data?.length === 0 && !isLoading && (
            <div className='text-center text-danger'>
              Aucune facture pour le moment.
            </div>
          )}
          {!isLoading && !error && (
            <div className='d-flex gap-3 justify-content-end align-items-center mt-4'>
              <Button
                disabled={page === 1}
                color='secondary'
                onClick={() => setPage((p) => p - 1)}
              >
                Précédent
              </Button>

              <p className='text-center mt-2'>
                {' '}
                Page{' '}
                <span className='text-primary'>
                  {items?.factures?.page}
                </span>{' '}
                sur{' '}
                <span className='text-info'>{items?.factures?.totalPages}</span>
              </p>
              <Button
                disabled={page === items?.factures?.totalPages}
                color='primary'
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </Button>
            </div>
          )}
          {!isLoading &&
            !error &&
            items?.factures?.data?.length > 0 &&
            items?.factures?.data?.map((comm, index) => (
              <Row
                key={comm._id}
                className='d-flex flex-column justify-content-center'
              >
                {/* // Bouton */}

                <Col className='col-sm-auto mb-3'>
                  <div className='d-flex gap-4  justify-content-center align-items-center'>
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
                {/* // ------------------------------------------- */}

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
                          <span className='text-danger'>{index + 1} </span>
                        </CardText>
                        <CardText>
                          <strong> Date:</strong>{' '}
                          {new Date(comm.createdAt).toLocaleDateString()}
                        </CardText>
                      </div>

                      {/* Infos Client */}
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
                    {/* Bordure Séparateur */}

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
                          {comm?.commande?.items.map((article) => (
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
                        <div
                          className='d-flex
                  justify-content-between align-item-center'
                        >
                          <CardText className={'text-center'}>
                            Total:{' '}
                            <strong style={{ fontSize: '14px' }}>
                              {' '}
                              {formatPrice(comm?.totalAmount)} F{' '}
                            </strong>{' '}
                          </CardText>
                          <div>
                            <CardText className='text-center '>
                              Payé:
                              <strong style={{ fontSize: '14px' }}>
                                {' '}
                                {formatPrice(comm?.totalPaye)} F{' '}
                              </strong>{' '}
                            </CardText>
                            <CardText className='text-center '>
                              Reliquat:
                              <strong style={{ fontSize: '14px' }}>
                                {' '}
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
