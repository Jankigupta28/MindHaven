let apiKey = localStorage.getItem('gemini_api_key') || '';
let moodHistory = JSON.parse(localStorage.getItem('mood_history') || '[]');
let streak = parseInt(localStorage.getItem('mood_streak') || '1');

const crisisKeywords = [
    'suicide', 'kill myself', 'end my life', 'want to die', 'self harm', 
    'cutting myself', 'die', 'no reason to live', 'atmihatya'
];

const offlineResponses = {
    anxiety: [
        "It sounds like you're carrying a lot of anxiety right now. Take a deep, slow breath with me. Remember that feelings are like waves—they peak, but they always pass. Would you like to try a quick 4-7-8 breathing exercise together?",
        "Anxiety can feel so overwhelming, but you are safe right now in this moment. Let's break things down into smaller, manageable pieces. What is one small thing worrying you the most right now?"
    ],
    sadness: [
        "I hear you, and it's completely valid to feel sad or down. You don't have to carry everything alone. I'm here to listen without any judgment. Do you want to vent about what happened?",
        "Thank you for sharing that with me. Sadness can feel heavy, but taking it one moment at a time is enough. Have you had a glass of water or a small rest today?"
    ],
    overwhelmed: [
        "When everything happens at once, it's completely natural to feel overwhelmed. Let's pause for a moment. Try our 5-4-3-2-1 Grounding method in the sidebar—it helps pull your mind back to the present.",
        "Take a step back. You don't have to solve everything today. What is ONE small task we can set aside for tomorrow so you can rest tonight?"
    ],
    default: [
        "Thank you for opening up to me. I am here to support you. How does sharing this make you feel right now?",
        "I'm listening. Taking time to process your thoughts is a great step toward self-care. Tell me more about what's on your mind.",
        "Your feelings are important and valid. Remember to be gentle with yourself today."
    ]
};

window.onload = function() {
    updateApiKeyUI();
    renderMoodHistory();
    document.getElementById('streakCounter').innerText = `🔥 ${streak} Day Streak`;
};

function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.toggle('hidden');
}

function saveApiKey() {
    const keyInput = document.getElementById('apiKeyInput').value.trim();
    if(keyInput) {
        localStorage.setItem('gemini_api_key', keyInput);
        apiKey = keyInput;
        updateApiKeyUI();
        toggleModal('apiModal');
        appendMessage('system', '✅ Gemini API Key saved successfully! Live AI models are now active.');
    }
}

function clearApiKey() {
    localStorage.removeItem('gemini_api_key');
    apiKey = '';
    document.getElementById('apiKeyInput').value = '';
    updateApiKeyUI();
    toggleModal('apiModal');
    appendMessage('system', 'ℹ️ API Key removed. Reverted to offline empathetic AI mode.');
}

function updateApiKeyUI() {
    const label = document.getElementById('apiKeyStatusLabel');
    if (apiKey) {
        label.innerText = 'Gemini AI Active';
        label.classList.add('text-teal-600');
    } else {
        label.innerText = 'Set Gemini API Key';
        label.classList.remove('text-teal-600');
    }
}

function updateStreak() {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('last_mood_date');
    if (lastDate === today) return; // aaj ka streak pehle hi ginn chuka hai

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    streak = (lastDate === yesterday.toDateString()) ? streak + 1 : 1;
    localStorage.setItem('mood_streak', streak);
    localStorage.setItem('last_mood_date', today);
    document.getElementById('streakCounter').innerText = `🔥 ${streak} Day Streak`;
}

function logMood(mood, emoji, colorClass) {
  updateStreak();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const logEntry = { mood, emoji, time: timeStr, timestamp: now.getTime() };
    moodHistory.unshift(logEntry);
    if(moodHistory.length > 7) moodHistory.pop();

    localStorage.setItem('mood_history', JSON.stringify(moodHistory));
    renderMoodHistory();

    appendMessage('user', `I logged my mood as: ${emoji} ${mood}`);
    
    setTimeout(() => {
        let reply = `Thank you for checking in with your mood! Logging **${mood}** ${emoji} helps build self-awareness. `;
        if(mood === 'Anxious' || mood === 'Sad') {
            reply += "It's completely okay to feel this way. Would you like to try a grounding exercise or talk about what's bothering you?";
        } else {
            reply += "I'm glad you took a moment for yourself today. How can I assist you further?";
        }
        appendMessage('ai', reply);
    }, 600);
}

