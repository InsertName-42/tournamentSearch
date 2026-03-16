export const applyFilters = (cards, filters, format) => {
  return cards.filter(card => {
    //Format Check
    if (card.legalities[format.toLowerCase()] !== 'legal') return false;

    //Color Filter
    if (filters.colors.length > 0) {
      const hasSelectedColor = card.colors.some(c => filters.colors.includes(c));
      if (!hasSelectedColor) return false;
    }

    //Type Filter
    if (filters.type && !card.type_line.includes(filters.type)) {
      return false;
    }

    return true;
  });
};