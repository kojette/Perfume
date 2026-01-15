package com.aion.back.member.service;

import com.aion.back.member.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public boolean isEmailDuplicated(String email) {
        return userRepository.existsByEmail(email);
    }
}