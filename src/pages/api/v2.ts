import { getMetadata } from '@/server/lib'
import { APIOutput } from '@/server/types'
import type { NextApiRequest, NextApiResponse } from 'next'
import Cors from 'cors'

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

const sendResponse = (res: NextApiResponse<any>, output: APIOutput | null) => {
  if (!output) {
    return res.status(404).json({ metadata: null })
  }

  return res.status(200).json({ metadata: output })
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>,
) {
  await runMiddleware(req, res, cors)

  try {
    let url = req.query.url as unknown as string
    url = url.toLowerCase()
    url = url.indexOf('://') === -1 ? 'http://' + url : url

    const isUrlValid =
      /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi.test(
        url,
      )

    if (!url || !isUrlValid) {
      return res.status(400).json({ error: 'Invalid URL' })
    }

    if (url && isUrlValid) {
      const { hostname } = new URL(url)

      let output: APIOutput

      const metadata = await getMetadata(url)
      if (!metadata) {
        return sendResponse(res, null)
      }
      const { images, og, meta } = metadata!

      let image = og.image ? og.image : images.length > 0 ? images[0].url : null
      const description = og.description
        ? og.description
        : meta.description
        ? meta.description
        : null
      const title = (og.title ? og.title : meta.title) || ''
      const siteName = og.site_name || ''

      output = {
        title,
        description,
        image,
        siteName,
        hostname,
      }

      sendResponse(res, output)
    }
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      error: 'Internal server error.',
    })
  }
}
