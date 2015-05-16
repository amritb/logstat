module.exports = {
  URL_PLACEHOLDER : '{user_id}',
  URL_FILTERS : [
    'GET /api/users/{user_id}/count_pending_messages',
    'GET /api/users/{user_id}/get_messages',
    'GET /api/users/{user_id}/get_friends_progress',
    'GET /api/users/{user_id}/get_friends_score',
    'POST /api/users/{user_id}',
    'GET /api/users/{user_id}',
  ],
}
