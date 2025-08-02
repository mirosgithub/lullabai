# 🌙 Bedtime Story Generator

A full-stack web application that generates personalised bedtime stories using AI. Built with Flask, Firebase, and Google's Gemini API.

## Features

### 📚 Classic Stories
- Browse pre-written bedtime stories
- Read stories with beautiful typography
- Web Speech API for text-to-speech
- Google Cloud TTS for high-quality audio generation

### ✨ Personalised Stories
- Generate unique stories using selected keywords
- AI-powered story generation with Gemini API
- Custom keyword input
- Automatic story saving to Firebase

### 🎵 Audio Features
- Web Speech API for instant reading
- Google Cloud Text-to-Speech for professional audio
- Pause/resume functionality
- Downloadable audio files

## Tech Stack

- **Backend**: Python 3.12, Flask 3.0.0
- **Database**: Firebase Firestore
- **AI**: Google Gemini API
- **TTS**: Google Cloud Text-to-Speech
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Modern CSS with gradients and animations

## Setup Instructions

### Prerequisites

1. Python 3.12 or higher
2. Firebase project with Firestore enabled
3. Google Cloud project with Text-to-Speech API enabled
4. Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bedtime-story-generator
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   SECRET_KEY=your_flask_secret_key_here
   ```

4. **Configure Firebase**
   - Ensure your `privatekey.json` file is in the root directory
   - The file should contain your Firebase service account credentials

5. **Set up Google Cloud TTS**
   - Enable the Text-to-Speech API in your Google Cloud Console
   - Set up authentication (service account key or application default credentials)

### Running the Application

1. **Start the Flask server**
   ```bash
   python app.py
   ```

2. **Access the application**
   Open your browser and navigate to `http://localhost:5000`

## API Endpoints

### Stories
- `GET /api/stories` - Fetch all stories from Firebase
- `GET /api/story/<story_id>` - Get specific story by ID
- `POST /api/generate-story` - Generate new story with keywords

### Text-to-Speech
- `POST /api/tts` - Generate audio from text using Google Cloud TTS

## Project Structure

```
bedtime-story-generator/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── privatekey.json       # Firebase credentials (gitignored)
├── .gitignore           # Git ignore rules
├── README.md            # This file
├── templates/           # HTML templates
│   ├── index.html       # Main page
│   ├── classic.html     # Classic stories page
│   └── personalised.html # Personalised stories page
└── static/              # Static assets
    ├── css/
    │   └── style.css    # Main stylesheet
    ├── js/
    │   ├── classic.js   # Classic stories functionality
    │   └── personalised.js # Personalised stories functionality
    └── audio/           # Generated audio files
```

## Features in Detail

### Story Generation
- Uses Google's Gemini API for intelligent story creation
- Incorporates selected keywords naturally into the narrative
- Generates age-appropriate content (3-8 years)
- Saves generated stories to Firebase for future access

### Audio Features
- **Web Speech API**: Instant browser-based text-to-speech
- **Google Cloud TTS**: High-quality, natural-sounding audio
- **Voice Selection**: Automatic female voice selection for bedtime stories
- **Playback Controls**: Pause, resume, and stop functionality

### User Interface
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Beautiful gradients and smooth animations
- **Accessibility**: Keyboard navigation and screen reader support
- **Child-Friendly**: Bright colours and engaging emojis

### Database Integration
- **Firebase Firestore**: Real-time database for stories
- **Automatic Saving**: Generated stories are saved with metadata
- **Keyword Tracking**: Stories are tagged with their keywords
- **Timestamp Tracking**: All stories include creation timestamps

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `SECRET_KEY` | Flask secret key | No (defaults to placeholder) |

## Troubleshooting

### Common Issues

1. **Firebase Connection Error**
   - Ensure `privatekey.json` is in the root directory
   - Verify Firebase project settings
   - Check Firestore rules

2. **Gemini API Errors**
   - Verify API key is correct
   - Check API quota and billing
   - Ensure API is enabled in Google Cloud Console

3. **TTS Generation Fails**
   - Verify Google Cloud TTS API is enabled
   - Check authentication credentials
   - Ensure sufficient quota

4. **Speech Synthesis Not Working**
   - Check browser compatibility
   - Ensure HTTPS in production
   - Verify microphone permissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue on GitHub or contact the development team.

---

Made with ❤️ for sweet dreams and magical bedtime moments. 