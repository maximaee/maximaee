"use client";

import { useState, useEffect } from "react";

const WINNERS = [
  { name: "Thomas aus Wien", image: "https://randomuser.me/api/portraits/men/32.jpg" },
  { name: "Sarah aus Graz", image: "https://randomuser.me/api/portraits/women/44.jpg" },
  { name: "Michael aus Linz", image: "https://randomuser.me/api/portraits/men/46.jpg" },
  { name: "Anna aus Salzburg", image: "https://randomuser.me/api/portraits/women/68.jpg" },
  { name: "David aus Innsbruck", image: "https://randomuser.me/api/portraits/men/22.jpg" },
  { name: "Julia aus Klagenfurt", image: "https://randomuser.me/api/portraits/women/24.jpg" },
  { name: "Lukas aus Villach", image: "https://randomuser.me/api/portraits/men/62.jpg" },
  { name: "Laura aus Wels", image: "https://randomuser.me/api/portraits/women/12.jpg" },
  { name: "Stefan aus St. Pölten", image: "https://randomuser.me/api/portraits/men/84.jpg" },
  { name: "Lisa aus Dornbirn", image: "https://randomuser.me/api/portraits/women/33.jpg" },
  { name: "Markus aus Bregenz", image: "https://randomuser.me/api/portraits/men/11.jpg" },
  { name: "Elena aus Eisenstadt", image: "https://randomuser.me/api/portraits/women/17.jpg" },
  { name: "Florian aus Steyr", image: "https://randomuser.me/api/portraits/men/33.jpg" },
  { name: "Marie aus Feldkirch", image: "https://randomuser.me/api/portraits/women/22.jpg" },
  { name: "Alexander aus Leonding", image: "https://randomuser.me/api/portraits/men/41.jpg" },
  { name: "Sophie aus Klosterneuburg", image: "https://randomuser.me/api/portraits/women/51.jpg" },
  { name: "Christian aus Baden", image: "https://randomuser.me/api/portraits/men/55.jpg" },
  { name: "Katarina aus Krems", image: "https://randomuser.me/api/portraits/women/63.jpg" },
  { name: "Martin aus Traun", image: "https://randomuser.me/api/portraits/men/71.jpg" },
  { name: "Nina aus Leoben", image: "https://randomuser.me/api/portraits/women/77.jpg" },
  { name: "Andreas aus Amstetten", image: "https://randomuser.me/api/portraits/men/81.jpg" },
  { name: "Isabella aus Kapfenberg", image: "https://randomuser.me/api/portraits/women/88.jpg" },
  { name: "Philipp aus Mödling", image: "https://randomuser.me/api/portraits/men/91.jpg" },
  { name: "Victoria aus Lustenau", image: "https://randomuser.me/api/portraits/women/94.jpg" },
  { name: "Daniel aus Hallein", image: "https://randomuser.me/api/portraits/men/15.jpg" },
  { name: "Mia aus Kufstein", image: "https://randomuser.me/api/portraits/women/19.jpg" },
  { name: "Simon aus Traiskirchen", image: "https://randomuser.me/api/portraits/men/25.jpg" },
  { name: "Emma aus Schwechat", image: "https://randomuser.me/api/portraits/women/28.jpg" },
  { name: "Johannes aus Braunau", image: "https://randomuser.me/api/portraits/men/35.jpg" },
  { name: "Hannah aus Stockerau", image: "https://randomuser.me/api/portraits/women/39.jpg" }
];

const TIMES = [
  "Gerade eben",
  "Vor 1 Min.",
  "Vor 2 Min.",
  "Vor 3 Min.",
  "Vor 4 Min.",
  "Vor 5 Min."
];

export default function LiveToast() {
  const [currentWinner, setCurrentWinner] = useState<{ name: string; time: string; amount: string; image: string } | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const generateRandomAmount = () => {
      // 500 ile 6000 arası, 100'ün katları şeklinde rastgele bir miktar
      const min = 5;
      const max = 60;
      const randomValue = Math.floor(Math.random() * (max - min + 1)) + min;
      return (randomValue * 100).toLocaleString('de-DE') + "€";
    };

    const showRandomWinner = () => {
      const randomWinner = WINNERS[Math.floor(Math.random() * WINNERS.length)];
      const randomTime = TIMES[Math.floor(Math.random() * TIMES.length)];
      const randomAmount = generateRandomAmount();

      setCurrentWinner({ name: randomWinner.name, time: randomTime, amount: randomAmount, image: randomWinner.image });

      
      // Bildirim ekranda 1.5 saniye kalır
      setTimeout(() => setCurrentWinner(null), 1500);
      
      // Bir sonraki bildirim tam 4 saniyede bir gelir
      timeoutId = setTimeout(showRandomWinner, 4000);
    };

    // İlk bildirimi 1 saniye sonra göster
    timeoutId = setTimeout(showRandomWinner, 1000);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="!fixed top-[85px] sm:top-[90px] left-0 w-full pointer-events-none z-[10002] flex justify-center sm:justify-start px-4 sm:px-6">
      <div 
        className={`pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] max-w-[340px] w-full ${
          currentWinner ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0"
        }`}
      >
        <div className="glass-card rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 shadow-2xl border-l-4 border-l-[#003b8f] bg-white/95 backdrop-blur-xl">
          <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden shadow-inner border border-gray-100">
            {currentWinner?.image ? (
              <img src={currentWinner.image} alt={currentWinner.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#d8e8fb] flex items-center justify-center">
                <svg className="w-5 h-5 text-[#003b8f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 drop-shadow-sm">{currentWinner?.name}</p>
            <p className="text-xs text-gray-700 font-medium mt-0.5">
              Hat gerade <span className="font-bold text-[#003b8f]">{currentWinner?.amount}</span> erhalten • {currentWinner?.time}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
