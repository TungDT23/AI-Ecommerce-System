package com.ecommerce.prediction_backend.controller;

import com.ecommerce.prediction_backend.entity.User;
import com.ecommerce.prediction_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin("*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<User> getUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable int id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(userOpt.get());
        } else {
            return ResponseEntity.status(404).body("Không tìm thấy người dùng với ID: " + id);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable int id, @RequestBody User userDetails) {
        Optional<User> userOpt = userRepository.findById(id);
        
        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("Không tìm thấy người dùng để cập nhật!");
        }

        User existingUser = userOpt.get();
        
        existingUser.setFullName(userDetails.getFullName());
        
        existingUser.setEmail(userDetails.getEmail());
        existingUser.setAge(userDetails.getAge());
        existingUser.setGender(userDetails.getGender());
        existingUser.setLocation(userDetails.getLocation());
        
        User updatedUser = userRepository.save(existingUser);
        
        return ResponseEntity.ok(updatedUser);
    }

    @PutMapping("/{id}/change-password")
    public ResponseEntity<?> changePassword(@PathVariable int id, @RequestBody java.util.Map<String, String> passwords) {
        Optional<User> userOpt = userRepository.findById(id);
        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("Không tìm thấy người dùng!");
        }

        User user = userOpt.get();
        String oldPassword = passwords.get("oldPassword");
        String newPassword = passwords.get("newPassword");

        if (!user.getPassword().equals(oldPassword)) {
            return ResponseEntity.badRequest().body("Mật khẩu cũ không chính xác!");
        }

        user.setPassword(newPassword);
        userRepository.save(user);

        return ResponseEntity.ok("Đổi mật khẩu thành công!");
    }
}