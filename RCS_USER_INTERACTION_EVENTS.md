# RCS User Interaction Events - GSMA Standard Implementation Guide

## Overview

This document outlines the comprehensive RCS user interaction events based on GSMA RCS specifications, formatted for webhook delivery to business servers. Events are prioritized by business criticality for implementation planning.

## Implementation Priorities

### 🚨 **Priority A - Mandatory Day 1 Events**
*Essential interactions that every RCS business implementation requires*

### 🔧 **Priority B - Enhanced Features**
*Advanced interactions for rich user experience and analytics*

---

## Priority A - Mandatory Day 1 Events

### 1. User Message Events

#### **user.message** - User sends text response
```json
{
  "eventType": "user.message",
  "messageType": "text",
  "content": {
    "text": "User response text"
  },
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "userId": "user_12345",
  "messageId": "msg_456"
}
```

#### **user.media** - User sends media content
```json
{
  "eventType": "user.message",
  "messageType": "media",
  "content": {
    "mediaType": "image | video | document",
    "mediaUrl": "https://example.com/media.jpg",
    "text": "Optional caption text"
  },
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "userId": "user_12345",
  "messageId": "msg_457"
}
```

### 2. Action Click Events

#### **action.clicked** - User clicks button/suggested action
```json
{
  "eventType": "action.clicked",
  "actionId": "buy_now",
  "actionLabel": "Buy Now",
  "actionType": "primary | secondary | quick_reply",
  "sourceMessageId": "msg_789",
  "context": {
    "cardTitle": "iPhone 15 Pro",
    "cardDescription": "Latest iPhone model"
  },
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "userId": "user_12345"
}
```

### 3. Message Status Events

#### **message.delivered** - Message delivered to user device
```json
{
  "eventType": "message.delivered",
  "messageId": "msg_789",
  "deliveredAt": "2024-08-26T03:10:11.896Z",
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "userId": "user_12345"
}
```

#### **message.read** - User opens/reads message
```json
{
  "eventType": "message.read",
  "messageId": "msg_789",
  "readAt": "2024-08-26T03:10:11.896Z",
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "userId": "user_12345"
}
```

### 4. Rich Card Interactions

#### **card.clicked** - User taps on rich card
```json
{
  "eventType": "card.clicked",
  "cardId": "card_456",
  "interactionType": "tap",
  "sourceMessageId": "msg_789",
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "userId": "user_12345"
}
```

---

## Priority B - Enhanced Features

### 1. Typing Indicators

#### **user.typing** - User typing status
```json
{
  "eventType": "user.typing",
  "typingStatus": "started | stopped",
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "userId": "user_12345"
}
```

### 2. Video Interaction Events

#### **media.started** - User starts playing video
```json
{
  "eventType": "media.started",
  "mediaType": "video",
  "mediaId": "video_123",
  "mediaUrl": "https://example.com/video.mp4",
  "duration": 120.5,
  "sourceMessageId": "msg_789",
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "userId": "user_12345"
}
```

#### **media.paused** - User pauses video
```json
{
  "eventType": "media.paused",
  "mediaType": "video",
  "mediaId": "video_123",
  "currentPosition": 45.2,
  "duration": 120.5,
  "sourceMessageId": "msg_789",
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "userId": "user_12345"
}
```

#### **media.seeked** - User scrubs/seeks video position
```json
{
  "eventType": "media.seeked",
  "mediaType": "video",
  "mediaId": "video_123",
  "previousPosition": 45.2,
  "newPosition": 78.9,
  "duration": 120.5,
  "sourceMessageId": "msg_789",
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "userId": "user_12345"
}
```

#### **media.fullscreen_entered** - User enters fullscreen mode
```json
{
  "eventType": "media.fullscreen_entered",
  "mediaType": "video",
  "mediaId": "video_123",
  "currentPosition": 34.7,
  "viewportSize": {
    "width": 1920,
    "height": 1080
  },
  "sourceMessageId": "msg_789",
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "userId": "user_12345"
}
```

#### **media.progress** - Periodic playback progress (every 10-30 seconds)
```json
{
  "eventType": "media.progress",
  "mediaType": "video",
  "mediaId": "video_123",
  "currentPosition": 67.3,
  "duration": 120.5,
  "percentComplete": 55.8,
  "playbackRate": 1.0,
  "isFullscreen": false,
  "volume": 0.8,
  "sourceMessageId": "msg_789",
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "userId": "user_12345"
}
```

