import React, { useState } from 'react';
import { Card, CardBody, Col, Row, Spinner } from 'reactstrap';
import { formatRapportMontant } from './formatRapportMontant';
import { useRapportMensuel } from '../../Api/queriesRapport';

const SelectedMounthTotalResult = () => {
  const monthOptions = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  /** Années disponibles : 5 dernières + année courante */
  const yearOptions = Array.from({ length: 6 }, (_, i) => {
    return new Date().getFullYear() - i;
  });

  /**
   * Stats serveur — corrige l'ancien bug mensuel :
   * - bénéfice utilisait totalAPayer au lieu de totalPaye
   * - dépenses filtrées sur createdAt au lieu de dateOfDepense
   * - mois sans année (mélangeait toutes les années)
   */
  const { data, isLoading, isFetching } = useRapportMensuel(
    selectedMonth,
    selectedYear
  );
  const stats = data?.stats ?? {};

  const totalCommandesNumber = stats.totalCommandes ?? 0;
  const totalPaiementsToPaye = stats.totalAPayer ?? 0;
  const totalPaiementsAmountPaye = stats.totalPaye ?? 0;
  const totalPaiementsNotPaye = stats.totalImpaye ?? 0;
  const totalDepenses = stats.totalDepenses ?? 0;
  const totalAchat = stats.totalAchat ?? 0;
  const benefice = stats.benefice ?? 0;

  /* ── Ancien code client (BUG : benefice = totalAPayer - achat - depenses) ──
  import { useMemo } from 'react';
  import { useAllPaiements } from '../../Api/queriesPaiement';
  import { useAllDepenses } from '../../Api/queriesDepense';
  import { useAllCommandes } from '../../Api/queriesCommande';
  const total = totalPaiementsToPaye - totalAchat; // ← totalAmount, pas totalPaye !
  const benefice = total - totalDepenses;
  ── */

  return (
    <React.Fragment>
      <Card style={{ boxShadow: '0px 0px 10px rgba(123, 123, 123, 0.28)' }}>
        <Row>
          <Col md={4}>
            <Card
              style={{
                background: 'linear-gradient(1deg, #ff0099, #493240)',
              }}
            >
              <CardBody>
                <h6 className='text-white text-center'>Sélectionnez un Mois</h6>
                <div className='d-flex align-items-center gap-2 mb-3'>
                  <select
                    className='form-select form-select-sm'
                    value={selectedMonth}
                    onChange={(e) =>
                      setSelectedMonth(parseInt(e.target.value, 10))
                    }
                  >
                    {monthOptions.map((label, index) => (
                      <option key={index} value={index}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select
                    className='form-select form-select-sm'
                    style={{ maxWidth: '100px' }}
                    value={selectedYear}
                    onChange={(e) =>
                      setSelectedYear(parseInt(e.target.value, 10))
                    }
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                {(isLoading || isFetching) && (
                  <div className='text-center'>
                    <Spinner size='sm' color='light' />
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
          <Col md={4}>
            <h4 className='text-center mt-5' style={{ color: '#BE5B50' }}>
              Rapports Mensuel — {monthOptions[selectedMonth]} {selectedYear}
            </h4>
          </Col>
        </Row>

        <Row>
          <Col sm={6} lg={4}>
            <Card
              style={{
                background: ' #0d1b2a',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100px',
              }}
            >
              <h5 className='mb-1 text-white'>Bénéfice</h5>
              {benefice <= 0 ? (
                <h4 className='text-danger'>{formatRapportMontant(benefice)} F</h4>
              ) : (
                <h4 className='text-success'>{formatRapportMontant(benefice)} F</h4>
              )}
            </Card>
          </Col>
          <Col sm={6} lg={4}>
            <Card
              style={{
                background: ' #1b263b',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100px',
              }}
            >
              <p className='text-white'>
                Revenue (Chiffre d'Affaire)
                <i
                  className='fas fa-level-down-alt ms-2 fs-4'
                  style={{ color: '#B6F500' }}
                ></i>
              </p>
              <h4 className='mb-1' style={{ color: ' #B6F500' }}>
                {formatRapportMontant(totalPaiementsAmountPaye)} F
              </h4>
            </Card>
          </Col>
          <Col sm={6} lg={4}>
            <Card
              style={{
                background: ' #415a77',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100px',
              }}
            >
              <p className='text-white'>Achat sur Revenue</p>
              <h4 className='mb-1' style={{ color: '#B6F500' }}>
                {formatRapportMontant(totalAchat)} F
              </h4>
            </Card>
          </Col>

          <Col sm={6} lg={4}>
            <Card
              style={{
                background: ' #778da9',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100px',
              }}
            >
              <p className='text-white'>
                Dépenses
                <i
                  className='fas fa-level-up-alt ms-2 fs-4'
                  style={{ color: '#901E3E' }}
                ></i>
              </p>
              <h4 className='mb-1' style={{ color: '#901E3E' }}>
                {formatRapportMontant(totalDepenses)} F
              </h4>
            </Card>
          </Col>

          <Col sm={6} lg={4}>
            <Card
              style={{
                background: ' #0077b6',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100px',
              }}
            >
              <p className='text-white'>Commandes</p>
              <h5 className='text-warning my-1'>{totalCommandesNumber}</h5>
            </Card>
          </Col>
          <Col sm={6} lg={4}>
            <Card
              style={{
                background: ' #03045e',
                justifyContent: 'center',
                alignItems: 'start',
                height: '100px',
                padding: '0px 10px',
              }}
            >
              <h5 className='my-1 text-light'>
                Total À Payé:{' '}
                <span className='text-light ps-3'>
                  {formatRapportMontant(totalPaiementsToPaye)} F
                </span>
              </h5>
              <h5 className='my-1 text-light'>
                Net Payé:{' '}
                <span className='text-success ps-3'>
                  {formatRapportMontant(totalPaiementsAmountPaye)} F
                </span>
              </h5>
              <h5 className='my-1 text-light'>
                Impayé:{' '}
                <span className='text-danger ps-3'>
                  {formatRapportMontant(totalPaiementsNotPaye)} F
                </span>
              </h5>
            </Card>
          </Col>
        </Row>
      </Card>
    </React.Fragment>
  );
};

export default SelectedMounthTotalResult;
