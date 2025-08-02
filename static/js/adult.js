// Adult bedtime story page functionality
let currentUtterance = null;

document.addEventListener('DOMContentLoaded', function () {
  setupSleepIssues();
  setupCustomSleepReason();
  setupNostalgiaSelection();
  setupCustomMemory();
  setupGenerateButton();
  setupStoryActions();
  restoreGeneratedStory();
});

let selectedSleepIssue = null;
let customSleepReason = '';
let selectedMemories = [];
let customMemory = '';

// Setup sleep issue selection
function setupSleepIssues() {
  const sleepOptions = document.querySelectorAll('.sleep-option');

  sleepOptions.forEach(option => {
    option.addEventListener('click', function () {
      // Remove selection from all options
      sleepOptions.forEach(opt => opt.classList.remove('selected'));

      // Select clicked option
      this.classList.add('selected');
      selectedSleepIssue = this.getAttribute('data-issue');

      // Clear custom sleep reason when predefined option is selected
      customSleepReason = '';
      document.getElementById('customSleepReason').value = '';
      removeSelectedElement('custom_sleep_reason');

      updateSelectedElements();
      updateGenerateButton();
    });
  });
}

// Setup custom sleep reason input
function setupCustomSleepReason() {
  const addButton = document.getElementById('addCustomSleepReason');
  const textarea = document.getElementById('customSleepReason');

  if (addButton && textarea) {
    addButton.addEventListener('click', addCustomSleepReason);
    textarea.addEventListener('keypress', function (e) {
      if (e.key === 'Enter' && e.ctrlKey) {
        addCustomSleepReason();
      }
    });
  }
}

// Add custom sleep reason
function addCustomSleepReason() {
  const textarea = document.getElementById('customSleepReason');
  const reason = textarea.value.trim();

  if (reason && reason.length > 10) {
    customSleepReason = reason;

    // Clear predefined selection
    selectedSleepIssue = null;
    document.querySelectorAll('.sleep-option').forEach(option => {
      option.classList.remove('selected');
    });

    addSelectedElement('custom_sleep_reason', `🌙 Sleep Issue: ${reason.substring(0, 50)}${reason.length > 50 ? '...' : ''}`);
    updateGenerateButton();
    textarea.value = '';

    // Show success feedback
    const addButton = document.getElementById('addCustomSleepReason');
    const originalText = addButton.textContent;
    addButton.textContent = '✓ Added!';
    addButton.style.background = '#27ae60';

    setTimeout(() => {
      addButton.textContent = originalText;
      addButton.style.background = '';
    }, 2000);
  } else if (reason) {
    alert('Please provide a more detailed reason (at least 10 characters)');
  } else {
    alert('Please enter a reason to add');
  }
}

// Setup nostalgia memory selection
function setupNostalgiaSelection() {
  const nostalgiaChips = document.querySelectorAll('.nostalgia-chip');

  nostalgiaChips.forEach(chip => {
    chip.addEventListener('click', function () {
      const memory = this.getAttribute('data-memory');
      toggleMemory(memory, this);
    });
  });
}

// Toggle memory selection
function toggleMemory(memory, element) {
  const index = selectedMemories.indexOf(memory);

  if (index === -1) {
    // Add memory
    selectedMemories.push(memory);
    element.classList.add('selected');
    addSelectedElement(memory, element.textContent);
  } else {
    // Remove memory
    selectedMemories.splice(index, 1);
    element.classList.remove('selected');
    removeSelectedElement(memory);
  }

  updateGenerateButton();
}

// Setup custom memory input
function setupCustomMemory() {
  const addButton = document.getElementById('addCustomMemory');
  const textarea = document.getElementById('customMemory');

  if (addButton && textarea) {
    addButton.addEventListener('click', addCustomMemory);
    textarea.addEventListener('keypress', function (e) {
      if (e.key === 'Enter' && e.ctrlKey) {
        addCustomMemory();
      }
    });
  }
}

// Add custom memory
function addCustomMemory() {
  const textarea = document.getElementById('customMemory');
  const memory = textarea.value.trim();

  if (memory && memory.length > 10) {
    customMemory = memory;
    addSelectedElement('custom_memory', `💭 Personal Memory: ${memory.substring(0, 50)}${memory.length > 50 ? '...' : ''}`);
    updateGenerateButton();
    textarea.value = '';

    // Show success feedback
    const addButton = document.getElementById('addCustomMemory');
    const originalText = addButton.textContent;
    addButton.textContent = '✓ Added!';
    addButton.style.background = '#27ae60';

    setTimeout(() => {
      addButton.textContent = originalText;
      addButton.style.background = '';
    }, 2000);
  } else if (memory) {
    alert('Please provide a more detailed memory (at least 10 characters)');
  } else {
    alert('Please enter a memory to add');
  }
}

