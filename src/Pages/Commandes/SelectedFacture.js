import React, { useRef } from 'react';
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
import { useAllCommandes } from '../../Api/queriesCommande';

import html2pdf from 'html2pdf.js';
import { useReactToPrint } from 'react-to-print';
import FactureHeader from './Details/FactureHeader';
import { useNavigate, useParams } from 'react-router-dom';

// Export En PDF
// ------------------------------------------
// ------------------------------------------
const exportPDFFacture = () => {
  const element = document.getElementById('facture');
  const opt = {
    filename: 'facture.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
  };

  html2pdf()
    .from(element)
    .set(opt)
    .save()
    .catch((err) => console.error('Error generating PDF:', err));
};

// ----------------------------------------
// ----------------------------------------
// ----------------------------------------
export default function SelectedFacture() {
  const { id } = useParams();
  const { data: commandes, isLoading, error } = useAllCommandes();
  const contentRef = useRef();
  const reactToPrintFn = useReactToPrint({ contentRef });
  const navigate = useNavigate();
  const selectedFacture = commandes?.factures?.find(
    (facture) => facture._id === id
  );

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
          <Row className='d-flex flex-column justify-content-center'>
            {/* // Bouton */}
            <Col className='col-sm-auto'>
              <div className='d-flex gap-4 mb-3  justify-content-center align-items-center'>
                {/* Bouton Retour */}
                <Button color='warning' onClick={() => navigate(-1)}>
                  <i className='fas fa-arrow-left align-center me-1'></i> Retour
                </Button>
                <Button
                  color='info'
                  className='add-btn'
                  id='create-btn'
                  onClick={reactToPrintFn}
                >
                  <i className='fas fa-print align-center me-1'></i> Imprimer
                </Button>

                <Button color='danger' onClick={exportPDFFacture}>
                  <i className='fas fa-paper-plane  me-1 '></i>
                  Télécharger en PDF
                </Button>
              </div>
            </Col>

            {/* // ------------------------------------------- */}
            <div ref={contentRef} id='facture'>
              <Card
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
                        {/* <span className='text-danger'>{index + 1} </span> */}
                      </CardText>
                      <CardText>
                        <strong> Date:</strong>{' '}
                        {new Date(
                          selectedFacture?.commandeDate
                        ).toLocaleDateString()}
                      </CardText>
                    </div>

                    {/* Infos Client */}
                    <div className='d-flex justify-content-between align-item-center  '>
                      <CardText>
                        <strong>Client: </strong>
                        {capitalizeWords(
                          selectedFacture?.commande?.fullName
                        )}{' '}
                      </CardText>
                      <CardText className='me-2'>
                        <strong>Tél: </strong>
                        {formatPhoneNumber(
                          selectedFacture?.commande?.phoneNumber
                        ) || '-----'}
                      </CardText>
                    </div>
                    <CardText className='text-start'>
                      <strong>Livraison: </strong>
                      {capitalizeWords(selectedFacture?.commande?.adresse)}
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
                        {selectedFacture?.commande?.items.map((article) => (
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
                            {formatPrice(selectedFacture?.totalAmount)} F{' '}
                          </strong>{' '}
                        </CardText>
                        <div>
                          <CardText className='text-center '>
                            Payé:
                            <strong style={{ fontSize: '14px' }}>
                              {' '}
                              {formatPrice(selectedFacture?.totalPaye)} F{' '}
                            </strong>{' '}
                          </CardText>
                          <CardText className='text-center '>
                            Reliquat:
                            <strong style={{ fontSize: '14px' }}>
                              {' '}
                              {formatPrice(
                                selectedFacture?.totalAmount -
                                  selectedFacture?.totalPaye
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
                        {formatPrice(selectedFacture?.totalAmount)} F
                      </strong>
                    </p>
                    <p className='font-size-10 text-center'>
                      Merci pour votre confiance et votre achat chez{' '}
                      {companyName}. Nous espérons vous revoir bientôt!
                    </p>
                  </CardFooter>
                </CardBody>
              </Card>
            </div>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
}
