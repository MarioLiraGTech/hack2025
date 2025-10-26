'use client';

import React, { useEffect, useState } from 'react';
// XLSX not required in the client page because server reads the file
import {  Chart as ChartJS, CategoryScale,LinearScale,BarElement,  ArcElement,PointElement,LineElement,Title,Tooltip,Legend,ChartData,} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

import WelcomeContainer from '@/components/welcomeContainer';
import { dashboardGridStyle, chartContainerStyle } from '@/styles/gridStyle';

// 1. Registrar los componentes de Chart.js que usaremos
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend);

// 2. Definir el tipo de datos para nuestras filas de Excel
interface FlightData {
  Product_Name: string;
  Quantity_Consumed: number;
  Flight_Type: 'short-haul' | 'medium-haul' | 'long-haul';
}

// Opciones para los gráficos
const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
};

// Función auxiliar para obtener el valor de una variable CSS
const getCSSVariable = (variable: string): string => {
  if (typeof window === 'undefined') return '';
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value;
};

/**
 * Componente principal del Dashboard
 */
export default function DashboardPage() {
  
  
    
  // 3. Estados para los datos y visualizaciones
  const [data, setData] = useState<FlightData[]>([]);
  const [top5ReturnedPercentageChart, setTop5ReturnedPercentageChart] = useState<ChartData<'line'> | null>(null);
  const [topProductsData, setTopProductsData] = useState<ChartData<'bar'> | null>(null);
  const [flightTypeData, setFlightTypeData] = useState<ChartData<'doughnut'> | null>(null);

  // Estados de UI
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch automático al montar: consumimos el Excel desde el servidor
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/excel');
        if (!res.ok) throw new Error('Error fetching data');
        const json = await res.json();

        if (json.error) throw new Error(json.error);

        type ApiRow = Record<string, unknown> & { _raw?: Record<string, unknown> };
        const rows: FlightData[] = (json.rows ?? []).map((r: ApiRow) => {
          const raw = r._raw ?? {};
          const product = (r['Product_Name'] ?? raw['Product_Name'] ?? raw['Product'] ?? '') as unknown;
          const qty = (r['Quantity_Consumed'] ?? r['Quantity'] ?? raw['Quantity_Consumed'] ?? 0) as unknown;
          const ft = (r['Flight_Type'] ?? raw['Flight_Type'] ?? 'unknown') as unknown;
          return {
            Product_Name: String(product ?? ''),
            Quantity_Consumed: Number(qty ?? 0) || 0,
            Flight_Type: String(ft ?? 'unknown'),
          };
        });

        setData(rows);
        
        // Top 5 productos con mayor porcentaje de regresados
        const topReturnedPercentage: [string, number][] = json.topReturnedPercentage ?? [];
        const chart2Color = getCSSVariable('--chart-2');
        setTop5ReturnedPercentageChart({
          labels: topReturnedPercentage.map(([name]) => name),
          datasets: [
            {
              label: '% de Productos Regresados',
              data: topReturnedPercentage.map(([, percentage]) => percentage),
              backgroundColor: chart2Color,
              borderColor: chart2Color,
              borderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8,
              pointBackgroundColor: chart2Color,
              tension: 0.3,
            },
          ],
        });

        // Top 10 products (barra)
        const allProducts: [string, number][] = json.topProducts ?? [];
        const topProducts = allProducts.slice(0, 10);
        const chart1Color = getCSSVariable('--chart-1');
        setTopProductsData({
          labels: topProducts.map(([name]) => name),
          datasets: [
            {
              label: 'Cantidad Consumida',
              data: topProducts.map(([, qty]) => qty),
              backgroundColor: chart1Color,
              borderColor: chart1Color,
              borderWidth: 1,
            },
          ],
        });

        // Flight types
        const flightTypes: [string, number][] = json.flightTypes ?? [];
        const chart4Color = getCSSVariable('--chart-4');
        const chart3Color = getCSSVariable('--chart-3');
        const chart5Color = getCSSVariable('--chart-5');
        setFlightTypeData({
          labels: flightTypes.map(([name]) => name),
          datasets: [
            {
              label: 'Consumo por Tipo de Vuelo',
              data: flightTypes.map(([, qty]) => qty),
              backgroundColor: [
                chart4Color,
                chart3Color,
                chart5Color,
              ],
              borderColor: [
                chart2Color,
                chart3Color,
                chart5Color,
              ],
              borderWidth: 1,
            },
          ],
        });
      } catch (err: unknown) {
        console.error('Error cargando datos del servidor:', err);
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  // 5. Renderizado del componente
  return (
    <div className="general-styles">

      {/* --- Mensajes de Estado --- */}
      {isLoading && <p>Cargando y procesando archivo local...</p>}
      {error && <p style={{ color: 'var(--destructive)' }}>{error}</p>}

      {/* --- Contenedor del Dashboard (solo se muestra si hay datos) --- */}
      {top5ReturnedPercentageChart !== null && !isLoading && (
        <main>
          <WelcomeContainer />

          {/* Sección de KPI: Top 5 Productos con Mayor % de Regresados */}
          <h2 id='Graficas'>Top 5 Productos con Mayor Porcentaje de Regresados</h2>
          <div style={chartContainerStyle}>
            <Line options={chartOptions} data={top5ReturnedPercentageChart} />
          </div>

          {/* Sección de Gráficos */}
          <h2>Visualizaciones</h2>
          <div style={dashboardGridStyle}>
            {/* Gráfico 1 */}
            {topProductsData && (
              <div style={chartContainerStyle}>
                <h3>Top 10 Productos Más Consumidos</h3>
                <Bar options={chartOptions} data={topProductsData} />
              </div>
            )} 

            {/* Gráfico 2 */}
            {flightTypeData && (
              <div style={chartContainerStyle}>
                <h3>Distribución por Tipo de Vuelo</h3>
                <Doughnut options={chartOptions} data={flightTypeData} />
              </div>
            )}

           
          </div>
        </main>
      )}
    </div>
  );
}