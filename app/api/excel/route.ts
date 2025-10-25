import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Ruta relativa al root del proyecto — cambialo si tu estructura difiere
    const filePath = path.join(
      process.cwd(),
      'DataA',
      '[HackMTY2025]_ConsumptionPrediction_Dataset_v1.xlsx'
    );

    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Leer todo como JSON (SheetJS infiere nombres de columnas tal como están en el Excel)
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: null });

    // Normalizar columnas: intenta mapear a las columnas que usa la UI
    const rows = raw.map((r: Record<string, unknown>) => {
      const get = (keys: string[]) => {
        for (const k of keys) {
          if (k in r && r[k] != null) return r[k];
        }
        return null;
      };

      const productName = String(get(['Product_Name', 'Product name', 'Product', 'Product Name', 'PRODUCT', 'product']) ?? '').trim();
      const quantityRaw = get(['Quantity_Consumed', 'Quantity', 'Quantity Consumed', 'Qty', 'consumption', 'CONSUMED']);
      const quantity = Number(quantityRaw ?? 0) || 0;
      const flightType = String(get(['Flight_Type', 'Flight Type', 'FlightType', 'Type']) ?? 'unknown');

      return {
        Product_Name: productName,
        Quantity_Consumed: quantity,
        Flight_Type: flightType,
        _raw: r,
      };
    });

    // Agregados y ordenamiento
    const productMap = new Map<string, number>();
    const flightTypeMap = new Map<string, number>();
    
    // Para calcular porcentaje de productos regresados
    const returnedPercentageMap = new Map<string, { returned: number; standard: number; percentage: number }>();
    
    let total = 0;

    type CleanRow = { Product_Name: string; Quantity_Consumed: number; Flight_Type: string; _raw?: Record<string, unknown> };
    rows.forEach((row: CleanRow) => {
      const rawRow = row._raw || {};
      
      total += row.Quantity_Consumed;
      productMap.set(row.Product_Name, (productMap.get(row.Product_Name) || 0) + row.Quantity_Consumed);
      flightTypeMap.set(row.Flight_Type, (flightTypeMap.get(row.Flight_Type) || 0) + row.Quantity_Consumed);
      
      // Calcular porcentaje de regresados
      const standardQty = Number(rawRow['Standard_Specification_Qty'] || rawRow['Standard Specification Qty'] || 0);
      const returnedQty = Number(rawRow['Quantity_Returned'] || rawRow['Quantity Returned'] || 0);
      
      if (standardQty > 0 && returnedQty > 0) {
        const current = returnedPercentageMap.get(row.Product_Name) || { returned: 0, standard: 0, percentage: 0 };
        const newReturned = current.returned + returnedQty;
        const newStandard = current.standard + standardQty;
        const newPercentage = (newReturned / newStandard) * 100;
        
        returnedPercentageMap.set(row.Product_Name, {
          returned: newReturned,
          standard: newStandard,
          percentage: newPercentage,
        });
      }
    });

    const sortedProducts = [...productMap.entries()].sort((a, b) => b[1] - a[1]);
    const topProducts = sortedProducts.slice(0, 10);

    const flightTypes = [...flightTypeMap.entries()].sort((a, b) => b[1] - a[1]);
    
    // Top 5 productos con mayor porcentaje de regresados
    const topReturnedPercentage = [...returnedPercentageMap.entries()]
      .sort((a, b) => b[1].percentage - a[1].percentage)
      .slice(0, 5)
      .map(([name, data]) => [name, data.percentage] as [string, number]);

    return NextResponse.json({ 
      rows, 
      total, 
      topProducts, 
      flightTypes,
      topReturnedPercentage,
    });
  } catch (err: unknown) {
    console.error('Error leyendo Excel:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
