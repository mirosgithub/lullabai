// Classic stories page functionality
let currentUtterance = null;

document.addEventListener('DOMContentLoaded', function () {
  loadStories();
  setupModal();
});

// Load stories from Firebase
async function loadStories() {
  const loading = document.getElementById('loading');
  const storiesGrid = document.getElementById('stories-grid');
  const error = document.getElementById('error');

  try {
    loading.style.display = 'block';
    storiesGrid.style.display = 'none';
    error.style.display = 'none';

    const response = await fetch('/api/stories');
    const stories = await response.json();

    if (response.ok) {
      displayStories(stories);
    } else {
      throw new Error(stories.error || 'Failed to load stories');
    }
  } catch (err) {
    console.error('Error loading stories:', err);
    loading.style.display = 'none';
    error.style.display = 'block';
  }
}

// Display stories in the grid
function displayStories(stories) {
  const loading = document.getElementById('loading');
  const storiesGrid = document.getElementById('stories-grid');

  loading.style.display = 'none';
  storiesGrid.style.display = 'grid';

  storiesGrid.innerHTML = '';

  if (stories.length === 0) {
    storiesGrid.innerHTML = `
            <div class="story-card" style="grid-column: 1 / -1; text-align: center;">
                <h3>No stories available</h3>
                <p>Check back later for new bedtime stories!</p>
            </div>
        `;
    return;
  }

  stories.forEach(story => {
    const storyCard = createStoryCard(story);
    storiesGrid.appendChild(storyCard);
  });
}

// Create a story card element
function createStoryCard(story) {
  const card = document.createElement('div');
  card.className = 'story-card';
  card.setAttribute('data-story-id', story.id);

  const keywords = story.keywords ? story.keywords.join(', ') : '';
  const preview = story.content ? story.content.substring(0, 150) + '...' : 'No content available';

  card.innerHTML = `
        <h3>${story.title || 'Untitled Story'}</h3>
        <p>${preview}</p>
        ${keywords ? `<div class="story-keywords">
            ${story.keywords.map(keyword => `<span class="keyword-tag">${keyword}</span>`).join('')}
        </div>` : ''}
    `;

  card.addEventListener('click', () => openStoryModal(story.id));
  return card;
}

// Setup modal functionality
function setupModal() {
  const modal = document.getElementById('storyModal');
  const closeBtn = modal.querySelector('.close');

  // Close modal when clicking the X
  closeBtn.addEventListener('click', closeStoryModal);

  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeStoryModal();
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeStoryModal();
    }
  });
}

// Open story modal
async function openStoryModal(storyId) {
  const modal = document.getElementById('storyModal');
  const storyContent = document.getElementById('storyContent');

  try {
    const response = await fetch(`/api/story/${storyId}`);
    const story = await response.json();

    if (response.ok) {
      displayStoryInModal(story);
      modal.style.display = 'block';
    } else {
      throw new Error(story.error || 'Failed to load story');
    }
  } catch (err) {
    console.error('Error loading story:', err);
    storyContent.innerHTML = `
            <h2>Error</h2>
            <p>Sorry, we couldn't load this story. Please try again.</p>
        `;
    modal.style.display = 'block';
  }
}

// Display story in modal
function displayStoryInModal(story) {
  const storyContent = document.getElementById('storyContent');

  const keywords = story.keywords ? story.keywords.join(', ') : '';

  storyContent.innerHTML = `
        <h2>${story.title || 'Untitled Story'}</h2>
        ${keywords ? `<p><strong>Keywords:</strong> ${keywords}</p>` : ''}
        <div class="story-text">
            ${story.content ? story.content.replace(/\n/g, '<br>') : 'No content available'}
        </div>
        <div class="story-actions">
            <button class="btn btn-secondary" id="readAloudBtn">
                🔊 Read to Me
            </button>
        </div>
    `;

  // Add event listener for read aloud button
  const readButton = storyContent.querySelector('#readAloudBtn');
  if (readButton && story.content) {
    readButton.addEventListener('click', () => {
      readStoryAloud(story.content, readButton);
    });
  }
}

// Close story modal
function closeStoryModal() {
  const modal = document.getElementById('storyModal');
  modal.style.display = 'none';

  // Stop any ongoing speech
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

// Read story aloud using Web Speech API
function readStoryAloud(text, button) {
  if (!text) {
    alert('No text to read');
    return;
  }

  if (window.speechSynthesis) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    currentUtterance = null;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8; // Slightly slower for bedtime stories
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to use a female voice for bedtime stories
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice =>
      voice.lang.includes('en') && voice.name.toLowerCase().includes('female')
    );
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);

    // Update button text and set state
    const originalText = button.textContent;
    button.textContent = '⏸️ Pause';
    button.dataset.state = 'playing';
    button.dataset.originalText = originalText;

    // Set the click handler to pause
    button.onclick = () => pauseSpeech(button);

    utterance.onend = () => {
      button.textContent = originalText;
      button.dataset.state = 'stopped';
      button.onclick = () => readStoryAloud(text, button);
      currentUtterance = null;
    };

    utterance.onpause = () => {
      button.textContent = '▶️ Resume';
      button.dataset.state = 'paused';
      button.onclick = () => resumeSpeech(button);
    };

    utterance.onresume = () => {
      button.textContent = '⏸️ Pause';
      button.dataset.state = 'playing';
      button.onclick = () => pauseSpeech(button);
    };
  } else {
    alert('Speech synthesis not supported in this browser');
  }
}

// Pause speech
function pauseSpeech(button) {
  if (window.speechSynthesis) {
    window.speechSynthesis.pause();
    button.textContent = '▶️ Resume';
    button.dataset.state = 'paused';
    button.onclick = () => resumeSpeech(button);
  }
}

// Resume speech
function resumeSpeech(button) {
  if (window.speechSynthesis) {
    window.speechSynthesis.resume();
    button.textContent = '⏸️ Pause';
    button.dataset.state = 'playing';
    button.onclick = () => pauseSpeech(button);
  }
}

// Setup classic stories (temporary function)
async function setupClassicStories() {
  try {
    const response = await fetch('/api/setup-classic-stories', {
      method: 'POST'
    });
    const result = await response.json();

    if (response.ok) {
      alert(`Success! ${result.message}`);
      loadStories(); // Reload the stories
    } else {
      alert('Error: ' + result.error);
    }
  } catch (err) {
    console.error('Error setting up classic stories:', err);
    alert('Error setting up classic stories');
  }
}

