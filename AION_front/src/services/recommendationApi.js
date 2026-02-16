// src/services/recommendationApi.js
// 추천 관련 API 호출 함수들

import { get } from './api';

/**
 * 추천 향수 목록 조회
 * 
 * @param {Object} params - 쿼리 파라미터
 * @param {string} params.search - 검색어
 * @param {string[]} params.tags - 선호 태그 배열
 * @param {string} params.gender - 성별 (MALE, FEMALE, UNISEX)
 * @param {string[]} params.seasons - 계절 배열
 * @param {string[]} params.occasions - 용도 배열
 * @param {number} params.minPrice - 최소 가격
 * @param {number} params.maxPrice - 최대 가격
 * @param {string} params.sortBy - 정렬 기준 (latest, price-low, price-high, rating, popular)
 * @param {number} params.page - 페이지 번호
 * @param {number} params.size - 페이지 크기
 * @returns {Promise<Object>} 페이지네이션된 추천 향수 목록
 */
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

  // 배열을 쉼표로 구분된 문자열로 변환
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

/**
 * 특정 향수 추천 상세 정보
 * 
 * @param {number} perfumeId - 향수 ID
 * @returns {Promise<Object>} 향수 상세 정보
 */
export async function getRecommendationDetail(perfumeId) {
  return await get(`/recommendations/${perfumeId}`);
}

/**
 * 카테고리별 추천 향수 조회 (빠른 필터)
 * 
 * @param {string} category - 카테고리 (MAN, WOMAN, DATE, FRESH, SPRING, FALL)
 * @param {number} limit - 최대 개수
 * @returns {Promise<Array>} 추천 향수 목록
 */
export async function getRecommendationsByCategory(category, limit = 10) {
  return await get(`/recommendations/category/${category}`, { limit });
}

/**
 * 향수 목록 조회 (일반)
 * 
 * @param {number} page - 페이지 번호
 * @param {number} size - 페이지 크기
 * @returns {Promise<Object>} 페이지네이션된 향수 목록
 */
export async function getPerfumes(page = 0, size = 20) {
  return await get('/perfumes', { page, size });
}

/**
 * 향수 상세 조회
 * 
 * @param {number} perfumeId - 향수 ID
 * @returns {Promise<Object>} 향수 상세 정보
 */
export async function getPerfumeDetail(perfumeId) {
  return await get(`/perfumes/${perfumeId}`);
}