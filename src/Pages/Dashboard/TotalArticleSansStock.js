import { Card, CardBody, CardImg, CardTitle } from 'reactstrap';
import LoadingSpiner from '../components/LoadingSpiner';

import articleImg from './../../assets/images/package.png';
// Ancien import — chargeait tous les produits puis filtrait stock <= 10 côté client
// import { useAllProduit } from '../../Api/queriesProduits';
import { useCountProduitStockFaible } from '../../Api/queriesDashboard';
import { useNavigate } from 'react-router-dom';
import { connectedUserRole } from '../Authentication/userInfos';

export default function TotalArticleSansStock() {
  /**
   * Optimisation Dashboard :
   * le comptage stock <= 10 est fait côté MongoDB (countDocuments)
   * via GET /produits/countProduitStockFaible → { count: number }
   */
  const {
    data: countData,
    isLoading: productLoading,
    error: productError,
  } = useCountProduitStockFaible();

  // Ancien code — conservé en commentaire pour référence
  // const {
  //   data: productData,
  //   isLoading: productLoading,
  //   error: productError,
  // } = useAllProduit();
  // const finishStock = productData?.filter((item) => item.stock <= 10);

  const navigate = useNavigate();

  const handleNavigate = () => {
    return navigate('/produit_no_stock');
  };

  return (
    <div
      onClick={() => connectedUserRole === 'admin' && handleNavigate()}
      style={{ cursor: 'pointer' }}
    >
      {productLoading && <LoadingSpiner />}
      {!productError && !productLoading && (
        <Card
          style={{
            height: '180px',
            boxShadow: '1px 0px 10px rgba(1, 186, 186, 0.57)',
          }}
        >
          <CardImg
            src={articleImg}
            alt='articles'
            style={{ height: '90px', objectFit: 'contain' }}
          />
          <CardBody>
            <CardTitle className='text-center'>
              <span className='text-danger fs-5'>{countData?.count ?? 0}</span>
              {/* Ancien affichage : {finishStock?.length} */}
              <p>Produits En Stock Faible</p>
            </CardTitle>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
