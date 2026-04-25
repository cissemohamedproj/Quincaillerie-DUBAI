import {
  Button,
  Col,
  Form,
  FormFeedback,
  FormGroup,
  Input,
  Label,
  Row,
} from 'reactstrap';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import {
  errorMessageAlert,
  successMessageAlert,
} from '../components/AlerteModal';
import LoadingSpiner from '../components/LoadingSpiner';
import { useState } from 'react';
import { useCreateAchat, useUpdateAchat } from '../../Api/queriesAchat';
import { useAllFournisseur } from '../../Api/queriesFournisseur';
import {
  capitalizeWords,
  formatPhoneNumber,
} from '../components/capitalizeFunction';

const AchatForm = ({ achatToEdit, tog_form_modal }) => {
  // Achat Query pour créer la Achat
  const { mutate: createAchat } = useCreateAchat();
  // Achat Query pour Mettre à jour la Achat
  const { mutate: updateAchat } = useUpdateAchat();
  // Fournisseur DATA
  const {
    data: fournisseurData,
    isLoading: fourniLoading,
    error: fourniError,
  } = useAllFournisseur();

  // State pour gérer le chargement
  const [isLoading, setIsLoading] = useState(false);

  // Form validation
  const validation = useFormik({
    // enableReinitialize : use this flag when initial values needs to be changed
    enableReinitialize: true,

    initialValues: {
      fournisseur: achatToEdit?.fournisseur?._id || undefined,
      article: achatToEdit?.article || '',
      articleTotalAmount: achatToEdit?.totalAmount || undefined,
      quantity: achatToEdit?.quantity || undefined,
      totalAmountPaye: achatToEdit?.totalAmount || undefined,
      dateOfAchat: achatToEdit?.dateOfAchat?.substring(0, 10) || '',
    },
    validationSchema: Yup.object({
      article: Yup.string().required('Ce champ est obligatoire'),
      articleTotalAmount: Yup.number()
        .min(0, 'Le montant ne peut pas être négatif')
        .required('Ce champ est obligatoire'),
      totalAmountPaye: Yup.number()
        .min(0, 'Le montant ne peut pas être négatif')
        .required('Ce champ est obligatoire'),
      dateOfAchat: Yup.date()
        .max(new Date(), "La date ne peut pas être supérieur à aujourd'hui")
        .required('Ce champ est obligatoire'),
    }),

    onSubmit: (values, { resetForm }) => {
      setIsLoading(true);

      // Si la méthode est pour mise à jour alors
      const achatDataLoaded = {
        ...values,
      };

      if (achatToEdit) {
        updateAchat(
          { id: achatToEdit._id, data: achatDataLoaded },
          {
            onSuccess: () => {
              successMessageAlert('Données mise à jour avec succès');
              setIsLoading(false);
              tog_form_modal();
            },
            onError: (err) => {
              errorMessageAlert(
                err?.response?.data?.message ||
                  err?.message ||
                  'Erreur lors de la mise à jour'
              );
              setIsLoading(false);
            },
          }
        );
      }

      // Sinon on créer un nouveau étudiant
      else {
        createAchat(values, {
          onSuccess: () => {
            successMessageAlert('Achat enregistrée avec succès');
            setIsLoading(false);
            resetForm();
            tog_form_modal();
          },
          onError: (err) => {
            const errorMessage =
              err?.response?.data?.message ||
              err?.message ||
              "Oh Oh ! une erreur est survenu lors de l'enregistrement";
            errorMessageAlert(errorMessage);
            setIsLoading(false);
          },
        });
      }
      setTimeout(() => {
        if (isLoading) {
          errorMessageAlert('Une erreur est survenue. Veuillez réessayer !');
          setIsLoading(false);
        }
      }, 10000);
    },
  });
  return (
    <Form
      className='needs-validation'
      onSubmit={(e) => {
        e.preventDefault();
        validation.handleSubmit();
        return false;
      }}
    >
      <Row>
        <Col md='12'>
          <FormGroup className='mb-3'>
            <Label htmlFor='article'>Article Achetée</Label>

            <Input
              name='article'
              placeholder="Entrez le nom de l'article achetée"
              type='text'
              className='form-control border-1 border-dark'
              border-1
              border-dark
              id='article'
              onChange={validation.handleChange}
              onBlur={validation.handleBlur}
              value={validation.values.article || ''}
              invalid={
                validation.touched.article && validation.errors.article
                  ? true
                  : false
              }
            />

            {validation.touched.article && validation.errors.article ? (
              <FormFeedback type='invalid'>
                {validation.errors.article}
              </FormFeedback>
            ) : null}
          </FormGroup>
        </Col>
      </Row>
      <Row>
        <Col md='6'>
          <FormGroup className='mb-3'>
            <Label htmlFor='articleTotalAmount'>Montant d'Achat</Label>

            <Input
              name='articleTotalAmount'
              type='number'
              min={0}
              className='form-control border-1 border-dark'
              placeholder="Entrez le montant total de l'achat"
              id='articleTotalAmount'
              onChange={validation.handleChange}
              onBlur={validation.handleBlur}
              value={validation.values.articleTotalAmount || ''}
              invalid={
                validation.touched.articleTotalAmount &&
                validation.errors.articleTotalAmount
                  ? true
                  : false
              }
            />
            {validation.touched.articleTotalAmount &&
            validation.errors.articleTotalAmount ? (
              <FormFeedback type='invalid'>
                {validation.errors.articleTotalAmount}
              </FormFeedback>
            ) : null}
          </FormGroup>
        </Col>
        <Col md='6'>
          <FormGroup className='mb-3'>
            <Label htmlFor='quantity'>Quantité Acheté</Label>

            <Input
              name='quantity'
              type='number'
              min={1}
              className='form-control border-1 border-dark'
              placeholder="Entrez la quantité total de l'achat"
              id='quantity'
              onChange={validation.handleChange}
              onBlur={validation.handleBlur}
              value={validation.values.quantity || ''}
              invalid={
                validation.touched.quantity && validation.errors.quantity
                  ? true
                  : false
              }
            />
            {validation.touched.quantity && validation.errors.quantity ? (
              <FormFeedback type='invalid'>
                {validation.errors.quantity}
              </FormFeedback>
            ) : null}
          </FormGroup>
        </Col>
        <Col md='12'>
          <FormGroup className='mb-3'>
            <Label htmlFor='totalAmountPaye'>Montant Payé</Label>

            <Input
              name='totalAmountPaye'
              type='number'
              min={0}
              max={validation.values.articleTotalAmount || undefined}
              className='form-control border-1 border-dark'
              placeholder='Entrez le montant payé'
              id='totalAmountPaye'
              onChange={validation.handleChange}
              onBlur={validation.handleBlur}
              value={validation.values.totalAmountPaye || ''}
              invalid={
                validation.touched.totalAmountPaye &&
                validation.errors.totalAmountPaye
                  ? true
                  : false
              }
            />
            {validation.touched.totalAmountPaye &&
            validation.errors.totalAmountPaye ? (
              <FormFeedback type='invalid'>
                {validation.errors.totalAmountPaye}
              </FormFeedback>
            ) : null}
          </FormGroup>
        </Col>
      </Row>
      <Row>
        <Col md='12'>
          <FormGroup className='mb-3'>
            <Label htmlFor='dateOfAchat'>Date d'Achat</Label>
            <Input
              name='dateOfAchat'
              type='date'
              max={new Date().toISOString().split('T')[0]}
              className='form-control border-1 border-dark'
              id='dateOfAchat'
              onChange={validation.handleChange}
              onBlur={validation.handleBlur}
              value={validation.values.dateOfAchat || ''}
              invalid={
                validation.touched.dateOfAchat && validation.errors.dateOfAchat
                  ? true
                  : false
              }
            />

            {validation.touched.dateOfAchat && validation.errors.dateOfAchat ? (
              <FormFeedback type='invalid'>
                {validation.errors.dateOfAchat}
              </FormFeedback>
            ) : null}
          </FormGroup>
        </Col>
      </Row>

      <Row>
        <Col md='12'>
          {fourniLoading && <LoadingSpiner />}
          {fourniError && (
            <div className='fw-bold text-danger text-center'></div>
          )}
          {!fourniError && !fourniLoading && (
            <FormGroup>
              <Label htmlFor='fournisseur'>Fournisseur</Label>
              <Input
                type='select'
                name='fournisseur'
                onChange={validation.handleChange}
                onBlur={validation.handleBlur}
                value={validation.values.fournisseur || ''}
                invalid={
                  validation.touched.fournisseur &&
                  validation.errors.fournisseur
                    ? true
                    : false
                }
              >
                <option value=''>Sélectionner un fournisseur</option>

                {fournisseurData?.length > 0 &&
                  fournisseurData.map((four) => (
                    <option key={four._id} value={four._id}>
                      {capitalizeWords(four.firstName)}{' '}
                      {capitalizeWords(four.lastName)}{' '}
                      {formatPhoneNumber(four.phoneNumber)}
                    </option>
                  ))}
              </Input>
              {validation.touched.fournisseur &&
              validation.errors.fournisseur ? (
                <FormFeedback type='invalid'>
                  {validation.errors.fournisseur}
                </FormFeedback>
              ) : null}
            </FormGroup>
          )}
        </Col>
      </Row>

      <div className='d-grid text-center mt-4'>
        {isLoading && <LoadingSpiner />}
        {!isLoading && (
          <Button color='success' type='submit'>
            Enregisrer
          </Button>
        )}
      </div>
    </Form>
  );
};

export default AchatForm;
