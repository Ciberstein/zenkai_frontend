const formatDate = (date, locale = 'es-ES') => {
  if (!date) return '';

  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default formatDate;
