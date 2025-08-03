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
      readStoryAloudStreaming(storyText, readButton, pauseButton);
    }
  });

  // Remove the pause button event delegation - it will be handled by direct onclick handlers
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
  if (window.currentAudio) {
    window.currentAudio.pause();
    window.currentAudio.src = '';
  }
}

// Streaming TTS implementation using Google TTS API
async function readStoryAloudStreaming(text, readButton, pauseButton) {
  if (!text) {
    alert('No text to read');
    return;
  }

  try {
    // Show loading state
    readButton.textContent = '🔄 Generating...';
    readButton.disabled = true;
    pauseButton.style.display = 'none';

    // Split text into paragraphs for more natural breaks
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    // Generate first paragraph immediately
    const firstChunk = paragraphs[0];

    // Start generating first chunk
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: firstChunk })
    });

    if (!response.ok) {
      throw new Error('Failed to generate audio');
    }

    const data = await response.json();

    // Create audio element and start playing immediately
    const audio = new Audio(data.audio_url);
    window.currentAudio = audio;
    window.isUserPaused = false; // Track if user explicitly paused

    // Show pause button, hide read button
    readButton.style.display = 'none';
    pauseButton.style.display = 'inline-block';
    pauseButton.textContent = '⏸️ Pause';

    // Set up click handlers
    pauseButton.onclick = () => pauseSpeech(readButton, pauseButton);

    // Play first chunk immediately
    audio.play();

    // Handle audio events
    audio.onended = () => {
      // Generate next chunk while current is playing
      generateNextChunk(paragraphs.slice(1), readButton, pauseButton);
    };

    // Only change button state if user explicitly paused
    audio.onpause = () => {
      if (window.isUserPaused) {
        pauseButton.textContent = '▶️ Resume';
        pauseButton.onclick = () => resumeSpeech(readButton, pauseButton);
      }
    };

    audio.onplay = () => {
      // Reset user pause flag when audio starts playing
      window.isUserPaused = false;
      pauseButton.textContent = '⏸️ Pause';
      pauseButton.onclick = () => pauseSpeech(readButton, pauseButton);
    };

  } catch (error) {
    console.error('TTS Error:', error);
    alert(`Failed to generate audio: ${error.message}`);
    resetButtonState(readButton, pauseButton);
  }
}

async function generateNextChunk(remainingParagraphs, readButton, pauseButton) {
  if (remainingParagraphs.length === 0) {
    // Story finished
    resetButtonState(readButton, pauseButton);
    return;
  }

  try {
    const chunk = remainingParagraphs[0];

    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: chunk })
    });

    if (!response.ok) {
      throw new Error('Failed to generate next chunk');
    }

    const data = await response.json();
    const audio = new Audio(data.audio_url);

    // Play next chunk
    audio.play();
    window.currentAudio = audio;

    // Set up for next chunk
    audio.onended = () => {
      generateNextChunk(remainingParagraphs.slice(1), readButton, pauseButton);
    };

    // Only change button state if user explicitly paused
    audio.onpause = () => {
      if (window.isUserPaused) {
        pauseButton.textContent = '▶️ Resume';
        pauseButton.onclick = () => resumeSpeech(readButton, pauseButton);
      }
    };

    audio.onplay = () => {
      // Reset user pause flag when audio starts playing
      window.isUserPaused = false;
      pauseButton.textContent = '⏸️ Pause';
      pauseButton.onclick = () => pauseSpeech(readButton, pauseButton);
    };

  } catch (error) {
    console.error('Error generating next chunk:', error);
  }
}

// Pause audio
function pauseSpeech(readButton, pauseButton) {
  if (window.currentAudio) {
    window.currentAudio.pause();
    window.isUserPaused = true; // Mark that user explicitly paused
    pauseButton.textContent = '▶️ Resume';
    pauseButton.onclick = () => resumeSpeech(readButton, pauseButton);
  }
}

// Resume audio
function resumeSpeech(readButton, pauseButton) {
  if (window.currentAudio) {
    window.currentAudio.play();
    window.isUserPaused = false; // Reset user pause flag
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

