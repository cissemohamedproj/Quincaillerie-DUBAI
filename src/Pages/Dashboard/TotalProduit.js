import { Card, CardBody, CardImg, CardTitle } from 'reactstrap';
import LoadingSpiner from '../components/LoadingSpiner';

import produitImage from './../../assets/images/product.png';
// Ancien import — chargeait TOUS les produits en mémoire pour afficher .length
// import { useAllProduit } from '../../Api/queriesProduits';
import { useCountProduits } from '../../Api/queriesDashboard';
import { useNavigate } from 'react-router-dom';

export default function TotalProduit() {
  /**
   * Optimisation Dashboard :
   * useCountProduits() appelle GET /produits/countProduits
   * et reçoit uniquement { count: number } au lieu de la liste complète.
   */
  const {
    data: countData,
    isLoading: produitLoading,
    error: produitError,
  } = useCountProduits();

  // Ancien code — conservé en commentaire pour référence
  // const {
  //   data: produitData,
  //   isLoading: produitLoading,
  //   error: produitError,
  // } = useAllProduit();

  const navigate = useNavigate();

  const handleNavigate = () => {
    return navigate('/produits');
  };

  return (
    <div onClick={() => handleNavigate()} style={{ cursor: 'pointer' }}>
      {produitLoading && <LoadingSpiner />}
      {!produitError && !produitLoading && (
        <Card
          style={{
            height: '180px',
            boxShadow: '1px 0px 10px rgba(1, 186, 186, 0.57)',
          }}
        >
          <CardImg
            src={produitImage}
            alt='product'
            style={{ height: '90px', objectFit: 'contain' }}
          />
          <CardBody>
            <CardTitle className='text-center'>
              {/* ?? 0 : valeur par défaut si countData est undefined */}
              <span className='text-info fs-5'>{countData?.count ?? 0}</span>
              {/* Ancien affichage : {produitData.length} */}
              <p>Produits</p>
            </CardTitle>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
