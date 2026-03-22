import { makeUserQueries } from './users.js'
import { makeDocumentQueries } from './documents.js'
import { makeChunkQueries } from './chunks.js'
import { makeSessionQueries } from './sessions.js'
import { makeMessageQueries } from './messages.js'
import { makeSessionDocumentQueries } from './sessionDocuments.js'

export function makeQueries(db) {
  return {
    users: makeUserQueries(db),
    documents: makeDocumentQueries(db),
    chunks: makeChunkQueries(db),
    sessions: makeSessionQueries(db),
    messages: makeMessageQueries(db),
    sessionDocs: makeSessionDocumentQueries(db),
  }
}
