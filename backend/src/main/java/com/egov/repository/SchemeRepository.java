package com.egov.repository;

import com.egov.entity.Scheme;
import com.egov.entity.SchemeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SchemeRepository extends JpaRepository<Scheme, UUID> {
    
    List<Scheme> findByType(SchemeType type);
    
    List<Scheme> findByNameContainingIgnoreCase(String name);
}
