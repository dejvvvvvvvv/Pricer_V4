/**
 * Invoice PDF Service
 *
 * Generates professional PDF invoices compliant with Czech legal requirements.
 * Uses pdfmake for PDF generation and qrcode for SPAYD QR payment codes.
 *
 * Required npm packages:
 *   - pdfmake
 *   - qrcode
 *
 * Czech invoice mandatory fields:
 *   1. Supplier: name, address, ICO, DIC (if VAT payer)
 *   2. Customer: name, address, ICO, DIC
 *   3. Invoice number (unique sequential)
 *   4. Issue date, taxable supply date, due date
 *   5. Items: description, quantity, unit price, total
 *   6. Tax base, VAT rate, VAT amount, total with VAT
 *   7. Bank account (account number, IBAN)
 *   8. QR payment (SPAYD format)
 *   9. Note: "Nejsem platce DPH" or "Platce DPH"
 *
 * Font: Roboto (built-in pdfmake, supports Czech diacritics)
 *
 * Pure service module — NO Express dependency.
 *
 * @module services/invoiceService
 */

import { logInfo, logWarn, logError } from '../util/logger.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default VAT rate in Czech Republic (21%) */
const DEFAULT_VAT_RATE = 21;

/** Colors matching the project's Forge design system */
const COLORS = {
  primary: '#1a1a2e',
  accent: '#0ea5e9',
  textDark: '#1a1a2e',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  bgLight: '#f9fafb',
  bgHighlight: '#f0fdf4',
  success: '#15803d',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a number as Czech currency.
 *
 * @param {number} amount
 * @param {string} [currency='CZK']
 * @returns {string}
 */
function formatPrice(amount, currency = 'CZK') {
  const num = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${num.toFixed(2)} ${currency}`;
  }
}

/**
 * Format a Date as a Czech locale date string (DD.MM.YYYY).
 *
 * @param {Date|string} date
 * @returns {string}
 */
function formatDate(date) {
  if (!date) return '\u2014';
  try {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return String(date);
  }
}

/**
 * Generate a SPAYD (Short Payment Descriptor) string for QR payment.
 *
 * SPAYD format: SPD*1.0*ACC:{iban}*AM:{amount}*CC:{currency}*VS:{vs}*MSG:{msg}
 *
 * @param {object} params
 * @param {string} params.iban         - IBAN account number
 * @param {number} params.amount       - Amount to pay
 * @param {string} [params.currency='CZK'] - Currency code
 * @param {string} [params.vs]         - Variable symbol (variabilni symbol)
 * @param {string} [params.message]    - Payment message
 * @returns {string} SPAYD string
 */
function buildSpaydString({ iban, amount, currency = 'CZK', vs, message }) {
  const parts = ['SPD*1.0'];
  if (iban) parts.push(`ACC:${iban.replace(/\s/g, '')}`);
  if (amount != null) parts.push(`AM:${Number(amount).toFixed(2)}`);
  parts.push(`CC:${currency}`);
  if (vs) parts.push(`VS:${String(vs).replace(/\D/g, '').slice(0, 10)}`);
  if (message) parts.push(`MSG:${String(message).slice(0, 60).replace(/\*/g, '')}`);
  return parts.join('*');
}

/**
 * Generate a QR code as a base64-encoded PNG data URL.
 *
 * @param {string} text - Text to encode
 * @returns {Promise<string>} Data URL (data:image/png;base64,...)
 */
async function generateQrDataUrl(text) {
  try {
    const QRCode = await import('qrcode');
    return await QRCode.default.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 150,
    });
  } catch (err) {
    logWarn(`[invoiceService] Failed to generate QR code: ${err.message}. Install: npm install qrcode`);
    return null;
  }
}

/**
 * Extract a numeric variable symbol from the invoice number.
 * Takes only digits, max 10 characters.
 *
 * @param {string} invoiceNumber
 * @returns {string}
 */
function extractVariableSymbol(invoiceNumber) {
  return String(invoiceNumber).replace(/\D/g, '').slice(0, 10);
}

// ---------------------------------------------------------------------------
// pdfmake document definition builder
// ---------------------------------------------------------------------------

/**
 * Build the pdfmake document definition for an invoice.
 *
 * @param {object} inv - Full invoice data object (see generateInvoicePdf JSDoc)
 * @param {string|null} qrDataUrl - QR code as data URL, or null
 * @returns {object} pdfmake document definition
 */
function buildDocDefinition(inv, qrDataUrl) {
  const {
    supplier = {},
    customer = {},
    items = [],
    invoiceNumber = '',
    dates = {},
    bankAccount = {},
    vatPayer = false,
    vatRate = DEFAULT_VAT_RATE,
    currency = 'CZK',
    notes = '',
    companyLogo = null,
  } = inv;

  // ---- Calculate totals ----
  let subtotal = 0;
  const tableItems = items.map((item, idx) => {
    const qty = Number(item.quantity) || 1;
    const unitPrice = Number(item.unitPrice || item.price) || 0;
    const lineTotal = Number(item.totalPrice) || unitPrice * qty;
    subtotal += lineTotal;

    return [
      { text: String(idx + 1), alignment: 'center' },
      { text: item.description || item.name || `Polo\u017eka ${idx + 1}` },
      { text: String(qty), alignment: 'center' },
      { text: formatPrice(unitPrice, currency), alignment: 'right' },
      { text: formatPrice(lineTotal, currency), alignment: 'right' },
    ];
  });

  const vatAmount = vatPayer ? subtotal * (vatRate / 100) : 0;
  const totalWithVat = subtotal + vatAmount;

  // ---- Header: supplier + invoice info ----
  const headerColumns = [
    // Left: supplier info (with optional logo)
    {
      width: '*',
      stack: [
        ...(companyLogo ? [{ image: companyLogo, width: 120, margin: [0, 0, 0, 8] }] : []),
        { text: supplier.name || 'Dodavatel', style: 'supplierName' },
        { text: supplier.address || '', style: 'small', margin: [0, 2, 0, 0] },
        {
          columns: [
            { text: `I\u010cO: ${supplier.ico || '\u2014'}`, style: 'small', width: 'auto' },
            ...(supplier.dic ? [{ text: `DI\u010c: ${supplier.dic}`, style: 'small', width: 'auto', margin: [12, 0, 0, 0] }] : []),
          ],
          margin: [0, 4, 0, 0],
        },
      ],
    },
    // Right: invoice meta
    {
      width: 200,
      stack: [
        { text: 'FAKTURA', style: 'invoiceTitle', alignment: 'right' },
        {
          layout: 'noBorders',
          table: {
            widths: ['*', 'auto'],
            body: [
              [
                { text: '\u010c\u00edslo faktury:', style: 'metaLabel', alignment: 'right' },
                { text: invoiceNumber, style: 'metaValue', alignment: 'right' },
              ],
              [
                { text: 'Datum vystaven\u00ed:', style: 'metaLabel', alignment: 'right' },
                { text: formatDate(dates.issued), style: 'metaValue', alignment: 'right' },
              ],
              [
                { text: 'Datum zdan. pln\u011bn\u00ed:', style: 'metaLabel', alignment: 'right' },
                { text: formatDate(dates.taxableSupply || dates.issued), style: 'metaValue', alignment: 'right' },
              ],
              [
                { text: 'Datum splatnosti:', style: 'metaLabel', alignment: 'right' },
                { text: formatDate(dates.due), style: 'metaValue', alignment: 'right' },
              ],
            ],
          },
        },
      ],
    },
  ];

  // ---- Customer box ----
  const customerSection = {
    margin: [0, 16, 0, 16],
    columns: [
      { width: '*', text: '' },
      {
        width: 260,
        stack: [
          { text: 'Odb\u011bratel', style: 'sectionHeader', margin: [0, 0, 0, 4] },
          {
            table: {
              widths: ['*'],
              body: [
                [
                  {
                    stack: [
                      { text: customer.name || '\u2014', bold: true, fontSize: 11 },
                      { text: customer.address || '', style: 'small', margin: [0, 2, 0, 0] },
                      ...(customer.ico ? [{ text: `I\u010cO: ${customer.ico}`, style: 'small', margin: [0, 2, 0, 0] }] : []),
                      ...(customer.dic ? [{ text: `DI\u010c: ${customer.dic}`, style: 'small', margin: [0, 2, 0, 0] }] : []),
                    ],
                    margin: [8, 8, 8, 8],
                  },
                ],
              ],
            },
            layout: {
              hLineWidth: () => 1,
              vLineWidth: () => 1,
              hLineColor: () => COLORS.border,
              vLineColor: () => COLORS.border,
            },
          },
        ],
      },
    ],
  };

  // ---- Items table ----
  const itemsTableHeader = [
    { text: '\u010c.', style: 'tableHeader', alignment: 'center' },
    { text: 'Popis', style: 'tableHeader' },
    { text: 'Ks', style: 'tableHeader', alignment: 'center' },
    { text: 'Cena/ks', style: 'tableHeader', alignment: 'right' },
    { text: 'Celkem', style: 'tableHeader', alignment: 'right' },
  ];

  const itemsTable = {
    margin: [0, 0, 0, 16],
    table: {
      headerRows: 1,
      widths: [25, '*', 35, 80, 80],
      body: [
        itemsTableHeader,
        ...(tableItems.length > 0
          ? tableItems
          : [[{ text: 'Bez polo\u017eek', colSpan: 5, alignment: 'center', color: COLORS.textMuted }, {}, {}, {}, {}]]),
      ],
    },
    layout: {
      hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5),
      vLineWidth: () => 0,
      hLineColor: (i) => (i <= 1 ? COLORS.primary : COLORS.border),
      fillColor: (rowIndex) => {
        if (rowIndex === 0) return COLORS.primary;
        return rowIndex % 2 === 0 ? COLORS.bgLight : null;
      },
    },
  };

  // ---- Totals section ----
  const totalsBody = [
    [
      { text: 'Z\u00e1klad dan\u011b:', style: 'totalsLabel', alignment: 'right' },
      { text: formatPrice(subtotal, currency), style: 'totalsValue', alignment: 'right' },
    ],
  ];

  if (vatPayer) {
    totalsBody.push([
      { text: `DPH (${vatRate} %):`, style: 'totalsLabel', alignment: 'right' },
      { text: formatPrice(vatAmount, currency), style: 'totalsValue', alignment: 'right' },
    ]);
  }

  totalsBody.push([
    { text: 'Celkem k \u00fahrad\u011b:', style: 'totalsFinal', alignment: 'right' },
    { text: formatPrice(totalWithVat, currency), style: 'totalsFinalValue', alignment: 'right' },
  ]);

  const totalsSection = {
    columns: [
      { width: '*', text: '' },
      {
        width: 220,
        table: {
          widths: ['*', 100],
          body: totalsBody,
        },
        layout: {
          hLineWidth: (i, node) => (i === node.table.body.length - 1 || i === node.table.body.length ? 2 : 0),
          vLineWidth: () => 0,
          hLineColor: () => COLORS.primary,
        },
      },
    ],
    margin: [0, 0, 0, 20],
  };

  // ---- Payment info + QR ----
  const paymentColumns = [];

  // Left: bank details
  const bankStack = [
    { text: 'Platebn\u00ed \u00fadaje', style: 'sectionHeader', margin: [0, 0, 0, 4] },
  ];

  if (bankAccount.accountNumber) {
    bankStack.push({ text: `\u010c\u00edslo \u00fa\u010dtu: ${bankAccount.accountNumber}`, style: 'small' });
  }
  if (bankAccount.iban) {
    bankStack.push({ text: `IBAN: ${bankAccount.iban}`, style: 'small', margin: [0, 2, 0, 0] });
  }
  if (bankAccount.bic) {
    bankStack.push({ text: `BIC/SWIFT: ${bankAccount.bic}`, style: 'small', margin: [0, 2, 0, 0] });
  }

  const vs = extractVariableSymbol(invoiceNumber);
  if (vs) {
    bankStack.push({ text: `Variabiln\u00ed symbol: ${vs}`, style: 'small', margin: [0, 2, 0, 0] });
  }

  paymentColumns.push({ width: '*', stack: bankStack });

  // Right: QR code
  if (qrDataUrl) {
    paymentColumns.push({
      width: 160,
      stack: [
        { text: 'QR platba', style: 'sectionHeader', alignment: 'center', margin: [0, 0, 0, 4] },
        { image: qrDataUrl, width: 130, alignment: 'center' },
      ],
    });
  }

  const paymentSection = {
    columns: paymentColumns,
    margin: [0, 0, 0, 16],
  };

  // ---- VAT note ----
  const vatNote = vatPayer
    ? 'Pl\u00e1tce DPH'
    : 'Nejsem pl\u00e1tce DPH.';

  // ---- Footer ----
  const footerContent = [];
  if (notes) {
    footerContent.push({ text: `Pozn\u00e1mka: ${notes}`, style: 'small', margin: [0, 0, 0, 4] });
  }
  footerContent.push({
    text: vatNote,
    style: 'small',
    bold: true,
    margin: [0, 0, 0, 4],
  });

  const footerSection = {
    stack: footerContent,
    margin: [0, 8, 0, 0],
  };

  // ---- Assemble document ----
  return {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 60],

    content: [
      { columns: headerColumns },
      { canvas: [{ type: 'line', x1: 0, y1: 6, x2: 515, y2: 6, lineWidth: 2, lineColor: COLORS.primary }] },
      customerSection,
      itemsTable,
      totalsSection,
      paymentSection,
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: COLORS.border }] },
      footerSection,
    ],

    footer: (currentPage, pageCount) => ({
      columns: [
        { text: `Strana ${currentPage} / ${pageCount}`, alignment: 'center', style: 'footerText' },
      ],
      margin: [40, 20, 40, 0],
    }),

    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      color: COLORS.textDark,
    },

    styles: {
      supplierName: { fontSize: 14, bold: true, color: COLORS.primary },
      invoiceTitle: { fontSize: 22, bold: true, color: COLORS.primary },
      sectionHeader: { fontSize: 11, bold: true, color: COLORS.primary, decoration: 'underline' },
      small: { fontSize: 9, color: COLORS.textMuted },
      metaLabel: { fontSize: 9, color: COLORS.textMuted },
      metaValue: { fontSize: 9, bold: true },
      tableHeader: { fontSize: 9, bold: true, color: '#ffffff', margin: [0, 4, 0, 4] },
      totalsLabel: { fontSize: 10, color: COLORS.textMuted, margin: [0, 2, 0, 2] },
      totalsValue: { fontSize: 10, bold: true, margin: [0, 2, 0, 2] },
      totalsFinal: { fontSize: 12, bold: true, color: COLORS.primary, margin: [0, 4, 0, 4] },
      totalsFinalValue: { fontSize: 12, bold: true, color: COLORS.success, margin: [0, 4, 0, 4] },
      footerText: { fontSize: 8, color: COLORS.textMuted },
    },
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a PDF invoice as a Buffer.
 *
 * @param {object} invoiceData
 * @param {object}  invoiceData.supplier          - Supplier details
 * @param {string}  invoiceData.supplier.name     - Company name
 * @param {string}  invoiceData.supplier.address  - Full address
 * @param {string}  invoiceData.supplier.ico      - ICO (identification number)
 * @param {string}  [invoiceData.supplier.dic]    - DIC (tax ID, if VAT payer)
 * @param {object}  invoiceData.customer          - Customer details
 * @param {string}  invoiceData.customer.name     - Customer name
 * @param {string}  [invoiceData.customer.address] - Customer address
 * @param {string}  [invoiceData.customer.ico]    - Customer ICO
 * @param {string}  [invoiceData.customer.dic]    - Customer DIC
 * @param {Array<{ description?: string, name?: string, quantity?: number, unitPrice?: number, price?: number, totalPrice?: number }>} invoiceData.items - Line items
 * @param {string}  invoiceData.invoiceNumber     - Unique invoice number
 * @param {object}  invoiceData.dates             - Important dates
 * @param {string|Date} invoiceData.dates.issued  - Issue date
 * @param {string|Date} [invoiceData.dates.taxableSupply] - Taxable supply date (defaults to issued)
 * @param {string|Date} invoiceData.dates.due     - Due date
 * @param {object}  [invoiceData.bankAccount]     - Bank account info
 * @param {string}  [invoiceData.bankAccount.accountNumber] - Czech account number
 * @param {string}  [invoiceData.bankAccount.iban] - IBAN
 * @param {string}  [invoiceData.bankAccount.bic]  - BIC/SWIFT
 * @param {boolean} [invoiceData.vatPayer=false]  - Whether supplier is VAT payer
 * @param {number}  [invoiceData.vatRate=21]      - VAT rate (%)
 * @param {string}  [invoiceData.currency='CZK']  - Currency code
 * @param {string}  [invoiceData.notes]           - Additional notes
 * @param {string}  [invoiceData.companyLogo]     - Base64 data URL of company logo
 * @returns {Promise<Buffer>} PDF file as a Node.js Buffer
 * @throws {Error} If pdfmake is not installed or data is invalid
 */
export async function generateInvoicePdf(invoiceData) {
  if (!invoiceData) {
    throw Object.assign(new Error('Invoice data is required.'), { code: 'MP_INVALID_INPUT' });
  }
  if (!invoiceData.invoiceNumber) {
    throw Object.assign(new Error('Invoice number is required.'), { code: 'MP_INVALID_INPUT' });
  }
  if (!invoiceData.supplier?.name) {
    throw Object.assign(new Error('Supplier name is required.'), { code: 'MP_INVALID_INPUT' });
  }

  logInfo(`[invoiceService] Generating PDF for invoice ${invoiceData.invoiceNumber}`);

  // ---- Generate QR code ----
  let qrDataUrl = null;
  const iban = invoiceData.bankAccount?.iban;
  if (iban) {
    // Calculate total for QR
    const items = invoiceData.items || [];
    let subtotal = 0;
    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice || item.price) || 0;
      subtotal += Number(item.totalPrice) || unitPrice * qty;
    }
    const vatAmount = invoiceData.vatPayer ? subtotal * ((invoiceData.vatRate || DEFAULT_VAT_RATE) / 100) : 0;
    const totalAmount = subtotal + vatAmount;

    const spayd = buildSpaydString({
      iban,
      amount: totalAmount,
      currency: invoiceData.currency || 'CZK',
      vs: extractVariableSymbol(invoiceData.invoiceNumber),
      message: `Faktura ${invoiceData.invoiceNumber}`,
    });

    qrDataUrl = await generateQrDataUrl(spayd);
  }

  // ---- Build pdfmake document ----
  const docDefinition = buildDocDefinition(invoiceData, qrDataUrl);

  // ---- Create PDF via pdfmake ----
  let PdfPrinter;
  try {
    const pdfmakeModule = await import('pdfmake');
    // pdfmake ESM default export is the PdfPrinter constructor
    PdfPrinter = pdfmakeModule.default || pdfmakeModule;
  } catch (importErr) {
    throw Object.assign(
      new Error('Failed to import pdfmake. Install it: npm install pdfmake'),
      { code: 'MP_DEPENDENCY_MISSING' },
    );
  }

  // Roboto font paths — pdfmake ships with Roboto in its own package
  let fonts;
  try {
    // pdfmake v0.2+ ships fonts at pdfmake/build/vfs_fonts
    // For server-side usage with PdfPrinter, we need actual TTF file paths.
    // pdfmake provides them at node_modules/pdfmake/build/vfs_fonts.js
    // However, the cleaner approach is to use the standard Roboto paths:
    const { fileURLToPath } = await import('node:url');
    const { dirname, join } = await import('node:path');

    // Find pdfmake's font directory
    const pdfmakePath = dirname(fileURLToPath(import.meta.resolve('pdfmake')));
    const fontsDir = join(pdfmakePath, 'fonts', 'Roboto');

    fonts = {
      Roboto: {
        normal: join(fontsDir, 'Roboto-Regular.ttf'),
        bold: join(fontsDir, 'Roboto-Medium.ttf'),
        italics: join(fontsDir, 'Roboto-Italic.ttf'),
        bolditalics: join(fontsDir, 'Roboto-MediumItalic.ttf'),
      },
    };
  } catch {
    // Fallback: try standard pdfmake font location
    try {
      const { dirname, join } = await import('node:path');
      const { createRequire } = await import('node:module');
      const require = createRequire(import.meta.url);
      const pdfmakePath = dirname(require.resolve('pdfmake/package.json'));
      const fontsDir = join(pdfmakePath, 'fonts', 'Roboto');

      fonts = {
        Roboto: {
          normal: join(fontsDir, 'Roboto-Regular.ttf'),
          bold: join(fontsDir, 'Roboto-Medium.ttf'),
          italics: join(fontsDir, 'Roboto-Italic.ttf'),
          bolditalics: join(fontsDir, 'Roboto-MediumItalic.ttf'),
        },
      };
    } catch (fontErr) {
      throw Object.assign(
        new Error(`Cannot resolve pdfmake Roboto fonts: ${fontErr.message}`),
        { code: 'MP_FONT_ERROR' },
      );
    }
  }

  const printer = new PdfPrinter(fonts);
  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  // Collect PDF chunks into a Buffer
  return new Promise((resolve, reject) => {
    const chunks = [];
    pdfDoc.on('data', (chunk) => chunks.push(chunk));
    pdfDoc.on('end', () => {
      const buffer = Buffer.concat(chunks);
      logInfo(`[invoiceService] PDF generated: invoice=${invoiceData.invoiceNumber} size=${buffer.length} bytes`);
      resolve(buffer);
    });
    pdfDoc.on('error', (err) => {
      logError(`[invoiceService] PDF generation failed: ${err.message}`);
      reject(Object.assign(new Error(`PDF generation failed: ${err.message}`), { code: 'MP_PDF_ERROR' }));
    });
    pdfDoc.end();
  });
}

/**
 * Build invoice data from an order object and tenant configuration.
 *
 * Convenience function that maps order store data + env config into the
 * structure expected by generateInvoicePdf().
 *
 * @param {object} order       - Order object from ordersStore
 * @param {object} [tenantCfg] - Tenant configuration (company info, branding)
 * @returns {object} invoiceData ready for generateInvoicePdf()
 */
export function buildInvoiceDataFromOrder(order, tenantCfg = {}) {
  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + 14); // 14-day payment term

  // Invoice number: from existing invoice data or generate from order
  const invoiceNumber = order.invoiceNumber
    || `FV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(order.id || '').slice(-6).toUpperCase()}`;

  // Supplier from env vars or tenant config
  const supplier = {
    name: tenantCfg.companyName || process.env.INVOICE_COMPANY_NAME || 'ModelPricer s.r.o.',
    address: tenantCfg.companyAddress || process.env.INVOICE_COMPANY_ADDRESS || '',
    ico: tenantCfg.companyIco || process.env.INVOICE_COMPANY_ICO || '',
    dic: tenantCfg.companyDic || process.env.INVOICE_COMPANY_DIC || '',
  };

  // Customer from order data
  const customer = {
    name: order.customerName || order.customer?.name || '',
    address: order.shippingAddress || order.customerAddress || order.customer?.address || '',
    ico: order.customerIco || order.customer?.ico || '',
    dic: order.customerDic || order.customer?.dic || '',
  };

  // Items normalization
  const rawItems = order.items || order.models || [];
  const items = rawItems.map((item, idx) => ({
    description: item.name || item.modelName || `Polo\u017eka ${idx + 1}`,
    quantity: Number(item.quantity) || 1,
    unitPrice: Number(item.unitPrice || item.price) || 0,
    totalPrice: Number(item.totalPrice) || (Number(item.quantity) || 1) * (Number(item.unitPrice || item.price) || 0),
  }));

  // Bank account
  const bankAccount = {
    accountNumber: tenantCfg.bankAccount || process.env.INVOICE_BANK_ACCOUNT || '',
    iban: tenantCfg.bankIban || process.env.INVOICE_BANK_IBAN || '',
  };

  const vatPayer = tenantCfg.vatPayer ?? (process.env.INVOICE_VAT_PAYER === 'true');

  return {
    supplier,
    customer,
    items,
    invoiceNumber,
    dates: {
      issued: now,
      taxableSupply: now,
      due: dueDate,
    },
    bankAccount,
    vatPayer,
    currency: order.currency || 'CZK',
    notes: order.notes || '',
  };
}
