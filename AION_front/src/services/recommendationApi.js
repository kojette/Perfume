import { get } from './api';

export async function getRecommendations(params = {}) {
  const {
    search,
    tags = [],
    gender,
    seasons = [],
    occasions = [],
    minPrice,
    maxPrice,
    sortBy = 'latest',
    page = 0,
    size = 20,
  } = params;

  const queryParams = {
    ...(search && { search }),
    ...(tags.length > 0 && { tags: tags.join(',') }),
    ...(gender && { gender }),
    ...(seasons.length > 0 && { season: seasons.join(',') }),
    ...(occasions.length > 0 && { occasion: occasions.join(',') }),
    ...(minPrice !== undefined && { minPrice }),
    ...(maxPrice !== undefined && { maxPrice }),
    sortBy,
    page,
    size,
  };

  return await get('/recommendations', queryParams);
}

export async function getRecommendationDetail(perfumeId) {
  return await get(`/recommendations/${perfumeId}`);
}

export async function getRecommendationsByCategory(category, limit = 10) {
  return await get(`/recommendations/category/${category}`, { limit });
}

export async function getPerfumes(page = 0, size = 20) {
  return await get('/perfumes', { page, size });
}

export async function getPerfumeDetail(perfumeId) {
  return await get(`/perfumes/${perfumeId}`);
}