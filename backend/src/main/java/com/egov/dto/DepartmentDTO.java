package com.egov.dto;

import jakarta.validation.constraints.NotBlank;
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
public class DepartmentDTO {

    private UUID id;

    @NotBlank(message = "Department name is required")
    @Size(min = 2, max = 150, message = "Department name must be between 2 and 150 characters")
    private String name;

    private String description;

    private String icon;
}
