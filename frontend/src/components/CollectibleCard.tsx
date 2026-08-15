import { Sparkles } from 'lucide-react'
import { Montserrat } from 'next/font/google'
import Image from "next/image"
import nftFeatured from "../../public/nftFeatured.jpg"

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export default function CollectibleCard() {
  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={nftFeatured}
          alt="Digital Ticket Collectible"
          fill
          className="object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      </div>

      {/* Purple Glow Effect */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-500/20 blur-[120px] rounded-full" />

      {/* Content */}
      <div className="relative z-10 h-full p-6 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <span className={`${montserrat.className} text-cyan-400 font-medium`}>Featured</span>
        </div>

        <div className="space-y-4">
          <h3 className={`${montserrat.className} text-3xl font-semibold text-white`}>
            Tickets as Digital Collectibles
          </h3>
          <p className="text-white/80 leading-relaxed max-w-md">
            Transform your tickets into unique digital collectibles. Own a piece of the event's history with blockchain-verified authenticity and exclusive perks.
          </p>
        </div>
      </div>
    </div>
  )
}
