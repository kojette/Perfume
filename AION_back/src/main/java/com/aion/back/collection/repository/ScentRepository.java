package com.aion.back.collection.repository;

import com.aion.back.collection.entity.Scent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScentRepository extends JpaRepository<Scent, Long> {

    List<Scent> findByScentIdIn(List<Long> scentIds);
}