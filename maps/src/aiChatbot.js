/**
 * GEV AI Chatbot & Voice Assistant
 *
 * Integrated inline inside the location search bar (#location-search-pill).
 * Expandable into a mini chatbox with chat history, model selection, audio controls,
 * smart suggestions, and voice input.
 *
 * Text requests use the configured OpenAI Realtime or OpenRouter agent.
 */

import { searchAndFlyTo } from './locations.js';

/**
 * Detects whether a free-text input string in the search bar is intended as a
 * conversational AI query, question, greeting, or system command rather than a
 * pure geographical location name (e.g., 'hello' vs 'Tokyo').
 *
 * @param {string} rawQuery
 * @returns {boolean}
 */
export function isAiQuery(rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string') return false;
  const q = rawQuery.trim().toLowerCase();
  if (!q) return false;

  // 1. Common greetings & conversational salutations
  const commonGreetings = [
    'hello', 'hi', 'hey', 'hey there', 'greetings', 'hola', 'bonjour',
    'good morning', 'good afternoon', 'good evening', 'yo', 'sup', 'howdy',
    'help', 'help me', 'thanks', 'thank you', 'test'
  ];
  if (commonGreetings.includes(q)) return true;

  for (const g of commonGreetings) {
    if (q.startsWith(g + ' ') || q.startsWith(g + ',') || q.startsWith(g + '!') || q.startsWith(g + '?')) {
      return true;
    }
  }

  // 2. Conversational identity & capability questions
  if (
    q === 'who are you' || q === 'what are you' || q === 'what can you do' ||
    q === 'who made you' || q === 'how do you work' || q === 'how are you' ||
    q === 'what is this' || q === 'tell me about yourself'
  ) {
    return true;
  }

  // 3. Question structures (e.g. "what is...", "where is...", "how high...", etc.)
  if (/^(what|who|why|where is|where are|how|when|which|can you|could you|would you|tell me|explain|describe|show me how)\b/i.test(q)) {
    return true;
  }

  // Any phrase with a question mark
  if (q.includes('?')) return true;

  // 4. Command phrases to fly, orbit, or navigate
  if (/^(fly to|go to|take me to|navigate to|travel to|head to|visit|zoom to|bring me to|show me)\b/i.test(q)) {
    return true;
  }

  // 5. Layer toggles (satellites, flights, earthquakes, cctv, radio, weather, etc.)
  if (/^(turn on|turn off|enable|disable|toggle|hide|show|display|activate|deactivate)\s+(?:live\s+)?(satellites?|flights?|planes?|aircraft|earthquakes?|seismic|cctv|cameras?|radio|bikeshare|traffic|weather|clouds|shadows|layers?)\b/i.test(q)) {
    return true;
  }

  // 6. Style toggles (cyberpunk, retro, noir, anime, etc.)
  if (/^(change style|set style|switch to|apply style|make it|style)\s+(?:to\s+)?(?:preset\s+|theme\s+)?(cyberpunk|retro|noir|dark|surveillance|thermal|anime|snow|normal|default)\b/i.test(q)) {
    return true;
  }

  // 7. Lighting / scene controls (sunset, sunrise, night, golden hour, orbit)
  if (/^(sunset|sunrise|golden hour|night mode|day mode|start orbit|stop orbit|orbit earth|orbit camera|reset view|full earth)\b/i.test(q)) {
    return true;
  }

  // 8. Flood simulation, hydrological disasters, and event reconstruction commands
  if (/\b(simulate|simulation|flood|inundation|flash flood|glof|debris flow|headwaters|outburst|surge front|starting point|flood path|historical footage|historical intel|assam flood|nepal flood|chamoli flood|what happened here)\b/i.test(q)) {
    return true;
  }

  return false;
}

export class GevAiChatbot {
  constructor({ viewer, dataManager, styleManager, onLocationSearchSubmit, floodSimulation } = {}) {
    this.viewer = viewer || window.__godsEyeView?.viewer || null;
    this.dataManager = dataManager || window.__godsEyeView?.dataManager || null;
    this.styleManager = styleManager || window.__godsEyeView?.styleManager || null;
    this.floodSimulation = floodSimulation || window.__godsEyeView?.floodSimulation || null;
    this.onLocationSearchSubmit = onLocationSearchSubmit || null;

    this.selectedModel = 'standard';
    this.aiProvider = 'openai';
    this.openRouterModel = 'openrouter/free';
    this.isOpen = false;
    this.isListening = false;
    this.speechMode = 'location'; // 'location' or 'ai'
    this.isSpeaking = false;
    this.isThinking = false;
    this.ttsEnabled = true;
    this.orbitInterval = null;
    this.messages = [];
    this.recognition = null;
    this.currentUtterance = null;

    this._initElements();
    this._initSpeechRecognition();
    this._bindEvents();
    void this._loadProviderSettings();
    this._addWelcomeMessage();
  }

  _initElements() {
    // Clean up any obsolete detached panel if it exists
    const oldPanel = document.getElementById('gev-ai-chat-panel');
    if (oldPanel) oldPanel.remove();

    this.searchPill = document.getElementById('location-search-pill');
    this.header = document.getElementById('ai-chatbox-header');
    this.messagesContainer = document.getElementById('ai-chatbox-messages');
    this.suggestionsContainer = document.getElementById('ai-chatbox-suggestions');
    this.modelSelect = document.getElementById('ai-chatbox-model-select');
    this.providerModelBadge = document.getElementById('ai-chatbox-provider-model');
    this.ttsBtn = document.getElementById('ai-chatbox-tts-toggle');
    this.clearBtn = document.getElementById('ai-chatbox-clear-btn');
    this.foldBtn = document.getElementById('ai-chatbox-fold-btn');
    this.locationInput = document.getElementById('location-search');
    this.searchSubmitBtn = document.getElementById('location-search-submit');
    this.pillVoiceBtn = document.getElementById('pill-voice-btn');
    this.expandBtn = document.getElementById('ai-chat-expand-btn');
    this.voiceStatusChip = document.getElementById('ai-voice-status-chip');
    this.voiceStatusText = document.getElementById('ai-voice-status-text');
  }

