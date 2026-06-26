package com.egov.dto;

import com.egov.entity.SchemeType;
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
public class SchemeDTO {

    private UUID id;

    @NotBlank(message = "Scheme name is required")
    @Size(min = 2, max = 200, message = "Scheme name must be between 2 and 200 characters")
    private String name;

    @NotNull(message = "Scheme type is required")
    private SchemeType type;

    private String description;

    private String eligibility;
}
