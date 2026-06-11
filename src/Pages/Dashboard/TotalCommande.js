import { Card, CardBody, CardImg, CardTitle } from 'reactstrap';
import LoadingSpiner from '../components/LoadingSpiner';

import comImg from './../../assets/images/passer-la-commande.png';
import rechargeImg from './../../assets/images/recharge.png';
import carImg from './../../assets/images/car.png';
// Ancien import — chargeait TOUTES les commandes + factures + populate
// import { useAllCommandes } from '../../Api/queriesCommande';
import { useCountCommandesDashboard } from '../../Api/queriesDashboard';
import { useNavigate } from 'react-router-dom';

/**
 * Les 3 composants ci-dessous partagent useCountCommandesDashboard().
 * React Query déduplique : 1 seule requête GET /commandes/countCommandesDashboard
 * pour les 3 cartes (total, en attente, en cours).
 */

const TotalCommande = () => {
  const {
    data: countData,
    isLoading: loadingCommande,
    error: commandeError,
  } = useCountCommandesDashboard();

  // Ancien code — conservé en commentaire pour référence
  // const {
  //   data: commandeData,
  //   isLoading: loadingCommande,
  //   error: commandeError,
  // } = useAllCommandes();

  const navigate = useNavigate();

  const handleNavigate = () => {
    return navigate('/commandes');
  };

  return (
    <div onClick={() => handleNavigate()} style={{ cursor: 'pointer' }}>
      {loadingCommande && <LoadingSpiner />}
      {!commandeError && !loadingCommande && (
        <Card
          style={{
            height: '180px',
            boxShadow: '1px 0px 10px rgba(1, 186, 186, 0.57)',
          }}
        >
          <CardImg
            src={comImg}
            alt='Commandes'
            style={{ height: '90px', objectFit: 'contain' }}
          />
          <CardBody>
            <CardTitle className='text-center'>
              <span className='text-info fs-5'>{countData?.total ?? 0}</span>
              {/* Ancien affichage : {commandeData?.commandesListe?.length} */}
              <p>Commandes Enregistrées</p>
            </CardTitle>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

const TotalCommandeNotDelivred = () => {
  const {
    data: countData,
    isLoading: loadingCommande,
    error: commandeError,
  } = useCountCommandesDashboard();

  // Ancien code — conservé en commentaire pour référence
  // const {
  //   data: commandeData,
  //   isLoading: loadingCommande,
  //   error: commandeError,
  // } = useAllCommandes();

  const navigate = useNavigate();

  const handleNavigate = () => {
    return navigate('/commandes');
  };

  return (
    <div onClick={() => handleNavigate()} style={{ cursor: 'pointer' }}>
      {loadingCommande && <LoadingSpiner />}
      {!commandeError && !loadingCommande && (
        <Card
          className='d-flex flex-column align-items-center justify-content-center'
          style={{
            height: '180px',
            boxShadow: '1px 0px 10px rgba(1, 186, 186, 0.57)',
          }}
        >
          <CardImg
            src={rechargeImg}
            alt='Commandes'
            style={{ height: '110px', objectFit: 'contain' }}
          />
          <CardBody>
            <CardTitle className='text-center'>
              <span className='text-danger fs-5'>
                {countData?.enAttente ?? 0}
              </span>
              {/*
                Ancien affichage (bug : cmd.status au lieu de cmd.statut) :
                commandeData?.commandesListe?.filter(
                  (cmd) => cmd.status === 'en attente'
                ).length
              */}
              <p>Commandes Non Livrés</p>
            </CardTitle>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

const TotalCommandeToDelivre = () => {
  const {
    data: countData,
    isLoading: loadingCommande,
    error: commandeError,
  } = useCountCommandesDashboard();

  // Ancien code — conservé en commentaire pour référence
  // const {
  //   data: commandeData,
  //   isLoading: loadingCommande,
  //   error: commandeError,
  // } = useAllCommandes();

  const navigate = useNavigate();

  const handleNavigate = () => {
    return navigate('/commandes');
  };

  return (
    <div onClick={() => handleNavigate()} style={{ cursor: 'pointer' }}>
      {loadingCommande && <LoadingSpiner />}
      {!commandeError && !loadingCommande && (
        <Card
          className='d-flex flex-column align-items-center justify-content-center'
          style={{
            height: '180px',
            boxShadow: '1px 0px 10px rgba(1, 186, 186, 0.57)',
          }}
        >
          <CardImg
            src={carImg}
            alt='Commandes'
            style={{ height: '110px', objectFit: 'cover' }}
          />
          <CardBody>
            <CardTitle className='text-center'>
              <span className='text-warning fs-5'>
                {countData?.enCours ?? 0}
              </span>
              {/*
                Ancien affichage (bug : cmd.status au lieu de cmd.statut) :
                commandeData?.commandesListe?.filter(
                  (cmd) => cmd?.status === 'en cours'
                )?.length
              */}
              <p>Commandes En Cours</p>
            </CardTitle>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export { TotalCommande, TotalCommandeNotDelivred, TotalCommandeToDelivre };
