import React, { useState } from 'react';
import { Card, CardBody, Col, Input, Row, Spinner } from 'reactstrap';
import { formatRapportMontant } from './formatRapportMontant';
import { useRapportJournalier } from '../../Api/queriesRapport';

/**
 * Date locale YYYY-MM-DD (évite le décalage UTC de toISOString().slice(0,10)).
 */
const todayLocalDateKey = () => new Date().toLocaleDateString('en-CA');

const RapportByDay = () => {
  const [selectedDate, setSelectedDate] = useState(todayLocalDateKey());

  /**
   * Stats calculées côté serveur — formules unifiées :
   * benefice = totalPaye - totalAchat - totalDepenses
   * (Revenue affiché = totalPaye, cohérent avec le bénéfice)
   */
  const { data, isLoading, isFetching } = useRapportJournalier(selectedDate);
  const stats = data?.stats ?? {};

  const totalCommandesNumber = stats.totalCommandes ?? 0;
  const totalPaiements = stats.totalAPayer ?? 0;
  const totalPaiementsAmountPayed = stats.totalPaye ?? 0;
  const totalAmountNotPayed = stats.totalImpaye ?? 0;
  const totalDepenses = stats.totalDepenses ?? 0;
  const totalAchat = stats.totalAchat ?? 0;
  const benefice = stats.benefice ?? 0;

  /* ── Ancien code client (useAllCommandes + useAllPaiements + useAllDepenses) ──
  import { useMemo } from 'react';
  import { useAllPaiements } from '../../Api/queriesPaiement';
  import { useAllDepenses } from '../../Api/queriesDepense';
  import { useAllCommandes } from '../../Api/queriesCommande';
  const { data: commandes = [] } = useAllCommandes();
  const { data: paiementsData = [] } = useAllPaiements();
  const { data: depenseData = [] } = useAllDepenses();
  // … calculs locaux avec toISOString() (UTC) et chargement de toutes les collections
  ── */

  return (
    <React.Fragment>
      <Card style={{ boxShadow: '0px 0px 10px rgba(123, 123, 123, 0.28)' }}>
        <Row>
          <Col md={4}>
            <Card
              style={{
                background: 'linear-gradient(1deg, #183B4E 0%, #27548A 100%)',
              }}
            >
              <CardBody>
                <h6 className='text-white text-center'>
                  Sélectionnez une Date
                </h6>
                <div className='d-flex align-items-center justify-content-between mb-3'>
                  <Input
                    className='form-control serach'
                    type='date'
                    max={todayLocalDateKey()}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
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
            <h4 className='text-center mt-5' style={{ color: ' #183B4E' }}>
              Rapports Journalier
            </h4>
          </Col>
        </Row>

        <Row>
          <Col sm={6} lg={4}>
            <Card
              style={{
                background: ' #250902',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100px',
              }}
            >
              <h5 className='mb-1 text-white'>Bénéfice </h5>
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
                background: ' #38040e',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100px',
              }}
            >
              <p className='text-white'>
                Revenue (Chiffre d'Affaires)
                <i
                  className='fas fa-level-down-alt ms-2 fs-4'
                  style={{ color: '#00f504' }}
                ></i>
              </p>
              <h5 className='my-1' style={{ color: ' #00f504' }}>
                {formatRapportMontant(totalPaiementsAmountPayed)} F
              </h5>
            </Card>
          </Col>
          <Col sm={6} lg={4}>
            <Card
              style={{
                background: ' #640d14',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100px',
              }}
            >
              <p className='text-white'>Achat sur Revenue</p>
              <h5 className='my-1' style={{ color: ' #00f504' }}>
                {formatRapportMontant(totalAchat)} F
              </h5>
            </Card>
          </Col>

          <Col sm={6} lg={4}>
            <Card
              style={{
                background: ' #f58549',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100px',
              }}
            >
              <h4 className='mb-1' style={{ color: '#901E3E' }}>
                {formatRapportMontant(totalDepenses)} F
              </h4>
              <p className='text-white'>
                Dépenses
                <i
                  className='fas fa-level-up-alt ms-2 fs-4'
                  style={{ color: ' #901E3E' }}
                ></i>
              </p>
            </Card>
          </Col>

          <Col sm={6} lg={4}>
            <Card
              style={{
                background: ' #ad2831',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100px',
              }}
            >
              <h5 className='my-1' style={{ color: ' #f3f045' }}>
                {totalCommandesNumber}
              </h5>
              <p className='text-white'>Commandes</p>
            </Card>
          </Col>

          <Col sm={6} lg={4}>
            <Card
              style={{
                background: 'linear-gradient(to top right , #3E0703, #cbcaa5)',
                justifyContent: 'center',
                alignItems: 'start',
                height: '100px',
                padding: '0 10px',
              }}
            >
              <h6 className='my-1 text-light'>
                Total À Payé:{' '}
                <span className='text-light'>
                  {formatRapportMontant(totalPaiements)} F
                </span>
              </h6>
              <h6 className='my-1 text-light'>
                Net Payé:{' '}
                <span className='text-success'>
                  {formatRapportMontant(totalPaiementsAmountPayed)} F
                </span>
              </h6>
              <h6 className='my-1 text-light'>
                Impayé:{' '}
                <span className='text-danger'>
                  {formatRapportMontant(totalAmountNotPayed)} F
                </span>
              </h6>
            </Card>
          </Col>
        </Row>
      </Card>
    </React.Fragment>
  );
};

export default RapportByDay;
