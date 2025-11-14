// LocalStorage management for favorites
const FAVORITES_KEY = 'weed365_favorites';

export interface Favorite {
  id: string;
  title: string;
  date: string;
  tags: string;
  savedAt: number;
}

export function getFavorites(): Favorite[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
}

export function isFavorite(date: string): boolean {
  const favorites = getFavorites();
  return favorites.some(fav => fav.date === date);
}

export function addFavorite(favorite: Omit<Favorite, 'savedAt'>): void {
  try {
    const favorites = getFavorites();
    const newFavorite: Favorite = {
      ...favorite,
      savedAt: Date.now(),
    };

    // Don't add duplicates
    if (!favorites.some(fav => fav.date === favorite.date)) {
      favorites.unshift(newFavorite);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  } catch (error) {
    console.error('Error adding favorite:', error);
  }
}

export function removeFavorite(date: string): void {
  try {
    const favorites = getFavorites();
    const filtered = favorites.filter(fav => fav.date !== date);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing favorite:', error);
  }
}

export function toggleFavorite(favorite: Omit<Favorite, 'savedAt'>): boolean {
  if (isFavorite(favorite.date)) {
    removeFavorite(favorite.date);
    return false;
  } else {
    addFavorite(favorite);
    return true;
  }
}
