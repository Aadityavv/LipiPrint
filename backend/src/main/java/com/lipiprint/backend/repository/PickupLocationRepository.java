package com.lipiprint.backend.repository;

import com.lipiprint.backend.entity.PickupLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PickupLocationRepository extends JpaRepository<PickupLocation, Long> {
    
    /**
     * Find all active pickup locations
     */
    List<PickupLocation> findByActiveTrue();
    
    /**
     * Find pickup locations by name containing the given text (case-insensitive)
     */
    List<PickupLocation> findByNameContainingIgnoreCase(String name);
    
    /**
     * Find pickup locations by address containing the given text (case-insensitive)
     */
    List<PickupLocation> findByAddressContainingIgnoreCase(String address);
} 