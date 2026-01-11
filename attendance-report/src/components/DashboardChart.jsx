import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getSundayOfWeekKST, getKSTDateParts } from '../lib/dateUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const getAttendeeSum = (report) => {
    if (!report) return 0;
    return (report.attended_leaders_count || 0) + (report.attended_graduates_count || 0) + (report.attended_students_count || 0) + (report.attended_freshmen_count || 0);
};

const DashboardChart = ({ reports }) => {

  const processDataForChart = () => {
    if (!reports || reports.length === 0) {
        return { labels: [], datasets: [] };
    }

    const weeklyTotals = reports.reduce((acc, report) => {
        const weekStart = getSundayOfWeekKST(report.report_date);
        if (!acc[weekStart]) {
            acc[weekStart] = 0;
        }
        acc[weekStart] += getAttendeeSum(report);
        return acc;
    }, {});

    const sortedWeeks = Object.keys(weeklyTotals).sort((a, b) => new Date(a) - new Date(b));
    const last5Weeks = sortedWeeks.slice(-5);

    const labels = last5Weeks.map(weekStart => {
        const parts = getKSTDateParts(weekStart);
        if (!parts) return weekStart;
        return `${parts.month}/${parts.day}`;
    });

    const data = last5Weeks.map(weekStart => weeklyTotals[weekStart]);

    return {
        labels,
        datasets: [
            {
                label: '총 참석자 수',
                data,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
            },
        ],
    };
  }

  const chartData = processDataForChart();

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '최근 5주간 참석자 현황',
        font: {
            size: 18
        }
      },
    },
    scales: {
        y: {
            beginAtZero: true
        }
    }
  };

  return <Line options={options} data={chartData} />;
};

export default DashboardChart;
