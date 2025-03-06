import type { NextApiRequest, NextApiResponse } from 'next'

type Story = {
  id: string
  title: string
  description: string
  category: string
  image: string
  likes: number
  plays: number
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Story[]>
) {
  const stories = [
    {
      id: '1',
      title: 'The Lost Kingdom',
      description: 'Embark on an epic journey through magical realms...',
      category: 'Fantasy',
      image: 'https://picsum.photos/300/200',
      likes: 2500,
      plays: 12000
    },
    {
      id: '2',
      title: 'Space Explorer',
      description: 'Navigate through the unknown depths of space...',
      category: 'Sci-Fi',
      image: 'https://picsum.photos/300/201',
      likes: 1800,
      plays: 8000
    }
  ]

  res.status(200).json(stories)
} 