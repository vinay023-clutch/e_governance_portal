package com.egov.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @Value("${app.firebase.config-path}")
    private String firebaseConfigPath;

    @PostConstruct
    public void initializeFirebase() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                InputStream serviceAccountStream;
                if (firebaseConfigPath.startsWith("classpath:")) {
                    String resourcePath = firebaseConfigPath.substring("classpath:".length());
                    Resource resource = new ClassPathResource(resourcePath);
                    serviceAccountStream = resource.getInputStream();
                } else {
                    serviceAccountStream = new java.io.FileInputStream(firebaseConfigPath);
                }

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccountStream))
                        .build();

                FirebaseApp.initializeApp(options);
                System.out.println("Firebase Admin SDK initialized successfully.");
            }
        } catch (IOException e) {
            System.err.println("Failed to initialize Firebase Admin SDK: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
