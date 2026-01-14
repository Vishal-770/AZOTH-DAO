import React from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import StatusBar from '../components/StatusBar';
import CoreSection from '../components/CoreSection';
import TEESection from '../components/TEESection';
import ProtocolsSection from '../components/ProtocolsSection';
import NetworkMapSection from '../components/NetworkMapSection';
import MarketSection from '../components/MarketSection';
import SigilsSection from '../components/SigilsSection';
import Footer from '../components/Footer';

const App: React.FC = () => {
  return (
    <div className="bg-[#050505] min-h-screen text-[#d4d4d8] font-sans selection:bg-[#00f5ff]/30 overflow-x-hidden">
        {/* Background Ambient Data Stream Lines (Global Overlay) */}
        <div className="fixed inset-0 pointer-events-none opacity-20 z-0 flex justify-around">
            <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-[#00f5ff]/10 to-transparent"></div>
            <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-[#e0f2fe]/10 to-transparent"></div>
            <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-[#00f5ff]/5 to-transparent"></div>
        </div>

      <Navbar />
      <main>
        <HeroSection />
        <StatusBar />
        <CoreSection />
        <TEESection /> 
        <ProtocolsSection />
        <NetworkMapSection />
        <MarketSection />
        <SigilsSection />
      </main>
      <Footer />
    </div>
  );
};

export default App;