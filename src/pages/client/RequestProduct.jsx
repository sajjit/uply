import React, { useState } from 'react';
import { TopBar, TextField, PrimaryButton } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';

export default function RequestProduct({ onBack, onSubmit }) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setBusy(true);
    await onSubmit(name.trim(), comment.trim());
    setBusy(false);
  }

  return (
    <div>
      <TopBar title={t('suggestProduct')} onBack={onBack} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 13, color: '#576257', marginBottom: 18 }}>{t('suggestProductDesc')}</div>
        <TextField label={t('productNameLabel')} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('productNamePlaceholder')} />
        <TextField label={t('commentLabelOptional')} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('commentPlaceholderHelpful')} />
        <PrimaryButton disabled={!name.trim() || busy} onClick={handleSubmit}>
          {t('sendRequest')}
        </PrimaryButton>
      </div>
    </div>
  );
}
