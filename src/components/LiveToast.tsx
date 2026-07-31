"use client";

import { useState, useEffect } from "react";

const WINNERS = [
  { name: "Thomas Tallinnast", image: "/avatars/winner-01.jpg" },
  { name: "Sarah Tartust", image: "/avatars/winner-02.jpg" },
  { name: "Michael Pärnust", image: "/avatars/winner-03.jpg" },
  { name: "Anna Narvast", image: "/avatars/winner-04.jpg" },
  { name: "David Viljandist", image: "/avatars/winner-05.jpg" },
  { name: "Julia Rakverest", image: "/avatars/winner-06.jpg" },
  { name: "Lukas Kuressaarest", image: "/avatars/winner-07.jpg" },
  { name: "Laura Võrust", image: "/avatars/winner-08.jpg" },
  { name: "Stefan Haapsalust", image: "/avatars/winner-09.jpg" },
  { name: "Lisa Jõhvist", image: "/avatars/winner-10.jpg" },
  { name: "Markus Valgast", image: "/avatars/winner-11.jpg" },
  { name: "Elena Paidest", image: "/avatars/winner-12.jpg" },
  { name: "Florian Keilast", image: "/avatars/winner-13.jpg" },
  { name: "Marie Raplast", image: "/avatars/winner-14.jpg" },
  { name: "Alexander Sillamäelt", image: "/avatars/winner-15.jpg" },
  { name: "Sophie Maardust", image: "/avatars/winner-16.jpg" },
  { name: "Christian Kärdlast", image: "/avatars/winner-17.jpg" },
  { name: "Katarina Elvast", image: "/avatars/winner-18.jpg" },
  { name: "Martin Tõrvast", image: "/avatars/winner-19.jpg" },
  { name: "Nina Otepäält", image: "/avatars/winner-20.jpg" },
  { name: "Andreas Kallastest", image: "/avatars/winner-21.jpg" },
  { name: "Isabella Põlvast", image: "/avatars/winner-22.jpg" },
  { name: "Philipp Tapalt", image: "/avatars/winner-23.jpg" },
  { name: "Victoria Loksalt", image: "/avatars/winner-24.jpg" },
  { name: "Daniel Võhmas", image: "/avatars/winner-25.jpg" },
  { name: "Mia Kundast", image: "/avatars/winner-26.jpg" },
  { name: "Simon Paldiski", image: "/avatars/winner-27.jpg" },
  { name: "Emma Kilingi-Nõmmest", image: "/avatars/winner-28.jpg" },
  { name: "Johannes Põltsamaalt", image: "/avatars/winner-29.jpg" },
  { name: "Hannah Tamsalust", image: "/avatars/winner-30.jpg" }
];

const TIMES = [
  "Just praegu",
  "1 min tagasi",
  "2 min tagasi",
  "3 min tagasi",
  "4 min tagasi",
  "5 min tagasi"
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
      return (randomValue * 100).toLocaleString('et-EE') + "€";
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
              Sai just <span className="font-bold text-[#003b8f]">{currentWinner?.amount}</span> • {currentWinner?.time}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
