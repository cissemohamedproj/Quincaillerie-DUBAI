import React, { useState } from 'react';
import { Button, Card, CardBody, Col, Container, Row } from 'reactstrap';
import Breadcrumbs from '../../components/Common/Breadcrumb';
import FormModal from '../components/FormModal';
import LoadingSpiner from '../components/LoadingSpiner';
import {
  capitalizeWords,
  formatPhoneNumber,
  formatPrice,
} from '../components/capitalizeFunction';
import { deleteButton } from '../components/AlerteModal';
import { useAllAchats, useDeleteAchat } from '../../Api/queriesAchat';
import AchatForm from './AchatForm';

export default function AchatListe() {
  const [form_modal, setForm_modal] = useState(false);
  const [formModalTitle, setFormModalTitle] = useState('Ajouter un Achat');
  const { data: achatData, isLoading, error } = useAllAchats();
  const { mutate: deleteAchat, isDeleting } = useDeleteAchat();
  const [achatToUpdate, setAchatToUpdate] = useState(null);
  const [todayAchat, setTodayAchat] = useState(false);
  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Fonction pour la recherche
  const filterSearchAchat = achatData
    ?.filter((achat) => {
      const search = searchTerm.toLowerCase();

      return (
        achat.article.toLowerCase().includes(search) ||
        `${achat.fournisseur.firsName} ${achat.fournisseur.lastName}`
          .toLowerCase()
          .includes(search) ||
        (achat.fournisseur?.phoneNumber || '').toString().includes(search) ||
        achat.articleTotalAmount.toString().includes(search) ||
        achat.quantity.toString().includes(search) ||
        achat.totalAmountPaye.toString().includes(search) ||
        new Date(achat.dateOfAchat)
          .toLocaleDateString('fr-Fr')
          .toString()
          .includes(search)
      );
    })
    ?.filter((item) => {
      if (todayAchat) {
        return (
          new Date(item?.dateOfAchat).toLocaleDateString() ===
          new Date().toLocaleDateString()
        );
      }
      return true;
    });

  // Total Expense
  const sumTotalAchat = filterSearchAchat?.reduce(
    (curr, item) => (curr += item?.articleTotalAmount),
    0
  );

  // Ouverture de Modal Form
  function tog_form_modal() {
    setForm_modal(!form_modal);
  }
  return (
    <React.Fragment>
      <div className='page-content'>
        <Container fluid>
          <Breadcrumbs title='Comptabilité' breadcrumbItem='Achat' />

          {/* -------------------------- */}
          <FormModal
            form_modal={form_modal}
            setForm_modal={setForm_modal}
            tog_form_modal={tog_form_modal}
            modal_title={formModalTitle}
            size='md'
            bodyContent={
              <AchatForm
                achatToEdit={achatToUpdate}
                tog_form_modal={tog_form_modal}
              />
            }
          />

          {/* -------------------- */}
          <Row>
            <Col lg={12}>
              <Card>
                <CardBody>
                  <div id='achatList'>
                    <Row className='g-4 mb-3'>
                      <Col className='col-sm-auto'>
                        <div className='d-flex gap-1'>
                          <Button
                            color='info'
                            className='add-btn'
                            id='create-btn'
                            onClick={() => {
                              setAchatToUpdate(null);
                              tog_form_modal();
                            }}
                          >
                            <i className='fas fa-dollar-sign align-center me-1'></i>{' '}
                            Ajouter un Achat
                          </Button>
                        </div>
                      </Col>

                      <Col className='col-sm'>
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
                              className='form-control search border border-black rounded'
                              placeholder='Rechercher...'
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                        </div>
                      </Col>
                    </Row>
                    {!isLoading && (
                      <div className='d-flex justify-content-around mt-4 flex-wrap'>
                        <h6 className=''>
                          Total Achats:{' '}
                          <span className='text-danger'>
                            {formatPrice(sumTotalAchat)} F{' '}
                          </span>
                        </h6>
                        <div className='mx-4 d-flex gap-2 text-warning'>
                          <input
                            type='checkbox'
                            className='form-check-input'
                            id='filterToday'
                            onChange={() => setTodayAchat(!todayAchat)}
                          />
                          <label
                            className='form-check-label'
                            htmlFor='filterToday'
                          >
                            Achats d'Aujourd'hui
                          </label>
                        </div>
                      </div>
                    )}
                    {error && (
                      <div className='text-danger text-center'>
                        Erreur de chargement des données
                      </div>
                    )}
                    {isLoading && <LoadingSpiner />}

                    <div className='table-responsive table-card mt-3 mb-1'>
                      {filterSearchAchat?.length === 0 && (
                        <div className='text-center text-mutate'>
                          Aucun Achat dans la liste !
                        </div>
                      )}
                      {!error && !isLoading && filterSearchAchat.length > 0 && (
                        <table
                          className='table align-middle table-nowrap'
                          id='achatTable'
                        >
                          <thead className='table-light'>
                            <tr className='text-center '>
                              <th data-sort='date' style={{ width: '50px' }}>
                                Date d'Achat
                              </th>

                              <th>Article Acheté</th>
                              <th>Montant d'Achat</th>
                              <th>Quantité Acheté</th>
                              <th>Montant Payé</th>
                              <th>Fournisseur</th>
                              <th>Contact Fournisseur</th>

                              <th data-sort='action'>Action</th>
                            </tr>
                          </thead>
                          <tbody className='list form-check-all'>
                            {filterSearchAchat?.length > 0 &&
                              filterSearchAchat?.map((achat, index) => (
                                <tr key={index} className='text-center'>
                                  <td>
                                    {new Date(
                                      achat.dateOfAchat
                                    ).toLocaleDateString()}{' '}
                                  </td>

                                  <td className='text-wrap'>
                                    {capitalizeWords(achat.article)}
                                  </td>

                                  <td className='text-danger'>
                                    {formatPrice(achat.articleTotalAmount)}
                                    {' F '}
                                  </td>
                                  <td>{formatPrice(achat.quantity || 0)}</td>
                                  <td className='text-success'>
                                    {formatPrice(achat.totalAmountPaye)}
                                    {' F '}
                                  </td>
                                  <td className='text-wrap'>
                                    {capitalizeWords(
                                      achat.fournisseur?.firstName +
                                        ' - ' +
                                        achat.fournisseur?.lastName
                                    )}
                                  </td>

                                  <td className='text-wrap'>
                                    {formatPhoneNumber(
                                      achat.fournisseur?.phoneNumber
                                    )}
                                  </td>

                                  <td>
                                    <div className='d-flex gap-2'>
                                      <div className='edit'>
                                        <button
                                          className='btn btn-sm btn-success edit-item-btn'
                                          onClick={() => {
                                            setFormModalTitle(
                                              'Modifier les données'
                                            );
                                            setAchatToUpdate(achat);
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
                                            className='btn btn-sm btn-danger remove-item-btn'
                                            data-bs-toggle='modal'
                                            data-bs-target='#deleteRecordModal'
                                            onClick={() => {
                                              deleteButton(
                                                achat._id,
                                                `achat de ${achat?.article} F
                                                   `,
                                                deleteAchat
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
