import { getMetadata } from '@/server/lib'
import { MetaResult } from '@/server/types'
import type { NextApiRequest, NextApiResponse } from 'next'
import Cors from 'cors'

type Data = {
  metadata: MetaResult | null
}

const cors = Cors({
  methods: ['GET', 'HEAD'],
  origin: '*',
})

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function,
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result)
      }

      return resolve(result)
    })
  })
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  await runMiddleware(req, res, cors)

  const url = req.query.url as unknown as string
  const metadata = await getMetadata(url)
  return res.status(200).json({ metadata })
}