  _initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = navigator.language || 'en-US';

        recognition.onstart = () => {
          this.isListening = true;
          this._updateUiState();
        };

        recognition.onresult = (event) => {
          let transcript = '';
          let hasFinalResult = false;
          for (let i = 0; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
            if (i >= event.resultIndex && event.results[i].isFinal) hasFinalResult = true;
          }

          if (this.locationInput) {
            this.locationInput.value = transcript;
            const placeholder = document.getElementById('ai-placeholder-text');
            if (placeholder && transcript) {
              placeholder.classList.add('hidden');
            }
          }

          if (hasFinalResult) {
            const finalQuery = transcript.trim();
            if (finalQuery) {
              if (this.speechMode === 'ai') {
                this.sendMessage(finalQuery);
                if (this.locationInput) this.locationInput.value = '';
              } else {
                if (typeof this.onLocationSearchSubmit === 'function') {
                  this.onLocationSearchSubmit(finalQuery);
                } else if (this.searchSubmitBtn) {
                  this.searchSubmitBtn.click();
                }
              }
            }
          }
        };

        recognition.onerror = (event) => {
          console.warn('[AI Chatbot] Speech recognition error:', event.error);
          this.isListening = false;
          this._showToast(`Voice input failed: ${event.error}. You can type your request instead.`);
          this._updateUiState();
        };

        recognition.onend = () => {
          this.isListening = false;
          this._updateUiState();
        };

