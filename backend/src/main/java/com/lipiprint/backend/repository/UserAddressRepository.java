package com.lipiprint.backend.repository;

import com.lipiprint.backend.entity.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserAddressRepository extends JpaRepository<UserAddress, Long> {
    List<UserAddress> findByUserId(Long userId);
    Optional<UserAddress> findByIdAndUserId(Long id, Long userId);
    
    // ✅ ADD: This method is used in your controller's setDefault method
    Optional<UserAddress> findByUserIdAndIsDefaultTrue(Long userId);
}