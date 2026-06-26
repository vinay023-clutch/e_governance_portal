package com.egov.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceDTO {

    private UUID id;

    @NotNull(message = "Department ID is required")
    private UUID departmentId;

    private String departmentName;

    @NotBlank(message = "Service name is required")
    @Size(min = 2, max = 150, message = "Service name must be between 2 and 150 characters")
    private String name;

    private String description;
}
