import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import { Chart, CategoryScale } from 'chart.js';
import { Row, Col, Spinner } from 'reactstrap';
import { useStatsGraphiquesMensuels } from '../../Api/queriesRapport';
import { formatRapportChartValue } from './formatRapportMontant';

Chart.register(CategoryScale);

const MONTH_LABELS = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Jui',
  'Juil',
  'Aoû',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
];

const BarChartCommandePaiement = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const yearOptions = Array.from({ length: 6 }, (_, i) => {
    return new Date().getFullYear() - i;
  });

  /** Agrégation MongoDB par mois — plus de chargement de toutes les commandes/paiements */
  const { data, isLoading, isFetching } =
    useStatsGraphiquesMensuels(selectedYear);

  const commandesData = data?.commandes ?? new Array(12).fill(0);
  const totalAPayerData = data?.paiements?.totalAPayer ?? new Array(12).fill(0);
  const totalPayeData = data?.paiements?.totalPaye ?? new Array(12).fill(0);
  const totalImpayeData = data?.paiements?.totalImpaye ?? new Array(12).fill(0);

  /* ── Ancien code client ──
  import { useAllCommandes } from '../../Api/queriesCommande';
  import { useAllPaiements } from '../../Api/queriesPaiement';
  const countCommandeByMonth = … getMonth() sans filtre année
  ── */

  const chartData = {
    labels: MONTH_LABELS,
    datasets: [
      {
        label: 'Nombre de Commandes',
        data: commandesData,
        backgroundColor: ' #5F8B4C',
        barThickness: 10,
      },
      {
        label: 'Somme à Payé',
        data: totalAPayerData,
        backgroundColor: ' #FFD63A',
        barThickness: 10,
      },
      {
        label: 'Somme Payé',
        data: totalPayeData,
        backgroundColor: ' #4cd13a',
        barThickness: 10,
      },
      {
        label: 'Somme Impayé',
        data: totalImpayeData,
        backgroundColor: ' #d13a3a',
        barThickness: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#102E50',
          boxWidth: 20,
          boxHeight: 20,
        },
      },
      title: {
        display: true,
        text: `Statistiques de Boutique — ${selectedYear}`,
        color: '#102E50',
      },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `${ctx.dataset.label}: ${formatRapportChartValue(ctx.raw)}`,
        },
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    hover: {
      mode: 'nearest',
      intersect: true,
    },
    elements: {
      bar: {
        borderWidth: 2,
      },
    },
    layout: {
      padding: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20,
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: true,
        },
        ticks: {
          color: ' #102E50',
        },
      },
      y: {
        grid: {
          drawBorder: false,
        },
        ticks: {
          color: ' #3A59D1',
          callback: (value) => formatRapportChartValue(value),
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <React.Fragment>
      {/* Sélecteur d'année en haut du graphique */}
      <Row className='mb-3 align-items-center'>
        <Col xs='auto'>
          <label className='form-label mb-0 me-2'>Année :</label>
        </Col>
        <Col xs='auto'>
          <select
            className='form-select form-select-sm'
            style={{ minWidth: '100px' }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </Col>
        {(isLoading || isFetching) && (
          <Col xs='auto'>
            <Spinner size='sm' color='primary' />
          </Col>
        )}
      </Row>
      <Bar width={537} height={268} data={chartData} options={options} />
    </React.Fragment>
  );
};

export default BarChartCommandePaiement;
