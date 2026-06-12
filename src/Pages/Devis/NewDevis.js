import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardImg,
  CardText,
  CardTitle,
  Col,
  Container,
  Input,
  Row,
} from 'reactstrap';

import Breadcrumbs from '../../components/Common/Breadcrumb';
import LoadingSpiner from '../components/LoadingSpiner';
import ListPaginationBar from '../components/ListPaginationBar';
import useDebouncedValue from '../../Hooks/useDebouncedValue';
import { capitalizeWords, formatPrice } from '../components/capitalizeFunction';
import {
  errorMessageAlert,
  successMessageAlert,
} from '../components/AlerteModal';
import defaultImg from './../../assets/images/no_image.png';
import { useNavigate } from 'react-router-dom';
import { useCreateDevis } from '../../Api/queriesDevis';
// Ancien import — chargeait TOUS les produits + filtre client
// import { useAllProduit } from '../../Api/queriesProduits';
import { usePaginationProduits } from '../../Api/queriesProduits';

export default function NewDevis() {
  const navigate = useNavigate();

  /** Pagination + recherche serveur — 24 produits par page (grille de cartes) */
  const [page, setPage] = useState(1);
  const limit = 24;
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 400);

  /** Retour page 1 quand la recherche debouncée change */
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data: items, isLoading, error, isFetching } = usePaginationProduits(
    page,
    limit,
    debouncedSearch
  );

  // Ancien code — conservé en commentaire
  // const { data: produitsData, isLoading, error } = useAllProduit();
  // const filterSearchProduits = produitsData?.filter((prod) => { ... });

  const produitsPage = items?.results?.data ?? [];
  const totalProduits = items?.results?.total ?? 0;
  const totalPages = items?.results?.totalPages ?? 0;

  const showLoader = isLoading && produitsPage.length === 0;
  const isSearchActive = debouncedSearch.trim().length > 0;

  const { mutate: createDevis } = useCreateDevis();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Ajoute des produits dans le panier sans besoins de la base de données
  const [cartItems, setCartsItems] = useState([]);

  //  Fonction pour ajouter les produit dans base de données
  const addToCart = (produit) => {
    setCartsItems((prevCart) => {
      // On vérifie si le produit n'existe pas déjà
      const existingItem = prevCart.find(
        (item) => item.produit._id === produit._id
      );

      //  Si le produit existe on incrémente la quantité
      if (existingItem) {
        return prevCart.map((item) =>
          item.produit._id === produit._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      //  Sinon on ajoute le produit avec la quantité (1)
      return [
        ...prevCart,
        { produit, quantity: 1, customerPrice: produit.price },
      ];
    });
  };

  // Fonction pour Diminuer la quantité :dans le panier
  // Si la quantité est 1 alors on le supprime
  const decreaseQuantity = (produitId) => {
    setCartsItems((prevCart) =>
      prevCart
        .map((item) =>
          item.produit._id === produitId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Fonction pour augmenter la quantité dans le panier
  const increaseQuantity = (produitId) => {
    setCartsItems((prevCart) =>
      prevCart.map((item) =>
        item.produit._id === produitId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  // Fonction pour vider les produits dans le panier
  const clearCart = () => {
    setCartsItems([]);
  };

  // Fonction pour calculer le total des élements dans le panier
  const totalAmount = cartItems.reduce(
    (total, item) => total + item.customerPrice * item.quantity,
    0
  );

  // Form validation
  const onSubmit = () => {
    // Vérification de quantité dans le STOCK
    if (cartItems.length === 0) return;

    setIsSubmitting(true);
    const payload = {
      // Les ARTICLES de panier
      items: cartItems.map((item) => ({
        produit: item.produit._id,
        quantity: item.quantity,
        customerPrice: item.customerPrice,
      })),
      totalAmount,
    };

    createDevis(payload, {
      onSuccess: () => {
        // Après on vide le panier
        clearCart();
        successMessageAlert(capitalizeWords('Devis Enregistré avec succès !'));
        setIsSubmitting(false);
        navigate('/devisListe');
      },
      onError: (err) => {
        const message =
          err?.response?.data?.message ||
          err.message ||
          "Erreur lors de l'Enregistrement !";
        errorMessageAlert(message);
        setIsSubmitting(false);
      },
    });

    setTimeout(() => {
      if (isLoading) {
        errorMessageAlert('Une erreur est survenue. Veuillez réessayer !');
        setIsSubmitting(false);
      }
    }, 10000);
  };

  return (
    <React.Fragment>
      <div className='page-content'>
        <Container fluid>
          <Breadcrumbs title='Devis' breadcrumbItem='Nouveau Devis' />

          {/* ---------------------------------------------------------------------- */}
          {/* ---------------------------------------------------------------------- */}
          {/* Panier */}
          <Row>
            <Col sm={12}>
              {/* Bouton */}
              {isSubmitting && <LoadingSpiner />}

              {cartItems.length > 0 && !isSubmitting && (
                <div className='d-flex gap-4 my-3'>
                  <Button
                    color='warning'
                    className='fw-bold font-size-11'
                    onClick={clearCart}
                  >
                    <i className='fas fa-window-close'></i>
                  </Button>

                  <div className='d-grid' style={{ width: '100%' }}>
                    <Button
                      color='primary'
                      className='fw-bold'
                      onClick={onSubmit}
                    >
                      Enregistrer le Devis
                    </Button>
                  </div>
                </div>
              )}
              {/* Bouton */}

              <Card>
                <CardBody style={{ height: '280px', overflowY: 'scroll' }}>
                  <CardTitle className='mb-4'>
                    <div className='d-flex justify-content-between align-items-center'>
                      <h4>Panier</h4>
                      <h5 className='text-warning'>
                        Total : {formatPrice(totalAmount)} F
                      </h5>
                    </div>
                  </CardTitle>

                  {cartItems.length === 0 && (
                    <p className='text-center'>
                      Veuillez cliquez sur un produit pour l'ajouter dans le
                      panier
                    </p>
                  )}
                  {cartItems.map((item) => (
                    <div
                      key={item.produit._id}
                      className='d-flex justify-content-between align-items-center mb-2 border-bottom border-black p-2 shadow shadow-md'
                    >
                      <div>
                        <strong>{capitalizeWords(item.produit.name)}</strong>
                        <div>
                          P.U: client
                          <Input
                            type='number'
                            min={0}
                            value={item.customerPrice}
                            onChange={(e) => {
                              const newPrice = parseFloat(e.target.value) || 0;
                              setCartsItems((prevCart) =>
                                prevCart.map((i) =>
                                  i.produit._id === item.produit._id
                                    ? { ...i, customerPrice: newPrice }
                                    : i
                                )
                              );
                            }}
                            style={{
                              width: '100px',
                              border: '1px solid #cdc606 ',
                            }}
                          />
                        </div>
                      </div>

                      <div className='d-flex align-items-center gap-2'>
                        <Button
                          color='danger'
                          size='sm'
                          onClick={() => decreaseQuantity(item.produit._id)}
                        >
                          -
                        </Button>

                        <input
                          type='number'
                          min={1}
                          value={item.quantity}
                          onClick={(e) => e.stopPropagation()} // Évite le clic sur la carte
                          onChange={(e) => {
                            const value = parseInt(e.target.value, 10);
                            if (!isNaN(value) && value > 0) {
                              setCartsItems((prevCart) =>
                                prevCart.map((i) =>
                                  i.produit._id === item.produit._id
                                    ? { ...i, quantity: value }
                                    : i
                                )
                              );
                            }
                          }}
                          style={{
                            width: '60px',
                            textAlign: 'center',
                            border: '1px solid orange',
                            borderRadius: '5px',
                          }}
                        />

                        <Button
                          color='success'
                          size='sm'
                          onClick={() => increaseQuantity(item.produit._id)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </Col>
          </Row>
          {/* ------------------------------------------------------------- */}
          {/* Liste des produits — pagination + recherche serveur */}
          <div>
            <Card>
              <CardBody>
                <Row className='g-3 mb-3 align-items-center'>
                  <Col md={6}>
                    <p className='text-muted mb-0 font-size-14'>
                      Produits disponibles :{' '}
                      <span className='text-warning fw-semibold'>
                        {totalProduits}
                      </span>
                      {isSearchActive && (
                        <span className='text-info'> · recherche active</span>
                      )}
                    </p>
                  </Col>
                  <Col md={6}>
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
                          placeholder='Nom, stock, prix…'
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{ minWidth: '220px' }}
                        />
                      </div>
                    </div>
                  </Col>
                </Row>

                {!error && (totalProduits > 0 || isFetching) && (
                  <ListPaginationBar
                    page={page}
                    totalPages={totalPages}
                    total={totalProduits}
                    onPageChange={setPage}
                    isLoading={isFetching}
                  />
                )}

                {showLoader && <LoadingSpiner />}
                {error && (
                  <div className='text-danger text-center'>
                    Une erreur est survenue ! Veuillez actualiser la page.
                  </div>
                )}

                {!error && !showLoader && produitsPage.length === 0 && (
                  <div className='text-center text-muted py-4'>
                    {isSearchActive
                      ? `Aucun produit trouvé pour « ${debouncedSearch} »`
                      : 'Aucun produit en stock pour le moment.'}
                  </div>
                )}

                <Row>
                  <div
                    className='d-flex flex-wrap gap-3 justify-content-center'
                    style={{
                      opacity: isFetching ? 0.7 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {!error &&
                      produitsPage.length > 0 &&
                      produitsPage.map((produit) => (
                        <div key={produit._id}>
                          <Card
                            className='shadow shadow-lg'
                            onClick={() => addToCart(produit)}
                            style={{ cursor: 'pointer' }}
                          >
                            <CardImg
                              style={{
                                height: '100px',
                                objectFit: 'contain',
                              }}
                              src={
                                produit.imageUrl ? produit.imageUrl : defaultImg
                              }
                              alt={produit.name}
                            />
                            <CardBody>
                              <CardText className='text-center'>
                                {capitalizeWords(produit.name)}
                              </CardText>
                              {/* <CardText className='font-size-15 text-center'>
                                <strong>Catégorie: </strong>{' '}
                                <span className='text-info '>
                                  {' '}
                                  {capitalizeWords(produit?.category)}{' '}
                                </span>
                              </CardText> */}

                              <CardText className='text-center fw-bold'>
                                {formatPrice(produit.price)} F
                              </CardText>
                              <CardTitle className='text-center'>
                                Stock:
                                {produit.stock >= 10 ? (
                                  <span style={{ color: 'gray' }}>
                                    {' '}
                                    {formatPrice(produit?.stock)}
                                  </span>
                                ) : (
                                  <span className='text-danger'>
                                    {' '}
                                    {formatPrice(produit?.stock)}
                                  </span>
                                )}
                              </CardTitle>
                            </CardBody>
                          </Card>
                        </div>
                      ))}
                  </div>
                </Row>
              </CardBody>
            </Card>
          </div>
        </Container>
      </div>
    </React.Fragment>
  );
}
