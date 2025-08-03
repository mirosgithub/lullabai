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

  // Add event listener for read button using event delegation
  modal.addEventListener('click', function (e) {
    if (e.target.classList.contains('read-aloud-btn')) {
      const storyContent = document.getElementById('storyContent');
      const storyText = storyContent.querySelector('.story-text').textContent;
      const readButton = e.target;
      const pauseButton = storyContent.querySelector('.pause-btn');
      readStoryAloud(storyText, readButton, pauseButton);
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

  // Store the story content and ID for later use
  storyContent.dataset.storyContent = story.content;
  storyContent.dataset.storyId = story.id;
}

// Close story modal
function closeStoryModal() {
  const modal = document.getElementById('storyModal');
  modal.style.display = 'none';

  // Stop any ongoing audio and clean up
  if (window.currentAudio) {
    // Remove all event listeners to prevent onerror from firing
    window.currentAudio.onerror = null;
    window.currentAudio.onloadstart = null;
    window.currentAudio.oncanplay = null;
    window.currentAudio.onplay = null;
    window.currentAudio.onended = null;
    window.currentAudio.onpause = null;

    // Pause and clear the audio
    window.currentAudio.pause();
    window.currentAudio.src = '';
    window.currentAudio = null;
  }

  // Reset any global flags
  window.isUserPaused = false;
}

// Play pre-generated audio for classic stories
async function readStoryAloud(text, readButton, pauseButton) {
  if (!text) {
    alert('No text to read');
    return;
  }

  try {
    // Show loading state
    readButton.textContent = '🔄 Loading...';
    readButton.disabled = true;
    pauseButton.style.display = 'none';

    // Get the story ID from the story content element
    const storyContent = document.getElementById('storyContent');
    const storyId = storyContent.dataset.storyId;

    if (!storyId) {
      throw new Error('Story ID not found');
    }

    // Construct the audio file path
    const audioUrl = `/static/audio/classic_${storyId}.mp3`;

    // Create audio element and start playing
    const audio = new Audio(audioUrl);
    window.currentAudio = audio;
    window.isUserPaused = false;

    // Show pause button, hide read button
    readButton.style.display = 'none';
    pauseButton.style.display = 'inline-block';
    pauseButton.textContent = '⏸️ Pause';

    // Set up click handlers
    pauseButton.onclick = () => pauseSpeech(readButton, pauseButton);

    // Handle audio events
    audio.onloadstart = () => {
      readButton.textContent = '🔄 Loading...';
    };

    audio.oncanplay = () => {
      readButton.textContent = '🔄 Loading...';
    };

    audio.onplay = () => {
      window.isUserPaused = false;
      pauseButton.textContent = '⏸️ Pause';
      pauseButton.onclick = () => pauseSpeech(readButton, pauseButton);
    };

    audio.onended = () => {
      // Story finished
      resetButtonState(readButton, pauseButton);
    };

    audio.onerror = () => {
      // Only show error if the modal is still open
      const modal = document.getElementById('storyModal');
      if (modal.style.display === 'block') {
        console.error('Audio file not found');
        alert('Audio file not found. Please try again later.');
        resetButtonState(readButton, pauseButton);
      }
    };

    // Start playing
    audio.play();

  } catch (error) {
    console.error('Audio Error:', error);
    alert('Error playing audio. Please try again.');
    resetButtonState(readButton, pauseButton);
  }
}

// Pause audio
function pauseSpeech(readButton, pauseButton) {
  if (window.currentAudio) {
    window.currentAudio.pause();
    window.isUserPaused = true;
    pauseButton.textContent = '▶️ Resume';
    pauseButton.onclick = () => resumeSpeech(readButton, pauseButton);
  }
}

// Resume audio
function resumeSpeech(readButton, pauseButton) {
  if (window.currentAudio) {
    window.currentAudio.play();
    window.isUserPaused = false;
    pauseButton.textContent = '⏸️ Pause';
    pauseButton.onclick = () => pauseSpeech(readButton, pauseButton);
  }
}

// Reset button state
function resetButtonState(readButton, pauseButton) {
  readButton.style.display = 'inline-block';
  readButton.textContent = '🔊 Read to Me';
  readButton.disabled = false;
  pauseButton.style.display = 'none';
}

