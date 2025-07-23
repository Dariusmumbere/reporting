// Voice recording functionality
let mediaRecorder;
let audioChunks = [];
let recordingTimer;
let recordingStartTime;

// Initialize voice recording UI
function initVoiceRecording() {
    const voiceRecordBtn = document.getElementById('voice-record-btn');
    const stopRecordingBtn = document.getElementById('stop-recording-btn');
    
    if (voiceRecordBtn && stopRecordingBtn) {
        voiceRecordBtn.addEventListener('click', toggleVoiceRecording);
        stopRecordingBtn.addEventListener('click', stopVoiceRecording);
    }
}

// Toggle voice recording
function toggleVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopVoiceRecording();
    } else {
        startVoiceRecording();
    }
}

// Start voice recording
async function startVoiceRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            }
        });
        
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm',
            audioBitsPerSecond: 128000
        });
        
        // Reset chunks
        audioChunks = [];
        
        // Setup event handlers
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            await sendVoiceMessage(audioBlob);
            
            // Stop all tracks in the stream
            stream.getTracks().forEach(track => track.stop());
        };
        
        // Start recording
        mediaRecorder.start(100); // Collect data every 100ms
        
        // Show recording UI
        document.getElementById('voice-recording-ui').classList.remove('hidden');
        document.getElementById('chat-input-form').classList.add('hidden');
        
        // Start timer
        recordingStartTime = Date.now();
        updateRecordingTimer();
        recordingTimer = setInterval(updateRecordingTimer, 1000);
        
    } catch (error) {
        console.error('Error starting voice recording:', error);
        showAlert('Microphone access denied or not available', 'danger');
    }
}

// Update recording timer
function updateRecordingTimer() {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    document.querySelector('.recording-timer').textContent = `${minutes}:${seconds}`;
    
    // Limit recording to 5 minutes
    if (elapsed >= 300) {
        stopVoiceRecording();
    }
}

// Stop voice recording
function stopVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        clearInterval(recordingTimer);
        document.getElementById('voice-recording-ui').classList.add('hidden');
        document.getElementById('chat-input-form').classList.remove('hidden');
    }
}

// Send voice message to server
async function sendVoiceMessage(audioBlob) {
    if (!activeChatUserId) return;
    
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('audio', audioBlob, `voice-${Date.now()}.webm`);
    formData.append('recipient_id', activeChatUserId);
    
    try {
        // Show loading state
        const voiceBtn = document.getElementById('voice-record-btn');
        const originalHTML = voiceBtn.innerHTML;
        voiceBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        voiceBtn.disabled = true;
        
        // Send to server
        const response = await fetch(`${API_BASE_URL}/chat/upload-voice`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Failed to upload voice message');
        }
        
        const data = await response.json();
        
        // Calculate duration from the actual audio
        const audio = new Audio();
        audio.src = URL.createObjectURL(audioBlob);
        
        audio.onloadedmetadata = () => {
            const duration = Math.round(audio.duration);
            
            // Create a temporary message (optimistic UI)
            const tempMessage = {
                id: Date.now(), // Temporary ID
                sender_id: currentUser.id,
                recipient_id: activeChatUserId,
                content: '[Voice message]',
                audio_url: data.audio_url,
                duration: duration,
                timestamp: new Date().toISOString(),
                status: 'sending'
            };
            
            // Add to chat
            const tempElement = addMessageToChat(tempMessage, 'sent');
            
            // When the audio is ready to play, update the duration
            if (tempElement) {
                const audioElement = tempElement.querySelector('audio');
                if (audioElement) {
                    audioElement.onloadedmetadata = () => {
                        const durationSpan = tempElement.querySelector('.audio-duration');
                        if (durationSpan) {
                            durationSpan.textContent = formatDuration(audioElement.duration);
                        }
                    };
                }
            }
        };
        
    } catch (error) {
        console.error('Error sending voice message:', error);
        showAlert('Failed to send voice message', 'danger');
    } finally {
        // Reset voice button
        const voiceBtn = document.getElementById('voice-record-btn');
        voiceBtn.innerHTML = originalHTML;
        voiceBtn.disabled = false;
    }
}

// Format duration (seconds to MM:SS)
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initVoiceRecording);
