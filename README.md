# 🌙 Lullab.ai - Bedtime Story Generator

A full-stack web application that generates personalised bedtime stories using AI. Built with Flask, Firebase and Google's Gemini and Google Cloud TTS API.

This project, focused on the theme of Nostalgia, won First Place at the [WDCC x SESA Hackathon 2025](https://wdccxsesahackathon.com/), New Zealand's largest tertiary hackathon. The event brought together over 100 participants from 17 teams for 48 hours of intensive development, innovation and collaboration.

## Live Demo

Try Lullab.ai online: [https://lullab-ai-713855574593.asia-southeast1.run.app](https://lullab-ai-713855574593.asia-southeast1.run.app)

## Team Wackathon

**First Place Winners at WDCC x SESA Hackathon 2025**

- **Jedh** ([@jedhr](https://github.com/jedhr)) - Team Leader
- **Avin Chen** ([@AChen2006](https://github.com/AChen2006)) - Team Member
- **Ava Lee** ([@avalee0215](https://github.com/avalee0215)) - Frontend Developer
- **Katarina** ([@katarina370](https://github.com/katarina370)) - Team Member
- **Parmida** ([@parmidajafarian](https://github.com/parmidajafarian)) - Team Member
- **Suah Kim** ([@mirosgithub](https://github.com/mirosgithub)) - Backend Developer

## Features

### 📚 Classic Stories
- Browse classic bedtime stories
- Read stories with soothing voice

### ✨ Personalised Stories
- Generate unique stories using your name & keywords
- AI-powered story generation with Gemini API
- Custom keyword input

### 🎵 Audio Features
- Google Cloud Text-to-Speech for high-quality audio generation
- Pause/resume functionality

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
   cd lullabai
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
   FIREBASE_KEY_PATH=firebase-key.json
   TTS_KEY_PATH=tts-key.json
   ```

4. **Configure Firebase**
   - Place your Firebase service account key file as `firebase-key.json` in the root directory
   - The file should contain your Firebase service account credentials

5. **Set up Google Cloud TTS**
   - Place your Google Cloud service account key file as `tts-key.json` in the root directory
   - Enable the Text-to-Speech API in your Google Cloud Console

### Running the Application

1. **Start the Flask server**
   ```bash
   python app.py
   ```

2. **Access the application**
   Open your browser and navigate to `http://localhost:5002`

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker compose up --build
   ```

2. **Access the application**
   Open your browser and navigate to `http://localhost:8080`

## API Endpoints

### Stories
- `GET /api/stories` - Fetch all stories from Firebase
- `GET /api/story/<story_id>` - Get specific story by ID
- `POST /api/generate-story` - Generate new story with keywords

### Text-to-Speech
- `POST /api/tts` - Generate audio from text using Google Cloud TTS

## Project Structure

```
lullabai/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── firebase-key.json     # Firebase credentials (gitignored)
├── tts-key.json         # Google Cloud TTS credentials (gitignored)
├── .env                 # Environment variables (gitignored)
├── .gitignore           # Git ignore rules
├── README.md            # README file
├── templates/           # HTML templates
│   ├── index.html       # Main page
│   ├── classic.html     # Classic stories page
│   ├── personalised.html # Personalised stories page
│   └── adult.html       # Grown-ups stories page
└── static/              # Static assets
    ├── css/
    │   ├── style.css    # Main stylesheet
    │   └── stars.css    # Stars animation styles
    ├── js/
    │   ├── index.js     # Main JavaScript
    │   ├── classic.js   # Classic stories functionality
    │   ├── personalised.js # Personalised stories functionality
    │   ├── adult.js     # Grown-ups stories functionality
    │   └── stars.js     # Stars animation
    ├── images/          # Image assets
    ├── audio/           # Classic story audio files
    └── videos/          # Video assets
```

## Features in Detail

### Story Generation
- Uses Google's Gemini API for intelligent story creation
- Incorporates selected keywords naturally into the narrative
- Generates age-appropriate content (3-8 years)

### Audio Features
- **Google Cloud TTS**: High-quality, natural-sounding audio
- **Voice Selection**: Carefully chosen voice with natural intonation and emotional nuances
- **Playback Controls**: Pause, resume and stop functionality

### User Interface
- **Responsive Design**: Works on desktop, tablet and mobile
- **Modern UI**: Beautiful gradients and smooth animations
- **Child-Friendly**: Comforting colours and engaging emojis

### Database Integration
- **Firebase Firestore**: Real-time database for stories
- **Keyword Tracking**: Stories are tagged with their keywords

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key |
| `SECRET_KEY` | Flask secret key |
| `FIREBASE_KEY_PATH` | Path to Firebase service account key file |
| `TTS_KEY_PATH` | Path to Google Cloud TTS service account key file |

## Troubleshooting

### Common Issues

1. **Firebase Connection Error**
   - Ensure `firebase-key.json` is in the root directory
   - Verify Firebase project settings
   - Check Firestore rules

2. **Gemini API Errors**
   - Verify API key is correct
   - Check API quota and billing
   - Ensure API is enabled in Google Cloud Console

3. **TTS Generation Fails**
   - Ensure `tts-key.json` is in the root directory
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

## Support

For support, please open an issue on GitHub or contact the development team.
