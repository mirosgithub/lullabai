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
    storyGenerator.style.display = 'block';
  }
}

// Display generated story
function displayGeneratedStory(story) {
  const storyResult = document.getElementById('storyResult');
  const storyContent = document.getElementById('storyContent');

  const childName = story.child_name || 'Adventure';

  storyContent.innerHTML = `
        <h3>${story.title}</h3>
        <p><strong>Starring:</strong> ${childName} 🌟</p>
        <p><strong>Keywords used:</strong> ${story.keywords.join(', ')}</p>
        <div class="story-text">
            ${story.content.replace(/\n/g, '<br>')}
        </div>
    `;

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
      readStoryAloud(storyText);
    }
  });

  // New story button
  document.addEventListener('click', function (e) {
    if (e.target.id === 'newStory') {
      resetStoryGenerator();
    }
  });
}

// Read story aloud using Web Speech API
function readStoryAloud(text) {
  if (!text) {
    alert('No text to read');
    return;
  }

  if (window.speechSynthesis) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

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

    window.speechSynthesis.speak(utterance);

    // Update button text
    const readButton = event.target;
    const originalText = readButton.textContent;
    readButton.textContent = '⏸️ Pause';
    readButton.onclick = () => pauseSpeech(readButton, originalText, text);

    utterance.onend = () => {
      readButton.textContent = originalText;
      readButton.onclick = () => readStoryAloud(text);
    };

    utterance.onpause = () => {
      readButton.textContent = '▶️ Resume';
      readButton.onclick = () => resumeSpeech(readButton, originalText);
    };

    utterance.onresume = () => {
      readButton.textContent = '⏸️ Pause';
      readButton.onclick = () => pauseSpeech(readButton, originalText, text);
    };
  } else {
    alert('Speech synthesis not supported in this browser');
  }
}

// Pause speech
function pauseSpeech(button, originalText, text) {
  if (window.speechSynthesis) {
    window.speechSynthesis.pause();
    button.textContent = '▶️ Resume';
    button.onclick = () => resumeSpeech(button, originalText);
  }
}

// Resume speech
function resumeSpeech(button, originalText) {
  if (window.speechSynthesis) {
    window.speechSynthesis.resume();
    button.textContent = '⏸️ Pause';
    button.onclick = () => pauseSpeech(button, originalText);
  }
}

// Reset story generator
function resetStoryGenerator() {
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

  // Hide story result
  document.getElementById('storyResult').style.display = 'none';

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