package com.ecommerce.prediction_backend.controller;

import org.springframework.web.bind.annotation.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin("*")
public class PaymentController {

    // Mã cấu hình Sandbox test (Do VNPay cung cấp cho môi trường thử nghiệm)
    private final String vnp_TmnCode = "KAYYLKSN"; 
    private final String vnp_HashSecret = "NQ5Y8P48TS3IZ9FXR7GEHBVJP6EDNEP6"; 
    private final String vnp_PayUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    private final String vnp_ReturnUrl = "http://localhost:5173/"; // Link trả về web React 

    @GetMapping("/create_url")
    public Map<String, String> createPaymentUrl(@RequestParam("amount") long amount, @RequestParam("orderId") String orderId) {
        try {
            Map<String, String> vnp_Params = new HashMap<>();
            vnp_Params.put("vnp_Version", "2.1.0");
            vnp_Params.put("vnp_Command", "pay");
            vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
            vnp_Params.put("vnp_Amount", String.valueOf(amount * 100)); // VNPay yêu cầu nhân 100
            vnp_Params.put("vnp_CurrCode", "VND");
            
            // Mã giao dịch ghép với thời gian để đảm bảo không bị trùng lặp
            vnp_Params.put("vnp_TxnRef", orderId + "_" + System.currentTimeMillis()); 
            
            // FIX 1: Viết liền không dấu cách để tránh lỗi Encode URL của VNPay
            vnp_Params.put("vnp_OrderInfo", "Thanh_toan_don_hang_ma_" + orderId);
            
            // FIX 2: Bổ sung tham số bắt buộc (Loại hàng hóa: other)
            vnp_Params.put("vnp_OrderType", "other");
            
            vnp_Params.put("vnp_Locale", "vn");
            vnp_Params.put("vnp_ReturnUrl", vnp_ReturnUrl);
            vnp_Params.put("vnp_IpAddr", "127.0.0.1");

            // Cấu hình thời gian tạo và hết hạn của mã QR
            Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
            SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
            vnp_Params.put("vnp_CreateDate", formatter.format(cld.getTime()));
            cld.add(Calendar.MINUTE, 15);
            vnp_Params.put("vnp_ExpireDate", formatter.format(cld.getTime()));

            // Chuẩn bị dữ liệu để băm bảo mật
            List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
            Collections.sort(fieldNames);
            StringBuilder hashData = new StringBuilder();
            StringBuilder query = new StringBuilder();
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = vnp_Params.get(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString())).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    if (itr.hasNext()) {
                        query.append('&');
                        hashData.append('&');
                    }
                }
            }
            
            // Ký số (Tạo chữ ký điện tử)
            String queryUrl = query.toString();
            String vnp_SecureHash = hmacSHA512(vnp_HashSecret, hashData.toString());
            queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
            String paymentUrl = vnp_PayUrl + "?" + queryUrl;
            
            Map<String, String> result = new HashMap<>();
            result.put("paymentUrl", paymentUrl);
            return result;
        } catch (Exception e) {
            return Collections.singletonMap("error", e.getMessage());
        }
    }

    // Hàm tạo chữ ký điện tử chuẩn VNPay
    private String hmacSHA512(final String key, final String data) throws Exception {
        Mac hmac512 = Mac.getInstance("HmacSHA512");
        SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
        hmac512.init(secretKey);
        byte[] result = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder(2 * result.length);
        for (byte b : result) {
            sb.append(String.format("%02x", b & 0xff));
        }
        return sb.toString();
    }
}