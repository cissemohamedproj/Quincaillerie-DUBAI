import { Card, CardBody, CardImg, CardTitle } from 'reactstrap';
// Ancien import — chargeait tous les fournisseurs pour afficher .length
// import { useAllFournisseur } from '../../Api/queriesFournisseur';
import { useCountFournisseurs } from '../../Api/queriesDashboard';
import fourImg from './../../assets/images/delivery.png';
import LoadingSpiner from '../components/LoadingSpiner';
import { useNavigate } from 'react-router-dom';
import { connectedUserRole } from '../Authentication/userInfos';

export default function TotalFounisseurs() {
  /**
   * Optimisation Dashboard :
   * useCountFournisseurs() appelle GET /fournisseurs/countFournisseurs
   * et reçoit uniquement { count: number }.
   */
  const {
    data: countData,
    isLoading: fournisseurLoading,
    error: fournisseurError,
  } = useCountFournisseurs();

  // Ancien code — conservé en commentaire pour référence
  // const {
  //   data: fournisseurData,
  //   isLoading: fournisseurLoading,
  //   error: fournisseurError,
  // } = useAllFournisseur();

  const navigate = useNavigate();

  const handleNavigate = () => {
    return navigate('/fournisseurs');
  };
  return (
    <div
      onClick={() => connectedUserRole === 'admin' && handleNavigate()}
      style={{ cursor: 'pointer' }}
    >
      {fournisseurLoading && <LoadingSpiner />}
      {!fournisseurError && !fournisseurLoading && (
        <Card
          style={{
            height: '180px',
            boxShadow: '1px 0px 10px rgba(1, 186, 186, 0.57)',
          }}
        >
          <CardImg
            src={fourImg}
            alt='Fournisseurs'
            style={{ height: '90px', objectFit: 'contain' }}
          />
          <CardBody>
            <CardTitle className='text-center'>
              <span className='text-info fs-5'>{countData?.count ?? 0}</span>
              {/* Ancien affichage : {fournisseurData.length} */}
              <p>Fournisseurs</p>
            </CardTitle>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
