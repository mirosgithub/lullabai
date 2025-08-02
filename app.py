from flask import Flask, render_template, request, jsonify
import firebase_admin
from firebase_admin import credentials, firestore
import google.generativeai as genai
from google.cloud import texttospeech
import os
from datetime import datetime
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')

# Initialize Firebase
firebase_key_path = os.environ.get('FIREBASE_KEY_PATH', 'firebase-key.json')
if not os.path.exists(firebase_key_path):
    print(f"Warning: Firebase key file {firebase_key_path} not found. Please ensure it exists.")
    firebase_key_path = 'firebase-key.json'  # fallback

cred = credentials.Certificate(firebase_key_path)
firebase_admin.initialize_app(cred)
db = firestore.client()

# Configure Gemini API
gemini_api_key = os.environ.get('GEMINI_API_KEY')
if not gemini_api_key or gemini_api_key == 'your_gemini_api_key_here':
    print("Warning: GEMINI_API_KEY not set. Story generation will not work.")
genai.configure(api_key=gemini_api_key or 'dummy-key')

# Configure Google Cloud TTS
tts_key_path = os.environ.get('TTS_KEY_PATH', 'tts-key.json')
if tts_key_path and os.path.exists(tts_key_path):
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = tts_key_path
else:
    print(f"Warning: TTS key file {tts_key_path} not found. Text-to-speech will not work.")

tts_client = texttospeech.TextToSpeechClient()

@app.route('/')
def index():
    """Main page - choose bedtime story option"""
    return render_template('index.html')

@app.route('/classic')
def classic():
    """Classic stories page"""
    return render_template('classic.html')

@app.route('/personalised')
def personalised():
    """Personalised story generation page"""
    return render_template('personalised.html')

@app.route('/adult')
def adult():
    """Adult bedtime stories page"""
    return render_template('adult.html')

@app.route('/api/stories')
def get_stories():
    """Fetch classic stories from Firebase (exclude generated stories)"""
    try:
        stories_ref = db.collection('stories')
        stories = []
        for doc in stories_ref.stream():
            story_data = doc.to_dict()
            # Only include classic stories, exclude generated ones
            if story_data.get('type') != 'generated':
                story_data['id'] = doc.id
                stories.append(story_data)
        return jsonify(stories)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-story', methods=['POST'])
def generate_story():
    """Generate story using Gemini API"""
    try:
        data = request.get_json()
        keywords = data.get('keywords', [])
        child_name = data.get('childName', '')
        
        if not keywords:
            return jsonify({'error': 'No keywords provided'}), 400
            
        if not child_name:
            return jsonify({'error': 'Child name is required'}), 400
        
        # Check if Gemini API key is configured
        gemini_api_key = os.environ.get('GEMINI_API_KEY')
        if not gemini_api_key or gemini_api_key == 'your_gemini_api_key_here':
            return jsonify({'error': 'Gemini API key not configured. Please set GEMINI_API_KEY in your .env file.'}), 500
        
        # Create prompt for Gemini
        prompt = f"""Write a gentle, soothing bedtime story for children aged 3-8 years old. 
        The main character should be a child named {child_name}.
        The story should include these keywords: {', '.join(keywords)}.
        
        Requirements:
        - Keep it under 500 words
        - Use simple, comforting language
        - Include a positive message or lesson
        - Make it suitable for bedtime reading
        - Avoid scary or violent content
        - Make {child_name} the hero of the story
        - Use {child_name}'s name naturally throughout the story
        
        Please write the story in a warm, narrative style."""
        
        # Generate story using Gemini
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        if not response.text:
            return jsonify({'error': 'No story generated. Please try again.'}), 500
            
        story_text = response.text
        
        # Create story object (temporary, not saved to Firebase)
        story_data = {
            'title': f"{child_name}'s Story with {', '.join(keywords)}",
            'content': story_text,
            'keywords': keywords,
            'child_name': child_name,
            'timestamp': datetime.now().isoformat(),
            'type': 'generated',
            'temporary': True  # Mark as temporary
        }
        
        # Don't save to Firebase - return the story directly
        return jsonify(story_data)
        
    except Exception as e:
        print(f"Error generating story: {str(e)}")
        return jsonify({'error': f'Story generation failed: {str(e)}'}), 500

