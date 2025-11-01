/**
 * Play notification sound using Web Audio API
 */
export function playNotificationSound(type: 'notification' | 'message' = 'notification') {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (type === 'message') {
      // DM sound - higher pitch, two-tone
      playTwoTone(audioContext, 800, 1000, 0.15);
    } else {
      // Notification sound - single tone
      playTone(audioContext, 600, 0.2);
    }
  } catch (error) {
    console.error('Failed to play sound:', error);
  }
}

function playTone(audioContext: AudioContext, frequency: number, duration: number) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

function playTwoTone(audioContext: AudioContext, freq1: number, freq2: number, duration: number) {
  const play = (freq: number, delay: number) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = freq;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + delay + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + duration);
    
    oscillator.start(audioContext.currentTime + delay);
    oscillator.stop(audioContext.currentTime + delay + duration);
  };
  
  play(freq1, 0);
  play(freq2, duration * 0.5);
}


