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
import FormModal from '../components/FormModal';

import LoadingSpiner from '../components/LoadingSpiner';
import ListPaginationBar from '../components/ListPaginationBar';
import { capitalizeWords, formatPrice } from '../components/capitalizeFunction';

import { deleteButton } from '../components/AlerteModal';
import defaultImg from './../../assets/images/no_image.png';
import { useNavigate } from 'react-router-dom';
import ProduitForm from './ProduitForm';
// Ancien import — chargeait TOUS les produits d'un coup
// import { useAllProduit, useDeleteProduit } from '../../Api/queriesProduits';
import {
  usePaginationProduits,
  useDeleteProduit,
} from '../../Api/queriesProduits';
import { connectedUserRole } from '../Authentication/userInfos';
import useDebouncedValue from '../../Hooks/useDebouncedValue';

export default function ProduitListe() {
  const [form_modal, setForm_modal] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 24;

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 400);

  /**
   * Quand la recherche debouncée change, on revient à la page 1
   * pour afficher les premiers résultats filtrés (pas une page vide).
   */
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data: items, isLoading, error, isFetching } = usePaginationProduits(
    page,
    limit,
    debouncedSearch
  );

  // Ancien code — conservé en commentaire
  // const { data: produits, isLoading, error } = useAllProduit();
  // const filterSearchProduits = useMemo(() => produits?.filter(...), [produits, searchTerm]);
  // const totalProduitAchatPrice = useMemo(() => filterSearchProduits?.reduce(...), [...]);

  const produitsPage = items?.results?.data ?? [];
  const totalProduits = items?.results?.total ?? 0;
  const totalPages = items?.results?.totalPages ?? 0;
  const totalValeurBoutique = items?.results?.totalValeurBoutique ?? 0;

  const { mutate: deleteProduit } = useDeleteProduit();
  const [produitToUpdate, setProduitToUpdate] = useState(null);
  const [formModalTitle, setFormModalTitle] = useState('Ajouter un Produit');

  const navigate = useNavigate();

  function navigateToProduitApprovisonnement(id) {
    navigate(`/approvisonnement/${id}`);
  }

  function tog_form_modal() {
    setForm_modal(!form_modal);
  }

  const showLoader = isLoading && produitsPage.length === 0;
  const isSearchActive = debouncedSearch.trim().length > 0;

  return (
    <React.Fragment>
      <div className='page-content'>
        <Container fluid>
          <Breadcrumbs title='Produits' breadcrumbItem='Liste de Produits' />

          <FormModal
            form_modal={form_modal}
            setForm_modal={setForm_modal}
            tog_form_modal={tog_form_modal}
            modal_title={formModalTitle}
            size='md'
            bodyContent={
              <ProduitForm
                produitToEdit={produitToUpdate}
                tog_form_modal={tog_form_modal}
              />
            }
          />

          <Row>
            <Col lg={12}>
              <Card>
                <CardBody>
                  <div id='produitsList'>
                    <Row className='g-4 mb-3'>
                      {connectedUserRole === 'admin' && (
                        <Col className='col-sm-auto'>
                          <div className='d-flex gap-1'>
                            <Button
                              color='info'
                              className='add-btn'
                              id='create-btn'
                              onClick={() => {
                                setProduitToUpdate(null);
                                tog_form_modal();
                              }}
                            >
                              <i className='mdi mdi-sitemap align-center me-1'></i>{' '}
                              Ajouter un Produit
                            </Button>
                          </div>
                        </Col>
                      )}
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
                        <p className='text-center font-size-15 mt-2'>
                          Valeur de Boutique:{' '}
                          <span className='text-warning'>
                            {formatPrice(totalValeurBoutique)}
                          </span>
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
                  : 'Aucun Produit trouvé'}
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
                  {connectedUserRole === 'admin' && (
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
                            className='edit-item-btn  text-secondary'
                            onClick={() => {
                              setFormModalTitle('Modifier les données');
                              setProduitToUpdate(prod);
                              tog_form_modal();
                            }}
                          >
                            <i className='ri-pencil-fill align-bottom me-2 '></i>
                            Modifier
                          </DropdownItem>
                          <DropdownItem
                            className='edit-item-btn text-warning'
                            onClick={() => {
                              navigateToProduitApprovisonnement(prod?._id);
                            }}
                          >
                            <i className='bx bx-analyse align-bottom me-2 '></i>
                            Approvisonner
                          </DropdownItem>

                          <DropdownItem
                            className='remove-item-btn text-danger '
                            onClick={() => {
                              deleteButton(
                                prod?._id,
                                prod?.name,
                                deleteProduit
                              );
                            }}
                          >
                            <i className='ri-delete-bin-fill align-bottom me-2 '></i>
                            Supprimer
                          </DropdownItem>
                        </DropdownMenu>
                      </UncontrolledDropdown>
                    </div>
                  )}
                  <CardTitle
                    style={{
                      position: 'absolute',
                      top: '5%',
                      left: '5%',
                    }}
                  >
                    {formatPrice(prod?.achatPrice ?? 0)} F
                  </CardTitle>
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
                      {prod?.stock >= 10 ? (
                        <span style={{ color: 'gray' }}>
                          {' '}
                          {formatPrice(prod?.stock)}
                        </span>
                      ) : (
                        <span className='text-danger'>
                          {' '}
                          {formatPrice(prod?.stock)}
                        </span>
                      )}
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