        this.recognition = recognition;
      } catch (err) {
        console.warn('[AI Chatbot] Could not initialize SpeechRecognition:', err);
      }
    }
  }

  _bindEvents() {
    // Fold button in chatbox header
    if (this.foldBtn) {
      this.foldBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close();
      });
    }

    // Model selection dropdown
    if (this.modelSelect) {
      this.modelSelect.addEventListener('change', (e) => {
        this.selectedModel = e.target.value;
        window.__gevVoiceCommands?.setVoiceTier?.(this.selectedModel);
        const modelLabel = e.target.options[e.target.selectedIndex]?.text || this.selectedModel;
        this._showToast(`OpenAI Realtime tier: ${modelLabel} (used when OpenAI is selected)`);
      });
    }

    // Clear conversation
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.__gevVoiceCommands?.stop?.();
        this.messages = [];
        if (this.messagesContainer) {
          this.messagesContainer.innerHTML = '';
        }
        this._addWelcomeMessage();
        this._showToast('Chat history cleared');
      });
    }

    // Spoken voice audio toggle
    if (this.ttsBtn) {
      this.ttsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.ttsEnabled = !this.ttsEnabled;
        this.ttsBtn.setAttribute('aria-pressed', String(this.ttsEnabled));
        this.ttsBtn.classList.toggle('active', this.ttsEnabled);
        const icon = this.ttsBtn.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = this.ttsEnabled ? 'volume_up' : 'volume_off';
        if (!this.ttsEnabled && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        this._showToast(this.ttsEnabled ? '🔊 Voice audio output enabled' : '🔇 Voice audio output muted');
      });
    }

    // Handle suggestion and action chip clicks (Delegation)
    const handleChipClick = (e) => {
      const chip = e.target.closest('.ai-suggestion-chip, .ai-chat-action-chip');
      if (!chip) return;
      e.stopPropagation();
      e.preventDefault();
      this._handleChipActivation(chip);
    };

    if (this.suggestionsContainer) {
      this.suggestionsContainer.addEventListener('click', handleChipClick);
    }
    if (this.messagesContainer) {
      this.messagesContainer.addEventListener('click', handleChipClick);
    }

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  _handleChipActivation(chip) {
    const actionType = chip.dataset.actionType;
    const actionTarget = chip.dataset.actionTarget;
    const actionMode = chip.dataset.actionMode;
    const actionAct = chip.dataset.actionAct;
    const prompt = chip.dataset.prompt || chip.textContent.trim();

    if (actionType) {
      this._executeAction({ type: actionType, target: actionTarget, mode: actionMode, action: actionAct || actionTarget });
      this._showToast(`⚡ ${chip.textContent.trim()}`);
    } else if (prompt) {
      this.sendMessage(prompt);
    }
  }

  _addWelcomeMessage() {
    const welcomeText = "👋 **GEV AI Assistant Ready**.\n\nAsk about the live globe, or give commands to navigate, control data layers, and explore the map:";
    const initialSuggestions = [
      { type: 'SIMULATE_FLOOD', target: 'Assam', label: '🌊 Simulate Assam Flood' },
      { type: 'SIMULATE_FLOOD', target: 'Nepal', label: '🏔️ Nepal Melamchi Flood' },
      { type: 'FLY_TO', target: 'New Delhi', label: '🇮🇳 New Delhi' },
      { type: 'FLY_TO', target: 'Tokyo', label: '🗼 Tokyo' },
      { type: 'TOGGLE_LAYER', target: 'flights', label: '✈️ Flights' },
      { type: 'TOGGLE_LAYER', target: 'satellites', label: '🛰️ Satellites' },
      { type: 'SET_STYLE', target: 'retro', label: '🌆 Cyberpunk' },
      { type: 'CONTROL_SCENE', target: 'sunset', label: '🌅 Sunset Orbit' },
      { type: 'RESET_VIEW', label: '🌍 Full Earth' }
    ];

    this._appendMessage({
      role: 'assistant',
      content: welcomeText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: initialSuggestions
    });

    this._renderSuggestions(initialSuggestions);
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;

    // Close any featured locations popover tray so it does not overlap
    const popoverTray = document.getElementById('location-popover-tray');
    if (popoverTray) {
      popoverTray.hidden = true;
      popoverTray.setAttribute('hidden', '');
    }
    const searchToggle = document.getElementById('search-toggle');
    if (searchToggle) {
      searchToggle.setAttribute('aria-expanded', 'false');
    }

    if (this.searchPill) {
      this.searchPill.classList.add('chatbox-expanded');
      this.searchPill.classList.add('expanded');
    }

    if (this.expandBtn) {
      this.expandBtn.setAttribute('aria-expanded', 'true');
    }

    this._updateUiState();

    if (this.messagesContainer) {
      setTimeout(() => {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
      }, 50);
    }

    if (this.locationInput) {
      setTimeout(() => this.locationInput.focus(), 120);
    }
  }

  close() {
    this.isOpen = false;
    if (this.searchPill) {
      this.searchPill.classList.remove('chatbox-expanded');
    }

    if (this.expandBtn) {
      this.expandBtn.setAttribute('aria-expanded', 'false');
    }

    this.stopSpeechListening();

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    this._updateUiState();
  }

  /**
   * Microphone click handler:
   * - If search bar is in normal mode, runs location voice search
   * - If chatbox is expanded, runs voice input for the AI
   */
  handleMicClick() {
    if (this.isListening) {
      this.stopSpeechListening();
      return;
    }

    if (this.isOpen) {
      this.speechMode = 'ai';
      this.startSpeechListening();
    } else {
      this.speechMode = 'location';
      this.startSpeechListening();
    }
  }

  startSpeechListening() {
    if (!this.recognition) {
      this._showToast('Speech recognition not supported in this browser. Please type below.');
      return;
    }
    try {
      this.recognition.start();
    } catch (e) {
      console.warn('[AI Chatbot] Speech recognition start error:', e);
      this._showToast(`Could not start voice input: ${e?.message || 'check microphone permissions'}`);
    }
  }

  stopSpeechListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // no-op
      }
    }
    this.isListening = false;
    this._updateUiState();
  }

  _updateUiState() {
    const active = this.isListening;
    if (this.pillVoiceBtn) {
      this.pillVoiceBtn.classList.toggle('voice-active', active);
    }

    if (this.voiceStatusChip && this.voiceStatusText) {
      this.voiceStatusChip.classList.toggle('listening', this.isListening);
      this.voiceStatusChip.classList.toggle('speaking', this.isSpeaking || this.isThinking);

      if (this.isListening) {
        this.voiceStatusText.textContent = 'Listening...';
      } else if (this.isThinking) {
        this.voiceStatusText.textContent = 'Thinking...';
      } else if (this.isSpeaking) {
        this.voiceStatusText.textContent = 'Speaking...';
      } else {
        this.voiceStatusText.textContent = 'Ask your AI';
      }
    }
  }

  async sendMessage(userText) {
    if (!userText || !userText.trim()) return;
    const prompt = userText.trim();

    // Ensure chatbox is open when message is sent
    if (!this.isOpen) {
      this.open();
    }

    this._appendMessage({
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    this.isThinking = true;
    this._updateUiState();

    const typingId = this._appendTypingIndicator();

    try {
      const aiText = await this._sendToConfiguredAgent(prompt);
      this._removeTypingIndicator(typingId);

      const smartSuggestions = this._generateSmartSuggestions(prompt, aiText);
      this._appendMessage({
        role: 'assistant',
        content: aiText,
        suggestions: smartSuggestions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      this._renderSuggestions(smartSuggestions);

      if (this.ttsEnabled) this._speak(aiText);
    } catch (error) {
      this._removeTypingIndicator(typingId);
      this._appendMessage({
        role: 'assistant',
        content: error?.message || 'AI agent request failed. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      });
    } finally {
      this.isThinking = false;
      this._updateUiState();
    }
  }

  async _sendToConfiguredAgent(prompt) {
    const configResponse = await fetch('/api/gev/config', { cache: 'no-store' });
    const config = await configResponse.json().catch(() => ({}));
    if (!configResponse.ok) {
      throw new Error(config.error || `Could not load AI provider settings (${configResponse.status}).`);
    }
    this.aiProvider = config.provider;
    this.openRouterModel = config.openRouterModel;
    this._updateProviderModelUi();
    if (this.aiProvider === 'openrouter') return this._sendToOpenRouterAgent(prompt);
    return this._sendToRealtimeAgent(prompt);
  }

  async _loadProviderSettings() {
    try {
      const response = await fetch('/api/gev/config', { cache: 'no-store' });
      const config = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(config.error || `HTTP ${response.status}`);
      this.aiProvider = config.provider;
      this.openRouterModel = config.openRouterModel;
      this._updateProviderModelUi();
    } catch (error) {
      console.warn('[AI Chatbot] Could not load provider settings:', error?.message || error);
    }
  }

  _updateProviderModelUi() {
    const isOpenRouter = this.aiProvider === 'openrouter';
    if (this.modelSelect) this.modelSelect.hidden = isOpenRouter;
    if (this.providerModelBadge) {
      this.providerModelBadge.hidden = !isOpenRouter;
      this.providerModelBadge.textContent = `OpenRouter · ${this.openRouterModel}`;
    }
  }

  _getLiveMapContext() {
    const viewer = this.viewer || window.__godsEyeView?.viewer;
    const dataManager = this.dataManager || window.__godsEyeView?.dataManager;
    const position = viewer?.camera?.positionCartographic;
    const cesiumMath = window.Cesium?.Math;
    return {
      camera: position && cesiumMath
        ? {
          latitude: Number(cesiumMath.toDegrees(position.latitude).toFixed(4)),
          longitude: Number(cesiumMath.toDegrees(position.longitude).toFixed(4)),
          altitudeMeters: Math.round(position.height),
        }
        : null,
      enabledLayers: Array.from(dataManager?.getEnabledLayerIds?.() || []),
    };
  }

  async _sendToOpenRouterAgent() {
    const conversation = this.messages
      .filter((message) => ['user', 'assistant'].includes(message.role) && typeof message.content === 'string')
      .slice(-12)
      .map(({ role, content }) => ({ role, content }));
    if (!conversation.length) throw new Error('There is no conversation to send to OpenRouter.');

    const allowedActions = new Set([
      'FLY_TO', 'SET_STYLE', 'TOGGLE_LAYER', 'ENABLE_LAYER', 'DISABLE_LAYER',
      'MOVE_CAMERA', 'CONTROL_SCENE', 'RESET_VIEW', 'MEASURE', 'COCKPIT',
      'SIMULATE_FLOOD', 'SIMULATION_CONTROL', 'SIMULATION_CAMERA', 'SHOW_INTEL',
    ]);
    let executedAction = false;

    for (let round = 0; round < 3; round += 1) {
      const response = await fetch('/api/openrouter/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversation, context: this._getLiveMapContext() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || `OpenRouter request failed (${response.status}).`);
      }
      const message = payload.message;
      if (!message || typeof message.content !== 'string' || !Array.isArray(message.tool_calls)) {
        throw new Error('OpenRouter returned an invalid assistant response.');
      }
      if (!message.tool_calls.length) {
        return message.content.trim() || (executedAction
          ? 'Done — the requested map action was sent to the globe.'
          : 'The agent completed without a text response. Please try again.');
      }
      if (round === 2) throw new Error('OpenRouter requested too many consecutive map actions.');

      conversation.push({
        role: 'assistant',
        content: message.content || null,
        tool_calls: message.tool_calls,
      });
      for (const call of message.tool_calls) {
        const toolCallId = String(call.id || '');
        if (call.function?.name !== 'execute_gev_action') {
          conversation.push({ role: 'tool', tool_call_id: toolCallId, content: 'Unsupported tool.' });
          continue;
        }
        let action;
        try {
          action = JSON.parse(call.function.arguments || '{}');
        } catch {
          conversation.push({ role: 'tool', tool_call_id: toolCallId, content: 'Invalid action arguments.' });
          continue;
        }
        const actionFields = new Set(['type', 'target', 'mode', 'action', 'value', 'location', 'scenario']);
        if (
          !action
          || typeof action !== 'object'
          || Array.isArray(action)
          || !allowedActions.has(action.type)
          || Object.entries(action).some(([name, value]) => (
            !actionFields.has(name)
            || (name !== 'type' && (typeof value !== 'string' || value.length > 300))
          ))
        ) {
          conversation.push({ role: 'tool', tool_call_id: toolCallId, content: 'Unsupported map action.' });
          continue;
        }
        await this._executeAction(action);
        executedAction = true;
        conversation.push({
          role: 'tool',
          tool_call_id: toolCallId,
          content: JSON.stringify({ ok: true, message: 'Action dispatched to the local map.' }),
        });
      }
    }
    throw new Error('OpenRouter did not complete the response.');
  }

  async _sendToRealtimeAgent(prompt) {
    const agent = window.__gevVoiceCommands;
    if (!agent) throw new Error('OpenAI agent is not ready yet. Try again shortly.');
    if (!agent.isActive()) await agent.start({ textOnly: true });
    await agent.waitForDataChannel();

    return new Promise((resolve, reject) => {
      let responseId = null;
      let responseText = '';
      let settled = false;
      let unsubscribe = () => {};
      const timer = setTimeout(() => finish(new Error('OpenAI agent response timed out. Please try again.')), 60000);
      const finish = (error, text) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        unsubscribe();
        if (error) reject(error);
        else resolve(text || 'The agent completed without a text response. Please try again.');
      };

      unsubscribe = agent.subscribeChatEvents((event) => {
        if (event.responseId && agent.isSupersededResponse?.(event.responseId)) return;
        if (event.type === 'response-start') {
          responseId = event.responseId;
        } else if (event.responseId && responseId && event.responseId !== responseId) {
          return;
        } else if (event.type === 'text-delta') {
          responseText += event.text;
        } else if (event.type === 'text-done' && !responseText) {
          responseText = event.text;
        } else if (event.type === 'response-done') {
          responseText ||= event.text;
          if (event.status === 'failed') finish(new Error('OpenAI could not complete that request.'));
          else if (!event.hasFunctionCalls && (responseText || event.status !== 'completed')) finish(null, responseText);
        } else if (event.type === 'error') {
          finish(new Error(event.message));
        }
      });

      try {
        agent.sendTextCommand(prompt, { textOnly: true });
      } catch (error) {
        finish(error);
      }
    });
  }

  _generateSmartSuggestions(prompt = '', aiResponse = '', actions = []) {
    const suggestions = [];
    const p = prompt.toLowerCase();
    const r = aiResponse.toLowerCase();

    // 1. Actions extracted directly from the response
    for (const act of actions) {
      if (act.type === 'FLY_TO' && act.target) {
        suggestions.push({ type: 'FLY_TO', target: act.target, label: `✈️ Fly to: ${act.target}` });
      } else if (act.type === 'SET_STYLE' && act.target) {
        suggestions.push({ type: 'SET_STYLE', target: act.target, label: `🎨 Style: ${act.target}` });
      } else if (act.type === 'TOGGLE_LAYER' && act.target) {
        suggestions.push({ type: 'TOGGLE_LAYER', target: act.target, label: `📡 Layer: ${act.target}` });
      } else if (act.type === 'CONTROL_SCENE' && act.target) {
        suggestions.push({ type: 'CONTROL_SCENE', target: act.target, label: `🌅 Scene: ${act.target}` });
      } else if (act.type === 'SIMULATE_FLOOD') {
        suggestions.push({ type: 'SIMULATION_CAMERA', mode: 'follow', label: '📹 Follow Surge' });
        suggestions.push({ type: 'SIMULATION_CAMERA', mode: 'overview', label: '🗺️ Flood Path' });
        suggestions.push({ type: 'SHOW_INTEL', label: '📰 Historical Intel' });
      }
    }

    // Flood simulation state aware suggestions
    const floodSim = this.floodSimulation || window.__godsEyeView?.floodSimulation;
    if (floodSim && (floodSim.status === 'running' || floodSim.status === 'paused')) {
      suggestions.push({ type: 'SIMULATION_CAMERA', mode: 'follow', label: '📹 Follow Surge' });
      suggestions.push({ type: 'SIMULATION_CAMERA', mode: 'start_point', label: '📍 Starting Point' });
      suggestions.push({ type: 'SIMULATION_CAMERA', mode: 'overview', label: '🗺️ Flood Path' });
      suggestions.push({ type: 'SHOW_INTEL', label: '📰 Historical Intel' });
      if (floodSim.status === 'running') {
        suggestions.push({ type: 'SIMULATION_CONTROL', action: 'speed_up', label: '⏩ 2x Speed' });
        suggestions.push({ type: 'SIMULATION_CONTROL', action: 'pause', label: '⏸️ Pause' });
      } else {
        suggestions.push({ type: 'SIMULATION_CONTROL', action: 'resume', label: '▶️ Resume' });
        suggestions.push({ type: 'SIMULATION_CONTROL', action: 'replay', label: '⏮️ Replay' });
      }
    } else if (p.includes('flood') || r.includes('flood') || p.includes('assam') || p.includes('nepal')) {
      suggestions.push({ type: 'SIMULATE_FLOOD', target: 'Assam', label: '🌊 Simulate Assam Flood' });
      suggestions.push({ type: 'SIMULATE_FLOOD', target: 'Nepal', label: '🏔️ Nepal Melamchi Flood' });
      suggestions.push({ type: 'SIMULATE_FLOOD', target: 'Chamoli', label: '⚡ Chamoli Flash Flood' });
    }

    // 2. Next command suggestions based on mentions
    if (p.includes('tokyo') || r.includes('tokyo')) {
      suggestions.push({ type: 'FLY_TO', target: 'Tokyo', label: '🗼 Tokyo' });
      suggestions.push({ type: 'SET_STYLE', target: 'retro', label: '🌆 Cyberpunk Tokyo' });
      suggestions.push({ type: 'MOVE_CAMERA', target: 'orbit', label: '🧭 Orbit Tokyo' });
    }
    if (p.includes('paris') || r.includes('paris')) {
      suggestions.push({ type: 'FLY_TO', target: 'Paris', label: '🗼 Paris' });
      suggestions.push({ type: 'CONTROL_SCENE', target: 'sunset', label: '🌅 Sunset Paris' });
      suggestions.push({ type: 'MOVE_CAMERA', target: 'orbit', label: '🧭 Orbit Eiffel' });
    }
    if (p.includes('fuji') || r.includes('fuji')) {
      suggestions.push({ type: 'FLY_TO', target: 'Mount Fuji', label: '🗻 Mt Fuji' });
      suggestions.push({ type: 'CONTROL_SCENE', target: 'sunset', label: '🌅 Sunset Light' });
    }
    if (p.includes('taj mahal') || r.includes('taj mahal') || p.includes('agra')) {
      suggestions.push({ type: 'FLY_TO', target: 'Taj Mahal', label: '✈️ Taj Mahal' });
      suggestions.push({ type: 'CONTROL_SCENE', target: 'sunset', label: '🌅 Golden Hour' });
      suggestions.push({ type: 'MOVE_CAMERA', target: 'orbit', label: '🧭 Orbit Taj' });
    }
    if (p.includes('satellite') || p.includes('iss') || r.includes('satellite')) {
      suggestions.push({ type: 'TOGGLE_LAYER', target: 'satellites', label: '🛰️ Satellites' });
      suggestions.push({ type: 'CONTROL_SCENE', target: 'night', label: '🌙 Night Earth' });
    }
    if (p.includes('flight') || p.includes('plane') || r.includes('flight')) {
      suggestions.push({ type: 'TOGGLE_LAYER', target: 'flights', label: '✈️ Live Flights' });
      suggestions.push({ type: 'COCKPIT', label: '🕹️ Cockpit Chase' });
    }
    if (p.includes('earthquake') || p.includes('seismic') || r.includes('earthquake')) {
      suggestions.push({ type: 'TOGGLE_LAYER', target: 'earthquakes', label: '🌋 Earthquakes' });
      suggestions.push({ type: 'FLY_TO', target: 'Pacific Ring of Fire', label: '🌊 Ring of Fire' });
    }
    if (p.includes('cctv') || p.includes('camera') || r.includes('cctv')) {
      suggestions.push({ type: 'TOGGLE_LAYER', target: 'cctv', label: '📹 Live CCTV' });
    }
    if (p.includes('radio') || r.includes('radio')) {
      suggestions.push({ type: 'TOGGLE_LAYER', target: 'radio', label: '📻 Live Radio' });
    }

    // Default fallback suggestions
    if (suggestions.length < 3) {
      suggestions.push({ type: 'MOVE_CAMERA', target: 'orbit', label: '🧭 Orbit Camera' });
      suggestions.push({ type: 'CONTROL_SCENE', target: 'sunset', label: '🌅 Sunset Lighting' });
      suggestions.push({ type: 'SET_STYLE', target: 'retro', label: '🌆 Cyberpunk Theme' });
      suggestions.push({ type: 'SET_STYLE', target: 'noir', label: '🌑 Noir Style' });
      suggestions.push({ type: 'TOGGLE_LAYER', target: 'satellites', label: '🛰️ Satellites' });
      suggestions.push({ type: 'RESET_VIEW', label: '🌍 Full Earth' });
    }

    // Deduplicate
    const deduped = [];
    const seen = new Set();
    for (const item of suggestions) {
      const key = `${item.type || ''}:${item.target || ''}:${item.label}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(item);
      }
    }
    return deduped.slice(0, 5);
  }

  _renderSuggestions(suggestions = []) {
    if (!this.suggestionsContainer) return;
    if (!suggestions || suggestions.length === 0) {
      this.suggestionsContainer.innerHTML = '';
      return;
    }

    this.suggestionsContainer.innerHTML = suggestions.map((item) => {
      const actionTypeAttr = item.type ? `data-action-type="${item.type}"` : '';
      const actionTargetAttr = item.target ? `data-action-target="${item.target}"` : '';
      const actionModeAttr = item.mode ? `data-action-mode="${item.mode}"` : '';
      const actionActAttr = item.action ? `data-action-act="${item.action}"` : '';
      const promptAttr = `data-prompt="${item.prompt || item.label}"`;
      return `
        <button class="ai-suggestion-chip" type="button" ${actionTypeAttr} ${actionTargetAttr} ${actionModeAttr} ${actionActAttr} ${promptAttr} title="Click to run: ${item.label}">
          ${item.label}
        </button>
      `;
    }).join('');
  }

  _appendMessage({ role, content, reasoning = '', timestamp, isError = false, actions = [], suggestions = [] }) {
    this.messages.push({ role, content, reasoning, timestamp });

    if (!this.messagesContainer) return;

    const rowEl = document.createElement('div');
    rowEl.className = `ai-chat-row ${role} ${isError ? 'error' : ''}`;

    // Avatar element matching image.png
    const avatarEl = document.createElement('div');
    avatarEl.className = `ai-chat-avatar ${role}`;
    if (role === 'user') {
      avatarEl.innerHTML = `<span class="material-symbols-outlined">person</span>`;
    } else {
      avatarEl.innerHTML = `<img src="/ai-mountain-badge.svg" alt="AI" class="ai-chat-avatar-img" />`;
    }

    // Bubble element
    const bubbleEl = document.createElement('div');
    bubbleEl.className = `ai-chat-bubble ${role}`;

    const formattedContent = this._formatMarkdown(content);

    let reasoningBlock = '';
    if (reasoning) {
      reasoningBlock = `
        <details class="ai-thinking-details">
          <summary>
            <span class="material-symbols-outlined" style="font-size: 15px;">psychology</span>
            <span>Reasoning (${reasoning.length} chars)</span>
          </summary>
          <div class="ai-thinking-content">${this._formatMarkdown(reasoning)}</div>
        </details>
      `;
    }

    // Action and suggestion chips inside the assistant message
    const allChips = [
      ...actions.map((act) => ({
        type: act.type,
        target: act.target,
        mode: act.mode,
        action: act.action,
        label: act.type === 'FLY_TO' ? `✈️ Fly to: ${act.target}`
          : act.type === 'SET_STYLE' ? `🎨 Style: ${act.target}`
          : act.type === 'TOGGLE_LAYER' || act.type === 'ENABLE_LAYER' ? `📡 Layer: ${act.target}`
          : act.type === 'MOVE_CAMERA' ? `🧭 Camera: ${act.action || act.target}`
          : act.type === 'CONTROL_SCENE' ? `🌅 Scene: ${act.target}`
          : act.type === 'SIMULATE_FLOOD' ? `🌊 Simulate ${act.target || 'Flood'}`
          : act.type === 'SIMULATION_CONTROL' ? `⏯️ ${act.action || 'Control'}`
          : act.type === 'SIMULATION_CAMERA' ? `📹 Camera: ${act.mode || 'Follow'}`
          : act.type === 'SHOW_INTEL' ? `📰 Historical Intel`
          : `⚡ ${act.type}`
      })),
      ...(suggestions || [])
    ];

    let actionsMarkup = '';
    if (allChips.length > 0 && role === 'assistant') {
      // Deduplicate
      const seen = new Set();
      const uniqueChips = [];
      for (const chip of allChips) {
        const key = `${chip.type}:${chip.target || ''}:${chip.label}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueChips.push(chip);
        }
      }

      actionsMarkup = `
        <div class="ai-chat-actions-row">
          ${uniqueChips.slice(0, 4).map((chip) => `
            <button class="ai-chat-action-chip" type="button" data-action-type="${chip.type || ''}" data-action-target="${chip.target || ''}" data-action-mode="${chip.mode || ''}" data-action-act="${chip.action || ''}" data-prompt="${chip.prompt || chip.label}">
              ${chip.label}
            </button>
          `).join('')}
        </div>
      `;
    }

    bubbleEl.innerHTML = `
      ${reasoningBlock}
      <div class="ai-chat-text">${formattedContent}</div>
      ${actionsMarkup}
      <div class="ai-chat-meta">
        <span>${timestamp || ''}</span>
        ${role === 'assistant' && !isError ? `<button class="ai-chat-speak-btn" type="button" title="Speak message aloud"><span class="material-symbols-outlined">volume_up</span></button>` : ''}
      </div>
    `;

    const speakBtn = bubbleEl.querySelector('.ai-chat-speak-btn');
    if (speakBtn) {
      speakBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._speak(content);
      });
    }

    rowEl.appendChild(avatarEl);
    rowEl.appendChild(bubbleEl);

    this.messagesContainer.appendChild(rowEl);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  _appendTypingIndicator() {
    const id = `typing-${Date.now()}`;
    if (!this.messagesContainer) return id;

    const rowEl = document.createElement('div');
    rowEl.id = id;
    rowEl.className = 'ai-chat-row assistant typing';

    const avatarEl = document.createElement('div');
    avatarEl.className = 'ai-chat-avatar assistant';
    avatarEl.innerHTML = `<img src="/ai-mountain-badge.svg" alt="AI" class="ai-chat-avatar-img" />`;

    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'ai-chat-bubble assistant';
    bubbleEl.innerHTML = `
      <div class="ai-chat-typing">
        <span></span><span></span><span></span>
      </div>
    `;

    rowEl.appendChild(avatarEl);
    rowEl.appendChild(bubbleEl);

    this.messagesContainer.appendChild(rowEl);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    return id;
  }

  _removeTypingIndicator(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  async _executeAction(action) {
    const viewer = this.viewer || window.__godsEyeView?.viewer;
    const dataManager = this.dataManager || window.__godsEyeView?.dataManager;
    const styleManager = this.styleManager || window.__godsEyeView?.styleManager;

    if (!action || !action.type) return;

    switch (action.type) {
      case 'FLY_TO': {
        const target = action.target;
        if (target && viewer) {
          this._showToast(`✈️ Navigating to ${target}...`);
          try {
            await searchAndFlyTo(viewer, target);
          } catch (e) {
            console.warn('[AI Chatbot] Navigation error:', e);
          }
        }
        break;
      }

      case 'SET_STYLE': {
        const styleName = this._normalizeStyle(action.target);
        if (styleName && styleManager?.setStyle) {
          styleManager.setStyle(styleName);
          this._showToast(`🎨 Visual style: ${styleName.toUpperCase()}`);
        }
        break;
      }

      case 'TOGGLE_LAYER':
      case 'ENABLE_LAYER':
      case 'DISABLE_LAYER': {
        const layerId = this._normalizeLayer(action.target);
        if (layerId && dataManager) {
          const isEnable = action.type === 'ENABLE_LAYER' ? true : action.type === 'DISABLE_LAYER' ? false : !dataManager.isEnabled(layerId);
          dataManager.setEnabled(layerId, isEnable, { origin: 'voice' });
          this._showToast(`📡 ${isEnable ? 'Enabled' : 'Disabled'} ${layerId} layer`);
        }
        break;
      }

      case 'MOVE_CAMERA': {
        const mode = (action.action || action.target || '').toLowerCase();
        if (mode.includes('orbit')) {
          this._toggleOrbit();
        } else if (mode.includes('zoom_in')) {
          viewer?.camera?.zoomIn?.(100000);
        } else if (mode.includes('zoom_out')) {
          viewer?.camera?.zoomOut?.(100000);
        }
        break;
      }

      case 'CONTROL_SCENE': {
        const target = (action.target || '').toLowerCase();
        this._applySceneLighting(target);
        break;
      }

      case 'RESET_VIEW': {
        this._showToast('🌍 Resetting view to full Earth');
        const homeBtn = document.querySelector('.cesium-home-button') || document.getElementById('cockpit-reset-globe');
        if (homeBtn) {
          homeBtn.click();
        } else if (viewer?.camera) {
          viewer.camera.flyHome(2.0);
        }
        break;
      }

      case 'MEASURE': {
        const measureBtn = document.querySelector('[data-tool="measure"]') || document.getElementById('tool-measure-btn');
        if (measureBtn) {
          measureBtn.click();
          this._showToast('📐 Measurement tool toggled');
        }
        break;
      }

      case 'COCKPIT': {
        const cockpitBtn = document.getElementById('cockpit-entry') || document.getElementById('hud-view-mode-btn');
        if (cockpitBtn) {
          cockpitBtn.click();
          this._showToast('🕹️ Cockpit view toggled');
        }
        break;
      }

      case 'SIMULATE_FLOOD': {
        const target = action.target || action.scenario || 'Assam';
        const floodSim = this.floodSimulation || window.__godsEyeView?.floodSimulation;
        if (floodSim) {
          this._showToast(`🌊 Simulating ${target} flood reconstruction across terrain...`);
          await floodSim.start(target);
        }
        break;
      }

      case 'SIMULATION_CONTROL': {
        const act = (action.action || action.target || '').toLowerCase();
        const floodSim = this.floodSimulation || window.__godsEyeView?.floodSimulation;
        if (floodSim) {
          if (act === 'pause') {
            floodSim.pause();
            this._showToast('⏸️ Flood simulation paused');
          } else if (act === 'play' || act === 'resume') {
            floodSim.resume();
            this._showToast('▶️ Flood simulation resumed');
          } else if (act === 'replay' || act === 'restart') {
            floodSim.replay();
            this._showToast('⏮️ Replaying flood simulation from origin');
          } else if (act === 'speed_up' || act === 'faster') {
            floodSim.speedUp();
            this._showToast(`⏩ Simulation speed: ${floodSim.speedMultiplier}x`);
          } else if (act === 'slow_down' || act === 'slower') {
            floodSim.slowDown();
            this._showToast(`⏪ Simulation speed: ${floodSim.speedMultiplier}x`);
          } else if (action.value) {
            floodSim.setSpeed(parseFloat(action.value));
            this._showToast(`⏩ Simulation speed: ${floodSim.speedMultiplier}x`);
          }
        }
        break;
      }

      case 'SIMULATION_CAMERA': {
        const mode = (action.mode || action.action || action.target || '').toLowerCase();
        const floodSim = this.floodSimulation || window.__godsEyeView?.floodSimulation;
        if (floodSim) {
          if (mode.includes('follow')) {
            floodSim.isCameraFollowing = true;
            floodSim._updateHudControls?.();
            this._showToast('📹 Camera tracking dynamic surge front');
          } else if (mode.includes('start') || mode.includes('source') || mode.includes('origin')) {
            floodSim.flyToStartingPoint();
            this._showToast('📍 Flying to outburst starting point');
          } else if (mode.includes('path') || mode.includes('overview') || mode.includes('corridor') || mode.includes('route')) {
            floodSim.showFloodPath();
            this._showToast('🗺️ Displaying river basin corridor & elevation path');
          } else if (mode.includes('inspect')) {
            floodSim.showHistoricalFootage(action.target || null);
          }
        }
        break;
      }

      case 'SHOW_INTEL': {
        const floodSim = this.floodSimulation || window.__godsEyeView?.floodSimulation;
        if (floodSim) {
          const loc = action.location || action.target || null;
          this._showToast('📰 Displaying geolocated situational intel');
          floodSim.showHistoricalFootage(loc);
        }
        break;
      }

      default:
        break;
    }
  }

  _normalizeLayer(name = '') {
    const clean = String(name).toLowerCase().trim();
    const map = {
      satellite: 'satellites',
      satellites: 'satellites',
      iss: 'satellites',
      flight: 'flights',
      flights: 'flights',
      plane: 'flights',
      planes: 'flights',
      earthquake: 'earthquakes',
      earthquakes: 'earthquakes',
      maritime: 'maritime',
      ships: 'maritime',
      vessels: 'maritime',
      cctv: 'cctv',
      camera: 'cctv',
      cameras: 'cctv',
      radio: 'radio',
      bikeshare: 'bikeshare',
      bike: 'bikeshare',
      traffic: 'traffic',
      weather: 'weather'
    };
    return map[clean] || clean;
  }

  _normalizeStyle(name = '') {
    const clean = String(name).toLowerCase().trim();
    const map = {
      cyberpunk: 'retro',
      retro: 'retro',
      synthwave: 'retro',
      noir: 'noir',
      dark: 'noir',
      surveillance: 'surveillance',
      nightvision: 'surveillance',
      thermal: 'thermal',
      infrared: 'thermal',
      anime: 'anime',
      snow: 'snow',
      arctic: 'snow',
      normal: 'normal',
      satellite: 'normal',
      '3d': 'normal',
      '3dtiles': 'normal'
    };
    return map[clean] || 'normal';
  }

  _applySceneLighting(target) {
    const viewer = this.viewer || window.__godsEyeView?.viewer;
    if (!viewer?.clock) return;

    const JulianDate = window.Cesium?.JulianDate;
    if (!JulianDate) return;

    if (target.includes('sunset') || target.includes('golden')) {
      const date = new Date();
      date.setUTCHours(18, 0, 0, 0);
      viewer.clock.currentTime = JulianDate.fromDate(date);
      this._showToast('🌅 Environmental time set to Sunset');
    } else if (target.includes('sunrise')) {
      const date = new Date();
      date.setUTCHours(6, 0, 0, 0);
      viewer.clock.currentTime = JulianDate.fromDate(date);
      this._showToast('🌄 Environmental time set to Sunrise');
    } else if (target.includes('night')) {
      const date = new Date();
      date.setUTCHours(0, 0, 0, 0);
      viewer.clock.currentTime = JulianDate.fromDate(date);
      this._showToast('🌙 Environmental time set to Night');
    } else if (target.includes('day') || target.includes('noon')) {
      const date = new Date();
      date.setUTCHours(12, 0, 0, 0);
      viewer.clock.currentTime = JulianDate.fromDate(date);
      this._showToast('☀️ Environmental time set to Noon');
    }

    if (target.includes('shadows_on')) {
      viewer.shadows = true;
      this._showToast('Terrain shadows enabled');
    } else if (target.includes('shadows_off')) {
      viewer.shadows = false;
      this._showToast('Terrain shadows disabled');
    }
  }

  _toggleOrbit() {
    const viewer = this.viewer || window.__godsEyeView?.viewer;
    if (!viewer?.camera) return;

    if (this.orbitInterval) {
      clearInterval(this.orbitInterval);
      this.orbitInterval = null;
      this._showToast('⏹️ Orbit stopped');
    } else {
      this._showToast('▶️ Orbit started around current target');
      this.orbitInterval = setInterval(() => {
        viewer.camera.rotateRight(0.003);
      }, 30);
    }
  }

  _speak(text) {
    if (!window.speechSynthesis || !this.ttsEnabled) return;

    window.speechSynthesis.cancel();

    const clean = text
      .replace(/[*#`_~]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .trim();

    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onstart = () => {
      this.isSpeaking = true;
      this._updateUiState();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this._updateUiState();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this._updateUiState();
    };

    window.speechSynthesis.speak(utterance);
    this.currentUtterance = utterance;
  }

  _formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>');
  }

  _showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'gev-ai-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 10);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 3000);
    }, 3000);
  }
}

let globalAiChatbot = null;

export function initAiChatbot(deps = {}) {
  if (!globalAiChatbot) {
    globalAiChatbot = new GevAiChatbot(deps);
    window.__gevAiChatbot = globalAiChatbot;
  }
  return globalAiChatbot;
}

export function getAiChatbot() {
  return globalAiChatbot;
}
