import dotenv from 'dotenv'
import { AtpAgent, BlobRef, AppBskyFeedDefs } from '@atproto/api'
import fs from 'fs/promises'

const run = async () => {
  dotenv.config()

  if (!process.env.FEEDGEN_SERVICE_DID && !process.env.FEEDGEN_HOSTNAME) {
    throw new Error('Please provide a hostname in the .env file')
  }

  const handle = process.env.PUBLISH_HANDLE
  const password = process.env.PUBLISH_PASSWORD
  const service = process.env.PUBLISH_SERVICE || 'https://pds.ts.u-at-proto.work'
  const recordName = process.env.PUBLISH_RECORD_NAME || 'whats-hot'
  const displayName = process.env.PUBLISH_DISPLAY_NAME || "What's Hot"
  const description = process.env.PUBLISH_DESCRIPTION || 'Local feed showing recent posts'
  const avatar = process.env.PUBLISH_AVATAR
  const videoOnly = process.env.PUBLISH_VIDEO_ONLY === 'true'
  const createUser = process.env.PUBLISH_CREATE_USER === 'true'
  const email = process.env.PUBLISH_EMAIL
  const inviteCode = process.env.PUBLISH_INVITE_CODE

  if (!handle) {
    throw new Error('PUBLISH_HANDLE environment variable is required')
  }
  if (!password) {
    throw new Error('PUBLISH_PASSWORD environment variable is required')
  }

  const feedGenDid =
    process.env.FEEDGEN_SERVICE_DID ?? `did:web:${process.env.FEEDGEN_HOSTNAME}`

  console.log(`Publishing feed generator: ${displayName} (${recordName})`)
  console.log(`Feed DID: ${feedGenDid}`)
  console.log(`Service: ${service}`)
  console.log(`Handle: ${handle}`)

  const agent = new AtpAgent({ service })

  if (createUser) {
    console.log('Creating user account...')
    try {
      await agent.createAccount({
        handle,
        password,
        email: email || `${handle.split('.')[0]}@example.com`,
        inviteCode,
      })
      console.log('User account created successfully')
    } catch (error: any) {
      if (error?.message?.includes('already exists') || error?.message?.includes('Handle already taken')) {
        console.log('User account already exists, continuing...')
      } else {
        throw error
      }
    }
  }

  console.log('Logging in...')
  await agent.login({ identifier: handle, password })

  let avatarRef: BlobRef | undefined
  if (avatar) {
    let encoding: string
    if (avatar.endsWith('png')) {
      encoding = 'image/png'
    } else if (avatar.endsWith('jpg') || avatar.endsWith('jpeg')) {
      encoding = 'image/jpeg'
    } else {
      throw new Error('expected png or jpeg')
    }
    const img = await fs.readFile(avatar)
    const blobRes = await agent.api.com.atproto.repo.uploadBlob(img, {
      encoding,
    })
    avatarRef = blobRes.data.blob
  }

  await agent.api.com.atproto.repo.putRecord({
    repo: agent.session?.did ?? '',
    collection: 'app.bsky.feed.generator',
    rkey: recordName,
    record: {
      did: feedGenDid,
      displayName: displayName,
      description: description,
      avatar: avatarRef,
      createdAt: new Date().toISOString(),
      contentMode: videoOnly ? AppBskyFeedDefs.CONTENTMODEVIDEO : AppBskyFeedDefs.CONTENTMODEUNSPECIFIED,
    },
  })

  console.log('All done 🎉')
  console.log(`Feed URI: at://${agent.session?.did}/app.bsky.feed.generator/${recordName}`)
}

run()
