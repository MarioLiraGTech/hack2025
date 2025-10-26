/* // 6. Estilos básicos para el layout */

const dashboardGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',  // 2 columnas
  gap: '1rem',
  marginBottom: '1.5rem',
  width: '90%',
  maxWidth: '100%',
  overflow: 'hidden', 
};

const chartContainerStyle: React.CSSProperties = {
  border: 'var(--border)',
  marginTop: '1rem',
  marginBottom: '2rem',
  margin: '1rem auto',
  borderRadius: 'var(--border-radius1)',
  padding: 'var(--padding)',
  backgroundColor: 'var(--card-background)',
  boxShadow: 'var(--shadow-md)',
  width: '100%',
  overflow: 'hidden', 
  boxSizing: 'border-box', 
};

export { dashboardGridStyle, chartContainerStyle };