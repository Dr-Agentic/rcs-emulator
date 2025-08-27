# RCS User Interaction Events - GSMA UP Compliant

This document outlines the RCS user interaction events captured by the emulator, fully compliant with GSMA Universal Profile specifications.

## Event Structure (GSMA UP Compliant)

All events follow the GSMA Universal Profile standard structure:

```json
{
  "eventType": "userMessage|chatState|suggestionResponse|deliveryReceipt|readReceipt",
  "eventId": "evt_1756249268009_1",
  "timestamp": "2025-08-26T23:01:08.009Z",
  "conversationId": "conv_emulator_1756180623664",
  "participantId": "+15551234567",
  // ... event-specific fields
}
```

### Key GSMA UP Compliance Features:
- ✅ **eventType**: Uses GSMA standard names (`userMessage`, `chatState`, `suggestionResponse`)
- ✅ **eventId**: Unique identifier for deduplication and idempotency
- ✅ **participantId**: MSISDN format (+15551234567) as required by GSMA UP
- ✅ **content**: Proper GSMA content structure without unnecessary fields
- ✅ **Separate receipt types**: `deliveryReceipt` and `readReceipt` as distinct events

## Supported Events

### 1. Chat State (Typing Indicators)

**Event Type**: `chatState`

Captures when user starts/stops typing.

**GSMA UP Compliant Example**:
```json
{
  "eventType": "chatState",
  "eventId": "evt_98765",
  "timestamp": "2025-08-26T03:59:02.334Z",
  "conversationId": "conv_emulator_1756180623664",
  "participantId": "+15551234567",
  "state": "composing"
}
```

**States**:
- `composing`: User is actively typing
- `idle`: User stopped typing or is inactive

### 2. User Message

**Event Type**: `userMessage`

Captures text and media messages sent by the user.

**Text Message Example**:
```json
{
  "eventType": "userMessage",
  "eventId": "evt_1756182328400_1",
  "timestamp": "2025-08-26T04:25:28.400Z",
  "conversationId": "conv_emulator_1756182319862",
  "participantId": "+15551234567",
  "messageId": "msg_1756182328400_1",
  "content": {
    "text": "Hello, I'm interested in your products"
  }
}
```

**Media Message Example**:
```json
{
  "eventType": "userMessage",
  "eventId": "evt_1756182328401_2",
  "timestamp": "2025-08-26T04:25:28.401Z",
  "conversationId": "conv_emulator_1756182319862",
  "participantId": "+15551234567",
  "messageId": "msg_1756182328401_2",
  "content": {
    "media": {
      "mediaType": "image",
      "mediaUrl": "https://example.com/image.jpg"
    },
    "text": "Check out this image"
  }
}
```

### 3. Button Interactions

#### 3.1 Suggested Reply (Quick Reply)

When user taps a suggested reply button, it generates a **userMessage** event.

**Business Message Format**:
```json
{
  "messageId": "msg_2001",
  "conversationId": "conv_abc123",
  "content": {
    "text": "Do you want to continue?",
    "suggestions": [
      { "reply": { "text": "Yes", "postbackData": "yes_continue" } },
      { "reply": { "text": "No", "postbackData": "no_stop" } }
    ]
  }
}
```

**User Callback (when tapping "Yes")**:
```json
{
  "eventType": "userMessage",
  "eventId": "evt_1001",
  "timestamp": "2025-08-26T04:25:28.400Z",
  "conversationId": "conv_abc123",
  "participantId": "+15551234567",
  "messageId": "msg_1756182328402_1",
  "content": { "text": "Yes" },
  "_replyContext": {
    "sourceMessageId": "msg_2001",
    "postbackData": "yes_continue",
    "type": "suggested_reply"
  }
}
```

#### 3.2 Suggested Action (e.g., Open URL, Dial)

When user taps a suggested action button, it generates a **suggestionResponse** event.

**Business Message Format**:
```json
{
  "messageId": "msg_2002",
  "conversationId": "conv_abc123",
  "content": {
    "text": "Tap below to buy now:",
    "suggestions": [
      {
        "action": {
          "text": "Buy Now",
          "postbackData": "buy_now",
          "openUrlAction": { "url": "https://example.com/checkout" }
        }
      }
    ]
  }
}
```

**User Callback (when tapping "Buy Now")**:
```json
{
  "eventType": "suggestionResponse",
  "eventId": "evt_1002",
  "timestamp": "2025-08-26T04:25:29.400Z",
  "conversationId": "conv_abc123",
  "participantId": "+15551234567",
  "sourceMessageId": "msg_2002",
  "responseType": "action",
  "postbackData": "buy_now",
  "displayText": "Buy Now",
  "actionUrl": "https://example.com/checkout"
}
```

#### 3.3 Rich Card with Buttons

When user taps buttons on rich cards, it generates a **suggestionResponse** event.

