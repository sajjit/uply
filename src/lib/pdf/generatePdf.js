import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/* ============================================================
   PDF generation for Uply invoices and purchase orders.
   Runs entirely in the browser — no server round-trip needed.
   Produces a Blob that callers can either:
     - upload to Supabase Storage (see lib/api/invoices.js), or
     - trigger a direct browser download.
   ============================================================ */

const PAGE_WIDTH = 595; // A4 in points
const PAGE_HEIGHT = 842;
const MARGIN = 50;

const UPLY_INFO = {
  manager: 'CÉVA Steeve',
  address: 'Résidence Calebassier 4, Palais Royale, 97139 Les Abymes',
  phone: '0690935996',
  email: 'Steeveceva@outlook.fr',
  siret: '932934768',
  vat: 'FR32932938764',
};

async function setupDoc() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  return { pdfDoc, page, font, fontBold };
}

function drawHeader(page, font, fontBold, { docTitle, docNumber, dateLabel, restaurant }) {
  let y = PAGE_HEIGHT - MARGIN;

  // Brand mark + Uply's own company info (required on French invoices/POs)
  page.drawText('Uply', { x: MARGIN, y, size: 22, font: fontBold, color: rgb(0.10, 0.11, 0.10) });
  const brandLines = [
    `${UPLY_INFO.manager} — Réapprovisionnement simplifié`,
    UPLY_INFO.address,
    `Tél : ${UPLY_INFO.phone} · ${UPLY_INFO.email}`,
    `SIRET : ${UPLY_INFO.siret} · TVA : ${UPLY_INFO.vat}`,
  ];
  let brandY = y - 16;
  for (const line of brandLines) {
    page.drawText(line, { x: MARGIN, y: brandY, size: 7, font, color: rgb(0.4, 0.4, 0.4) });
    brandY -= 10;
  }

  // Document title block (right aligned)
  const titleWidth = fontBold.widthOfTextAtSize(docTitle, 16);
  page.drawText(docTitle, { x: PAGE_WIDTH - MARGIN - titleWidth, y, size: 16, font: fontBold, color: rgb(0.91, 0.44, 0.23) });
  const numText = `N° ${docNumber}`;
  const numWidth = font.widthOfTextAtSize(numText, 10);
  page.drawText(numText, { x: PAGE_WIDTH - MARGIN - numWidth, y: y - 18, size: 10, font, color: rgb(0.3, 0.3, 0.3) });
  const dateWidth = font.widthOfTextAtSize(dateLabel, 10);
  page.drawText(dateLabel, { x: PAGE_WIDTH - MARGIN - dateWidth, y: y - 32, size: 10, font, color: rgb(0.3, 0.3, 0.3) });

  y -= 78;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: rgb(0.85, 0.83, 0.78) });

  y -= 24;
  page.drawText('Restaurant', { x: MARGIN, y, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(restaurant.name || '', { x: MARGIN, y: y - 14, size: 12, font: fontBold, color: rgb(0.10, 0.11, 0.10) });
  let contactY = y - 28;
  if (restaurant.address) {
    page.drawText(restaurant.address, { x: MARGIN, y: contactY, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
    contactY -= 12;
  }
  if (restaurant.phone) {
    page.drawText(restaurant.phone, { x: MARGIN, y: contactY, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
    contactY -= 12;
  }

  return Math.min(y - 40, contactY - 14);
}

function drawLineItemsTable(page, font, fontBold, items, startY, { showPrice }) {
  let y = startY;
  const colName = MARGIN;
  const colQty = 330;
  const colUnit = 390;
  const colPrice = showPrice ? 460 : null;

  // Header row
  page.drawRectangle({ x: MARGIN, y: y - 4, width: PAGE_WIDTH - MARGIN * 2, height: 22, color: rgb(0.10, 0.11, 0.10) });
  page.drawText('Produit', { x: colName + 4, y: y + 2, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Qté', { x: colQty, y: y + 2, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Unité', { x: colUnit, y: y + 2, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  if (showPrice) page.drawText('Prix', { x: colPrice, y: y + 2, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  y -= 26;

  let total = 0;
  for (const [i, item] of items.entries()) {
    if (y < 100) break; // simple overflow guard; full pagination not needed for MVP order sizes
    const rowBg = i % 2 === 0 ? rgb(0.97, 0.96, 0.94) : rgb(1, 1, 1);
    page.drawRectangle({ x: MARGIN, y: y - 4, width: PAGE_WIDTH - MARGIN * 2, height: 20, color: rowBg });
    page.drawText(String(item.name).slice(0, 40), { x: colName + 4, y: y, size: 9, font, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(String(item.qty), { x: colQty, y: y, size: 9, font, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(String(item.unit || ''), { x: colUnit, y: y, size: 9, font, color: rgb(0.1, 0.1, 0.1) });
    if (showPrice) {
      const lineTotal = (item.qty || 0) * (item.unitPrice || 0);
      total += lineTotal;
      page.drawText(`${lineTotal.toFixed(2)} €`, { x: colPrice, y: y, size: 9, font, color: rgb(0.1, 0.1, 0.1) });
    }
    y -= 22;
  }

  return { y, total };
}

/**
 * Generates an invoice PDF for a delivered order.
 * @param {object} order - order row with order_items, plus restaurant name, invoice number
 * @returns {Promise<Blob>}
 */
export async function generateInvoicePdf(order, restaurant) {
  const { pdfDoc, page, font, fontBold } = await setupDoc();

  const dateLabel = `Date : ${new Date(order.created_at).toLocaleDateString('fr-FR')}`;
  let y = drawHeader(page, font, fontBold, {
    docTitle: 'FACTURE',
    docNumber: order.invoice_number || order.id.slice(0, 8).toUpperCase(),
    dateLabel,
    restaurant,
  });

  y -= 10;
  const items = (order.order_items || []).map((it) => ({ name: it.name, qty: it.qty, unit: it.unit, unitPrice: it.unit_price || 0 }));
  const { y: afterTable, total } = drawLineItemsTable(page, font, fontBold, items, y, { showPrice: true });

  let finalY = afterTable - 10;
  page.drawLine({ start: { x: 330, y: finalY }, end: { x: PAGE_WIDTH - MARGIN, y: finalY }, thickness: 0.5, color: rgb(0.85, 0.83, 0.78) });
  finalY -= 20;
  page.drawText('Total', { x: 390, y: finalY, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(`${total.toFixed(2)} €`, { x: 460, y: finalY, size: 11, font: fontBold, color: rgb(0.91, 0.44, 0.23) });

  if (order.comment) {
    finalY -= 40;
    page.drawText('Commentaire :', { x: MARGIN, y: finalY, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(String(order.comment).slice(0, 90), { x: MARGIN, y: finalY - 14, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
  }

  page.drawText('Document généré automatiquement par Uply', { x: MARGIN, y: 40, size: 7, font, color: rgb(0.6, 0.6, 0.6) });

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

/**
 * Generates a purchase order (bon de commande) PDF, typically before
 * the order has been delivered/invoiced — no prices required.
 * @param {object} order - order row with order_items
 * @returns {Promise<Blob>}
 */
export async function generatePurchaseOrderPdf(order, restaurant) {
  const { pdfDoc, page, font, fontBold } = await setupDoc();

  const dateLabel = `Date : ${new Date(order.created_at).toLocaleDateString('fr-FR')}`;
  let y = drawHeader(page, font, fontBold, {
    docTitle: 'BON DE COMMANDE',
    docNumber: order.id.slice(0, 8).toUpperCase(),
    dateLabel,
    restaurant,
  });

  y -= 10;
  const items = (order.order_items || []).map((it) => ({ name: it.name, qty: it.qty, unit: it.unit }));
  const { y: afterTable } = drawLineItemsTable(page, font, fontBold, items, y, { showPrice: false });

  let finalY = afterTable - 10;
  if (order.delivery_date) {
    page.drawText('Livraison prévue :', { x: MARGIN, y: finalY, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
    const deliveryText = new Date(order.delivery_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) +
      (order.delivery_window ? ` · ${order.delivery_window}` : '');
    page.drawText(deliveryText, { x: 170, y: finalY, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
    finalY -= 18;
  }
  if (order.comment) {
    page.drawText('Commentaire :', { x: MARGIN, y: finalY, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(String(order.comment).slice(0, 90), { x: MARGIN, y: finalY - 14, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
  }

  page.drawText('Document généré automatiquement par Uply', { x: MARGIN, y: 40, size: 7, font, color: rgb(0.6, 0.6, 0.6) });

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

/**
 * Generates a delivery note (bon de livraison) PDF — handed to the driver /
 * kept by the restaurant as proof of what was actually delivered, distinct
 * from the purchase order (sent before delivery) and the invoice (with prices).
 * @param {object} order - order row with order_items
 * @returns {Promise<Blob>}
 */
export async function generateDeliveryNotePdf(order, restaurant) {
  const { pdfDoc, page, font, fontBold } = await setupDoc();

  const dateLabel = `Date : ${new Date(order.delivery_date || order.created_at).toLocaleDateString('fr-FR')}`;
  let y = drawHeader(page, font, fontBold, {
    docTitle: 'BON DE LIVRAISON',
    docNumber: order.id.slice(0, 8).toUpperCase(),
    dateLabel,
    restaurant,
  });

  y -= 10;
  const items = (order.order_items || []).map((it) => ({ name: it.name, qty: it.qty, unit: it.unit }));
  const { y: afterTable } = drawLineItemsTable(page, font, fontBold, items, y, { showPrice: false });

  let finalY = afterTable - 30;
  page.drawText('Signature du destinataire :', { x: MARGIN, y: finalY, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
  page.drawRectangle({ x: MARGIN, y: finalY - 70, width: 200, height: 60, borderColor: rgb(0.75, 0.75, 0.75), borderWidth: 1, color: rgb(1, 1, 1) });

  page.drawText('Document généré automatiquement par Uply', { x: MARGIN, y: 40, size: 7, font, color: rgb(0.6, 0.6, 0.6) });

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

/** Triggers a direct browser download of a generated PDF blob. */
export function downloadPdf(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
