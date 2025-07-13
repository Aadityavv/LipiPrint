package com.lipiprint.backend.service;

import com.lipiprint.backend.entity.PickupLocation;
import com.lipiprint.backend.repository.PickupLocationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class PickupLocationService {
    
    @Autowired
    private PickupLocationRepository pickupLocationRepository;
    
    /**
     * Get all active pickup locations
     */
    public List<PickupLocation> getAllActiveLocations() {
        return pickupLocationRepository.findByActiveTrue();
    }
    
    /**
     * Get all pickup locations (including inactive)
     */
    public List<PickupLocation> getAllLocations() {
        return pickupLocationRepository.findAll();
    }
    
    /**
     * Get pickup location by ID
     */
    public Optional<PickupLocation> getLocationById(Long id) {
        return pickupLocationRepository.findById(id);
    }
    
    /**
     * Create a new pickup location
     */
    public PickupLocation createLocation(PickupLocation location) {
        return pickupLocationRepository.save(location);
    }
    
    /**
     * Update an existing pickup location
     */
    public PickupLocation updateLocation(Long id, PickupLocation locationDetails) {
        PickupLocation location = pickupLocationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Pickup location not found"));
        
        location.setName(locationDetails.getName());
        location.setAddress(locationDetails.getAddress());
        location.setDistance(locationDetails.getDistance());
        location.setPhone(locationDetails.getPhone());
        location.setEmail(locationDetails.getEmail());
        location.setWorkingHours(locationDetails.getWorkingHours());
        location.setActive(locationDetails.isActive());
        
        return pickupLocationRepository.save(location);
    }
    
    /**
     * Delete a pickup location
     */
    public void deleteLocation(Long id) {
        pickupLocationRepository.deleteById(id);
    }
    
    /**
     * Search locations by name
     */
    public List<PickupLocation> searchByName(String name) {
        return pickupLocationRepository.findByNameContainingIgnoreCase(name);
    }
    
    /**
     * Search locations by address
     */
    public List<PickupLocation> searchByAddress(String address) {
        return pickupLocationRepository.findByAddressContainingIgnoreCase(address);
    }
} 