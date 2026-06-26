package com.egov.repository;

import com.egov.entity.Application;
import com.egov.entity.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, UUID> {
    
    Optional<Application> findByApplicationId(String applicationId);
    
    List<Application> findByUserId(UUID userId);
    
    List<Application> findByStatus(ApplicationStatus status);
    
    List<Application> findBySchemeId(UUID schemeId);
    
    boolean existsByApplicationId(String applicationId);
}
