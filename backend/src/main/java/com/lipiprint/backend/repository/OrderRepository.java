package com.lipiprint.backend.repository;

import com.lipiprint.backend.entity.Order;
import com.lipiprint.backend.dto.OrderListDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserId(Long userId);
    Page<Order> findByUserId(Long userId, Pageable pageable);
    Page<Order> findByStatus(Order.Status status, Pageable pageable);

    long count();
    long countByStatus(Order.Status status);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status IN :statuses")
    Double sumTotalAmountByStatuses(@Param("statuses") List<Order.Status> statuses);

    @Query(value = "SELECT DATE(o.created_at) as day, COUNT(*) as count FROM orders o WHERE o.created_at >= CURRENT_DATE - INTERVAL '7 days' GROUP BY day ORDER BY day", nativeQuery = true)
    List<Object[]> getOrderCountByDayLast7Days();

    @Query(value = "SELECT DATE(o.created_at) as day, COALESCE(SUM(o.total_amount),0) as revenue FROM orders o WHERE o.created_at >= CURRENT_DATE - INTERVAL '7 days' AND o.status IN (:statuses) GROUP BY day ORDER BY day", nativeQuery = true)
    List<Object[]> getRevenueByDayLast7Days(@Param("statuses") List<String> statuses);

    @Query("SELECT new com.lipiprint.backend.dto.OrderListDTO(o.id, u.name, CAST(o.status AS string), o.totalAmount, o.createdAt, o.deliveryType, o.awbNumber, o.courierName, o.trackingUrl, o.expectedDeliveryDate) FROM Order o JOIN o.user u ORDER BY o.createdAt DESC")
    Page<OrderListDTO> findAllForList(Pageable pageable);

    @Query("SELECT new com.lipiprint.backend.dto.OrderListDTO(o.id, u.name, CAST(o.status AS string), o.totalAmount, o.createdAt, o.deliveryType, o.awbNumber, o.courierName, o.trackingUrl, o.expectedDeliveryDate) FROM Order o JOIN o.user u WHERE u.id = :userId ORDER BY o.createdAt DESC")
    Page<OrderListDTO> findAllForListByUser(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT new com.lipiprint.backend.dto.OrderListDTO(o.id, u.name, CAST(o.status AS string), o.totalAmount, o.createdAt, o.deliveryType, o.awbNumber, o.courierName, o.trackingUrl, o.expectedDeliveryDate) FROM Order o JOIN o.user u WHERE o.status = :status ORDER BY o.createdAt DESC")
    Page<OrderListDTO> findAllForListByStatus(@Param("status") String status, Pageable pageable);

    @Query("SELECT new com.lipiprint.backend.dto.OrderListDTO(o.id, u.name, CAST(o.status AS string), o.totalAmount, o.createdAt, o.deliveryType, o.awbNumber, o.courierName, o.trackingUrl, o.expectedDeliveryDate) FROM Order o JOIN o.user u WHERE u.id = :userId AND o.status = :status ORDER BY o.createdAt DESC")
    Page<OrderListDTO> findAllForListByUserAndStatus(@Param("userId") Long userId, @Param("status") String status, Pageable pageable);
} 