import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSettings = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div style={{ padding: '30px' }}>
      <h2>Choose your language</h2>
      <button onClick={() => changeLanguage('en')}>English</button>
      <button onClick={() => changeLanguage('fr')}>Français</button>
      <button onClick={() => changeLanguage('es')}>Español</button>
      <button onClick={() => changeLanguage('ru')}>Русский</button>
    </div>
  );
};

export default LanguageSettings;
