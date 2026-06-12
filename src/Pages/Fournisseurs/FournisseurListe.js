import React, { useEffect, useState } from 'react';
import { Button, Card, CardBody, Col, Container, Row } from 'reactstrap';
import Breadcrumbs from '../../components/Common/Breadcrumb';
import FormModal from '../components/FormModal';
import LoadingSpiner from '../components/LoadingSpiner';
import ListPaginationBar from '../components/ListPaginationBar';
import useDebouncedValue from '../../Hooks/useDebouncedValue';
import {
  capitalizeWords,
  formatPhoneNumber,
} from '../components/capitalizeFunction';
import { deleteButton } from '../components/AlerteModal';
// Ancien import — chargeait TOUS les fournisseurs + filtre client
// import { useAllFournisseur, useDeleteFournisseur } from '../../Api/queriesFournisseur';
import {
  usePaginationFournisseurs,
  useDeleteFournisseur,
} from '../../Api/queriesFournisseur';
import FournisseurForm from './FournisseurForm';

export default function FournisseurListe() {
  const [form_modal, setForm_modal] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 50;

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data: items, isLoading, error, isFetching } =
    usePaginationFournisseurs(page, limit, debouncedSearch);

  // Ancien code — conservé en commentaire
  // const { data: fournisseurData, isLoading, error } = useAllFournisseur();
  // const filteredFournisseurs = fournisseurData?.filter(...);

  const fournisseursPage = items?.results?.data ?? [];
  const totalFournisseurs = items?.results?.total ?? 0;
  const totalPages = items?.results?.totalPages ?? 0;

  const { mutate: deleteFournisseur, isDeleting } = useDeleteFournisseur();
  const [fournisseurToUpdate, setFournisseurToUpdate] = useState(null);
  const [formModalTitle, setFormModalTitle] = useState(
    'Ajouter un Fournisseur'
  );

  const showLoader = isLoading && fournisseursPage.length === 0;
  const isSearchActive = debouncedSearch.trim().length > 0;

  const resetSearch = () => setSearchTerm('');

  function tog_form_modal() {
    setForm_modal(!form_modal);
  }

  return (
    <React.Fragment>
      <div className='page-content'>
        <Container fluid>
          <Breadcrumbs
            title='Fournisseurs'
            breadcrumbItem='Liste des fournisseurs'
          />

          <FormModal
            form_modal={form_modal}
            setForm_modal={setForm_modal}
            tog_form_modal={tog_form_modal}
            modal_title={formModalTitle}
            size='md'
            bodyContent={
              <FournisseurForm
                fournisseurToEdit={fournisseurToUpdate}
                tog_form_modal={tog_form_modal}
              />
            }
          />

          <Row>
            <Col lg={12}>
              <Card>
                <CardBody>
                  <div id='fournisseursList'>
                    {/* ─── Ligne 1 : action + total | recherche ─── */}
                    <Row className='g-3 mb-3 align-items-center'>
                      <Col md={6} lg={5}>
                        <div className='d-flex flex-wrap align-items-center gap-3'>
                          <Button
                            color='info'
                            className='add-btn'
                            id='create-btn'
                            size='sm'
                            onClick={() => {
                              setFournisseurToUpdate(null);
                              tog_form_modal();
                            }}
                          >
                            <i className='fas fa-ambulance me-1'></i>
                            Ajouter un Fournisseur
                          </Button>
                          <p className='text-muted mb-0 font-size-14'>
                            Total affiché :{' '}
                            <span className='text-warning fw-semibold'>
                              {totalFournisseurs}
                            </span>{' '}
                            fournisseur{totalFournisseurs > 1 ? 's' : ''}
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
                              onClick={resetSearch}
                            >
                              <i className='ri-refresh-line me-1'></i>
                              Réinitialiser
                            </Button>
                          )}
                          <div className='search-box flex-grow-1 flex-md-grow-0'>
                            <input
                              type='text'
                              className='form-control search border border-dark rounded'
                              placeholder='Nom, email, téléphone…'
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              style={{ minWidth: '220px' }}
                            />
                          </div>
                        </div>
                      </Col>
                    </Row>

                    {/* ─── Ligne 2 : synthèse du jeu filtré ─── */}
                    <Row className='g-3 mb-3'>
                      <Col sm={6} md={4}>
                        <div className='border rounded-3 p-3 text-center h-100 bg-light'>
                          <p className='text-muted font-size-13 mb-2'>
                            Fournisseurs (filtrés)
                          </p>
                          <span className='text-warning fs-4 fw-semibold'>
                            {totalFournisseurs}
                          </span>
                        </div>
                      </Col>
                      <Col sm={6} md={8}>
                        <div className='border rounded-3 p-3 h-100 bg-light d-flex flex-column justify-content-center'>
                          <p className='text-muted font-size-13 mb-1'>
                            Recherche serveur
                          </p>
                          <p className='mb-0 font-size-14'>
                            {isSearchActive ? (
                              <>
                                Résultats pour{' '}
                                <span className='text-info fw-semibold'>
                                  « {debouncedSearch} »
                                </span>
                              </>
                            ) : (
                              'Tapez un nom, un email ou un téléphone pour filtrer la liste.'
                            )}
                          </p>
                        </div>
                      </Col>
                    </Row>

                    {error && (
                      <div className='text-danger text-center mb-3'>
                        Erreur de chargement des données
                      </div>
                    )}

                    {!error && (totalFournisseurs > 0 || isFetching) && (
                      <ListPaginationBar
                        page={page}
                        totalPages={totalPages}
                        total={totalFournisseurs}
                        onPageChange={setPage}
                        isLoading={isFetching}
                      />
                    )}

                    {showLoader && <LoadingSpiner />}

                    <div className='table-responsive table-card mt-3 mb-1'>
                      {!error && !showLoader && fournisseursPage.length === 0 && (
                        <div className='text-center text-muted py-4'>
                          {isSearchActive
                            ? `Aucun fournisseur trouvé pour « ${debouncedSearch} »`
                            : 'Aucun fournisseur pour le moment !'}
                        </div>
                      )}

                      {!error && fournisseursPage.length > 0 && (
                        <table
                          className='table align-middle table-nowrap table-hover'
                          id='fournisseurTable'
                          style={{
                            opacity: isFetching ? 0.7 : 1,
                            transition: 'opacity 0.2s',
                          }}
                        >
                          <thead className='table-light'>
                            <tr className='text-center'>
                              <th scope='col' style={{ width: '50px' }}>
                                ID
                              </th>
                              <th>Nom</th>
                              <th>Prénom</th>
                              <th>Adresse Email</th>
                              <th>Domicile</th>
                              <th>Téléphone</th>
                              <th>Action</th>
                            </tr>
                          </thead>

                          <tbody className='text-center'>
                            {fournisseursPage.map((fournisseur, index) => (
                              <tr key={fournisseur._id}>
                                <th scope='row'>
                                  {(page - 1) * limit + index + 1}
                                </th>
                                <td>
                                  {capitalizeWords(fournisseur.firstName)}
                                </td>
                                <td>
                                  {capitalizeWords(fournisseur.lastName)}
                                </td>
                                <td>
                                  {fournisseur.emailAdresse || '-------'}
                                </td>
                                <td>
                                  {capitalizeWords(fournisseur.adresse)}
                                </td>
                                <td>
                                  {formatPhoneNumber(fournisseur.phoneNumber)}
                                </td>
                                <td>
                                  <div className='d-flex gap-2 justify-content-center'>
                                    <div className='edit'>
                                      <button
                                        type='button'
                                        className='btn btn-sm btn-success edit-item-btn'
                                        onClick={() => {
                                          setFormModalTitle(
                                            'Modifier les données'
                                          );
                                          setFournisseurToUpdate(fournisseur);
                                          tog_form_modal();
                                        }}
                                      >
                                        <i className='ri-pencil-fill text-white'></i>
                                      </button>
                                    </div>
                                    {isDeleting && <LoadingSpiner />}
                                    {!isDeleting && (
                                      <div className='remove'>
                                        <button
                                          type='button'
                                          className='btn btn-sm btn-danger remove-item-btn'
                                          onClick={() => {
                                            deleteButton(
                                              fournisseur._id,
                                              `${fournisseur.firstName} ${fournisseur.lastName}`,
                                              deleteFournisseur
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
