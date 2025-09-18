package com.lipiprint.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lipiprint.backend.dto.LoginRequest;
import com.lipiprint.backend.dto.UserCreateRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureWebMvc
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
public class AuthControllerTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @Test
    public void testUserRegistration() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        
        UserCreateRequest signUpRequest = new UserCreateRequest();
        signUpRequest.setName("Test User");
        signUpRequest.setPhone("9876543210");
        signUpRequest.setEmail("test@example.com");
        signUpRequest.setPassword("password123");
        signUpRequest.setUserType("student");

        ObjectMapper objectMapper = new ObjectMapper();
        String requestJson = objectMapper.writeValueAsString(signUpRequest);

        mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.userDTO.name").value("Test User"))
                .andExpect(jsonPath("$.userDTO.phone").value("9876543210"));
    }

    @Test
    public void testUserLogin() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        
        // First register a user
        UserCreateRequest signUpRequest = new UserCreateRequest();
        signUpRequest.setName("Test User");
        signUpRequest.setPhone("9876543211");
        signUpRequest.setEmail("test2@example.com");
        signUpRequest.setPassword("password123");
        signUpRequest.setUserType("student");

        ObjectMapper objectMapper = new ObjectMapper();
        String signUpJson = objectMapper.writeValueAsString(signUpRequest);

        mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(signUpJson));

        // Now test login
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setPhone("9876543211");
        loginRequest.setPassword("password123");

        String loginJson = objectMapper.writeValueAsString(loginRequest);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.userDTO.name").value("Test User"))
                .andExpect(jsonPath("$.userDTO.phone").value("9876543211"));
    }

    @Test
    public void testInvalidLogin() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setPhone("9999999999");
        loginRequest.setPassword("wrongpassword");

        ObjectMapper objectMapper = new ObjectMapper();
        String loginJson = objectMapper.writeValueAsString(loginRequest);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid phone number or password"));
    }
}
