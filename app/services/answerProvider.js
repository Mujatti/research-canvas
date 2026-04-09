/**
 * services/answerProvider.js
 *
 * Abstraction for the initial answer flow.
 * Reads config.answerProvider to select which service provides the initial answer.
 *
 * CURRENT: 'conversations' → delegates to conversationsService
 * FUTURE:  'aiAnswers' → would delegate to an aiAnswersService (not implemented)
 *
 * The callback contract is the same regardless of provider:
 *   onMetadata({ conversationId })
 *   onToken(content)
 *   onSources([{ title, url }])
 *   onDone()
 *   onError(err)
 */

import { getConfig } from '../config/app.config';
import { streamConversation } from './conversationsService';

export function getInitialAnswer(query, callbacks) {
  var config = getConfig();

  switch (config.answerProvider) {
    case 'conversations':
      // Current: AI Conversations provides the initial answer
      streamConversation(query, null, callbacks);
      break;

    // Future: uncomment when AI Answers service is implemented
    // case 'aiAnswers':
    //   aiAnswersService.streamAnswer(query, callbacks);
    //   break;

    default:
      console.warn('[answerProvider] Unknown provider: ' + config.answerProvider + ', falling back to conversations');
      streamConversation(query, null, callbacks);
  }
}
