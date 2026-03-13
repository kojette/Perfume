package com.aion.back.common.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * ✅ Caffeine 캐시 설정
 * - scentCategories: 향 카테고리+재료 목록 (거의 변하지 않는 정적 데이터)
 *   → TTL 1시간, 최대 100개 항목
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager("scentCategories");
        manager.setCaffeine(
            Caffeine.newBuilder()
                .expireAfterWrite(1, TimeUnit.HOURS)  // 1시간 후 자동 만료
                .maximumSize(100)                      // 최대 100개 항목
                .recordStats()                         // 캐시 히트율 통계 (디버깅용)
        );
        return manager;
    }
}