#### **media.completed** - Video playback finished
```json
{
  "eventType": "media.completed",
  "mediaType": "video",
  "mediaId": "video_123",
  "totalWatchTime": 118.2,
  "duration": 120.5,
  "percentWatched": 95.4,
  "completionRate": 98.1,
  "averagePlaybackRate": 1.1,
  "fullscreenTime": 45.3,
  "sourceMessageId": "msg_789",
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "userId": "user_12345"
}
```

### 3. Advanced Card Interactions

#### **carousel.swiped** - User swipes carousel
```json
{
  "eventType": "carousel.swiped",
  "carouselId": "carousel_789",
  "direction": "left | right",
  "fromIndex": 0,
  "toIndex": 1,
  "sourceMessageId": "msg_789",
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "userId": "user_12345"
}
```

### 4. Location Sharing

#### **location.shared** - User shares location
```json
{
  "eventType": "location.shared",
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "accuracy": 10.0,
    "address": "San Francisco, CA"
  },
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "userId": "user_12345"
}
```

### 5. Conversation Management

#### **conversation.started** - User initiates conversation
```json
{
  "eventType": "conversation.started",
  "initiatedBy": "user",
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "userId": "user_12345"
}
```

#### **conversation.ended** - User ends conversation
```json
{
  "eventType": "conversation.ended",
  "endedBy": "user",
  "duration": 1847.3,
  "messageCount": 23,
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "userId": "user_12345"
}
```

### 6. Error Handling

#### **media.error** - Media playback error
```json
{
  "eventType": "media.error",
  "mediaType": "video",
  "mediaId": "video_123",
  "errorCode": "NETWORK_ERROR | DECODE_ERROR | UNSUPPORTED_FORMAT",
  "errorMessage": "Failed to load video: network timeout",
  "currentPosition": 23.4,
  "sourceMessageId": "msg_789",
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "userId": "user_12345"
}
```

---

## Webhook Delivery Specifications

### Technical Requirements
- **Method**: HTTP POST
- **Content-Type**: `application/json`
- **Authorization**: `Bearer {token}` (if configured)
- **User-Agent**: `RCS-Platform/1.0`
- **Timeout**: 30 seconds maximum
- **Retry Policy**: 3 attempts with exponential backoff

### Security Requirements
- **HTTPS Only**: TLS 1.2+ required
- **Rate Limiting**: Max 1000 events/minute per conversation
- **Payload Limit**: 64KB maximum
- **Webhook Signature**: Optional HMAC verification

### Response Expectations
- **Success**: HTTP 200-299 status codes
- **Failure**: HTTP 400+ triggers retry logic
- **Response Time**: < 5 seconds recommended
- **Idempotent Processing**: Handle duplicate events gracefully

### Event Ordering & Delivery
- **Chronological Order**: Events sent in sequence
- **At-Least-Once Delivery**: Guaranteed delivery with retries
- **Duplicate Protection**: Use `messageId`/`eventId` for deduplication
- **Progress Tracking**: Periodic events (10-30 second intervals)

---

## Implementation Roadmap

### Phase 1 - Priority A (MVP)
1. **User Messages** - Text and media responses
2. **Action Clicks** - Button and quick reply interactions
3. **Message Status** - Delivery and read receipts
4. **Basic Card Clicks** - Rich card tap interactions

### Phase 2 - Priority B (Enhanced)
1. **Typing Indicators** - Real-time typing status
2. **Video Interactions** - Play, pause, seek, fullscreen
3. **Advanced Cards** - Carousel swipes, complex interactions
4. **Location Sharing** - GPS coordinate sharing
5. **Conversation Management** - Start/end tracking
6. **Error Handling** - Media and system errors

### Phase 3 - Analytics & Optimization
1. **Engagement Metrics** - Video completion rates, interaction patterns
2. **Performance Monitoring** - Error rates, response times
3. **Advanced Analytics** - User journey tracking, conversion funnels

---

## Common Event Fields

All events include these base fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `eventType` | string | ✅ | Type of user interaction |
| `timestamp` | string (ISO 8601) | ✅ | When the event occurred |
| `conversationId` | string | ✅ | Unique conversation identifier |
| `userId` | string | ✅ | Unique user identifier |
| `messageId` | string | ⚪ | Related message ID (when applicable) |
| `sourceMessageId` | string | ⚪ | Original business message that triggered interaction |

---

*This document serves as the technical specification for implementing RCS user interaction capture in compliance with GSMA RCS standards.*
