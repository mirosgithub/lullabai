// Personalised story generation page functionality
let currentUtterance = null;

document.addEventListener('DOMContentLoaded', function () {
  setupKeywordSelection();
  setupCustomKeywords();
  setupGenerateButton();
  setupStoryActions();
  restoreGeneratedStory(); // Restore story if page was refreshed
});

let selectedKeywords = [];

// Setup keyword chip selection
function setupKeywordSelection() {
  const keywordChips = document.querySelectorAll('.keyword-chip');

  keywordChips.forEach(chip => {
    chip.addEventListener('click', function () {
      const keyword = this.getAttribute('data-keyword');
      toggleKeyword(keyword, this);
    });
  });
}

// Toggle keyword selection
function toggleKeyword(keyword, element) {
  const index = selectedKeywords.indexOf(keyword);

  if (index === -1) {
    // Add keyword
    selectedKeywords.push(keyword);
    element.classList.add('selected');
    addSelectedChip(keyword);
  } else {
    // Remove keyword
    selectedKeywords.splice(index, 1);
    element.classList.remove('selected');
    removeSelectedChip(keyword);
  }

  updateGenerateButton();
}

// Add selected keyword chip
function addSelectedChip(keyword) {
  const selectedContainer = document.getElementById('selectedKeywords');
  const emptyMessage = selectedContainer.querySelector('.empty-message');

  if (emptyMessage) {
    emptyMessage.remove();
  }

  const chip = document.createElement('div');
  chip.className = 'selected-chip';
  chip.setAttribute('data-keyword', keyword);
  chip.innerHTML = `
        ${keyword}
        <button class="remove-chip" onclick="removeKeyword('${keyword}')">&times;</button>
    `;

  selectedContainer.appendChild(chip);
}

// Remove selected keyword chip
function removeSelectedChip(keyword) {
  const chip = document.querySelector(`.selected-chip[data-keyword="${keyword}"]`);
  if (chip) {
    chip.remove();
  }

  // Show empty message if no keywords selected
  const selectedContainer = document.getElementById('selectedKeywords');
  if (selectedContainer.children.length === 0) {
    selectedContainer.innerHTML = '<p class="empty-message">No keywords selected yet</p>';
  }
}

// Remove keyword from selection
function removeKeyword(keyword) {
  const index = selectedKeywords.indexOf(keyword);
  if (index !== -1) {
    selectedKeywords.splice(index, 1);

    // Update keyword chip
    const chip = document.querySelector(`.keyword-chip[data-keyword="${keyword}"]`);
    if (chip) {
      chip.classList.remove('selected');
    }

    removeSelectedChip(keyword);
    updateGenerateButton();
  }
}

// Setup custom keywords input
function setupCustomKeywords() {
  const addButton = document.getElementById('addKeyword');
  const input = document.getElementById('customKeyword');

  addButton.addEventListener('click', addCustomKeyword);
  input.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      addCustomKeyword();
    }
  });
}

// Add custom keyword
function addCustomKeyword() {
  const input = document.getElementById('customKeyword');
  const keyword = input.value.trim().toLowerCase();

  if (keyword && !selectedKeywords.includes(keyword)) {
    selectedKeywords.push(keyword);
    addSelectedChip(keyword);
    updateGenerateButton();
    input.value = '';
  }
}

// Update generate button state
function updateGenerateButton() {
  const generateButton = document.getElementById('generateStory');
  generateButton.disabled = selectedKeywords.length === 0;
}

// Setup generate button
function setupGenerateButton() {
  const generateButton = document.getElementById('generateStory');
  generateButton.addEventListener('click', generateStory);
}

// Generate story
async function generateStory() {
  if (selectedKeywords.length === 0) {
    alert('Please select at least one keyword');
    return;
  }

  const childName = document.getElementById('childName').value.trim();
  if (!childName) {
    alert('Please enter your name!');
    return;
  }

  const loading = document.getElementById('loading');
  const storyGenerator = document.querySelector('.story-generator');
  const storyResult = document.getElementById('storyResult');

  try {
    loading.style.display = 'block';
    storyGenerator.style.display = 'none';
    storyResult.style.display = 'none';

    const response = await fetch('/api/generate-story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords: selectedKeywords,
        childName: childName
      })
    });

    const story = await response.json();

    if (response.ok) {
      displayGeneratedStory(story);
    } else {
      throw new Error(story.error || 'Failed to generate story');
    }
  } catch (err) {
    console.error('Error generating story:', err);
    alert('Sorry, we couldn\'t generate your story. Please try again.');
  } finally {
    loading.style.display = 'none';
    // Don't show the story generator here - let displayGeneratedStory handle it
  }
}

