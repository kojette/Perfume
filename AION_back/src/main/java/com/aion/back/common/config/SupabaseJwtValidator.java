package com.aion.back.common.config;
import java.security.AlgorithmParameters;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECParameterSpec;
import java.security.spec.ECPoint;
import java.security.spec.ECPublicKeySpec;
import java.util.Base64;
import java.math.BigInteger;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.ECParameterSpec;
import java.security.spec.ECPoint;
import java.security.spec.ECPublicKeySpec;
import java.util.Base64;

@Slf4j
@Component
public class SupabaseJwtValidator {

    @Value("${supabase.jwt.x}")
    private String xValue;

    @Value("${supabase.jwt.y}")
    private String yValue;

    public String validateAndGetEmail(String bearerToken) {
        return getClaims(bearerToken).get("email", String.class);
    }

    private Claims getClaims(String bearerToken) {
        try {
            String token = bearerToken.replace("Bearer ", "").trim();
            return Jwts.parserBuilder()
                    .setSigningKey(getPublicKeyFromXY())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (Exception e) {
            log.error("JWT 검증 실패: {}", e.getMessage());
            throw new JwtException("유효하지 않은 토큰입니다.");
        }
    }

    private PublicKey getPublicKeyFromXY() throws Exception {
        byte[] xBytes = Base64.getUrlDecoder().decode(xValue);
        byte[] yBytes = Base64.getUrlDecoder().decode(yValue);

        BigInteger x = new BigInteger(1, xBytes);
        BigInteger y = new BigInteger(1, yBytes);

        ECPoint ecPoint = new ECPoint(x, y);
        AlgorithmParameters params = AlgorithmParameters.getInstance("EC");
        params.init(new ECGenParameterSpec("secp256r1")); // P-256은 secp256r1입니다.
        ECParameterSpec ecParameters = params.getParameterSpec(ECParameterSpec.class);

        ECPublicKeySpec keySpec = new ECPublicKeySpec(ecPoint, ecParameters);
        KeyFactory keyFactory = KeyFactory.getInstance("EC");
        return keyFactory.generatePublic(keySpec);
    }
}