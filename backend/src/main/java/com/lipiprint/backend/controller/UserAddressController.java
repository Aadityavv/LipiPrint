package com.lipiprint.backend.controller;

import com.lipiprint.backend.entity.User;
import com.lipiprint.backend.entity.UserAddress;
import com.lipiprint.backend.repository.UserAddressRepository;
import com.lipiprint.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/addresses")
public class UserAddressController {
    @Autowired private UserAddressRepository repo;
    @Autowired private UserService userService;

    @GetMapping
    public List<UserAddress> getAddresses(Authentication auth) {
        User user = userService.findByPhone(auth.getName()).orElseThrow();
        return repo.findByUserId(user.getId());
    }

    @PostMapping
    public UserAddress addAddress(@RequestBody UserAddress address, Authentication auth) {
        User user = userService.findByPhone(auth.getName()).orElseThrow();
        address.setUser(user);
        return repo.save(address);
    }

    @PutMapping("/{id}")
    public UserAddress updateAddress(@PathVariable Long id, @RequestBody UserAddress address, Authentication auth) {
        User user = userService.findByPhone(auth.getName()).orElseThrow();
        UserAddress existing = repo.findByIdAndUserId(id, user.getId()).orElseThrow();
        existing.setLine1(address.getLine1());
        existing.setLine2(address.getLine2());
        existing.setLine3(address.getLine3());
        existing.setPhone(address.getPhone());
        existing.setAddressType(address.getAddressType());
        return repo.save(existing);
    }

    @DeleteMapping("/{id}")
    public void deleteAddress(@PathVariable Long id, Authentication auth) {
        User user = userService.findByPhone(auth.getName()).orElseThrow();
        repo.deleteById(id);
    }

    @PutMapping("/{id}/default")
    public void setDefault(@PathVariable Long id, Authentication auth) {
        User user = userService.findByPhone(auth.getName()).orElseThrow();
        repo.findByUserId(user.getId()).forEach(addr -> {
            addr.setIsDefault(addr.getId().equals(id));
            repo.save(addr);
        });
    }
} 