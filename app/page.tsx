import { Hero } from '@/components/Hero'
import { NeuronLab } from '@/components/NeuronLab'
import { TeachingCards } from '@/components/TeachingCards'
import { Footer } from '@/components/Footer'

export default function Page() {
  return (
    <div>
      <Hero />
      <NeuronLab />
      <TeachingCards />
      <Footer />
    </div>
  )
}
