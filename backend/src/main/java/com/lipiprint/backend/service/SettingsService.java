package com.lipiprint.backend.service;

import com.lipiprint.backend.entity.Settings;
import com.lipiprint.backend.repository.SettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class SettingsService {
    @Autowired
    private SettingsRepository settingsRepository;

    public Settings save(Settings settings) {
        return settingsRepository.save(settings);
    }

    public Optional<Settings> findById(Long id) {
        return settingsRepository.findById(id);
    }

    public List<Settings> findAll() {
        return settingsRepository.findAll();
    }

    // Get acceptingOrders setting (default true if not set)
    public boolean isAcceptingOrders() {
        return settingsRepository.findAll().stream()
            .filter(s -> "acceptingOrders".equals(s.getKey()))
            .findFirst()
            .map(s -> Boolean.parseBoolean(s.getValue()))
            .orElse(true);
    }

    // Set acceptingOrders setting
    public void setAcceptingOrders(boolean accepting) {
        Settings s = settingsRepository.findAll().stream()
            .filter(x -> "acceptingOrders".equals(x.getKey()))
            .findFirst()
            .orElseGet(() -> {
                Settings news = new Settings();
                news.setKey("acceptingOrders");
                return news;
            });
        s.setValue(Boolean.toString(accepting));
        settingsRepository.save(s);
    }
} 