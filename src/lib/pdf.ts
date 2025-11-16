import jsPDF from "jspdf";
import type { Invoice } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const PRIMARY = { r: 59, g: 130, b: 246 };
const TEXT = { r: 31, g: 41, b: 55 };
const MUTED = { r: 113, g: 128, b: 150 };
const BORDER = { r: 226, g: 232, b: 240 };

const COMPANY = {
  name: "Yuktra AI Solutions",
  email: "info@yuktraai.com",
  phone: "+91 7447678037",
  location: "Bhubaneswar, Odisha, India",
};

function summarize(invoice: Invoice) {
  const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = invoice.lineItems.reduce((sum, item) => {
    const taxRate = item.taxRate ?? 0;
    return sum + ((item.quantity * item.unitPrice * taxRate) / 100);
  }, 0);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

function getCurrencySymbol(currency: string) {
  const parts = new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).formatToParts(0);
  return parts.find((part) => part.type === "currency")?.value ?? currency;
}

function formatCurrency(value: number, currency: string) {
  const symbol = getCurrencySymbol(currency);
  const number = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
  return `${symbol} ${number}`;
}

function addBrandBar(doc: jsPDF) {
  doc.setFillColor(PRIMARY.r, PRIMARY.g, PRIMARY.b);
  doc.rect(0, 0, 612, 70, "F");
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.name, 40, 45);
}

function drawCard(
  doc: jsPDF,
  {
    x,
    y,
    width,
    height,
    title,
    lines,
  }: { x: number; y: number; width: number; height: number; title: string; lines: string[] },
) {
  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  doc.rect(x, y, width, height);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text(title.toUpperCase(), x + 12, y + 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(TEXT.r, TEXT.g, TEXT.b);
  lines.forEach((line, idx) => {
    doc.text(line, x + 12, y + 38 + idx * 16, { maxWidth: width - 24 });
  });
}

function addClientAndPayableCards(doc: jsPDF, invoice: Invoice) {
  const clientLines = [
    invoice.clientName ?? "Client",
    invoice.projectName ? `Project: ${invoice.projectName}` : undefined,
    `Client ID: ${invoice.clientId}`,
  ].filter(Boolean) as string[];
  drawCard(doc, {
    x: 40,
    y: 100,
    width: 250,
    height: 120,
    title: "Invoice for",
    lines: clientLines,
  });
  drawCard(doc, {
    x: 320,
    y: 100,
    width: 250,
    height: 120,
    title: "Payable to",
    lines: [COMPANY.name, COMPANY.email, COMPANY.phone, COMPANY.location],
  });
}

function addMetaCard(doc: jsPDF, invoice: Invoice) {
  drawCard(doc, {
    x: 40,
    y: 240,
    width: 530,
    height: 110,
    title: "Invoice details",
    lines: [
      `Invoice #: ${invoice.id}`,
      `Issue date: ${formatDate(invoice.issueDate)}`,
      `Due date: ${formatDate(invoice.dueDate)}`,
      `Status: ${invoice.status}`,
    ],
  });
}

function addLineItems(doc: jsPDF, invoice: Invoice, currency: string) {
  const startY = 380;
  doc.setFontSize(11);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text("Description", 40, startY);
  doc.text("Qty", 270, startY);
  doc.text("Price", 330, startY);
  doc.text("Tax%", 420, startY);
  doc.text("Total", 500, startY);
  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  doc.line(40, startY + 5, 540, startY + 5);

  let currentY = startY + 25;
  doc.setTextColor(TEXT.r, TEXT.g, TEXT.b);
  invoice.lineItems.forEach((item) => {
    doc.text(item.description, 40, currentY, { maxWidth: 200 });
    doc.text(String(item.quantity), 270, currentY);
    doc.text(formatCurrency(item.unitPrice, currency), 330, currentY);
    doc.text(`${item.taxRate ?? 0}%`, 420, currentY);
    const lineTotal = item.quantity * item.unitPrice;
    doc.text(formatCurrency(lineTotal, currency), 500, currentY, { align: "right" });
    currentY += 22;
  });
  return currentY + 10;
}

function addTotals(doc: jsPDF, invoice: Invoice, startY: number) {
  const currency = invoice.currency ?? "INR";
  const { subtotal, tax, total } = summarize(invoice);
  doc.setFontSize(11);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text("Subtotal", 360, startY);
  doc.text("Tax", 360, startY + 18);
  doc.setFontSize(14);
  doc.setTextColor(PRIMARY.r, PRIMARY.g, PRIMARY.b);
  doc.text("Total", 360, startY + 48);

  doc.setFontSize(11);
  doc.setTextColor(TEXT.r, TEXT.g, TEXT.b);
  doc.text(formatCurrency(subtotal, currency), 520, startY, { align: "right" });
  doc.text(formatCurrency(tax, currency), 520, startY + 18, { align: "right" });
  doc.setFontSize(14);
  doc.setTextColor(PRIMARY.r, PRIMARY.g, PRIMARY.b);
  doc.text(formatCurrency(total, currency), 520, startY + 48, { align: "right" });

  if (invoice.notes) {
    doc.setFontSize(10);
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    doc.text("Notes", 40, startY);
    doc.setFontSize(11);
    doc.setTextColor(TEXT.r, TEXT.g, TEXT.b);
    doc.text(invoice.notes, 40, startY + 18, { maxWidth: 280 });
  }
}

export function buildInvoicePdf(invoice: Invoice) {
  const doc = new jsPDF({
    unit: "pt",
  });
  doc.setFont("helvetica", "normal");
  addBrandBar(doc);
  addClientAndPayableCards(doc, invoice);
  addMetaCard(doc, invoice);
  const currency = invoice.currency ?? "INR";
  const nextY = addLineItems(doc, invoice, currency);
  addTotals(doc, invoice, nextY + 20);
  return doc;
}

export function downloadInvoicePdf(invoice: Invoice) {
  const doc = buildInvoicePdf(invoice);
  doc.save(`${invoice.id}.pdf`);
}

export function printInvoicePdf(invoice: Invoice) {
  const doc = buildInvoicePdf(invoice);
  const blobUrl = doc.output("bloburl");
  const printWindow = window.open(blobUrl);
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }
}
