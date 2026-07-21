export function playBeautifulNotification() {
  if (typeof window === "undefined") return;

  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Gerçekçi "Ting" / "Bell" sesi tasarımı (Soft ve Profesyonel)
    const playTing = () => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      // Çan/zil hissiyatı için Sine dalgası
      osc.type = "sine";
      
      // Frekans ayarı (Yüksek tonda tatlı bir zil sesi: 1200Hz civarı iyi sonuç verir)
      osc.frequency.setValueAtTime(1244.51, audioCtx.currentTime); // D#6
      
      // Ses zarfı (Envelope) - Çan sesi gibi aniden vurup yavaşça sönümlenir
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 0.01); // Hızlı atak (vurma)
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2); // Uzun ve yumuşak sönümleme (release)
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 1.5);
    };

    playTing();

  } catch (e) {
    console.error("Audio playback failed", e);
  }
}

export function showBeautifulToast(message: string, description?: string) {
  if (typeof window === "undefined") return;

  const containerId = "admin-toast-container";
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    container.className = "fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "transform transition-all duration-500 translate-x-12 opacity-0 flex items-start gap-4 p-4 rounded-xl shadow-2xl bg-[#2a2a2a] text-white border border-[#444] pointer-events-auto min-w-[300px]";
  
  toast.innerHTML = `
    <div class="flex-shrink-0 mt-0.5">
      <div class="w-8 h-8 rounded-full bg-[#EB5E28]/20 flex items-center justify-center">
        <svg class="w-5 h-5 text-[#EB5E28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
    </div>
    <div class="flex-1">
      <h4 class="text-sm font-bold">${message}</h4>
      ${description ? `<p class="text-xs text-gray-400 mt-1">${description}</p>` : ''}
    </div>
  `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.remove("translate-x-12", "opacity-0");
    toast.classList.add("translate-x-0", "opacity-100");
  });

  // Remove after 4 seconds
  setTimeout(() => {
    toast.classList.remove("translate-x-0", "opacity-100");
    toast.classList.add("translate-x-12", "opacity-0");
    setTimeout(() => {
      if (container && toast.parentNode === container) {
        container.removeChild(toast);
      }
    }, 500);
  }, 4000);
}
