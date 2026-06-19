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
  title: 'Neural Network Foundations Lab',
  description:
    'Interactive neural network foundations lab with three demos: weights and biases, activation functions, and layers and neurons.',
  keywords: [
    'neural networks',
    'weights and biases',
    'activation functions',
    'layers and neurons',
    'decision boundary',
    'sigmoid',
    'machine learning education',
    'interactive demo',
  ],
  authors: [{ name: 'Jacob Ortiz' }],
  openGraph: {
    title: 'Neural Network Foundations Lab',
    description:
      'Three small interactive demos for neurons, nonlinearity, and model capacity.',
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