function renderMoodHistory() {
    const container = document.getElementById('moodHistoryList');
    const timeLabel = document.getElementById('lastLoggedTime');

    if(moodHistory.length === 0) {
        container.innerHTML = `<span class="text-xs text-slate-400 italic">Select an emoji above to record mood</span>`;
        return;
    }

    timeLabel.innerText = `Last: ${moodHistory[0].time}`;
    container.innerHTML = moodHistory.map(item => `
        <div class="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs shrink-0">
            <span>${item.emoji}</span>
            <span class="font-medium text-slate-700">${item.mood}</span>
        </div>
    `).join('');
}

function sendQuickPrompt(text) {
    document.getElementById('userMessageInput').value = text;
    handleChatSubmit(new Event('submit'));
}

async function handleChatSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('userMessageInput');
    const message = input.value.trim();

    if(!message) return;
    input.value = '';
    appendMessage('user', message);

    if (checkSafetyCrisis(message)) {
        return;
    }

    showTyping(true);

    let aiReply = '';
    if (apiKey) {
        aiReply = await fetchGeminiResponse(message);
    } else {
        aiReply = generateOfflineResponse(message);
    }

    showTyping(false);
    appendMessage('ai', aiReply);
}

function checkSafetyCrisis(text) {
    const lowerText = text.toLowerCase();
    const isCrisis = crisisKeywords.some(keyword => lowerText.includes(keyword));

    if (isCrisis) {
        setTimeout(() => {
            const crisisNotice = `
                <div class="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 text-rose-800 text-xs space-y-2">
                    <div class="font-bold text-sm flex items-center gap-1.5 text-rose-600">
                        <i class="fa-solid fa-triangle-exclamation"></i> Immediate Support Available
                    </div>
                    <p>It sounds like you are going through a very difficult time. Please know that you don't have to go through this alone, and there is help available right now.</p>
                    <div class="bg-white p-3 rounded-xl border border-rose-200 font-medium space-y-1">
                        <div>📞 <strong>Tele-MANAS (India):</strong> <a href="tel:14416" class="underline text-rose-600 font-bold">14416</a> (Toll-Free 24/7)</div>
                        <div>📞 <strong>KIRAN Helpline:</strong> <a href="tel:18005990019" class="underline text-rose-600 font-bold">1800-599-0019</a></div>
                    </div>
                    <p class="text-[11px] text-rose-600">Please reach out to these trained professionals or a trusted family member immediately.</p>
                </div>
            `;
            appendMessage('ai-crisis', crisisNotice);
            toggleModal('sosModal');
        }, 500);
        return true;
    }
    return false;
}

function generateOfflineResponse(userMsg) {
    const lower = userMsg.toLowerCase();
    let category = 'default';

    if (lower.includes('anxious') || lower.includes('anxiety') || lower.includes('panic') || lower.includes('fear')) {
        category = 'anxiety';
    } else if (lower.includes('sad') || lower.includes('depressed') || lower.includes('crying') || lower.includes('lonely')) {
        category = 'sadness';
    } else if (lower.includes('overwhelmed') || lower.includes('stress') || lower.includes('exam') || lower.includes('work')) {
        category = 'overwhelmed';
    }

    const pool = offlineResponses[category];
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
}

async function fetchGeminiResponse(userPrompt) {
    try {
        const currentApiKey = localStorage.getItem('gemini_api_key') || '';
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userPrompt, apiKey: currentApiKey })
        });
        if (!response.ok) throw new Error('Server error');   // <-- ye ek line add karni hai
        const data = await response.json();
        return data.reply || "I'm here with you.";
    } catch (error) {
        console.error('API Error:', error);
        return generateOfflineResponse(userPrompt);
    }
}

