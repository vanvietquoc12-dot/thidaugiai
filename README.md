# Thi đấu giải — Cờ tướng

Sân chơi **giải Swiss chạy liên tục**. GitHub là nguồn code. Figma UI kit: [Game — UI Kit](https://www.figma.com/design/NsUlcIo5g9at6p8LHpw5yU).

## Chơi ngay

Mở `index.html` trên trình duyệt, hoặc GitHub Pages khi bật trên branch `main`.

1. Sảnh giải — cặp Swiss 8 kỳ thủ  
2. **Vào bàn** — bạn cầm đỏ, máy cầm đen  
3. Hết ván cập nhật điểm, sang vòng sau (3 vòng)

## Luật đã có

Tướng / sĩ / tượng / mã (cản) / xe / pháo / tốt qua sông, cung, không xuyên sông với tượng, tướng không đối mặt, không đi vào nước bị chiếu.

## Chưa có (phase 2)

- Server đồng hồ + PvP trên VPS Hostinger  
- Elo thật  
- Engine Pikafish  
- Anti-cheat  

## Cấu trúc

```
index.html
css/app.css
js/xiangqi.js      luật
js/ai.js           máy đánh
js/tournament.js   Swiss
js/app.js          UI
```
