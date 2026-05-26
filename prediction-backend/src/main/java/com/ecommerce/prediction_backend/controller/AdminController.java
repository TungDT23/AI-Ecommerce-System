package com.ecommerce.prediction_backend.controller;

import com.ecommerce.prediction_backend.entity.UserActivity;
import com.ecommerce.prediction_backend.repository.UserActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin("*")
public class AdminController {

    @Autowired
    private UserActivityRepository userActivityRepository;

    @GetMapping("/activities")
    public List<UserActivity> getAllActivities() {
        return userActivityRepository.findAll();
    }
}