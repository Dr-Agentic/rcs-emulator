# RCS User Interaction Events - GSMA Universal Profile (UP) Implementation Guide

## Overview

This document specifies **RCS user interaction events** strictly aligned with the **GSMA RCS Universal Profile (UP)**. It defines webhook-style callbacks from the RCS client to the business server, ensuring interoperability across operator networks.

Where necessary, **vendor or analytic extensions** are noted explicitly as *non-standard*.

---

## Implementation Priorities

### 🚨 **Priority A - Mandatory Day 1 Events (GSMA UP Core)**
*Baseline events required for any RCS B2C deployment (messaging, actions, receipts)*

### 🔧 **Priority B - Enhanced Features (Vendor Extensions)**
*Optional analytics and engagement features not covered by GSMA UP, useful for advanced tracking and optimization*

**Comment:** Yes, the A/B prioritization is correct. Priority A covers what’s strictly required by GSMA UP. Priority B represents extensions that businesses find valuable, but are *not* defined in UP.

---

## Priority A - Mandatory Day 1 Events (GSMA UP Core)

### 1. User Messages

#### **userMessage (text)**
```json
{
  "eventType": "userMessage",
  "messageType": "text",
  "content": {
    "text": "User response text"
  },
  "eventId": "evt_12345",
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "participantId": "+1234567890",
  "messageId": "msg_456"
}
```
**Notes:**
- `eventId` required for deduplication (missing in original).
- `participantId` should follow GSMA format (usually MSISDN or globally unique ID).

#### **userMessage (media)**
```json
{
  "eventType": "userMessage",
  "messageType": "media",
  "content": {
    "mediaType": "image | video | file",
    "mediaUrl": "https://example.com/media.jpg",
    "caption": "Optional caption"
  },
  "eventId": "evt_12346",
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "participantId": "+1234567890",
  "messageId": "msg_457"
}
```

### 2. Suggested Actions / Quick Replies

#### **suggestionResponse (click)**
```json
{
  "eventType": "suggestionResponse",
  "responseType": "reply | action",
  "postbackData": "buy_now",
  "displayText": "Buy Now",
  "sourceMessageId": "msg_789",
  "eventId": "evt_12347",
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "participantId": "+1234567890"
}
```
**Notes:**
- GSMA UP defines **SuggestedReply** and **SuggestedAction**. Original spec used a generic `action.clicked`.

### 3. Message Receipts

#### **deliveryReceipt**
```json
{
  "eventType": "deliveryReceipt",
  "messageId": "msg_789",
  "eventId": "evt_12348",
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "participantId": "+1234567890"
}
```

#### **readReceipt**
```json
{
  "eventType": "readReceipt",
  "messageId": "msg_789",
  "eventId": "evt_12349",
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "participantId": "+1234567890"
}
```
**Notes:**
- Original used `message.delivered` and `message.read`. Renamed per GSMA UP terminology.
- Only one timestamp per event is required.

### 4. Chat State (Typing)

#### **chatState**
```json
{
  "eventType": "chatState",
  "state": "composing | idle",
  "eventId": "evt_12350",
  "timestamp": "2024-08-26T03:10:11.896Z",
  "conversationId": "conv_abc123",
  "participantId": "+1234567890"
}
```
**Notes:**
- Original `user.typing` renamed to GSMA’s `chatState` event.

---

## Priority B - Enhanced Features (Vendor / Analytic Extensions)

> The following events are **not part of GSMA UP** but may be valuable for business analytics. Implement as optional vendor-specific extensions.

- **card.clicked** (user taps a rich card)  
- **carousel.swiped** (user swipes a carousel)  
- **media.started / media.paused / media.progress / media.completed / media.error** (video engagement analytics)  
- **location.shared** (possible, but GSMA defines a simpler geolocation sharing payload)  
- **conversation.started / conversation.ended** (session tracking, not standardized in UP)

**Comment:** These events should be explicitly tagged as *extensions* to avoid confusion with GSMA UP compliance.

---

## Webhook Delivery Specifications (Aligned with GSMA)

- **Method**: HTTP POST, `Content-Type: application/json`  
- **Transport**: HTTPS (TLS 1.2+)  
- **Authentication**: OAuth 2.0 bearer tokens recommended (HMAC optional but encouraged).  
- **Retry Policy**: At-least-once delivery with exponential backoff  
- **Idempotency**: Must handle duplicates (`eventId` ensures uniqueness).  

---

## Common Event Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `eventType` | string | ✅ | Type of user interaction (per GSMA UP naming) |
| `eventId` | string | ✅ | Unique event identifier (required for deduplication) |
| `timestamp` | string (ISO 8601) | ✅ | When the event occurred |
| `conversationId` | string | ✅ | Unique conversation identifier |
| `participantId` | string | ✅ | Unique user identifier (MSISDN or GSMA-defined ID) |
| `messageId` | string | ⚪ | Related message ID (when applicable) |
| `sourceMessageId` | string | ⚪ | Original business message triggering interaction |

---

## Conclusion

- **Priority A** (user messages, suggestions, receipts, chat state) = GSMA UP core → required for all B2C deployments.  
- **Priority B** (rich media engagement, carousel swipes, conversation lifecycle) = extensions → valuable for analytics but non-standard.  

This separation ensures strict GSMA compliance while still enabling advanced business insights through optional vendor-specific events.
