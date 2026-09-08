export function getPair(userId: string, otherUserId: string) {
  const [user1Id, user2Id] = userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];
  return { user1Id, user2Id, pairKey: `${user1Id}:${user2Id}` };
}
