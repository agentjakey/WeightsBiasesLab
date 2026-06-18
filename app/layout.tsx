import type { Metadata } from 'next'
import { Sora, Lora, DM_Mono } from 'next/font/google'
import './globals.css'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
})

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Weights & Biases Lab',
  description:
    'A tiny neuron, three sliders, one moving decision boundary. An interactive companion demo for understanding how weights and biases shape what a neuron learns.',
  keywords: [
    'neural networks',
    'weights and biases',
    'decision boundary',
    'perceptron',
    'sigmoid',
    'machine learning education',
    'interactive demo',
  ],
  authors: [{ name: 'Jacob Ortiz' }],
  openGraph: {
    title: 'Weights & Biases Lab',
    description: 'A tiny neuron. Three sliders. One moving decision boundary.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${lora.variable} ${dmMono.variable}`}>
        <main>{children}</main>
      </body>
    </html>
  )
}