// Display generated story
function displayGeneratedStory(story) {
  const storyResult = document.getElementById('storyResult');
  const storyContent = document.getElementById('storyContent');
  const storyGenerator = document.querySelector('.story-generator');

  const childName = story.child_name || 'Anna';

  storyContent.innerHTML = `
        <h3>${story.title}</h3>
        <p><strong>Starring:</strong> ${childName} 🌟</p>
        <p><strong>Keywords used:</strong> ${story.keywords.join(', ')}</p>
        <div class="story-text">
            ${story.content.replace(/\n/g, '<br>')}
        </div>
        <div class="story-actions">
            <button class="btn btn-secondary" id="readAloud">
                🔊 Read to Me
            </button>
            <button class="btn btn-secondary" id="pauseBtn" style="display: none;">
                ⏸️ Pause
            </button>
            <button class="btn btn-primary" id="newStory">
                ✨ New Story
            </button>
        </div>
    `;

  // Hide the story generator and show only the story result
  storyGenerator.style.display = 'none';
  storyResult.style.display = 'block';

  // Store the generated story in sessionStorage for persistence during session
  sessionStorage.setItem('currentGeneratedStory', JSON.stringify(story));

  // Scroll to story result
  storyResult.scrollIntoView({ behavior: 'smooth' });
}

// Setup story action buttons
function setupStoryActions() {
  // Read aloud button
  document.addEventListener('click', function (e) {
    if (e.target.id === 'readAloud') {
      const storyText = document.querySelector('.story-text').textContent;
      const readButton = e.target;
      const pauseButton = document.getElementById('pauseBtn');
      readStoryAloudStreaming(storyText, readButton, pauseButton);
    }
  });

  // Pause button
  document.addEventListener('click', function (e) {
    if (e.target.id === 'pauseBtn') {
      const readButton = document.getElementById('readAloud');
      pauseSpeech(readButton, e.target);
    }
  });

  // New story button
  document.addEventListener('click', function (e) {
    if (e.target.id === 'newStory') {
      resetStoryGenerator();
    }
  });
}

// Streaming TTS implementation
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

    // Split text into sentences for faster processing
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Generate first chunk immediately
    const firstChunk = sentences.slice(0, 2).join('. ') + '.';

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
      generateNextChunk(sentences.slice(2), readButton, pauseButton);
    };

    audio.onpause = () => {
      pauseButton.textContent = '▶️ Resume';
      pauseButton.onclick = () => resumeSpeech(readButton, pauseButton);
    };

    audio.onplay = () => {
      pauseButton.textContent = '⏸️ Pause';
      pauseButton.onclick = () => pauseSpeech(readButton, pauseButton);
    };

  } catch (error) {
    console.error('TTS Error:', error);
    alert(`Failed to generate audio: ${error.message}`);
    resetButtonState(readButton, pauseButton);
  }
}

async function generateNextChunk(remainingSentences, readButton, pauseButton) {
  if (remainingSentences.length === 0) {
    // Story finished
    resetButtonState(readButton, pauseButton);
    return;
  }

  try {
    const chunk = remainingSentences.slice(0, 2).join('. ') + '.';

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
      generateNextChunk(remainingSentences.slice(2), readButton, pauseButton);
    };

  } catch (error) {
    console.error('Error generating next chunk:', error);
  }
}

// Pause audio
function pauseSpeech(readButton, pauseButton) {
  if (window.currentAudio) {
    window.currentAudio.pause();
    pauseButton.textContent = '▶️ Resume';
    pauseButton.onclick = () => resumeSpeech(readButton, pauseButton);
  }
}

// Resume audio
function resumeSpeech(readButton, pauseButton) {
  if (window.currentAudio) {
    window.currentAudio.play();
    pauseButton.textContent = '⏸️ Pause';
    pauseButton.onclick = () => pauseSpeech(readButton, pauseButton);
  }
}

// Reset story generator
function resetStoryGenerator() {
  // Stop any ongoing speech
  if (window.currentAudio) {
    window.currentAudio.pause();
    window.currentAudio.src = ''; // Clear audio source
  }

  // Clear selected keywords
  selectedKeywords = [];

  // Reset keyword chips
  document.querySelectorAll('.keyword-chip').forEach(chip => {
    chip.classList.remove('selected');
  });

  // Clear selected chips
  const selectedContainer = document.getElementById('selectedKeywords');
  selectedContainer.innerHTML = '<p class="empty-message">No keywords selected yet</p>';

  // Clear child name
  document.getElementById('childName').value = '';

  // Update generate button
  updateGenerateButton();

  // Hide story result and show story generator
  const storyResult = document.getElementById('storyResult');
  const storyGenerator = document.querySelector('.story-generator');

  storyResult.style.display = 'none';
  storyGenerator.style.display = 'block';

  // Clear the stored generated story
  sessionStorage.removeItem('currentGeneratedStory');

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Add function to restore generated story if page is refreshed
function restoreGeneratedStory() {
  const storedStory = sessionStorage.getItem('currentGeneratedStory');
  if (storedStory) {
    const story = JSON.parse(storedStory);
    displayGeneratedStory(story);

    // Restore selected keywords
    selectedKeywords = story.keywords || [];

    // Update keyword chips
    selectedKeywords.forEach(keyword => {
      const chip = document.querySelector(`.keyword-chip[data-keyword="${keyword}"]`);
      if (chip) {
        chip.classList.add('selected');
      }
    });

    // Update selected chips display
    selectedKeywords.forEach(keyword => {
      addSelectedChip(keyword);
    });

    // Restore child name
    document.getElementById('childName').value = story.child_name || '';

    // Update generate button
    updateGenerateButton();
  }
} 