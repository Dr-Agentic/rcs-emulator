# RCS Emulator SaaS Platform

A professional RCS (Rich Communication Services) business messaging development platform that emulates iPhone 16 Pro Max messaging experience with full API integration.

## 🚀 Features

### Core RCS Functionality (80%+ Coverage)
- ✅ **Text Messages** - Standard RCS text messaging
- ✅ **Rich Cards** - Interactive cards with images, titles, descriptions, and action buttons
- ✅ **Media Messages** - Support for images, videos, and documents
- ✅ **Read Receipts** - Message delivery and read status indicators
- ✅ **Typing Indicators** - Real-time typing status with animated dots
- ✅ **Suggested Actions** - Quick reply buttons and suggested responses
- ✅ **Interactive Elements** - Clickable buttons and actions

### iPhone 16 Pro Max Emulation
- ✅ **Pixel-Perfect Design** - Authentic iOS messaging interface
- ✅ **Device Frame** - Realistic iPhone 16 Pro Max appearance
- ✅ **Status Bar** - iOS-style status indicators
- ✅ **Message Bubbles** - iOS-style message styling and animations
- ✅ **Responsive Design** - Optimized for various screen sizes

### SaaS Platform Features
- ✅ **User Authentication** - Secure login system with session management
- ✅ **API Integration** - RESTful API for programmatic message sending
- ✅ **RBM Callback Server** - GSMA UP compliant event processing endpoint
- ✅ **Event Analytics** - RCS interaction tracking and conversation management
- ✅ **Developer Tools** - JSON validation and message templates
- ✅ **Usage Analytics** - API usage tracking and limits
- ✅ **Comprehensive Documentation** - Complete API reference with examples

## 🛠 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- Modern web browser

### Quick Start
1. **Clone/Download** the project files
2. **Start the server**:
   ```bash
   node server.js
   ```
3. **Access the platform**:
   - Open: http://localhost:3000
   - Demo credentials: `user` / `user`

## 📱 Usage

### Web Interface
1. **Login** with demo credentials (user/user)
2. **Emulator Tab** - Test RCS messages in iPhone 16 Pro Max interface
3. **API Docs Tab** - View comprehensive API documentation
4. **Settings Tab** - Monitor usage and manage account

### API Integration
```javascript
// Send Text Message
const response = await fetch('/api/rcs/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'text',
    text: 'Hello from RCS API!',
    sender: 'business'
  })
});

// Send Rich Card
const response = await fetch('/api/rcs/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'richCard',
    title: 'Product Showcase',
    description: 'Check out our latest products',
    image: 'https://example.com/image.jpg',
    actions: [
      {
        label: 'Buy Now',
        action: 'buy_now',
        type: 'primary'
      }
    ],
    sender: 'business'
  })
});
```

## 🔧 API Endpoints

### Authentication
All API requests require Bearer token authentication:
```
Authorization: Bearer YOUR_API_KEY
```

### Send Message
- **POST** `/api/rcs/send`
- **Headers**: `Authorization`, `Content-Type: application/json`
- **Body**: RCS message object

### Get Messages
- **GET** `/api/rcs/messages`
- **Headers**: `Authorization`
- **Response**: Array of sent messages with metadata

### Validate Auth
- **POST** `/api/auth/validate`
- **Headers**: `Authorization`
- **Response**: Authentication status

### RBM Callback (Business Messaging)
- **POST** `/api/rbm/callback`
- **Headers**: `Content-Type: application/json`
- **Body**: GSMA UP compliant RCS event
- **Response**: Event processing confirmation

### RBM Status
- **GET** `/api/rbm/status`
- **Response**: RBM server health and statistics

## 🎯 Use Cases

### Development & Testing
- **Rapid Prototyping** - Quickly test RCS message designs
- **Client Demos** - Showcase RCS capabilities to stakeholders
- **Integration Testing** - Validate API integrations before production
- **Message Validation** - Test JSON message formats

### Business Applications
- **Marketing Campaigns** - Design and test promotional messages
- **Customer Support** - Prototype support message flows
- **E-commerce** - Test product showcase and purchase flows
- **Notifications** - Design system notification messages

## 📊 Technical Specifications

### Server
- **Runtime**: Node.js HTTP server
- **Port**: 3000 (configurable)
- **CORS**: Enabled for cross-origin requests
- **Authentication**: Bearer token validation
- **Storage**: In-memory message queue

### Client
- **Framework**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3 with animations
- **Responsive**: Mobile-first design
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

## 🔒 Security Features

- ✅ **API Authentication** - Bearer token validation
- ✅ **Input Validation** - JSON schema validation
- ✅ **CORS Protection** - Configurable cross-origin policies
- ✅ **Session Management** - Secure client-side sessions
- ✅ **Error Handling** - Comprehensive error responses

## 📈 Performance

- **Fast Loading** - Optimized assets and minimal dependencies
- **Real-time Updates** - Instant message rendering and status updates
- **Scalable Architecture** - Modular design for easy extension
- **Memory Efficient** - Lightweight implementation

## 🚀 Deployment

### Local Development
```bash
node server.js
```

### Production Deployment
1. **Environment Variables**: Configure port and API keys
2. **Process Manager**: Use PM2 or similar for production
3. **Reverse Proxy**: Configure nginx/Apache if needed
4. **SSL Certificate**: Enable HTTPS for production use

## 📝 License

This project is designed for RCS business messaging development and testing purposes.

## 🤝 Support

For technical support or feature requests, please refer to the API documentation included in the platform.

---

**Built for shortcutting RCS business messaging development cycles** 🚀