function appendMessage(sender, content) {
    const container = document.getElementById('chatContainer');
    const msgDiv = document.createElement('div');

    if (sender === 'user') {
        msgDiv.className = 'flex items-start justify-end space-x-3 ml-auto max-w-[85%] sm:max-w-[75%]';
        msgDiv.innerHTML = `<div class="bg-teal-500 text-white p-4 rounded-2xl rounded-tr-none text-sm leading-relaxed shadow-sm">${content}</div>`;
    } else if (sender === 'ai') {
        msgDiv.className = 'flex items-start space-x-3 max-w-[85%] sm:max-w-[75%]';
        msgDiv.innerHTML = `
            <div class="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 border border-teal-200">🌿</div>
            <div class="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200/80 shadow-sm text-sm text-slate-700 leading-relaxed">${content}</div>
        `;
    } else if (sender === 'ai-crisis') {
        msgDiv.className = 'flex items-start space-x-3 max-w-[90%]';
        msgDiv.innerHTML = `
            <div class="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 border border-rose-200">🆘</div>
            <div class="flex-1">${content}</div>
        `;
    } else if (sender === 'system') {
        msgDiv.className = 'text-center text-xs text-slate-500 my-2 bg-slate-200/50 py-1.5 px-3 rounded-full w-fit mx-auto';
        msgDiv.innerHTML = content;
    }

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

function showTyping(show) {
    const indicator = document.getElementById('typingIndicator');
    if (show) {
        indicator.classList.remove('hidden');
        document.getElementById('chatContainer').scrollTop = document.getElementById('chatContainer').scrollHeight;
    } else {
        indicator.classList.add('hidden');
    }
}

function openExercise(type) {
    const contentDiv = document.getElementById('exerciseContent');

    if (type === 'breathing') {
        contentDiv.innerHTML = `
            <div class="text-center space-y-4">
                <div class="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center text-xl mx-auto"><i class="fa-solid fa-wind"></i></div>
                <h3 class="font-display font-bold text-lg text-slate-800">4-7-8 Relaxing Breathing</h3>
                <p class="text-xs text-slate-500">Inhale for 4s • Hold for 7s • Exhale for 8s</p>
                <div class="py-8 flex items-center justify-center">
                    <div class="w-32 h-32 rounded-full bg-teal-100/80 border-4 border-teal-500 flex items-center justify-center breath-circle shadow-lg shadow-teal-500/20">
                        <span class="text-xs font-bold text-teal-700">Breathe</span>
                    </div>
                </div>
                <p class="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200">Focus your mind solely on the expansion and relaxation of your chest. Repeat 4 times to calm your nervous system.</p>
            </div>
        `;
    } else if (type === 'grounding') {
        contentDiv.innerHTML = `
            <div class="space-y-4">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg"><i class="fa-solid fa-anchor"></i></div>
                    <div>
                        <h3 class="font-display font-bold text-base text-slate-800">5-4-3-2-1 Grounding Method</h3>
                        <p class="text-xs text-slate-500">Notice your surroundings to anchor your mind</p>
                    </div>
                </div>
                <div class="space-y-2 text-xs text-slate-700">
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-3"><span class="w-6 h-6 rounded-lg bg-indigo-500 text-white font-bold flex items-center justify-center text-xs shrink-0">5</span><span>Acknowledge <strong>5 things</strong> you can see around you.</span></div>
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-3"><span class="w-6 h-6 rounded-lg bg-indigo-500 text-white font-bold flex items-center justify-center text-xs shrink-0">4</span><span>Acknowledge <strong>4 things</strong> you can physically feel.</span></div>
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-3"><span class="w-6 h-6 rounded-lg bg-indigo-500 text-white font-bold flex items-center justify-center text-xs shrink-0">3</span><span>Acknowledge <strong>3 things</strong> you can hear.</span></div>
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-3"><span class="w-6 h-6 rounded-lg bg-indigo-500 text-white font-bold flex items-center justify-center text-xs shrink-0">2</span><span>Acknowledge <strong>2 things</strong> you can smell.</span></div>
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-3"><span class="w-6 h-6 rounded-lg bg-indigo-500 text-white font-bold flex items-center justify-center text-xs shrink-0">1</span><span>Acknowledge <strong>1 thing</strong> you can taste.</span></div>
                </div>
            </div>
        `;
    } else if (type === 'affirmations') {
        const affirmationsList = [
            "I am capable of handling whatever comes my way today.",
            "My feelings are valid, and it is okay to rest when I feel tired.",
            "This stressful moment is temporary, and it will pass.",
            "I give myself permission to take things one step at a time.",
            "I am doing the best I can, and that is more than enough."
        ];
        const randomAffirmation = affirmationsList[Math.floor(Math.random() * affirmationsList.length)];

        contentDiv.innerHTML = `
            <div class="text-center space-y-4">
                <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl mx-auto"><i class="fa-solid fa-sun"></i></div>
                <h3 class="font-display font-bold text-lg text-slate-800">Daily Affirmation</h3>
                <div class="p-6 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 font-display text-base font-semibold italic my-4 shadow-sm">"${randomAffirmation}"</div>
                <button onclick="openExercise('affirmations')" class="text-xs text-amber-700 hover:text-amber-800 font-medium underline">Get Another Affirmation</button>
            </div>
        `;
    }

    toggleModal('exerciseModal');
}