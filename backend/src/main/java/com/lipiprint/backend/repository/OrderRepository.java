package com.lipiprint.backend.repository;

import com.lipiprint.backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserId(Long userId);

    long count();
    long countByStatus(Order.Status status);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status IN :statuses")
    Double sumTotalAmountByStatuses(@Param("statuses") List<Order.Status> statuses);

    @Query(value = "SELECT DATE(o.created_at) as day, COUNT(*) as count FROM orders o WHERE o.created_at >= CURRENT_DATE - INTERVAL '7 days' GROUP BY day ORDER BY day", nativeQuery = true)
    List<Object[]> getOrderCountByDayLast7Days();

    @Query(value = "SELECT DATE(o.created_at) as day, COALESCE(SUM(o.total_amount),0) as revenue FROM orders o WHERE o.created_at >= CURRENT_DATE - INTERVAL '7 days' AND o.status IN (:statuses) GROUP BY day ORDER BY day", nativeQuery = true)
    List<Object[]> getRevenueByDayLast7Days(@Param("statuses") List<String> statuses);
} 