// Add selected element chip
function addSelectedElement(element, displayText) {
  const selectedContainer = document.getElementById('selectedElements');
  const emptyMessage = selectedContainer.querySelector('.empty-message');

  if (emptyMessage) {
    emptyMessage.remove();
  }

  const chip = document.createElement('div');
  chip.className = 'selected-chip';
  chip.setAttribute('data-element', element);
  chip.innerHTML = `
        ${displayText}
        <button class="remove-chip" onclick="removeElement('${element}')">&times;</button>
    `;

  selectedContainer.appendChild(chip);
}

// Remove selected element chip
function removeSelectedElement(element) {
  const chip = document.querySelector(`.selected-chip[data-element="${element}"]`);
  if (chip) {
    chip.remove();
  }

  // Show empty message if no elements selected
  const selectedContainer = document.getElementById('selectedElements');
  if (selectedContainer.children.length === 0) {
    selectedContainer.innerHTML = '<p class="empty-message">No elements selected yet</p>';
  }
}

// Remove element from selection
function removeElement(element) {
  if (element === 'custom_sleep_reason') {
    customSleepReason = '';
    removeSelectedElement(element);
    updateGenerateButton();
    return;
  }

  if (element === 'custom_memory') {
    customMemory = '';
    removeSelectedElement(element);
    updateGenerateButton();
    return;
  }

  const index = selectedMemories.indexOf(element);
  if (index !== -1) {
    selectedMemories.splice(index, 1);

    // Update nostalgia chip
    const chip = document.querySelector(`.nostalgia-chip[data-memory="${element}"]`);
    if (chip) {
      chip.classList.remove('selected');
    }

    removeSelectedElement(element);
    updateGenerateButton();
  }
}

// Update selected elements display
function updateSelectedElements() {
  const selectedContainer = document.getElementById('selectedElements');
  selectedContainer.innerHTML = '';

  if (selectedSleepIssue) {
    const issueText = document.querySelector(`.sleep-option[data-issue="${selectedSleepIssue}"]`).textContent;
    addSelectedElement(selectedSleepIssue, issueText);
  }

  if (customSleepReason) {
    addSelectedElement('custom_sleep_reason', `🌙 Sleep Issue: ${customSleepReason.substring(0, 50)}${customSleepReason.length > 50 ? '...' : ''}`);
  }

  selectedMemories.forEach(memory => {
    const chip = document.querySelector(`.nostalgia-chip[data-memory="${memory}"]`);
    if (chip) {
      addSelectedElement(memory, chip.textContent);
    }
  });

  if (customMemory) {
    addSelectedElement('custom_memory', `💭 Personal Memory: ${customMemory.substring(0, 50)}${customMemory.length > 50 ? '...' : ''}`);
  }

  if (!selectedSleepIssue && !customSleepReason && selectedMemories.length === 0 && !customMemory) {
    selectedContainer.innerHTML = '<p class="empty-message">No elements selected yet</p>';
  }
}

// Update generate button state
function updateGenerateButton() {
  const generateButton = document.getElementById('generateAdultStory');
  generateButton.disabled = !(selectedSleepIssue || customSleepReason);
}

// Setup generate button
function setupGenerateButton() {
  const generateButton = document.getElementById('generateAdultStory');
  generateButton.addEventListener('click', generateAdultStory);
}

// Generate adult story
async function generateAdultStory() {
  if (!selectedSleepIssue && !customSleepReason) {
    alert('Please select a sleep issue or describe your specific situation');
    return;
  }

  const adultName = document.getElementById('adultName').value.trim();
  if (!adultName) {
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

    const response = await fetch('/api/generate-adult-story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sleepIssue: selectedSleepIssue,
        customSleepReason: customSleepReason,
        memories: selectedMemories,
        customMemory: customMemory,
        adultName: adultName
      })
    });

    const story = await response.json();

    if (response.ok) {
      displayGeneratedAdultStory(story);
    } else {
      throw new Error(story.error || 'Failed to generate story');
    }
  } catch (err) {
    console.error('Error generating adult story:', err);
    alert('Sorry, we couldn\'t generate your story. Please try again.');
  } finally {
    loading.style.display = 'none';
    // Don't show the story generator here - let displayGeneratedAdultStory handle it
  }
}

