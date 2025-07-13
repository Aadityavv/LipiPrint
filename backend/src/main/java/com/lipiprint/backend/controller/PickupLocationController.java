package com.lipiprint.backend.controller;

import com.lipiprint.backend.entity.PickupLocation;
import com.lipiprint.backend.service.PickupLocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/pickup-locations")
public class PickupLocationController {
    @Autowired
    private PickupLocationService pickupLocationService;

    @GetMapping("")
    public List<PickupLocation> getAllActivePickupLocations() {
        return pickupLocationService.getAllActiveLocations();
    }
} 