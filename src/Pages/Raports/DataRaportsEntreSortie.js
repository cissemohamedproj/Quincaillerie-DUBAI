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

const BarChartEntreSortie = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const yearOptions = Array.from({ length: 6 }, (_, i) => {
    return new Date().getFullYear() - i;
  });

  /** Entrées = totalPaye, Sorties = dépenses (dateOfDepense) — agrégées serveur */
  const { data, isLoading, isFetching } =
    useStatsGraphiquesMensuels(selectedYear);

  const entreesData = data?.entrees ?? new Array(12).fill(0);
  const sortiesData = data?.depenses ?? new Array(12).fill(0);

  /* ── Ancien code client ──
  import { useAllPaiements } from '../../Api/queriesPaiement';
  import { useAllDepenses } from '../../Api/queriesDepense';
  ── */

  const chartData = {
    labels: MONTH_LABELS,
    datasets: [
      {
        label: 'Entrée (Paiements)',
        data: entreesData,
        backgroundColor: ' #328E6E',
        barThickness: 10,
      },
      {
        label: 'Sortie (Dépenses)',
        data: sortiesData,
        backgroundColor: ' #CF0F47',
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
        text: `Statistiques des Entrée, Sortie — ${selectedYear}`,
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

export default BarChartEntreSortie;
