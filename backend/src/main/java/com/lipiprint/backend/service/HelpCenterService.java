package com.lipiprint.backend.service;

import com.lipiprint.backend.entity.HelpCenterArticle;
import com.lipiprint.backend.repository.HelpCenterArticleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class HelpCenterService {
    @Autowired
    private HelpCenterArticleRepository articleRepository;

    public HelpCenterArticle save(HelpCenterArticle article) {
        return articleRepository.save(article);
    }

    public Optional<HelpCenterArticle> findById(Long id) {
        return articleRepository.findById(id);
    }

    public List<HelpCenterArticle> findAll() {
        return articleRepository.findAll();
    }
} 