@app.route('/api/story/<story_id>')
def get_story(story_id):
    """Get specific story by ID"""
    try:
        story_doc = db.collection('stories').document(story_id).get()
        if story_doc.exists:
            story_data = story_doc.to_dict()
            story_data['id'] = story_id
            return jsonify(story_data)
        else:
            return jsonify({'error': 'Story not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/test-gemini')
def test_gemini():
    """Test Gemini API connection"""
    try:
        gemini_api_key = os.environ.get('GEMINI_API_KEY')
        if not gemini_api_key or gemini_api_key == 'your_gemini_api_key_here':
            return jsonify({'error': 'Gemini API key not configured'}), 500
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Say 'Hello, Gemini is working!'")
        
        if response.text:
            return jsonify({'success': True, 'message': response.text})
        else:
            return jsonify({'error': 'No response from Gemini'}), 500
            
    except Exception as e:
        print(f"Gemini test error: {str(e)}")
        return jsonify({'error': f'Gemini test failed: {str(e)}'}), 500

@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    """Convert text to speech using Google Cloud TTS"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Configure TTS request
        synthesis_input = texttospeech.SynthesisInput(text=text)
        
        # Configure voice
        voice = texttospeech.VoiceSelectionParams(
            language_code="en-US",
            name="en-US-Chirp3-HD-Laomedeia"
        )
        
        # Configure audio
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )
        
        # Perform TTS
        response = tts_client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )
        
        # Save audio file temporarily (in production, you'd upload to cloud storage)
        audio_filename = f"static/audio/story_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp3"
        os.makedirs('static/audio', exist_ok=True)
        
        with open(audio_filename, "wb") as out:
            out.write(response.audio_content)
        
        return jsonify({'audio_url': f'/{audio_filename}'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-adult-story', methods=['POST'])
def generate_adult_story():
    """Generate therapeutic adult bedtime story using Gemini API"""
    try:
        data = request.get_json()
        sleep_issue = data.get('sleepIssue', '')
        custom_sleep_reason = data.get('customSleepReason', '')
        memories = data.get('memories', [])
        custom_memory = data.get('customMemory', '')
        adult_name = data.get('adultName', '')
        
        if not sleep_issue and not custom_sleep_reason:
            return jsonify({'error': 'No sleep issue provided'}), 400
            
        if not adult_name:
            return jsonify({'error': 'Adult name is required'}), 400
        
        # Check if Gemini API key is configured
        gemini_api_key = os.environ.get('GEMINI_API_KEY')
        if not gemini_api_key or gemini_api_key == 'your_gemini_api_key_here':
            return jsonify({'error': 'Gemini API key not configured. Please set GEMINI_API_KEY in your .env file.'}), 500
        
        # Determine the sleep issue to use
        final_sleep_issue = custom_sleep_reason if custom_sleep_reason else sleep_issue
        sleep_issue_display = custom_sleep_reason if custom_sleep_reason else sleep_issue.replace('_', ' ').title()
        
        # Create therapeutic prompt for Gemini
        memory_text = ""
        if memories:
            memory_text += f" including these nostalgic elements: {', '.join(memories)}"
        if custom_memory:
            memory_text += f" and incorporate this personal memory: '{custom_memory}'"
        
        prompt = f"""Write a gentle, therapeutic bedtime story for an adult named {adult_name} who is struggling with: {final_sleep_issue}.
        
        Requirements:
        - Keep it under 600 words
        - Use soothing, calming language
        - Include therapeutic elements that specifically address: {final_sleep_issue}
        - Incorporate childhood nostalgia and comfort{memory_text}
        - Make {adult_name} the central character
        - Include gentle breathing or relaxation cues
        - End with a sense of peace and safety
        - Use warm, comforting imagery
        - Avoid triggering content
        - Make it suitable for falling asleep to
        - Address the specific concerns mentioned in the sleep issue
        
        The story should feel like a loving parent reading to their child, but adapted for an adult's emotional needs.
        Include elements that help the reader feel safe, loved, and ready for sleep."""
        
        # Generate story using Gemini
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        if not response.text:
            return jsonify({'error': 'No story generated. Please try again.'}), 500
            
        story_text = response.text
        
        # Create story object (temporary, not saved to Firebase)
        story_data = {
            'title': f"{adult_name}'s Soothing Story",
            'content': story_text,
            'sleep_issue': sleep_issue,
            'custom_sleep_reason': custom_sleep_reason,
            'sleep_issue_display': sleep_issue_display,
            'memories': memories,
            'custom_memory': custom_memory,
            'adult_name': adult_name,
            'timestamp': datetime.now().isoformat(),
            'type': 'adult_generated',
            'temporary': True  # Mark as temporary
        }
        
        # Don't save to Firebase - return the story directly
        return jsonify(story_data)
        
    except Exception as e:
        print(f"Error generating adult story: {str(e)}")
        return jsonify({'error': f'Story generation failed: {str(e)}'}), 500

@app.route('/api/setup-classic-stories', methods=['POST'])
def setup_classic_stories():
    """Manually add all classic stories to Firebase"""
    try:
        classic_stories = [
            {
                'title': 'The Little Red Hen',
                'content': 'Once upon a time, there was a little red hen who lived on a farm. One day, she found some wheat seeds and decided to plant them. "Who will help me plant the wheat?" she asked her friends. "Not I," said the lazy cat. "Not I," said the sleepy dog. "Not I," said the busy mouse. "Then I will plant it myself," said the little red hen. And she did. When the wheat grew tall and golden, she asked, "Who will help me cut the wheat?" "Not I," said the cat. "Not I," said the dog. "Not I," said the mouse. "Then I will cut it myself," said the little red hen. And she did. When the wheat was ready to be made into bread, she asked, "Who will help me make the bread?" "Not I," said the cat. "Not I," said the dog. "Not I," said the mouse. "Then I will make it myself," said the little red hen. And she did. When the bread was fresh and warm, she asked, "Who will help me eat the bread?" "I will!" said the cat. "I will!" said the dog. "I will!" said the mouse. "No, you will not," said the little red hen. "I will eat it myself." And she did. The little red hen taught everyone that hard work brings its own rewards.',
                'keywords': ['hen', 'farm', 'bread', 'friendship'],
                'timestamp': datetime.now().isoformat(),
                'type': 'classic'
            },
            {
                'title': 'The Three Little Pigs',
                'content': 'Once upon a time, there were three little pigs who lived with their mother. When they grew up, their mother told them it was time to build their own houses. The first little pig was lazy and built his house out of straw. The second little pig was a bit lazy and built his house out of sticks. The third little pig was wise and worked hard to build his house out of bricks. One day, a big bad wolf came to the village. He huffed and puffed and blew down the straw house. The first little pig ran to his brother\'s stick house. The wolf huffed and puffed and blew down the stick house too. Both pigs ran to their brother\'s brick house. The wolf huffed and puffed, but he could not blow down the brick house. The three little pigs were safe inside. The wolf tried to come down the chimney, but the pigs had a pot of hot water waiting. The wolf ran away and never came back. The three little pigs learned that hard work and planning ahead keeps you safe.',
                'keywords': ['pigs', 'wolf', 'house', 'safety'],
                'timestamp': datetime.now().isoformat(),
                'type': 'classic'
            },
            {
                'title': 'The Tortoise and the Hare',
                'content': 'Once upon a time, there was a hare who was very proud of how fast he could run. He often made fun of the tortoise for being so slow. One day, the tortoise got tired of the hare\'s teasing and challenged him to a race. The hare laughed and agreed, thinking it would be an easy win. The race began, and the hare quickly ran far ahead. He looked back and saw the tortoise was still at the starting line. The hare decided to take a nap under a tree, thinking he had plenty of time. Meanwhile, the tortoise kept walking slowly and steadily. When the hare woke up, he saw the tortoise was almost at the finish line. The hare ran as fast as he could, but it was too late. The tortoise had won the race! The hare learned that slow and steady wins the race, and the tortoise learned that determination and patience are valuable qualities.',
                'keywords': ['tortoise', 'hare', 'race', 'patience'],
                'timestamp': datetime.now().isoformat(),
                'type': 'classic'
            },
            {
                'title': 'The Lion and the Mouse',
                'content': 'Once upon a time, a mighty lion was sleeping in the forest. A little mouse was running around and accidentally woke up the lion. The lion was very angry and was about to eat the mouse. The mouse begged for mercy, saying, "Please spare me, mighty lion! I promise I will help you someday if you let me go." The lion laughed at the idea that such a tiny creature could ever help him, but he let the mouse go anyway. A few days later, the lion was caught in a hunter\'s net. He roared and struggled, but he could not escape. The little mouse heard the lion\'s cries and came to help. She gnawed through the ropes of the net with her sharp teeth. Soon, the lion was free! The lion was very grateful and learned that even the smallest friends can be the biggest help. From that day on, the lion and the mouse were the best of friends.',
                'keywords': ['lion', 'mouse', 'friendship', 'kindness'],
                'timestamp': datetime.now().isoformat(),
                'type': 'classic'
            },
            {
                'title': 'The Ugly Duckling',
                'content': 'Once upon a time, on a beautiful farm, a mother duck was waiting for her eggs to hatch. One by one, the eggs cracked open, and little yellow ducklings emerged. But one egg was different - it was larger than the others. When it finally hatched, out came a grey, awkward-looking duckling. The other ducklings made fun of him and called him ugly. Even the farm animals teased him. The ugly duckling felt very sad and lonely. He decided to leave the farm and find a place where he belonged. He wandered through the forest and across fields, meeting different animals along the way. Winter came and went, and the ugly duckling grew bigger. One spring day, he saw beautiful white swans swimming on a lake. He was amazed by their grace and beauty. The swans called to him, and when he looked at his reflection in the water, he saw that he had grown into a beautiful white swan too! The ugly duckling had found his family and his true self.',
                'keywords': ['duck', 'swan', 'acceptance', 'beauty'],
                'timestamp': datetime.now().isoformat(),
                'type': 'classic'
            },
            {
                'title': 'The Boy Who Cried Wolf',
                'content': 'Once upon a time, there was a young shepherd boy who watched over the village sheep. The boy was often bored and lonely on the hillside. One day, he decided to play a trick on the villagers. He ran down to the village shouting, "Wolf! Wolf! A wolf is attacking the sheep!" The villagers dropped everything and ran up the hill to help. When they got there, they found no wolf - just the boy laughing at his joke. The villagers were angry but went back to their work. A few days later, the boy played the same trick again. "Wolf! Wolf!" he shouted. Again, the villagers ran up the hill, and again they found no wolf. The boy laughed, but the villagers were very cross. They warned him not to cry wolf again unless there was a real wolf. Some time later, a real wolf did come to attack the sheep. The boy shouted, "Wolf! Wolf!" as loudly as he could, but this time the villagers ignored him. They thought he was playing another trick. The wolf ate many sheep, and the boy learned that lying has serious consequences.',
                'keywords': ['boy', 'wolf', 'honesty', 'trust'],
                'timestamp': datetime.now().isoformat(),
                'type': 'classic'
            },
            {
                'title': 'The Ant and the Grasshopper',
                'content': 'Once upon a time, there was an ant who worked very hard all summer long. She gathered food and stored it in her home for the winter. A grasshopper lived nearby and spent the summer singing and playing. He laughed at the ant for working so hard. "Why don\'t you come and play with me?" he asked. "I am gathering food for the winter," said the ant. "You should do the same." The grasshopper just laughed and continued playing. When winter came, the ground was covered with snow. The grasshopper had no food and was very hungry. He went to the ant\'s house and begged for food. "Please give me some food," he said. "I am so hungry." The ant remembered how the grasshopper had laughed at her during the summer. But she was kind and shared her food with him. "I will help you this time," said the ant, "but remember to work hard next summer." The grasshopper learned that it is important to prepare for the future and not waste time.',
                'keywords': ['ant', 'grasshopper', 'work', 'preparation'],
                'timestamp': datetime.now().isoformat(),
                'type': 'classic'
            },
            {
                'title': 'The Gingerbread Man',
                'content': 'Once upon a time, an old woman baked a gingerbread man. When she opened the oven, the gingerbread man jumped out and ran away! "Stop!" cried the old woman. "I want to eat you!" But the gingerbread man ran faster and sang, "Run, run, as fast as you can! You can\'t catch me, I\'m the gingerbread man!" The old woman and her husband chased him, but he was too fast. He ran past a cow in the field. "Stop!" said the cow. "I want to eat you!" But the gingerbread man ran faster and sang his song. He ran past a horse, a dog, and a cat, but none could catch him. Finally, he came to a river. A sly fox was sitting by the riverbank. "I can help you cross the river," said the fox. "Jump on my back." The gingerbread man was tired of running, so he jumped on the fox\'s back. But the fox was tricky. He swam deeper and deeper until the gingerbread man had to sit on his nose. Then the fox flipped his head and ate the gingerbread man! The gingerbread man learned that being too proud and trusting strangers can be dangerous.',
                'keywords': ['gingerbread', 'fox', 'running', 'caution'],
                'timestamp': datetime.now().isoformat(),
                'type': 'classic'
            }
        ]
        
        stories_ref = db.collection('stories')
        added_count = 0
        
        for story in classic_stories:
            # Check if story already exists by title
            existing_stories = stories_ref.where('title', '==', story['title']).stream()
            if not list(existing_stories):
                stories_ref.add(story)
                added_count += 1
        
        return jsonify({
            'success': True, 
            'message': f'Added {added_count} new classic stories to the database',
            'total_stories': len(classic_stories)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Create classic stories in Firebase if they don't exist
    try:
        stories_ref = db.collection('stories')
        if len(list(stories_ref.limit(1).stream())) == 0:
            classic_stories = [
                {
                    'title': 'The Little Red Hen',
                    'content': 'Once upon a time, there was a little red hen who lived on a farm. One day, she found some wheat seeds and decided to plant them. "Who will help me plant the wheat?" she asked her friends. "Not I," said the lazy cat. "Not I," said the sleepy dog. "Not I," said the busy mouse. "Then I will plant it myself," said the little red hen. And she did. When the wheat grew tall and golden, she asked, "Who will help me cut the wheat?" "Not I," said the cat. "Not I," said the dog. "Not I," said the mouse. "Then I will cut it myself," said the little red hen. And she did. When the wheat was ready to be made into bread, she asked, "Who will help me make the bread?" "Not I," said the cat. "Not I," said the dog. "Not I," said the mouse. "Then I will make it myself," said the little red hen. And she did. When the bread was fresh and warm, she asked, "Who will help me eat the bread?" "I will!" said the cat. "I will!" said the dog. "I will!" said the mouse. "No, you will not," said the little red hen. "I will eat it myself." And she did. The little red hen taught everyone that hard work brings its own rewards.',
                    'keywords': ['hen', 'farm', 'bread', 'friendship'],
                    'timestamp': datetime.now().isoformat(),
                    'type': 'classic'
                },
                {
                    'title': 'The Three Little Pigs',
                    'content': 'Once upon a time, there were three little pigs who lived with their mother. When they grew up, their mother told them it was time to build their own houses. The first little pig was lazy and built his house out of straw. The second little pig was a bit lazy and built his house out of sticks. The third little pig was wise and worked hard to build his house out of bricks. One day, a big bad wolf came to the village. He huffed and puffed and blew down the straw house. The first little pig ran to his brother\'s stick house. The wolf huffed and puffed and blew down the stick house too. Both pigs ran to their brother\'s brick house. The wolf huffed and puffed, but he could not blow down the brick house. The three little pigs were safe inside. The wolf tried to come down the chimney, but the pigs had a pot of hot water waiting. The wolf ran away and never came back. The three little pigs learned that hard work and planning ahead keeps you safe.',
                    'keywords': ['pigs', 'wolf', 'house', 'safety'],
                    'timestamp': datetime.now().isoformat(),
                    'type': 'classic'
                },
                {
                    'title': 'The Tortoise and the Hare',
                    'content': 'Once upon a time, there was a hare who was very proud of how fast he could run. He often made fun of the tortoise for being so slow. One day, the tortoise got tired of the hare\'s teasing and challenged him to a race. The hare laughed and agreed, thinking it would be an easy win. The race began, and the hare quickly ran far ahead. He looked back and saw the tortoise was still at the starting line. The hare decided to take a nap under a tree, thinking he had plenty of time. Meanwhile, the tortoise kept walking slowly and steadily. When the hare woke up, he saw the tortoise was almost at the finish line. The hare ran as fast as he could, but it was too late. The tortoise had won the race! The hare learned that slow and steady wins the race, and the tortoise learned that determination and patience are valuable qualities.',
                    'keywords': ['tortoise', 'hare', 'race', 'patience'],
                    'timestamp': datetime.now().isoformat(),
                    'type': 'classic'
                },
                {
                    'title': 'The Lion and the Mouse',
                    'content': 'Once upon a time, a mighty lion was sleeping in the forest. A little mouse was running around and accidentally woke up the lion. The lion was very angry and was about to eat the mouse. The mouse begged for mercy, saying, "Please spare me, mighty lion! I promise I will help you someday if you let me go." The lion laughed at the idea that such a tiny creature could ever help him, but he let the mouse go anyway. A few days later, the lion was caught in a hunter\'s net. He roared and struggled, but he could not escape. The little mouse heard the lion\'s cries and came to help. She gnawed through the ropes of the net with her sharp teeth. Soon, the lion was free! The lion was very grateful and learned that even the smallest friends can be the biggest help. From that day on, the lion and the mouse were the best of friends.',
                    'keywords': ['lion', 'mouse', 'friendship', 'kindness'],
                    'timestamp': datetime.now().isoformat(),
                    'type': 'classic'
                },
                {
                    'title': 'The Ugly Duckling',
                    'content': 'Once upon a time, on a beautiful farm, a mother duck was waiting for her eggs to hatch. One by one, the eggs cracked open, and little yellow ducklings emerged. But one egg was different - it was larger than the others. When it finally hatched, out came a grey, awkward-looking duckling. The other ducklings made fun of him and called him ugly. Even the farm animals teased him. The ugly duckling felt very sad and lonely. He decided to leave the farm and find a place where he belonged. He wandered through the forest and across fields, meeting different animals along the way. Winter came and went, and the ugly duckling grew bigger. One spring day, he saw beautiful white swans swimming on a lake. He was amazed by their grace and beauty. The swans called to him, and when he looked at his reflection in the water, he saw that he had grown into a beautiful white swan too! The ugly duckling had found his family and his true self.',
                    'keywords': ['duck', 'swan', 'acceptance', 'beauty'],
                    'timestamp': datetime.now().isoformat(),
                    'type': 'classic'
                },
                {
                    'title': 'The Boy Who Cried Wolf',
                    'content': 'Once upon a time, there was a young shepherd boy who watched over the village sheep. The boy was often bored and lonely on the hillside. One day, he decided to play a trick on the villagers. He ran down to the village shouting, "Wolf! Wolf! A wolf is attacking the sheep!" The villagers dropped everything and ran up the hill to help. When they got there, they found no wolf - just the boy laughing at his joke. The villagers were angry but went back to their work. A few days later, the boy played the same trick again. "Wolf! Wolf!" he shouted. Again, the villagers ran up the hill, and again they found no wolf. The boy laughed, but the villagers were very cross. They warned him not to cry wolf again unless there was a real wolf. Some time later, a real wolf did come to attack the sheep. The boy shouted, "Wolf! Wolf!" as loudly as he could, but this time the villagers ignored him. They thought he was playing another trick. The wolf ate many sheep, and the boy learned that lying has serious consequences.',
                    'keywords': ['boy', 'wolf', 'honesty', 'trust'],
                    'timestamp': datetime.now().isoformat(),
                    'type': 'classic'
                },
                {
                    'title': 'The Ant and the Grasshopper',
                    'content': 'Once upon a time, there was an ant who worked very hard all summer long. She gathered food and stored it in her home for the winter. A grasshopper lived nearby and spent the summer singing and playing. He laughed at the ant for working so hard. "Why don\'t you come and play with me?" he asked. "I am gathering food for the winter," said the ant. "You should do the same." The grasshopper just laughed and continued playing. When winter came, the ground was covered with snow. The grasshopper had no food and was very hungry. He went to the ant\'s house and begged for food. "Please give me some food," he said. "I am so hungry." The ant remembered how the grasshopper had laughed at her during the summer. But she was kind and shared her food with him. "I will help you this time," said the ant, "but remember to work hard next summer." The grasshopper learned that it is important to prepare for the future and not waste time.',
                    'keywords': ['ant', 'grasshopper', 'work', 'preparation'],
                    'timestamp': datetime.now().isoformat(),
                    'type': 'classic'
                },
                {
                    'title': 'The Gingerbread Man',
                    'content': 'Once upon a time, an old woman baked a gingerbread man. When she opened the oven, the gingerbread man jumped out and ran away! "Stop!" cried the old woman. "I want to eat you!" But the gingerbread man ran faster and sang, "Run, run, as fast as you can! You can\'t catch me, I\'m the gingerbread man!" The old woman and her husband chased him, but he was too fast. He ran past a cow in the field. "Stop!" said the cow. "I want to eat you!" But the gingerbread man ran faster and sang his song. He ran past a horse, a dog, and a cat, but none could catch him. Finally, he came to a river. A sly fox was sitting by the riverbank. "I can help you cross the river," said the fox. "Jump on my back." The gingerbread man was tired of running, so he jumped on the fox\'s back. But the fox was tricky. He swam deeper and deeper until the gingerbread man had to sit on his nose. Then the fox flipped his head and ate the gingerbread man! The gingerbread man learned that being too proud and trusting strangers can be dangerous.',
                    'keywords': ['gingerbread', 'fox', 'running', 'caution'],
                    'timestamp': datetime.now().isoformat(),
                    'type': 'classic'
                }
            ]
            
            for story in classic_stories:
                stories_ref.add(story)
            print("Classic stories added to Firebase")
    except Exception as e:
        print(f"Error setting up classic stories: {e}")
    
    app.run(debug=True, port=5002) 