// Display generated adult story
function displayGeneratedAdultStory(story) {
  const storyResult = document.getElementById('storyResult');
  const storyContent = document.getElementById('storyContent');
  const storyGenerator = document.querySelector('.story-generator');

  const adultName = story.adult_name || 'You';

  storyContent.innerHTML = `
        <h3>${story.title}</h3>
        <p><strong>Created for:</strong> ${adultName} 🌿</p>
        <p><strong>Focus:</strong> ${story.sleep_issue_display}</p>
        ${story.memories && story.memories.length > 0 ? `<p><strong>Nostalgic elements:</strong> ${story.memories.join(', ')}</p>` : ''}
        ${story.custom_memory ? `<p><strong>Personal memory:</strong> ${story.custom_memory}</p>` : ''}
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
  sessionStorage.setItem('currentGeneratedAdultStory', JSON.stringify(story));

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
      readStoryAloud(storyText, readButton, pauseButton);
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

// Read story aloud using Web Speech API
function readStoryAloud(text, readButton, pauseButton) {
  if (!text) {
    alert('No text to read');
    return;
  }

  if (window.speechSynthesis) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.7; // Slower for adult stories
    utterance.pitch = 0.9; // Slightly lower pitch for soothing effect
    utterance.volume = 1.0;

    // Try to use a calming voice
    const voices = window.speechSynthesis.getVoices();
    const calmingVoice = voices.find(voice =>
      voice.lang.includes('en') && (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('soft'))
    );
    if (calmingVoice) {
      utterance.voice = calmingVoice;
    }

    window.speechSynthesis.speak(utterance);

    // Show pause button, hide read button
    readButton.style.display = 'none';
    pauseButton.style.display = 'inline-block';

    utterance.onend = () => {
      // Show read button, hide pause button
      readButton.style.display = 'inline-block';
      pauseButton.style.display = 'none';
    };

    utterance.onpause = () => {
      pauseButton.textContent = '▶️ Resume';
      pauseButton.onclick = () => resumeSpeech(readButton, pauseButton);
    };

    utterance.onresume = () => {
      pauseButton.textContent = '⏸️ Pause';
      pauseButton.onclick = () => pauseSpeech(readButton, pauseButton);
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
    pauseButton.onclick = () => resumeSpeech(readButton, pauseButton);
  }
}

// Resume speech
function resumeSpeech(readButton, pauseButton) {
  if (window.speechSynthesis) {
    window.speechSynthesis.resume();
    pauseButton.textContent = '⏸️ Pause';
    pauseButton.onclick = () => pauseSpeech(readButton, pauseButton);
  }
}

// Reset story generator
function resetStoryGenerator() {
  // Stop any ongoing speech
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  // Clear selected sleep issue
  selectedSleepIssue = null;
  document.querySelectorAll('.sleep-option').forEach(option => {
    option.classList.remove('selected');
  });

  // Clear custom sleep reason
  customSleepReason = '';
  document.getElementById('customSleepReason').value = '';

  // Clear selected memories
  selectedMemories = [];
  document.querySelectorAll('.nostalgia-chip').forEach(chip => {
    chip.classList.remove('selected');
  });

  // Clear custom memory
  customMemory = '';
  document.getElementById('customMemory').value = '';

  // Clear selected elements
  const selectedContainer = document.getElementById('selectedElements');
  selectedContainer.innerHTML = '<p class="empty-message">No elements selected yet</p>';

  // Clear adult name
  document.getElementById('adultName').value = '';

  // Update generate button
  updateGenerateButton();

  // Hide story result and show story generator
  const storyResult = document.getElementById('storyResult');
  const storyGenerator = document.querySelector('.story-generator');
  
  storyResult.style.display = 'none';
  storyGenerator.style.display = 'block';

  // Clear the stored generated story
  sessionStorage.removeItem('currentGeneratedAdultStory');

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Add function to restore generated story if page is refreshed
function restoreGeneratedStory() {
  const storedStory = sessionStorage.getItem('currentGeneratedAdultStory');
  if (storedStory) {
    const story = JSON.parse(storedStory);
    displayGeneratedAdultStory(story);

    // Restore selected sleep issue
    selectedSleepIssue = story.sleep_issue;
    if (selectedSleepIssue) {
      const issueButton = document.querySelector(`.sleep-option[data-issue="${selectedSleepIssue}"]`);
      if (issueButton) {
        issueButton.classList.add('selected');
      }
    }

    // Restore custom sleep reason
    customSleepReason = story.custom_sleep_reason || '';

    // Restore selected memories
    selectedMemories = story.memories || [];
    selectedMemories.forEach(memory => {
      const chip = document.querySelector(`.nostalgia-chip[data-memory="${memory}"]`);
      if (chip) {
        chip.classList.add('selected');
      }
    });

    // Restore custom memory
    customMemory = story.custom_memory || '';

    // Restore adult name
    document.getElementById('adultName').value = story.adult_name || '';

    // Update selected elements display
    updateSelectedElements();

    // Update generate button
    updateGenerateButton();
  }
} 