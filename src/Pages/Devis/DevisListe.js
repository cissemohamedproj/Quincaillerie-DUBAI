import React, { useEffect, useRef, useState } from 'react';
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
import useDebouncedValue from '../../Hooks/useDebouncedValue';
import { capitalizeWords, formatPrice } from '../components/capitalizeFunction';
import html2pdf from 'html2pdf.js';
import { useReactToPrint } from 'react-to-print';
// Ancien import — chargeait TOUS les devis d'un coup, sans recherche
// import { useAllDevis, useDeleteDevis } from '../../Api/queriesDevis';
import {
  usePaginationDevisHistorique,
  useDeleteDevis,
} from '../../Api/queriesDevis';
import { useNavigate } from 'react-router-dom';
import { deleteButton } from '../components/AlerteModal';
import FactureHeader from '../Commandes/Details/FactureHeader';

/** Export PDF du devis visible (élément #facture) */
const exportPDFFacture = () => {
  const element = document.getElementById('facture');
  const opt = {
    filename: 'devis.pdf',
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

export default function DevisListe() {
  const [page, setPage] = useState(1);
  const limit = 12;

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data: items, isLoading, error, isFetching } =
    usePaginationDevisHistorique(page, limit, debouncedSearch);

  // Ancien code — conservé en commentaire
  // const { data: devisData, isLoading, error } = useAllDevis();

  const devisPage = items?.results?.data ?? [];
  const totalDevis = items?.results?.total ?? 0;
  const totalPages = items?.results?.totalPages ?? 0;
  const sumTotalAmount = items?.results?.stats?.sumTotalAmount ?? 0;

  const { mutate: deleteDevis } = useDeleteDevis();
  const contentRef = useRef();
  const reactToPrintFn = useReactToPrint({ contentRef });
  const navigate = useNavigate();

  const showLoader = isLoading && devisPage.length === 0;
  const isSearchActive = debouncedSearch.trim().length > 0;

  return (
    <React.Fragment>
      <div className='page-content'>
        <Container fluid>
          <Breadcrumbs title='Devis' breadcrumbItem='Liste de Devis' />

          {/* ─── En-tête : total + recherche ─── */}
          <Row className='g-3 mb-3 align-items-center'>
            <Col md={6} lg={5}>
              <div className='d-flex flex-wrap align-items-center gap-3'>
                <Button
                  color='info'
                  size='sm'
                  onClick={() => navigate('/newDevis')}
                >
                  <i className='fas fa-plus me-1'></i>
                  Nouveau Devis
                </Button>
                <p className='text-muted mb-0 font-size-14'>
                  Total affiché :{' '}
                  <span className='text-warning fw-semibold'>{totalDevis}</span>{' '}
                  devis
                  {isSearchActive && (
                    <span className='text-info'> · recherche active</span>
                  )}
                </p>
              </div>
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
                    placeholder='Produit, montant, date…'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ minWidth: '220px' }}
                  />
                </div>
              </div>
            </Col>
          </Row>

          {/* ─── Statistique : montant total des devis filtrés ─── */}
          <Row className='g-3 mb-3'>
            <Col sm={6} md={4}>
              <div className='border rounded-3 p-3 text-center h-100 bg-light'>
                <p className='text-muted font-size-13 mb-2'>
                  Montant total (filtré)
                </p>
                <span className='text-info fs-5 fw-semibold'>
                  {formatPrice(sumTotalAmount)} F
                </span>
              </div>
            </Col>
          </Row>

          {error && (
            <div className='text-danger text-center mb-3'>
              Erreur de chargement des données
            </div>
          )}

          {!error && (totalDevis > 0 || isFetching) && (
            <ListPaginationBar
              page={page}
              totalPages={totalPages}
              total={totalDevis}
              onPageChange={setPage}
              isLoading={isFetching}
            />
          )}

          {showLoader && <LoadingSpiner />}

          {!error && !showLoader && devisPage.length === 0 && (
            <div className='text-center py-5'>
              <p className='text-muted font-size-16 mb-3'>
                {isSearchActive
                  ? `Aucun devis trouvé pour « ${debouncedSearch} »`
                  : 'Aucun devis enregistré !'}
              </p>
              {!isSearchActive && (
                <Button color='info' onClick={() => navigate('/newDevis')}>
                  <i className='fas fa-plus me-1'></i>
                  Ajouter un Devis
                </Button>
              )}
            </div>
          )}

          {!error &&
            devisPage.length > 0 &&
            devisPage.map((dev, index) => (
              <Row
                key={dev._id}
                className='d-flex flex-column justify-content-center'
                style={{
                  opacity: isFetching ? 0.7 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                <Col className='col-sm-auto mb-3'>
                  <div className='d-flex gap-4 justify-content-center align-items-center flex-wrap'>
                    <Button color='info' onClick={reactToPrintFn}>
                      <i className='fas fa-print me-1'></i>
                      Imprimer
                    </Button>
                    <Button color='danger' onClick={exportPDFFacture}>
                      <i className='fas fa-paper-plane me-1'></i>
                      Télécharger en PDF
                    </Button>
                    <Button
                      color='warning'
                      onClick={() => navigate(`/updateDevis/${dev?._id}`)}
                    >
                      <i className='fas fa-edit me-1'></i>
                      Modifier
                    </Button>
                    <Button
                      color='danger'
                      onClick={() => {
                        deleteButton(dev?._id, 'Ce Devis', deleteDevis);
                      }}
                    >
                      <i className='fas fa-trash me-1'></i>
                      Supprimer
                    </Button>
                  </div>
                </Col>

                <Card
                  ref={contentRef}
                  id='facture'
                  className='d-flex justify-content-center border border-info'
                  style={{
                    boxShadow: '0px 0px 10px rgba(100, 169, 238, 0.5)',
                    borderRadius: '15px',
                    width: '583px',
                    margin: '5px auto 24px',
                    position: 'relative',
                  }}
                >
                  <CardBody>
                    <FactureHeader />
                    <div className='d-flex justify-content-between align-item-center mt-2'>
                      <CardText className='font-size-18'>
                        <strong>Motif: Devis des articles </strong>
                        <span className='text-danger ms-2 font-size-14'>
                          N° {(page - 1) * limit + index + 1}
                        </span>
                      </CardText>
                      <CardText>
                        <strong> Date:</strong>{' '}
                        {new Date(dev.createdAt).toLocaleDateString()}
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
                          {dev?.items?.map((article) => (
                            <tr key={article._id}>
                              <td>{article?.quantity}</td>
                              <td className='text-wrap'>
                                {capitalizeWords(article?.produit?.name)}
                              </td>
                              <td>{formatPrice(article?.customerPrice)} F</td>
                              <td>
                                {formatPrice(
                                  article?.customerPrice * article?.quantity
                                )}{' '}
                                F
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <CardFooter>
                      <CardText className='text-center mb-0'>
                        Total:{' '}
                        <strong style={{ fontSize: '14px' }}>
                          {formatPrice(dev?.totalAmount)} F
                        </strong>
                      </CardText>
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
