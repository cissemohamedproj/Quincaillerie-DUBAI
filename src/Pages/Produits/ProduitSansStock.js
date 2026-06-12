import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardText,
  CardTitle,
  Col,
  Container,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Row,
  UncontrolledDropdown,
} from 'reactstrap';
import Breadcrumbs from '../../components/Common/Breadcrumb';

import LoadingSpiner from '../components/LoadingSpiner';
import ListPaginationBar from '../components/ListPaginationBar';
import { capitalizeWords, formatPrice } from '../components/capitalizeFunction';

import defaultImg from './../../assets/images/no_image.png';
import { useNavigate } from 'react-router-dom';
// Ancien import — chargeait tous les produits stock < 10
// import {
//   useAllProduitWithStockInferieure,
//   useDeleteProduit,
// } from '../../Api/queriesProduits';
import {
  usePaginationProduitStockFaible,
  useDeleteProduit,
} from '../../Api/queriesProduits';
import { deleteButton } from '../components/AlerteModal';
import useDebouncedValue from '../../Hooks/useDebouncedValue';

export default function ProduitSansStock() {
  const [page, setPage] = useState(1);
  const limit = 24;

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data: items, isLoading, error, isFetching } =
    usePaginationProduitStockFaible(page, limit, debouncedSearch);

  // Ancien code — conservé en commentaire
  // const { data: produits, isLoading, error } = useAllProduitWithStockInferieure();
  // const filterSearchProduits = produits?.filter((prod) => { ... });

  const produitsPage = items?.results?.data ?? [];
  const totalProduits = items?.results?.total ?? 0;
  const totalPages = items?.results?.totalPages ?? 0;

  const { mutate: deleteProduit } = useDeleteProduit();

  const navigate = useNavigate();

  function navigateToProduitApprovisonnement(id) {
    navigate(`/approvisonnement/${id}`);
  }

  const showLoader = isLoading && produitsPage.length === 0;
  const isSearchActive = debouncedSearch.trim().length > 0;

  return (
    <React.Fragment>
      <div className='page-content'>
        <Container fluid>
          <Breadcrumbs
            title='Produits'
            breadcrumbItem='Produits Stock Terminé'
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

          {/* Pagination EN HAUT */}
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
                  : 'Aucun Produit sans stock pour le moment'}
              </div>
            )}
            {!error &&
              produitsPage.map((prod) => (
                <Card
                  key={prod._id}
                  style={{
                    boxShadow: '0px 0px 10px rgba(121,3,105,0.5)',
                    borderRadius: '15px',
                    padding: '10px 20px',
                    display: 'flex',
                    flexWrap: 'nowrap',
                    alignItems: 'center',
                    position: 'relative',
                    width: '210px',
                    opacity: isFetching ? 0.7 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '5%',
                      right: '5%',
                    }}
                  >
                    <UncontrolledDropdown className='dropdown d-inline-block'>
                      <DropdownToggle
                        className='btn btn-soft-secondary btn-sm'
                        tag='button'
                      >
                        <i className='bx bx-caret-down-square fs-2 text-info'></i>
                      </DropdownToggle>
                      <DropdownMenu className='dropdown-menu-end'>
                        <DropdownItem
                          className='edit-item-btn'
                          onClick={() => {
                            navigateToProduitApprovisonnement(prod?._id);
                          }}
                        >
                          <i className='bx bx-analyse align-bottom me-2 text-muted'></i>
                          Approvisonner
                        </DropdownItem>
                        <DropdownItem
                          className='remove-item-btn text-danger '
                          onClick={() => {
                            deleteButton(prod?._id, prod?.name, deleteProduit);
                          }}
                        >
                          <i className='ri-delete-bin-fill align-bottom me-2 '></i>
                          Supprimer
                        </DropdownItem>
                      </DropdownMenu>
                    </UncontrolledDropdown>
                  </div>
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
                      Stock:
                      <span className='text-danger'>
                        {' '}
                        {formatPrice(prod?.stock)}
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
