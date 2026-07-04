import React, { useState, useEffect } from 'react';
import { FileText, Download } from 'lucide-react';
import * as api from '../../lib/api';
import { TopBar, EmptyState, fmtDate } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';

export default function MyInvoices({ restaurantId, onBack }) {
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState(null);

  useEffect(() => {
    api.fetchInvoices(restaurantId).then(({ data }) => {
      setInvoices(data);
      setLoading(false);
    });
  }, [restaurantId]);

  async function openInvoice(inv) {
    setOpeningId(inv.id);
    const { url } = await api.getInvoiceUrl(inv.invoice_url);
    setOpeningId(null);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      alert("Impossible d'ouvrir la facture pour le moment.");
    }
  }

  return (
    <div>
      <TopBar title="Mes factures" onBack={onBack} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {loading ? (
          <div className="uply-mono" style={{ color: '#8A938A', fontSize: 12 }}>{t('loading')}</div>
        ) : invoices.length === 0 ? (
          <EmptyState icon={<FileText size={32} />} title="Aucune facture pour le moment" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {invoices.map((inv) => (
              <button
                key={inv.id}
                onClick={() => openInvoice(inv)}
                disabled={openingId === inv.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #E1E6E1', borderRadius: 8, padding: 12, textAlign: 'left', width: '100%' }}
              >
                <FileText size={18} color="#1FB9D6" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{inv.invoice_number}</div>
                  <div className="uply-mono" style={{ fontSize: 10, color: '#8A938A' }}>{fmtDate(inv.created_at)}</div>
                </div>
                <Download size={16} color="#8A938A" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
