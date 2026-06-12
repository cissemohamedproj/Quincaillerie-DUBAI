import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardText,
  CardTitle,
  Col,
  Container,
  Row,
} from 'reactstrap';
import Breadcrumbs from '../../components/Common/Breadcrumb';

import LoadingSpiner from '../components/LoadingSpiner';
import ListPaginationBar from '../components/ListPaginationBar';
import { capitalizeWords, formatPrice } from '../components/capitalizeFunction';

// Ancien import — chargeait tous les top produits via topProduitsCommande
// import { useGetTopProduitCommande } from '../../Api/queriesCommande';
import { usePaginationTopProduits } from '../../Api/queriesCommande';
import defaultImg from './../../assets/images/no_image.png';
import useDebouncedValue from '../../Hooks/useDebouncedValue';

export default function TopProduits() {
  const [page, setPage] = useState(1);
  const limit = 24;

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 400);

  /**
   * Retour page 1 à chaque nouvelle recherche pour afficher
   * les premiers résultats filtrés (évite une page vide).
   */
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data: items, isLoading, error, isFetching } = usePaginationTopProduits(
    page,
    limit,
    debouncedSearch
  );

  // Ancien code — conservé en commentaire
  // const { data: produits, isLoading, error } = useGetTopProduitCommande();
  // const filterSearchProduits = produits?.filter((prod) => { ... });

  const produitsPage = items?.results?.data ?? [];
  const totalProduits = items?.results?.total ?? 0;
  const totalPages = items?.results?.totalPages ?? 0;

  const showLoader = isLoading && produitsPage.length === 0;
  const isSearchActive = debouncedSearch.trim().length > 0;

  return (
    <React.Fragment>
      <div className='page-content'>
        <Container fluid>
          <Breadcrumbs
            title='Produits'
            breadcrumbItem='Produits Les Plus Achetés'
          />

          <Row>
            <Col lg={12}>
              <Card>
                <CardBody>
                  <div id='produitsList'>
                    <Row className='g-4 mb-3'>
                      <Col>
                        <p className='text-center font-size-15 mt-2'>
                          Produit Total:{' '}
                          <span className='text-warning'>{totalProduits}</span>
                          {isSearchActive && (
                            <span className='text-muted font-size-13'>
                              {' '}
                              (résultat{totalProduits > 1 ? 's' : ''} recherche)
                            </span>
                          )}
                        </p>
                      </Col>
                      <Col>
                        <div className='d-flex justify-content-sm-end gap-2'>
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
                              className='form-control search border border-dark rounded'
                              placeholder='Rechercher...'
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Pagination EN HAUT — avant la grille de cartes */}
          {!error && (totalProduits > 0 || isFetching) && (
            <ListPaginationBar
              page={page}
              totalPages={totalPages}
              total={totalProduits}
              onPageChange={setPage}
              isLoading={isFetching}
            />
          )}

          <div className='d-flex justify-content-center align-items-center gap-4 flex-wrap'>
            {showLoader && <LoadingSpiner />}
            {error && (
              <div className='text-danger text-center'>
                Erreur lors de chargement des données
              </div>
            )}
            {!error && !showLoader && produitsPage.length === 0 && (
              <div className='text-center'>
                {isSearchActive
                  ? `Aucun produit trouvé pour « ${debouncedSearch} »`
                  : 'Aucun produit commandé pour le moment'}
              </div>
            )}
            {!error &&
              produitsPage.map((prod) => (
                <Card
                  key={prod.produitId ?? prod.name}
                  style={{
                    boxShadow: '0px 0px 10px rgba(121,3,105,0.5)',
                    borderRadius: '15px',
                    padding: '10px 20px',
                    width: '210px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '3px dotted #160eb1',
                    opacity: isFetching ? 0.7 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <img
                    className='img-fluid'
                    style={{
                      borderRadius: '15px 15px 0 0',
                      height: '100px',
                      width: '60%',
                      objectFit: 'contain',
                    }}
                    src={prod?.imageUrl ? prod?.imageUrl : defaultImg}
                    alt={prod?.name}
                    loading='lazy'
                  />

                  <CardBody>
                    <CardText
                      className='fs-6 text-center'
                      style={{ width: '200px' }}
                    >
                      {capitalizeWords(prod?.name)}
                    </CardText>

                    <CardTitle className='text-center'>
                      {formatPrice(prod?.price)} F
                    </CardTitle>
                    <CardTitle className='text-center'>
                      Quantité:
                      <span className='text-success'>
                        {' '}
                        {formatPrice(prod?.totalQuantity)}
                      </span>
                    </CardTitle>
                  </CardBody>
                </Card>
              ))}
          </div>
        </Container>
      </div>
    </React.Fragment>
  );
}
