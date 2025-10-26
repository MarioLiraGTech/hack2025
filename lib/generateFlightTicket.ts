import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FlightTicketData {
  _id: string;
  fecha_registro: number;
  completado: boolean;
  carrito: {
    nombre: string;
    tipo: string;
  };
  sucursal_origen: {
    nombre: string;
    pais: string;
    ciudad: string;
  };
  sucursal_destino: {
    nombre: string;
    pais: string;
    ciudad: string;
  };
  productos: Array<{
    nombre: string;
    cantidad: number;
    sobrante?: number;
  }>;
}

// Función para cargar imagen como base64
async function loadImageAsBase64(imagePath: string): Promise<string> {
  try {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading image:', error);
    return '';
  }
}

export async function generateFlightTicket(flight: FlightTicketData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  // --- HEADER ---
  // Cargar y agregar el logo
  const logoBase64 = await loadImageAsBase64('/images/LogotipoAzul.png');
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, 10, 25, 25);
    } catch (error) {
      console.error('Error adding logo:', error);
      // Fallback: rectángulo morado si falla la carga
      doc.setFillColor(147, 51, 234);
      doc.roundedRect(margin, 15, 10, 10, 2, 2, 'F');
    }
  } else {
    // Fallback: rectángulo morado si no se carga la imagen
    doc.setFillColor(147, 51, 234);
    doc.roundedRect(margin, 15, 10, 10, 2, 2, 'F');
  }
  
  // Company name
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(20);
  doc.text('GroupGateIA', margin + 25, 22);

  // Header line
  doc.setDrawColor(229, 231, 235); // gray-200
  doc.setLineWidth(0.5);
  doc.line(margin, 30, pageWidth - margin, 30);

  // --- TITLE ---
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Flight Transfer Ticket', margin, 45);

  // --- FLIGHT DETAILS CARD ---
  let yPos = 55;
  
  // Card background
  doc.setFillColor(249, 250, 251); // gray-50
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 60, 3, 3, 'F');

  // Flight details grid
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128); // gray-500
  doc.setFont('helvetica', 'normal');
  
  const colWidth = (pageWidth - 2 * margin) / 3;
  
  // Row 1
  doc.text('Flight ID', margin + 5, yPos + 10);
  doc.text('Origin', margin + colWidth + 5, yPos + 10);
  doc.text('Destination', margin + 2 * colWidth + 5, yPos + 10);
  
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55); // gray-800
  doc.setFont('helvetica', 'bold');
  doc.text(flight._id.substring(0, 12), margin + 5, yPos + 17);
  doc.text(`${flight.sucursal_origen.nombre}, ${flight.sucursal_origen.pais}`, margin + colWidth + 5, yPos + 17, { maxWidth: colWidth - 10 });
  doc.text(`${flight.sucursal_destino.nombre}, ${flight.sucursal_destino.pais}`, margin + 2 * colWidth + 5, yPos + 17, { maxWidth: colWidth - 10 });

  // Row 2
  yPos += 25;
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Date', margin + 5, yPos + 10);
  doc.text('Cart', margin + colWidth + 5, yPos + 10);
  doc.text('Status', margin + 2 * colWidth + 5, yPos + 10);
  
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  const date = new Date(flight.fecha_registro).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.text(date, margin + 5, yPos + 17);
  doc.text(`${flight.carrito.nombre} (${flight.carrito.tipo})`, margin + colWidth + 5, yPos + 17, { maxWidth: colWidth - 10 });
  
  // Status badge
  const status = flight.completado ? 'Completed' : 'In Progress';
  const statusColor = flight.completado ? [34, 197, 94] : [234, 179, 8]; // green-500 : yellow-500
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.roundedRect(margin + 2 * colWidth + 5, yPos + 12, 35, 7, 2, 2, 'F');
  doc.text(status, margin + 2 * colWidth + 7, yPos + 17);

  // --- PRODUCTS TABLE ---
  yPos += 35;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Products Manifest', margin, yPos);

  yPos += 5;

  const tableHeaders = flight.completado 
    ? [['Product Name', 'Quantity Sent', 'Quantity Received', 'Lost/Damaged']]
    : [['Product Name', 'Quantity']];

  const tableData = flight.productos.map(p => {
    if (flight.completado && p.sobrante !== undefined) {
      const lost = p.cantidad - p.sobrante;
      return [
        p.nombre,
        p.cantidad.toString(),
        p.sobrante.toString(),
        lost > 0 ? lost.toString() : '-'
      ];
    }
    return [p.nombre, p.cantidad.toString()];
  });

  autoTable(doc, {
    startY: yPos,
    head: tableHeaders,
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138], // blue-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [31, 41, 55],
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // gray-50
    },
    margin: { left: margin, right: margin },
  });

  // --- FOOTER ---
  const footerY = doc.internal.pageSize.getHeight() - 20;

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);

  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `© ${new Date().getFullYear()} GroupGate Inc. All rights reserved.`,
    pageWidth / 2,
    footerY - 3,
    { align: 'center' }
  );
  doc.text(
    'contact@groupgate.com | +1 (123) 456-7890',
    pageWidth / 2,
    footerY + 3,
    { align: 'center' }
  );

  return doc;
}

export async function downloadFlightTicket(flight: FlightTicketData) {
  const doc = await generateFlightTicket(flight);
  const fileName = `flight-ticket-${flight._id.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

export async function previewFlightTicket(flight: FlightTicketData) {
  const doc = await generateFlightTicket(flight);
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, '_blank');
}
