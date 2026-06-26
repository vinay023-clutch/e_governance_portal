package com.egov.dto;

import com.egov.entity.ApplicationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationDTO {

    private UUID id;

    private String applicationId;

    @NotNull(message = "User ID is required")
    private UUID userId;

    private String userName;

    private UUID schemeId;

    private String schemeName;

    @NotNull(message = "Application status is required")
    private ApplicationStatus status;

    private LocalDateTime submittedAt;
}
