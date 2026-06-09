/**
 * src/utils/filterLogic.js
 * Hardened Filtering Engine for Cloud Database Structures
 */

export const applyFilters = (cardsArray, filters, currentFormat) => {
    if (!cardsArray || !Array.isArray(cardsArray)) return [];
    if (!filters) return cardsArray;

    const { colors = [], type = '' } = filters;
    const cleanType = type ? type.toLowerCase().trim() : '';

    return cardsArray.filter(card => {
        if (!card) return false;

        //Legality Filter
        if (currentFormat) {
            const formatKey = `legalities_${currentFormat.toLowerCase()}`;
            //If the card doesn't have the attribute, or isn't legal, filter it out
            if (!card[formatKey] || card[formatKey] !== 'legal') {
                return false;
            }
        }

        //Color Identity Filter
        //Appwrite stores colors as an array of strings (e.g., ["W", "U"]).
        //Ensure card.colors exists before calling array methods like .some() or .includes()
        if (colors && colors.length > 0) {
            const cardColors = Array.isArray(card.colors) ? card.colors : [];

            //EX: Check if card contains at least one of the selected filter colors
            const colorMatch = colors.some(filterColor => cardColors.includes(filterColor));
            if (!colorMatch) return false;
        }

        //Card Type Filter Block
        if (cleanType) {
            const cardTypeLine = card.type_line ? card.type_line.toLowerCase() : '';
            if (!cardTypeLine.includes(cleanType)) return false;
        }

        return true;
    });
};