**Business Message Format**:
```json
{
  "messageId": "msg_2003",
  "conversationId": "conv_abc123",
  "content": {
    "richCard": {
      "standaloneCard": {
        "cardContent": {
          "title": "iPhone 15 Pro",
          "description": "The latest iPhone model",
          "media": {
            "height": "SHORT",
            "contentInfo": {
              "fileUrl": "https://example.com/iphone15.jpg",
              "mimeType": "image/jpeg"
            }
          },
          "suggestions": [
            {
              "action": {
                "text": "View Details",
                "postbackData": "view_details",
                "openUrlAction": { "url": "https://example.com/iphone15" }
              }
            }
          ]
        }
      }
    }
  }
}
```

**User Callback (when tapping "View Details")**:
```json
{
  "eventType": "suggestionResponse",
  "eventId": "evt_1003",
  "timestamp": "2025-08-26T04:25:30.400Z",
  "conversationId": "conv_abc123",
  "participantId": "+15551234567",
  "sourceMessageId": "msg_2003",
  "responseType": "action",
  "postbackData": "view_details",
  "displayText": "View Details",
  "actionUrl": "https://example.com/iphone15"
}
```

### 4. Delivery Receipt

**Event Type**: `deliveryReceipt`

Captures when a message is delivered to the user's device.

**Example**:
```json
{
  "eventType": "deliveryReceipt",
  "eventId": "evt_1756182328404_5",
  "timestamp": "2025-08-26T04:25:28.404Z",
  "conversationId": "conv_emulator_1756182319862",
  "participantId": "+15551234567",
  "messageId": "msg_1756182328400_1",
  "deliveredTimestamp": "2025-08-26T04:25:28.404Z"
}
```

### 5. Read Receipt

**Event Type**: `readReceipt`

Captures when a message is read by the user.

**Example**:
```json
{
  "eventType": "readReceipt",
  "eventId": "evt_1756182328405_6",
  "timestamp": "2025-08-26T04:25:28.405Z",
  "conversationId": "conv_emulator_1756182319862",
  "participantId": "+15551234567",
  "messageId": "msg_1756182328400_1",
  "readTimestamp": "2025-08-26T04:25:28.405Z"
}
```

## Button Interaction Summary

| Button Type | Event Type | Key Fields |
|-------------|------------|------------|
| **Suggested Reply** | `userMessage` | `content.text`, `_replyContext.postbackData` |
| **Suggested Action** | `suggestionResponse` | `postbackData`, `displayText`, `actionUrl` |
| **Rich Card Button** | `suggestionResponse` | `postbackData`, `displayText`, `actionUrl` |

## Vendor Extensions (Non-Standard)

### Rich Card Interaction

**Event Type**: `richCardInteraction` ⚠️ **VENDOR EXTENSION**

This event type is not officially defined in GSMA UP but may be supported by some vendor platforms.

**Example**:
```json
{
  "eventType": "richCardInteraction",
  "eventId": "evt_1756182328403_4",
  "timestamp": "2025-08-26T04:25:28.403Z",
  "conversationId": "conv_emulator_1756182319862",
  "participantId": "+15551234567",
  "messageId": "msg_1756182328403_4",
  "cardId": "card_product_showcase",
  "interactionType": "tap",
  "sourceMessageId": "msg_business_124",
  "cardContext": {
    "productId": "prod_123",
    "category": "electronics"
  },
  "_vendorExtension": true
}
```

## Implementation Details

### Event Capture Flow
1. User interacts with iPhone emulator interface
2. Event handlers capture the interaction
3. Event data is formatted according to GSMA UP specifications
4. Event is displayed in JSON viewer
5. Event is sent to configured webhook endpoint

### Webhook Integration
Events are automatically sent to the configured webhook URL with:
- **Method**: POST
- **Content-Type**: application/json
- **Authorization**: Bearer token (if configured)
- **User-Agent**: RCS-Emulator/1.0

### GSMA UP Compliance Checklist
- ✅ Standard event type names (`userMessage`, `chatState`, `suggestionResponse`)
- ✅ Unique eventId for each event
- ✅ participantId in MSISDN format (+15551234567)
- ✅ Proper content structure without vendor-specific fields
- ✅ ISO 8601 timestamps
- ✅ Conversation-scoped message IDs
- ✅ Standard chat states (composing/idle)
- ✅ Separate delivery and read receipt events
- ✅ Correct button interaction handling (reply vs action)

### Participant Identity Format
The `participantId` field uses MSISDN format (`+15551234567`) as required by GSMA UP. In production environments, this should be:
- **MSISDN**: International phone number format (e.g., `+15551234567`)
- **SIP URI**: SIP address format (e.g., `sip:user@domain.com`)

## Business Integration

These GSMA UP compliant events can be directly integrated with:
- GSMA-certified RCS Business Messaging platforms
- GSMA Universal Profile aggregators
- Enterprise messaging systems with GSMA UP support
- Customer engagement platforms supporting RCS standards

The standardized format ensures compatibility across different GSMA-certified RCS implementations and vendors.
