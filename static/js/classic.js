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

  // Add event listeners for read and pause buttons using event delegation
  modal.addEventListener('click', function (e) {
    if (e.target.classList.contains('read-aloud-btn')) {
      const storyContent = document.getElementById('storyContent');
      const storyText = storyContent.querySelector('.story-text').textContent;
      const readButton = e.target;
      const pauseButton = storyContent.querySelector('.pause-btn');
      readStoryAloud(storyText, readButton, pauseButton);
    }
  });

  modal.addEventListener('click', function (e) {
    if (e.target.classList.contains('pause-btn')) {
      const storyContent = document.getElementById('storyContent');
      const readButton = storyContent.querySelector('.read-aloud-btn');
      const pauseButton = e.target;

      // Check if we're paused or playing
      if (pauseButton.textContent.includes('Resume')) {
        resumeSpeech(readButton, pauseButton);
      } else {
        pauseSpeech(readButton, pauseButton);
      }
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
            <button class="btn btn-secondary read-aloud-btn">
                🔊 Read to Me
            </button>
            <button class="btn btn-secondary pause-btn" style="display: none;">
                ⏸️ Pause
            </button>
        </div>
    `;

  // Store the story content for later use
  storyContent.dataset.storyContent = story.content;
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
function readStoryAloud(text, readButton, pauseButton) {
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

    // Show pause button, hide read button
    readButton.style.display = 'none';
    pauseButton.style.display = 'inline-block';

    utterance.onend = () => {
      // Show read button, hide pause button
      readButton.style.display = 'inline-block';
      pauseButton.style.display = 'none';
      currentUtterance = null;
    };

    utterance.onpause = () => {
      pauseButton.textContent = '▶️ Resume';
    };

    utterance.onresume = () => {
      pauseButton.textContent = '⏸️ Pause';
    };
  } else {
    alert('Speech synthesis not supported in this browser');
  }
}

// Pause speech
function pauseSpeech(readButton, pauseButton) {
  if (window.speechSynthesis) {
    window.speechSynthesis.pause();
    pauseButton.textContent = '▶️ Resume';
  }
}

// Resume speech
function resumeSpeech(readButton, pauseButton) {
  if (window.speechSynthesis) {
    window.speechSynthesis.resume();
    pauseButton.textContent = '⏸️ Pause';
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

