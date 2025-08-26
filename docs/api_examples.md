# RCS API Examples

## Authentication
All API calls require Bearer token authentication:
```
Authorization: Bearer rcs_qirKDSqNZurdYhDXszdjI8XYxVFXqLLE
```

## Text Messages

### Simple Text Message
```bash
curl -X POST http://localhost:3000/api/rcs/send \
  -H "Authorization: Bearer rcs_qirKDSqNZurdYhDXszdjI8XYxVFXqLLE" \
  -H "Content-Type: application/json" \
  -d '{"type":"text","text":"Test message"}'
```

## Media Messages

### Real Image from Lorem Picsum
```bash
curl -X POST http://localhost:3000/api/rcs/send \
  -H "Authorization: Bearer rcs_qirKDSqNZurdYhDXszdjI8XYxVFXqLLE" \
  -H "Content-Type: application/json" \
  -d '{"type":"media","mediaType":"image","url":"https://picsum.photos/300/200","text":"Beautiful random image from Lorem Picsum"}'
```

### High-Quality Unsplash Image
```bash
curl -X POST http://localhost:3000/api/rcs/send \
  -H "Authorization: Bearer rcs_qirKDSqNZurdYhDXszdjI8XYxVFXqLLE" \
  -H "Content-Type: application/json" \
  -d '{"type":"media","mediaType":"image","url":"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop","text":"Stunning mountain landscape from Unsplash"}'
```

## Video Messages

### Big Buck Bunny Sample Video
```bash
curl -X POST http://localhost:3000/api/rcs/send \
  -H "Authorization: Bearer rcs_qirKDSqNZurdYhDXszdjI8XYxVFXqLLE" \
  -H "Content-Type: application/json" \
  -d '{"type":"media","mediaType":"video","url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4","text":"Big Buck Bunny - Sample video clip"}'
```

### Short Sample MP4 Video
```bash
curl -X POST http://localhost:3000/api/rcs/send \
  -H "Authorization: Bearer rcs_qirKDSqNZurdYhDXszdjI8XYxVFXqLLE" \
  -H "Content-Type: application/json" \
  -d '{"type":"media","mediaType":"video","url":"https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4","text":"Short sample MP4 video file"}'
```

## Rich Cards

### iPhone 15 Pro Rich Card
```bash
curl -X POST http://localhost:3000/api/rcs/send \
  -H "Authorization: Bearer rcs_qirKDSqNZurdYhDXszdjI8XYxVFXqLLE" \
  -H "Content-Type: application/json" \
  -d '{"type":"richCard","title":"iPhone 15 Pro","description":"Experience the titanium iPhone 15 Pro with Action Button, powerful A17 Pro chip, and pro camera system.","image":"https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&h=200&fit=crop","actions":[{"label":"Buy Now","action":"buy_iphone","type":"primary"},{"label":"Learn More","action":"learn_more","type":"secondary"}]}'
```

### Coffee Shop Rich Card
```bash
curl -X POST http://localhost:3000/api/rcs/send \
  -H "Authorization: Bearer rcs_qirKDSqNZurdYhDXszdjI8XYxVFXqLLE" \
  -H "Content-Type: application/json" \
  -d '{"type":"richCard","title":"Coffee Time ☕","description":"Start your morning with the perfect cup of coffee. Fresh roasted beans delivered to your door.","image":"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=200&fit=crop","actions":[{"label":"Order Coffee","action":"order_coffee","type":"primary"},{"label":"View Menu","action":"view_menu","type":"secondary"}]}'
```

## Response Format
All successful API calls return:
```json
{
  "success": true,
  "messageId": "1755999170995",
  "timestamp": "2025-08-24T01:32:50.995Z",
  "message": "RCS message sent successfully"
}
```