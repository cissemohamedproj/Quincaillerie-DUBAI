import React, { useState } from 'react';
import { Card, Col, Row, Spinner } from 'reactstrap';
import { formatRapportMontant } from './formatRapportMontant';
import { useRapportPeriode } from '../../Api/queriesRapport';

const todayLocalDateKey = () => new Date().toLocaleDateString('en-CA');

const RapportBySemaine = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  /** Requête activée uniquement quand les deux dates sont renseignées (évite d'afficher toutes les données). */
  const periodeReady = Boolean(startDate && endDate);
  const { data, isLoading, isFetching } = useRapportPeriode(
    startDate,
    endDate
  );
  const stats = periodeReady ? data?.stats ?? {} : {};

  const totalCommandeNumber = stats.totalCommandes ?? 0;
  const totalPaiementsAmount = stats.totalAPayer ?? 0;
  const totalPaiementsPaye = stats.totalPaye ?? 0;
  const totalPaiementsToPaye = stats.totalImpaye ?? 0;
  const totalDepenses = stats.totalDepenses ?? 0;
  const totalAchat = stats.totalAchat ?? 0;
  const benefice = stats.benefice ?? 0;

  /* ── Ancien code client ──
  import { useCallback, useMemo } from 'react';
  import { useAllPaiements } from '../../Api/queriesPaiement';
  import { useAllDepenses } from '../../Api/queriesDepense';
  import { useAllCommandes } from '../../Api/queriesCommande';
  // isBetweenDates retournait true si pas de dates → affichait TOUTES les données
  ── */

  return (
    <React.Fragment>
      <Card style={{ boxShadow: '0px 0px 10px rgba(123, 123, 123, 0.28)' }}>
        <Row className='mb-4'>
          <Col md={12}>
            <h4 className='text-center my-4' style={{ color: '#27548A' }}>
              Veuillez Sélectionnez
            </h4>
          </Col>
          <div className='mb-4 d-flex justify-content-around align-items-center'>
            <Col
              sm={4}
              style={{
                background: 'rgb(72, 60, 60)',
                padding: '15px ',
                borderRadius: '15px',
              }}
            >
              <p className='text-center text-light'>Date de Début</p>
              <input
                type='date'
                max={todayLocalDateKey()}
                className='form-control border-1 border-dark'
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Col>
            <Col
              sm={4}
              style={{
                background: 'rgb(72, 60, 60)',
                padding: '15px ',
                borderRadius: '15px',
              }}
            >
              <p className='text-center text-light'>Date de Fin</p>
              <input
                type='date'
                min={startDate}
                max={todayLocalDateKey()}
                className='form-control border-1 border-dark'
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Col>
          </div>
          {periodeReady && (isLoading || isFetching) && (
            <div className='text-center mb-3'>
              <Spinner color='primary' size='sm' /> Chargement…
            </div>
          )}
          {!periodeReady && (
            <p className='text-center text-muted mb-3'>
              Sélectionnez une date de début et de fin pour afficher les
              statistiques.
            </p>
          )}
        </Row>

        <Row>
          <Col sm={6} lg={4}>
            <Card
              style={{
                background: 'linear-gradient(to top right , #090979, #222831)',
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
                background: 'linear-gradient(to top right , #090979, #222831)',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100px',
              }}
            >
              <h4 className='mb-1' style={{ color: '#B6F500' }}>
                {formatRapportMontant(totalPaiementsPaye)} F
              </h4>
              <p className='text-white'>
                Revenue (Chiffre d'Affaire)
                <i
                  className='fas fa-level-down-alt ms-2 fs-4'
                  style={{ color: '#B6F500' }}
                ></i>
              </p>
            </Card>
          </Col>
          <Col sm={6} lg={4}>
            <Card
              style={{
                background: 'linear-gradient(to top right , #090979, #222831)',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100px',
              }}
            >
              <h4 className='mb-1' style={{ color: '#B6F500' }}>
                {formatRapportMontant(totalAchat)} F
              </h4>
              <p className='text-white'>
                Achat sur Revenue
                <i
                  className='fas fa-level-down-alt ms-2 fs-4'
                  style={{ color: '#B6F500' }}
                ></i>
              </p>
            </Card>
          </Col>

          <Col sm={6} lg={4}>
            <Card
              style={{
                background: 'linear-gradient(to top right , #090979, #222831)',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100px',
              }}
            >
              <h4 className='mb-1' style={{ color: '#CB0404' }}>
                {formatRapportMontant(totalDepenses)} F
              </h4>
              <p className='text-white'>
                Dépenses
                <i
                  className='fas fa-level-up-alt ms-2 fs-4'
                  style={{ color: '#CB0404' }}
                ></i>
              </p>
            </Card>
          </Col>

          <Col sm={6} lg={4}>
            <Card
              style={{
                background: 'linear-gradient(to top right , #090979, #222831)',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100px',
              }}
            >
              <h5 className='text-warning mb-1'>{totalCommandeNumber}</h5>
              <p className='text-white'>Commandes</p>
            </Card>
          </Col>
          <Col sm={6} lg={4}>
            <Card
              style={{
                background: 'linear-gradient(to top right , #090979, #222831)',
                justifyContent: 'center',
                alignItems: 'start',
                height: '100px',
                padding: '0 15px',
              }}
            >
              <p className='my-1 text-light'>
                Total À Payé:{' '}
                <span className='text-light ps-2'>
                  {formatRapportMontant(totalPaiementsAmount)} F
                </span>
              </p>
              <p className='my-1 text-light'>
                Net Payé:{' '}
                <span className='text-success ps-2'>
                  {formatRapportMontant(totalPaiementsPaye)} F
                </span>
              </p>
              <p className='my-1 text-light'>
                Impayé:{' '}
                <span className='text-danger ps-2'>
                  {formatRapportMontant(totalPaiementsToPaye)} F
                </span>
              </p>
            </Card>
          </Col>
        </Row>
      </Card>
    </React.Fragment>
  );
};

export default RapportBySemaine;
